'use client';

import React, { useState } from 'react';
import { DataVisualization } from './data-visualization';
import { Grid, GripVertical, Plus, X, Settings, Save } from 'lucide-react';
import { AccessibleIcon } from '@/components/ui/accessibility';
import { Card } from '@/components/ui/card';

interface DashboardItem {
  id: string;
  title: string;
  type: 'bar' | 'line' | 'pie' | 'stats' | 'table';
  size: 'small' | 'medium' | 'large';
  data: any;
  config?: any;
}

interface CustomDashboardProps {
  items: DashboardItem[];
  onSaveLayout?: (items: DashboardItem[]) => void;
  onAddWidget?: () => void;
  onRemoveWidget?: (id: string) => void;
  onEditWidget?: (id: string) => void;
}

export function CustomDashboard({ 
  items = [], 
  onSaveLayout, 
  onAddWidget,
  onRemoveWidget,
  onEditWidget
}: CustomDashboardProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [layout, setLayout] = useState<DashboardItem[]>(items);
  
  const handleSaveLayout = () => {
    setIsEditMode(false);
    if (onSaveLayout) {
      onSaveLayout(layout);
    }
  };
  
  const toggleEditMode = () => {
    if (isEditMode) {
      handleSaveLayout();
    } else {
      setIsEditMode(true);
    }
  };
  
  const renderWidget = (item: DashboardItem) => {
    switch (item.type) {
      case 'bar':
      case 'line':
      case 'pie':
        return (
          <DataVisualization
            title={item.title}
            data={item.data}
            type={item.type}
            {...item.config}
          />
        );
      case 'stats':
        return (
          <Card className="p-4">
            <h3 className="text-lg font-medium">{item.title}</h3>
            <div className="mt-2 grid grid-cols-2 gap-4">
              {item.data.map((stat: any, index: number) => (
                <div key={index} className="text-center">
                  <div className="text-2xl font-semibold">{stat.value}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </Card>
        );
      case 'table':
        return (
          <Card className="p-4">
            <h3 className="text-lg font-medium">{item.title}</h3>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {item.config?.columns?.map((col: any) => (
                      <th key={col.key} className="px-4 py-2 text-left">{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {item.data.map((row: any, rowIndex: number) => (
                    <tr key={rowIndex} className="border-b last:border-0">
                      {item.config?.columns?.map((col: any) => (
                        <td key={col.key} className="px-4 py-2">{row[col.key]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        );
      default:
        return null;
    }
  };
  
  // Size mappings to grid classes
  const sizeClasses = {
    small: 'col-span-12 md:col-span-6 lg:col-span-4',
    medium: 'col-span-12 md:col-span-6',
    large: 'col-span-12',
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Dashboard</h2>
        <div className="flex items-center space-x-2">
          {isEditMode && (
            <button
              onClick={onAddWidget}
              className="p-2 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
              aria-label="Add widget"
            >
              <AccessibleIcon label="Add widget">
                <Plus className="h-5 w-5" />
              </AccessibleIcon>
            </button>
          )}
          
          <button
            onClick={toggleEditMode}
            className={`p-2 rounded-md ${
              isEditMode 
                ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
            aria-label={isEditMode ? "Save layout" : "Edit layout"}
          >
            <AccessibleIcon label={isEditMode ? "Save layout" : "Edit layout"}>
              {isEditMode ? <Save className="h-5 w-5" /> : <Settings className="h-5 w-5" />}
            </AccessibleIcon>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-12 gap-4">
        {layout.map((item) => (
          <div key={item.id} className={sizeClasses[item.size]}>
            <div className={`h-full ${isEditMode ? 'cursor-move ring-2 ring-blue-200 dark:ring-blue-800 rounded-lg' : ''}`}>
              {isEditMode && (
                <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/50 p-2 rounded-t-lg">
                  <div className="flex items-center text-sm text-blue-700 dark:text-blue-300">
                    <GripVertical className="h-4 w-4 mr-2" />
                    <span className="font-medium">{item.title}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onEditWidget && onEditWidget(item.id)}
                      className="p-1 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800"
                      aria-label={`Edit ${item.title}`}
                    >
                      <AccessibleIcon label={`Edit ${item.title}`}>
                        <Settings className="h-4 w-4" />
                      </AccessibleIcon>
                    </button>
                    <button
                      onClick={() => onRemoveWidget && onRemoveWidget(item.id)}
                      className="p-1 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800"
                      aria-label={`Remove ${item.title}`}
                    >
                      <AccessibleIcon label={`Remove ${item.title}`}>
                        <X className="h-4 w-4" />
                      </AccessibleIcon>
                    </button>
                  </div>
                </div>
              )}
              
              <div className={isEditMode ? 'rounded-b-lg overflow-hidden' : 'rounded-lg overflow-hidden'}>
                {renderWidget(item)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
