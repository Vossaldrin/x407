"""
x407 — Python API Backend
============================
Real Ethereum passport + wallet logic for autonomous AI agents.

Run:
    cd backend
    source ../venv/bin/activate
    uvicorn main:app --reload --port 8000

API docs: http://localhost:8000/docs
"""

from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent / ".env")  # must run before importing modules that read env vars at import time

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from web3 import Web3
import os, time, secrets, httpx
import anthropic
import x407
import llm
import dex
import ai_providers
import trust
import auth

app = FastAPI(title="x407 API", version="0.3.0", docs_url="/docs")

# Our own Vercel project only — "https://.*\.vercel\.app" previously matched
# literally any Vercel-hosted app, not just ours. Override via env if the
# project's preview-deployment naming ever changes. `or` rather than
# os.getenv's own default arg — an empty string in the env (e.g. from a
# blank line in .env) must also fall through, not become an empty regex
# that (via re.match) would match every origin and be worse than no fix.
CORS_ORIGIN_REGEX = os.getenv("CORS_ORIGIN_REGEX") or r"https://x407(-[a-z0-9-]+)?\.vercel\.app"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_origin_regex=CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── In-memory stores ──────────────────────────────────────────────────────────
agents_db: dict = {}
transactions_db: list = []
bills_db: dict = {}  # {bill_id: {..., agentId}} — user-entered real bills for Budget Guard
refunds_db: dict = {}  # {refund_id: {..., agentId}} — user-entered real refunds for Customer Support Agent
groceries_db: dict = {}  # {item_id: {..., agentId}} — user-entered real shopping list for Grocery Scout

# ── Marketplace catalogue ─────────────────────────────────────────────────────
MARKETPLACE = [
    {
        "id": "tpl_defi_trader",
        "name": "DeFi Trader",
        "emoji": "📈",
        "category": "Finance",
        "description": "Monitors markets, executes swaps, and rebalances your portfolio within your rules.",
        "price": "$9/mo",
        "rating": 4.9,
        "hiredCount": 2400,
        "defaultActions": ["trade", "swap", "fetch_data", "pay_api"],
        "defaultDailyLimit": 500.0,
        "defaultPerTxLimit": 100.0,
        "color": "emerald",
        "featured": True,
    },
    {
        "id": "tpl_grocery_scout",
        "name": "Grocery Scout",
        "emoji": "🛒",
        "category": "Shopping",
        "description": "Finds the best prices, places orders, and tracks deliveries for your weekly groceries.",
        "price": "$4/mo",
        "rating": 4.7,
        "hiredCount": 8100,
        "defaultActions": ["shop", "pay_api", "fetch_data"],
        "defaultDailyLimit": 150.0,
        "defaultPerTxLimit": 50.0,
        "color": "amber",
        "featured": False,
    },
    {
        "id": "tpl_travel_planner",
        "name": "Travel Planner",
        "emoji": "✈️",
        "category": "Travel",
        "description": "Books flights, hotels, and activities at optimal prices. Works 24/7 to find deals.",
        "price": "$6/mo",
        "rating": 4.8,
        "hiredCount": 1900,
        "defaultActions": ["book_travel", "shop", "pay_api", "fetch_data"],
        "defaultDailyLimit": 1000.0,
        "defaultPerTxLimit": 300.0,
        "color": "iris",
        "featured": False,
    },
    {
        "id": "tpl_research_bot",
        "name": "Research Bot",
        "emoji": "🔬",
        "category": "Research",
        "description": "Scrapes, summarizes, and synthesizes information from the web on any topic you set.",
        "price": "Free",
        "rating": 4.6,
        "hiredCount": 12000,
        "defaultActions": ["fetch_data", "pay_api"],
        "defaultDailyLimit": 20.0,
        "defaultPerTxLimit": 5.0,
        "color": "rose",
        "featured": True,
    },
    {
        "id": "tpl_budget_guard",
        "name": "Budget Guard",
        "emoji": "💰",
        "category": "Finance",
        "description": "Monitors subscriptions, cancels unused ones, and renegotiates bills automatically.",
        "price": "$12/mo",
        "rating": 4.9,
        "hiredCount": 5200,
        "defaultActions": ["pay_api", "fetch_data", "cancel_subscription"],
        "defaultDailyLimit": 200.0,
        "defaultPerTxLimit": 50.0,
        "color": "emerald",
        "featured": False,
    },
    {
        "id": "tpl_log_triage",
        "name": "Log & Incident Triage Agent",
        "emoji": "🚨",
        "category": "Dev tools",
        "description": "Watches your logs and alerts, triages incidents by severity, and pays for the monitoring tools it needs to keep watching.",
        "price": "$16/mo",
        "rating": 4.7,
        "hiredCount": 740,
        "defaultActions": ["pay_api", "fetch_data", "triage_incident"],
        "defaultDailyLimit": 150.0,
        "defaultPerTxLimit": 50.0,
        "color": "rose",
        "featured": False,
    },
    {
        "id": "tpl_dependency_patch",
        "name": "Dependency & Security Patch Agent",
        "emoji": "🛡️",
        "category": "Dev tools",
        "description": "Scans your dependencies for vulnerabilities and outdated packages, and pays for the scanning and patch services it uses to keep them current.",
        "price": "$13/mo",
        "rating": 4.6,
        "hiredCount": 610,
        "defaultActions": ["pay_api", "fetch_data", "trigger_patch"],
        "defaultDailyLimit": 100.0,
        "defaultPerTxLimit": 40.0,
        "color": "blue",
        "featured": True,
    },
    {
        "id": "tpl_investment_agent",
        "name": "Investment Agent",
        "emoji": "🌱",
        "category": "Finance",
        "description": "Invests a fixed amount on a schedule into low-risk assets — passive wealth building on autopilot.",
        "price": "$8/mo",
        "rating": 4.8,
        "hiredCount": 2100,
        "defaultActions": ["trade", "fetch_data", "pay_api"],
        "defaultDailyLimit": 150.0,
        "defaultPerTxLimit": 150.0,
        "color": "emerald",
        "featured": False,
    },
    {
        "id": "tpl_customer_support",
        "name": "Customer Support Agent",
        "emoji": "🎧",
        "category": "Business",
        "description": "Handles small refunds and support payments within approved limits, without waiting on a human.",
        "price": "$10/mo",
        "rating": 4.6,
        "hiredCount": 1400,
        "defaultActions": ["pay_api", "fetch_data", "issue_refund"],
        "defaultDailyLimit": 250.0,
        "defaultPerTxLimit": 50.0,
        "color": "iris",
        "featured": False,
    },
    {
        "id": "tpl_inbox_filer",
        "name": "Inbox & Document Filer Agent",
        "emoji": "📥",
        "category": "Business",
        "description": "Sorts incoming email and documents into the right folders, extracts key details, and pays for the parsing tools it uses.",
        "price": "$5/mo",
        "rating": 4.6,
        "hiredCount": 1150,
        "defaultActions": ["pay_api", "fetch_data", "file_document"],
        "defaultDailyLimit": 40.0,
        "defaultPerTxLimit": 10.0,
        "color": "blue",
        "featured": False,
    },
    {
        "id": "tpl_calendar_agent",
        "name": "Appointment & Calendar Agent",
        "emoji": "📅",
        "category": "Business",
        "description": "Schedules and reschedules appointments across calendars, and pays for the booking and calendar APIs it needs.",
        "price": "$5/mo",
        "rating": 4.7,
        "hiredCount": 1320,
        "defaultActions": ["pay_api", "fetch_data", "schedule_appointment"],
        "defaultDailyLimit": 40.0,
        "defaultPerTxLimit": 10.0,
        "color": "amber",
        "featured": False,
    },
    {
        "id": "tpl_receipt_logger",
        "name": "Receipt & Expense Logger Agent",
        "emoji": "🧾",
        "category": "Finance",
        "description": "Reads receipts, logs expenses to the right category, and pays for the OCR and parsing tools it uses.",
        "price": "$6/mo",
        "rating": 4.6,
        "hiredCount": 980,
        "defaultActions": ["pay_api", "fetch_data", "log_expense"],
        "defaultDailyLimit": 40.0,
        "defaultPerTxLimit": 10.0,
        "color": "emerald",
        "featured": False,
    },
    {
        "id": "tpl_form_filler",
        "name": "Form-Filler & Data Entry Agent",
        "emoji": "📝",
        "category": "Business",
        "description": "Fills out repetitive forms and data-entry tasks from your source documents, paying for any lookup APIs it needs along the way.",
        "price": "$7/mo",
        "rating": 4.5,
        "hiredCount": 860,
        "defaultActions": ["pay_api", "fetch_data", "fill_form"],
        "defaultDailyLimit": 50.0,
        "defaultPerTxLimit": 15.0,
        "color": "grey",
        "featured": False,
    },
]

