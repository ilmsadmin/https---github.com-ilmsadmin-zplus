export interface NavItem {
  title: string;
  href: string;
  icon?: React.ReactNode;
}

export const systemNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/system/dashboard' },
  { title: 'Tenants', href: '/system/tenants' },
  { title: 'Packages', href: '/system/packages' },
  { title: 'Modules', href: '/system/modules' },
  { title: 'Domains', href: '/system/domains' },
  { title: 'Users', href: '/system/users' },
  { title: 'Billing', href: '/system/billing' },
  { title: 'Settings', href: '/system/settings' },
];

export const getTenantNavItems = (tenantId: string): NavItem[] => {
  return [
    { title: 'Dashboard', href: `/tenant/${tenantId}/dashboard` },
    { title: 'Users', href: `/tenant/${tenantId}/users` },
    { title: 'Teams', href: `/tenant/${tenantId}/teams` },
    { title: 'Roles', href: `/tenant/${tenantId}/roles` },
    { title: 'Domains', href: `/tenant/${tenantId}/domains` },
    { title: 'Modules', href: `/tenant/${tenantId}/modules` },
    { title: 'Settings', href: `/tenant/${tenantId}/settings` },
  ];
};
