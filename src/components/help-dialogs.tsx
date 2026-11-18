'use client';

import useSWR from 'swr';
import { BookOpen, Filter, Shield } from 'lucide-react';
import { AppDialog } from '@/components/app-dialog';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export type HelpTopic = 'help' | 'filters' | 'authentihash';

interface HelpContent {
  globalHelp: string;
  filterHelp: string;
  authentihashHelp: string;
}

const TOPICS: Record<HelpTopic, { title: string; description: string; icon: React.ReactNode; field: keyof HelpContent }> = {
  help: { title: 'About this database', description: 'What this project is, what it does, and the key terms.', icon: <BookOpen />, field: 'globalHelp' },
  filters: { title: 'How filters work', description: 'What each filter does, and how they combine.', icon: <Filter />, field: 'filterHelp' },
  authentihash: { title: 'Authentihashes explained', description: 'Code-level hashes that stay stable across re-signing.', icon: <Shield />, field: 'authentihashHelp' },
};

const fetcher = (url: string) => fetch(url).then((r) => r.json() as Promise<HelpContent>);

export default function HelpDialogs({ topic, onClose }: { topic: HelpTopic | null; onClose: () => void }) {
  const { data } = useSWR(topic ? '/api/help-content' : null, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 3_600_000,
  });

  return (
    <>
      {(Object.keys(TOPICS) as HelpTopic[]).map((key) => {
        const meta = TOPICS[key];
        return (
          <AppDialog
            key={key}
            open={topic === key}
            onOpenChange={(open) => !open && onClose()}
            title={meta.title}
            description={meta.description}
            icon={meta.icon}
          >
            {data ? (
              <MarkdownRenderer content={data[meta.field]} />
            ) : (
              <div className="flex flex-col gap-3" aria-label="Loading">
                <div className="skeleton h-4 w-1/2 rounded" />
                <div className="skeleton h-3 w-full rounded" />
                <div className="skeleton h-3 w-11/12 rounded" />
                <div className="skeleton h-3 w-4/5 rounded" />
              </div>
            )}
          </AppDialog>
        );
      })}
    </>
  );
}
