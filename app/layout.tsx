import type { Metadata } from 'next'
import './globals.css'
import Shell from '@/components/layout/Shell'

export const metadata: Metadata = {
  title: 'Arno — Agent OS',
  description: 'Give AI agents a real passport and autonomous wallet.',
  icons: { icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⬡</text></svg>" },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  )
}
