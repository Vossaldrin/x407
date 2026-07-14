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
from eth_account import Account
import time, secrets, httpx
import x407
import llm
import dex
import ai_providers

app = FastAPI(title="x407 API", version="0.3.0", docs_url="/docs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── In-memory stores ──────────────────────────────────────────────────────────
agents_db: dict = {}
transactions_db: list = []

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
        "featured": True,
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
        "featured": True,
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
        "id": "tpl_news_curator",
        "name": "News Curator",
        "emoji": "📰",
        "category": "Research",
        "description": "Aggregates and summarises news across sources, delivers a daily briefing.",
        "price": "Free",
        "rating": 4.5,
        "hiredCount": 6700,
        "defaultActions": ["fetch_data", "pay_api"],
        "defaultDailyLimit": 10.0,
        "defaultPerTxLimit": 2.0,
        "color": "amber",
        "featured": False,
    },
    {
        "id": "tpl_price_hawk",
        "name": "Price Hawk",
        "emoji": "🦅",
        "category": "Shopping",
        "description": "Tracks prices across retailers and auto-buys when your target price is hit.",
        "price": "$3/mo",
        "rating": 4.7,
        "hiredCount": 3300,
        "defaultActions": ["shop", "fetch_data", "pay_api"],
        "defaultDailyLimit": 500.0,
        "defaultPerTxLimit": 200.0,
        "color": "iris",
        "featured": False,
    },
    {
        "id": "tpl_dev_ops",
        "name": "DevOps Agent",
        "emoji": "⚙️",
        "category": "Dev tools",
        "description": "Monitors your infra, spins up instances, and pays for cloud services autonomously.",
        "price": "$15/mo",
        "rating": 4.8,
        "hiredCount": 980,
        "defaultActions": ["pay_api", "fetch_data", "deploy"],
        "defaultDailyLimit": 300.0,
        "defaultPerTxLimit": 100.0,
        "color": "rose",
        "featured": False,
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
        "featured": True,
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
        "id": "tpl_lead_gen",
        "name": "Lead Generation Agent",
        "emoji": "📊",
        "category": "Business",
        "description": "Pays for data and outreach tools, runs campaigns, and scales prospecting within your budget.",
        "price": "$14/mo",
        "rating": 4.7,
        "hiredCount": 890,
        "defaultActions": ["pay_api", "fetch_data", "run_campaign"],
        "defaultDailyLimit": 400.0,
        "defaultPerTxLimit": 100.0,
        "color": "amber",
        "featured": False,
    },
    {
        "id": "tpl_smart_assistant",
        "name": "Smart Assistant Agent",
        "emoji": "🧭",
        "category": "Personal",
        "description": "An all-in-one agent for shopping, price monitoring, booking, and everyday optimization.",
        "price": "$11/mo",
        "rating": 4.9,
        "hiredCount": 3600,
        "defaultActions": ["shop", "book_travel", "fetch_data", "pay_api"],
        "defaultDailyLimit": 300.0,
        "defaultPerTxLimit": 100.0,
        "color": "rose",
        "featured": True,
    },
]

# ── Models ────────────────────────────────────────────────────────────────────
class AgentCreate(BaseModel):
    name: str
    chain: str = "Base"
    dailyLimit: float = 500.0
    perTxLimit: float = 50.0
    expiry: str = "2026-12-31"
    actions: List[str] = ["pay_api", "fetch_data"]
    ownerWallet: Optional[str] = None
    color: str = "emerald"

class HireRequest(BaseModel):
    templateId: str
    chain: str = "Base"
    dailyLimit: Optional[float] = None
    perTxLimit: Optional[float] = None
    expiry: str = "2026-12-31"
    ownerWallet: Optional[str] = None
    actions: Optional[List[str]] = None

class PaymentRequest(BaseModel):
    agentId: str
    recipient: str
    amount: float
    description: str
    chain: str = "Base"

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
    acct = Account.create()
    agent_id = f"ag_{int(time.time() * 1000)}_{secrets.token_hex(3)}"
    initials = "".join(w[0] for w in body.name.split() if w)[:2].upper()
    return {
        "id": agent_id,
        "name": body.name,
        "shortAddr": short_addr(acct.address),
        "fullAddr": acct.address,
        "privateKey": acct.key.hex(),
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
        "templateId": template_id,
        "createdAt": datetime.utcnow().isoformat()[:10],
    }

