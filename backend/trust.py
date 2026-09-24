"""
x407 trust layer — real HTTP 407 (Proxy Authentication Required) semantics.
=====================================================
An agent proves control of its own wallet by signing an EIP-712 attestation
with its private key (client-side — the backend only ever sees the resulting
signature, never the key, same posture as the payment-signing flow in
lib/x407-agent-pay.ts). That verification, plus a simple track record, forms
a trust grade. Spends above UNTRUSTED_CEILING from an unverified agent get a
real 407 challenge instead of proceeding to the normal 402 payment flow —
this is what makes the "407" in x407 real rather than just a name.

Deliberately NOT reading Origin DAO's live trust registries (own lightweight
reputation instead) and NOT a staking system (identity verification is the
cold-start signal). Trust state lives in the same in-memory agents_db as
everything else in this app today — resets on backend restart.
"""
from eth_account import Account
from eth_account.messages import encode_typed_data
from fastapi import HTTPException

UNTRUSTED_CEILING = 10.0

EIP712_DOMAIN = {"name": "x407", "version": "1"}
EIP712_TYPES = {
    "AgentIdentity": [
        {"name": "agentId", "type": "string"},
        {"name": "wallet", "type": "address"},
        {"name": "issuedAt", "type": "string"},
    ],
}


def identity_message(agent: dict) -> dict:
    """The exact EIP-712 value both sides must agree on — the frontend signs
    this shape, this function reconstructs it server-side to verify."""
    return {"agentId": agent["id"], "wallet": agent["fullAddr"], "issuedAt": agent["createdAt"]}


def verify_identity_signature(agent: dict, signature: str) -> bool:
    encoded = encode_typed_data(EIP712_DOMAIN, EIP712_TYPES, identity_message(agent))
    try:
        recovered = Account.recover_message(encoded, signature=signature)
    except Exception:
        return False
    return recovered.lower() == agent["fullAddr"].lower()


def trust_grade(agent: dict) -> str:
    if not agent.get("identityVerified"):
        return "unverified"
    tx_count = agent.get("txCount", 0)
    if tx_count >= 25:
        return "trusted"
    if tx_count >= 5:
        return "established"
    return "verified"


def check_trust(agent: dict, amount: float):
    """Real HTTP 407 — raised ahead of the normal 402 payment flow when an
    unverified agent tries to spend more than the untrusted ceiling."""
    if amount <= UNTRUSTED_CEILING:
        return
    grade = trust_grade(agent)
    if grade != "unverified":
        return
    raise HTTPException(407, detail={
        "x407TrustVersion": 1,
        "trustRequired": "verified",
        "trustCurrent": grade,
        "reason": f"Payments over ${UNTRUSTED_CEILING:.2f} require this agent to verify its identity first.",
        "verify": {"endpoint": f"/agents/{agent['id']}/verify-identity", "method": "EIP-712 signature"},
    })
