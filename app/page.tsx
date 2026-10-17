'use client'
import { Fragment, useEffect, useRef, useState, MouseEvent } from 'react'
import Link from 'next/link'
import { useStore, Transaction } from '@/lib/store'
import { useReveal } from '@/lib/use-reveal'
import { useScrollProgress } from '@/lib/use-scroll-progress'
import { useCountUp } from '@/lib/use-count-up'
import { X407Mark } from '@/components/brand/X407Mark'
import LogoCard3D from '@/components/brand/LogoCard3D'
import { Lock, Zap, BarChart3, ArrowRight, ChevronRight, Star, Wallet, ShieldCheck, Globe, Check, X, ChevronDown, Copy, Fingerprint, CircleDollarSign, Bot, ArrowLeftRight } from 'lucide-react'
import { SiEthereum, SiAnthropic, SiCircle, SiClaude, SiX, SiGooglegemini, SiDeepseek, SiMistralai, SiPerplexity } from 'react-icons/si'
import type { IconType } from 'react-icons'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const FEATURES = [
  { icon: <Wallet size={17} />, title: <>Zero credit cards<span className="feature-badge feature-badge-live">Live</span></>, desc: 'Every agent spins up its own crypto wallet on deployment — it funds its own API dependencies directly, no human card on file.' },
  { icon: <Lock size={17} />, title: <>You set the rules<span className="feature-badge feature-badge-live">Live</span></>, desc: 'Daily spend limits, per-transaction caps, allowed action types, and expiry dates. Agents operate strictly within your signed policy.' },
  { icon: <Zap size={17} />, title: <>Pay-per-action micro-payments<span className="feature-badge feature-badge-live">Live</span></>, desc: 'Agents pay per API call, per inference job, or per swap — quoted and settled in seconds over real on-chain USDC, verified on Base.' },
  { icon: <BarChart3 size={17} />, title: <>Full audit trail<span className="feature-badge feature-badge-live">Live</span></>, desc: 'Every transaction — confirmed, pending, or blocked — is logged with a real transaction hash you can verify yourself on Basescan.' },
  { icon: <ShieldCheck size={17} />, title: <>Granular escrow<span className="feature-badge">Roadmap</span></>, desc: 'Programmable conditional payouts for multi-step agent tasks. Direct quote-and-pay is live today; escrow contracts are next.' },
  { icon: <Globe size={17} />, title: <>Permissionless listings<span className="feature-badge">Roadmap</span></>, desc: '12 ready-made agents ship today across research, DeFi, travel, and dev tooling. An open model for third-party agent listings is planned.' },
]

const STEPS = [
  { n: '01', title: 'Pick an agent', body: "Search by category. Every agent shows its real default limits and allowed actions before you commit." },
  { n: '02', title: 'Set its limits', body: 'Configure the daily cap, per-transaction limit, allowed actions, and expiry. Every payment is checked against them before it settles.' },
  { n: '03', title: 'Watch every payment land on Basescan', body: 'Hire in one click, fund the wallet, and track every transaction — confirmed or blocked — with a real hash you can verify yourself.' },
]

const COMPARISON = [
  { without: 'Hardcode an API key + your credit card into every agent', withX: 'Agent gets its own on-chain wallet the moment it deploys' },
  { without: 'Hope the agent doesn’t overspend', withX: 'Daily limits and per-transaction caps enforced server-side, not by the agent’s own good behavior' },
  { without: 'A bearer token anyone holding it can use, anywhere', withX: 'Every spend is a signed on-chain transaction from that agent’s own wallet' },
  { without: 'No real record of what the agent actually paid for', withX: 'Every transaction logged with a hash you can verify yourself on Basescan' },
  { without: 'Revoke access by hunting down every place a key was shared', withX: 'One-click revoke — the wallet was always scoped to just this agent' },
]

// Real brand marks where Simple Icons actually has one — Base and Uniswap
// don't, and a hand-drawn approximation of a trademarked logo would look
// worse than no icon at all, so those two stay clean text.
const BUILT_ON: { name: string; icon?: IconType }[] = [
  { name: 'Base' },
  { name: 'Uniswap V3' },
  { name: 'Anthropic Claude', icon: SiAnthropic },
  { name: 'USDC', icon: SiCircle },
  { name: 'Ethereum', icon: SiEthereum },
]

