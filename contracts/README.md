# x407 contracts

On-chain layer for the roadmap items that used to be server-side-only or narrative: conditional
task payouts, permissionless agent listings, streaming micropayments, and on-chain spend caps.
Built with [Foundry](https://book.getfoundry.sh/). Deployed to **Base Sepolia** (testnet) first —
not mainnet.

## Contracts

| Contract | Replaces / extends | Status |
|---|---|---|
| `TaskEscrow.sol` | Direct quote-and-pay x402 flow, for multi-step tasks needing conditional release | New |
| `AgentRegistry.sol` | The hardcoded 12-template marketplace catalogue | New, additive — catalogue still works |
| `PaymentStream.sol` | Per-action settlement → continuous pay-per-second | New |
| `SpendGuardModule.sol` | Server-side `check_limits()` in `backend/x407.py` | New, on-chain enforcement in parallel |

All four use OpenZeppelin's `ReentrancyGuard`, checks-effects-interactions, and a pull-payment
pattern (state changes credit an internal balance; a separate `withdraw()` moves tokens) so a
misbehaving counterparty can never block anyone else's funds from settling.

## Setup

```bash
cd contracts
forge install   # fetches forge-std + OpenZeppelin into lib/ (gitignored, not committed)
forge build
forge test
```

## Deploying

Needs `contracts/.env` (gitignored — see `.env` for the format already in place):
- `DEPLOYER_PRIVATE_KEY` — a **dedicated, testnet-only** wallet. Never reuse an agent's real key.
- `BASE_SEPOLIA_RPC_URL` — defaults to the public `https://sepolia.base.org`.
- `BASESCAN_API_KEY` — from basescan.org/myapikey, needed for `--verify`.

Fund the deployer address with Base Sepolia ETH from a faucet, then:

```bash
source .env
forge script script/Deploy.s.sol:Deploy \
  --rpc-url base_sepolia \
  --broadcast \
  --verify \
  -vvvv
```

Deployment records (addresses, tx hashes) land in `broadcast/` and are committed — that's the
paper trail for what's actually live where.

## Integration points

- `backend/x407.py` — `web3.py` calls into `TaskEscrow` for the conditional-payout flow.
- `lib/store.tsx` — `ethers.js` reads from `AgentRegistry` to list on-chain-registered agents
  alongside the existing static template catalogue.

Everything else (direct x402 quote-and-pay, DeFi swaps) is unchanged — these contracts are
additive, not a replacement for what's already live.
