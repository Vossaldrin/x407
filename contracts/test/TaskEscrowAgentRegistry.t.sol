// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {TaskEscrow} from "../src/TaskEscrow.sol";
import {AgentRegistry} from "../src/AgentRegistry.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

/// @notice Covers the TaskEscrow -> AgentRegistry reputation hook: outcomes reported on
/// release/refund, the registry's completion-ratio score, and that a misconfigured or
/// untrusted registry can never block an actual fund release.
contract TaskEscrowAgentRegistryTest is Test {
    TaskEscrow escrow;
    AgentRegistry registry;
    MockERC20 usdc;

    address owner = makeAddr("owner");
    address hirer = makeAddr("hirer");
    address agent = makeAddr("agent");

    uint256 constant AMOUNT = 100e6;
    uint256 constant MIN_STAKE = 50e6;

    function setUp() public {
        usdc = new MockERC20();
        registry = new AgentRegistry(usdc, MIN_STAKE, owner);
        escrow = new TaskEscrow(usdc, address(registry));

        vm.prank(owner);
        registry.setTaskEscrow(address(escrow));

        usdc.mint(hirer, 1_000e6);
        vm.prank(hirer);
        usdc.approve(address(escrow), type(uint256).max);
    }

    function _createTask() internal returns (uint256 taskId) {
        vm.prank(hirer);
        taskId = escrow.createTask(agent, AMOUNT, block.timestamp + 1 days);
    }

    function test_releaseTask_recordsCompletionInRegistry() public {
        uint256 taskId = _createTask();
        vm.prank(hirer);
        escrow.releaseTask(taskId);

        (uint256 completed, uint256 refunded, uint256 volume, uint256 scoreBps) = registry.getTrustScore(agent);
        assertEq(completed, 1);
        assertEq(refunded, 0);
        assertEq(volume, AMOUNT);
        assertEq(scoreBps, 10_000);
    }

    function test_refundTask_recordsRefundInRegistry() public {
        uint256 taskId = _createTask();
        vm.warp(block.timestamp + 2 days);
        vm.prank(hirer);
        escrow.refundTask(taskId);

        (uint256 completed, uint256 refunded, uint256 volume, uint256 scoreBps) = registry.getTrustScore(agent);
        assertEq(completed, 0);
        assertEq(refunded, 1);
        assertEq(volume, AMOUNT);
        assertEq(scoreBps, 0);
    }

    function test_getTrustScore_mixedOutcomesGiveRatio() public {
        uint256 t1 = _createTask();
        vm.prank(hirer);
        escrow.releaseTask(t1);

        uint256 t2 = _createTask();
        vm.warp(block.timestamp + 2 days);
        vm.prank(hirer);
        escrow.refundTask(t2);

        (uint256 completed, uint256 refunded,, uint256 scoreBps) = registry.getTrustScore(agent);
        assertEq(completed, 1);
        assertEq(refunded, 1);
        assertEq(scoreBps, 5_000);
    }

    function test_getTrustScore_noHistoryIsZeroNotReverted() public {
        (uint256 completed, uint256 refunded, uint256 volume, uint256 scoreBps) = registry.getTrustScore(agent);
        assertEq(completed, 0);
        assertEq(refunded, 0);
        assertEq(volume, 0);
        assertEq(scoreBps, 0);
    }

    function test_recordOutcome_revertsIfNotCalledByTaskEscrow() public {
        vm.expectRevert(AgentRegistry.NotTaskEscrow.selector);
        registry.recordOutcome(agent, true, AMOUNT);
    }

    function test_releaseTask_succeedsEvenIfRegistryDoesNotTrustThisEscrow() public {
        // A second escrow the registry was never told to trust.
        TaskEscrow untrustedEscrow = new TaskEscrow(usdc, address(registry));
        usdc.mint(hirer, AMOUNT);
        vm.prank(hirer);
        usdc.approve(address(untrustedEscrow), type(uint256).max);

        vm.prank(hirer);
        uint256 taskId = untrustedEscrow.createTask(agent, AMOUNT, block.timestamp + 1 days);

        vm.expectEmit(true, true, false, true);
        emit TaskEscrow.OutcomeReportFailed(taskId, agent, true);

        vm.prank(hirer);
        untrustedEscrow.releaseTask(taskId);

        // Funds still moved despite the registry rejecting the report.
        assertEq(untrustedEscrow.pendingWithdrawals(agent), AMOUNT);
        (uint256 completed,,,) = registry.getTrustScore(agent);
        assertEq(completed, 0);
    }

    function test_releaseTask_worksWithNoRegistryConfigured() public {
        TaskEscrow bareEscrow = new TaskEscrow(usdc, address(0));
        usdc.mint(hirer, AMOUNT);
        vm.prank(hirer);
        usdc.approve(address(bareEscrow), type(uint256).max);

        vm.prank(hirer);
        uint256 taskId = bareEscrow.createTask(agent, AMOUNT, block.timestamp + 1 days);

        vm.prank(hirer);
        bareEscrow.releaseTask(taskId);

        assertEq(bareEscrow.pendingWithdrawals(agent), AMOUNT);
    }
}