# ── Models ────────────────────────────────────────────────────────────────────
class AgentCreate(BaseModel):
    name: str
    address: str  # generated client-side (ethers.Wallet.createRandom()) — the
                  # backend never generates or sees the private key
    chain: str = "Base"
    dailyLimit: float = 500.0
    perTxLimit: float = 50.0
    expiry: str = "2026-12-31"
    actions: List[str] = ["pay_api", "fetch_data"]
    ownerWallet: Optional[str] = None
    color: str = "emerald"
    customRules: Optional[str] = None
    visitorId: Optional[str] = None  # per-browser id (no login system) so a shared
                                      # demo link doesn't mix one visitor's agents
                                      # into another's — not a security boundary,
                                      # just UI isolation between simultaneous visitors

class SignedAction(BaseModel):
    """Proves the caller controls the agent's wallet (or ownerWallet) for one
    specific action — see auth.py. Required on every agent-mutating route."""
    signature: str
    nonce: str
    timestamp: int

class VerifyIdentityRequest(BaseModel):
    signature: str  # the identity attestation itself (trust.py) — unchanged
    auth: SignedAction  # proves this specific call is authorized (auth.py) — new

class AgentPatchRequest(BaseModel):
    patch: Dict[str, Any]
    auth: SignedAction

class HireRequest(BaseModel):
    templateId: str
    address: str  # generated client-side — see AgentCreate.address
    chain: str = "Base"
    dailyLimit: Optional[float] = None
    perTxLimit: Optional[float] = None
    expiry: str = "2026-12-31"
    ownerWallet: Optional[str] = None
    actions: Optional[List[str]] = None
    visitorId: Optional[str] = None

class PaymentRequest(BaseModel):
    agentId: str
    recipient: str
    amount: float
    description: str
    chain: str = "Base"

class BillCreate(BaseModel):
    name: str
    category: str = "Other"
    amount: float
    payToAddress: str  # there's no real Netflix/Spotify billing API to reach — the
                        # user names their own real recipient, which is what makes
                        # the resulting payment genuinely real

class RefundCreate(BaseModel):
    customerName: str
    reason: str = "Refund"
    amount: float
    payToAddress: str  # the customer's real wallet — there's no support-ticket
                        # system to pull this from, so the user enters it directly

class GroceryItemCreate(BaseModel):
    item: str
    maxPrice: float
    payToAddress: str  # the store/seller's real wallet — there's no real
                        # cross-retailer price-comparison API to reach, so the
                        # user names their own target price and recipient

class QuoteRequest(BaseModel):
    agentId: str
    resourceUrl: Optional[str] = None

class ExecuteRequest(BaseModel):
    agentId: str
    resourceUrl: Optional[str] = None
    txHash: str

class SynthesizeRequest(BaseModel):
    topic: str
    snippets: List[str]

class DefiExecuteRequest(BaseModel):
    agentId: str
    fromToken: str
    toToken: str
    txHash: str

class DefiReasonRequest(BaseModel):
    agentId: str
    fromToken: str
    toToken: str
    amountIn: float
    amountOut: float
    fee: int

class FinanceRationaleRequest(BaseModel):
    billName: str
    amount: float
    betterDealAmount: float

class TravelOptionIn(BaseModel):
    name: str
    type: str
    price: float

class TravelRationaleRequest(BaseModel):
    destination: str
    options: List[TravelOptionIn]

class PaymentReasonRequest(BaseModel):
    description: str
    amount: float

class ResearchRecommendRequest(BaseModel):
    topic: str

class WalletSummaryRequest(BaseModel):
    transactions: List[Dict[str, Any]]
    totalUsd: float = 0

class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    text: str

class ChatRequest(BaseModel):
    agentId: str
    flowType: str
    message: str
    history: List[ChatMessage] = []

# ── Helpers ───────────────────────────────────────────────────────────────────
def short_addr(addr: str) -> str:
    return addr[:6] + "…" + addr[-4:]

