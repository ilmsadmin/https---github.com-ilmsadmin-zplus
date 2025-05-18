export interface ITenantContext {
  tenantId: string;
  userId?: string;
  roles?: string[];
  permissions?: string[];
}
