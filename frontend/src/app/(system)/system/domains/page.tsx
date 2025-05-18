import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Domain Management | Multi-Tenant Platform',
  description: 'Manage domains and SSL certificates for multi-tenant platform',
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

// Mock data for domains
const domains = [
  {
    id: '550e8400-e29b-41d4-a716-446655440020',
    domainName: 'tenant1.example.com',
    tenantName: 'Tenant A',
    tenantId: '550e8400-e29b-41d4-a716-446655440010',
    isDefault: true,
    status: 'active',
    sslEnabled: true,
    sslExpiresAt: '2026-05-15',
    createdAt: '2025-01-15',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440021',
    domainName: 'custom-domain-1.com',
    tenantName: 'Tenant A',
    tenantId: '550e8400-e29b-41d4-a716-446655440010',
    isDefault: false,
    status: 'active',
    sslEnabled: true,
    sslExpiresAt: '2026-05-15',
    createdAt: '2025-02-10',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440022',
    domainName: 'tenant2.example.com',
    tenantName: 'Tenant B',
    tenantId: '550e8400-e29b-41d4-a716-446655440011',
    isDefault: true,
    status: 'active',
    sslEnabled: true,
    sslExpiresAt: '2026-05-15',
    createdAt: '2025-02-15',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440023',
    domainName: 'custom-domain-2.com',
    tenantName: 'Tenant B',
    tenantId: '550e8400-e29b-41d4-a716-446655440011',
    isDefault: false,
    status: 'pending',
    sslEnabled: false,
    sslExpiresAt: null,
    createdAt: '2025-05-10',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440024',
    domainName: 'tenant3.example.com',
    tenantName: 'Tenant C',
    tenantId: '550e8400-e29b-41d4-a716-446655440012',
    isDefault: true,
    status: 'active',
    sslEnabled: true,
    sslExpiresAt: '2026-05-15',
    createdAt: '2025-03-05',
  },
];

interface Domain {
  id: string;
  domainName: string;
  tenantName: string;
  tenantId: string;
  isDefault: boolean;
  status: string;
  sslEnabled: boolean;
  sslExpiresAt: string | null;
  createdAt: string;
}

export default function DomainsPage() {
  // Column definitions for domains table
  const columns: ColumnDef<Domain>[] = [
    {
      accessorKey: 'domainName',
      header: 'Domain',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue('domainName')}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {row.original.isDefault ? 'Default' : 'Custom'}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'tenantName',
      header: 'Tenant',
      cell: ({ row }) => (
        <Link href={`/system/tenants/${row.original.tenantId}`} className="text-blue-600 hover:underline dark:text-blue-400">
          {row.getValue('tenantName')}
        </Link>
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
              : status === 'pending'
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
          }`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </div>
        );
      },
    },
    {
      accessorKey: 'sslEnabled',
      header: 'SSL',
      cell: ({ row }) => (
        <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          row.original.sslEnabled
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
        }`}>
          {row.original.sslEnabled ? 'Enabled' : 'Disabled'}
        </div>
      ),
    },
    {
      accessorKey: 'sslExpiresAt',
      header: 'SSL Expires',
      cell: ({ row }) => (
        <div>{row.getValue('sslExpiresAt') || 'N/A'}</div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const domain = row.original;
        return (
          <div className="flex items-center justify-end space-x-2">
            {domain.status === 'pending' && (
              <Button variant="outline" size="sm">
                Verify
              </Button>
            )}
            {domain.status === 'active' && !domain.isDefault && (
              <Button variant="outline" size="sm">
                Make Default
              </Button>
            )}
            {!domain.isDefault && (
              <Button variant="destructive" size="sm">
                Remove
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <DashboardLayout navItems={navItems}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Domain Management</h1>
        <Button variant="outline" size="sm">
          Refresh SSL Status
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Domains</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">5</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Active Domains</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">4</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Pending Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">1</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>SSL Secured</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">4</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">80% of domains</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>All Domains</CardTitle>
            <CardDescription>Manage domains and SSL certificates</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={domains} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Domain Verification Guide</CardTitle>
            <CardDescription>How to verify ownership of a custom domain</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Verification Methods</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  To verify domain ownership, tenants can use one of the following methods:
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                  <h4 className="font-medium">TXT Record Verification</h4>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    Add a TXT record to your domain's DNS settings with the following values:
                  </p>
                  <div className="mt-2 overflow-x-auto rounded-lg bg-gray-100 p-3 dark:bg-gray-800">
                    <pre className="text-sm">
                      <code>Name: @</code><br />
                      <code>Value: multi-tenant-verify=abc123xyz</code>
                    </pre>
                  </div>
                </div>
                
                <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                  <h4 className="font-medium">CNAME Record Verification</h4>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    Add a CNAME record to your domain's DNS settings with the following values:
                  </p>
                  <div className="mt-2 overflow-x-auto rounded-lg bg-gray-100 p-3 dark:bg-gray-800">
                    <pre className="text-sm">
                      <code>Name: verify</code><br />
                      <code>Value: verify.example.com</code>
                    </pre>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium">Automatic SSL Certificates</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  Once domain ownership is verified, an SSL certificate will be automatically provisioned 
                  through Let's Encrypt. This process typically takes 5-10 minutes to complete.
                </p>
              </div>
              
              <div className="flex justify-end">
                <Button variant="link">View Full Documentation</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
