# Contributing to x407

## Project shape

This is two services, not a multi-package monorepo:

- `app/`, `components/`, `lib/` — Next.js 16 / TypeScript frontend.
- `backend/` — FastAPI / Python backend (real wallets, real on-chain payments, DEX, AI routing).

There's no build step tying them together — run both locally per the README's Quickstart, or `./start-x407.sh` to boot both at once.

## Before you start

1. Read the "What's actually real here" table in the README — it's the ground truth on what's live vs. roadmap. Don't build on top of the roadmap items (escrow, permissionless listings) as if they exist yet.
2. Real money moves through this app (Base mainnet USDC, real Uniswap V3 swaps). Any change touching `backend/x407.py`, `backend/dex.py`, `lib/x407-agent-pay.ts`, or `lib/defi-swap.ts` needs extra care — these are the only files that sign or verify on-chain transactions.
3. Agent private keys are never sent to or stored by the backend — only ever held transiently in the browser to sign a single transaction. Don't introduce a code path that changes this.

## Making a change

1. `npx tsc --noEmit` and `npm run build` before opening a PR — both must pass clean.
2. If you touch a backend route, hit it with `curl` against a real hired agent (see the smoke-test pattern in the README) — the Python side has no test suite yet, so manual verification is the bar.
3. Don't fabricate metrics, traction numbers, or "coming soon" claims in UI copy or docs. If a feature isn't built, say so — see the Roadmap section in the README for the honest convention this project follows.
4. Advisory AI calls (`backend/ai_providers.py`, everything except `claude_chat`) must fail soft — catch and return a null insight, never raise past the caller. Core flows (chat, research synthesis) intentionally fail loud.

## Reporting issues

Open a GitHub issue. For anything touching wallet security or payment verification, see `SECURITY.md` instead of filing a public issue.
