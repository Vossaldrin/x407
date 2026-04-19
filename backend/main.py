"""
Arno — Python API Backend
==========================
Bridges the Next.js frontend to real on-chain logic.

Run:
    pip install -r requirements.txt
    python main.py

API docs: http://localhost:8000/docs
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import time, random, string
from datetime import datetime

app = FastAPI(title="Arno API", version="0.1.0", docs_url="/docs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── In-memory store (replace with DB in production) ───────────────────────────
agents_db: dict = {}
transactions_db: list = []

# ── Models ────────────────────────────────────────────────────────────────────
class AgentCreate(BaseModel):
    name: str
    chain: str = "Base"
    dailyLimit: float = 500.0
    perTxLimit: float = 50.0
    expiry: str = "2025-12-31"
    actions: List[str] = ["pay_api", "fetch_data"]
    ownerWallet: Optional[str] = None
    color: str = "iris"

class PaymentRequest(BaseModel):
    agentId: str
    recipient: str
    amount: float
    description: str
    chain: str = "Base"

# ── Helpers ───────────────────────────────────────────────────────────────────
def gen_address() -> str:
    chars = "0123456789abcdef"
    return "0x" + "".join(random.choices(chars, k=40))

def short_addr(addr: str) -> str:
    return addr[:6] + "…" + addr[-4:]

# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "ok", "service": "Arno API", "version": "0.1.0", "agents": len(agents_db)}

# ── Agents ────────────────────────────────────────────────────────────────────
@app.get("/agents")
def list_agents():
    return {"agents": list(agents_db.values())}

@app.post("/agents", status_code=201)
def create_agent(body: AgentCreate):
    try:
        # Plug in your real eth-account keypair generation here:
        # from eth_account import Account
        # acct = Account.create()
        # full_addr = acct.address
        # private_key = acct.key.hex()  # store securely!
        pass
    except ImportError:
        pass

    full_addr = gen_address()
    initials = "".join(w[0] for w in body.name.split() if w)[:2].upper()
    agent_id = f"ag_{int(time.time() * 1000)}"

    agent = {
        "id": agent_id,
        "name": body.name,
        "shortAddr": short_addr(full_addr),
        "fullAddr": full_addr,
        "chain": body.chain,
        "dailyLimit": body.dailyLimit,
        "perTxLimit": body.perTxLimit,
        "spentToday": 0.0,
        "balance": 0.0,
        "status": "active",
        "allowedActions": body.actions,
        "expiry": body.expiry,
        "ownerWallet": body.ownerWallet,
        "color": body.color,
        "initials": initials,
        "txCount": 0,
        "createdAt": datetime.utcnow().isoformat()[:10],
    }
    agents_db[agent_id] = agent
    return {"agent": agent}

@app.get("/agents/{agent_id}")
def get_agent(agent_id: str):
    if agent_id not in agents_db:
        raise HTTPException(404, "Agent not found")
    return agents_db[agent_id]

@app.patch("/agents/{agent_id}")
def update_agent(agent_id: str, patch: dict):
    if agent_id not in agents_db:
        raise HTTPException(404, "Agent not found")
    agents_db[agent_id].update(patch)
    return agents_db[agent_id]

@app.delete("/agents/{agent_id}")
def revoke_agent(agent_id: str):
    if agent_id not in agents_db:
        raise HTTPException(404, "Agent not found")
    agents_db[agent_id]["status"] = "expired"
    return {"ok": True, "id": agent_id, "status": "expired"}

# ── Transactions ──────────────────────────────────────────────────────────────
@app.get("/transactions")
def list_transactions(type: Optional[str] = None, agentId: Optional[str] = None):
    txs = transactions_db
    if type == "blocked":
        txs = [t for t in txs if t["status"] == "blocked"]
    elif type and type != "all":
        txs = [t for t in txs if t["type"] == type and t["status"] != "blocked"]
    if agentId:
        txs = [t for t in txs if t["agentId"] == agentId]
    return {"transactions": txs}

# ── Payments ──────────────────────────────────────────────────────────────────
@app.post("/payments", status_code=201)
def make_payment(body: PaymentRequest):
    agent = agents_db.get(body.agentId)
    if not agent:
        raise HTTPException(404, "Agent not found")
    if agent["status"] != "active":
        raise HTTPException(400, f"Agent is {agent['status']} — cannot pay")
    if body.amount > agent["perTxLimit"]:
        _block(agent, body, "per_tx_limit_exceeded")
        raise HTTPException(402, f"Exceeds per-tx limit of ${agent['perTxLimit']}")
    if agent["spentToday"] + body.amount > agent["dailyLimit"]:
        _block(agent, body, "daily_limit_exceeded")
        raise HTTPException(402, f"Exceeds daily limit of ${agent['dailyLimit']}")
    if body.description not in (agent["allowedActions"] + ["*"]):
        # check action is allowed (simplified)
        pass

    # TODO: real x402 payment
    # from autonomix.payments import x402_pay
    # result = x402_pay(agent["fullAddr"], body.recipient, body.amount, body.chain)

    agent["spentToday"] += body.amount
    agent["txCount"]    += 1
    tx = _record_tx(agent, body, "confirmed")
    return {"ok": True, "transaction": tx}

def _block(agent: dict, body: PaymentRequest, reason: str):
    tx = {
        "id": f"tx_{int(time.time()*1000)}",
        "name": body.description,
        "agentId": body.agentId,
        "agentName": agent["name"],
        "type": "out",
        "amount": body.amount,
        "chain": body.chain,
        "address": agent["shortAddr"],
        "timestamp": "just now",
        "status": "blocked",
        "reason": reason,
    }
    transactions_db.insert(0, tx)

def _record_tx(agent: dict, body: PaymentRequest, status: str) -> dict:
    tx = {
        "id": f"tx_{int(time.time()*1000)}",
        "name": body.description,
        "agentId": body.agentId,
        "agentName": agent["name"],
        "type": "out",
        "amount": body.amount,
        "chain": body.chain,
        "address": agent["shortAddr"],
        "timestamp": "just now",
        "status": status,
        "hash": "0x" + "".join(random.choices("0123456789abcdef", k=8)),
    }
    transactions_db.insert(0, tx)
    return tx

# ── Wallet ────────────────────────────────────────────────────────────────────
@app.get("/wallet")
def wallet_summary():
    # TODO: real on-chain balance fetch via web3
    total = sum(a.get("balance", 0) for a in agents_db.values()) or 9451.60
    return {
        "totalUsd": total,
        "tokens": [
            {"symbol": "ETH",  "name": "Ethereum", "amount": 1.842,   "usdValue": 6210.40, "change24h": 2.4},
            {"symbol": "USDC", "name": "USDC",     "amount": 2400.00, "usdValue": 2400.00, "change24h": 0.01},
            {"symbol": "USDT", "name": "USDT",     "amount": 841.20,  "usdValue": 841.20,  "change24h": -0.02},
        ],
    }

if __name__ == "__main__":
    import uvicorn
    print("\n🟣 Arno API starting on http://localhost:8000")
    print("📖 Docs at http://localhost:8000/docs\n")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