def build_agent(body: AgentCreate, template_id: str = None) -> dict:
    try:
        full_addr = Web3.to_checksum_address(body.address)
    except ValueError:
        raise HTTPException(400, "Invalid Ethereum address")
    agent_id = f"ag_{int(time.time() * 1000)}_{secrets.token_hex(3)}"
    initials = "".join(w[0] for w in body.name.split() if w)[:2].upper()
    return {
        "id": agent_id,
        "name": body.name,
        "shortAddr": short_addr(full_addr),
        "fullAddr": full_addr,
        "chain": body.chain,
        "dailyLimit": body.dailyLimit,
        "perTxLimit": body.perTxLimit,
        "spentToday": 0.0,
        "spentDate": datetime.utcnow().date().isoformat(),
        "balance": 0.0,
        "status": "active",
        "allowedActions": body.actions,
        "expiry": body.expiry,
        "ownerWallet": body.ownerWallet,
        "color": body.color,
        "initials": initials,
        "txCount": 0,
        "templateId": template_id,
        "createdAt": datetime.utcnow().isoformat()[:10],
        "customRules": body.customRules or "",
        "identityVerified": False,
        "visitorId": body.visitorId,
    }

def safe(agent: dict) -> dict:
    return {**{k: v for k, v in agent.items() if k != "privateKey"}, "trustGrade": trust.trust_grade(agent)}

# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "ok", "service": "x407 API", "version": "0.3.0",
            "agents": len(agents_db), "marketplace": len(MARKETPLACE)}

# ── Marketplace ───────────────────────────────────────────────────────────────
@app.get("/marketplace")
def list_marketplace(category: Optional[str] = None, featured: Optional[bool] = None):
    items = MARKETPLACE
    if category:
        items = [i for i in items if i["category"].lower() == category.lower()]
    if featured is not None:
        items = [i for i in items if i["featured"] == featured]
    return {"templates": items, "total": len(items)}

@app.get("/marketplace/{template_id}")
def get_template(template_id: str):
    tpl = next((t for t in MARKETPLACE if t["id"] == template_id), None)
    if not tpl:
        raise HTTPException(404, "Template not found")
    return tpl

@app.post("/marketplace/hire", status_code=201)
def hire_agent(body: HireRequest):
    tpl = next((t for t in MARKETPLACE if t["id"] == body.templateId), None)
    if not tpl:
        raise HTTPException(404, f"Template '{body.templateId}' not found")

    agent_body = AgentCreate(
        name=tpl["name"],
        address=body.address,
        chain=body.chain,
        dailyLimit=body.dailyLimit or tpl["defaultDailyLimit"],
        perTxLimit=body.perTxLimit or tpl["defaultPerTxLimit"],
        expiry=body.expiry,
        actions=body.actions or tpl["defaultActions"],
        ownerWallet=body.ownerWallet,
        color=tpl["color"],
        visitorId=body.visitorId,
    )
    agent = build_agent(agent_body, template_id=body.templateId)
    agent["emoji"] = tpl.get("emoji", "🤖")
    agent["category"] = tpl["category"]
    agents_db[agent["id"]] = agent

    return {"agent": safe(agent)}

# ── Agents ────────────────────────────────────────────────────────────────────
@app.get("/agents")
def list_agents(visitorId: Optional[str] = None):
    agents = agents_db.values()
    if visitorId:
        agents = [a for a in agents if a.get("visitorId") == visitorId]
    return {"agents": [safe(a) for a in agents]}

@app.post("/agents", status_code=201)
def create_agent(body: AgentCreate):
    agent = build_agent(body)
    agents_db[agent["id"]] = agent
    return {"agent": safe(agent)}

@app.get("/agents/{agent_id}")
def get_agent(agent_id: str):
    if agent_id not in agents_db:
        raise HTTPException(404, "Agent not found")
    return safe(agents_db[agent_id])

@app.patch("/agents/{agent_id}")
def update_agent(agent_id: str, body: AgentPatchRequest):
    if agent_id not in agents_db:
        raise HTTPException(404, "Agent not found")
    agent = agents_db[agent_id]
    auth.require_agent_signature(agent, "patch", body.auth.signature, body.auth.nonce, body.auth.timestamp)
    patch = dict(body.patch)
    patch.pop("privateKey", None)
    patch.pop("fullAddr", None)
    agent.update(patch)
    return safe(agent)

@app.delete("/agents/{agent_id}")
def revoke_agent(agent_id: str, body: SignedAction):
    if agent_id not in agents_db:
        raise HTTPException(404, "Agent not found")
    agent = agents_db[agent_id]
    auth.require_agent_signature(agent, "delete", body.signature, body.nonce, body.timestamp)
    agent["status"] = "expired"
    return {"ok": True, "id": agent_id, "status": "expired"}

@app.post("/agents/{agent_id}/verify-identity")
def verify_identity(agent_id: str, body: VerifyIdentityRequest):
    """x407 trust layer — the agent proves control of its own wallet by
    signing an EIP-712 attestation client-side (see trust.py). Never sees
    the private key, only the resulting signature. body.auth separately
    proves this specific call is authorized (see auth.py) — a captured
    identity attestation alone can't be replayed to trigger this endpoint,
    since that signature never expires by design (it's a durable identity
    claim, not a one-time action)."""
    agent = agents_db.get(agent_id)
    if not agent:
        raise HTTPException(404, "Agent not found")
    auth.require_agent_signature(agent, "verify-identity", body.auth.signature, body.auth.nonce, body.auth.timestamp)
    if not trust.verify_identity_signature(agent, body.signature):
        raise HTTPException(400, "Signature does not match this agent's wallet")
    agent["identityVerified"] = True
    return {"ok": True, "identityVerified": True, "trustGrade": trust.trust_grade(agent)}

# ── Payments (simulated ledger) ────────────────────────────────────────────────
@app.post("/payments", status_code=201)
def make_payment(body: PaymentRequest):
    agent = agents_db.get(body.agentId)
    if not agent:
        raise HTTPException(404, "Agent not found")

    x407.check_limits(agent, body.amount, blocked_cb=lambda reason: _blocked(agent, body, reason))

    agent["spentToday"] += body.amount
    agent["txCount"] += 1
    tx = _record(agent, body, "confirmed")
    return {"ok": True, "transaction": tx}

def _blocked(agent, body, reason):
    transactions_db.insert(0, {
        "id": f"tx_{int(time.time()*1000)}_{secrets.token_hex(3)}",
        "name": body.description,
        "agentId": body.agentId,
        "agentName": agent["name"],
        "type": "out",
        "amount": body.amount,
        "chain": body.chain,
        "address": agent["shortAddr"],
        "timestamp": datetime.utcnow().strftime("%H:%M"),
        "status": "blocked",
        "reason": reason,
        "hash": None,
    })

