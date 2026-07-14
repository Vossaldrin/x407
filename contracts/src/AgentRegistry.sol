// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title AgentRegistry
/// @notice Permissionless, stake-gated agent listings -- replaces a hardcoded template
/// catalogue with on-chain self-registration. An agent stakes USDC to list itself; a
/// misbehaving agent can have its stake slashed by the registry's arbiter (today a single
/// owner address standing in for a future dispute-resolution module/DAO). `getAgent` and
/// `listAgents` let the marketplace frontend read listings directly from chain state.
contract AgentRegistry is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    struct AgentInfo {
        bytes32 metadataHash;
        uint256 stake;
        bool active;
        uint256 registeredAt;
    }

    IERC20 public immutable stakeToken;
    uint256 public minStake;
    address public slashTreasury;

    mapping(address => AgentInfo) public agents;
    address[] public agentList;
    mapping(address => uint256) public pendingWithdrawals;

    event AgentRegistered(address indexed agent, bytes32 metadataHash, uint256 stake);
    event AgentDeregistered(address indexed agent, uint256 refundedStake);
    event AgentSlashed(address indexed agent, uint256 slashedAmount, address indexed treasury);
    event MinStakeUpdated(uint256 minStake);
    event SlashTreasuryUpdated(address treasury);
    event Withdrawn(address indexed account, uint256 amount);

    error StakeTooLow();
    error AlreadyRegistered();
    error NotRegistered();
    error NothingToWithdraw();

    constructor(IERC20 _stakeToken, uint256 _minStake, address initialOwner) Ownable(initialOwner) {
        stakeToken = _stakeToken;
        minStake = _minStake;
        slashTreasury = initialOwner;
    }

    /// @notice Self-list as an agent by staking at least `minStake` USDC. `metadataHash`
    /// points at off-chain metadata (name, capabilities, endpoint) -- e.g. an IPFS CID hash.
    function registerAgent(bytes32 metadataHash, uint256 stakeAmount) external nonReentrant {
        if (stakeAmount < minStake) revert StakeTooLow();
        if (agents[msg.sender].active) revert AlreadyRegistered();

        agents[msg.sender] = AgentInfo({metadataHash: metadataHash, stake: stakeAmount, active: true, registeredAt: block.timestamp});
        agentList.push(msg.sender);

        stakeToken.safeTransferFrom(msg.sender, address(this), stakeAmount);

        emit AgentRegistered(msg.sender, metadataHash, stakeAmount);
    }

    /// @notice Voluntarily deregister and reclaim stake (pull-payment via `withdraw`).
    function deregisterAgent() external nonReentrant {
        AgentInfo storage info = agents[msg.sender];
        if (!info.active) revert NotRegistered();

        uint256 stake = info.stake;
        info.active = false;
        info.stake = 0;
        pendingWithdrawals[msg.sender] += stake;

        emit AgentDeregistered(msg.sender, stake);
    }

    /// @notice Slashes an agent's stake following a resolved dispute. Restricted to the
    /// registry owner today, standing in for a future on-chain dispute/arbitration module.
    function slashAgent(address agent) external onlyOwner nonReentrant {
        AgentInfo storage info = agents[agent];
        if (!info.active) revert NotRegistered();

        uint256 slashed = info.stake;
        info.active = false;
        info.stake = 0;
        pendingWithdrawals[slashTreasury] += slashed;

        emit AgentSlashed(agent, slashed, slashTreasury);
    }

    function withdraw() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        if (amount == 0) revert NothingToWithdraw();

        pendingWithdrawals[msg.sender] = 0;
        stakeToken.safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount);
    }

    function setMinStake(uint256 _minStake) external onlyOwner {
        minStake = _minStake;
        emit MinStakeUpdated(_minStake);
    }

    function setSlashTreasury(address treasury) external onlyOwner {
        slashTreasury = treasury;
        emit SlashTreasuryUpdated(treasury);
    }

    function getAgent(address agent) external view returns (AgentInfo memory) {
        return agents[agent];
    }

    function listAgents() external view returns (address[] memory) {
        return agentList;
    }

    function agentCount() external view returns (uint256) {
        return agentList.length;
    }
}
