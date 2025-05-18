'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Search, Mail, Phone, Filter } from 'lucide-react';
import { AccessibleIcon } from '@/components/ui/accessibility';
import Image from 'next/image';

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  status: 'active' | 'leave' | 'terminated';
  avatarUrl?: string;
}

interface EmployeeDirectoryProps {
  employees?: Employee[];
  isLoading?: boolean;
}

export function EmployeeDirectory({ employees = [], isLoading = false }: EmployeeDirectoryProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filter, setFilter] = React.useState<string | null>(null);
  
  const departments = React.useMemo(() => {
    const depts = new Set<string>();
    employees.forEach(emp => depts.add(emp.department));
    return Array.from(depts);
  }, [employees]);
  
  const columns = [
    {
      accessorKey: 'name',
      header: 'Employee',
      cell: ({ row }: any) => {
        const employee = row.original;
        return (
          <div className="flex items-center">
            <div className="mr-3 flex-shrink-0">
              {employee.avatarUrl ? (
                <Image
                  src={employee.avatarUrl}
                  alt={`${employee.name} avatar`}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-600 font-medium">
                    {employee.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
              )}
            </div>
            <div>
              <div className="font-medium">{employee.name}</div>
              <div className="text-sm text-gray-500">{employee.position}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'department',
      header: 'Department',
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }: any) => (
        <a 
          href={`mailto:${row.getValue('email')}`} 
          className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          aria-label={`Email ${row.original.name}`}
        >
          <Mail className="h-4 w-4 mr-1" />
          {row.getValue('email')}
        </a>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }: any) => (
        <a 
          href={`tel:${row.getValue('phone')}`} 
          className="inline-flex items-center"
          aria-label={`Call ${row.original.name}`}
        >
          <Phone className="h-4 w-4 mr-1" />
          {row.getValue('phone')}
        </a>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => {
        const status = row.getValue('status');
        const statusStyles = {
          active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
          leave: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
          terminated: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        };
        
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status as keyof typeof statusStyles]}`}>
            {status}
          </span>
        );
      }
    },
  ];
  
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.position.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesFilter = filter ? emp.department === filter : true;
    
    return matchesSearch && matchesFilter;
  });
  
  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">Employee Directory</h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border rounded-md w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Search employees"
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <select
                value={filter || ''}
                onChange={(e) => setFilter(e.target.value || null)}
                className="pl-9 pr-4 py-2 border rounded-md appearance-none w-full md:w-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Filter by department"
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      
      <DataTable
        columns={columns}
        data={filteredEmployees}
        isLoading={isLoading}
        pagination
      />
    </Card>
  );
}
