// UI-specific types for displaying data in the frontend
// These types are separate from our domain model types and are specifically for UI components

export interface UiUser {
  id: string;
  name: string;
  email: string;
  role: string;
  lastLogin: string;
  status?: string;
}

export interface UiDomain {
  id: string;
  domain: string;
  isDefault: boolean;
  status: string;
  sslEnabled: boolean;
  sslExpiresAt?: string | null;
}

export interface UiModule {
  id: string;
  name: string;
  status: string;
  usersCount?: number;
  lastActivity?: string;
  description?: string;
}

export interface UiActivity {
  id: string;
  action: string;
  user?: string;
  timestamp: string;
  description?: string;
}

export interface UiTenant {
  id: string;
  name: string;
  schemaName: string;
  packageName: string;
  status: string;
  usersCount: number;
  domainsCount: number;
  storageUsed: string;
  storageLimit: string;
  createdAt: string;
  billingEmail: string;
  subscriptionStartDate: string;
  subscriptionEndDate: string;
}

export interface ChartDataPoint {
  date: string;
  [key: string]: string | number;
}
