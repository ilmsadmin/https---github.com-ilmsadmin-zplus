import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Metadata } from 'next';
import Link from 'next/link';
import { Module } from '@/types/tenant';

export const metadata: Metadata = {
  title: 'Module Management | Tenant Admin',
  description: 'Manage active modules in your organization',
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

// Mock data for modules
const mockModules: Module[] = [
  {
    id: 'crm',
    name: 'CRM',
    description: 'Customer Relationship Management module for managing leads, contacts, and sales pipelines',
    status: 'ACTIVE',
    version: '1.5.0',
    price: 49.99,
    category: 'sales',
  },
  {
    id: 'hrm',
    name: 'HRM',
    description: 'Human Resource Management module for managing employees, attendance, and payroll',
    status: 'ACTIVE',
    version: '1.2.3',
    price: 39.99,
    category: 'hr',
  },
  {
    id: 'analytics',
    name: 'Analytics',
    description: 'Business intelligence and data visualization tools',
    status: 'ACTIVE',
    version: '2.0.1',
    price: 79.99,
    category: 'business-intelligence',
  },
  {
    id: '4',
    name: 'Project Management',
    description: 'Task management, Gantt charts, and project tracking',
    status: 'INACTIVE',
    version: '1.0.0',
    price: 29.99,
    category: 'productivity',
  },
];

// Mock module usage data
const mockModuleUsage = [
  { module: 'CRM', users: 45, dataPoints: 12500, lastMonth: 10250 },
  { module: 'HRM', users: 18, dataPoints: 5200, lastMonth: 4800 },
  { module: 'Analytics', users: 32, dataPoints: 18400, lastMonth: 15300 },
];

export default function ModulesPage() {
  // In a real app, this would be fetched from the API
  const tenantName = "Example Company";
  
  return (
    <DashboardLayout navItems={navItems} tenantName={tenantName}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Module Management</h1>
        <Link href="/tenant/modules/marketplace">
          <Button>Browse Marketplace</Button>
        </Link>
      </div>
      
      {/* Active Modules */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Active Modules</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {mockModules.filter(m => m.status === 'ACTIVE').map((module) => (
            <Card key={module.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{module.name}</span>
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                    v{module.version}
                  </span>
                </CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Category:</span>
                    <span>{module.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                  </div>
                    <div className="pt-2 flex justify-between">
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                    <Link href={`/tenant/modules/${module.id}`}>
                      <Button size="sm">
                        Open Module
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Module Usage Stats */}
        <h2 className="text-xl font-semibold mt-10">Module Usage</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>User Engagement</CardTitle>
              <CardDescription>Active users per module</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockModuleUsage.map((item) => (
                  <div key={item.module}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-medium">{item.module}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{item.users} users</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                      <div 
                        className={`h-2 rounded-full ${
                          item.module === 'CRM' 
                            ? 'bg-blue-500' 
                            : item.module === 'HRM' 
                              ? 'bg-green-500' 
                              : 'bg-purple-500'
                        }`} 
                        style={{ width: `${Math.min(100, (item.users / 50) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Data Growth</CardTitle>
              <CardDescription>Data points tracked per module</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockModuleUsage.map((item) => (
                  <div key={item.module}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-medium">{item.module}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        <span className="text-green-500">↑ {Math.round((item.dataPoints - item.lastMonth) / item.lastMonth * 100)}%</span> from last month
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-semibold">{(item.dataPoints / 1000).toFixed(1)}k</span>
                      <div className="ml-4 h-2 flex-1 rounded-full bg-gray-200 dark:bg-gray-700">
                        <div 
                          className={`h-2 rounded-full ${
                            item.module === 'CRM' 
                              ? 'bg-blue-500' 
                              : item.module === 'HRM' 
                                ? 'bg-green-500' 
                                : 'bg-purple-500'
                          }`} 
                          style={{ width: `${Math.min(100, (item.dataPoints / 20000) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Available Modules */}
        <h2 className="text-xl font-semibold mt-10">Available Modules</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {mockModules.filter(m => m.status === 'INACTIVE').map((module) => (
            <Card key={module.id} className="border-dashed">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{module.name}</span>
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                    Inactive
                  </span>
                </CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Price:</span>
                    <span>${module.price}/month</span>
                  </div>
                  
                  <div className="pt-2">
                    <Button variant="outline" size="sm" className="w-full">
                      Activate Module
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