def _record(agent, body, status):
    tx = {
        "id": f"tx_{int(time.time()*1000)}_{secrets.token_hex(3)}",
        "name": body.description,
        "agentId": body.agentId,
        "agentName": agent["name"],
        "type": "out",
        "amount": body.amount,
        "chain": body.chain,
        "address": agent["shortAddr"],
        "timestamp": datetime.utcnow().strftime("%H:%M"),
        "status": status,
        "hash": "0x" + secrets.token_hex(4),
        "real": False,
    }
    transactions_db.insert(0, tx)
    return tx

# ── Payments (real, x407-inspired) ─────────────────────────────────────────────
# In-memory record of what each agent was last quoted, keyed by agentId, so
# /payments/execute can re-check the client's tx against the exact terms it
# was shown — never trust amount/recipient handed back by the client alone.
_last_quote: dict = {}

@app.get("/demo/sources")
def demo_sources():
    """Catalog of demo x407-payable data sources, for the Research Agent's source picker."""
    return {"sources": [{"id": sid, **info} for sid, info in x407.DEMO_SOURCES.items()]}

async def _demo_resource_handler(source_id: str, request: Request):
    """Shared x407-style merchant behavior: 402 with a quote when unpaid, 200 with the
    unlocked payload once a matching on-chain payment is verified. Standing in for a real
    compute/API/data provider so the full quote -> pay -> unlock loop is testable without
    a third party."""
    if source_id not in x407.DEMO_SOURCES:
        raise HTTPException(404, f"Unknown demo source '{source_id}'")
    if not x407.DEMO_MERCHANT_ADDRESS:
        raise HTTPException(500, "DEMO_MERCHANT_ADDRESS is not configured on the backend")

    tx_hash = request.query_params.get("txHash") or request.headers.get("X-PAYMENT-TX")
    payer = request.query_params.get("payer") or request.headers.get("X-PAYMENT-FROM")
    topic = request.query_params.get("topic", "")

    if not tx_hash:
        return JSONResponse(status_code=402, content=x407.demo_quote_response(source_id))

    price = x407.DEMO_SOURCES[source_id]["price"]
    result = x407.verify_onchain_payment(tx_hash, payer or "", x407.DEMO_MERCHANT_ADDRESS, price)
    # verify_onchain_payment only checks "at least price" — without this, a
    # payment made for one (pricier) source could be replayed to unlock any
    # other source whose price is <= what was actually sent.
    if abs(result["amount"] - price) > 1e-6:
        raise HTTPException(402, "amount_mismatch_for_source")
    x407.mark_tx_consumed(tx_hash)
    unlock = await x407.demo_unlock_response(source_id, result["amount"], result["txHash"], topic)
    return JSONResponse(status_code=200, content=unlock)

@app.api_route("/demo/compute-api", methods=["GET", "POST"])
async def demo_compute_api(request: Request):
    return await _demo_resource_handler("compute-api", request)

@app.api_route("/demo/resource/{source_id}", methods=["GET", "POST"])
async def demo_resource(source_id: str, request: Request):
    return await _demo_resource_handler(source_id, request)

# ── Bills (Budget Guard — real user-entered bills, real payment rail) ──────────
# No bank/subscription auto-detection (out of reasonable scope) — the user names
# their own real recipient per bill, which is what makes the resulting payment
# genuinely real even though "auto-detect my subscriptions" isn't. Bill CRUD
# itself carries no spend authority (creating/listing/deleting one moves no
# money), so it doesn't need the signed-action auth that agent PATCH/DELETE do —
# actual money only moves through the same trust/limit/replay-protected rail
# below, same as everything else.

def _bill_invoice_quote(bill: dict) -> dict:
    """Same x402 challenge shape as x407.demo_quote_response, sourced from a
    user-entered bill instead of the fixed DEMO_SOURCES catalog."""
    return {
        "x402Version": 1,
        "accepts": [{
            "scheme": "exact",
            "network": "base",
            "amount": str(bill["amount"]),
            "asset": x407.USDC_BASE,
            "payTo": bill["payToAddress"],
            "resource": f"/bills/{bill['id']}/invoice",
            "description": f"{bill['name']} ({bill['category']})",
            "maxTimeoutSeconds": 300,
        }],
    }

@app.post("/agents/{agent_id}/bills", status_code=201)
def create_bill(agent_id: str, body: BillCreate):
    if agent_id not in agents_db:
        raise HTTPException(404, "Agent not found")
    try:
        pay_to = Web3.to_checksum_address(body.payToAddress)
    except ValueError:
        raise HTTPException(400, "Invalid payToAddress")
    bill_id = f"bill_{int(time.time()*1000)}_{secrets.token_hex(3)}"
    bill = {
        "id": bill_id, "agentId": agent_id, "name": body.name,
        "category": body.category, "amount": body.amount,
        "payToAddress": pay_to, "paid": False,
    }
    bills_db[bill_id] = bill
    return bill

@app.get("/agents/{agent_id}/bills")
def list_bills(agent_id: str):
    return {"bills": [b for b in bills_db.values() if b["agentId"] == agent_id]}

@app.delete("/agents/{agent_id}/bills/{bill_id}")
def delete_bill(agent_id: str, bill_id: str):
    bill = bills_db.get(bill_id)
    if not bill or bill["agentId"] != agent_id:
        raise HTTPException(404, "Bill not found")
    del bills_db[bill_id]
    return {"ok": True}

@app.api_route("/bills/{bill_id}/invoice", methods=["GET", "POST"])
async def bill_invoice(bill_id: str, request: Request):
    """Same shared x407-style merchant behavior as _demo_resource_handler,
    sourced from a user-entered bill instead of the fixed demo catalog — reuses
    the exact same replay/block-binding protections since it's the same
    /payments/quote + /payments/execute rail underneath, just a different
    resourceUrl."""
    bill = bills_db.get(bill_id)
    if not bill:
        raise HTTPException(404, f"Unknown bill '{bill_id}'")

    tx_hash = request.query_params.get("txHash") or request.headers.get("X-PAYMENT-TX")
    payer = request.query_params.get("payer") or request.headers.get("X-PAYMENT-FROM")

    if not tx_hash:
        return JSONResponse(status_code=402, content=_bill_invoice_quote(bill))

    result = x407.verify_onchain_payment(tx_hash, payer or "", bill["payToAddress"], bill["amount"])
    if abs(result["amount"] - bill["amount"]) > 1e-6:
        raise HTTPException(402, "amount_mismatch_for_bill")
    x407.mark_tx_consumed(tx_hash)
    bill["paid"] = True
    return JSONResponse(status_code=200, content={
        "result": {"billId": bill_id, "name": bill["name"], "status": "paid"},
        "source": bill["name"], "paidAmount": result["amount"], "txHash": result["txHash"],
    })

