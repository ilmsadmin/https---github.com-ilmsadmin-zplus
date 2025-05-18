import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { TenantPackage } from '@/types/tenant';

export const metadata: Metadata = {
  title: 'Tenant Dashboard | Multi-Tenant Platform',
  description: 'Tenant dashboard for multi-tenant platform',
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

export default function TenantDashboardPage() {
  // In a real app, this would be fetched from the API
  const tenantName = "Example Company";
  
  // Mock data for dashboard
  const organization = {
    name: "Example Company",
    package: TenantPackage.PROFESSIONAL,
    domain: "example-company.example.com",
    activeSince: "2025-01-01",
    status: "ACTIVE",
  };
  
  // Mock stats
  const stats = {
    users: {
      total: 45,
      active: 38,
      pending: 7,
      admin: 3,
      growth: 12,
    },
    teams: {
      total: 12,
      members: {
        sales: 15,
        engineering: 12,
        support: 8,
        hr: 5,
        other: 5,
      }
    },
    storage: {
      used: 3.2, // GB
      total: 5, // GB
      percentage: (3.2 / 5) * 100,
    },
    modules: {
      active: 3,
      available: 1,
      recentlyUsed: ['CRM', 'HRM', 'Analytics']
    },
    activity: {
      today: 128,
      week: 856,
      month: 3245,
    }
  };
  
  // Mock recent activity data
  const recentActivity = [
    {
      id: '1',
      user: {
        name: 'Jane Doe',
        avatar: '/avatars/jane-doe.png'
      },
      action: 'created a new team',
      target: 'Marketing',
      timestamp: '2025-05-18T09:45:00Z',
    },
    {
      id: '2',
      user: {
        name: 'John Smith',
        avatar: '/avatars/john-smith.png'
      },
      action: 'added a new user',
      target: 'Emily Brown',
      timestamp: '2025-05-17T16:30:00Z',
    },
    {
      id: '3',
      user: {
        name: 'Robert Johnson',
        avatar: '/avatars/robert-johnson.png'
      },
      action: 'updated module settings',
      target: 'CRM',
      timestamp: '2025-05-17T14:15:00Z',
    },
    {
      id: '4',
      user: {
        name: 'Emily Brown',
        avatar: '/avatars/emily-brown.png'
      },
      action: 'joined team',
      target: 'Sales',
      timestamp: '2025-05-16T11:20:00Z',
    },
  ];
  
  return (
    <DashboardLayout navItems={navItems} tenantName={tenantName}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>
      
      {/* Welcome Card */}
      <Card className="mt-6">
        <CardContent className="p-6">
          <div className="flex flex-col items-start justify-between space-y-4 md:flex-row md:items-center md:space-y-0">
            <div>
              <h2 className="text-2xl font-bold">Welcome to {organization.name}</h2>
              <p className="mt-1 text-gray-500 dark:text-gray-400">
                {organization.package.replace('_', ' ')} Plan | Active since {new Date(organization.activeSince).toLocaleDateString()}
              </p>
            </div>
            <div className="flex space-x-2">
              <Link href="/tenant/settings">
                <Button variant="outline">Customize Tenant</Button>
              </Link>
              <Link href="/tenant/users/create">
                <Button>Add New User</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Stats Cards */}
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Users</CardTitle>
            <CardDescription>Active users in your organization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-bold">{stats.users.total}</p>
              <span className="text-xs text-green-500">
                +{stats.users.growth}% from last month
              </span>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs">
                <span>Active: {stats.users.active}</span>
                <span>Pending: {stats.users.pending}</span>
                <span>Admins: {stats.users.admin}</span>
              </div>
              <div className="mt-1 flex h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div className="h-full bg-green-500" style={{ width: `${(stats.users.active / stats.users.total) * 100}%` }}></div>
                <div className="h-full bg-yellow-500" style={{ width: `${(stats.users.pending / stats.users.total) * 100}%` }}></div>
                <div className="h-full bg-blue-500" style={{ width: `${(stats.users.admin / stats.users.total) * 100}%` }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Teams</CardTitle>
            <CardDescription>Collaboration groups</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.teams.total}</p>
            <div className="mt-4">
              <div className="space-y-2">
                {Object.entries(stats.teams.members).map(([team, count]) => (
                  <div key={team} className="flex items-center text-xs">
                    <span className="w-20 capitalize">{team}:</span>
                    <div className="flex-1">
                      <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                        <div 
                          className={`h-1.5 rounded-full ${
                            team === 'sales' ? 'bg-blue-500' :
                            team === 'engineering' ? 'bg-purple-500' :
                            team === 'support' ? 'bg-green-500' :
                            team === 'hr' ? 'bg-yellow-500' : 'bg-gray-500'
                          }`} 
                          style={{ width: `${Math.min(100, (count / 20) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className="ml-2">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Active Modules</CardTitle>
            <CardDescription>Modules in use</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">4</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest activities in your organization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-gray-800">
                <div>
                  <p className="font-medium">New user added</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">John Doe was added to the Sales team</p>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">1 hour ago</p>
              </div>
              
              <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-gray-800">
                <div>
                  <p className="font-medium">Module activated</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">CRM module was activated</p>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">3 hours ago</p>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Settings updated</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Organization settings were updated</p>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">1 day ago</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Subscription Status</CardTitle>
            <CardDescription>Your current subscription</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-medium">Plan</p>
                <p className="font-bold">Enterprise</p>
              </div>
              
              <div className="flex items-center justify-between">
                <p className="font-medium">Status</p>
                <p className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  Active
                </p>
              </div>
              
              <div className="flex items-center justify-between">
                <p className="font-medium">Next Billing</p>
                <p>June 15, 2025</p>
              </div>
              
              <div className="flex items-center justify-between">
                <p className="font-medium">Amount</p>
                <p>$199.00 / month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
