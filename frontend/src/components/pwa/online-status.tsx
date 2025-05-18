'use client';

import { usePWA } from '@/lib/hooks/use-pwa';

export function OnlineStatus() {
  const { isOnline } = usePWA();

  return (
    <div className="flex items-center gap-2">
      <div
        className={`h-2 w-2 rounded-full ${
          isOnline ? 'bg-green-500' : 'bg-red-500'
        }`}
      />
      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
        {isOnline ? 'Online' : 'Offline'}
      </span>
    </div>
  );
}
