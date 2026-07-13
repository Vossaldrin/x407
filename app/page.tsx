'use client'
import { useEffect, useRef, MouseEvent } from 'react'
import Link from 'next/link'
import { useStore } from '@/lib/store'
import { useReveal } from '@/lib/use-reveal'
import { useCountUp } from '@/lib/use-count-up'
import { X407Mark } from '@/components/brand/X407Mark'
import { Lock, Zap, BarChart3, ArrowRight, ChevronRight, Star, Wallet, ShieldCheck, Globe } from 'lucide-react'

const FEATURES = [
  { icon: <Wallet size={17} />, title: 'Zero credit cards', desc: 'Every agent spins up its own crypto wallet on deployment — it funds its own API dependencies directly, no human card on file.' },
  { icon: <Lock size={17} />, title: 'You set the rules', desc: 'Daily spend limits, per-transaction caps, allowed action types, and expiry dates. Agents operate strictly within your signed policy.' },
  { icon: <Zap size={17} />, title: 'Pay-per-action micro-payments', desc: 'Agents pay per API call, per inference job, or per swap — quoted and settled in seconds over real on-chain USDC, verified on Base.' },
  { icon: <BarChart3 size={17} />, title: 'Full audit trail', desc: 'Every transaction — confirmed, pending, or blocked — is logged with a real transaction hash you can verify yourself on Basescan.' },
  { icon: <ShieldCheck size={17} />, title: <>Granular escrow<span className="feature-badge">Roadmap</span></>, desc: 'Programmable conditional payouts for multi-step agent tasks. Direct quote-and-pay is live today; escrow contracts are next.' },
  { icon: <Globe size={17} />, title: <>Permissionless listings<span className="feature-badge">Roadmap</span></>, desc: '12 ready-made agents ship today across research, DeFi, travel, and dev tooling. An open model for third-party agent listings is planned.' },
]

const STEPS = [
  { n: '01', title: 'Browse the marketplace', body: "Search by category. Every agent shows its real default limits and allowed actions before you commit." },
  { n: '02', title: 'Set your policy', body: 'Configure daily limits, per-transaction caps, allowed actions, and expiry. Your agent can’t exceed what you sign off on.' },
  { n: '03', title: 'Deploy and monitor', body: 'Hire in one click, fund the wallet, and track every transaction — confirmed or blocked — in real time.' },
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
  const navItems = ['Marketplace', 'My Agents', 'Create Agent', 'Wallet', 'Transactions']
  return (
    <div className="dash-preview">
      <div className="dash-preview-bar">
        <div className="dash-preview-dots"><span /><span /><span /></div>
        <div className="dash-preview-url"><span>x407.dev/marketplace</span></div>
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
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink)', marginBottom: 12 }}>Agent Marketplace</div>
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
    { value: '12', label: 'Agent templates' },
    { value: '5', label: 'Live task types' },
    { value: 'Base', label: 'Mainnet chain' },
    { value: '6', label: 'AI providers routed' },
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
        <h2>Beats a static API key.</h2>
        <p>Traditional platforms hide agents behind human credit cards. x407 gives them on-chain identity and native wallets instead.</p>
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
  if (templates.length === 0) return null
  return (
    <div className="agent-strip-wrap">
      <div className="agent-strip-head">Featured agents</div>
      <div className="agent-strip">
        {templates.map(t => (
          <Link key={t.id} href={`/marketplace/${t.id}`} className="agent-strip-card" style={{ textDecoration: 'none', display: 'block' }}>
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
        ))}
      </div>
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
          <div className="hero-eyebrow">402 → 407 · non-custodial · real on-chain payments</div>
          <h1 className="hero-title">AI agents that hold real money.</h1>
          <p className="hero-subtitle">
            x407 is the decentralized hiring floor for autonomous AI agents. Hire agents that
            research, trade, book travel, and pay for APIs peer-to-peer — within limits only
            you define.
          </p>
          <div className="hero-ctas">
            <Link href="/marketplace" className="btn-primary-lg">Explore the marketplace <ArrowRight size={15} /></Link>
            <Link href="/create" className="btn-ghost-lg">Create your own agent →</Link>
          </div>
          <DashPreview templates={marketplace} />
          <ProtocolSnippet />
        </div>
      </div>

      <StatsBar />
      <FeaturesSection />
      <StepsSection />
      <AgentStrip templates={marketplace} />

      <div className="landing-cta">
        <h2>Your agents are<br />waiting.</h2>
        <p>Hire an autonomous agent with its own on-chain wallet — real payments, real limits, real transparency.</p>
        <Link href="/marketplace" className="btn-primary-lg">Enter x407 <ArrowRight size={15} /></Link>
      </div>

      <footer className="landing-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <X407Mark size={18} />
          <span style={{ color: 'var(--ink2)', fontWeight: 500 }}>x407</span>
          <span style={{ color: 'var(--line2)' }}>·</span>
          <span>v0.1.0 early access</span>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          {['Docs', 'Status', 'Privacy', 'Terms'].map(l => <span key={l}>{l}</span>)}
        </div>
      </footer>
    </div>
  )
}
