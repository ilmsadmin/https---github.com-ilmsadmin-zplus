'use client';

import React from 'react';
import { EmployeeDirectory } from '@/components/modules/hrm/employee-directory';
import { TimeTracker } from '@/components/modules/hrm/time-tracker';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { AccessibilityToggle } from '@/components/ui/accessibility-toggle';

// Sample employee data
const sampleEmployees = [
  {
    id: 'emp1',
    name: 'John Smith',
    email: 'john.smith@company.com',
    phone: '(555) 123-4567',
    department: 'Engineering',
    position: 'Senior Developer',
    status: 'active'
  },
  {
    id: 'emp2',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    phone: '(555) 234-5678',
    department: 'Marketing',
    position: 'Marketing Director',
    status: 'active'
  },
  {
    id: 'emp3',
    name: 'Michael Chen',
    email: 'michael.chen@company.com',
    phone: '(555) 345-6789',
    department: 'Engineering',
    position: 'DevOps Engineer',
    status: 'active'
  },
  {
    id: 'emp4',
    name: 'Emily Wong',
    email: 'emily.wong@company.com',
    phone: '(555) 456-7890',
    department: 'Human Resources',
    position: 'HR Manager',
    status: 'active'
  },
  {
    id: 'emp5',
    name: 'Robert Taylor',
    email: 'robert.taylor@company.com',
    phone: '(555) 567-8901',
    department: 'Sales',
    position: 'Sales Executive',
    status: 'leave'
  },
  {
    id: 'emp6',
    name: 'Lisa Rodriguez',
    email: 'lisa.rodriguez@company.com',
    phone: '(555) 678-9012',
    department: 'Engineering',
    position: 'QA Engineer',
    status: 'active'
  },
  {
    id: 'emp7',
    name: 'David Wilson',
    email: 'david.wilson@company.com',
    phone: '(555) 789-0123',
    department: 'Finance',
    position: 'Financial Analyst',
    status: 'active'
  },
  {
    id: 'emp8',
    name: 'Jennifer Lee',
    email: 'jennifer.lee@company.com',
    phone: '(555) 890-1234',
    department: 'Marketing',
    position: 'Content Strategist',
    status: 'terminated'
  }
];

// Sample time tracking entries
const sampleTimeEntries = [
  {
    id: 'time1',
    employeeId: 'emp1',
    employeeName: 'John Smith',
    date: '2025-05-18',
    startTime: '09:00',
    endTime: '17:00',
    duration: 480,
    project: 'Website Redesign',
    task: 'Frontend Development',
    status: 'approved'
  },
  {
    id: 'time2',
    employeeId: 'emp3',
    employeeName: 'Michael Chen',
    date: '2025-05-18',
    startTime: '08:30',
    endTime: '16:30',
    duration: 480,
    project: 'Server Migration',
    task: 'Database Configuration',
    status: 'pending'
  },
  {
    id: 'time3',
    employeeId: 'emp6',
    employeeName: 'Lisa Rodriguez',
    date: '2025-05-18',
    startTime: '09:15',
    endTime: '17:45',
    duration: 510,
    project: 'Mobile App',
    task: 'Testing',
    status: 'pending'
  },
  {
    id: 'time4',
    employeeId: 'emp2',
    employeeName: 'Sarah Johnson',
    date: '2025-05-17',
    startTime: '09:00',
    endTime: '17:00',
    duration: 480,
    project: 'Marketing Campaign',
    task: 'Content Creation',
    status: 'approved'
  },
  {
    id: 'time5',
    employeeId: 'emp1',
    employeeName: 'John Smith',
    date: '2025-05-17',
    startTime: '09:00',
    endTime: '18:30',
    duration: 570,
    project: 'Website Redesign',
    task: 'Frontend Development',
    status: 'approved'
  },
  {
    id: 'time6',
    employeeId: 'emp7',
    employeeName: 'David Wilson',
    date: '2025-05-17',
    startTime: '08:00',
    endTime: '16:00',
    duration: 480,
    project: 'Financial Reporting',
    task: 'Quarterly Analysis',
    status: 'rejected'
  }
];

export default function HRMPage() {
  const handleApproveTime = (entryId: string) => {
    console.log('Time entry approved:', entryId);
    // In a real app, this would update the backend
  };

  const handleRejectTime = (entryId: string) => {
    console.log('Time entry rejected:', entryId);
    // In a real app, this would update the backend
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Human Resource Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage employees, time tracking, and HR operations
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <ThemeSwitcher />
          <AccessibilityToggle />
        </div>
      </div>
      
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Employee Directory</h2>
        <EmployeeDirectory employees={sampleEmployees} />
      </section>
      
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Time Tracking</h2>
        <TimeTracker 
          entries={sampleTimeEntries} 
          onApprove={handleApproveTime} 
          onReject={handleRejectTime}
          isAdmin={true}
        />
      </section>
      
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="text-lg font-medium mb-4">Department Breakdown</h3>
          <div className="space-y-2">
            {['Engineering', 'Marketing', 'Sales', 'Human Resources', 'Finance'].map((dept) => {
              const count = sampleEmployees.filter(e => e.department === dept).length;
              const percent = Math.round((count / sampleEmployees.length) * 100);
              return (
                <div key={dept} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{dept}</span>
                    <span className="font-medium">{count} ({percent}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${percent}%` }}
                      role="progressbar"
                      aria-valuenow={percent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="text-lg font-medium mb-4">Upcoming Reviews</h3>
          <div className="space-y-3">
            {['John Smith', 'Sarah Johnson', 'Michael Chen'].map((name, idx) => (
              <div key={idx} className="border-b border-gray-200 dark:border-gray-700 pb-3 last:border-0">
                <div className="flex justify-between">
                  <span className="font-medium">{name}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Jun {10 + idx}, 2025</span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Annual Performance Review
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="text-lg font-medium mb-4">Open Positions</h3>
          <div className="space-y-3">
            {[
              { title: 'Senior Frontend Developer', department: 'Engineering', applicants: 12 },
              { title: 'UX Designer', department: 'Design', applicants: 8 },
              { title: 'Sales Manager', department: 'Sales', applicants: 5 },
              { title: 'Data Analyst', department: 'Analytics', applicants: 7 },
            ].map((job, idx) => (
              <div key={idx} className="border-b border-gray-200 dark:border-gray-700 pb-3 last:border-0">
                <div className="font-medium">{job.title}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {job.department} · {job.applicants} applicants
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
