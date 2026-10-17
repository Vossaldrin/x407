// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IAgentRegistry {
    function recordOutcome(address agent, bool success, uint256 amount) external;
}

/// @title TaskEscrow
/// @notice Conditional USDC payouts for multi-step agent tasks. A hirer deposits funds for a
/// task with a deadline; funds are only released to the agent on explicit confirmation or
/// once the deadline passes (permissionless auto-release). Uses a pull-payment pattern --
/// `releaseTask`/`refundTask` only credit an internal balance, `withdraw` moves the tokens --
/// so a misbehaving recipient can never block settlement of other tasks.
///
/// Deadline policy (documented explicitly since the spec allows either outcome after expiry):
///   - Before the deadline: only the hirer may call `releaseTask` (explicit approval).
///     `refundTask` is not available yet -- the agent is guaranteed the escrow holds until expiry.
///   - At/after the deadline: `releaseTask` becomes callable by anyone (auto-release --
///     protects the agent from a hirer who simply never confirms). `refundTask` remains
///     hirer-only, and only after the deadline, letting the hirer reclaim funds if they act
///     before anyone triggers the auto-release. Whichever is called first wins; the task's
///     status makes the outcome final and reentrancy/double-spend safe either way.
contract TaskEscrow is ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum Status {
        Active,
        Released,
        Refunded
    }

    struct Task {
        address hirer;
        address agent;
        uint256 amount;
        uint256 deadline;
        Status status;
    }

    IERC20 public immutable usdc;
    /// @notice Optional AgentRegistry to report outcomes to (address(0) disables reporting).
    /// Set once at deploy: reputation bookkeeping isn't important enough to justify a mutable
    /// admin surface on the escrow that holds the funds.
    IAgentRegistry public immutable agentRegistry;

    uint256 public nextTaskId;
    mapping(uint256 => Task) public tasks;
    mapping(address => uint256) public pendingWithdrawals;

    event TaskCreated(uint256 indexed taskId, address indexed hirer, address indexed agent, uint256 amount, uint256 deadline);
    event TaskReleased(uint256 indexed taskId, address indexed agent, uint256 amount);
    event TaskRefunded(uint256 indexed taskId, address indexed hirer, uint256 amount);
    event Withdrawn(address indexed account, uint256 amount);
    event OutcomeReportFailed(uint256 indexed taskId, address indexed agent, bool success);

    error InvalidAmount();
    error InvalidDeadline();
    error TaskNotActive();
    error NotAuthorized();
    error DeadlineNotReached();
    error NothingToWithdraw();

    constructor(IERC20 _usdc, address _agentRegistry) {
        usdc = _usdc;
        agentRegistry = IAgentRegistry(_agentRegistry);
    }

    /// @notice Best-effort report to the registry -- never lets a reputation-tracking failure
    /// (registry not configured to trust this escrow, paused, buggy, etc.) block a real fund
    /// release or refund. Swallows the revert and emits it as an event instead.
    function _reportOutcome(uint256 taskId, address agent, bool success, uint256 amount) private {
        if (address(agentRegistry) == address(0)) return;
        try agentRegistry.recordOutcome(agent, success, amount) {} catch {
            emit OutcomeReportFailed(taskId, agent, success);
        }
    }

    /// @notice Hirer deposits `amount` USDC to fund a task for `agent`, due by `deadline`.
    function createTask(address agent, uint256 amount, uint256 deadline) external nonReentrant returns (uint256 taskId) {
        if (amount == 0) revert InvalidAmount();
        if (deadline <= block.timestamp) revert InvalidDeadline();

        taskId = nextTaskId++;
        tasks[taskId] = Task({hirer: msg.sender, agent: agent, amount: amount, deadline: deadline, status: Status.Active});

        usdc.safeTransferFrom(msg.sender, address(this), amount);

        emit TaskCreated(taskId, msg.sender, agent, amount, deadline);
    }

    /// @notice Releases a task's funds to its agent. Callable by the hirer at any time, or by
    /// anyone once the deadline has passed (auto-release).
    function releaseTask(uint256 taskId) external nonReentrant {
        Task storage task = tasks[taskId];
        if (task.status != Status.Active) revert TaskNotActive();
        if (msg.sender != task.hirer && block.timestamp < task.deadline) revert NotAuthorized();

        task.status = Status.Released;
        pendingWithdrawals[task.agent] += task.amount;

        emit TaskReleased(taskId, task.agent, task.amount);
        _reportOutcome(taskId, task.agent, true, task.amount);
    }

    /// @notice Refunds a task's funds to its hirer. Only the hirer may call this, and only
    /// after the deadline has passed without the task having been released already.
    function refundTask(uint256 taskId) external nonReentrant {
        Task storage task = tasks[taskId];
        if (task.status != Status.Active) revert TaskNotActive();
        if (msg.sender != task.hirer) revert NotAuthorized();
        if (block.timestamp < task.deadline) revert DeadlineNotReached();

        task.status = Status.Refunded;
        pendingWithdrawals[task.hirer] += task.amount;

        emit TaskRefunded(taskId, task.hirer, task.amount);
        _reportOutcome(taskId, task.agent, false, task.amount);
    }

    /// @notice Pulls the caller's accumulated released/refunded balance.
    function withdraw() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        if (amount == 0) revert NothingToWithdraw();

        pendingWithdrawals[msg.sender] = 0;
        usdc.safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount);
    }

    function getTask(uint256 taskId) external view returns (Task memory) {
        return tasks[taskId];
    }
}
