'use client';

import { useEffect, useState, useCallback } from 'react';
import { Workbox, messageSW } from 'workbox-window';

type PWAStatus = 'installing' | 'installed' | 'activated' | 'controlling' | 'error' | 'unregistered';

interface UsePWAOptions {
  onUpdate?: () => void;
  onSuccess?: () => void;
  onInstalling?: () => void;
  onError?: (error: Error) => void;
  immediate?: boolean;
  onOffline?: () => void;
  onOnline?: () => void;
}

interface UsePWAReturn {
  isOnline: boolean;
  status: PWAStatus;
  isUpdateAvailable: boolean;
  acceptUpdate: () => Promise<void>;
  installPrompt: () => Promise<boolean>;
  subscription: PushSubscription | null;
  subscribeToPush: () => Promise<PushSubscription | null>;
  unsubscribeFromPush: () => Promise<boolean>;
}

let deferredPrompt: any = null;

export function usePWA(options: UsePWAOptions = {}): UsePWAReturn {
  const [wb, setWb] = useState<Workbox | null>(null);
  const [status, setStatus] = useState<PWAStatus>('unregistered');
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isUpdateAvailable, setIsUpdateAvailable] = useState<boolean>(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  // Check if the app is installable
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent Chrome 67 and earlier from automatically showing the prompt
        e.preventDefault();
        // Stash the event so it can be triggered later
        deferredPrompt = e;
      });
    }
  }, []);
  
  // Online status handler
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      options.onOnline && options.onOnline();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      options.onOffline && options.onOffline();
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [options]);

  // Initialize Workbox
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      window.workbox !== undefined
    ) {
      const workbox = new Workbox('/sw.js');
      
      // Thêm các event handlers
      workbox.addEventListener('installing', () => {
        setStatus('installing');
        options.onInstalling && options.onInstalling();
      });
      
      workbox.addEventListener('installed', (event) => {
        setStatus('installed');
        if (event.isUpdate) {
          setIsUpdateAvailable(true);
          options.onUpdate && options.onUpdate();
        } else {
          options.onSuccess && options.onSuccess();
        }
      });
      
      workbox.addEventListener('controlling', () => {
        setStatus('controlling');
      });
      
      workbox.addEventListener('activated', (event) => {
        setStatus('activated');
        if (event.isUpdate) {
          // Force reload once the new SW is activated
          window.location.reload();
        }
      });
      
      workbox.addEventListener('message', (event) => {
        console.log('Message from Service Worker:', event.data);
      });
      
      workbox.register().catch((error) => {
        setStatus('error');
        options.onError && options.onError(error);
        console.error('Service worker registration failed:', error);
      });
      
      setWb(workbox);

      // Kiểm tra subscription hiện tại
      checkSubscription();
    }
  }, [options]);

  // Đồng ý cập nhật service worker mới
  const acceptUpdate = useCallback(async () => {
    if (wb) {
      await messageSW(wb.active!, { type: 'SKIP_WAITING' });
    }
  }, [wb]);

  // Hiển thị install prompt
  const installPrompt = useCallback(async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      deferredPrompt = null;
      return choiceResult.outcome === 'accepted';
    }
    return false;
  }, []);

  // Kiểm tra subscription hiện tại
  const checkSubscription = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const currentSubscription = await registration.pushManager.getSubscription();
        setSubscription(currentSubscription);
        return currentSubscription;
      } catch (error) {
        console.error('Error checking push subscription:', error);
        return null;
      }
    }
    return null;
  }, []);

  // Đăng ký push notification
  const subscribeToPush = useCallback(async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        
        // Tạo subscription mới
        const convertedVapidKey = urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
        );
        
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });
        
        // Lưu subscription lên server
        // Phần này cần được cài đặt khi có endpoint API
        // await fetch('/api/push/subscribe', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ subscription })
        // });
        
        setSubscription(subscription);
        return subscription;
      } catch (error) {
        console.error('Error subscribing to push notifications:', error);
        return null;
      }
    }
    return null;
  }, []);

  // Hủy đăng ký push notification
  const unsubscribeFromPush = useCallback(async () => {
    if (!subscription) return false;
    
    try {
      const success = await subscription.unsubscribe();
      
      if (success) {
        // Gửi thông báo lên server
        // await fetch('/api/push/unsubscribe', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ subscription })
        // });
        
        setSubscription(null);
      }
      
      return success;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    }
  }, [subscription]);

  return {
    isOnline,
    status,
    isUpdateAvailable,
    acceptUpdate,
    installPrompt,
    subscription,
    subscribeToPush,
    unsubscribeFromPush
  };
}

// Tiện ích chuyển đổi string base64 thành Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}
