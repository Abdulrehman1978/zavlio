import type { Metadata } from 'next';
import { Hanken_Grotesk, Newsreader, Space_Grotesk } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';
import { publicEnv } from '../lib/env/public';
import { AnalyticsProvider } from '../components/analytics-provider';

const hankenGrotesk = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--font-hanken',
  display: 'swap',
});

const newsreader = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-newsreader',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Zavlio — Build What's Next",
  description: 'We build brands, products and digital systems that move businesses forward.',
  metadataBase: new URL('https://zavlio.online'),
  alternates: {
    canonical: 'https://zavlio.online',
  },
  openGraph: {
    title: "Zavlio — Build What's Next",
    description: 'We build brands, products and digital systems that move businesses forward.',
    url: 'https://zavlio.online',
    siteName: 'Zavlio',
    type: 'website',
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${hankenGrotesk.variable} ${newsreader.variable} ${spaceGrotesk.variable}`}
    >
      <body
        suppressHydrationWarning
        className="bg-[#F8FAFC] text-slate-900 min-h-screen selection:bg-indigo-600 selection:text-white antialiased"
      >
        <AnalyticsProvider
          enabled={publicEnv.NEXT_PUBLIC_ANALYTICS_ENABLED}
          debug={publicEnv.NEXT_PUBLIC_ANALYTICS_DEBUG}
        >
          {children}
        </AnalyticsProvider>
      </body>
    </html>
  );
}
