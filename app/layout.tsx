'use client'
import './globals.css'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { StoreProvider } from '@/lib/store'
import { connectWallet } from '@/lib/wallet-connect'
import { Store, Bot, Plus, Wallet as WalletIcon, ArrowLeftRight, Bell } from 'lucide-react'

function EagleLogo() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <path d="M13 2L19 6V9L23 7L21 12L17 11V15L23 21H17L13 17L9 21H3L9 15V11L5 12L3 7L7 9V6L13 2Z" fill="#4CAF50" opacity="0.95"/>
      <path d="M13 2L13 17" stroke="#FFD600" strokeWidth="0.8" opacity="0.7"/>
      <path d="M13 2L7 9M13 2L19 9" stroke="#FFD600" strokeWidth="0.7" opacity="0.5"/>
      <circle cx="13" cy="2" r="1.5" fill="#FFD600"/>
    </svg>
  )
}

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
  return match?.label || 'Arnold'
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
    <div className="arnold-shell">
      <aside className="side-nav">
        <Link href="/" className="side-logo">
          <EagleLogo />
          <div>
            <div className="side-logo-name">Arnold</div>
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
          <div className="breadcrumb-text">Arnold <span>›</span> <span className="breadcrumb-current">{pageLabelFor(path)}</span></div>
          <div className="top-right">
            <button className="bell-btn" title="Notifications" aria-label="Notifications">
              <Bell size={14} />
              <span className="bell-dot" />
            </button>
            <div className="status-chip"><span className="status-pulse" /> All systems operational</div>
          </div>
        </div>
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <title>Arnold — Agent Marketplace</title>
        <meta name="description" content="Hire and deploy autonomous AI agents" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🦅</text></svg>" />
      </head>
      <body>
        <StoreProvider>
          <Shell>{children}</Shell>
        </StoreProvider>
      </body>
    </html>
  )
}
