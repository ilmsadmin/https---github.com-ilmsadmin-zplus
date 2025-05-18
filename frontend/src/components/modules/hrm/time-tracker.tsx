'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Calendar, Clock, ArrowRight, Check, X } from 'lucide-react';
import { AccessibleIcon } from '@/components/ui/accessibility';
import { DataTable } from '@/components/ui/data-table';

interface TimeEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  project: string;
  task: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface TimeTrackerProps {
  entries?: TimeEntry[];
  onApprove?: (entryId: string) => void;
  onReject?: (entryId: string) => void;
  isAdmin?: boolean;
  isLoading?: boolean;
}

export function TimeTracker({ 
  entries = [], 
  onApprove, 
  onReject, 
  isAdmin = false,
  isLoading = false,
}: TimeTrackerProps) {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const columns = [
    {
      accessorKey: 'employeeName',
      header: 'Employee',
    },
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }: any) => (
        <div className="inline-flex items-center">
          <Calendar className="h-4 w-4 mr-1 text-gray-500" />
          {row.getValue('date')}
        </div>
      ),
    },
    {
      accessorKey: 'time',
      header: 'Time',
      cell: ({ row }: any) => (
        <div className="inline-flex items-center">
          <Clock className="h-4 w-4 mr-1 text-gray-500" />
          <span>{row.original.startTime} <ArrowRight className="h-3 w-3 mx-1" /> {row.original.endTime}</span>
        </div>
      ),
    },
    {
      accessorKey: 'duration',
      header: 'Duration',
      cell: ({ row }: any) => formatDuration(row.getValue('duration')),
    },
    {
      accessorKey: 'project',
      header: 'Project',
    },
    {
      accessorKey: 'task',
      header: 'Task',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => {
        const status = row.getValue('status');
        const statusStyles = {
          pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
          approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
          rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        };
        
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status as keyof typeof statusStyles]}`}>
            {status}
          </span>
        );
      }
    },
    ...(isAdmin ? [
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }: any) => {
          const status = row.getValue('status');
          if (status !== 'pending') return null;
          
          return (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onApprove && onApprove(row.original.id)}
                className="p-1 rounded-full bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800"
                aria-label={`Approve time entry for ${row.original.employeeName}`}
              >
                <AccessibleIcon label="Approve">
                  <Check className="h-4 w-4" />
                </AccessibleIcon>
              </button>
              
              <button
                onClick={() => onReject && onReject(row.original.id)}
                className="p-1 rounded-full bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800"
                aria-label={`Reject time entry for ${row.original.employeeName}`}
              >
                <AccessibleIcon label="Reject">
                  <X className="h-4 w-4" />
                </AccessibleIcon>
              </button>
            </div>
          );
        }
      }
    ] : []),
  ];
  
  const totalHours = entries.reduce((total, entry) => total + entry.duration, 0) / 60;
  
  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">Time Tracking</h2>
          <div className="text-sm bg-blue-50 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-3 py-1 rounded-full">
            Total: {totalHours.toFixed(1)} hours
          </div>
        </div>
      </div>
      
      <DataTable
        columns={columns}
        data={entries}
        isLoading={isLoading}
        pagination
      />
    </Card>
  );
}
