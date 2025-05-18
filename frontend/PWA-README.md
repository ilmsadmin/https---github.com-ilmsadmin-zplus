# Multi-Tenant Progressive Web App

## Giới thiệu

Dự án Multi-Tenant đã được cấu hình để hoạt động như một Progressive Web App (PWA), cung cấp trải nghiệm mobile-friendly, tính năng offline và các khả năng giống ứng dụng native.

## Các Tính Năng PWA

### 1. Service Worker

Service Worker đã được cấu hình với các tính năng:
- **Cache Strategies**: Sử dụng các chiến lược cache khác nhau cho từng loại tài nguyên
- **Offline Support**: Cho phép truy cập ứng dụng và dữ liệu khi mất kết nối internet
- **Background Sync**: Đồng bộ dữ liệu tự động khi có kết nối trở lại
- **Multi-Tenant Awareness**: Service worker nhận biết tenant từ URL/subdomain

### 2. Web App Manifest

File manifest.json cung cấp metadata cho trình duyệt về cách hiển thị ứng dụng:
- **Install Banner**: Cho phép người dùng thêm ứng dụng vào màn hình chính
- **Splash Screen**: Hiển thị màn hình chào khi khởi động
- **Theme Colors**: Tùy chỉnh theme và brand colors

### 3. Push Notifications

Hỗ trợ push notifications cho các cập nhật real-time:
- **Permission Flow**: Flow xin quyền người dùng thân thiện
- **Notification Types**: Hỗ trợ nhiều loại thông báo (alerts, reminders, updates)
- **Tenant-Specific**: Notifications được phân tách theo tenant

### 4. Offline Data

Quản lý dữ liệu offline với IndexedDB:
- **Caching**: Cache API responses để sử dụng offline
- **Queue Requests**: Lưu trữ API requests khi offline để thực hiện sau
- **Data Persistence**: Lưu trữ dữ liệu quan trọng trên thiết bị

## Cách Sử Dụng

### Cài Đặt App Lên Màn Hình Chính

1. Truy cập ứng dụng trong Chrome, Edge hoặc Safari trên iOS
2. Trên Chrome/Edge: Click vào biểu tượng cài đặt trên thanh địa chỉ
3. Trên iOS: Tap vào Share button và chọn "Add to Home Screen"

### Quản Lý Notifications

1. Khi ứng dụng hỏi bật thông báo, chọn "Allow"
2. Quản lý cài đặt thông báo trong phần User Settings
3. Có thể tùy chỉnh loại thông báo nhận được

### Sử Dụng Offline

1. Ứng dụng sẽ tiếp tục hoạt động khi không có kết nối
2. Dữ liệu được nhập sẽ được lưu và đồng bộ khi có kết nối trở lại
3. Khi offline, một biểu tượng sẽ hiển thị ở góc màn hình

## Phát Triển

### Thêm Route Cacheable Mới

```javascript
// Trong file serviceWorker.js
registerRoute(
  /\/api\/your-new-endpoint\//,
  new NetworkFirst({
    cacheName: `your-cache-name-${tenant}`,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60,
      }),
    ],
  })
);
```

### Thêm Offline Storage Model Mới

```typescript
// Trong file offline-storage.ts
if (!db.objectStoreNames.contains('yourNewStore')) {
  const newStore = db.createObjectStore('yourNewStore', {
    keyPath: 'id',
  });
  newStore.createIndex('updatedAt', 'updatedAt');
  // Thêm các indexes khác nếu cần
}
```

### Gửi Push Notification

```typescript
// API route hoặc server-side code
const webpush = require('web-push');

webpush.sendNotification(
  subscription,
  JSON.stringify({
    title: 'Thông báo mới',
    body: 'Nội dung thông báo',
    icon: '/icons/icon-192x192.png',
    data: {
      url: '/path-to-open',
      tenant: 'tenant-id'
    }
  })
);
```

## Troubleshooting

### Service Worker Không Cập Nhật

Nếu service worker không cập nhật:
1. Truy cập chrome://serviceworker-internals/ trong Chrome
2. Tìm và unregister service worker của ứng dụng
3. Refresh trang web

### Vấn Đề Với Push Notifications

Nếu push notifications không hoạt động:
1. Kiểm tra quyền trong cài đặt trình duyệt
2. Đảm bảo VAPID keys đã được cấu hình đúng
3. Kiểm tra subscription object đã được lưu thành công

### Dữ Liệu Không Đồng Bộ

Nếu dữ liệu không đồng bộ khi online:
1. Kiểm tra IndexedDB trong DevTools (Application tab)
2. Xem outbox queue có entries nào bị lỗi không
3. Kiểm tra network requests trong Console

## Best Practices

1. **Progressive Enhancement**: Luôn thiết kế với progressive enhancement để đảm bảo trang web hoạt động ngay cả khi không có JavaScript
2. **Responsive Design**: Đảm bảo UI hoạt động tốt trên mọi kích thước màn hình
3. **Performance**: Sử dụng code splitting và lazy loading để tối ưu tải trang
4. **Security**: Đảm bảo HTTPS cho tất cả requests và responses

## Tài Nguyên Hữu Ích

- [Web App Manifest Generator](https://app-manifest.firebaseapp.com/)
- [Lighthouse Tool](https://developers.google.com/web/tools/lighthouse)
- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox)
