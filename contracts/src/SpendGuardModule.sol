// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title SpendGuardModule
/// @notice On-chain enforcement of the per-tx / per-day spend caps and allowed-action lists
/// that today only exist server-side (backend/x407.py's check_limits). This is a standalone
/// guard contract rather than a full ERC-4337 validator module -- our agent wallets are plain
/// EOAs generated via eth_account, not ERC-4337 smart accounts, so a real validator module
/// has nothing to attach to yet. An agent routes a transfer through `executeIfAllowed`
/// (having approved this contract to pull the token), which enforces the caps/allowlist
/// on-chain before releasing funds -- the same guarantee an ERC-4337 module would provide,
/// without requiring agents to migrate off EOAs first.
contract SpendGuardModule is ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Limits {
        uint256 perTxCap;
        uint256 dailyCap;
        uint256 spentToday;
        uint256 currentDay;
    }

    /// @dev The controller is whoever first calls setLimits for an agent -- mirrors the
    /// existing off-chain model where the hirer configures the agent's guardrails.
    mapping(address => address) public controllerOf;
    mapping(address => Limits) public limitsOf;
    mapping(address => mapping(bytes32 => bool)) public allowedActions;

    event LimitsSet(address indexed agent, address indexed controller, uint256 perTxCap, uint256 dailyCap);
    event ActionAllowedSet(address indexed agent, bytes32 indexed actionId, bool allowed);
    event Executed(address indexed agent, address indexed token, address indexed to, uint256 amount, bytes32 actionId);

    error NotController();
    error ActionNotAllowed();
    error PerTxCapExceeded();
    error DailyCapExceeded();

    modifier onlyController(address agent) {
        address controller = controllerOf[agent];
        if (controller == address(0)) {
            controllerOf[agent] = msg.sender;
        } else if (controller != msg.sender) {
            revert NotController();
        }
        _;
    }

    /// @notice Sets (or updates) an agent's per-transaction and daily spend caps. The first
    /// caller for a given agent becomes its controller; only that address may update it after.
    function setLimits(address agent, uint256 perTxCap, uint256 dailyCap) external onlyController(agent) {
        Limits storage l = limitsOf[agent];
        l.perTxCap = perTxCap;
        l.dailyCap = dailyCap;

        emit LimitsSet(agent, msg.sender, perTxCap, dailyCap);
    }

    /// @notice Allow/disallow a named action (e.g. keccak256("pay_api")) for an agent.
    function setAllowedAction(address agent, bytes32 actionId, bool allowed) external onlyController(agent) {
        allowedActions[agent][actionId] = allowed;
        emit ActionAllowedSet(agent, actionId, allowed);
    }

    /// @notice Agent-initiated transfer, gated by its on-chain caps and allowlist. The agent
    /// must have approved this contract to pull `token` beforehand.
    function executeIfAllowed(address token, address to, uint256 amount, bytes32 actionId) external nonReentrant {
        address agent = msg.sender;
        if (!allowedActions[agent][actionId]) revert ActionNotAllowed();

        Limits storage l = limitsOf[agent];
        if (amount > l.perTxCap) revert PerTxCapExceeded();

        uint256 today = block.timestamp / 1 days;
        if (today != l.currentDay) {
            l.currentDay = today;
            l.spentToday = 0;
        }
        if (l.spentToday + amount > l.dailyCap) revert DailyCapExceeded();

        l.spentToday += amount;

        IERC20(token).safeTransferFrom(agent, to, amount);

        emit Executed(agent, token, to, amount, actionId);
    }

    function getLimits(address agent) external view returns (Limits memory) {
        return limitsOf[agent];
    }
}
