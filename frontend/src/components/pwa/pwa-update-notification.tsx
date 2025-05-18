'use client';

import { useEffect, useState } from 'react';
import { usePWA } from '@/lib/hooks/use-pwa';

export function PWAUpdateNotification() {
  const [isVisible, setIsVisible] = useState(false);
  const { isUpdateAvailable, acceptUpdate } = usePWA({
    onUpdate: () => setIsVisible(true),
  });

  useEffect(() => {
    if (isUpdateAvailable) {
      setIsVisible(true);
    }
  }, [isUpdateAvailable]);

  const handleUpdate = async () => {
    await acceptUpdate();
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="mx-auto max-w-md rounded-lg bg-white p-4 shadow-lg dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Cập nhật mới
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Phiên bản mới đã sẵn sàng. Vui lòng cập nhật để có trải nghiệm tốt nhất.
              </p>
            </div>
          </div>
          <button
            onClick={handleUpdate}
            className="ml-4 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Cập nhật
          </button>
        </div>
      </div>
    </div>
  );
}
