import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import './globals.css';
import { ThemeProvider } from 'next-themes';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import ClientScripts from '@/components/ClientScripts';
import { AppWrapper } from '@/components/AppWrapper';
import { Toaster } from '@/components/ui/sonner';

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
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent" aria-hidden />
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
                  const saved = localStorage.getItem('theme');
                  const theme = saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'dark';
                  const resolved = theme === 'system'
                    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                    : theme;
                  document.documentElement.setAttribute('data-color-scheme', resolved);
                  if (resolved === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {
                  document.documentElement.setAttribute('data-color-scheme', 'dark');
                  document.documentElement.classList.add('dark');
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
      <body className="antialiased transition-colors duration-smooth ease-apple">
        <ThemeProvider attribute="class" storageKey="theme" defaultTheme="dark" enableSystem>
          <Suspense fallback={<LoadingFallback />}>
            <a
              href="#main-content"
              className="skip-link fixed left-0 top-0 z-[100] -translate-y-full bg-primary px-4 py-2 text-primary-foreground transition-transform focus-visible:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Skip to main content
            </a>
            <div className="fixed top-4 right-4 z-50">
              <ThemeSwitcher />
            </div>
            <AppWrapper>
              <div className="app-entry">{children}</div>
            </AppWrapper>

            <ClientScripts />
            <Toaster position="bottom-right" richColors closeButton />
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
