import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EquiHub - Equity Management Platform',
  description: 'Mini Carta-like equity management for startups',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
