import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { Metadata } from 'next';
import { Role } from '@/types/role';

export const metadata: Metadata = {
  title: 'Role Management | Tenant Admin',
  description: 'Manage roles and permissions in your organization',
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

// Define columns for the role table
const columns: ColumnDef<Role>[] = [
  {
    accessorKey: 'name',
    header: 'Role Name',
  },
  {
    accessorKey: 'description',
    header: 'Description',
  },
  {
    accessorKey: 'permissions',
    header: 'Permissions',
    cell: ({ row }) => {
      const permissions = row.original.permissions || [];
      return (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {permissions.length} permissions
        </span>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => {
      const date = new Date(row.getValue('createdAt'));
      return <span>{date.toLocaleDateString()}</span>;
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const role = row.original;
      
      return (
        <div className="flex space-x-2">
          <Link href={`/tenant/roles/${role.id}`}>
            <Button variant="outline" size="sm">
              Edit
            </Button>
          </Link>
        </div>
      );
    },
  },
];

// Mock data for roles
const mockRoles: Role[] = [
  {
    id: '1',
    name: 'Administrator',
    description: 'Full access to all tenant resources',
    permissions: [
      { id: '1', name: 'View Users', description: 'Can view all users', code: 'users.view', category: 'User Management', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
      { id: '2', name: 'Create Users', description: 'Can create new users', code: 'users.create', category: 'User Management', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
      { id: '3', name: 'Edit Users', description: 'Can edit existing users', code: 'users.edit', category: 'User Management', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
      // more permissions would be listed here...
    ],
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },
  {
    id: '2',
    name: 'Manager',
    description: 'Can manage teams and users',
    permissions: [
      { id: '1', name: 'View Users', description: 'Can view all users', code: 'users.view', category: 'User Management', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
      { id: '5', name: 'View Teams', description: 'Can view all teams', code: 'teams.view', category: 'Team Management', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
      { id: '6', name: 'Create Teams', description: 'Can create new teams', code: 'teams.create', category: 'Team Management', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
      // more permissions would be listed here...
    ],
    createdAt: '2025-01-15',
    updatedAt: '2025-01-15',
  },
  {
    id: '3',
    name: 'User',
    description: 'Regular user with limited access',
    permissions: [
      { id: '1', name: 'View Users', description: 'Can view all users', code: 'users.view', category: 'User Management', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
      { id: '5', name: 'View Teams', description: 'Can view all teams', code: 'teams.view', category: 'Team Management', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
      // more permissions would be listed here...
    ],
    createdAt: '2025-02-01',
    updatedAt: '2025-02-01',
  },
];

export default function RolesPage() {
  // In a real app, this would be fetched from the API
  const tenantName = "Example Company";
  
  return (
    <DashboardLayout navItems={navItems} tenantName={tenantName}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Role Management</h1>
        <Link href="/tenant/roles/create">
          <Button>Add New Role</Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Roles</CardTitle>
          <CardDescription>Manage roles and permission sets in your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={mockRoles} />
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