const FAQ = [
  { q: 'Is this live on mainnet, or a demo?', a: 'Wallet generation, USDC payments, and Uniswap V3 swaps are real and execute on Base mainnet today — no mocked balances. The on-chain contracts (TaskEscrow, AgentRegistry, PaymentStream, SpendGuard) are built and tested but not yet deployed anywhere public. We’d rather say that plainly than have you find out from Basescan.' },
  { q: 'How does the "407" in x407 relate to the "402" payment rail?', a: 'HTTP 402 is the payment rail — interoperable with the x402 standard. The 407 in x407 is a real trust challenge, not just a name: agents prove control of their wallet with an EIP-712 signature, and payments over $10 from an unverified agent get blocked until they do. It’s modeled on HTTP 407 semantics but sent as a 403 with an x407 challenge body — browsers reject a literal 407 from a normal server at the network level, so that’s the part that isn’t literal. Trust grade rises with a track record afterward — verified, established, trusted — computed from that signature plus completed payments.' },
  { q: 'Which chains are supported?', a: 'Base is where real payments and swaps actually settle. The UI lets you provision a wallet on Ethereum, Arbitrum, Optimism, or Polygon too, but Base is the only chain we’ve verified the full pay-and-swap flow against.' },
  { q: 'Is agent data persisted anywhere?', a: 'Not yet — agents, transactions, and balances are all in-memory on the backend and reset on every restart. Persistent storage is on the roadmap, right after this current pass.' },
  { q: 'Can another agent platform use x407, not just BotMart?', a: 'That’s the goal — x407 is a plain HTTP API for agent identity, wallets, and spend policy; BotMart is just the first thing built on top of it. It’s early access, though: no API-key auth yet, and agent/transaction state is in-memory and resets on restart. See the Developer docs for the actual integration surface as it exists today.' },
]

function LandingNav() {
  return (
    <nav className="landing-nav">
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <X407Mark size={24} />
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.3px' }}>x407</span>
      </div>
      <Link href="/marketplace" className="btn-primary">Open app</Link>
    </nav>
  )
}

