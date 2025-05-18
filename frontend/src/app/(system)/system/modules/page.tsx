import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Module Marketplace | Multi-Tenant Platform',
  description: 'Browse and manage modules for multi-tenant platform',
};

// Define navigation items for system admin
const navItems = [
  { title: 'Dashboard', href: '/system/dashboard' },
  { title: 'Tenants', href: '/system/tenants' },
  { title: 'Packages', href: '/system/packages' },
  { title: 'Modules', href: '/system/modules' },
  { title: 'Domains', href: '/system/domains' },
  { title: 'Users', href: '/system/users' },
  { title: 'Billing', href: '/system/billing' },
  { title: 'Settings', href: '/system/settings' },
];

// Mock data for modules
const modules = [
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'CRM',
    description: 'Customer Relationship Management for managing leads, contacts, and opportunities.',
    version: '1.0.0',
    isActive: true,
    usageTenants: 24,
    category: 'Core',
    lastUpdated: '2025-03-15',
    icon: '📊',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: 'HRM',
    description: 'Human Resource Management for employee data, payroll, and performance tracking.',
    version: '1.0.0',
    isActive: true,
    usageTenants: 12,
    category: 'Core',
    lastUpdated: '2025-03-10',
    icon: '👥',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    name: 'Analytics',
    description: 'Advanced analytics and reporting with interactive dashboards and insights.',
    version: '1.0.0',
    isActive: true,
    usageTenants: 8,
    category: 'Core',
    lastUpdated: '2025-02-28',
    icon: '📈',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    name: 'Project Management',
    description: 'Project planning, task tracking, milestones, and team collaboration.',
    version: '0.9.2',
    isActive: false,
    usageTenants: 0,
    category: 'Productivity',
    lastUpdated: '2025-04-10',
    icon: '📋',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440006',
    name: 'E-commerce',
    description: 'Online store management with product catalogs, orders, and inventory.',
    version: '0.8.5',
    isActive: false,
    usageTenants: 0,
    category: 'Sales',
    lastUpdated: '2025-04-05',
    icon: '🛒',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440007',
    name: 'Knowledge Base',
    description: 'Documentation system for internal and customer-facing content.',
    version: '1.1.0',
    isActive: true,
    usageTenants: 5,
    category: 'Support',
    lastUpdated: '2025-02-15',
    icon: '📚',
  },
];

export default function ModulesPage() {
  return (
    <DashboardLayout navItems={navItems}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Module Marketplace</h1>
        <Link href="/system/modules/create">
          <Button variant="primary">Create Module</Button>
        </Link>
      </div>

      <div className="mt-6 space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="outline" size="sm" className="rounded-full">
            All Modules
          </Button>
          <Button variant="ghost" size="sm" className="rounded-full">
            Core
          </Button>
          <Button variant="ghost" size="sm" className="rounded-full">
            Productivity
          </Button>
          <Button variant="ghost" size="sm" className="rounded-full">
            Sales
          </Button>
          <Button variant="ghost" size="sm" className="rounded-full">
            Support
          </Button>
          <Button variant="ghost" size="sm" className="rounded-full">
            Finance
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <Card key={module.id} className="overflow-hidden">
              <div className="flex h-20 items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 text-4xl text-white">
                {module.icon}
              </div>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{module.name}</CardTitle>
                  <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    module.isActive
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                  }`}>
                    {module.isActive ? 'Active' : 'In Development'}
                  </div>
                </div>
                <CardDescription className="flex items-center justify-between">
                  <span>Version {module.version}</span>
                  <span>{module.category}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
                  {module.description}
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <div>
                    {module.usageTenants} {module.usageTenants === 1 ? 'tenant' : 'tenants'} using
                  </div>
                  <div>Updated: {module.lastUpdated}</div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <Link href={`/system/modules/${module.id}`}>
                    <Button variant="outline" size="sm">
                      Configuration
                    </Button>
                  </Link>
                  <Button
                    variant={module.isActive ? 'destructive' : 'primary'}
                    size="sm"
                  >
                    {module.isActive ? 'Disable' : 'Enable'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Module Development</CardTitle>
            <CardDescription>Guidelines for creating new modules</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Module Development Process</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  Modules are developed using a standardized framework to ensure consistency and 
                  compatibility across the platform. Follow our guidelines to build reliable modules.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                  <h4 className="font-medium">1. Plan & Design</h4>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    Define module requirements, data models, and integration points
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                  <h4 className="font-medium">2. Develop & Test</h4>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    Implement features using our SDK and run comprehensive tests
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                  <h4 className="font-medium">3. Submit & Release</h4>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    Submit for review and prepare documentation for release
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="link">View Developer Documentation</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
