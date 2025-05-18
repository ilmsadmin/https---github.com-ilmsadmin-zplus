'use client';

import { OnlineStatus } from '@/components/pwa';

export default function StatusIndicator() {
  return (
    <div className="fixed bottom-4 right-4 z-50 inline-flex items-center rounded-full bg-white px-3 py-1 shadow-md ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
      <OnlineStatus />
    </div>
  );
}
