import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import './globals.css';
import ThemeToggle from '@/components/ThemeToggle';
import ClientScripts from '@/components/ClientScripts';
import { ClientLayout } from '@/components/ClientLayout';

export const metadata: Metadata = {
  title: 'LOLDrivers Database',
  description: 'Quickly and easily find the vulnerable driver that suits your needs - Comprehensive Windows driver vulnerability database',
  keywords: 'windows drivers, vulnerabilities, security, malware, lolbins, security research',
  authors: [{ name: 'LOLDrivers Team' }],
  creator: 'LOLDrivers',
  publisher: 'LOLDrivers',
  robots: 'index, follow',
  openGraph: {
    title: 'LOLDrivers Database',
    description: 'Quickly and easily find the vulnerable driver that suits your needs',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LOLDrivers Database',
    description: 'Quickly and easily find the vulnerable driver that suits your needs',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' }
    ],
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1f2937' }
  ],
};

// Optimisation du loading avec Suspense
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Inline script to prevent theme flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedTheme = localStorage.getItem('theme');
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  const theme = savedTheme || (prefersDark ? 'dark' : 'light');
                  document.documentElement.setAttribute('data-color-scheme', theme);
                } catch (e) {
                  document.documentElement.setAttribute('data-color-scheme', 'light');
                }
              })();
            `,
          }}
        />
        
        {/* Preconnect pour les ressources externes */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Font Awesome */}
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
        
        {/* Optimisation du rendu */}
        <meta name="color-scheme" content="light dark" />
        <meta name="format-detection" content="telephone=no" />
        
        {/* Security */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
      </head>
      <body className="antialiased">
        <Suspense fallback={<LoadingFallback />}>
          <ThemeToggle />
          <ClientLayout>
            <main className="min-h-screen">
              {children}
            </main>
          </ClientLayout>
          
          <ClientScripts />
        </Suspense>
      </body>
    </html>
  );
}
