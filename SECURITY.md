# Security Policy

x407 moves real money (Base mainnet USDC) through agent-controlled wallets. Take security reports here seriously.

## Reporting a vulnerability

Please do **not** open a public GitHub issue for security vulnerabilities. Instead, email the maintainer directly or use GitHub's private vulnerability reporting (Security tab → "Report a vulnerability") on this repo.

Include:
- What you found and where (file/endpoint).
- Whether it could lead to fund loss, key exposure, or unauthorized transactions.
- Steps to reproduce, if applicable.

## Scope

Particularly interested in reports affecting:
- `backend/x407.py`, `backend/dex.py` — on-chain payment/swap verification, spend-limit enforcement.
- `lib/x407-agent-pay.ts`, `lib/defi-swap.ts` — client-side transaction signing.
- Any path where an agent's private key could be sent to, logged by, or persisted on the backend (it should never be — signing happens exclusively in the browser).
- Spend-limit or allowed-action bypasses that let an agent execute outside its configured guardrails.

## Known, accepted risks (not vulnerabilities — already documented)

- The backend has no persistent storage — all state is in-memory and resets on restart. This is a known limitation (see README roadmap), not a security bug to report.
- There's no smart-contract escrow yet — payments are direct wallet-to-wallet transfers, by design at this stage.