def safe(agent: dict) -> dict:
    return {k: v for k, v in agent.items() if k != "privateKey"}

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
        chain=body.chain,
        dailyLimit=body.dailyLimit or tpl["defaultDailyLimit"],
        perTxLimit=body.perTxLimit or tpl["defaultPerTxLimit"],
        expiry=body.expiry,
        actions=body.actions or tpl["defaultActions"],
        ownerWallet=body.ownerWallet,
        color=tpl["color"],
    )
    agent = build_agent(agent_body, template_id=body.templateId)
    agent["emoji"] = tpl.get("emoji", "🤖")
    agent["category"] = tpl["category"]
    private_key = agent.pop("privateKey")
    agents_db[agent["id"]] = agent

    return {
        "agent": agent,
        "privateKey": private_key,
        "warning": "Save your private key now — it will never be shown again.",
    }

# ── Agents ────────────────────────────────────────────────────────────────────
@app.get("/agents")
def list_agents():
    return {"agents": [safe(a) for a in agents_db.values()]}

@app.post("/agents", status_code=201)
def create_agent(body: AgentCreate):
    agent = build_agent(body)
    private_key = agent.pop("privateKey")
    agents_db[agent["id"]] = agent
    return {"agent": agent, "privateKey": private_key,
            "warning": "Save your private key now — it will never be shown again."}

@app.get("/agents/{agent_id}")
def get_agent(agent_id: str):
    if agent_id not in agents_db:
        raise HTTPException(404, "Agent not found")
    return safe(agents_db[agent_id])

@app.patch("/agents/{agent_id}")
def update_agent(agent_id: str, patch: dict):
    if agent_id not in agents_db:
        raise HTTPException(404, "Agent not found")
    patch.pop("privateKey", None)
    patch.pop("fullAddr", None)
    agents_db[agent_id].update(patch)
    return safe(agents_db[agent_id])

@app.delete("/agents/{agent_id}")
def revoke_agent(agent_id: str):
    if agent_id not in agents_db:
        raise HTTPException(404, "Agent not found")
    agents_db[agent_id]["status"] = "expired"
    return {"ok": True, "id": agent_id, "status": "expired"}

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
        "id": f"tx_{int(time.time()*1000)}",
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
        "id": f"tx_{int(time.time()*1000)}",
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

    if not tx_hash:
        return JSONResponse(status_code=402, content=x407.demo_quote_response(source_id))

    price = x407.DEMO_SOURCES[source_id]["price"]
    result = x407.verify_onchain_payment(tx_hash, payer or "", x407.DEMO_MERCHANT_ADDRESS, price)
    return JSONResponse(status_code=200, content=x407.demo_unlock_response(source_id, result["amount"], result["txHash"]))

@app.api_route("/demo/compute-api", methods=["GET", "POST"])
async def demo_compute_api(request: Request):
    return await _demo_resource_handler("compute-api", request)

@app.api_route("/demo/resource/{source_id}", methods=["GET", "POST"])
async def demo_resource(source_id: str, request: Request):
    return await _demo_resource_handler(source_id, request)

