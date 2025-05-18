'use client';

import { openDB, IDBPDatabase } from 'idb';

// Định nghĩa kiểu dữ liệu cơ bản
interface StorableEntity {
  id: string | number;
  [key: string]: any;
}

// Định nghĩa tên các stores
const STORES = {
  OUTBOX: 'outbox', // Queue các network requests khi offline
  CONTACTS: 'contacts', // Cache contacts trong CRM
  TASKS: 'tasks', // Cache tasks trong CRM/HRM
  EVENTS: 'events', // Cache events trong calendar
  USER_PREFERENCES: 'userPreferences', // Lưu user preferences
  DOCUMENTS: 'documents', // Cache documents
};

// Phiên bản database, tăng khi schema thay đổi
const DB_VERSION = 1;

class OfflineStorageService {
  private dbPromise: Promise<IDBPDatabase> | null = null;
  private dbName: string;

  constructor(tenantId: string) {
    // Tạo tên DB phù hợp với từng tenant
    this.dbName = `multi-tenant-${tenantId}`;
    this.initDatabase();
  }

  private async initDatabase() {
    if (!this.dbPromise) {
      this.dbPromise = openDB(this.dbName, DB_VERSION, {
        upgrade(db) {
          // Outbox store - để lưu các requests khi offline
          if (!db.objectStoreNames.contains(STORES.OUTBOX)) {
            const outboxStore = db.createObjectStore(STORES.OUTBOX, {
              keyPath: 'id',
              autoIncrement: true,
            });
            outboxStore.createIndex('timestamp', 'timestamp');
            outboxStore.createIndex('url', 'url');
          }

          // Contacts store
          if (!db.objectStoreNames.contains(STORES.CONTACTS)) {
            const contactsStore = db.createObjectStore(STORES.CONTACTS, {
              keyPath: 'id',
            });
            contactsStore.createIndex('name', 'name');
            contactsStore.createIndex('email', 'email');
            contactsStore.createIndex('updatedAt', 'updatedAt');
          }

          // Tasks store
          if (!db.objectStoreNames.contains(STORES.TASKS)) {
            const tasksStore = db.createObjectStore(STORES.TASKS, {
              keyPath: 'id',
            });
            tasksStore.createIndex('dueDate', 'dueDate');
            tasksStore.createIndex('status', 'status');
            tasksStore.createIndex('updatedAt', 'updatedAt');
          }

          // Events store
          if (!db.objectStoreNames.contains(STORES.EVENTS)) {
            const eventsStore = db.createObjectStore(STORES.EVENTS, {
              keyPath: 'id',
            });
            eventsStore.createIndex('startDate', 'startDate');
            eventsStore.createIndex('endDate', 'endDate');
            eventsStore.createIndex('updatedAt', 'updatedAt');
          }

          // User preferences store
          if (!db.objectStoreNames.contains(STORES.USER_PREFERENCES)) {
            db.createObjectStore(STORES.USER_PREFERENCES, {
              keyPath: 'key',
            });
          }

          // Documents store
          if (!db.objectStoreNames.contains(STORES.DOCUMENTS)) {
            const documentsStore = db.createObjectStore(STORES.DOCUMENTS, {
              keyPath: 'id',
            });
            documentsStore.createIndex('type', 'type');
            documentsStore.createIndex('updatedAt', 'updatedAt');
          }
        },
      });
    }
    
    return this.dbPromise;
  }

  // CRUD operations cho mỗi entity type
  async getAll<T extends StorableEntity>(storeName: string): Promise<T[]> {
    const db = await this.initDatabase();
    return db.getAll(storeName);
  }

  async getById<T extends StorableEntity>(
    storeName: string,
    id: string | number
  ): Promise<T | undefined> {
    const db = await this.initDatabase();
    return db.get(storeName, id);
  }

  async add<T extends StorableEntity>(
    storeName: string,
    item: T
  ): Promise<string | number> {
    const db = await this.initDatabase();
    // Thêm timestamp nếu chưa có
    const itemWithTimestamp = {
      ...item,
      updatedAt: item.updatedAt || new Date().toISOString(),
    };
    return db.add(storeName, itemWithTimestamp);
  }

