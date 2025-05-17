export interface ITenantContext {
  tenantId: string;
  schemaName: string;
  userId?: string; // Optional userId for tracking who performed actions
}