# ── Refunds (Customer Support Agent — real user-entered refunds, real payment rail) ─
# Same shape as bills above: no real support-ticket system to pull a customer's
# wallet from, so the user enters it directly; the resulting payment is real.

def _refund_invoice_quote(refund: dict) -> dict:
    return {
        "x402Version": 1,
        "accepts": [{
            "scheme": "exact", "network": "base",
            "amount": str(refund["amount"]), "asset": x407.USDC_BASE,
            "payTo": refund["payToAddress"],
            "resource": f"/refunds/{refund['id']}/invoice",
            "description": f"Refund to {refund['customerName']} ({refund['reason']})",
            "maxTimeoutSeconds": 300,
        }],
    }

@app.post("/agents/{agent_id}/refunds", status_code=201)
def create_refund(agent_id: str, body: RefundCreate):
    if agent_id not in agents_db:
        raise HTTPException(404, "Agent not found")
    try:
        pay_to = Web3.to_checksum_address(body.payToAddress)
    except ValueError:
        raise HTTPException(400, "Invalid payToAddress")
    refund_id = f"refund_{int(time.time()*1000)}_{secrets.token_hex(3)}"
    refund = {
        "id": refund_id, "agentId": agent_id, "customerName": body.customerName,
        "reason": body.reason, "amount": body.amount,
        "payToAddress": pay_to, "paid": False,
    }
    refunds_db[refund_id] = refund
    return refund

@app.get("/agents/{agent_id}/refunds")
def list_refunds(agent_id: str):
    return {"refunds": [r for r in refunds_db.values() if r["agentId"] == agent_id]}

@app.delete("/agents/{agent_id}/refunds/{refund_id}")
def delete_refund(agent_id: str, refund_id: str):
    refund = refunds_db.get(refund_id)
    if not refund or refund["agentId"] != agent_id:
        raise HTTPException(404, "Refund not found")
    del refunds_db[refund_id]
    return {"ok": True}

@app.api_route("/refunds/{refund_id}/invoice", methods=["GET", "POST"])
async def refund_invoice(refund_id: str, request: Request):
    refund = refunds_db.get(refund_id)
    if not refund:
        raise HTTPException(404, f"Unknown refund '{refund_id}'")

    tx_hash = request.query_params.get("txHash") or request.headers.get("X-PAYMENT-TX")
    payer = request.query_params.get("payer") or request.headers.get("X-PAYMENT-FROM")

    if not tx_hash:
        return JSONResponse(status_code=402, content=_refund_invoice_quote(refund))

    result = x407.verify_onchain_payment(tx_hash, payer or "", refund["payToAddress"], refund["amount"])
    if abs(result["amount"] - refund["amount"]) > 1e-6:
        raise HTTPException(402, "amount_mismatch_for_refund")
    x407.mark_tx_consumed(tx_hash)
    refund["paid"] = True
    return JSONResponse(status_code=200, content={
        "result": {"refundId": refund_id, "customerName": refund["customerName"], "status": "paid"},
        "source": f"Refund: {refund['customerName']}", "paidAmount": result["amount"], "txHash": result["txHash"],
    })

# ── Groceries (Grocery Scout — real user-entered shopping list, real payment rail) ──
# Same shape as bills: no real cross-retailer price-comparison API to reach, so the
# user sets their own target price and recipient; the resulting payment is real.

def _grocery_invoice_quote(item: dict) -> dict:
    return {
        "x402Version": 1,
        "accepts": [{
            "scheme": "exact", "network": "base",
            "amount": str(item["maxPrice"]), "asset": x407.USDC_BASE,
            "payTo": item["payToAddress"],
            "resource": f"/groceries/{item['id']}/invoice",
            "description": f"{item['item']} (grocery order)",
            "maxTimeoutSeconds": 300,
        }],
    }

@app.post("/agents/{agent_id}/groceries", status_code=201)
def create_grocery_item(agent_id: str, body: GroceryItemCreate):
    if agent_id not in agents_db:
        raise HTTPException(404, "Agent not found")
    try:
        pay_to = Web3.to_checksum_address(body.payToAddress)
    except ValueError:
        raise HTTPException(400, "Invalid payToAddress")
    item_id = f"grocery_{int(time.time()*1000)}_{secrets.token_hex(3)}"
    item = {
        "id": item_id, "agentId": agent_id, "item": body.item,
        "maxPrice": body.maxPrice, "payToAddress": pay_to, "paid": False,
    }
    groceries_db[item_id] = item
    return item

@app.get("/agents/{agent_id}/groceries")
def list_grocery_items(agent_id: str):
    return {"items": [g for g in groceries_db.values() if g["agentId"] == agent_id]}

@app.delete("/agents/{agent_id}/groceries/{item_id}")
def delete_grocery_item(agent_id: str, item_id: str):
    item = groceries_db.get(item_id)
    if not item or item["agentId"] != agent_id:
        raise HTTPException(404, "Item not found")
    del groceries_db[item_id]
    return {"ok": True}

@app.api_route("/groceries/{item_id}/invoice", methods=["GET", "POST"])
async def grocery_invoice(item_id: str, request: Request):
    item = groceries_db.get(item_id)
    if not item:
        raise HTTPException(404, f"Unknown grocery item '{item_id}'")

    tx_hash = request.query_params.get("txHash") or request.headers.get("X-PAYMENT-TX")
    payer = request.query_params.get("payer") or request.headers.get("X-PAYMENT-FROM")

    if not tx_hash:
        return JSONResponse(status_code=402, content=_grocery_invoice_quote(item))

    result = x407.verify_onchain_payment(tx_hash, payer or "", item["payToAddress"], item["maxPrice"])
    if abs(result["amount"] - item["maxPrice"]) > 1e-6:
        raise HTTPException(402, "amount_mismatch_for_item")
    x407.mark_tx_consumed(tx_hash)
    item["paid"] = True
    return JSONResponse(status_code=200, content={
        "result": {"itemId": item_id, "item": item["item"], "status": "paid"},
        "source": item["item"], "paidAmount": result["amount"], "txHash": result["txHash"],
    })

