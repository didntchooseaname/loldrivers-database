'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { History } from 'lucide-react';

export default function ChangelogRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center text-center gap-4 px-6">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground">
          <History className="h-6 w-6" />
        </span>
        <h1 className="text-xl font-semibold tracking-tight">Taking you back…</h1>
        <p className="text-sm text-muted-foreground max-w-sm">
          The changelog now lives in a popup on the main page. Redirecting you there.
        </p>
      </div>
    </div>
  );
}
