// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {TaskEscrow} from "../src/TaskEscrow.sol";
import {AgentRegistry} from "../src/AgentRegistry.sol";
import {PaymentStream} from "../src/PaymentStream.sol";
import {SpendGuardModule} from "../src/SpendGuardModule.sol";

/// @notice Deploys all four x407 contracts to Base Sepolia (or any configured network).
/// Usage:
///   forge script script/Deploy.s.sol:Deploy --rpc-url base_sepolia --broadcast --verify -vvvv
/// Required env vars: DEPLOYER_PRIVATE_KEY, BASE_SEPOLIA_RPC_URL, BASESCAN_API_KEY (for --verify).
/// Optional: USDC_ADDRESS (defaults to Circle's official Base Sepolia testnet USDC),
///           AGENT_REGISTRY_MIN_STAKE (defaults to 10 USDC, 6 decimals).
contract Deploy is Script {
    // Circle's official testnet USDC on Base Sepolia (chain id 84532).
    address constant DEFAULT_SEPOLIA_USDC = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;

    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        address usdcAddress = vm.envOr("USDC_ADDRESS", DEFAULT_SEPOLIA_USDC);
        uint256 minStake = vm.envOr("AGENT_REGISTRY_MIN_STAKE", uint256(10e6));

        console.log("Deployer:", deployer);
        console.log("USDC:", usdcAddress);

        vm.startBroadcast(deployerKey);

        TaskEscrow taskEscrow = new TaskEscrow(IERC20(usdcAddress));
        AgentRegistry agentRegistry = new AgentRegistry(IERC20(usdcAddress), minStake, deployer);
        PaymentStream paymentStream = new PaymentStream(IERC20(usdcAddress));
        SpendGuardModule spendGuard = new SpendGuardModule();

        vm.stopBroadcast();

        console.log("TaskEscrow:      ", address(taskEscrow));
        console.log("AgentRegistry:   ", address(agentRegistry));
        console.log("PaymentStream:   ", address(paymentStream));
        console.log("SpendGuardModule:", address(spendGuard));
    }
}
