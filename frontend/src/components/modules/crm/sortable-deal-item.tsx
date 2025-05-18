'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { MoreHorizontal, User, Calendar, DollarSign } from 'lucide-react';
import { AccessibleIcon } from '@/components/ui/accessibility';

export interface Deal {
  id: string;
  title: string;
  value: number;
  customer: string;
  dueDate: string;
  assignee: string;
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
}

interface SortableDealItemProps {
  deal: Deal;
  id: string;
}

export function SortableDealItem({ deal, id }: SortableDealItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="mb-2 p-3 cursor-grab active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <div className="flex justify-between items-start">
        <h4 className="font-medium text-sm">{deal.title}</h4>
        <button 
          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label={`Options for ${deal.title}`}
        >
          <AccessibleIcon label="Deal options">
            <MoreHorizontal className="h-4 w-4" />
          </AccessibleIcon>
        </button>
      </div>
      <div className="text-sm text-gray-500 mt-2">{deal.customer}</div>
      <div className="mt-3 flex flex-wrap gap-2">
        <div className="inline-flex items-center text-xs text-gray-600 dark:text-gray-400">
          <DollarSign className="h-3 w-3 mr-1" />
          ${deal.value.toLocaleString()}
        </div>
        <div className="inline-flex items-center text-xs text-gray-600 dark:text-gray-400">
          <Calendar className="h-3 w-3 mr-1" />
          {deal.dueDate}
        </div>
        <div className="inline-flex items-center text-xs text-gray-600 dark:text-gray-400">
          <User className="h-3 w-3 mr-1" />
          {deal.assignee}
        </div>
      </div>
    </Card>
  );
}
