import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Team Management | Tenant Admin',
  description: 'Manage teams in your organization',
};

// Define navigation items for tenant admin
const navItems = [
  { title: 'Dashboard', href: '/tenant/dashboard' },
  { title: 'Users', href: '/tenant/users' },
  { title: 'Teams', href: '/tenant/teams' },
  { title: 'Modules', href: '/tenant/modules' },
  { title: 'Settings', href: '/tenant/settings' },
  { title: 'Billing', href: '/tenant/billing' },
];

// Define Team interface
interface Team {
  id: string;
  name: string;
  description: string;
  membersCount: number;
  createdAt: string;
  updatedAt: string;
}

// Define columns for the team table
const columns: ColumnDef<Team>[] = [
  {
    accessorKey: 'name',
    header: 'Team Name',
  },
  {
    accessorKey: 'description',
    header: 'Description',
  },
  {
    accessorKey: 'membersCount',
    header: 'Members',
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => {
      return new Date(row.getValue('createdAt')).toLocaleDateString();
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const team = row.original;
      
      return (
        <div className="flex space-x-2">
          <Link href={`/tenant/teams/${team.id}`}>
            <Button variant="outline" size="sm">
              Manage
            </Button>
          </Link>
        </div>
      );
    },
  },
];

// Mock data for teams
const mockTeams: Team[] = [
  {
    id: '1',
    name: 'Sales Team',
    description: 'Sales and marketing department',
    membersCount: 12,
    createdAt: '2025-01-10',
    updatedAt: '2025-04-15',
  },
  {
    id: '2',
    name: 'Engineering',
    description: 'Software development team',
    membersCount: 8,
    createdAt: '2025-01-15',
    updatedAt: '2025-05-01',
  },
  {
    id: '3',
    name: 'Customer Support',
    description: 'Customer service representatives',
    membersCount: 5,
    createdAt: '2025-02-20',
    updatedAt: '2025-04-30',
  },
  {
    id: '4',
    name: 'HR Department',
    description: 'Human resources team',
    membersCount: 3,
    createdAt: '2025-03-05',
    updatedAt: '2025-04-22',
  },
];

export default function TeamsPage() {
  // In a real app, this would be fetched from the API
  const tenantName = "Example Company";
  
  return (
    <DashboardLayout navItems={navItems} tenantName={tenantName}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Team Management</h1>
        <Link href="/tenant/teams/create">
          <Button>Create Team</Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Teams</CardTitle>
          <CardDescription>Manage collaboration teams in your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={mockTeams} />
        </CardContent>
      </Card>
      
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Team Activity</CardTitle>
            <CardDescription>Latest activities across all teams</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-start space-x-4">
                  <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-800"></div>
                  <div className="space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">Jane Doe</span> added <span className="font-medium">John Smith</span> to <span className="font-medium">Sales Team</span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(Date.now() - i * 3600000).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Team Resource Usage</CardTitle>
            <CardDescription>Resource allocation across teams</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium">Sales Team</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">40%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                  <div className="h-2 rounded-full bg-blue-500" style={{ width: '40%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium">Engineering</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">25%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                  <div className="h-2 rounded-full bg-indigo-500" style={{ width: '25%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium">Customer Support</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">20%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                  <div className="h-2 rounded-full bg-green-500" style={{ width: '20%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium">HR Department</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">15%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                  <div className="h-2 rounded-full bg-purple-500" style={{ width: '15%' }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
