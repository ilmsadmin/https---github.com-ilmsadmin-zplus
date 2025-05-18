'use client';

import { useEffect, useState } from 'react';
import { usePWA } from '@/lib/hooks/use-pwa';

export function PWAInstallPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const { installPrompt } = usePWA();

  useEffect(() => {
    // Kiểm tra nếu đã đóng thông báo trước đó
    const hasClosedPrompt = localStorage.getItem('pwa-install-prompt-closed');
    
    // Nếu chưa đóng và không phải là Safari trên iOS (không hỗ trợ install prompt)
    const iOSSafari = /iP(ad|hone|od).+Version\/[\d\.]+.*Safari/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    // Chỉ hiển thị sau 5 giây và khi chưa được cài đặt
    if (!hasClosedPrompt && !iOSSafari && !isStandalone) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleInstall = async () => {
    const installed = await installPrompt();
    if (installed) {
      setIsVisible(false);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('pwa-install-prompt-closed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="mx-auto max-w-md rounded-lg bg-white p-4 shadow-lg dark:bg-gray-800">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Cài đặt ứng dụng
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Cài đặt ứng dụng để trải nghiệm tốt hơn, truy cập nhanh hơn và làm việc offline.
        </p>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleInstall}
            className="flex-1 rounded-md bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Cài đặt ngay
          </button>
          <button
            onClick={handleClose}
            className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            Để sau
          </button>
        </div>
      </div>
    </div>
  );
}
