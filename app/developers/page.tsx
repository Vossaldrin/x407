'use client'
import { ReactNode } from 'react'

function CodeBlock({ label, children }: { label: string; children: string }) {
  return (
    <div className="protocol-block" style={{ margin: '14px 0 0', maxWidth: '100%' }}>
      <div className="protocol-block-bar">
        <span className="protocol-block-dot" /> {label}
      </div>
      <pre>{children}</pre>
    </div>
  )
}

function Section({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 20, marginBottom: 40 }}>
      <div className="mono" style={{ fontSize: 13, color: 'var(--ink3)', flexShrink: 0, width: 22, paddingTop: 2 }}>{n}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>{title}</div>
        {children}
      </div>
    </div>
  )
}

export default function DevelopersPage() {
  return (
    <div className="animate-up gap-pad" style={{ maxWidth: 780 }}>
      <div style={{ marginBottom: 8 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 8 }}>
          For developers
        </h1>
        <p style={{ fontSize: 14, color: 'var(--ink3)', lineHeight: 1.6 }}>
          x407 isn't only BotMart's backend — it's a plain HTTP API for giving any autonomous
          agent a real on-chain identity, a non-custodial wallet, and a spend policy it can't
          exceed. If your agent needs to pay for something on its own, this is the whole
          integration surface.
        </p>
      </div>

      <div style={{ background: 'var(--yellow-dim)', border: '0.5px solid var(--yellow)', borderRadius: 12, padding: '12px 16px', margin: '20px 0 36px', fontSize: 12, color: 'var(--ink2)', lineHeight: 1.6 }}>
        <strong style={{ color: '#B45309' }}>Early access, be aware:</strong> there's no API-key auth yet —
        every request below works unauthenticated. Agent/transaction data is in-memory and resets
        on every backend restart; nothing is persisted yet. Treat this as a sandbox, not
        production infrastructure, until auth and storage land.
      </div>

      <Section n="01" title="Base URL">
        <p style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.6 }}>
          Local dev (this repo, <code className="mono" style={{ background: 'var(--card2)', padding: '1px 6px', borderRadius: 4 }}>uvicorn main:app --port 8000</code>):
        </p>
        <CodeBlock label="local">{`http://localhost:8000`}</CodeBlock>
        <p style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.6, marginTop: 14 }}>
          Current production endpoint (early access, Render free tier — the first request after
          idle can take 20-30s to wake up):
        </p>
        <CodeBlock label="production">{`https://x407-backend.onrender.com`}</CodeBlock>
      </Section>

      <Section n="02" title="Give your agent an identity + wallet">
        <p style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.6 }}>
          <code className="mono" style={{ background: 'var(--card2)', padding: '1px 6px', borderRadius: 4 }}>POST /agents</code> generates
          a real Ethereum keypair server-side and returns the private key exactly once — your
          agent (or its owner) holds it from then on, never x407. Set its spend policy at the
          same time.
        </p>
        <CodeBlock label="create an agent">{`curl -X POST http://localhost:8000/agents \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "My External Agent",
    "chain": "Base",
    "dailyLimit": 100,
    "perTxLimit": 20,
    "actions": ["pay_api", "fetch_data"],
    "customRules": "Never spend on a single vendor twice in one day."
  }'

→ {
    "agent": { "id": "ag_...", "fullAddr": "0x...", ... },
    "privateKey": "0x...",
    "warning": "Save your private key now — it will never be shown again."
  }`}</CodeBlock>
      </Section>

      <Section n="03" title="Pay for something — the 402/407 handshake">
        <p style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.6 }}>
          This is real HTTP 402 (Payment Required), not a proprietary format — any resource
          your agent calls can quote a price this way, on or off x407. The flow: request the
          resource, get a 402 with payment terms, sign a plain USDC transfer with your agent's
          own key (this never touches x407's backend), then hand the transaction hash back.
        </p>
        <CodeBlock label="1. request without payment → 402 challenge">{`curl http://localhost:8000/demo/compute-api

→ HTTP/1.1 402 Payment Required
{
  "x402Version": 1,
  "accepts": [{
    "scheme": "exact", "network": "base", "amount": "0.05",
    "asset": "0x8335...02913", "payTo": "0x...", "maxTimeoutSeconds": 300
  }]
}`}</CodeBlock>
        <CodeBlock label="2. sign + broadcast the USDC transfer yourself (ethers.js / web3.py), then unlock">{`curl "http://localhost:8000/demo/compute-api?txHash=0x...&payer=0xYourAgentAddress"

→ HTTP/1.1 200 OK
{ "unlocked": true, ... }`}</CodeBlock>
        <p style={{ fontSize: 12.5, color: 'var(--ink3)', lineHeight: 1.6, marginTop: 10 }}>
          x407's own backend uses <code className="mono" style={{ background: 'var(--card2)', padding: '1px 6px', borderRadius: 4 }}>/payments/quote</code> and
          <code className="mono" style={{ background: 'var(--card2)', padding: '1px 6px', borderRadius: 4 }}> /payments/execute</code> as
          a thin wrapper around exactly this pattern, with spend-limit enforcement baked in —
          worth reading <code className="mono" style={{ background: 'var(--card2)', padding: '1px 6px', borderRadius: 4 }}>backend/x407.py</code> if
          you want the reference implementation.
        </p>
      </Section>

      <Section n="04" title="What's next">
        <p style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.6 }}>
          API-key auth and persistent storage are next on the roadmap — once those land, this
          page will cover authenticated requests and rate limits. Until then, this API is open
          and best treated as a sandbox for integration testing.
        </p>
      </Section>
    </div>
  )
}
