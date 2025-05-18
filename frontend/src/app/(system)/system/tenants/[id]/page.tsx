import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Metadata } from 'next';
import { AreaChartComponent, ChartCard, LineChartComponent } from '@/components/ui/chart';
import { systemNavItems } from '@/config/navigation';
import { ActivityList } from '@/components/ui/activity-list';
import { StatCard } from '@/components/ui/stat-card';
import { DetailsList } from '@/components/ui/details-list';
import { ModuleList } from '@/components/ui/module-list';
import { TenantHeader } from '@/components/system/tenant-header';
import { UserTable } from '@/components/system/user-table';
import { DomainTable } from '@/components/system/domain-table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { ChartDataPoint, UiActivity, UiDomain, UiModule, UiTenant, UiUser } from '@/types/ui';

export const metadata: Metadata = {
  title: 'Tenant Details | Multi-Tenant Platform',
  description: 'View and manage tenant details',
};

// Mock tenant data
const tenant: UiTenant = {
  id: '550e8400-e29b-41d4-a716-446655440010',
  name: 'Tenant A',
  schemaName: 'tenant1',
  packageName: 'Basic',
  status: 'active',
  usersCount: 8,
  domainsCount: 1,
  storageUsed: '120 MB',
  storageLimit: '1 GB',
  createdAt: '2025-01-15',
  billingEmail: 'billing@tenant1.com',
  subscriptionStartDate: '2025-01-15',
  subscriptionEndDate: '2026-01-15',
};

// Mock user data
const users: UiUser[] = [
  { id: '1', name: 'John Doe', email: 'john@tenant1.com', role: 'Admin', lastLogin: '2025-05-15 10:30' },
  { id: '2', name: 'Jane Smith', email: 'jane@tenant1.com', role: 'Manager', lastLogin: '2025-05-17 09:15' },
  { id: '3', name: 'Mike Johnson', email: 'mike@tenant1.com', role: 'User', lastLogin: '2025-05-16 14:45' },
  { id: '4', name: 'Sarah Williams', email: 'sarah@tenant1.com', role: 'User', lastLogin: '2025-05-10 11:20' },
];

// Mock domains data
const domains: UiDomain[] = [
  { id: '1', domain: 'tenant1.example.com', isDefault: true, status: 'active', sslEnabled: true },
  { id: '2', domain: 'customer-domain.com', isDefault: false, status: 'active', sslEnabled: true },
];

// Mock modules data
const modules: UiModule[] = [
  { id: '1', name: 'CRM', status: 'active', usersCount: 8, lastActivity: '2025-05-17' },
  { id: '2', name: 'HRM', status: 'inactive', usersCount: 0, lastActivity: 'Never' },
];

// Mock activity data
const activities: UiActivity[] = [
  { id: '1', action: 'User Login', user: 'John Doe', timestamp: '2025-05-18 09:30' },
  { id: '2', action: 'Customer Added', user: 'Jane Smith', timestamp: '2025-05-17 15:45' },
  { id: '3', action: 'Invoice Created', user: 'Mike Johnson', timestamp: '2025-05-16 11:20' },
  { id: '4', action: 'Profile Updated', user: 'Sarah Williams', timestamp: '2025-05-15 14:10' },
  { id: '5', action: 'Module Config Changed', user: 'John Doe', timestamp: '2025-05-14 10:35' },
];

// Mock chart data
const userActivityData: ChartDataPoint[] = [
  { date: '05/11', activeUsers: 3 },
  { date: '05/12', activeUsers: 5 },
  { date: '05/13', activeUsers: 4 },
  { date: '05/14', activeUsers: 6 },
  { date: '05/15', activeUsers: 7 },
  { date: '05/16', activeUsers: 5 },
  { date: '05/17', activeUsers: 8 },
];

const storageUsageData: ChartDataPoint[] = [
  { date: '01/15', usage: 10 },
  { date: '02/15', usage: 25 },
  { date: '03/15', usage: 55 },
  { date: '04/15', usage: 85 },
  { date: '05/15', usage: 120 },
];

export default function TenantDetailPage({ params }: { params: { id: string } }) {
  return (    <DashboardLayout navItems={systemNavItems}>
      <TenantHeader 
        tenant={tenant}
        onActivate={() => console.log('Toggle activation for tenant:', tenant.id)}
        onEdit={() => console.log('Edit tenant:', tenant.id)}
        onDelete={() => console.log('Delete tenant:', tenant.id)}
      />      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Users"
          value={tenant.usersCount}
        />
        
        <StatCard
          title="Domains"
          value={tenant.domainsCount}
        />
        
        <StatCard
          title="Package"
          value={tenant.packageName}
        />
        
        <StatCard
          title="Storage"
          value={tenant.storageUsed}
          subtitle={`of ${tenant.storageLimit}`}
        />
      </div>      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <ChartCard
          title="User Activity"
          description="Daily active users over the past week"
        >
          <LineChartComponent
            data={userActivityData}
            xKey="date"
            yKeys={[{ key: 'activeUsers', name: 'Active Users', color: '#4f46e5' }]}
          />
        </ChartCard>
        
        <ChartCard
          title="Storage Usage"
          description="Storage usage over time (MB)"
        >
          <AreaChartComponent
            data={storageUsageData}
            xKey="date"
            yKeys={[{ key: 'usage', name: 'Usage (MB)', color: '#10b981' }]}
          />
        </ChartCard>
      </div><div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tenant Information</CardTitle>
            <CardDescription>Basic information about the tenant</CardDescription>
          </CardHeader>
          <CardContent>
            <DetailsList 
              details={[
                { label: 'Name', value: tenant.name },
                { label: 'Schema Name', value: tenant.schemaName },
                { label: 'Created', value: tenant.createdAt },
                { label: 'Billing Email', value: tenant.billingEmail },
                { label: 'Subscription Start', value: tenant.subscriptionStartDate },
                { label: 'Subscription End', value: tenant.subscriptionEndDate }
              ]}
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest user activities in this tenant</CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityList activities={activities} />
          </CardContent>
        </Card>
      </div>      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>Users registered in this tenant</CardDescription>
          </CardHeader>
          <CardContent>
            <UserTable 
              users={users}
              onRowClick={(user) => console.log('User clicked:', user.id)}
            />
          </CardContent>
        </Card>
      </div>      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Domains</CardTitle>
            <CardDescription>Domains associated with this tenant</CardDescription>
          </CardHeader>
          <CardContent>
            <DomainTable 
              domains={domains}
              onRowClick={(domain) => console.log('Domain clicked:', domain.id)}
            />
          </CardContent>
        </Card>
      </div>      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Modules</CardTitle>
            <CardDescription>Enabled modules for this tenant</CardDescription>
          </CardHeader>
          <CardContent>
            <ModuleList 
              modules={modules}
              onToggleStatus={(moduleId, currentStatus) => {
                console.log('Toggle module status:', moduleId, currentStatus);
              }}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
