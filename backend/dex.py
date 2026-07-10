"""
Real Uniswap V3 swap execution on Base mainnet, scoped to ETH <-> USDC (v1).
================================================================================
Same non-custodial pattern as x402.py: the agent's own wallet signs and
broadcasts both the ERC-20 approve (if needed) and the swap transaction
client-side. This module only quotes and verifies.

Addresses confirmed against official Uniswap docs (developers.uniswap.org)
and cross-checked on Basescan — see the implementation plan for the
verification trail. Do not change these without re-verifying.
"""
import os
from web3 import Web3
from fastapi import HTTPException
import x402

SWAP_ROUTER02 = Web3.to_checksum_address("0x2626664c2603336E57B271c5C0b26F421741e481")
QUOTER_V2 = Web3.to_checksum_address("0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a")
WETH9 = Web3.to_checksum_address("0x4200000000000000000000000000000000000006")
USDC = Web3.to_checksum_address(x402.USDC_BASE)

TOKENS = {"ETH": WETH9, "USDC": USDC}
DECIMALS = {"ETH": 18, "USDC": 6}
FEE_TIERS = [500, 3000]  # 0.05% and 0.3% pools — the deepest on Base for this pair

_w3 = Web3(Web3.HTTPProvider(x402.BASE_RPC_URL))

QUOTER_ABI = [{
    "inputs": [{
        "components": [
            {"internalType": "address", "name": "tokenIn", "type": "address"},
            {"internalType": "address", "name": "tokenOut", "type": "address"},
            {"internalType": "uint256", "name": "amountIn", "type": "uint256"},
            {"internalType": "uint24", "name": "fee", "type": "uint24"},
            {"internalType": "uint160", "name": "sqrtPriceLimitX96", "type": "uint160"},
        ],
        "internalType": "struct IQuoterV2.QuoteExactInputSingleParams",
        "name": "params", "type": "tuple",
    }],
    "name": "quoteExactInputSingle",
    "outputs": [
        {"internalType": "uint256", "name": "amountOut", "type": "uint256"},
        {"internalType": "uint160", "name": "sqrtPriceX96After", "type": "uint160"},
        {"internalType": "uint32", "name": "initializedTicksCrossed", "type": "uint32"},
        {"internalType": "uint256", "name": "gasEstimate", "type": "uint256"},
    ],
    "stateMutability": "nonpayable", "type": "function",
}]

ERC20_ABI = [
    {"constant": True, "inputs": [], "name": "decimals", "outputs": [{"name": "", "type": "uint8"}], "type": "function"},
    {"constant": True, "inputs": [{"name": "owner", "type": "address"}, {"name": "spender", "type": "address"}], "name": "allowance", "outputs": [{"name": "", "type": "uint256"}], "type": "function"},
    {"anonymous": False, "inputs": [
        {"indexed": True, "name": "from", "type": "address"},
        {"indexed": True, "name": "to", "type": "address"},
        {"indexed": False, "name": "value", "type": "uint256"},
    ], "name": "Transfer", "type": "event"},
]

_quoter = _w3.eth.contract(address=QUOTER_V2, abi=QUOTER_ABI)


def get_best_quote(from_token: str, to_token: str, amount_in: float) -> dict:
    """Tries both fee tiers on the Base WETH/USDC pool and returns the better quote.
    Raises HTTPException(400) if neither pool returns a usable quote."""
    if from_token not in TOKENS or to_token not in TOKENS or from_token == to_token:
        raise HTTPException(400, "Unsupported token pair — v1 supports ETH<->USDC only")

    token_in = TOKENS[from_token]
    token_out = TOKENS[to_token]
    amount_in_units = int(amount_in * (10 ** DECIMALS[from_token]))

    best = None
    for fee in FEE_TIERS:
        try:
            amount_out, _, _, gas_estimate = _quoter.functions.quoteExactInputSingle(
                (token_in, token_out, amount_in_units, fee, 0)
            ).call()
        except Exception:
            continue  # pool may not exist at this fee tier
        if best is None or amount_out > best["amountOut"]:
            best = {"fee": fee, "amountOut": amount_out, "gasEstimate": gas_estimate}

    if best is None:
        raise HTTPException(400, "No liquidity found for this pair on Base")

    amount_out_human = best["amountOut"] / (10 ** DECIMALS[to_token])
    return {
        "fromToken": from_token, "toToken": to_token,
        "amountIn": amount_in, "amountOut": amount_out_human,
        "fee": best["fee"], "tokenInAddress": token_in, "tokenOutAddress": token_out,
        "routerAddress": SWAP_ROUTER02,
    }


def verify_swap_onchain(tx_hash: str, expected_from: str, from_token: str, to_token: str, min_amount_in: float) -> dict:
    """Confirms a real swap tx: sent to the router by the agent, moving at least
    min_amount_in of from_token out of the agent's wallet. Mirrors
    x402.verify_onchain_payment's strictness — never trust the client's own claim."""
    try:
        receipt = _w3.eth.get_transaction_receipt(tx_hash)
    except Exception:
        raise HTTPException(402, "transaction_not_found")
    if receipt is None or receipt.status != 1:
        raise HTTPException(402, "transaction_failed_or_pending")

    tx = _w3.eth.get_transaction(tx_hash)
    if tx["to"] is None or Web3.to_checksum_address(tx["to"]) != SWAP_ROUTER02:
        raise HTTPException(402, "transaction_not_sent_to_swap_router")
    if Web3.to_checksum_address(tx["from"]) != Web3.to_checksum_address(expected_from):
        raise HTTPException(402, "transaction_not_from_agent_wallet")

    token_in = TOKENS[from_token]
    erc20 = _w3.eth.contract(address=token_in, abi=ERC20_ABI)
    transfer_topic = _w3.keccak(text="Transfer(address,address,uint256)").hex()

    for log in receipt.logs:
        if log.address.lower() != token_in.lower():
            continue
        if log.topics[0].hex().lower() != transfer_topic.lower():
            continue
        event = erc20.events.Transfer().process_log(log)
        if event["args"]["from"].lower() != expected_from.lower():
            continue
        value = event["args"]["value"] / (10 ** DECIMALS[from_token])
        if value + 1e-9 < min_amount_in:
            raise HTTPException(402, f"underfunded swap: sent {value}, expected {min_amount_in}")
        return {"amountIn": value, "txHash": tx_hash}

    raise HTTPException(402, "no_matching_transfer_from_agent_in_tx")
