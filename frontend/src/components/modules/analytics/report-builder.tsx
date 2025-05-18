'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { DataVisualization } from './data-visualization';
import { 
  Filter, 
  SlidersHorizontal, 
  Calendar, 
  Download, 
  ChevronDown, 
  Share2,
  RotateCcw,
  PlusCircle,
  RefreshCcw,
  FileText
} from 'lucide-react';
import { AccessibleIcon } from '@/components/ui/accessibility';

interface FilterOption {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'between';
  value: any;
  label: string;
}

interface ColumnOption {
  id: string;
  field: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  format?: string;
  visible: boolean;
}

interface ReportBuilderProps {
  reportName?: string;
  description?: string;
  availableFields?: {
    id: string;
    field: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'boolean';
  }[];
  data?: any[];
  onRunReport?: (filters: FilterOption[], columns: ColumnOption[], timeRange: { from: string; to: string }) => void;
  onExport?: (format: 'csv' | 'excel' | 'pdf') => void;
  onSaveReport?: () => void;
  onScheduleReport?: () => void;
  isLoading?: boolean;
}

export function ReportBuilder({
  reportName = 'New Report',
  description = 'Create a custom report by selecting fields and applying filters.',
  availableFields = [],
  data = [],
  onRunReport,
  onExport,
  onSaveReport,
  onScheduleReport,
  isLoading = false,
}: ReportBuilderProps) {
  const [activeFilters, setActiveFilters] = useState<FilterOption[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<ColumnOption[]>(
    availableFields.map(field => ({
      id: field.id,
      field: field.field,
      label: field.label,
      type: field.type,
      visible: true,
    }))
  );
  const [timeRange, setTimeRange] = useState<{ from: string; to: string }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    to: new Date().toISOString().split('T')[0], // today
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showFieldSelector, setShowFieldSelector] = useState(false);
  const [visualizationType, setVisualizationType] = useState<'table' | 'bar' | 'line'>('table');
  
  const addFilter = () => {
    if (availableFields.length === 0) return;
    
    const newFilter: FilterOption = {
      id: `filter-${Date.now()}`,
      field: availableFields[0].field,
      operator: 'equals',
      value: '',
      label: `${availableFields[0].label} equals`,
    };
    
    setActiveFilters([...activeFilters, newFilter]);
  };
  
  const removeFilter = (id: string) => {
    setActiveFilters(activeFilters.filter(f => f.id !== id));
  };
  
  const updateFilter = (id: string, updates: Partial<FilterOption>) => {
    setActiveFilters(activeFilters.map(filter => 
      filter.id === id ? { ...filter, ...updates } : filter
    ));
  };
  
  const toggleColumnVisibility = (id: string) => {
    setSelectedColumns(selectedColumns.map(col => 
      col.id === id ? { ...col, visible: !col.visible } : col
    ));
  };
  
  const runReport = () => {
    if (onRunReport) {
      onRunReport(activeFilters, selectedColumns, timeRange);
    }
  };
  
  const resetFilters = () => {
    setActiveFilters([]);
  };
  
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-semibold">{reportName}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
      </div>
      
      <Card className="mb-6">
        <div className="p-4 border-b">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-3 py-1.5 text-sm rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              aria-expanded={showFilters}
              aria-controls="filter-panel"
            >
              <Filter className="h-4 w-4 mr-1.5" />
              Filters
              <ChevronDown className={`h-4 w-4 ml-1.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            
            <button
              onClick={() => setShowFieldSelector(!showFieldSelector)}
              className="flex items-center px-3 py-1.5 text-sm rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              aria-expanded={showFieldSelector}
              aria-controls="field-selector-panel"
            >
              <SlidersHorizontal className="h-4 w-4 mr-1.5" />
              Columns
              <ChevronDown className={`h-4 w-4 ml-1.5 transition-transform ${showFieldSelector ? 'rotate-180' : ''}`} />
            </button>
            
            <div className="flex items-center px-3 py-1.5 text-sm rounded-md bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              <Calendar className="h-4 w-4 mr-1.5" />
              <input
                type="date"
                value={timeRange.from}
                onChange={(e) => setTimeRange({ ...timeRange, from: e.target.value })}
                className="bg-transparent border-0 p-0 focus:ring-0 w-32"
                aria-label="From date"
              />
              <span className="mx-2">to</span>
              <input
                type="date"
                value={timeRange.to}
                onChange={(e) => setTimeRange({ ...timeRange, to: e.target.value })}
                className="bg-transparent border-0 p-0 focus:ring-0 w-32"
                aria-label="To date"
              />
            </div>
            
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={resetFilters}
                className="flex items-center px-3 py-1.5 text-sm rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                aria-label="Reset filters"
              >
                <AccessibleIcon label="Reset filters">
                  <RotateCcw className="h-4 w-4" />
                </AccessibleIcon>
              </button>
              
              <button
                onClick={runReport}
                className="flex items-center px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                aria-label="Run report"
                disabled={isLoading}
              >
                <RefreshCcw className={`h-4 w-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
                Run Report
              </button>
            </div>
          </div>
          
          {showFilters && (
            <div id="filter-panel" className="mt-4 border-t pt-4">
              <div className="mb-2 flex justify-between items-center">
                <h3 className="text-sm font-medium">Active Filters</h3>
                <button
                  onClick={addFilter}
                  className="flex items-center text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <PlusCircle className="h-3 w-3 mr-1" />
                  Add Filter
                </button>
              </div>
              
              {activeFilters.length === 0 ? (
                <div className="text-sm text-gray-500 py-2">No filters applied. Add a filter to refine your results.</div>
              ) : (
                <div className="space-y-2">
                  {activeFilters.map(filter => (
                    <div key={filter.id} className="flex items-center gap-2 bg-gray-50 p-2 rounded-md dark:bg-gray-800/50">
                      <select
                        value={filter.field}
                        onChange={(e) => {
                          const field = availableFields.find(f => f.field === e.target.value);
                          if (field) {
                            updateFilter(filter.id, { 
                              field: field.field,
                              label: `${field.label} ${filter.operator}`
                            });
                          }
                        }}
                        className="text-sm bg-white border rounded-md px-2 py-1 dark:bg-gray-700"
                        aria-label="Filter field"
                      >
                        {availableFields.map(field => (
                          <option key={field.id} value={field.field}>{field.label}</option>
                        ))}
                      </select>
                      
                      <select
                        value={filter.operator}
                        onChange={(e) => {
                          const field = availableFields.find(f => f.field === filter.field);
                          updateFilter(filter.id, { 
                            operator: e.target.value as any,
                            label: `${field?.label || filter.field} ${e.target.value}`
                          });
                        }}
                        className="text-sm bg-white border rounded-md px-2 py-1 dark:bg-gray-700"
                        aria-label="Filter operator"
                      >
                        <option value="equals">equals</option>
                        <option value="not_equals">not equals</option>
                        <option value="greater_than">greater than</option>
                        <option value="less_than">less than</option>
                        <option value="contains">contains</option>
                        <option value="between">between</option>
                      </select>
                      
                      <input
                        type="text"
                        value={filter.value}
                        onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                        className="text-sm flex-1 bg-white border rounded-md px-2 py-1 dark:bg-gray-700"
                        placeholder="Value"
                        aria-label="Filter value"
                      />
                      
                      <button
                        onClick={() => removeFilter(filter.id)}
                        className="p-1 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                        aria-label="Remove filter"
                      >
                        <AccessibleIcon label="Remove filter">
                          <ChevronDown className="h-4 w-4 transform rotate-45" />
                        </AccessibleIcon>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {showFieldSelector && (
            <div id="field-selector-panel" className="mt-4 border-t pt-4">
              <h3 className="text-sm font-medium mb-2">Report Columns</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {selectedColumns.map(column => (
                  <div key={column.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`col-${column.id}`}
                      checked={column.visible}
                      onChange={() => toggleColumnVisibility(column.id)}
                      className="mr-2"
                      aria-label={`Show ${column.label} column`}
                    />
                    <label htmlFor={`col-${column.id}`} className="text-sm">
                      {column.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Visualization:</span>
            <div className="flex border rounded-md overflow-hidden">
              <button
                onClick={() => setVisualizationType('table')}
                className={`px-3 py-1 text-xs ${
                  visualizationType === 'table' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                }`}
                aria-pressed={visualizationType === 'table'}
                aria-label="Table view"
              >
                <AccessibleIcon label="Table view">
                  <FileText className="h-3 w-3" />
                </AccessibleIcon>
              </button>
              <button
                onClick={() => setVisualizationType('bar')}
                className={`px-3 py-1 text-xs ${
                  visualizationType === 'bar' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                }`}
                aria-pressed={visualizationType === 'bar'}
                aria-label="Bar chart view"
              >
                Bar
              </button>
              <button
                onClick={() => setVisualizationType('line')}
                className={`px-3 py-1 text-xs ${
                  visualizationType === 'line' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                }`}
                aria-pressed={visualizationType === 'line'}
                aria-label="Line chart view"
              >
                Line
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSaveReport && onSaveReport()}
              className="flex items-center px-3 py-1.5 text-sm rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              aria-label="Save report"
            >
              Save
            </button>
            
            <div className="relative group">
              <button
                className="flex items-center px-3 py-1.5 text-sm rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                aria-label="Export options"
                aria-haspopup="true"
              >
                <Download className="h-4 w-4 mr-1.5" />
                Export
                <ChevronDown className="h-4 w-4 ml-1.5" />
              </button>
              
              <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-800 shadow-md rounded-md border border-gray-200 dark:border-gray-700 z-10 hidden group-hover:block">
                <ul className="py-1">
                  <li>
                    <button
                      onClick={() => onExport && onExport('csv')}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                      aria-label="Export as CSV"
                    >
                      CSV
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => onExport && onExport('excel')}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                      aria-label="Export as Excel"
                    >
                      Excel
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => onExport && onExport('pdf')}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                      aria-label="Export as PDF"
                    >
                      PDF
                    </button>
                  </li>
                </ul>
              </div>
            </div>
            
            <button
              onClick={() => onScheduleReport && onScheduleReport()}
              className="flex items-center px-3 py-1.5 text-sm rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              aria-label="Schedule report"
            >
              <Share2 className="h-4 w-4 mr-1.5" />
              Schedule
            </button>
          </div>
        </div>
      </Card>
      
      {/* Report Results */}
      {data.length > 0 ? (
        visualizationType === 'table' ? (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 dark:bg-gray-800/50">
                    {selectedColumns
                      .filter(col => col.visible)
                      .map(column => (
                        <th key={column.id} className="px-4 py-3 text-left">{column.label}</th>
                      ))
                    }
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-b last:border-0">
                      {selectedColumns
                        .filter(col => col.visible)
                        .map(column => (
                          <td key={column.id} className="px-4 py-3">
                            {row[column.field]}
                          </td>
                        ))
                      }
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <DataVisualization
            title="Report Visualization"
            data={data}
            type={visualizationType}
            nameKey={selectedColumns[0]?.field || 'name'}
            dataKey={selectedColumns[1]?.field || 'value'}
          />
        )
      ) : (
        <Card className="p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            {isLoading ? 'Loading report data...' : 'Run the report to see results here.'}
          </p>
        </Card>
      )}
    </div>
  );
}
