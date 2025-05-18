'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { AccessibleLabel } from '@/components/ui/accessibility';
import { ChevronRight, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'lead';
  lastContact: string;
  value: number;
}

interface CustomerListProps {
  customers?: Customer[];
  isLoading?: boolean;
}

export function CustomerList({ customers = [], isLoading = false }: CustomerListProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState('');
  
  const columns = [
    {
      accessorKey: 'name',
      header: 'Customer Name',
      cell: ({ row }: any) => (
        <div className="font-medium">{row.getValue('name')}</div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => {
        const status = row.getValue('status');
        const statusStyles = {
          active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
          inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
          lead: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        };
        
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status as keyof typeof statusStyles]}`}>
            {status}
          </span>
        );
      }
    },
    {
      accessorKey: 'lastContact',
      header: 'Last Contact',
    },
    {
      accessorKey: 'value',
      header: 'Value',
      cell: ({ row }: any) => {
        return <div className="text-right font-medium">${row.getValue('value').toLocaleString()}</div>
      },
    },
    {
      id: 'actions',
      cell: ({ row }: any) => {
        return (
          <div className="text-right">
            <button
              onClick={() => router.push(`/tenant/modules/crm/customers/${row.original.id}`)}
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              aria-label={`View details for ${row.original.name}`}
            >
              Details <ChevronRight className="ml-1 h-4 w-4" />
            </button>
          </div>
        )
      }
    }
  ];
  
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">Customers</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border rounded-md w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Search customers"
            />
          </div>
        </div>
      </div>
      
      <DataTable
        columns={columns}
        data={filteredCustomers}
        isLoading={isLoading}
        pagination
      />
    </Card>
  );
}
