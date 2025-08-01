import DriversClient from '@/components/DriversClient';
import DriversCache from '@/lib/driversCache';

export default async function HomePage() {
  // Server-side data preloading (SSR)
  const cache = DriversCache.getInstance();
  
  try {
    // Load initial data and statistics
    const [initialDrivers, initialStats] = await Promise.all([
      cache.getDrivers(1), // Load all drivers for SSR
      cache.getStatistics()
    ]);

    return (
      <DriversClient 
        initialDrivers={{
          success: true,
          ...initialDrivers
        }}
        initialStats={{
          success: true,
          stats: initialStats
        }}
      />
    );
  } catch (error) {
    console.error('SSR Error:', error);
    
    // Fallback en cas d'erreur
    return (
      <div className="container">
        <div className="error-message">
          <h1>Error Loading Drivers Database</h1>
          <p>We&apos;re experiencing technical difficulties. Please try again later.</p>
          <p className="error-details">{error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      </div>
    );
  }
}

// Metadata for SEO
export const metadata = {
  title: 'LOLDrivers Database - Vulnerable Windows Drivers',
  description: 'Comprehensive database of vulnerable and malicious Windows drivers for security research and threat hunting.',
  keywords: 'loldrivers, vulnerable drivers, windows security, malware, threat hunting',
  openGraph: {
    title: 'LOLDrivers Database',
    description: 'Vulnerable and malicious Windows drivers database',
    type: 'website',
  },
};