function DashPreview({ templates }: { templates: { emoji?: string; name: string; rating: number; price: string }[] }) {
  const navItems = ['BotMart', 'My Agents', 'Create Agent', 'Wallet', 'Transactions']
  return (
    <div className="dash-preview">
      <div className="dash-preview-bar">
        <div className="dash-preview-dots"><span /><span /><span /></div>
        <div className="dash-preview-url"><span>x407.dev/botmart</span></div>
      </div>
      <div className="dash-preview-body">
        <div className="dash-mini-sidebar">
          {navItems.map((item, i) => (
            <div key={item} className={`dash-mini-item ${i === 0 ? 'on' : ''}`}>
              <span className="dash-mini-dot" />{item}
            </div>
          ))}
        </div>
        <div className="dash-mini-content">
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink)', marginBottom: 12 }}>BotMart</div>
          <div className="dash-mini-grid">
            {templates.slice(0, 6).map(t => (
              <div key={t.name} className="dash-mini-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                  <span style={{ fontSize: 13 }}>{t.emoji}</span>
                  <span style={{ fontSize: 9.5, fontWeight: 500, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 8.5, color: 'var(--yellow)' }}>★ {t.rating}</span>
                  <span style={{ fontSize: 8.5, color: 'var(--ink3)', fontFamily: 'var(--mono)' }}>{t.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// The hero's floating glass tiles — the core nouns of the product (wallet, identity
// check, money, agent, limits, swap) drifting in 3D with a mouse parallax.
const FLOATERS: { icon: JSX.Element; style: React.CSSProperties; dur: number; delay: number }[] = [
  { icon: <Wallet size={18} />,           style: { top: '16%', left: '6%' },   dur: 9,    delay: 0 },
  { icon: <Fingerprint size={18} />,      style: { top: '30%', right: '7%' },  dur: 11,   delay: 1.2 },
  { icon: <CircleDollarSign size={18} />, style: { top: '60%', left: '10%' },  dur: 10,   delay: 0.6 },
  { icon: <Bot size={18} />,              style: { top: '11%', right: '15%' }, dur: 12,   delay: 2 },
  { icon: <ShieldCheck size={18} />,      style: { top: '70%', right: '11%' }, dur: 9.5,  delay: 1.6 },
  { icon: <ArrowLeftRight size={18} />,   style: { top: '44%', left: '3%' },   dur: 11.5, delay: 2.4 },
]

function HeroFloaters() {
  return (
    <div className="hero-floaters" aria-hidden="true">
      {FLOATERS.map((f, i) => (
        <div key={i} className="hero-floater" style={{ ...f.style, animationDuration: `${f.dur}s`, animationDelay: `${f.delay}s` }}>
          {f.icon}
        </div>
      ))}
    </div>
  )
}

// Real brand marks only (same rule as BUILT_ON) — GPT stays clean text since this
// react-icons release has no OpenAI glyph.
const AGENT_BRANDS: { name: string; icon?: IconType }[] = [
  { name: 'Claude', icon: SiClaude },
  { name: 'Grok', icon: SiX },
  { name: 'Gemini', icon: SiGooglegemini },
  { name: 'DeepSeek', icon: SiDeepseek },
  { name: 'Mistral', icon: SiMistralai },
  { name: 'Perplexity', icon: SiPerplexity },
  { name: 'GPT' },
]

// Every step here is the real integration surface as it exists today (plain HTTP
// API, in-memory state, key generated client-side) — no invented CLI or SDK.
const EQUIP_PROMPT = `Equip my AI agent with an x407 wallet and spend rules so it can pay for its own APIs.

1. Boot x407 locally: git clone https://github.com/Vossaldrin/x407 && cd x407 && ./start-x407.sh
2. Generate the agent's wallet locally — the private key must never leave this machine:
   node -e "const{Wallet}=require('ethers');const w=Wallet.createRandom();console.log(w.address,w.privateKey)"
3. Register the agent with my rules — POST http://localhost:8000/agents with:
   {"name":"my-agent","address":"<WALLET_ADDRESS>","chain":"Base","dailyLimit":25,"perTxLimit":5,"actions":["pay_api","fetch_data"],"expiry":"2026-12-31"}
4. Fund that address with a few dollars of USDC on Base mainnet.
5. To buy a resource: GET its URL, read the HTTP 402 quote ("accepts": amount, asset, payTo), send exactly that USDC amount from the agent's wallet, then retry the request with the tx hash in X-PAYMENT-TX to unlock it. Every payment is checked against the limits from step 3 before it settles.`

function EquipSnippet() {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(EQUIP_PROMPT).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    }).catch(() => {})
  }
  return (
    <div className="equip-card">
      <div className="equip-head">
        <span>Copy and send this to your agent</span>
        <button className="equip-copy-btn" onClick={copy}>
          {copied ? <Check size={13} /> : <Copy size={13} />}{copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre>{EQUIP_PROMPT}</pre>
      <div className="equip-brands">
        <span className="equip-brands-label">Works with any agent</span>
        {AGENT_BRANDS.map(({ name, icon: Icon }) => (
          <span key={name} className="equip-brand" title={name}>
            {Icon && <Icon size={13} />}{name}
          </span>
        ))}
        <Link href="/connect" className="equip-connect-link">or connect yours in the app →</Link>
      </div>
    </div>
  )
}

function ProtocolSnippet() {
  const { ref, visible } = useReveal<HTMLDivElement>()
  return (
    <div ref={ref} className={`protocol-block reveal ${visible ? 'in-view' : ''}`}>
      <div className="protocol-block-bar">
        <span className="protocol-block-dot" /> the x407 handshake — real HTTP 402 underneath
      </div>
      <pre>{`$ `}<span className="tok-cmd">curl https://api.x407.dev/demo/compute-api</span>{`

`}<span className="tok-status">HTTP/1.1 402 Payment Required</span>{`
{
  `}<span className="tok-key">"x402Version"</span>{`: 1,
  `}<span className="tok-key">"accepts"</span>{`: [{
    `}<span className="tok-key">"amount"</span>{`: `}<span className="tok-str">"0.05"</span>{`,
    `}<span className="tok-key">"network"</span>{`: `}<span className="tok-str">"base"</span>{`,
    `}<span className="tok-key">"payTo"</span>{`: `}<span className="tok-str">"0x1a2b...e60"</span>{`
  }]
}

$ `}<span className="tok-cmd">curl https://api.x407.dev/demo/compute-api \</span>{`
    -H "X-PAYMENT-TX: 0x9f3c...confirmed"

`}<span className="tok-status">HTTP/1.1 200 OK</span>{`
{ `}<span className="tok-key">"unlocked"</span>{`: `}<span className="tok-str">true</span>{` }
`}<span className="term-cursor" /></pre>
    </div>
  )
}

function StatValue({ value, start }: { value: string; start: boolean }) {
  const animated = useCountUp(value, start)
  return <div className="landing-stat-value">{animated}</div>
}

function StatsBar() {
  const { ref, visible } = useReveal<HTMLDivElement>()
  const stats = [
    { value: 'Base', label: 'Settlement chain' },
    { value: 'HTTP 402', label: 'Payment rail' },
    { value: 'USDC', label: 'Settlement asset' },
    { value: '0%', label: 'Protocol fee' },
  ]
  return (
    <div ref={ref} className={`landing-stats-bar reveal ${visible ? 'in-view' : ''}`}>
      <div className="landing-stats-grid">
        {stats.map(s => (
          <div key={s.label}>
            <StatValue value={s.value} start={visible} />
            <div className="landing-stat-label">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FeaturesSection() {
  const { ref, visible } = useReveal<HTMLDivElement>()
  return (
    <div ref={ref} className={`landing-section reveal ${visible ? 'in-view' : ''}`}>
      <div className="landing-section-head">
        <h2>Why not just an API key?</h2>
        <p>No card on file — your agent funds itself from its own wallet. A cap on every payment, checked before it settles. A receipt on-chain, for every single one.</p>
      </div>
      <div className={`feature-row ${visible ? 'stagger' : ''}`}>
        {FEATURES.map((f, i) => (
          <div key={i} className="feature-card">
            <div className="feature-icon">{f.icon}</div>
            <div className="feature-title">{f.title}</div>
            <div className="feature-desc">{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CompareRow({ without, withX }: { without: string; withX: string }) {
  const { ref, visible } = useReveal<HTMLDivElement>()
  return (
    <Fragment>
      <div ref={ref} className={`compare-cell compare-without reveal ${visible ? 'in-view' : ''}`}><X size={14} /><span>{without}</span></div>
      <div className={`compare-cell compare-with reveal ${visible ? 'in-view' : ''}`}><Check size={14} /><span>{withX}</span></div>
    </Fragment>
  )
}

function ComparisonSection() {
  const { ref, visible } = useReveal<HTMLDivElement>()
  return (
    <div ref={ref} className={`landing-section reveal ${visible ? 'in-view' : ''}`} style={{ paddingTop: 0 }}>
      <div className="landing-section-head">
        <h2>The old way vs. x407.</h2>
      </div>
      <div className="compare-table">
        <div className="compare-head compare-without">Without x407</div>
        <div className="compare-head compare-with">With x407</div>
        {COMPARISON.map((row, i) => <CompareRow key={i} without={row.without} withX={row.withX} />)}
      </div>
    </div>
  )
}

function StepsSection() {
  const { ref, visible } = useReveal<HTMLDivElement>()
  const { ref: progressRef, progress } = useScrollProgress<HTMLDivElement>()
  return (
    <div ref={ref} className={`landing-section landing-section-wide reveal ${visible ? 'in-view' : ''}`} style={{ paddingTop: 0 }}>
      <div className="split-section">
        <div className="split-text">
          <div className="landing-section-head" style={{ textAlign: 'left', margin: 0 }}>
            <h2>From zero to deployed<br />in three steps.</h2>
            <p style={{ margin: 0 }}>No card on file, no key to revoke later — just a wallet scoped to one agent, funded and limited by you.</p>
          </div>
        </div>
        <div className="split-visual">
          <div ref={progressRef} className="landing-steps">
            <div className="landing-steps-line">
              <div className="landing-steps-line-fill" style={{ height: `${progress * 100}%` }} />
            </div>
            {STEPS.map((step, i) => (
              <div key={step.n} className={`landing-step ${progress > i / STEPS.length ? 'is-active' : ''}`}>
                <div className="landing-step-num">{step.n}</div>
                <div style={{ flex: 1 }}>
                  <div className="landing-step-title">{step.title}</div>
                  <div className="landing-step-body">{step.body}</div>
                </div>
                <ChevronRight size={18} color="var(--ink3)" style={{ marginTop: 4 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function LiveActivitySection() {
  const { ref, visible } = useReveal<HTMLDivElement>()
  const [txs, setTxs] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Intentionally unscoped (no visitorId) — this is the public marketing page
    // showing real activity across all demo agents, not any one visitor's own.
    const load = () => fetch(`${API}/transactions`)
      .then(r => r.json())
      .then(d => setTxs((d.transactions || []).slice(0, 6)))
      .catch(() => {})
      .finally(() => setLoading(false))
    load()
    const id = setInterval(load, 6000)
    return () => clearInterval(id)
  }, [])

  return (
    <div ref={ref} className={`landing-section landing-section-wide reveal ${visible ? 'in-view' : ''}`} style={{ paddingTop: 0 }}>
      <div className="split-section">
        <div className="split-text">
          <div className="landing-section-head" style={{ textAlign: 'left', margin: 0 }}>
            <h2>Every payment, settled the same way.</h2>
            <p style={{ margin: '0 0 24px' }}>Quote, sign, verify, settle — the same rail whether it's $0.02 for a data source or a real swap.</p>
          </div>
          <ol className="flow-list">
            <li><strong>Quote</strong> — the resource returns a real HTTP 402 with price, asset, and recipient.</li>
            <li><strong>Sign</strong> — the agent's own wallet signs the transfer, locally in the browser. The key never reaches our backend.</li>
            <li><strong>Verify</strong> — the backend checks the transaction on-chain before marking anything settled.</li>
            <li><strong>Settle</strong> — logged with a real hash, checkable on Basescan.</li>
          </ol>
        </div>
        <div className="split-visual">
          <div className="live-feed-panel">
            <div className="live-feed-head"><span className="status-pulse" /> Live agent activity</div>
            {loading ? (
              <div className="live-feed-empty">Loading…</div>
            ) : txs.length === 0 ? (
              <div className="live-feed-empty">No payments yet on this demo backend — hire an agent and be the first.</div>
            ) : txs.map(tx => (
              <div key={tx.id} className="live-feed-item">
                <div className="live-feed-item-top">
                  <span className="live-feed-item-name">{tx.agentName} · {tx.name}</span>
                  <span className="live-feed-item-amount" style={{ color: tx.status === 'blocked' ? 'var(--rose)' : tx.type === 'in' ? 'var(--green)' : 'var(--ink2)' }}>
                    {tx.status === 'blocked' ? 'blocked' : `${tx.type === 'in' ? '+' : '-'}$${tx.amount.toFixed(2)}`}
                  </span>
                </div>
                <div className="live-feed-item-meta">
                  {tx.hash
                    ? <a href={`https://basescan.org/tx/${tx.hash}`} target="_blank" rel="noreferrer">{tx.hash.slice(0, 10)}… ↗</a>
                    : (tx.reason || tx.status)} · {tx.timestamp}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function AgentStrip({ templates }: { templates: { id: string; emoji?: string; name: string; description: string; rating: number; price: string; category: string }[] }) {
  const { ref, visible } = useReveal<HTMLDivElement>()
  if (templates.length === 0) return null

  const card = (t: typeof templates[number], key: string) => (
    <Link key={key} href={`/marketplace/${t.id}`} className="agent-strip-card" style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 20 }}>{t.emoji}</span>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)' }}>{t.name}</span>
      </div>
      <p style={{ fontSize: 11, color: 'var(--ink3)', lineHeight: 1.5, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{t.description}</p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10.5, color: 'var(--yellow)' }}><Star size={9} fill="currentColor" style={{ marginRight: 3 }} />{t.rating}</span>
        <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--ink2)' }}>{t.price}</span>
      </div>
    </Link>
  )

  return (
    <div ref={ref} className={`agent-strip-wrap reveal ${visible ? 'in-view' : ''}`}>
      <div className="agent-strip-head">Featured agents</div>
      <div className="agent-strip-viewport">
        <div className="agent-strip-marquee">
          {templates.map(t => card(t, `a-${t.id}`))}
          {templates.map(t => card(t, `b-${t.id}`))}
        </div>
      </div>
    </div>
  )
}

