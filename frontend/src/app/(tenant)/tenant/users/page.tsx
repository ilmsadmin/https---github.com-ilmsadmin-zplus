import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { Metadata } from 'next';
import { User, UserRole } from '@/types/tenant';

export const metadata: Metadata = {
  title: 'User Management | Tenant Admin',
  description: 'Manage users in your organization',
};

// Define navigation items for tenant admin
const navItems = [
  { title: 'Dashboard', href: '/tenant/dashboard' },
  { title: 'Users', href: '/tenant/users' },
  { title: 'Teams', href: '/tenant/teams' },
  { title: 'Roles', href: '/tenant/roles' },
  { title: 'Modules', href: '/tenant/modules' },
  { title: 'Settings', href: '/tenant/settings' },
  { title: 'Billing', href: '/tenant/billing' },
];

// Define columns for the user table
const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'firstName',
    header: 'First Name',
  },
  {
    accessorKey: 'lastName',
    header: 'Last Name',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => {
      const role = row.getValue('role') as UserRole;
      return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          role === UserRole.TENANT_ADMIN 
            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' 
            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
        }`}>
          {role === UserRole.TENANT_ADMIN ? 'Admin' : 'User'}
        </span>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          status === 'ACTIVE' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
            : status === 'PENDING' 
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
        }`}>
          {status}
        </span>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const user = row.original;
      
      return (
        <div className="flex space-x-2">
          <Link href={`/tenant/users/${user.id}`}>
            <Button variant="outline" size="sm">
              Edit
            </Button>
          </Link>
        </div>
      );
    },
  },
];

// Mock data for users
const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@example.com',
    firstName: 'Jane',
    lastName: 'Doe',
    role: UserRole.TENANT_ADMIN,
    status: 'ACTIVE',
    mfaEnabled: true,
    permissions: ['users.manage', 'teams.manage', 'modules.manage'],
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
    lastLoginAt: '2025-05-17T10:30:00Z',
  },
  {
    id: '2',
    email: 'user1@example.com',
    firstName: 'John',
    lastName: 'Smith',
    role: UserRole.TENANT_USER,
    status: 'ACTIVE',
    mfaEnabled: false,
    permissions: ['crm.view', 'crm.edit'],
    createdAt: '2025-01-15',
    updatedAt: '2025-01-15',
    lastLoginAt: '2025-05-16T14:45:00Z',
  },
  {
    id: '3',
    email: 'user2@example.com',
    firstName: 'Robert',
    lastName: 'Johnson',
    role: UserRole.TENANT_USER,
    status: 'PENDING',
    mfaEnabled: false,
    permissions: ['crm.view'],
    createdAt: '2025-05-10',
    updatedAt: '2025-05-10',
    lastLoginAt: null,
  },
  {
    id: '4',
    email: 'user3@example.com',
    firstName: 'Emily',
    lastName: 'Brown',
    role: UserRole.TENANT_USER,
    status: 'INACTIVE',
    mfaEnabled: true,
    permissions: ['hrm.view', 'hrm.edit'],
    createdAt: '2025-02-20',
    updatedAt: '2025-05-05',
    lastLoginAt: '2025-04-25T09:15:00Z',
  },
];

export default function UsersPage() {
  // In a real app, this would be fetched from the API
  const tenantName = "Example Company";
  
  return (    <DashboardLayout navItems={navItems} tenantName={tenantName}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <div className="flex space-x-4">
          <Link href="/tenant/users/import">
            <Button variant="outline">Bulk Import</Button>
          </Link>
          <Link href="/tenant/users/create">
            <Button>Add New User</Button>
          </Link>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Manage users and their permissions in your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={mockUsers} />
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
