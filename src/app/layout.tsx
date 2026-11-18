import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from 'next-themes';
import { ServiceWorker } from '@/components/ServiceWorker';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

const SITE_URL = 'https://loldb.xsec.fr';

const fontSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex',
  display: 'swap',
});

const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'LOLDrivers Database - Vulnerable Windows Drivers for Security Research',
    template: '%s | LOLDrivers Database',
  },
  description: 'Search and analyze vulnerable and malicious Windows drivers. Advanced behavioral analysis, Microsoft MVDB blocklist verification, certificate validation, and threat hunting tools for security researchers.',
  keywords: [
    'LOLDrivers', 'vulnerable drivers', 'windows drivers', 'driver security',
    'HVCI', 'MVDB', 'Microsoft Vulnerable Driver Blocklist',
    'malware analysis', 'threat hunting', 'security research',
    'process killer drivers', 'BYOVD', 'bring your own vulnerable driver',
    'kernel drivers', 'driver hashes', 'authentihash',
  ],
  authors: [{ name: 'LOLDrivers Database', url: SITE_URL }],
  creator: 'LOLDrivers Database',
  publisher: 'LOLDrivers Database',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
  },
  alternates: { canonical: '/' },
  openGraph: {
    title: 'LOLDrivers Database - Vulnerable Windows Drivers',
    description: 'Search and analyze vulnerable Windows drivers with behavioral analysis, MVDB verification, and certificate validation.',
    url: SITE_URL,
    siteName: 'LOLDrivers Database',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary',
    title: 'LOLDrivers Database',
    description: 'Search and analyze vulnerable Windows drivers for security research and threat hunting.',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '16x16 32x32 48x48' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  manifest: '/manifest.json',
  category: 'security',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbfbfc' },
    { media: '(prefers-color-scheme: dark)', color: '#0f1114' },
  ],
};

// JSON-LD structured data for search engines
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'LOLDrivers Database',
  url: SITE_URL,
  description: 'Search and analyze vulnerable and malicious Windows drivers for security research.',
  applicationCategory: 'SecurityApplication',
  operatingSystem: 'Any',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  author: {
    '@type': 'Organization',
    name: 'LOLDrivers Database',
    url: 'https://github.com/didntchooseaname/loldrivers-database',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${fontSans.variable} ${fontMono.variable}`}>
      <head>
        {/* JSON-LD structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <meta name="color-scheme" content="light dark" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" storageKey="theme" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <ErrorBoundary>
            <a
              href="#results"
              className="fixed left-3 top-3 z-[100] -translate-y-[150%] rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground transition-transform focus-visible:translate-y-0"
            >
              Skip to results
            </a>
            <TooltipProvider delayDuration={350} skipDelayDuration={150}>
              {children}
            </TooltipProvider>
            <ServiceWorker />
            <Toaster position="bottom-right" closeButton />
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
