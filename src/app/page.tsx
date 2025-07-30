import DriversClient from '@/components/DriversClient';
import DriversCache from '@/lib/driversCache';

export default async function HomePage() {
  // Pré-chargement des données côté serveur (SSR)
  const cache = DriversCache.getInstance();
  
  try {
    // Charger les premières données et les statistiques
    const [initialDrivers, initialStats] = await Promise.all([
      cache.getDrivers(1, 50),
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
          <p>We're experiencing technical difficulties. Please try again later.</p>
          <p className="error-details">{error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      </div>
    );
  }
}

// Métadonnées pour SEO
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
