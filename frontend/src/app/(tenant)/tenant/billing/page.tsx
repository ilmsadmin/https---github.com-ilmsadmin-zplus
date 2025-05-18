import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Metadata } from 'next';
import { TenantPackage } from '@/types/tenant';

export const metadata: Metadata = {
  title: 'Billing | Tenant Admin',
  description: 'Manage billing and subscription details',
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

// Define Invoice interface
interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  date: string;
  billingPeriod: {
    start: string;
    end: string;
  };
  items: {
    name: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
}

// Define columns for the invoice table
const columns: ColumnDef<Invoice>[] = [
  {
    accessorKey: 'invoiceNumber',
    header: 'Invoice #',
  },
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) => {
      return new Date(row.getValue('date')).toLocaleDateString();
    },
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) => {
      return `$${(row.getValue('amount') as number).toFixed(2)}`;
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          status === 'paid' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
            : status === 'pending' 
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
              : status === 'failed'
                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
        }`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const invoice = row.original;
      
      return (
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            View
          </Button>
          <Button variant="outline" size="sm">
            Download
          </Button>
        </div>
      );
    },
  },
];

// Mock subscription data
const mockSubscription = {
  package: TenantPackage.PROFESSIONAL,
  price: 199.99,
  billingCycle: 'monthly',
  startDate: '2025-01-01',
  renewalDate: '2025-06-01',
  status: 'active',
  paymentMethod: {
    type: 'credit_card',
    lastFour: '4242',
    expiryDate: '05/27',
    brand: 'Visa',
  },
};

// Mock invoices data
const mockInvoices: Invoice[] = [
  {
    id: '1',
    invoiceNumber: 'INV-2025-0001',
    amount: 199.99,
    status: 'paid',
    date: '2025-01-01',
    billingPeriod: {
      start: '2025-01-01',
      end: '2025-01-31',
    },
    items: [
      {
        name: 'Professional Plan',
        description: 'Monthly subscription',
        quantity: 1,
        unitPrice: 199.99,
        total: 199.99,
      },
    ],
  },
  {
    id: '2',
    invoiceNumber: 'INV-2025-0002',
    amount: 199.99,
    status: 'paid',
    date: '2025-02-01',
    billingPeriod: {
      start: '2025-02-01',
      end: '2025-02-28',
    },
    items: [
      {
        name: 'Professional Plan',
        description: 'Monthly subscription',
        quantity: 1,
        unitPrice: 199.99,
        total: 199.99,
      },
    ],
  },
  {
    id: '3',
    invoiceNumber: 'INV-2025-0003',
    amount: 199.99,
    status: 'paid',
    date: '2025-03-01',
    billingPeriod: {
      start: '2025-03-01',
      end: '2025-03-31',
    },
    items: [
      {
        name: 'Professional Plan',
        description: 'Monthly subscription',
        quantity: 1,
        unitPrice: 199.99,
        total: 199.99,
      },
    ],
  },
  {
    id: '4',
    invoiceNumber: 'INV-2025-0004',
    amount: 199.99,
    status: 'paid',
    date: '2025-04-01',
    billingPeriod: {
      start: '2025-04-01',
      end: '2025-04-30',
    },
    items: [
      {
        name: 'Professional Plan',
        description: 'Monthly subscription',
        quantity: 1,
        unitPrice: 199.99,
        total: 199.99,
      },
    ],
  },
  {
    id: '5',
    invoiceNumber: 'INV-2025-0005',
    amount: 199.99,
    status: 'paid',
    date: '2025-05-01',
    billingPeriod: {
      start: '2025-05-01',
      end: '2025-05-31',
    },
    items: [
      {
        name: 'Professional Plan',
        description: 'Monthly subscription',
        quantity: 1,
        unitPrice: 199.99,
        total: 199.99,
      },
    ],
  },
];

// Mock resource usage data
const mockResourceUsage = {
  users: {
    current: 45,
    limit: 50,
    percentage: (45 / 50) * 100,
  },
  storage: {
    current: 3.2, // GB
    limit: 5, // GB
    percentage: (3.2 / 5) * 100,
  },
  apiCalls: {
    current: 320000,
    limit: 500000,
    percentage: (320000 / 500000) * 100,
  },
};

export default function BillingPage() {
  // In a real app, this would be fetched from the API
  const tenantName = "Example Company";
  
  return (
    <DashboardLayout navItems={navItems} tenantName={tenantName}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Billing & Subscription</h1>
      </div>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Current Subscription */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Current Subscription</CardTitle>
              <CardDescription>Your current plan and billing details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <h3 className="text-lg font-medium">
                    {mockSubscription.package.replace('_', ' ')} Plan
                  </h3>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Price:</span>
                      <span>${mockSubscription.price}/month</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Billing Cycle:</span>
                      <span className="capitalize">{mockSubscription.billingCycle}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Start Date:</span>
                      <span>{new Date(mockSubscription.startDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Next Renewal:</span>
                      <span>{new Date(mockSubscription.renewalDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Status:</span>
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-300 capitalize">
                        {mockSubscription.status}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">Payment Method</h3>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-16 rounded border border-gray-200 bg-white flex items-center justify-center dark:border-gray-800 dark:bg-gray-900">
                        <span className="font-medium">{mockSubscription.paymentMethod.brand}</span>
                      </div>
                      <div>
                        <p className="text-sm">
                          •••• {mockSubscription.paymentMethod.lastFour}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Expires {mockSubscription.paymentMethod.expiryDate}
                        </p>
                      </div>
                    </div>
                    <div className="pt-4">
                      <Button variant="outline" size="sm">
                        Update Payment Method
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800 flex justify-between">
                <div className="space-x-2">
                  <Button variant="outline">Change Plan</Button>
                  <Button variant="outline">Cancel Subscription</Button>
                </div>
                <Button>Add Payment Method</Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Invoice History */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice History</CardTitle>
              <CardDescription>View and download past invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable columns={columns} data={mockInvoices} />
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          {/* Resource Usage */}
          <Card>
            <CardHeader>
              <CardTitle>Resource Usage</CardTitle>
              <CardDescription>Current usage and limits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">Users</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {mockResourceUsage.users.current} / {mockResourceUsage.users.limit}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                    <div 
                      className={`h-2 rounded-full ${
                        mockResourceUsage.users.percentage > 90 
                          ? 'bg-red-500' 
                          : mockResourceUsage.users.percentage > 75 
                            ? 'bg-yellow-500' 
                            : 'bg-green-500'
                      }`} 
                      style={{ width: `${mockResourceUsage.users.percentage}%` }}
                    ></div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {mockResourceUsage.users.percentage > 90 
                      ? 'Approaching user limit. Consider upgrading your plan.' 
                      : 'User allocation is healthy.'}
                  </p>
                </div>
                
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">Storage</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {mockResourceUsage.storage.current} GB / {mockResourceUsage.storage.limit} GB
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                    <div 
                      className={`h-2 rounded-full ${
                        mockResourceUsage.storage.percentage > 90 
                          ? 'bg-red-500' 
                          : mockResourceUsage.storage.percentage > 75 
                            ? 'bg-yellow-500' 
                            : 'bg-green-500'
                      }`} 
                      style={{ width: `${mockResourceUsage.storage.percentage}%` }}
                    ></div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {mockResourceUsage.storage.percentage > 90 
                      ? 'Approaching storage limit. Consider upgrading your plan.' 
                      : 'Storage allocation is healthy.'}
                  </p>
                </div>
                
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">API Calls</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {(mockResourceUsage.apiCalls.current / 1000).toFixed(1)}k / {(mockResourceUsage.apiCalls.limit / 1000).toFixed(1)}k
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                    <div 
                      className={`h-2 rounded-full ${
                        mockResourceUsage.apiCalls.percentage > 90 
                          ? 'bg-red-500' 
                          : mockResourceUsage.apiCalls.percentage > 75 
                            ? 'bg-yellow-500' 
                            : 'bg-green-500'
                      }`} 
                      style={{ width: `${mockResourceUsage.apiCalls.percentage}%` }}
                    ></div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {mockResourceUsage.apiCalls.percentage > 90 
                      ? 'Approaching API limit. Consider upgrading your plan.' 
                      : 'API usage is healthy.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Plan Features */}
          <Card>
            <CardHeader>
              <CardTitle>Plan Features</CardTitle>
              <CardDescription>Features included in your plan</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center text-sm">
                  <svg className="mr-2 h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Up to {mockResourceUsage.users.limit} users</span>
                </li>
                <li className="flex items-center text-sm">
                  <svg className="mr-2 h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{mockResourceUsage.storage.limit} GB storage</span>
                </li>
                <li className="flex items-center text-sm">
                  <svg className="mr-2 h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{(mockResourceUsage.apiCalls.limit / 1000).toFixed(1)}k API calls/month</span>
                </li>
                <li className="flex items-center text-sm">
                  <svg className="mr-2 h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>CRM & HRM Modules</span>
                </li>
                <li className="flex items-center text-sm">
                  <svg className="mr-2 h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>White-labeling</span>
                </li>
                <li className="flex items-center text-sm">
                  <svg className="mr-2 h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Email templates customization</span>
                </li>
                <li className="flex items-center text-sm">
                  <svg className="mr-2 h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>8x5 Priority support</span>
                </li>
              </ul>
            </CardContent>
          </Card>
          
          {/* Need Help */}
          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
              <CardDescription>Billing and subscription support</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm">
                  For billing inquiries or subscription changes, our support team is here to help.
                </p>
                <div className="flex flex-col space-y-2">
                  <Button variant="outline" className="justify-start">
                    <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Contact Billing Support
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    View Billing FAQs
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
