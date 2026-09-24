"""
x407 action authorization — proves a PATCH/DELETE/verify-identity request
actually comes from the agent's own wallet (or its ownerWallet, if one is
set), not just from whoever knows the agent's ID. Without this, anyone
could raise an agent's limits, rewrite its customRules (which go straight
into the chat system prompt), revoke it, or trigger identity verification
on its behalf.

Not a user-account system — that's roadmap. This only proves control of an
already-existing wallet, for one specific action, once. The signature is
produced client-side (same posture as trust.py / lib/agent-identity.ts);
the backend only ever verifies it.
"""
import time
from eth_account import Account
from eth_account.messages import encode_typed_data
from fastapi import HTTPException

NONCE_TTL_SECONDS = 300  # 5 minutes — generous for real use, tight enough to bound replay

# In-memory, like everything else in this app — resets on backend restart.
_used_nonces: set = set()

EIP712_DOMAIN = {"name": "x407", "version": "1"}
EIP712_TYPES = {
    "AgentAction": [
        {"name": "agentId", "type": "string"},
        {"name": "action", "type": "string"},
        {"name": "nonce", "type": "string"},
        {"name": "timestamp", "type": "uint256"},
    ],
}


def require_agent_signature(agent: dict, action: str, signature: str, nonce: str, timestamp: int):
    """Raises HTTPException(401/403) unless `signature` proves control of the
    agent's wallet (or its ownerWallet) for this exact action, freshly and
    once. Call this before performing the action, not after."""
    if abs(time.time() - timestamp) > NONCE_TTL_SECONDS:
        raise HTTPException(401, "stale_timestamp")

    nonce_key = f"{agent['id']}:{nonce}"
    if nonce_key in _used_nonces:
        raise HTTPException(401, "nonce_already_used")

    message = {"agentId": agent["id"], "action": action, "nonce": nonce, "timestamp": timestamp}
    encoded = encode_typed_data(EIP712_DOMAIN, EIP712_TYPES, message)
    try:
        recovered = Account.recover_message(encoded, signature=signature)
    except Exception:
        raise HTTPException(401, "invalid_signature")

    allowed = {agent["fullAddr"].lower()}
    if agent.get("ownerWallet"):
        allowed.add(agent["ownerWallet"].lower())
    if recovered.lower() not in allowed:
        raise HTTPException(403, "signature_not_authorized_for_this_agent")

    _used_nonces.add(nonce_key)
