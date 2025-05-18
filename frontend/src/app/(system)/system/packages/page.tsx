import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Packages Management | Multi-Tenant Platform',
  description: 'Manage subscription packages for multi-tenant platform',
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

// Mock data for packages
const packages = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Basic',
    description: 'Essential features for small businesses',
    price: 99.99,
    billingCycle: 'monthly',
    maxUsers: 10,
    maxStorage: '1 GB',
    tenantCount: 12,
    features: {
      modules: ['crm'],
      whiteLabeling: false,
    },
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Pro',
    description: 'Advanced features for growing businesses',
    price: 199.99,
    billingCycle: 'monthly',
    maxUsers: 50,
    maxStorage: '5 GB',
    tenantCount: 8,
    features: {
      modules: ['crm', 'hrm'],
      whiteLabeling: true,
    },
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440123',
    name: 'Enterprise',
    description: 'Complete solution for large organizations',
    price: 499.99,
    billingCycle: 'monthly',
    maxUsers: 200,
    maxStorage: '20 GB',
    tenantCount: 4,
    features: {
      modules: ['crm', 'hrm', 'analytics'],
      whiteLabeling: true,
      customDomain: true,
      prioritySupport: true,
    },
  },
];

interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  billingCycle: string;
  maxUsers: number;
  maxStorage: string;
  tenantCount: number;
  features: {
    modules: string[];
    whiteLabeling: boolean;
    customDomain?: boolean;
    prioritySupport?: boolean;
  };
}

export default function PackagesPage() {
  // Column definitions for packages table
  const columns: ColumnDef<Package>[] = [
    {
      accessorKey: 'name',
      header: 'Package Name',
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: ({ row }) => (
        <div>${row.getValue('price')}/{row.original.billingCycle}</div>
      ),
    },
    {
      accessorKey: 'maxUsers',
      header: 'Max Users',
    },
    {
      accessorKey: 'maxStorage',
      header: 'Storage',
    },
    {
      accessorKey: 'tenantCount',
      header: 'Tenants',
    },
    {
      id: 'modules',
      header: 'Modules',
      cell: ({ row }) => (
        <div>
          {row.original.features.modules.map((module, index) => (
            <span key={module} className="mr-1 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-100">
              {module.toUpperCase()}
            </span>
          ))}
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center justify-end space-x-2">
          <Link href={`/system/packages/${row.original.id}`}>
            <Button variant="outline" size="sm">Edit</Button>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout navItems={navItems}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Packages</h1>
        <Link href="/system/packages/create">
          <Button variant="primary">Create Package</Button>
        </Link>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Subscription Packages</CardTitle>
            <CardDescription>Manage subscription packages for your tenants</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={packages}
              onRowClick={(pkg) => {
                window.location.href = `/system/packages/${pkg.id}`;
              }}
            />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Package Comparison</CardTitle>
            <CardDescription>Feature comparison between packages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="py-4 text-left font-medium text-gray-500 dark:text-gray-400">Features</th>
                    {packages.map((pkg) => (
                      <th key={pkg.id} className="py-4 text-center font-medium text-gray-500 dark:text-gray-400">
                        {pkg.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <td className="py-4 font-medium">Max Users</td>
                    {packages.map((pkg) => (
                      <td key={pkg.id} className="py-4 text-center">
                        {pkg.maxUsers}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <td className="py-4 font-medium">Storage</td>
                    {packages.map((pkg) => (
                      <td key={pkg.id} className="py-4 text-center">
                        {pkg.maxStorage}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <td className="py-4 font-medium">CRM Module</td>
                    {packages.map((pkg) => (
                      <td key={pkg.id} className="py-4 text-center">
                        {pkg.features.modules.includes('crm') ? '✓' : '✗'}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <td className="py-4 font-medium">HRM Module</td>
                    {packages.map((pkg) => (
                      <td key={pkg.id} className="py-4 text-center">
                        {pkg.features.modules.includes('hrm') ? '✓' : '✗'}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <td className="py-4 font-medium">Analytics Module</td>
                    {packages.map((pkg) => (
                      <td key={pkg.id} className="py-4 text-center">
                        {pkg.features.modules.includes('analytics') ? '✓' : '✗'}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <td className="py-4 font-medium">White Labeling</td>
                    {packages.map((pkg) => (
                      <td key={pkg.id} className="py-4 text-center">
                        {pkg.features.whiteLabeling ? '✓' : '✗'}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <td className="py-4 font-medium">Custom Domain</td>
                    {packages.map((pkg) => (
                      <td key={pkg.id} className="py-4 text-center">
                        {pkg.features.customDomain ? '✓' : '✗'}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <td className="py-4 font-medium">Priority Support</td>
                    {packages.map((pkg) => (
                      <td key={pkg.id} className="py-4 text-center">
                        {pkg.features.prioritySupport ? '✓' : '✗'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-4 font-medium">Price</td>
                    {packages.map((pkg) => (
                      <td key={pkg.id} className="py-4 text-center font-bold">
                        ${pkg.price}/{pkg.billingCycle}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
