/**
 * Base event interface that all events must implement
 */
export interface BaseEvent {
  id: string;             // Unique event identifier
  type: string;           // Event type (e.g., "tenant.created")
  source: string;         // Source service that generated the event
  time: string;           // ISO timestamp of when the event was generated
  dataVersion: string;    // Schema version for backward compatibility
  dataContentType: string; // Content type for serialization (e.g., "application/json")
  tenantId?: string;      // For tenant-specific events (null for system events)
  correlationId?: string; // For tracking related events in a flow
  causationId?: string;   // ID of the event that caused this event
  userId?: string;        // User who triggered the action (if applicable)
}

/**
 * Tenant event types
 */
export enum TenantEventType {
  CREATED = "tenant.created",
  UPDATED = "tenant.updated",
  SUSPENDED = "tenant.suspended",
  ACTIVATED = "tenant.activated",
  DELETED = "tenant.deleted",
  PACKAGE_CHANGED = "tenant.package_changed"
}

/**
 * Tenant event data interfaces
 */
export interface TenantCreatedEventData {
  id: string;
  name: string;
  schemaName: string;
  packageId: string;
  billingEmail: string;
  subscriptionStartDate: string;
  initialModules: string[];
}

export interface TenantUpdatedEventData {
  id: string;
  name?: string;
  billingEmail?: string;
  billingAddress?: string;
  billingInfo?: any;
}

export interface TenantSuspendedEventData {
  id: string;
  reason: string;
  suspendedAt: string;
  suspendedBy: string;
}

export interface TenantActivatedEventData {
  id: string;
  activatedAt: string;
  activatedBy: string;
  previousStatus: string;
}

export interface TenantDeletedEventData {
  id: string;
  reason: string;
  deletedAt: string;
  deletedBy: string;
  dataRetentionPeriod: number; // in days
}

export interface TenantPackageChangedEventData {
  id: string;
  previousPackageId: string;
  newPackageId: string;
  effectiveDate: string;
  changedBy: string;
  reason: string;
}

/**
 * Domain event types
 */
export enum DomainEventType {
  CREATED = "domain.created",
  VERIFIED = "domain.verified",
  DISABLED = "domain.disabled"
}

/**
 * Domain event data interfaces
 */
export interface DomainCreatedEventData {
  id: string;
  tenantId: string;
  domainName: string;
  isDefault: boolean;
  sslEnabled: boolean;
  verificationMethod: string;
  verificationToken: string;
}

export interface DomainVerifiedEventData {
  id: string;
  tenantId: string;
  domainName: string;
  verifiedAt: string;
  sslCertificateExpiresAt?: string;
}

export interface DomainDisabledEventData {
  id: string;
  tenantId: string;
  domainName: string;
  reason: string;
  disabledAt: string;
  disabledBy: string;
}

/**
 * User event types
 */
export enum UserEventType {
  CREATED = "user.created",
  UPDATED = "user.updated",
  DELETED = "user.deleted",
  PASSWORD_CHANGED = "user.password_changed",
  ROLE_ASSIGNED = "user.role_assigned",
  MFA_ENABLED = "user.mfa_enabled",
  MFA_DISABLED = "user.mfa_disabled",
  LOGIN_SUCCEEDED = "user.login_succeeded",
  LOGIN_FAILED = "user.login_failed",
  LOCKED = "user.locked",
  UNLOCKED = "user.unlocked"
}

/**
 * User event data interfaces - examples 
 */
export interface UserCreatedEventData {
  id: string;
  tenantId: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  createdBy: string;
}

// Other user event data interfaces would follow the same pattern

/**
 * Billing event types
 */
export enum BillingEventType {
  INVOICE_CREATED = "billing.invoice_created",
  PAYMENT_SUCCEEDED = "billing.payment_succeeded",
  PAYMENT_FAILED = "billing.payment_failed",
  SUBSCRIPTION_RENEWED = "billing.subscription_renewed",
  SUBSCRIPTION_CANCELLED = "billing.subscription_cancelled"
}

/**
 * Billing event data interfaces - examples
 */
export interface PaymentSucceededEventData {
  id: string;
  tenantId: string;
  invoiceId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentId: string;
  paidAt: string;
}

// Other billing event data interfaces would follow the same pattern

/**
 * Notification event types
 */
export enum NotificationEventType {
  EMAIL_REQUESTED = "notification.email_requested",
  EMAIL_SENT = "notification.email_sent",
  EMAIL_FAILED = "notification.email_failed",
  IN_APP_NOTIFICATION_CREATED = "notification.in_app_created",
  IN_APP_NOTIFICATION_READ = "notification.in_app_read"
}

/**
 * File event types
 */
export enum FileEventType {
  UPLOADED = "file.uploaded",
  DOWNLOADED = "file.downloaded",
  DELETED = "file.deleted",
  SCANNED = "file.scanned",
  SHARED = "file.shared"
}

/**
 * Analytics event types
 */
export enum AnalyticsEventType {
  USER_ACTIVITY_RECORDED = "analytics.user_activity_recorded",
  REPORT_GENERATED = "analytics.report_generated",
  METRIC_UPDATED = "analytics.metric_updated"
}

/**
 * Complete event with data
 */
export interface Event<T> extends BaseEvent {
  data: T;
}

/**
 * Type guard to check if an event is of a specific type
 */
export function isTenantCreatedEvent(event: Event<any>): event is Event<TenantCreatedEventData> {
  return event.type === TenantEventType.CREATED;
}

// Similar type guards can be implemented for other event types
