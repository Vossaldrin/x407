# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

x407 is a decentralized marketplace where autonomous AI agents get real on-chain wallets (Base
mainnet) and pay for actions/resources via real HTTP 402 (Payment Required) semantics — the same
wire protocol the emerging x402 standard uses. Read the "What's actually real here" table in
README.md before making claims about what's live vs. roadmap: real wallets, real USDC payments,
and real Uniswap V3 swaps execute against live infrastructure; persistent storage does not exist
(everything is in-memory and resets on backend restart), and the on-chain contracts in
`contracts/` are built + tested but not deployed to any network yet.

## Project shape

Two independent services, not a monorepo with a shared build:

- `app/`, `components/`, `lib/` — Next.js 16 / TypeScript frontend.
- `backend/` — FastAPI / Python backend: real wallets, on-chain payment settlement, DEX, multi-provider AI routing.
- `contracts/` — Foundry/Solidity contracts, a separate toolchain, not wired into the live app yet.

There's no build step tying frontend and backend together — run them separately, or together via `./start-x407.sh`.

## Commands

### Frontend (repo root)
```bash
npm run dev          # Next.js dev server → http://localhost:3000
npm run build         # production build
npm run start          # serve production build
npm run lint            # next lint
npx tsc --noEmit        # typecheck — required clean before any PR
```

### Backend
```bash
cd backend
pip install -r requirements.txt
cp ../.env.example .env   # fill in backend/.env — see comments for which vars go where
python main.py             # or: uvicorn main:app --reload --port 8000
# → http://localhost:8000, docs at http://localhost:8000/docs
```
No Python test suite exists — verify backend route changes by hitting them with `curl` against a
real hired agent (see README smoke-test flow), per CONTRIBUTING.md.

### Both at once
```bash
./start-x407.sh   # boots backend (uvicorn, :8000) then frontend (next dev, :3000) from $HOME/Downloads/x407
```

### Contracts (`contracts/`, separate toolchain — Foundry)
```bash
cd contracts
forge install     # fetches forge-std + OpenZeppelin into lib/ (gitignored)
forge build
forge test
forge test --match-contract TaskEscrowTest   # single contract
forge test --match-test testName -vvvv        # single test, verbose traces
```
Deploying (Base Sepolia only, not mainnet) needs `contracts/.env` (`DEPLOYER_PRIVATE_KEY` — a
dedicated testnet-only wallet, `BASE_SEPOLIA_RPC_URL`, `BASESCAN_API_KEY`):
```bash
source .env
forge script script/Deploy.s.sol:Deploy --rpc-url base_sepolia --broadcast --verify -vvvv
```
Deployment records land in `contracts/broadcast/` and are committed as the paper trail for what's actually deployed where.

## Architecture

### Frontend ↔ backend
The frontend never talks to chains or contracts directly for state — `lib/store.tsx` is the
single client-side state hub (React Context) and the only thing that calls the FastAPI backend
(`NEXT_PUBLIC_API_URL`, defaults to `http://localhost:8000`). Page components under `app/*` and
UI in `components/*` read/act through this store rather than fetching independently.

### The payment flow (why it's split across three files)
Agent private keys are never sent to or stored by the backend — only ever held transiently in the
browser to sign one transaction. This invariant shapes the whole payment path and must not be
broken by future changes:

1. `backend/x407.py` — builds/returns the HTTP 402 challenge (`accepts` array: scheme, network,
   amount, asset, payTo) for a resource, and *verifies* a completed on-chain tx against it. It
   never holds or asks for a private key.
2. `lib/x407-agent-pay.ts` (browser-only) — takes the agent's private key for a single call,
   signs and broadcasts the plain ERC-20 USDC transfer directly from the browser, returns the tx
   hash. The key never crosses into a network request to our own backend.
3. `backend/main.py` (`/payments/quote`, `/payments/execute`) — orchestrates the two: hands the
   frontend the quote, then takes the resulting hash and asks `x407.py` to verify it before
   marking the payment settled.

`backend/dex.py` + `lib/defi-swap.ts` mirror this same split for Uniswap V3 swaps (quote
server-side, sign/broadcast client-side). Any change touching `backend/x407.py`, `backend/dex.py`,
`lib/x407-agent-pay.ts`, or `lib/defi-swap.ts` moves real money and needs extra care — these are
the only files that sign or verify on-chain transactions.

### Backend route map (`backend/main.py`, ~890 lines, all routes in one file)
- `/marketplace*` — the static 12-template catalogue + hire flow.
- `/agents*` — CRUD over in-memory hired-agent records (spend limits, allowed actions, expiry — enforced here, not on-chain yet).
- `/payments/quote`, `/payments/execute`, `/payments` — the x407 settlement flow described above.
- `/defi/quote`, `/defi/execute`, `/defi/reason` — Uniswap V3 swap quoting/execution + AI rationale.
- `/agents/chat` — Claude tool-use chat that proposes actions for the user to confirm (core flow, fails loud).
- `/agents/research/*`, `/finance/rationale`, `/travel/rationale`, `/payments/reason`, `/wallet/summary-insight` — advisory AI insights via `backend/ai_providers.py` (Claude, GPT, Gemini, Grok, DeepSeek, Kimi). These **must fail soft** — catch and return a null insight, never raise past the caller — since most providers have no key configured.
- `/wallet`, `/transactions` — read-only views over the same in-memory state.

### Contracts (`contracts/src/`, not yet integrated)
Four additive contracts, each targeting a piece of the app currently done server-side or as a
static list: `TaskEscrow.sol` (conditional multi-step payouts vs. direct quote-and-pay),
`AgentRegistry.sol` (permissionless listings vs. the hardcoded template catalogue),
`PaymentStream.sol` (continuous pay-per-second vs. per-action settlement), `SpendGuardModule.sol`
(on-chain spend caps vs. `check_limits()` in `backend/x407.py`). All use OpenZeppelin
`ReentrancyGuard`, checks-effects-interactions, and pull-payment (credit an internal balance,
separate `withdraw()`) so one misbehaving counterparty can't block others' funds. Planned
integration points once deployed: `backend/x407.py` (web3.py → `TaskEscrow`) and `lib/store.tsx`
(ethers.js → read `AgentRegistry` alongside the static catalogue) — neither is wired up yet.

## Working conventions

- Don't build features on top of roadmap items (escrow, permissionless listings, persistent DB)
  as if they already exist — check the README status table first.
- Don't fabricate metrics, traction numbers, or "coming soon" claims in UI copy or docs; if
  something isn't built, say so, matching the existing Roadmap section's convention.
- Styling is CSS variables + inline styles — no Tailwind, no CSS-in-JS library.
