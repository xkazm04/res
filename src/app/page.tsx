'use client';

import { ResearchMap } from '@/src/components/map';
import { ReportModal } from '@/src/components/layout';

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--bg-primary)]">
      {/* Research Map */}
      <ResearchMap className="h-screen flex flex-col" />

      {/* Report Modal */}
      <ReportModal />
    </main>
  );
}