@app.post("/payments/quote")
async def quote_payment(body: QuoteRequest):
    agent = agents_db.get(body.agentId)
    if not agent:
        raise HTTPException(404, "Agent not found")

    resource_url = body.resourceUrl or f"{x407.SELF_API_URL}/demo/compute-api"
    x407.validate_resource_url(resource_url)
    async with httpx.AsyncClient() as client:
        try:
            res = await client.get(resource_url, timeout=10, follow_redirects=False)
        except httpx.HTTPError as e:
            raise HTTPException(502, f"Could not reach resource: {e}")

    if res.status_code != 402:
        raise HTTPException(502, "Resource did not return a 402 payment quote")

    quote = res.json()
    accept = (quote.get("accepts") or [None])[0]
    if not accept:
        raise HTTPException(502, "Malformed 402 response: no 'accepts' entry")

    amount = float(accept["amount"])
    trust.check_trust(agent, amount)
    x407.check_limits(agent, amount)

    _last_quote[body.agentId] = {"resourceUrl": resource_url, "accept": accept, "quotedAtBlock": x407.current_block()}
    return {"agent": safe(agent), "quote": accept, "resourceUrl": resource_url}

@app.post("/payments/execute")
async def execute_payment(body: ExecuteRequest):
    agent = agents_db.get(body.agentId)
    if not agent:
        raise HTTPException(404, "Agent not found")

    quoted = _last_quote.get(body.agentId)
    if not quoted or (body.resourceUrl and quoted["resourceUrl"] != body.resourceUrl):
        raise HTTPException(409, "No matching quote on file — call /payments/quote first")

    accept = quoted["accept"]
    amount = float(accept["amount"])

    def blocked(reason):
        transactions_db.insert(0, {
            "id": f"tx_{int(time.time()*1000)}_{secrets.token_hex(3)}",
            "name": accept.get("description", "x407 payment"),
            "agentId": body.agentId, "agentName": agent["name"],
            "type": "out", "amount": amount, "chain": "Base",
            "address": agent["shortAddr"],
            "timestamp": datetime.utcnow().strftime("%H:%M"),
            "status": "blocked", "reason": reason, "hash": body.txHash, "real": True,
        })

    trust.check_trust(agent, amount)
    x407.check_limits(agent, amount, blocked_cb=blocked)

    try:
        result = x407.verify_onchain_payment(body.txHash, agent["fullAddr"], accept["payTo"], amount, not_before_block=quoted.get("quotedAtBlock"))
    except HTTPException as e:
        blocked(str(e.detail))
        raise

    x407.validate_resource_url(quoted["resourceUrl"])
    async with httpx.AsyncClient() as client:
        unlocked = await client.get(quoted["resourceUrl"], params={"txHash": body.txHash, "payer": agent["fullAddr"]}, timeout=15, follow_redirects=False)
    if unlocked.status_code != 200:
        blocked("resource_did_not_unlock")
        raise HTTPException(502, "Payment verified on-chain but resource did not unlock")

    x407.mark_tx_consumed(body.txHash)
    agent["spentToday"] += result["amount"]
    agent["txCount"] += 1
    tx = {
        "id": f"tx_{int(time.time()*1000)}_{secrets.token_hex(3)}",
        "name": accept.get("description", "x407 payment"),
        "agentId": body.agentId, "agentName": agent["name"],
        "type": "out", "amount": result["amount"], "chain": "Base",
        "address": agent["shortAddr"],
        "timestamp": datetime.utcnow().strftime("%H:%M"),
        "status": "confirmed", "hash": result["txHash"], "real": True,
    }
    transactions_db.insert(0, tx)
    del _last_quote[body.agentId]
    return {"ok": True, "transaction": tx, "resource": unlocked.json()}

# ── DeFi trading (real Uniswap V3 swap, ETH<->USDC on Base) ────────────────────
_last_defi_quote: dict = {}

@app.get("/defi/quote")
def defi_quote(agentId: str, fromToken: str, toToken: str, amountIn: float):
    agent = agents_db.get(agentId)
    if not agent:
        raise HTTPException(404, "Agent not found")

    quote = dex.get_best_quote(fromToken, toToken, amountIn)
    notional = amountIn if fromToken == "USDC" else quote["amountOut"]
    trust.check_trust(agent, notional)
    x407.check_limits(agent, notional)

    _last_defi_quote[agentId] = {"fromToken": fromToken, "toToken": toToken, "amountIn": amountIn, "notional": notional, "quotedAtBlock": x407.current_block()}
    return {"agent": safe(agent), "quote": quote}

@app.post("/defi/execute")
def defi_execute(body: DefiExecuteRequest):
    agent = agents_db.get(body.agentId)
    if not agent:
        raise HTTPException(404, "Agent not found")

    quoted = _last_defi_quote.get(body.agentId)
    if not quoted or quoted["fromToken"] != body.fromToken or quoted["toToken"] != body.toToken:
        raise HTTPException(409, "No matching quote on file — call /defi/quote first")

    def blocked(reason):
        transactions_db.insert(0, {
            "id": f"tx_{int(time.time()*1000)}_{secrets.token_hex(3)}",
            "name": f"Swap {body.fromToken} -> {body.toToken}",
            "agentId": body.agentId, "agentName": agent["name"],
            "type": "out", "amount": quoted["notional"], "chain": "Base",
            "address": agent["shortAddr"],
            "timestamp": datetime.utcnow().strftime("%H:%M"),
            "status": "blocked", "reason": reason, "hash": body.txHash, "real": True,
        })

    trust.check_trust(agent, quoted["notional"])
    x407.check_limits(agent, quoted["notional"], blocked_cb=blocked)

    try:
        result = dex.verify_swap_onchain(body.txHash, agent["fullAddr"], body.fromToken, body.toToken, quoted["amountIn"], not_before_block=quoted.get("quotedAtBlock"))
    except HTTPException as e:
        blocked(str(e.detail))
        raise

    x407.mark_tx_consumed(body.txHash)
    agent["spentToday"] += quoted["notional"]
    agent["txCount"] += 1
    tx = {
        "id": f"tx_{int(time.time()*1000)}_{secrets.token_hex(3)}",
        "name": f"Swap {body.fromToken} -> {body.toToken}",
        "agentId": body.agentId, "agentName": agent["name"],
        "type": "out", "amount": quoted["notional"], "chain": "Base",
        "address": agent["shortAddr"],
        "timestamp": datetime.utcnow().strftime("%H:%M"),
        "status": "confirmed", "hash": result["txHash"], "real": True,
    }
    transactions_db.insert(0, tx)
    del _last_defi_quote[body.agentId]
    return {"ok": True, "transaction": tx}