  async put<T extends StorableEntity>(
    storeName: string,
    item: T
  ): Promise<string | number> {
    const db = await this.initDatabase();
    // Cập nhật timestamp
    const itemWithTimestamp = {
      ...item,
      updatedAt: new Date().toISOString(),
    };
    return db.put(storeName, itemWithTimestamp);
  }

  async delete(storeName: string, id: string | number): Promise<void> {
    const db = await this.initDatabase();
    return db.delete(storeName, id);
  }

  async clear(storeName: string): Promise<void> {
    const db = await this.initDatabase();
    return db.clear(storeName);
  }

  // Các phương thức riêng cho việc xử lý offline

  // Thêm network request vào outbox khi offline
  async addToOutbox(request: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body: any;
  }): Promise<string | number> {
    const db = await this.initDatabase();
    
    const outboxItem = {
      ...request,
      timestamp: new Date().toISOString(),
      attempts: 0,
    };
    
    return db.add(STORES.OUTBOX, outboxItem);
  }

  // Xử lý các pending requests khi online
  async processOutbox(): Promise<void> {
    const db = await this.initDatabase();
    const outboxItems = await db.getAll(STORES.OUTBOX);
    
    // Xử lý từng request
    for (const item of outboxItems) {
      try {
        // Thực hiện request
        const response = await fetch(item.url, {
          method: item.method,
          headers: item.headers,
          body: item.body ? JSON.stringify(item.body) : undefined,
        });
        
        if (response.ok) {
          // Nếu thành công, xóa khỏi outbox
          await db.delete(STORES.OUTBOX, item.id);
        } else {
          // Nếu thất bại, tăng số lần thử
          item.attempts += 1;
          
          // Nếu đã thử quá 5 lần, bỏ qua
          if (item.attempts > 5) {
            await db.delete(STORES.OUTBOX, item.id);
          } else {
            await db.put(STORES.OUTBOX, item);
          }
        }
      } catch (error) {
        console.error('Error processing outbox item:', error);
        // Tăng số lần thử
        item.attempts += 1;
        if (item.attempts <= 5) {
          await db.put(STORES.OUTBOX, item);
        } else {
          await db.delete(STORES.OUTBOX, item.id);
        }
      }
    }
  }

  // Lưu user preferences
  async setUserPreference(key: string, value: any): Promise<void> {
    const db = await this.initDatabase();
    await db.put(STORES.USER_PREFERENCES, {
      key,
      value,
      updatedAt: new Date().toISOString(),
    });
  }

  // Lấy user preference
  async getUserPreference<T>(key: string): Promise<T | undefined> {
    const db = await this.initDatabase();
    const result = await db.get(STORES.USER_PREFERENCES, key);
    return result?.value;
  }
}

// Singleton instance và các helpers functions
let serviceInstance: OfflineStorageService | null = null;

// Khởi tạo service với tenant ID
export function initOfflineStorage(tenantId: string): OfflineStorageService {
  serviceInstance = new OfflineStorageService(tenantId);
  return serviceInstance;
}

// Lấy instance hiện tại hoặc khởi tạo với tenant mặc định
export function getOfflineStorage(): OfflineStorageService {
  if (!serviceInstance) {
    // Lấy tenant ID từ URL, cookie hoặc local storage
    const tenantId = getTenantId();
    serviceInstance = new OfflineStorageService(tenantId);
  }
  return serviceInstance;
}

// Hàm helper để lấy tenant ID
function getTenantId(): string {
  if (typeof window === 'undefined') {
    return 'default';
  }

  // Thử lấy từ localStorage
  const storedTenantId = localStorage.getItem('current-tenant-id');
  if (storedTenantId) {
    return storedTenantId;
  }

  // Thử lấy từ URL (subdomain)
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  if (parts.length > 2) {
    return parts[0];
  }

  // Thử lấy từ path
  const path = window.location.pathname;
  const pathParts = path.split('/');
  if (pathParts.length > 2 && pathParts[1] === 'tenant') {
    return pathParts[2];
  }

  return 'default';
}

// Export constants
export const OfflineStores = STORES;
