import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Koolerr — Your AI Marketing Team',
    template: '%s — Koolerr',
  },
  description:
    'Stop buying software. Start hiring AI. Koolerr gives your business a complete AI Marketing Team — trained on your brand, working around the clock.',
  metadataBase: new URL('https://koolerr.vercel.app'),
  keywords: ['AI marketing team', 'AI workforce', 'marketing automation', 'AI employees'],
  authors: [{ name: 'Koolerr' }],
  creator: 'Koolerr',
  publisher: 'Koolerr',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="overflow-x-hidden">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
