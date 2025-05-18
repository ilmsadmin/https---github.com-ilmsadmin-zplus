'use client';

import { useEffect, useState } from 'react';
import { usePWA } from '@/lib/hooks/use-pwa';

export function PushNotificationPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');
  const { subscribeToPush } = usePWA();

  useEffect(() => {
    // Kiểm tra trạng thái quyền thông báo
    if ('Notification' in window) {
      setPermissionState(Notification.permission);
      
      // Chỉ hiển thị nếu chưa được cấp quyền hoặc bị từ chối
      if (Notification.permission === 'default') {
        const hasPrompted = localStorage.getItem('push-notification-prompted');
        
        if (!hasPrompted) {
          // Hiển thị sau 10 giây
          const timer = setTimeout(() => {
            setIsVisible(true);
          }, 10000);
          
          return () => clearTimeout(timer);
        }
      }
    }
  }, []);

  const handleRequestPermission = async () => {
    try {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        setPermissionState(permission);
        
        if (permission === 'granted') {
          // Đăng ký subscription
          const subscription = await subscribeToPush();
          console.log('Push subscription:', subscription);
          
          // Gửi thông báo chào mừng
          if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            registration.showNotification('Thông báo đã được bật', {
              body: 'Bạn sẽ nhận được các thông báo quan trọng từ ứng dụng.',
              icon: '/icons/icon-192x192.png',
              vibrate: [100, 50, 100],
            });
          }
        }
        
        localStorage.setItem('push-notification-prompted', 'true');
        setIsVisible(false);
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const handleClose = () => {
    localStorage.setItem('push-notification-prompted', 'true');
    setIsVisible(false);
  };

  if (!isVisible || permissionState !== 'default') return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="mx-auto max-w-md rounded-lg bg-white p-4 shadow-lg dark:bg-gray-800">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center">
            <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Bật thông báo
            </h3>
          </div>
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
          Bật thông báo để nhận các cập nhật quan trọng, tin nhắn và thông báo về hoạt động trong hệ thống.
        </p>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRequestPermission}
            className="flex-1 rounded-md bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Bật thông báo
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
