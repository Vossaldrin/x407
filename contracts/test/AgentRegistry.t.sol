// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {AgentRegistry} from "../src/AgentRegistry.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract AgentRegistryTest is Test {
    AgentRegistry registry;
    MockERC20 usdc;

    address owner = makeAddr("owner");
    address agent = makeAddr("agent");
    address agent2 = makeAddr("agent2");

    uint256 constant MIN_STAKE = 50e6;

    function setUp() public {
        usdc = new MockERC20();
        registry = new AgentRegistry(usdc, MIN_STAKE, owner);

        usdc.mint(agent, 1_000e6);
        vm.prank(agent);
        usdc.approve(address(registry), type(uint256).max);

        usdc.mint(agent2, 1_000e6);
        vm.prank(agent2);
        usdc.approve(address(registry), type(uint256).max);
    }

    function test_registerAgent() public {
        vm.prank(agent);
        registry.registerAgent(bytes32("ipfs-hash"), MIN_STAKE);

        AgentRegistry.AgentInfo memory info = registry.getAgent(agent);
        assertTrue(info.active);
        assertEq(info.stake, MIN_STAKE);
        assertEq(info.metadataHash, bytes32("ipfs-hash"));
        assertEq(usdc.balanceOf(address(registry)), MIN_STAKE);
        assertEq(registry.agentCount(), 1);
    }

    function test_registerAgent_revertsBelowMinStake() public {
        vm.prank(agent);
        vm.expectRevert(AgentRegistry.StakeTooLow.selector);
        registry.registerAgent(bytes32("hash"), MIN_STAKE - 1);
    }

    function test_registerAgent_revertsIfAlreadyActive() public {
        vm.startPrank(agent);
        registry.registerAgent(bytes32("hash"), MIN_STAKE);
        vm.expectRevert(AgentRegistry.AlreadyRegistered.selector);
        registry.registerAgent(bytes32("hash"), MIN_STAKE);
        vm.stopPrank();
    }

    function test_deregisterAgent_refundsStake() public {
        vm.startPrank(agent);
        registry.registerAgent(bytes32("hash"), MIN_STAKE);
        registry.deregisterAgent();
        registry.withdraw();
        vm.stopPrank();

        assertEq(usdc.balanceOf(agent), 1_000e6);
        AgentRegistry.AgentInfo memory info = registry.getAgent(agent);
        assertFalse(info.active);
    }

    function test_slashAgent_onlyOwner() public {
        vm.prank(agent);
        registry.registerAgent(bytes32("hash"), MIN_STAKE);

        vm.prank(agent2);
        vm.expectRevert();
        registry.slashAgent(agent);
    }

    function test_slashAgent_movesStakeToTreasury() public {
        vm.prank(agent);
        registry.registerAgent(bytes32("hash"), MIN_STAKE);

        vm.prank(owner);
        registry.slashAgent(agent);

        assertEq(registry.pendingWithdrawals(owner), MIN_STAKE);
        AgentRegistry.AgentInfo memory info = registry.getAgent(agent);
        assertFalse(info.active);
        assertEq(info.stake, 0);

        vm.prank(owner);
        registry.withdraw();
        assertEq(usdc.balanceOf(owner), MIN_STAKE);
    }

    function test_listAgents() public {
        vm.prank(agent);
        registry.registerAgent(bytes32("hash1"), MIN_STAKE);
        vm.prank(agent2);
        registry.registerAgent(bytes32("hash2"), MIN_STAKE);

        address[] memory list = registry.listAgents();
        assertEq(list.length, 2);
        assertEq(list[0], agent);
        assertEq(list[1], agent2);
    }

    function test_setMinStake_onlyOwner() public {
        vm.prank(agent);
        vm.expectRevert();
        registry.setMinStake(100e6);

        vm.prank(owner);
        registry.setMinStake(100e6);
        assertEq(registry.minStake(), 100e6);
    }
}
