// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {SpendGuardModule} from "../src/SpendGuardModule.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract SpendGuardModuleTest is Test {
    SpendGuardModule guard;
    MockERC20 usdc;

    address controller = makeAddr("controller");
    address agent = makeAddr("agent");
    address merchant = makeAddr("merchant");
    address stranger = makeAddr("stranger");

    bytes32 constant PAY_API = keccak256("pay_api");

    function setUp() public {
        usdc = new MockERC20();
        guard = new SpendGuardModule();

        usdc.mint(agent, 1_000e6);
        vm.prank(agent);
        usdc.approve(address(guard), type(uint256).max);

        vm.startPrank(controller);
        guard.setLimits(agent, 100e6, 300e6);
        guard.setAllowedAction(agent, PAY_API, true);
        vm.stopPrank();
    }

    function test_setLimits_firstCallerBecomesController() public {
        (uint256 perTx, uint256 daily,,) = _limits(agent);
        assertEq(perTx, 100e6);
        assertEq(daily, 300e6);
        assertEq(guard.controllerOf(agent), controller);
    }

    function test_setLimits_revertsForNonController() public {
        vm.prank(stranger);
        vm.expectRevert(SpendGuardModule.NotController.selector);
        guard.setLimits(agent, 1, 1);
    }

    function test_executeIfAllowed_happyPath() public {
        vm.prank(agent);
        guard.executeIfAllowed(address(usdc), merchant, 50e6, PAY_API);

        assertEq(usdc.balanceOf(merchant), 50e6);
    }

    function test_executeIfAllowed_revertsForDisallowedAction() public {
        vm.prank(agent);
        vm.expectRevert(SpendGuardModule.ActionNotAllowed.selector);
        guard.executeIfAllowed(address(usdc), merchant, 50e6, keccak256("trade"));
    }

    function test_executeIfAllowed_revertsOverPerTxCap() public {
        vm.prank(agent);
        vm.expectRevert(SpendGuardModule.PerTxCapExceeded.selector);
        guard.executeIfAllowed(address(usdc), merchant, 101e6, PAY_API);
    }

    function test_executeIfAllowed_revertsOverDailyCap() public {
        vm.startPrank(agent);
        guard.executeIfAllowed(address(usdc), merchant, 100e6, PAY_API);
        guard.executeIfAllowed(address(usdc), merchant, 100e6, PAY_API);
        guard.executeIfAllowed(address(usdc), merchant, 100e6, PAY_API);
        vm.expectRevert(SpendGuardModule.DailyCapExceeded.selector);
        guard.executeIfAllowed(address(usdc), merchant, 1e6, PAY_API);
        vm.stopPrank();
    }

    function test_dailyCap_resetsNextDay() public {
        vm.startPrank(agent);
        guard.executeIfAllowed(address(usdc), merchant, 100e6, PAY_API);
        guard.executeIfAllowed(address(usdc), merchant, 100e6, PAY_API);
        guard.executeIfAllowed(address(usdc), merchant, 100e6, PAY_API);
        vm.stopPrank();

        vm.warp(block.timestamp + 1 days + 1);

        vm.prank(agent);
        guard.executeIfAllowed(address(usdc), merchant, 100e6, PAY_API);
        assertEq(usdc.balanceOf(merchant), 400e6);
    }

    function _limits(address a) internal view returns (uint256, uint256, uint256, uint256) {
        SpendGuardModule.Limits memory l = guard.getLimits(a);
        return (l.perTxCap, l.dailyCap, l.spentToday, l.currentDay);
    }
}
