import type { Metadata, Viewport } from 'next';
import './globals.css';
import ThemeToggle from '@/components/ThemeToggle';

export const metadata: Metadata = {
  title: 'LOLDrivers Database',
  description: 'Vulnerable and malicious Windows drivers database',
  icons: {
    icon: '/favicon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeToggle />
        {children}
        {/* Scripts pour les performances */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Preload critical resources
              if ('requestIdleCallback' in window) {
                requestIdleCallback(() => {
                  // Preload next page of drivers
                  fetch('/api/drivers?page=2&limit=50');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
