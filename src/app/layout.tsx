import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { Montserrat, Fira_Code } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from 'next-themes';
import ClientScripts from '@/components/ClientScripts';
import { AppWrapper } from '@/components/AppWrapper';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Toaster } from '@/components/ui/sonner';

const SITE_URL = 'https://loldb.xsec.fr';

const fontSans = Montserrat({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const fontMono = Fira_Code({
  subsets: ['latin'],
  variable: '--font-mono',
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
      { url: '/favicon.ico', sizes: 'any' },
    ],
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
    { media: '(prefers-color-scheme: light)', color: '#e8e8e8' },
    { media: '(prefers-color-scheme: dark)', color: '#2b2b2b' },
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

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" aria-hidden />
    </div>
  );
}

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
        {/* Theme flash prevention */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('theme');var t=s==='light'||s==='dark'||s==='system'?s:'dark';var r=t==='system'?window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light':t;document.documentElement.setAttribute('data-color-scheme',r);if(r==='dark')document.documentElement.classList.add('dark');else document.documentElement.classList.remove('dark')}catch(e){document.documentElement.setAttribute('data-color-scheme','dark');document.documentElement.classList.add('dark')}})();`,
          }}
        />
        {/* Font Awesome async (help dialogs only) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var l=document.createElement('link');l.rel='stylesheet';l.href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';l.integrity='sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==';l.crossOrigin='anonymous';l.referrerPolicy='no-referrer';document.head.appendChild(l)})();`,
          }}
        />
        <meta name="color-scheme" content="light dark" />
        <meta name="format-detection" content="telephone=no" />
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" storageKey="theme" defaultTheme="dark" enableSystem>
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <a
                href="#main-content"
                className="skip-link fixed left-0 top-0 z-[100] -translate-y-full bg-primary px-4 py-2 text-primary-foreground transition-transform focus-visible:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Skip to main content
              </a>
              <AppWrapper>
                <div className="app-entry">{children}</div>
              </AppWrapper>
              <ClientScripts />
              <Toaster position="bottom-right" richColors closeButton />
            </Suspense>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
