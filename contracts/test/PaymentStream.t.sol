// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {PaymentStream} from "../src/PaymentStream.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract PaymentStreamTest is Test {
    PaymentStream stream;
    MockERC20 usdc;

    address sender = makeAddr("sender");
    address recipient = makeAddr("recipient");

    uint256 constant AMOUNT = 1_000e6;
    uint256 constant DURATION = 1000; // seconds

    function setUp() public {
        usdc = new MockERC20();
        stream = new PaymentStream(usdc);

        usdc.mint(sender, 10_000e6);
        vm.prank(sender);
        usdc.approve(address(stream), type(uint256).max);
    }

    function _createStream() internal returns (uint256 streamId) {
        vm.prank(sender);
        streamId = stream.createStream(recipient, AMOUNT, DURATION);
    }

    function test_createStream_pullsFunds() public {
        uint256 before = usdc.balanceOf(sender);
        _createStream();
        assertEq(usdc.balanceOf(sender), before - AMOUNT);
        assertEq(usdc.balanceOf(address(stream)), AMOUNT);
    }

    function test_vestedAmount_linear() public {
        uint256 streamId = _createStream();

        assertEq(stream.vestedAmount(streamId), 0);

        vm.warp(block.timestamp + DURATION / 2);
        assertApproxEqAbs(stream.vestedAmount(streamId), AMOUNT / 2, 1);

        vm.warp(block.timestamp + DURATION);
        assertEq(stream.vestedAmount(streamId), AMOUNT);
    }

    function test_withdrawFromStream_partial() public {
        uint256 streamId = _createStream();
        vm.warp(block.timestamp + DURATION / 4);

        uint256 expected = stream.vestedAmount(streamId);
        vm.prank(recipient);
        stream.withdrawFromStream(streamId);

        assertEq(usdc.balanceOf(recipient), expected);
    }

    function test_withdrawFromStream_revertsWithNothingVestedYet() public {
        uint256 streamId = _createStream();
        vm.prank(recipient);
        vm.expectRevert(PaymentStream.NothingToWithdraw.selector);
        stream.withdrawFromStream(streamId);
    }

    function test_withdrawFromStream_fullAfterDuration() public {
        uint256 streamId = _createStream();
        vm.warp(block.timestamp + DURATION + 1);

        vm.prank(recipient);
        stream.withdrawFromStream(streamId);
        assertEq(usdc.balanceOf(recipient), AMOUNT);
    }

    function test_cancelStream_splitsVestedAndRefund() public {
        uint256 streamId = _createStream();
        vm.warp(block.timestamp + DURATION / 2);

        uint256 vested = stream.vestedAmount(streamId);
        vm.prank(sender);
        stream.cancelStream(streamId);

        assertEq(stream.pendingWithdrawals(recipient), vested);
        assertEq(stream.pendingWithdrawals(sender), AMOUNT - vested);

        vm.prank(recipient);
        stream.withdraw();
        vm.prank(sender);
        stream.withdraw();

        assertEq(usdc.balanceOf(recipient), vested);
        assertEq(usdc.balanceOf(sender), 10_000e6 - AMOUNT + (AMOUNT - vested));
    }

    function test_cancelStream_onlySender() public {
        uint256 streamId = _createStream();
        vm.prank(recipient);
        vm.expectRevert(PaymentStream.NotSender.selector);
        stream.cancelStream(streamId);
    }

    function test_cannotWithdrawFromCanceledStream() public {
        uint256 streamId = _createStream();
        vm.prank(sender);
        stream.cancelStream(streamId);

        vm.prank(recipient);
        vm.expectRevert(PaymentStream.StreamInactive.selector);
        stream.withdrawFromStream(streamId);
    }
}
