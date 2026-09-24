'use client'
import { Fragment, useEffect, useRef, useState, MouseEvent } from 'react'
import Link from 'next/link'
import { useStore } from '@/lib/store'
import { useReveal } from '@/lib/use-reveal'
import { useCountUp } from '@/lib/use-count-up'
import { X407Mark } from '@/components/brand/X407Mark'
import { Lock, Zap, BarChart3, ArrowRight, ChevronRight, Star, Wallet, ShieldCheck, Globe, Check, X, ChevronDown } from 'lucide-react'

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

const BUILT_ON = ['Base', 'Uniswap V3', 'Anthropic Claude', 'USDC', 'Ethereum']

const FAQ = [
  { q: 'Is this live on mainnet, or a demo?', a: 'Wallet generation, USDC payments, and Uniswap V3 swaps are real and execute on Base mainnet today — no mocked balances. The on-chain contracts (TaskEscrow, AgentRegistry, PaymentStream, SpendGuard) are built and tested but not yet deployed anywhere public. We’d rather say that plainly than have you find out from Basescan.' },
  { q: 'How does the "407" in x407 relate to the "402" payment rail?', a: 'HTTP 402 is the payment rail — interoperable with the x402 standard. HTTP 407 is real too, not just a name: agents prove control of their wallet with an EIP-712 signature, and payments over $10 from an unverified agent get an actual 407 response until they do. Trust grade rises with a track record — verified, established, trusted — computed from that signature plus completed payments.' },
  { q: 'Which chains are supported?', a: 'Base is where real payments and swaps actually settle. The UI lets you provision a wallet on Ethereum, Arbitrum, Optimism, or Polygon too, but Base is the only chain we’ve verified the full pay-and-swap flow against.' },
  { q: 'Is agent data persisted anywhere?', a: 'Not yet — agents, transactions, and balances are all in-memory on the backend and reset on every restart. Persistent storage is on the roadmap, right after this current pass.' },
  { q: 'Can another agent platform use x407, not just BotMart?', a: 'Yes — that’s the point. x407 is a plain HTTP API for agent identity, wallets, and spend policy; BotMart is just the first thing built on top of it. See the Developer docs for the integration surface.' },
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
        {COMPARISON.map((row, i) => (
          <Fragment key={i}>
            <div className="compare-cell compare-without"><X size={14} /><span>{row.without}</span></div>
            <div className="compare-cell compare-with"><Check size={14} /><span>{row.withX}</span></div>
          </Fragment>
        ))}
      </div>
    </div>
  )
}

function StepsSection() {
  const { ref, visible } = useReveal<HTMLDivElement>()
  return (
    <div ref={ref} className={`landing-section reveal ${visible ? 'in-view' : ''}`} style={{ paddingTop: 0 }}>
      <div className="landing-section-head" style={{ textAlign: 'left', margin: '0 0 24px' }}>
        <h2>From zero to deployed<br />in three steps.</h2>
      </div>
      <div className="landing-steps">
        {STEPS.map(step => (
          <div key={step.n} className="landing-step">
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
        {BUILT_ON.map(name => <span key={name} className="built-on-item">{name}</span>)}
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
    heroRef.current!.style.setProperty('--mx', `${((e.clientX - rect.left) / rect.width) * 100}%`)
    heroRef.current!.style.setProperty('--my', `${((e.clientY - rect.top) / rect.height) * 100}%`)
  }

  return (
    <div className="landing-root" data-theme="dark">
      <LandingNav />

      <div ref={heroRef} onMouseMove={onMouseMove} className="hero">
        <div className="hero-glow-follow" />
        <div className="hero-gradient" />
        <div className="hero-content">
          <div className="hero-eyebrow">HTTP 402 + 407 · USDC on Base · your keys, your limits</div>
          <h1 className="hero-title">Give your agent a wallet. Keep the limits.</h1>
          <p className="hero-subtitle">
            x407 gives each AI agent its own USDC wallet on Base. It pays for APIs, data, and
            swaps per request over HTTP 402, and every payment is checked against the daily
            cap, per-transaction limit, and expiry you set.
          </p>
          <div className="hero-ctas">
            <Link href="/marketplace" className="btn-primary-lg">Hire an agent on BotMart <ArrowRight size={15} /></Link>
            <Link href="/create" className="hero-cta-plain">Build your own</Link>
          </div>
          <ProtocolSnippet />
          <DashPreview templates={marketplace} />
        </div>
      </div>

      <StatsBar />
      <FeaturesSection />
      <ComparisonSection />
      <StepsSection />
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
