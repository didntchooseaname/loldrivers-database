'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ChangelogRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Rediriger vers la page d'accueil
    router.replace('/');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="text-center">
        <div className="text-6xl mb-4">📝</div>
        <h1 className="text-2xl font-bold mb-4">Redirecting to Changelog...</h1>
        <p className="text-muted-foreground">
          The changelog is now available as a popup on the main page.
        </p>
      </div>
    </div>
  );
}
