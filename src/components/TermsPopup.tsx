'use client';

import useSWR from 'swr';
import { Scale } from 'lucide-react';
import { AppDialog } from '@/components/app-dialog';
import { MarkdownRenderer } from './MarkdownRenderer';

interface TermsPopupProps {
  isVisible: boolean;
  onClose: () => void;
}

const FALLBACK = '# Terms of Service\n\nContent is not available right now.';

const termsFetcher = async (url: string): Promise<string> => {
  const res = await fetch(url);
  const data = await res.json();
  return data.success ? data.content : FALLBACK;
};

export default function TermsPopup({ isVisible, onClose }: TermsPopupProps) {
  const { data, error } = useSWR(isVisible ? '/api/help-content?type=terms' : null, termsFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 3_600_000,
  });

  return (
    <AppDialog
      open={isVisible}
      onOpenChange={(open) => !open && onClose()}
      icon={<Scale />}
      title="Terms & license"
      description="Usage terms, license and disclaimer for this database."
    >
      {data || error ? (
        <MarkdownRenderer content={data ?? FALLBACK} />
      ) : (
        <div className="flex flex-col gap-3" aria-label="Loading">
          <div className="skeleton h-4 w-1/3 rounded" />
          <div className="skeleton h-3 w-full rounded" />
          <div className="skeleton h-3 w-5/6 rounded" />
        </div>
      )}
    </AppDialog>
  );
}