@app.post("/payments/quote")
async def quote_payment(body: QuoteRequest):
    agent = agents_db.get(body.agentId)
    if not agent:
        raise HTTPException(404, "Agent not found")

    resource_url = body.resourceUrl or f"{x407.SELF_API_URL}/demo/compute-api"
    async with httpx.AsyncClient() as client:
        try:
            res = await client.get(resource_url, timeout=10)
        except httpx.HTTPError as e:
            raise HTTPException(502, f"Could not reach resource: {e}")

    if res.status_code != 402:
        raise HTTPException(502, "Resource did not return a 402 payment quote")

    quote = res.json()
    accept = (quote.get("accepts") or [None])[0]
    if not accept:
        raise HTTPException(502, "Malformed 402 response: no 'accepts' entry")

    amount = float(accept["amount"])
    x407.check_limits(agent, amount)

    _last_quote[body.agentId] = {"resourceUrl": resource_url, "accept": accept}
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
            "id": f"tx_{int(time.time()*1000)}",
            "name": accept.get("description", "x407 payment"),
            "agentId": body.agentId, "agentName": agent["name"],
            "type": "out", "amount": amount, "chain": "Base",
            "address": agent["shortAddr"],
            "timestamp": datetime.utcnow().strftime("%H:%M"),
            "status": "blocked", "reason": reason, "hash": body.txHash, "real": True,
        })

    x407.check_limits(agent, amount, blocked_cb=blocked)

    try:
        result = x407.verify_onchain_payment(body.txHash, agent["fullAddr"], accept["payTo"], amount)
    except HTTPException as e:
        blocked(str(e.detail))
        raise

    async with httpx.AsyncClient() as client:
        unlocked = await client.get(quoted["resourceUrl"], params={"txHash": body.txHash, "payer": agent["fullAddr"]}, timeout=15)
    if unlocked.status_code != 200:
        blocked("resource_did_not_unlock")
        raise HTTPException(502, "Payment verified on-chain but resource did not unlock")

    agent["spentToday"] += result["amount"]
    agent["txCount"] += 1
    tx = {
        "id": f"tx_{int(time.time()*1000)}",
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
    x407.check_limits(agent, notional)

    _last_defi_quote[agentId] = {"fromToken": fromToken, "toToken": toToken, "amountIn": amountIn, "notional": notional}
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
            "id": f"tx_{int(time.time()*1000)}",
            "name": f"Swap {body.fromToken} -> {body.toToken}",
            "agentId": body.agentId, "agentName": agent["name"],
            "type": "out", "amount": quoted["notional"], "chain": "Base",
            "address": agent["shortAddr"],
            "timestamp": datetime.utcnow().strftime("%H:%M"),
            "status": "blocked", "reason": reason, "hash": body.txHash, "real": True,
        })

    x407.check_limits(agent, quoted["notional"], blocked_cb=blocked)

    try:
        result = dex.verify_swap_onchain(body.txHash, agent["fullAddr"], body.fromToken, body.toToken, quoted["amountIn"])
    except HTTPException as e:
        blocked(str(e.detail))
        raise

    agent["spentToday"] += quoted["notional"]
    agent["txCount"] += 1
    tx = {
        "id": f"tx_{int(time.time()*1000)}",
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
    except RuntimeError as e:
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
        "name": "propose_bill_action",
        "description": "Propose paying a bill or switching to a cheaper deal.",
        "input_schema": {
            "type": "object",
            "properties": {
                "billName": {"type": "string"},
                "action": {"type": "string", "enum": ["pay", "switch"]},
            },
            "required": ["billName", "action"],
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
}

@app.post("/agents/chat")
def agent_chat(body: ChatRequest):
    agent = agents_db.get(body.agentId)
    if not agent:
        raise HTTPException(404, "Agent not found")

    tool = TOOL_BY_FLOW.get(body.flowType)
    system = (
        f"You are {agent['name']}, an autonomous crypto agent talking to your owner. "
        f"Your allowed actions are: {', '.join(agent['allowedActions'])}. "
        f"Daily limit ${agent['dailyLimit']}, per-transaction cap ${agent['perTxLimit']}, "
        f"spent so far today ${agent['spentToday']}. "
        "If the user describes a concrete task you can help with, call the matching tool "
        "with your best-guess parameters instead of asking clarifying questions — the user "
        "will review and confirm the exact details before anything executes. "
        "For general questions, just answer directly in plain text."
    )
    messages = [{"role": m.role, "content": m.text} for m in body.history]
    messages.append({"role": "user", "content": body.message})

    try:
        response = ai_providers.claude_chat(system, messages, tools=[tool] if tool else None)
    except RuntimeError as e:
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
def list_transactions(type: Optional[str] = None, agentId: Optional[str] = None):
    txs = transactions_db
    if type == "blocked":
        txs = [t for t in txs if t["status"] == "blocked"]
    elif type and type != "all":
        txs = [t for t in txs if t["type"] == type and t["status"] != "blocked"]
    if agentId:
        txs = [t for t in txs if t["agentId"] == agentId]
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