@app.post("/defi/reason")
def defi_reason(body: DefiReasonRequest):
    """Advisory-only GPT insight on a quoted swap. Fails soft — never blocks the swap."""
    agent = agents_db.get(body.agentId)
    if not agent:
        raise HTTPException(404, "Agent not found")

    prompt = (
        f"An autonomous agent wants to swap {body.amountIn} {body.fromToken} for "
        f"~{body.amountOut:.4f} {body.toToken} on Base (Uniswap V3, {body.fee/10000}% pool). "
        f"Its daily limit is ${agent['dailyLimit']}, per-tx cap ${agent['perTxLimit']}, "
        f"spent so far today ${agent['spentToday']}. Give a brief risk/sanity assessment."
    )
    try:
        insight = ai_providers.gpt_reason(prompt)
    except Exception:
        insight = None
    return {"insight": insight}

@app.post("/finance/rationale")
def finance_rationale(body: FinanceRationaleRequest):
    """Advisory-only Gemini rationale for a flagged better deal. Fails soft."""
    prompt = (
        f"A user's bill '{body.billName}' currently costs ${body.amount:.2f}/mo. "
        f"A cheaper equivalent is available at ${body.betterDealAmount:.2f}/mo. "
        "Explain in one short sentence why switching makes sense."
    )
    try:
        insight = ai_providers.gemini_reason(prompt)
    except Exception:
        insight = None
    return {"insight": insight}

@app.post("/travel/rationale")
def travel_rationale(body: TravelRationaleRequest):
    """Advisory-only Gemini rationale for the top travel option. Fails soft."""
    options_desc = "; ".join(f"{o.name} ({o.type}, ${o.price:.2f})" for o in body.options)
    prompt = (
        f"A user is searching travel options for {body.destination}: {options_desc}. "
        "In one short sentence, recommend the best value option and say why."
    )
    try:
        insight = ai_providers.gemini_reason(prompt)
    except Exception:
        insight = None
    return {"insight": insight}

@app.post("/payments/reason")
def payment_reason(body: PaymentReasonRequest):
    """Advisory-only Grok insight on a generic API/compute payment. Fails soft."""
    prompt = f"An autonomous agent is about to pay ${body.amount:.4f} USDC for: {body.description}."
    try:
        insight = ai_providers.grok_reason(prompt)
    except Exception:
        insight = None
    return {"insight": insight}

@app.post("/agents/research/recommend-sources")
def recommend_sources(body: ResearchRecommendRequest):
    """Advisory-only DeepSeek suggestion on which demo sources fit a topic. Fails soft."""
    catalog = "; ".join(f"{sid} ({info['name']}: {info['description']})" for sid, info in x407.DEMO_SOURCES.items())
    prompt = f"Research topic: '{body.topic}'. Available sources: {catalog}. Which sources best fit, and why?"
    try:
        insight = ai_providers.deepseek_reason(prompt)
    except Exception:
        insight = None
    return {"insight": insight}

@app.post("/wallet/summary-insight")
def wallet_summary_insight(body: WalletSummaryRequest):
    """Advisory-only Kimi spending-pattern summary across transaction history. Fails soft."""
    lines = "; ".join(
        f"{t.get('name','?')} ${t.get('amount',0)} ({t.get('type','?')}, {t.get('status','?')}, agent={t.get('agentName','?')})"
        for t in body.transactions[:30]
    )
    prompt = f"Total portfolio value ${body.totalUsd:.2f}. Recent transactions: {lines or 'none yet'}. Summarize spending patterns."
    try:
        insight = ai_providers.kimi_reason(prompt)
    except Exception:
        insight = None
    return {"insight": insight}

# ── Research (LLM synthesis over paid-for data) ────────────────────────────────
@app.post("/agents/research/synthesize")
def synthesize_research(body: SynthesizeRequest):
    try:
        report = llm.synthesize_report(body.topic, body.snippets)
    except (RuntimeError, anthropic.APIError) as e:
        raise HTTPException(500, str(e))
    return {"report": report}

