// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {TaskEscrow} from "../src/TaskEscrow.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract TaskEscrowTest is Test {
    TaskEscrow escrow;
    MockERC20 usdc;

    address hirer = makeAddr("hirer");
    address agent = makeAddr("agent");
    address stranger = makeAddr("stranger");

    uint256 constant AMOUNT = 100e6; // 100 USDC (6 decimals)

    function setUp() public {
        usdc = new MockERC20();
        escrow = new TaskEscrow(usdc);

        usdc.mint(hirer, 1_000e6);
        vm.prank(hirer);
        usdc.approve(address(escrow), type(uint256).max);
    }

    function _createTask() internal returns (uint256 taskId) {
        vm.prank(hirer);
        taskId = escrow.createTask(agent, AMOUNT, block.timestamp + 1 days);
    }

    function test_createTask_pullsFunds() public {
        uint256 before = usdc.balanceOf(hirer);
        uint256 taskId = _createTask();

        assertEq(usdc.balanceOf(hirer), before - AMOUNT);
        assertEq(usdc.balanceOf(address(escrow)), AMOUNT);

        TaskEscrow.Task memory task = escrow.getTask(taskId);
        assertEq(task.hirer, hirer);
        assertEq(task.agent, agent);
        assertEq(task.amount, AMOUNT);
        assertEq(uint8(task.status), uint8(TaskEscrow.Status.Active));
    }

    function test_createTask_revertsOnZeroAmount() public {
        vm.prank(hirer);
        vm.expectRevert(TaskEscrow.InvalidAmount.selector);
        escrow.createTask(agent, 0, block.timestamp + 1 days);
    }

    function test_createTask_revertsOnPastDeadline() public {
        vm.prank(hirer);
        vm.expectRevert(TaskEscrow.InvalidDeadline.selector);
        escrow.createTask(agent, AMOUNT, block.timestamp);
    }

    function test_hirerCanReleaseBeforeDeadline() public {
        uint256 taskId = _createTask();

        vm.prank(hirer);
        escrow.releaseTask(taskId);

        assertEq(escrow.pendingWithdrawals(agent), AMOUNT);

        vm.prank(agent);
        escrow.withdraw();
        assertEq(usdc.balanceOf(agent), AMOUNT);
    }

    function test_strangerCannotReleaseBeforeDeadline() public {
        uint256 taskId = _createTask();

        vm.prank(stranger);
        vm.expectRevert(TaskEscrow.NotAuthorized.selector);
        escrow.releaseTask(taskId);
    }

    function test_anyoneCanReleaseAfterDeadline() public {
        uint256 taskId = _createTask();
        vm.warp(block.timestamp + 2 days);

        vm.prank(stranger);
        escrow.releaseTask(taskId);

        assertEq(escrow.pendingWithdrawals(agent), AMOUNT);
    }

    function test_hirerCanRefundAfterDeadlineIfNotReleased() public {
        uint256 taskId = _createTask();
        vm.warp(block.timestamp + 2 days);

        vm.prank(hirer);
        escrow.refundTask(taskId);

        assertEq(escrow.pendingWithdrawals(hirer), AMOUNT);

        vm.prank(hirer);
        escrow.withdraw();
        assertEq(usdc.balanceOf(hirer), 1_000e6);
    }

    function test_refundRevertsBeforeDeadline() public {
        uint256 taskId = _createTask();

        vm.prank(hirer);
        vm.expectRevert(TaskEscrow.DeadlineNotReached.selector);
        escrow.refundTask(taskId);
    }

    function test_strangerCannotRefund() public {
        uint256 taskId = _createTask();
        vm.warp(block.timestamp + 2 days);

        vm.prank(stranger);
        vm.expectRevert(TaskEscrow.NotAuthorized.selector);
        escrow.refundTask(taskId);
    }

    function test_cannotReleaseTwice() public {
        uint256 taskId = _createTask();

        vm.prank(hirer);
        escrow.releaseTask(taskId);

        vm.prank(hirer);
        vm.expectRevert(TaskEscrow.TaskNotActive.selector);
        escrow.releaseTask(taskId);
    }

    function test_cannotRefundAfterRelease() public {
        uint256 taskId = _createTask();

        vm.prank(hirer);
        escrow.releaseTask(taskId);

        vm.warp(block.timestamp + 2 days);
        vm.prank(hirer);
        vm.expectRevert(TaskEscrow.TaskNotActive.selector);
        escrow.refundTask(taskId);
    }

    function test_withdrawRevertsWithNothingPending() public {
        vm.prank(agent);
        vm.expectRevert(TaskEscrow.NothingToWithdraw.selector);
        escrow.withdraw();
    }
}
