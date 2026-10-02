import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { publicEnv } from '../lib/env/public';
import { AnalyticsProvider } from '../components/analytics-provider';

export const metadata: Metadata = {
  description: 'Zavlio builds brands, products, and digital systems.',
  title: 'Zavlio',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
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