# ── Agent chat (Claude dispatcher — proposes actions, never executes them) ────
TOOL_BY_FLOW: Dict[str, Dict[str, Any]] = {
    "research": {
        "name": "propose_research",
        "description": "Propose a research task for the user to review and pay for.",
        "input_schema": {
            "type": "object",
            "properties": {
                "topic": {"type": "string", "description": "The research topic"},
                "sourceIds": {
                    "type": "array",
                    "items": {"type": "string", "enum": list(x407.DEMO_SOURCES.keys())},
                    "description": "Which paid data sources to consult",
                },
            },
            "required": ["topic", "sourceIds"],
        },
    },
    "defi": {
        "name": "propose_swap",
        "description": "Propose a token swap for the user to review and sign.",
        "input_schema": {
            "type": "object",
            "properties": {
                "fromToken": {"type": "string", "enum": ["ETH", "USDC"]},
                "amountIn": {"type": "number"},
            },
            "required": ["fromToken", "amountIn"],
        },
    },
    "finance": {
        "name": "propose_bill",
        "description": "Propose adding a bill for the user to review, confirm, and pay in real USDC.",
        "input_schema": {
            "type": "object",
            "properties": {
                "billName": {"type": "string"},
                "amount": {"type": "number", "description": "Amount in USDC, if the user mentioned one"},
                "payToAddress": {"type": "string", "description": "Recipient wallet address, if the user provided one"},
            },
            "required": ["billName"],
        },
    },
    "travel": {
        "name": "propose_travel_search",
        "description": "Propose searching for flights/hotels for the user to review and book.",
        "input_schema": {
            "type": "object",
            "properties": {
                "destination": {"type": "string"},
                "maxBudget": {"type": "number"},
            },
            "required": ["destination"],
        },
    },
    "api": {
        "name": "propose_api_payment",
        "description": "Propose paying for an API/compute resource.",
        "input_schema": {
            "type": "object",
            "properties": {"resourceUrl": {"type": "string"}},
            "required": [],
        },
    },
    "refund": {
        "name": "propose_refund",
        "description": "Propose issuing a customer refund for the user to review, confirm, and pay in real USDC.",
        "input_schema": {
            "type": "object",
            "properties": {
                "customerName": {"type": "string"},
                "reason": {"type": "string"},
                "amount": {"type": "number", "description": "Amount in USDC, if the user mentioned one"},
                "payToAddress": {"type": "string", "description": "Customer's wallet address, if provided"},
            },
            "required": ["customerName"],
        },
    },
    "grocery": {
        "name": "propose_grocery_item",
        "description": "Propose adding an item to the shopping list for the user to review, confirm, and pay in real USDC.",
        "input_schema": {
            "type": "object",
            "properties": {
                "item": {"type": "string"},
                "maxPrice": {"type": "number", "description": "Target max price in USDC, if the user mentioned one"},
                "payToAddress": {"type": "string", "description": "Store/seller wallet address, if provided"},
            },
            "required": ["item"],
        },
    },
    "triage": {
        "name": "propose_triage",
        "description": "Propose paying to triage a log snippet or alert for the user to review and confirm.",
        "input_schema": {
            "type": "object",
            "properties": {"logText": {"type": "string", "description": "The log snippet or alert payload to triage"}},
            "required": ["logText"],
        },
    },
    "dependency": {
        "name": "propose_dependency_check",
        "description": "Propose paying to check a package for known vulnerabilities for the user to review and confirm.",
        "input_schema": {
            "type": "object",
            "properties": {
                "package": {"type": "string"},
                "ecosystem": {"type": "string", "description": "e.g. npm, PyPI, Go — defaults to npm"},
            },
            "required": ["package"],
        },
    },
    "document": {
        "name": "propose_document_filing",
        "description": "Propose paying to classify and file a document/email for the user to review and confirm.",
        "input_schema": {
            "type": "object",
            "properties": {"documentText": {"type": "string", "description": "The email or document text to file"}},
            "required": ["documentText"],
        },
    },
    "calendar": {
        "name": "propose_appointment",
        "description": "Propose paying to schedule an appointment for the user to review and confirm.",
        "input_schema": {
            "type": "object",
            "properties": {"description": {"type": "string", "description": "Plain-language description of the appointment"}},
            "required": ["description"],
        },
    },
    "formfiller": {
        "name": "propose_form_fill",
        "description": "Propose paying to fill out a form from source data for the user to review and confirm.",
        "input_schema": {
            "type": "object",
            "properties": {"formText": {"type": "string", "description": "The target fields and the source data to pull values from"}},
            "required": ["formText"],
        },
    },
    "receipt": {
        "name": "propose_receipt_log",
        "description": "Propose paying to parse and log a receipt/expense for the user to review and confirm.",
        "input_schema": {
            "type": "object",
            "properties": {"receiptText": {"type": "string", "description": "The receipt or expense line item text"}},
            "required": ["receiptText"],
        },
    },
}

@app.post("/agents/chat")
def agent_chat(body: ChatRequest):
    agent = agents_db.get(body.agentId)
    if not agent:
        raise HTTPException(404, "Agent not found")

    tool = TOOL_BY_FLOW.get(body.flowType)
    custom_rules = (agent.get("customRules") or "").strip()
    system = (
        f"You are {agent['name']}, an autonomous crypto agent talking to your owner. "
        f"Your allowed actions are: {', '.join(agent['allowedActions'])}. "
        f"Daily limit ${agent['dailyLimit']}, per-transaction cap ${agent['perTxLimit']}, "
        f"spent so far today ${agent['spentToday']}. "
        + (f"Your owner also set these specific rules for you — follow them: {custom_rules} " if custom_rules else "")
        + "If the user describes a concrete task you can help with, call the matching tool "
        "with your best-guess parameters instead of asking clarifying questions — the user "
        "will review and confirm the exact details before anything executes. "
        "For general questions, just answer directly in plain text."
    )
    messages = [{"role": m.role, "content": m.text} for m in body.history]
    messages.append({"role": "user", "content": body.message})

    try:
        response = ai_providers.claude_chat(system, messages, tools=[tool] if tool else None)
    except (RuntimeError, anthropic.APIError) as e:
        raise HTTPException(500, str(e))

    reply_parts = []
    proposed_action = None
    for block in response.content:
        if block.type == "text":
            reply_parts.append(block.text)
        elif block.type == "tool_use":
            proposed_action = {"type": body.flowType, "params": block.input}

    return {"reply": " ".join(reply_parts).strip(), "proposedAction": proposed_action}

# ── Transactions ──────────────────────────────────────────────────────────────
@app.get("/transactions")
def list_transactions(type: Optional[str] = None, agentId: Optional[str] = None, visitorId: Optional[str] = None):
    txs = transactions_db
    if type == "blocked":
        txs = [t for t in txs if t["status"] == "blocked"]
    elif type and type != "all":
        txs = [t for t in txs if t["type"] == type and t["status"] != "blocked"]
    if agentId:
        txs = [t for t in txs if t["agentId"] == agentId]
    if visitorId:
        # transactions don't carry visitorId directly — join through the owning
        # agent, same isolation rule as GET /agents (UI isolation, not a security
        # boundary, since there's no login system behind any of this).
        own_ids = {a["id"] for a in agents_db.values() if a.get("visitorId") == visitorId}
        txs = [t for t in txs if t["agentId"] in own_ids]
    return {"transactions": txs}

# ── Wallet ────────────────────────────────────────────────────────────────────
@app.get("/wallet")
def wallet_summary():
    total = sum(a.get("balance", 0) for a in agents_db.values()) or 9451.60
    return {
        "totalUsd": round(total, 2),
        "tokens": [
            {"symbol": "ETH",  "name": "Ethereum", "amount": 1.842,   "usdValue": 6210.40, "chains": ["Base","Arbitrum","Ethereum"], "change24h": 2.4},
            {"symbol": "USDC", "name": "USDC",     "amount": 2400.00, "usdValue": 2400.00, "chains": ["Base","Ethereum"],            "change24h": 0.01},
            {"symbol": "USDT", "name": "USDT",     "amount": 841.20,  "usdValue": 841.20,  "chains": ["Arbitrum"],                   "change24h": -0.02},
        ],
        "chains": [
            {"name": "Base",     "pct": 48, "usd": 4536.77},
            {"name": "Arbitrum", "pct": 30, "usd": 2835.48},
            {"name": "Ethereum", "pct": 22, "usd": 2079.35},
        ],
    }

if __name__ == "__main__":
    import uvicorn
    print("\n🦅 x407 API starting on http://localhost:8000")
    print("📖 Docs at http://localhost:8000/docs\n")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
