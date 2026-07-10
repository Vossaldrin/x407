'use client'
import { useEffect, useRef, useState, MouseEvent } from 'react'
import Link from 'next/link'
import { useStore } from '@/lib/store'
import { useReveal } from '@/lib/use-reveal'
import { Cpu, Lock, Zap, BarChart3, Layers, ArrowRight, ChevronRight, Star, Wallet } from 'lucide-react'

const FEATURES = [
  { icon: <Cpu size={17} />, title: 'Agents with real wallets', desc: 'Every agent is provisioned with an isolated, cryptographically-bound wallet on deployment. It can spend, receive, and transact — autonomously.' },
  { icon: <Lock size={17} />, title: 'You set the rules', desc: 'Define daily spend limits, per-transaction caps, allowed action types, and expiry dates. Agents operate strictly within your signed policy.' },
  { icon: <Wallet size={17} />, title: 'Real x402 payments', desc: 'Agents pay for APIs and compute with real on-chain USDC, verified against Base mainnet before anything unlocks.' },
  { icon: <BarChart3 size={17} />, title: 'Full audit trail', desc: 'Every transaction — confirmed, pending, or blocked — is logged with a real transaction hash you can verify yourself on Basescan.' },
  { icon: <Zap size={17} />, title: 'Configure before you deploy', desc: 'Set spend limits and allowed actions right in the hire flow — no code required, no infrastructure to manage.' },
  { icon: <Layers size={17} />, title: 'Twelve ready-made agents', desc: 'Research, DeFi trading, travel, expense optimization, dev tooling, and more — or build your own from scratch.' },
]

const STEPS = [
  { n: '01', title: 'Browse the marketplace', body: "Search by category. Every agent shows its real default limits and allowed actions before you commit." },
  { n: '02', title: 'Set your policy', body: 'Configure daily limits, per-transaction caps, allowed actions, and expiry. Your agent can’t exceed what you sign off on.' },
  { n: '03', title: 'Deploy and monitor', body: 'Hire in one click, fund the wallet, and track every transaction — confirmed or blocked — in real time.' },
]

function LandingNav() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme')
    if (current === 'light' || current === 'dark') setTheme(current)
  }, [])
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
  }
  return (
    <nav className="landing-nav">
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <div style={{ width: 24, height: 24, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--red), var(--red-hover))' }}>
          <Cpu size={12} color="#fff" />
        </div>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.3px' }}>Arnold</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button className="theme-btn" onClick={toggle} title="Toggle theme" aria-label="Toggle theme">
          {theme === 'dark' ? '☀' : '☾'}
        </button>
        <Link href="/marketplace" className="btn-primary">Open app</Link>
      </div>
    </nav>
  )
}

function DashPreview({ templates }: { templates: { emoji?: string; name: string; rating: number; price: string }[] }) {
  const navItems = ['Marketplace', 'My Agents', 'Create Agent', 'Wallet', 'Transactions']
  return (
    <div className="dash-preview">
      <div className="dash-preview-bar">
        <div className="dash-preview-dots"><span /><span /><span /></div>
        <div className="dash-preview-url"><span>arnold.app/marketplace</span></div>
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
            <div className="landing-stat-value">{s.value}</div>
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
        <h2>Built for precision, not abstraction.</h2>
        <p>Every design decision prioritizes trust, control, and transparency over convenience that hides risk.</p>
      </div>
      <div className="feature-row">
        {FEATURES.map(f => (
          <div key={f.title} className="feature-card">
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
    <div>
      <LandingNav />

      <div ref={heroRef} onMouseMove={onMouseMove} className="hero">
        <div className="hero-glow-follow" />
        <div className="hero-gradient" />
        <div className="hero-content">
          <div className="hero-eyebrow">Non-custodial · Real on-chain payments</div>
          <h1 className="hero-title">AI agents that hold real money.</h1>
          <p className="hero-subtitle">
            Arnold is a marketplace for autonomous AI agents with real crypto wallets. Hire
            agents that research, trade, book travel, and pay for APIs — within limits only
            you define.
          </p>
          <div className="hero-ctas">
            <Link href="/marketplace" className="btn-primary-lg">Explore the marketplace <ArrowRight size={15} /></Link>
            <Link href="/create" className="btn-ghost-lg">Create your own agent →</Link>
          </div>
          <DashPreview templates={marketplace} />
        </div>
      </div>

      <StatsBar />
      <FeaturesSection />
      <StepsSection />
      <AgentStrip templates={marketplace} />

      <div className="landing-cta">
        <h2>Your agents are<br />waiting.</h2>
        <p>Hire an autonomous agent with its own on-chain wallet — real payments, real limits, real transparency.</p>
        <Link href="/marketplace" className="btn-primary-lg">Enter Arnold <ArrowRight size={15} /></Link>
      </div>

      <footer className="landing-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 18, height: 18, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--red), var(--red-hover))' }}>
            <Cpu size={9} color="#fff" />
          </div>
          <span style={{ color: 'var(--ink2)', fontWeight: 500 }}>Arnold</span>
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
