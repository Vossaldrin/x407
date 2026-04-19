# Arno — Agent OS

> Give AI agents a real passport + autonomous wallet. They can finally work.

Arno is the operating layer for autonomous AI agents. Each agent gets a cryptographically verifiable passport with programmable spending rules, and a multi-chain wallet to pay for APIs, data, compute — all within guardrails you define.

---

## Quickstart

### Requirements
- Node.js v18+
- Python 3.9+ (optional, for backend)

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/arno.git
cd arno
npm install
cp .env.example .env.local
```

### 2. Run frontend

```bash
npm run dev
# → http://localhost:3000
```

### 3. Run Python backend (optional)

```bash
cd backend
pip install -r requirements.txt
python main.py
# → http://localhost:8000
# → http://localhost:8000/docs
```

---

## Deploy

### Vercel (frontend)

```bash
npx vercel --yes
# → https://arno-xxxx.vercel.app
```

Or: vercel.com → New Project → Import from GitHub → Deploy (zero config).

### Railway (Python backend)

```bash
cd backend
railway init && railway up
```

Then set `PYTHON_API=https://your-backend.railway.app` in Vercel env vars.

---

## Test the API

```bash
# Agents
curl http://localhost:3000/api/agents
curl -X POST http://localhost:3000/api/agents \
  -H "Content-Type: application/json" \
  -d '{"name":"TestBot","chain":"Base","dailyLimit":100,"actions":["pay_api"]}'

# Transactions
curl http://localhost:3000/api/transactions
curl http://localhost:3000/api/transactions?type=blocked

# Wallet
curl http://localhost:3000/api/wallet

# Payments
curl -X POST http://localhost:3000/api/payments \
  -H "Content-Type: application/json" \
  -d '{"agentId":"ag_01","recipient":"0xabc","amount":4.20,"description":"OpenAI API","chain":"Base"}'
```

---

## Project Structure

```
arno/
├── app/
│   ├── layout.tsx            # Root layout + metadata
│   ├── page.tsx              # Overview dashboard
│   ├── loading.tsx           # Skeleton loader
│   ├── error.tsx             # Error boundary
│   ├── not-found.tsx         # 404 page
│   ├── passports/page.tsx    # Passport cards
│   ├── create/page.tsx       # Create agent + live preview
│   ├── wallet/page.tsx       # Portfolio + balances
│   ├── transactions/page.tsx # x402 payment history
│   └── api/
│       ├── agents/route.ts
│       ├── transactions/route.ts
│       ├── wallet/route.ts
│       └── payments/route.ts
├── components/
│   ├── layout/
│   │   ├── Shell.tsx         # Client layout wrapper
│   │   ├── Sidebar.tsx       # Navigation + network status
│   │   └── Topbar.tsx        # Header + live ticker tape
│   └── ui/
│       └── index.tsx         # Card, Stat, Badge, Avatar, Btn, Progress, Tabs...
├── lib/
│   └── store.tsx             # State + seed data (swap for API calls)
├── backend/
│   ├── main.py               # FastAPI backend
│   └── requirements.txt
├── .env.example
├── vercel.json
└── README.md
```

---

## Wiring Real Python Logic

In `backend/main.py`, every route has a TODO comment:

```python
# create_agent():
from eth_account import Account
acct = Account.create()
full_addr = acct.address

# make_payment():
from autonomix.payments import x402_pay
result = x402_pay(agent["fullAddr"], body.recipient, body.amount, body.chain)
```

In `app/api/*/route.ts`, uncomment the fetch calls:

```typescript
const res = await fetch(`${process.env.PYTHON_API}/agents`)
return NextResponse.json(await res.json())
```

---

## Stack

| Layer     | Tech                                  |
|-----------|---------------------------------------|
| Frontend  | Next.js 14, TypeScript                |
| Styling   | CSS variables + inline styles         |
| Fonts     | Space Grotesk + JetBrains Mono        |
| Backend   | Python, FastAPI, uvicorn              |
| Web3      | eth-account, web3.py                  |
| Payments  | x402 protocol                         |
| Deploy    | Vercel (frontend) + Railway (backend) |

---

## Roadmap

- [x] Agent Passport creation with rules
- [x] x402 payment simulation
- [x] Multi-chain support (Base, ETH, Arbitrum, Optimism, Polygon)
- [x] Production Next.js UI
- [x] REST API routes
- [x] FastAPI Python backend
- [ ] Real eth-account keypair generation
- [ ] Live on-chain balance fetch
- [ ] Real x402 payment execution
- [ ] WalletConnect wallet connection
- [ ] Agent audit logs + replay
- [ ] Personal AI Finance Agent mode

---

MIT License
