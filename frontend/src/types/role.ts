/**
 * Role interface
 */
export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Permission interface
 */
export interface Permission {
  id: string;
  name: string;
  description: string;
  code: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Permission category types
 */
export type PermissionCategory = 
  | 'User Management'
  | 'Team Management'
  | 'Module Management'
  | 'Settings'
  | 'Billing'
  | 'CRM'
  | 'HRM'
  | 'Analytics';

/**
 * Permission codes for specific actions
 */
export const PERMISSION_CODES = {
  // User Management
  USER_VIEW: 'users.view',
  USER_CREATE: 'users.create',
  USER_EDIT: 'users.edit',
  USER_DELETE: 'users.delete',
  
  // Team Management
  TEAM_VIEW: 'teams.view',
  TEAM_CREATE: 'teams.create',
  TEAM_EDIT: 'teams.edit',
  TEAM_DELETE: 'teams.delete',
  
  // Role Management
  ROLE_VIEW: 'roles.view',
  ROLE_CREATE: 'roles.create',
  ROLE_EDIT: 'roles.edit',
  ROLE_DELETE: 'roles.delete',
  
  // Module Management
  MODULE_VIEW: 'modules.view',
  MODULE_CONFIGURE: 'modules.configure',
  MODULE_INSTALL: 'modules.install',
  
  // Settings
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_EDIT: 'settings.edit',
  
  // Billing
  BILLING_VIEW: 'billing.view',
  BILLING_MANAGE: 'billing.manage',
  
  // CRM Module
  CRM_VIEW: 'crm.view',
  CRM_CREATE: 'crm.create',
  CRM_EDIT: 'crm.edit',
  CRM_DELETE: 'crm.delete',
  
  // HRM Module
  HRM_VIEW: 'hrm.view',
  HRM_CREATE: 'hrm.create',
  HRM_EDIT: 'hrm.edit',
  HRM_DELETE: 'hrm.delete',
  
  // Analytics Module
  ANALYTICS_VIEW: 'analytics.view',
  ANALYTICS_EXPORT: 'analytics.export',
};
