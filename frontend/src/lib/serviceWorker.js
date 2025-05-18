import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { NetworkFirst, StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';
import { registerRoute } from 'workbox-routing';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { skipWaiting } from 'workbox-core';

// Lấy thông tin tenant từ URL
const getTenantFromUrl = () => {
  try {
    const url = self.location.href;
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    // Lấy subdomain nếu có
    const parts = hostname.split('.');
    if (parts.length > 2) {
      return parts[0];
    }
    
    // Nếu không có subdomain, kiểm tra path
    const pathParts = urlObj.pathname.split('/');
    if (pathParts.length > 1 && pathParts[1] === 'tenant') {
      return pathParts[2];
    }
    
    return 'system'; // Default là system nếu không phải tenant
  } catch (error) {
    return 'system';
  }
};

const tenant = getTenantFromUrl();

skipWaiting();
clientsClaim();

// Cache các static assets
registerRoute(
  /\.(?:js|css)$/,
  new StaleWhileRevalidate({
    cacheName: `static-assets-${tenant}`,
  })
);

// Cache hình ảnh
registerRoute(
  /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
  new CacheFirst({
    cacheName: `images-${tenant}`,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 ngày
      }),
    ],
  })
);

// Cache Google Fonts
registerRoute(
  /^https:\/\/fonts\.(?:googleapis|gstatic)\.com/,
  new CacheFirst({
    cacheName: `google-fonts-${tenant}`,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 năm
      }),
    ],
  })
);

// Cache API requests với NetworkFirst strategy
registerRoute(
  /\/api\//,
  new NetworkFirst({
    cacheName: `api-cache-${tenant}`,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60, // 5 phút
      }),
    ],
  })
);

// Xử lý offline fallback
const offlineFallbackPage = '/offline';

// Cache offline page
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(`offline-${tenant}`).then((cache) => {
      return cache.add(offlineFallbackPage);
    })
  );
});

// Xử lý navigation requests
registerRoute(
  ({ request }) => request.mode === 'navigate',
  async ({ event }) => {
    try {
      // Try to get the response from network
      return await new NetworkFirst({
        cacheName: `pages-${tenant}`,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 25,
            maxAgeSeconds: 24 * 60 * 60, // 1 ngày
          }),
        ],
      }).handle({ event });
    } catch (error) {
      // Nếu network request thất bại, trả về offline page
      const cache = await caches.open(`offline-${tenant}`);
      const cachedResponse = await cache.match(offlineFallbackPage);
      return cachedResponse;
    }
  }
);

// Đăng ký xử lý sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

// Sync data từ IndexedDB lên server khi online
async function syncData() {
  // Code xử lý sync data từ IndexedDB lên server sẽ được triển khai sau
  console.log('Syncing data for tenant:', tenant);
}

// Xử lý push notification
self.addEventListener('push', (event) => {
  const data = event.data.json();
  
  // Kiểm tra xem notification có áp dụng cho tenant hiện tại không
  if (data.tenant && data.tenant !== tenant && data.tenant !== 'all') {
    return;
  }
  
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      tenant: data.tenant || tenant
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Xử lý click vào notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const url = event.notification.data.url;
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      // Kiểm tra xem đã có window nào đang mở không
      for (const client of windowClients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // Nếu không có window nào mở, mở tab mới
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
