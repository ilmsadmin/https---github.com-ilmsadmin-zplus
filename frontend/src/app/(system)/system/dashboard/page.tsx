import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChartComponent, BarChartComponent, ChartCard, LineChartComponent, PieChartComponent } from '@/components/ui/chart';
import { Button } from '@/components/ui/button';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'System Admin Dashboard | Multi-Tenant Platform',
  description: 'System admin dashboard for multi-tenant platform',
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

// Mock data for charts
const tenantGrowthData = [
  { month: 'Jan', count: 4 },
  { month: 'Feb', count: 6 },
  { month: 'Mar', count: 8 },
  { month: 'Apr', count: 10 },
  { month: 'May', count: 15 },
  { month: 'Jun', count: 18 },
  { month: 'Jul', count: 20 },
  { month: 'Aug', count: 24 },
];

const revenueData = [
  { month: 'Jan', revenue: 5200 },
  { month: 'Feb', revenue: 7800 },
  { month: 'Mar', revenue: 9100 },
  { month: 'Apr', revenue: 10400 },
  { month: 'May', revenue: 12500 },
  { month: 'Jun', revenue: 15000 },
  { month: 'Jul', revenue: 16800 },
  { month: 'Aug', revenue: 19200 },
];

const packageDistribution = [
  { name: 'Basic', value: 12 },
  { name: 'Pro', value: 8 },
  { name: 'Enterprise', value: 4 },
];

const moduleUsageData = [
  { module: 'CRM', usage: 20 },
  { module: 'HRM', usage: 14 },
  { module: 'Analytics', usage: 8 },
  { module: 'File Storage', usage: 10 },
  { module: 'Billing', usage: 24 },
];

export default function SystemDashboardPage() {
  return (
    <DashboardLayout navItems={navItems}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">System Dashboard</h1>
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm">
            Last 30 Days
          </Button>
          <Button variant="primary" size="sm">
            Export Report
          </Button>
        </div>
      </div>
      
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Tenants</CardTitle>
            <CardDescription>Active tenants on the platform</CardDescription>          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <p className="text-3xl font-bold">24</p>
              <span className="ml-2 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-100">
                +16.7%
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Active Users</CardTitle>
            <CardDescription>Total users across all tenants</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <p className="text-3xl font-bold">1,254</p>
              <span className="ml-2 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-100">
                +12.3%
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
            <CardDescription>Total revenue this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <p className="text-3xl font-bold">$19,200</p>
              <span className="ml-2 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-100">
                +14.2%
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>API Requests</CardTitle>
            <CardDescription>Avg requests per day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <p className="text-3xl font-bold">287.5K</p>
              <span className="ml-2 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-100">
                +18.9%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Tenant Growth" description="Cumulative tenant count by month">
          <LineChartComponent
            data={tenantGrowthData}
            xKey="month"
            yKeys={[{ key: 'count', name: 'Tenants', color: '#4f46e5' }]}
          />
        </ChartCard>
        
        <ChartCard title="Monthly Revenue" description="Total revenue by month">
          <AreaChartComponent
            data={revenueData}
            xKey="month"
            yKeys={[{ key: 'revenue', name: 'Revenue ($)', color: '#10b981' }]}
          />
        </ChartCard>
      </div>
      
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Package Distribution" description="Tenants by package type">
          <PieChartComponent data={packageDistribution} nameKey="name" valueKey="value" />
        </ChartCard>
        
        <ChartCard title="Module Usage" description="Number of tenants using each module">
          <BarChartComponent
            data={moduleUsageData}
            xKey="module"
            yKeys={[{ key: 'usage', name: 'Tenants', color: '#8b5cf6' }]}
          />
        </ChartCard>
      </div>
      
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest tenant activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-gray-800">
                <div>
                  <p className="font-medium">Tenant1 created</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">New tenant registered with Enterprise package</p>
                </div>
                <div className="flex items-center">
                  <span className="mr-2 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                    New
                  </span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">2 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-gray-800">
                <div>
                  <p className="font-medium">Tenant5 upgraded package</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Upgraded from Basic to Professional package</p>
                </div>
                <div className="flex items-center">
                  <span className="mr-2 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-100">
                    Upgrade
                  </span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">5 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-gray-800">
                <div>
                  <p className="font-medium">Tenant3 payment failed</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Monthly subscription payment failed</p>
                </div>
                <div className="flex items-center">
                  <span className="mr-2 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-100">
                    Failed
                  </span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">1 day ago</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Tenant8 added new domain</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Added and verified customerdomain.com</p>
                </div>
                <div className="flex items-center">
                  <span className="mr-2 rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-100">
                    Domain
                  </span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">2 days ago</p>
                </div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <Button variant="link">View all activity</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
