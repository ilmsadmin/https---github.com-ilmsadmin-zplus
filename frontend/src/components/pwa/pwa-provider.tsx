'use client';

import { PWAUpdateNotification } from './pwa-update-notification';
import { PWAInstallPrompt } from './pwa-install-prompt';
import { PushNotificationPrompt } from './push-notification-prompt';
import { useEffect, useState } from 'react';
import { usePWA } from '@/lib/hooks/use-pwa';

interface PWAProviderProps {
  children: React.ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  const [isSupported, setIsSupported] = useState(false);
  const { status } = usePWA();
  
  useEffect(() => {
    // Kiểm tra nếu PWA được hỗ trợ
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      setIsSupported(true);
    }
  }, []);

  return (
    <>
      {children}
      {isSupported && (
        <>
          <PWAUpdateNotification />
          <PWAInstallPrompt />
          <PushNotificationPrompt />
        </>
      )}
    </>
  );
}
