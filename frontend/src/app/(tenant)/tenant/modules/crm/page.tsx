'use client';

import React from 'react';
import { DealPipeline } from '@/components/modules/crm/deal-pipeline';

// Sample data for the Deal Pipeline
const sampleDeals = [
  {
    id: 'deal1',
    title: 'Enterprise Software License',
    value: 15000,
    customer: 'Acme Corp',
    dueDate: '2025-06-15',
    assignee: 'John Smith',
    stage: 'lead'
  },
  {
    id: 'deal2',
    title: 'Cloud Migration Project',
    value: 45000,
    customer: 'TechGlobal Inc',
    dueDate: '2025-07-22',
    assignee: 'Sarah Johnson',
    stage: 'qualified'
  },
  {
    id: 'deal3',
    title: 'Support Contract Renewal',
    value: 8500,
    customer: 'Zeta Industries',
    dueDate: '2025-05-30',
    assignee: 'Mike Chen',
    stage: 'proposal'
  },
  {
    id: 'deal4',
    title: 'Data Analytics Platform',
    value: 75000,
    customer: 'Finance Partners Ltd',
    dueDate: '2025-08-10',
    assignee: 'Emily Wong',
    stage: 'negotiation'
  },
  {
    id: 'deal5',
    title: 'Security Audit Services',
    value: 12500,
    customer: 'Health Systems Inc',
    dueDate: '2025-06-05',
    assignee: 'John Smith',
    stage: 'proposal'
  },
  {
    id: 'deal6',
    title: 'Mobile App Development',
    value: 35000,
    customer: 'Retail Solutions Co',
    dueDate: '2025-09-15',
    assignee: 'Sarah Johnson',
    stage: 'qualified'
  },
  {
    id: 'deal7',
    title: 'Annual Subscription',
    value: 120000,
    customer: 'Global Enterprises',
    dueDate: '2025-06-30',
    assignee: 'Mike Chen',
    stage: 'closed-won'
  },
  {
    id: 'deal8',
    title: 'Hardware Upgrade',
    value: 65000,
    customer: 'Manufacturing Ltd',
    dueDate: '2025-07-12',
    assignee: 'Emily Wong',
    stage: 'closed-lost'
  }
];

export default function CRMPage() {
  const handleDealMove = (result: { dealId: string; newStage: string; newIndex: number }) => {
    console.log('Deal moved:', result);
    // In a real app, this would update the backend
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">CRM Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage your sales pipeline and customer relationships
        </p>
      </div>
      
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Deal Pipeline</h2>
        <DealPipeline deals={sampleDeals} onDealMove={handleDealMove} />
      </section>
      
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="text-lg font-medium mb-3">Recent Activities</h3>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="flex items-start border-b border-gray-200 dark:border-gray-700 pb-3 last:border-0">
                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-blue-600 dark:text-blue-300 text-sm font-medium">JS</span>
                </div>
                <div>
                  <p className="text-sm"><span className="font-medium">John Smith</span> added a note to <span className="text-blue-600 dark:text-blue-400">Acme Corp</span></p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">3 hours ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="text-lg font-medium mb-3">Upcoming Tasks</h3>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3 last:border-0">
                <div className="flex items-center">
                  <input type="checkbox" className="mr-3 h-4 w-4 text-blue-600 rounded" aria-label="Complete task" />
                  <span className="text-sm">Call with TechGlobal about new requirements</span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Tomorrow, 10:00 AM</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
