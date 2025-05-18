import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { Metadata } from 'next';
import { User, UserRole } from '@/types/tenant';

export const metadata: Metadata = {
  title: 'Team Details | Tenant Admin',
  description: 'Manage team members and permissions',
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

// Define TeamMember interface
interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  role: 'owner' | 'admin' | 'member';
  user: User;
  joinedAt: string;
}

// Define columns for the team member table
const columns: ColumnDef<TeamMember>[] = [
  {
    accessorKey: 'user',
    header: 'User',
    cell: ({ row }) => {
      const user = row.getValue('user') as User;
      return (
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
          <div>
            <p className="text-sm font-medium">{`${user.firstName} ${user.lastName}`}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => {
      const role = row.getValue('role') as string;
      return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          role === 'owner' 
            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' 
            : role === 'admin'
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
        }`}>
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </span>
      );
    },
  },
  {
    accessorKey: 'joinedAt',
    header: 'Joined',
    cell: ({ row }) => {
      return new Date(row.getValue('joinedAt')).toLocaleDateString();
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const member = row.original;
      
      return (
        <div className="flex space-x-2">
          <select 
            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
            defaultValue={member.role}
          >
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
            <option value="member">Member</option>
          </select>
          
          <Button variant="outline" size="sm">
            Remove
          </Button>
        </div>
      );
    },
  },
];

// Mock data for team
const mockTeam = {
  id: '1',
  name: 'Sales Team',
  description: 'Sales and marketing department',
  createdAt: '2025-01-10',
  updatedAt: '2025-04-15',
};

// Mock data for team members
const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    userId: '1',
    teamId: '1',
    role: 'owner',
    user: {
      id: '1',
      email: 'jane.doe@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
      role: UserRole.TENANT_ADMIN,
      status: 'ACTIVE',
      mfaEnabled: true,
      permissions: ['users.manage', 'teams.manage'],
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    },
    joinedAt: '2025-01-10',
  },
  {
    id: '2',
    userId: '2',
    teamId: '1',
    role: 'admin',
    user: {
      id: '2',
      email: 'john.smith@example.com',
      firstName: 'John',
      lastName: 'Smith',
      role: UserRole.TENANT_USER,
      status: 'ACTIVE',
      mfaEnabled: false,
      permissions: ['crm.view', 'crm.edit'],
      createdAt: '2025-01-15',
      updatedAt: '2025-01-15',
    },
    joinedAt: '2025-01-15',
  },
  {
    id: '3',
    userId: '3',
    teamId: '1',
    role: 'member',
    user: {
      id: '3',
      email: 'robert.johnson@example.com',
      firstName: 'Robert',
      lastName: 'Johnson',
      role: UserRole.TENANT_USER,
      status: 'ACTIVE',
      mfaEnabled: false,
      permissions: ['crm.view'],
      createdAt: '2025-02-01',
      updatedAt: '2025-02-01',
    },
    joinedAt: '2025-02-05',
  },
];

// Mock data for team activity
const mockTeamActivity = [
  {
    id: '1',
    user: {
      id: '1',
      firstName: 'Jane',
      lastName: 'Doe',
    },
    action: 'added',
    target: {
      id: '3',
      firstName: 'Robert',
      lastName: 'Johnson',
    },
    timestamp: '2025-02-05T10:30:00Z',
  },
  {
    id: '2',
    user: {
      id: '1',
      firstName: 'Jane',
      lastName: 'Doe',
    },
    action: 'updated team description',
    timestamp: '2025-03-15T14:45:00Z',
  },
  {
    id: '3',
    user: {
      id: '2',
      firstName: 'John',
      lastName: 'Smith',
    },
    action: 'changed role of',
    target: {
      id: '3',
      firstName: 'Robert',
      lastName: 'Johnson',
    },
    newRole: 'member',
    timestamp: '2025-04-10T09:15:00Z',
  },
];

export default function TeamDetailPage({ params }: { params: { id: string } }) {
  // In a real app, this would be fetched from the API using params.id
  const tenantName = "Example Company";
  const team = mockTeam;
  const members = mockTeamMembers;
  
  return (
    <DashboardLayout navItems={navItems} tenantName={tenantName}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{team.name}</h1>
          <p className="text-gray-500 dark:text-gray-400">{team.description}</p>
        </div>
        <div className="flex space-x-2">
          <Link href="/tenant/teams">
            <Button variant="outline">Back to Teams</Button>
          </Link>
          <Button>Edit Team</Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>Manage members and their roles</CardDescription>
                </div>
                <Button>Add Member</Button>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable columns={columns} data={members} />
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Team Activity</CardTitle>
              <CardDescription>Recent actions in this team</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockTeamActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-4">
                    <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-800"></div>
                    <div className="space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">{`${activity.user.firstName} ${activity.user.lastName}`}</span>
                        {' '}{activity.action}{' '}
                        {activity.target && (
                          <span className="font-medium">{`${activity.target.firstName} ${activity.target.lastName}`}</span>
                        )}
                        {activity.newRole && (
                          <span> to <span className="font-medium">{activity.newRole}</span></span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Team Permissions</CardTitle>
              <CardDescription>Resource access for this team</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">CRM Module</h3>
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <input type="checkbox" id="team-crm-view" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                      <label htmlFor="team-crm-view" className="ml-2 text-sm">
                        View CRM Data
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" id="team-crm-edit" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                      <label htmlFor="team-crm-edit" className="ml-2 text-sm">
                        Edit CRM Data
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" id="team-crm-delete" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <label htmlFor="team-crm-delete" className="ml-2 text-sm">
                        Delete CRM Data
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">HRM Module</h3>
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <input type="checkbox" id="team-hrm-view" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <label htmlFor="team-hrm-view" className="ml-2 text-sm">
                        View HRM Data
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" id="team-hrm-edit" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <label htmlFor="team-hrm-edit" className="ml-2 text-sm">
                        Edit HRM Data
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="pt-2">
                  <Button variant="outline" size="sm" className="w-full">
                    Save Permissions
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
