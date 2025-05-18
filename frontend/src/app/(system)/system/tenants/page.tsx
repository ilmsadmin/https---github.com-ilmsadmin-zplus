import { DataTable } from '@/components/ui/data-table';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tenants Management | Multi-Tenant Platform',
  description: 'Manage all tenants in the multi-tenant platform',
};

// Mock data for tenants
const mockTenants = [
  {
    id: '550e8400-e29b-41d4-a716-446655440010',
    name: 'Tenant A',
    schemaName: 'tenant1',
    packageName: 'Basic',
    status: 'active',
    usersCount: 8,
    domainsCount: 1,
    createdAt: '2025-01-15',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440011',
    name: 'Tenant B',
    schemaName: 'tenant2',
    packageName: 'Pro',
    status: 'active',
    usersCount: 25,
    domainsCount: 2,
    createdAt: '2025-02-10',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440012',
    name: 'Tenant C',
    schemaName: 'tenant3',
    packageName: 'Enterprise',
    status: 'active',
    usersCount: 120,
    domainsCount: 3,
    createdAt: '2025-03-05',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440013',
    name: 'Tenant D',
    schemaName: 'tenant4',
    packageName: 'Pro',
    status: 'suspended',
    usersCount: 18,
    domainsCount: 1,
    createdAt: '2025-03-20',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440014',
    name: 'Tenant E',
    schemaName: 'tenant5',
    packageName: 'Basic',
    status: 'active',
    usersCount: 5,
    domainsCount: 1,
    createdAt: '2025-04-10',
  },
];

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

interface Tenant {
  id: string;
  name: string;
  schemaName: string;
  packageName: string;
  status: string;
  usersCount: number;
  domainsCount: number;
  createdAt: string;
}

export default function TenantsPage() {
  // Column definitions for the tenants table
  const columns: ColumnDef<Tenant>[] = [
    {
      accessorKey: 'name',
      header: 'Tenant Name',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue('name')}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{row.original.schemaName}.example.com</div>
        </div>
      ),
    },
    {
      accessorKey: 'packageName',
      header: 'Package',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('packageName')}</div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return (
          <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            status === 'active'
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
              : status === 'suspended'
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
          }`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </div>
        );
      },
    },
    {
      accessorKey: 'usersCount',
      header: 'Users',
      cell: ({ row }) => (
        <div className="text-center">{row.getValue('usersCount')}</div>
      ),
    },
    {
      accessorKey: 'domainsCount',
      header: 'Domains',
      cell: ({ row }) => (
        <div className="text-center">{row.getValue('domainsCount')}</div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => (
        <div>{row.getValue('createdAt')}</div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center justify-end space-x-2">
          <Button 
            variant={row.original.status === 'active' ? 'outline' : 'primary'} 
            size="sm"
          >
            {row.original.status === 'active' ? 'Suspend' : 'Activate'}
          </Button>
          <Link href={`/system/tenants/${row.original.id}`}>
            <Button variant="outline" size="sm">View</Button>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout navItems={navItems}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tenants</h1>
        <Link href="/system/tenants/create">
          <Button variant="primary">Create Tenant</Button>
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Tenants</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">24</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Active Tenants</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">22</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Suspended</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">2</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>New This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">5</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>All Tenants</CardTitle>
            <CardDescription>Manage your tenants and their settings</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={mockTenants}
              onRowClick={(tenant) => {
                window.location.href = `/system/tenants/${tenant.id}`;
              }}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
