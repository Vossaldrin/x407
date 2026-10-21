'use client'
import './globals.css'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { StoreProvider, useStore } from '@/lib/store'
import { connectWallet } from '@/lib/wallet-connect'
import { X407Mark } from '@/components/brand/X407Mark'
import { Store, Bot, Plus, Wallet as WalletIcon, ArrowLeftRight, Bell, Terminal, Plug } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/marketplace',  label: 'BotMart',       icon: Store },
  { href: '/passports',    label: 'My Agents',     icon: Bot },
  { href: '/create',       label: 'Create Agent',  icon: Plus },
  { href: '/connect',      label: 'Connect Agent', icon: Plug },
  { href: '/wallet',       label: 'Wallet',       icon: WalletIcon },
  { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/developers',   label: 'Developers',   icon: Terminal },
]

function isActive(path: string, href: string): boolean {
  if (href === '/passports') return path === '/passports' || path.startsWith('/agents/')
  return path === href || path.startsWith(href + '/')
}

function pageLabelFor(path: string): string {
  const match = NAV_ITEMS.find(item => isActive(path, item.href))
  return match?.label || 'x407'
}

function NotificationBell() {
  const { transactions, unreadCount, markNotificationsRead } = useStore()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const toggle = () => {
    setOpen(o => !o)
    if (!open) markNotificationsRead()
  }

  const recent = transactions.slice(0, 8)

  return (
    <div className="bell-wrap" ref={wrapRef}>
      <button className="bell-btn" title="Notifications" aria-label="Notifications" onClick={toggle}>
        <Bell size={14} />
        {unreadCount > 0 && <span className="bell-dot" />}
      </button>
      {open && (
        <div className="bell-dropdown">
          {recent.length === 0 ? (
            <div className="bell-dropdown-empty">No agent activity yet.</div>
          ) : recent.map(tx => (
            <div key={tx.id} className="bell-item">
              <div className="bell-item-top">
                <span className="bell-item-name">{tx.agentName} · {tx.name}</span>
                <span className="bell-item-amount" style={{ color: tx.status === 'blocked' ? 'var(--rose)' : tx.type === 'in' ? 'var(--green)' : 'var(--ink2)' }}>
                  {tx.status === 'blocked' ? 'blocked' : `${tx.type === 'in' ? '+' : '-'}$${tx.amount.toFixed(2)}`}
                </span>
              </div>
              <div className="bell-item-meta">
                {tx.status === 'blocked' ? (tx.reason || 'blocked') : tx.hash ? `${tx.hash.slice(0, 10)}…` : tx.status} · {tx.timestamp}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const [theme, setTheme] = useState<'dark'|'light'>('dark')
  const [account, setAccount] = useState<string | null>(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Landing page is a full-bleed marketing page — no dashboard chrome.
  if (path === '/') return <>{children}</>

  const handleConnect = async () => {
    const addr = await connectWallet()
    if (addr) setAccount(addr)
  }

  return (
    <div className="x407-shell">
      <aside className="side-nav">
        <Link href="/" className="side-logo">
          <X407Mark size={26} />
          <div>
            <div className="side-logo-name">x407</div>
          </div>
        </Link>

        <nav className="side-nav-links">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href}
                className={`side-link ${isActive(path, item.href) ? 'active' : ''}`}>
                <Icon size={15} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="side-footer">
          <button className="side-account" onClick={handleConnect} title={account || 'Connect wallet'}>
            <span className="side-account-avatar">{account ? account.slice(2, 3).toUpperCase() : '?'}</span>
            <span className="side-account-label">
              {account ? `${account.slice(0, 6)}…${account.slice(-4)}` : 'Connect wallet'}
            </span>
          </button>
          <button className="theme-btn" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            title="Toggle theme" aria-label="Toggle theme">
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </div>
      </aside>

      <div className="main-col">
        <div className="top-breadcrumb">
          <div className="breadcrumb-text">x407 <span>›</span> <span className="breadcrumb-current">{pageLabelFor(path)}</span></div>
          <div className="top-right">
            <NotificationBell />
            <div className="status-chip"><span className="status-pulse" /> <span className="status-chip-text">All systems operational</span></div>
          </div>
        </div>
        <main className="main-content">
          {children}
        </main>
      </div>

      <nav className="bottom-nav">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href}
              className={`bottom-nav-link ${isActive(path, item.href) ? 'active' : ''}`}>
              <Icon size={18} />
              {item.label === 'Create Agent' ? 'Create' : item.label === 'Transactions' ? 'Tx' : item.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <title>x407 — Identity & Wallet Rail for Autonomous Agents</title>
        <meta name="description" content="Give your agent a wallet, spend rules, and a verifiable identity. Real HTTP 402 payments in USDC on Base — for any agent that speaks HTTP." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="x407 — Give your agent a wallet. Keep the limits." />
        <meta property="og:description" content="Wallets, spend rules, and HTTP 402 payments for autonomous agents. Real USDC, settled on Base." />
        <meta property="og:image" content="https://x407-alpha.vercel.app/brand/social-card.png" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://x407-alpha.vercel.app/brand/social-card.png" />
        <link rel="icon" type="image/png" href="/brand/favicon-64.png" />
        <link rel="apple-touch-icon" href="/brand/apple-touch-icon.png" />
      </head>
      <body>
        <StoreProvider>
          <Shell>{children}</Shell>
        </StoreProvider>
      </body>
    </html>
  )
}
