export interface ITenantContext {
  tenantId: string;
  schemaName: string;
  packageId?: string;
  userId?: string;
  permissions?: any;
}
