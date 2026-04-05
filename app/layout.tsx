import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { DM_Sans, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/contexts/AuthContext'
import { ShiftProvider } from '@/contexts/ShiftContext'
import './globals.css'

const aeonik = localFont({
  src: [
    {
      path: '../fonts/aeonik/fonnts.com-Aeonik-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/aeonik/fonnts.com-Aeonik-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-aeonik',
  display: 'swap',
});
const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
});
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Sentinel | Cognitive Baseline & Fatigue Monitoring',
  description: 'An AI-powered clinical companion designed to track cognitive sharpness, monitor shift fatigue, and prevent burnout through proactive baseline testing.',
  icons: {
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
    icon: [
      {
        url: '/favicon.ico',
      },
      {
        url: '/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: '/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png',
      },
    ],
  },
  manifest: '/site.webmanifest',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className={`${aeonik.className} ${aeonik.variable} ${dmSans.variable} font-sans antialiased text-white selection:bg-[#22C55E]/30 selection:text-white bg-[#0A0F1E] overflow-x-hidden`}>
        <AuthProvider>
          <ShiftProvider>
            {children}
            {process.env.NODE_ENV === 'production' && <Analytics />}
          </ShiftProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
