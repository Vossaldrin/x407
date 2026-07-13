'use client'
import './globals.css'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { StoreProvider } from '@/lib/store'
import { connectWallet } from '@/lib/wallet-connect'
import { X407Mark } from '@/components/brand/X407Mark'
import { Store, Bot, Plus, Wallet as WalletIcon, ArrowLeftRight, Bell } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/marketplace',  label: 'Marketplace',  icon: Store },
  { href: '/passports',    label: 'My Agents',    icon: Bot },
  { href: '/create',       label: 'Create Agent', icon: Plus },
  { href: '/wallet',       label: 'Wallet',       icon: WalletIcon },
  { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
]

function isActive(path: string, href: string): boolean {
  if (href === '/passports') return path === '/passports' || path.startsWith('/agents/')
  return path === href || path.startsWith(href + '/')
}

function pageLabelFor(path: string): string {
  const match = NAV_ITEMS.find(item => isActive(path, item.href))
  return match?.label || 'x407'
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
            <button className="bell-btn" title="Notifications" aria-label="Notifications">
              <Bell size={14} />
              <span className="bell-dot" />
            </button>
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
        <title>x407 — Autonomous Agent Marketplace</title>
        <meta name="description" content="Hire and deploy autonomous AI agents" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='24' fill='%2339FF88'/><text x='50' y='70' font-size='58' font-family='monospace' font-weight='700' fill='%2304140A' text-anchor='middle'>&gt;</text></svg>" />
      </head>
      <body>
        <StoreProvider>
          <Shell>{children}</Shell>
        </StoreProvider>
      </body>
    </html>
  )
}
