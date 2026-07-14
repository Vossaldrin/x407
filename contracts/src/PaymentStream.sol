// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title PaymentStream
/// @notice Sablier-style linear vesting streams -- extends the app's per-action x402
/// settlement into continuous pay-per-second micropayments. A sender deposits `amount` of
/// USDC up front; it vests linearly to the recipient over `duration` seconds and can be
/// pulled at any time via `withdrawFromStream`.
contract PaymentStream is ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Stream {
        address sender;
        address recipient;
        uint256 totalAmount;
        uint256 startTime;
        uint256 duration;
        uint256 withdrawn;
        bool canceled;
    }

    IERC20 public immutable token;

    uint256 public nextStreamId;
    mapping(uint256 => Stream) public streams;
    mapping(address => uint256) public pendingWithdrawals;

    event StreamCreated(uint256 indexed streamId, address indexed sender, address indexed recipient, uint256 amount, uint256 duration);
    event StreamWithdrawn(uint256 indexed streamId, address indexed recipient, uint256 amount);
    event StreamCanceled(uint256 indexed streamId, uint256 recipientAmount, uint256 senderRefund);
    event Withdrawn(address indexed account, uint256 amount);

    error InvalidAmount();
    error InvalidDuration();
    error NotSender();
    error StreamInactive();
    error NothingToWithdraw();

    constructor(IERC20 _token) {
        token = _token;
    }

    /// @notice Deposits `amount` of USDC from the caller, streaming linearly to `recipient`
    /// over `duration` seconds starting now.
    function createStream(address recipient, uint256 amount, uint256 duration) external nonReentrant returns (uint256 streamId) {
        if (amount == 0) revert InvalidAmount();
        if (duration == 0) revert InvalidDuration();

        streamId = nextStreamId++;
        streams[streamId] = Stream({
            sender: msg.sender,
            recipient: recipient,
            totalAmount: amount,
            startTime: block.timestamp,
            duration: duration,
            withdrawn: 0,
            canceled: false
        });

        token.safeTransferFrom(msg.sender, address(this), amount);

        emit StreamCreated(streamId, msg.sender, recipient, amount, duration);
    }

    /// @notice Amount vested so far (whether or not it's been withdrawn yet).
    function vestedAmount(uint256 streamId) public view returns (uint256) {
        Stream storage s = streams[streamId];
        if (s.sender == address(0)) return 0;

        uint256 elapsed = block.timestamp - s.startTime;
        if (elapsed >= s.duration) return s.totalAmount;
        return (s.totalAmount * elapsed) / s.duration;
    }

    /// @notice Recipient pulls whatever has vested and not yet been withdrawn.
    function withdrawFromStream(uint256 streamId) external nonReentrant {
        Stream storage s = streams[streamId];
        if (s.sender == address(0) || s.canceled) revert StreamInactive();

        uint256 available = vestedAmount(streamId) - s.withdrawn;
        if (available == 0) revert NothingToWithdraw();

        s.withdrawn += available;
        token.safeTransfer(s.recipient, available);

        emit StreamWithdrawn(streamId, s.recipient, available);
    }

    /// @notice Sender cancels a stream: vested-so-far is credited to the recipient, the
    /// unvested remainder is credited back to the sender. Both pulled via `withdraw`.
    function cancelStream(uint256 streamId) external nonReentrant {
        Stream storage s = streams[streamId];
        if (s.sender == address(0) || s.canceled) revert StreamInactive();
        if (msg.sender != s.sender) revert NotSender();

        uint256 vested = vestedAmount(streamId);
        uint256 recipientAmount = vested - s.withdrawn;
        uint256 senderRefund = s.totalAmount - vested;

        s.canceled = true;
        s.withdrawn = vested;

        if (recipientAmount > 0) pendingWithdrawals[s.recipient] += recipientAmount;
        if (senderRefund > 0) pendingWithdrawals[s.sender] += senderRefund;

        emit StreamCanceled(streamId, recipientAmount, senderRefund);
    }

    /// @notice Pulls any balance credited by `cancelStream`.
    function withdraw() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        if (amount == 0) revert NothingToWithdraw();

        pendingWithdrawals[msg.sender] = 0;
        token.safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount);
    }

    function getStream(uint256 streamId) external view returns (Stream memory) {
        return streams[streamId];
    }
}
