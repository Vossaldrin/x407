"""
x402-inspired payment settlement for Arnold agents.
=====================================================
Agents never hand their private key to this backend. The browser signs and
broadcasts a plain ERC-20 transfer directly with the agent's own key; this
module only *verifies* the resulting on-chain transaction and enforces the
agent's spending rules. See /Users/alvinaokeowo/.claude/plans for the
rationale (no facilitator, no server-held custody).
"""
import os
from web3 import Web3
from fastapi import HTTPException

# Native USDC on Base mainnet (Circle-issued FiatTokenProxy), 6 decimals.
USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
USDC_DECIMALS = 6

BASE_RPC_URL = os.getenv("BASE_RPC_URL", "https://mainnet.base.org")
DEMO_MERCHANT_ADDRESS = os.getenv("DEMO_MERCHANT_ADDRESS", "")
SELF_API_URL = os.getenv("SELF_API_URL", "http://localhost:8000")

ERC20_ABI = [
    {"constant": True, "inputs": [], "name": "decimals", "outputs": [{"name": "", "type": "uint8"}], "type": "function"},
    {"constant": True, "inputs": [{"name": "owner", "type": "address"}], "name": "balanceOf", "outputs": [{"name": "", "type": "uint256"}], "type": "function"},
    {"anonymous": False, "inputs": [
        {"indexed": True, "name": "from", "type": "address"},
        {"indexed": True, "name": "to", "type": "address"},
        {"indexed": False, "name": "value", "type": "uint256"},
    ], "name": "Transfer", "type": "event"},
]

_w3 = Web3(Web3.HTTPProvider(BASE_RPC_URL))

# Demo "premium data source" catalog for the Research Agent — stand-ins for
# real x402-payable APIs, all settled through the same real on-chain rail.
DEMO_SOURCES = {
    "compute-api": {"name": "Compute API",  "price": 0.05, "description": "Arnold demo compute API — 1 inference job"},
    "market-data": {"name": "Market Data",  "price": 0.03, "description": "Arnold demo market data feed — latest quotes"},
    "web-search":  {"name": "Web Research", "price": 0.02, "description": "Arnold demo web research snippet"},
    "analytics":   {"name": "Analytics",    "price": 0.04, "description": "Arnold demo analytics summary"},
}


def demo_quote_response(source_id: str) -> dict:
    """The 402 body a demo resource endpoint returns when no payment proof is attached."""
    source = DEMO_SOURCES[source_id]
    return {
        "x402Version": 1,
        "accepts": [{
            "scheme": "exact",
            "network": "base",
            "amount": str(source["price"]),
            "asset": USDC_BASE,
            "payTo": DEMO_MERCHANT_ADDRESS,
            "resource": f"/demo/resource/{source_id}",
            "description": source["description"],
            "maxTimeoutSeconds": 300,
        }],
    }


def demo_unlock_response(source_id: str, paid_amount: float, tx_hash: str) -> dict:
    """The 200 body once payment is verified — a small fake payload per source."""
    source = DEMO_SOURCES[source_id]
    fake_payloads = {
        "compute-api": {"job": "inference-demo", "output": "42", "computeMs": 812},
        "market-data": {"symbol": "ETH/USD", "price": 3372.18, "change24h": 1.4},
        "web-search":  {"snippet": "Base TVL crossed $4.1B this week, driven by renewed DeFi activity."},
        "analytics":   {"summary": "Weekly active wallets on Base up 12% week-over-week."},
    }
    return {
        "result": fake_payloads[source_id],
        "source": source["name"],
        "paidAmount": paid_amount,
        "txHash": tx_hash,
    }


def check_limits(agent: dict, amount: float, blocked_cb=None):
    """Shared spend-rule enforcement for both the simulated and real payment paths.
    Raises HTTPException(402/400) on violation, calling blocked_cb(reason) first if given."""
    from datetime import datetime

    if agent["status"] != "active":
        if blocked_cb: blocked_cb("agent_not_active")
        raise HTTPException(400, f"Agent is {agent['status']}")

    if amount > agent["perTxLimit"]:
        if blocked_cb: blocked_cb("per_tx_limit_exceeded")
        raise HTTPException(402, f"Exceeds per-tx limit of ${agent['perTxLimit']}")

    if agent["spentToday"] + amount > agent["dailyLimit"]:
        if blocked_cb: blocked_cb("daily_limit_exceeded")
        raise HTTPException(402, f"Exceeds daily limit of ${agent['dailyLimit']}")

    try:
        if datetime.utcnow().date() > datetime.fromisoformat(agent["expiry"]).date():
            if blocked_cb: blocked_cb("passport_expired")
            raise HTTPException(402, "Agent passport has expired")
    except ValueError:
        pass


def verify_onchain_payment(tx_hash: str, expected_from: str, expected_to: str, expected_min_amount: float) -> dict:
    """Fetch a Base mainnet tx receipt and confirm it's a real USDC transfer matching the quote.
    Returns {"amount": float, "txHash": str} on success; raises HTTPException(402) with a
    specific reason on any mismatch or failure — a bad/forged hash must never look like a payment."""
    try:
        receipt = _w3.eth.get_transaction_receipt(tx_hash)
    except Exception:
        raise HTTPException(402, "transaction_not_found")

    if receipt is None or receipt.status != 1:
        raise HTTPException(402, "transaction_failed_or_pending")

    usdc = _w3.eth.contract(address=Web3.to_checksum_address(USDC_BASE), abi=ERC20_ABI)
    transfer_topic = _w3.keccak(text="Transfer(address,address,uint256)").hex()

    for log in receipt.logs:
        if log.address.lower() != USDC_BASE.lower():
            continue
        if log.topics[0].hex().lower() != transfer_topic.lower():
            continue
        event = usdc.events.Transfer().process_log(log)
        from_addr = event["args"]["from"]
        to_addr = event["args"]["to"]
        value = event["args"]["value"] / (10 ** USDC_DECIMALS)

        if from_addr.lower() != expected_from.lower():
            continue
        if to_addr.lower() != expected_to.lower():
            continue
        if value + 1e-9 < expected_min_amount:
            raise HTTPException(402, f"underpaid: sent {value}, required {expected_min_amount}")

        return {"amount": value, "txHash": tx_hash}

    raise HTTPException(402, "no_matching_usdc_transfer_in_tx")
