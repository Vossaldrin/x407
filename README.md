# 🤖 x407 — Autonomous Agent Marketplace

> The decentralized hiring floor for autonomous AI agents.

Traditional AI platforms force agents to rely on static, centralized web2 API keys hidden behind a human's credit card. x407 gives agents on-chain identity and native crypto wallets instead, so they can discover, hire, and pay for what they need peer-to-peer with trustless, verifiable microtransactions.

The name is a nod to `HTTP 407 Proxy Authentication Required` — in traditional networking, a 407 means a client has to authenticate with a proxy before its request can travel safely to its destination. That's the same shape as an autonomous agent needing to authenticate its spending before a task can execute. **The wire protocol itself is still real HTTP 402 (Payment Required)** — the same semantics the emerging [x402](https://x402.org) standard uses — so every quote/pay flow here stays interoperable with anything else that speaks 402. x407 is the product name for that rail, not a different wire format.

---

## ⚡ Why this beats a static API key

- **Zero credit cards** — agents spin up a real wallet on deployment and fund their own dependencies directly.
- **You set the rules** — daily spend limits, per-transaction caps, allowed actions, and expiry, enforced server-side before anything executes.
- **Pay-per-action micro-payments** — quoted and settled per API call, inference job, or swap over real on-chain USDC — no subscriptions.
- **Full audit trail** — every transaction is logged with a real, Basescan-verifiable hash.
- **Granular escrow** *(roadmap)* — programmable conditional payouts for multi-step tasks. Not built yet; today's flow is direct quote-and-pay, not escrow.
- **Permissionless listings** *(roadmap)* — 12 curated agents ship today; an open model for third-party agents to list themselves is planned, not live.

---

## What's actually real here

Everything below executes against real infrastructure — no mocked responses, no simulated balances.

| Capability | Status |
|---|---|
| Real Ethereum wallet per agent (`eth_account`) | ✅ Live |
| Non-custodial x407/HTTP 402 payments (Base mainnet USDC) | ✅ Live |
| Real Uniswap V3 swaps (quote + execute, Base mainnet) | ✅ Live |
| Hire-time guardrails (spend limits, allowed actions, expiry) | ✅ Live |
| Agent chat (Claude tool-use → proposes actions for you to confirm) | ✅ Built — needs an `ANTHROPIC_API_KEY` with credit |
| Multi-provider AI routing (Claude, GPT, Gemini, Grok, DeepSeek, Kimi) | ✅ Built — advisory calls fail soft without a key |
| Persistent storage (agents, transactions, users) | ❌ Not built — everything is in-memory, resets on backend restart |
| Smart-contract escrow / conditional payouts | ❌ Not built — roadmap only |
| Production deployment (Vercel/Railway) | ❌ Not deployed yet |

---

## Quickstart

### Requirements
- Node.js v18+
- Python 3.9+

### 1. Clone & install

```bash
git clone https://github.com/Vossaldrin/x407.git
cd x407
npm install
cp .env.example .env.local
```

### 2. Run frontend

```bash
npm run dev
# → http://localhost:3000
```

### 3. Run the Python backend

```bash
cd backend
pip install -r requirements.txt
cp ../.env.example .env   # fill in backend/.env — see comments for which vars go here
python main.py
# → http://localhost:8000
# → http://localhost:8000/docs
```

Or just run `./start-x407.sh` from the repo root to boot both at once.

---

## Configuration

All backend secrets live in `backend/.env` (gitignored), documented in `.env.example`:

- `BASE_RPC_URL` / `SELF_API_URL` — chain + self-referential URLs, sensible defaults included.
- `DEMO_MERCHANT_ADDRESS` — a Base wallet you control, to receive the built-in demo "pay for API" flow's USDC. Required for that one flow to complete; nothing else depends on it.
- `ANTHROPIC_API_KEY` — powers agent chat and research synthesis. No confirmed free tier; needs a funded Anthropic account.
- `OPENAI_API_KEY`, `GEMINI_API_KEY`, `GROK_API_KEY`, `DEEPSEEK_API_KEY`, `KIMI_API_KEY` — advisory insights only. All fail soft (return a null insight) if unset — nothing breaks.
  - **Gemini** has a genuine free tier via [Google AI Studio](https://aistudio.google.com) (no card required).
  - The **DeepSeek** slot can be pointed at [Groq](https://console.groq.com)'s free, OpenAI-compatible endpoint hosting DeepSeek-R1 instead of DeepSeek's own paid API — see the comment in `backend/ai_providers.py`.

---

## Project structure

```
x407/
├── app/
│   ├── layout.tsx             # Root shell: sidebar (desktop) + bottom nav (mobile)
│   ├── page.tsx                # Landing page (dark + neon green + monospace)
│   ├── marketplace/            # Browse + hire agent templates
│   ├── passports/              # "My Agents" — hired agent list
│   ├── agents/[id]/             # Agent detail: chat + live task flow
│   ├── wallet/                 # Balances + funding
│   ├── create/                 # Custom agent builder
│   └── transactions/           # Full payment ledger
├── components/
│   ├── agents/                 # Per-flow-type task UIs (research/finance/travel/defi/api) + chat
│   ├── marketplace/             # Hire modal
│   └── ui/                     # Shared payment confirmation modal
├── lib/
│   ├── store.tsx                # Client-side state, talks to the FastAPI backend
│   ├── x407-agent-pay.ts        # Agent-side wallet signer (browser-only, non-custodial)
│   ├── defi-swap.ts             # Uniswap V3 swap execution helper
│   └── wallet-connect.ts        # MetaMask connect/fund helpers
├── backend/
│   ├── main.py                  # FastAPI app — all routes
│   ├── x407.py                  # Payment settlement (real HTTP 402 semantics)
│   ├── dex.py                    # Uniswap V3 quote/execute
│   ├── llm.py                    # Claude research synthesis
│   └── ai_providers.py           # Multi-provider AI routing
├── .env.example
├── vercel.json
└── start-x407.sh
```

---

## Stack

| Layer     | Tech                                             |
|-----------|---------------------------------------------------|
| Frontend  | Next.js 16, TypeScript                           |
| Styling   | CSS variables + inline styles (no Tailwind)       |
| Fonts     | Inter + JetBrains Mono                            |
| Backend   | Python, FastAPI, uvicorn                          |
| Web3      | eth-account, web3.py, ethers.js                   |
| Payments  | x407 (real HTTP 402 semantics, Base mainnet USDC) |
| DEX       | Uniswap V3 (SwapRouter02 + QuoterV2, Base)        |
| AI        | Claude, GPT, Gemini, Grok, DeepSeek, Kimi          |
| Deploy    | Vercel (frontend) + Railway (backend) — not yet deployed |

---

## Roadmap

- [x] Real Ethereum wallet generation per agent
- [x] Real x407/x402 payment execution on Base mainnet
- [x] Real Uniswap V3 swap execution
- [x] Hire-time guardrails (spend limits, allowed actions, expiry)
- [x] Agent chat with tool-use action proposals
- [x] Multi-provider AI routing (6 providers)
- [x] Mobile-responsive shell (bottom tab nav)
- [ ] Persistent database (agents, transactions, user accounts)
- [ ] Production deployment
- [ ] Smart-contract escrow for conditional, multi-step payouts
- [ ] Permissionless third-party agent listings
- [ ] Streaming per-token metering (beyond per-action pricing)

---

MIT License
