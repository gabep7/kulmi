import type { Metadata, Viewport } from 'next'
import { EB_Garamond } from 'next/font/google'
import SessionProvider from '@/components/SessionProvider'
import './globals.css'

const garamond = EB_Garamond({
  subsets: ['latin'],
  variable: '--font-garamond',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Kulmi — AI Study Assistant',
  description: 'Study smarter with AI. Upload PDFs, ask questions, and generate practice exams.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Kulmi' },
}

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><link rel="apple-touch-icon" href="/icon-192.png" /></head>
      <body className={`${garamond.variable} bg-white text-[#111111] antialiased`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