function BuiltOnRow() {
  const { ref, visible } = useReveal<HTMLDivElement>()
  return (
    <div ref={ref} className={`built-on reveal ${visible ? 'in-view' : ''}`}>
      <span className="built-on-label">Built on</span>
      <div className="built-on-row">
        {BUILT_ON.map(({ name, icon: Icon }) => (
          <span key={name} className="built-on-item">
            {Icon && <Icon size={15} />}
            {name}
          </span>
        ))}
      </div>
    </div>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="faq-item">
      <button className="faq-question" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <span>{q}</span>
        <ChevronDown size={16} className="faq-chevron" style={{ transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>
      {open && <div className="faq-answer">{a}</div>}
    </div>
  )
}

function FaqSection() {
  const { ref, visible } = useReveal<HTMLDivElement>()
  return (
    <div ref={ref} className={`landing-section reveal ${visible ? 'in-view' : ''}`} style={{ maxWidth: 720 }}>
      <div className="landing-section-head" style={{ marginBottom: 40 }}>
        <h2>Questions worth asking.</h2>
      </div>
      <div className="faq-list">
        {FAQ.map(f => <FaqItem key={f.q} q={f.q} a={f.a} />)}
      </div>
    </div>
  )
}

function FinalCta() {
  const { ref, visible } = useReveal<HTMLDivElement>()
  return (
    <div ref={ref} className={`landing-cta reveal ${visible ? 'in-view' : ''}`}>
      <div style={{ marginBottom: 28 }}><LogoCard3D size={150} /></div>
      <h2>Your agent's first payment is<br />one click away.</h2>
      <p>Hire an agent with its own on-chain wallet — a real payment, checked against real limits, settled on Base.</p>
      <Link href="/marketplace" className="btn-primary-lg">Hire an agent on BotMart <ArrowRight size={15} /></Link>
    </div>
  )
}

export default function LandingPage() {
  const { marketplace } = useStore()
  const heroRef = useRef<HTMLDivElement>(null)
  const onMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = heroRef.current?.getBoundingClientRect()
    if (!rect) return
    const nx = (e.clientX - rect.left) / rect.width
    const ny = (e.clientY - rect.top) / rect.height
    heroRef.current!.style.setProperty('--mx', `${nx * 100}%`)
    heroRef.current!.style.setProperty('--my', `${ny * 100}%`)
    // Unitless copies for 3D math — calc() can't turn a % into degrees.
    heroRef.current!.style.setProperty('--mxn', `${nx}`)
    heroRef.current!.style.setProperty('--myn', `${ny}`)
  }

  return (
    <div className="landing-root" data-theme="dark">
      <LandingNav />

      <div ref={heroRef} onMouseMove={onMouseMove} className="hero">
        <div className="hero-glow-follow" />
        <div className="hero-gradient" />
        <HeroFloaters />
        <div className="hero-content">
          <div style={{ marginBottom: 20 }}><LogoCard3D size={240} /></div>
          <div className="hero-eyebrow">HTTP 402 + 407 · USDC on Base · your keys, your limits</div>
          <h1 className="hero-title">Give your agent a wallet. Keep the limits.</h1>
          <p className="hero-subtitle">
            x407 gives each AI agent its own USDC wallet on Base. It pays for APIs, data, and
            swaps per request over HTTP 402, and every payment is checked against the daily
            cap, per-transaction limit, and expiry you set. Spend over $10 and it has to prove
            it controls that wallet first — a real EIP-712 signature check, the actual 407 in
            x407 — before the payment goes through.
          </p>
          <div className="hero-ctas">
            <Link href="/marketplace" className="btn-primary-lg">Hire an agent on BotMart <ArrowRight size={15} /></Link>
            <Link href="/create" className="hero-cta-plain">Build your own</Link>
          </div>
          <EquipSnippet />
          <ProtocolSnippet />
          {/* Wrapper takes the entrance animation so the preview itself is free to tilt —
              cardIn's fill-mode would otherwise pin the transform. */}
          <div><DashPreview templates={marketplace} /></div>
        </div>
      </div>

      <StatsBar />
      <FeaturesSection />
      <ComparisonSection />
      <StepsSection />
      <LiveActivitySection />
      <AgentStrip templates={marketplace} />
      <BuiltOnRow />
      <FaqSection />
      <FinalCta />

      <footer className="landing-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <X407Mark size={18} />
          <span style={{ color: 'var(--ink2)', fontWeight: 500 }}>x407</span>
          <span style={{ color: 'var(--line2)' }}>·</span>
          <span>v0.1.0 early access</span>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          <Link href="/developers" style={{ color: 'inherit', textDecoration: 'none' }}>Docs</Link>
          {['Status', 'Privacy', 'Terms'].map(l => <span key={l}>{l}</span>)}
        </div>
      </footer>
    </div>
  )
}
