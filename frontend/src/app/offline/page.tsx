'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function OfflinePage() {
  useEffect(() => {
    // Kiểm tra trạng thái kết nối khi trang tải xong
    const updateOnlineStatus = () => {
      const statusElement = document.getElementById('connection-status');
      if (statusElement) {
        if (navigator.onLine) {
          statusElement.textContent = 'Online';
          statusElement.className = 'text-green-600 font-medium';
        } else {
          statusElement.textContent = 'Offline';
          statusElement.className = 'text-red-600 font-medium';
        }
      }
    };

    // Đăng ký event listeners
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Kiểm tra trạng thái ban đầu
    updateOnlineStatus();

    // Cleanup
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-16">
      <div className="mx-auto w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-indigo-100 p-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-indigo-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z"
              />
            </svg>
          </div>
        </div>
        
        <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">
          Bạn đang offline
        </h1>
        
        <p className="mb-4 text-center text-gray-600">
          Một số tính năng có thể không khả dụng khi bạn không kết nối internet.
        </p>
        
        <div className="mb-6 flex justify-center">
          <span className="mr-2">Trạng thái kết nối:</span>
          <span id="connection-status" className="text-red-600 font-medium">
            Offline
          </span>
        </div>
        
        <div className="mb-4">
          <h2 className="mb-3 font-semibold text-gray-700">Bạn có thể:</h2>
          <ul className="ml-5 list-disc space-y-2 text-gray-600">
            <li>Xem dữ liệu đã được cache</li>
            <li>Sử dụng các tính năng offline</li>
            <li>Thử lại khi có kết nối internet</li>
          </ul>
        </div>
        
        <div className="mt-6 flex justify-center space-x-3">
          <Link
            href="/"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Trở về trang chủ
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Thử lại
          </button>
        </div>
      </div>
    </div>
  );
}
