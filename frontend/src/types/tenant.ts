/**
 * Tenant status enum
 */
export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
}

/**
 * Tenant package enum
 */
export enum TenantPackage {
  BASIC = 'BASIC',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE',
  CUSTOM = 'CUSTOM',
}

/**
 * Tenant interface
 */
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain: string;
  status: TenantStatus;
  package: TenantPackage;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  modules: string[];
  brandingSettings?: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
    faviconUrl?: string;
    customCss?: string;
  };
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
}

/**
 * User role enum
 */
export enum UserRole {
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  TENANT_ADMIN = 'TENANT_ADMIN',
  TENANT_USER = 'TENANT_USER',
}

/**
 * User interface
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  tenantId?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  avatar?: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  mfaEnabled: boolean;
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    language?: string;
    timezone?: string;
    notifications?: {
      email?: boolean;
      inApp?: boolean;
      mobile?: boolean;
    };
  };
}

/**
 * Module interface
 */
export interface Module {
  id: string;
  name: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DEPRECATED';
  version: string;
  price: number;
  category: string;
  icon?: string;
  requiredPermissions: string[];
  configurations?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Team interface
 */
export interface Team {
  id: string;
  name: string;
  description?: string;
  tenantId: string;
  leaderId: string;
  members: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Notification interface
 */
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

/**
 * Billing information interface
 */
export interface BillingInfo {
  id: string;
  tenantId: string;
  plan: TenantPackage;
  status: 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'TRIAL';
  trialEndsAt?: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  amount: number;
  currency: string;
  paymentMethod?: {
    type: 'CREDIT_CARD' | 'PAYPAL' | 'BANK_TRANSFER';
    last4?: string;
    expiryMonth?: number;
    expiryYear?: number;
    brand?: string;
  };  invoices: {
    id: string;
    amount: number;
    status: 'PAID' | 'UNPAID' | 'VOID';
    date: string;
    dueDate: string;
    paidAt?: string;
  }[];
}

/**
 * Activity interface
 */
export interface Activity {
  id: string;
  action: string;
  user?: string;
  userId?: string;
  tenantId?: string;
  timestamp: string;
  description?: string;
  metadata?: Record<string, any>;
}

/**
 * Chart data point interface
 */
export interface ChartDataPoint {
  date: string;
  [key: string]: string | number;
}
