'use client';

import React from 'react';
import { DataVisualization } from '@/components/modules/analytics/data-visualization';
import { CustomDashboard } from '@/components/modules/analytics/custom-dashboard';
import { ReportBuilder } from '@/components/modules/analytics/report-builder';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { AccessibilityToggle } from '@/components/ui/accessibility-toggle';

// Sample data for visualizations
const monthlySalesData = [
  { name: 'Jan', value: 45000 },
  { name: 'Feb', value: 52000 },
  { name: 'Mar', value: 48000 },
  { name: 'Apr', value: 61000 },
  { name: 'May', value: 55000 },
  { name: 'Jun', value: 67000 },
  { name: 'Jul', value: 72000 },
  { name: 'Aug', value: 79000 },
  { name: 'Sep', value: 85000 },
  { name: 'Oct', value: 91000 },
  { name: 'Nov', value: 101000 },
  { name: 'Dec', value: 120000 },
];

const productPerformanceData = [
  { name: 'Product A', sales: 4200, revenue: 85000, profit: 25000 },
  { name: 'Product B', sales: 3800, revenue: 95000, profit: 35000 },
  { name: 'Product C', sales: 5100, revenue: 72000, profit: 22000 },
  { name: 'Product D', sales: 2700, revenue: 63000, profit: 18000 },
  { name: 'Product E', sales: 3300, revenue: 71000, profit: 20000 },
];

const userDemographicsData = [
  { name: 'North America', value: 45 },
  { name: 'Europe', value: 30 },
  { name: 'Asia', value: 15 },
  { name: 'South America', value: 7 },
  { name: 'Africa', value: 3 },
];

const dashboardItems = [
  {
    id: 'widget1',
    title: 'Monthly Sales Trend',
    type: 'line',
    size: 'medium',
    data: monthlySalesData,
    config: {
      xAxisLabel: 'Month',
      yAxisLabel: 'Sales',
      units: 'USD',
    }
  },
  {
    id: 'widget2',
    title: 'Product Performance',
    type: 'bar',
    size: 'medium',
    data: productPerformanceData,
    config: {
      series: [
        { dataKey: 'sales', name: 'Units Sold' },
        { dataKey: 'revenue', name: 'Revenue' },
        { dataKey: 'profit', name: 'Profit' },
      ],
      nameKey: 'name',
    }
  },
  {
    id: 'widget3',
    title: 'User Demographics',
    type: 'pie',
    size: 'small',
    data: userDemographicsData,
  },
  {
    id: 'widget4',
    title: 'Key Metrics',
    type: 'stats',
    size: 'small',
    data: [
      { label: 'Total Revenue', value: '$876,500' },
      { label: 'Active Users', value: '12,846' },
      { label: 'Conversion Rate', value: '8.7%' },
      { label: 'Avg. Order Value', value: '$142' },
    ]
  },
  {
    id: 'widget5',
    title: 'Top Customers',
    type: 'table',
    size: 'large',
    data: [
      { customer: 'Acme Corp', orders: 145, revenue: '$285,000', growth: '+12%' },
      { customer: 'TechGlobal Inc', orders: 127, revenue: '$240,000', growth: '+8%' },
      { customer: 'Zeta Industries', orders: 112, revenue: '$192,000', growth: '+5%' },
      { customer: 'Finance Partners Ltd', orders: 98, revenue: '$165,000', growth: '+15%' },
      { customer: 'Health Systems Inc', orders: 87, revenue: '$125,000', growth: '-2%' },
    ],
    config: {
      columns: [
        { key: 'customer', label: 'Customer' },
        { key: 'orders', label: 'Orders' },
        { key: 'revenue', label: 'Revenue' },
        { key: 'growth', label: 'YoY Growth' },
      ]
    }
  },
];

// Sample available fields for report builder
const availableFields = [
  { id: 'f1', field: 'date', label: 'Date', type: 'date' },
  { id: 'f2', field: 'product', label: 'Product', type: 'text' },
  { id: 'f3', field: 'region', label: 'Region', type: 'text' },
  { id: 'f4', field: 'salesRep', label: 'Sales Rep', type: 'text' },
  { id: 'f5', field: 'units', label: 'Units Sold', type: 'number' },
  { id: 'f6', field: 'revenue', label: 'Revenue', type: 'number' },
  { id: 'f7', field: 'profit', label: 'Profit', type: 'number' },
  { id: 'f8', field: 'customer', label: 'Customer', type: 'text' },
  { id: 'f9', field: 'channel', label: 'Sales Channel', type: 'text' },
  { id: 'f10', field: 'campaign', label: 'Marketing Campaign', type: 'text' },
];

// Sample report data
const reportData = [
  { date: '2025-05-01', product: 'Product A', region: 'North America', salesRep: 'John Smith', units: 120, revenue: 24000, profit: 7200, customer: 'Acme Corp', channel: 'Direct', campaign: 'Spring Promotion' },
  { date: '2025-05-02', product: 'Product B', region: 'Europe', salesRep: 'Sarah Johnson', units: 85, revenue: 21250, profit: 8500, customer: 'TechGlobal Inc', channel: 'Partner', campaign: 'Spring Promotion' },
  { date: '2025-05-03', product: 'Product C', region: 'Asia', salesRep: 'Michael Chen', units: 95, revenue: 13300, profit: 3990, customer: 'Zeta Industries', channel: 'Online', campaign: 'Product Launch' },
  { date: '2025-05-04', product: 'Product A', region: 'North America', salesRep: 'Emily Wong', units: 105, revenue: 21000, profit: 6300, customer: 'Health Systems Inc', channel: 'Direct', campaign: 'Spring Promotion' },
  { date: '2025-05-05', product: 'Product D', region: 'Europe', salesRep: 'John Smith', units: 70, revenue: 16100, profit: 4830, customer: 'Finance Partners Ltd', channel: 'Partner', campaign: 'Industry Event' },
  { date: '2025-05-06', product: 'Product B', region: 'North America', salesRep: 'Sarah Johnson', units: 110, revenue: 27500, profit: 11000, customer: 'Retail Solutions Co', channel: 'Online', campaign: 'Spring Promotion' },
  { date: '2025-05-07', product: 'Product E', region: 'Asia', salesRep: 'Michael Chen', units: 75, revenue: 16125, profit: 4838, customer: 'Manufacturing Ltd', channel: 'Direct', campaign: 'Product Launch' },
  { date: '2025-05-08', product: 'Product C', region: 'Europe', salesRep: 'Emily Wong', units: 90, revenue: 12600, profit: 3780, customer: 'Global Enterprises', channel: 'Partner', campaign: 'Industry Event' },
];

export default function AnalyticsPage() {
  const handleSaveLayout = (items: any[]) => {
    console.log('Dashboard layout saved:', items);
    // In a real app, this would update the backend
  };
  
  const handleAddWidget = () => {
    console.log('Add widget clicked');
    // In a real app, this would open a widget selection modal
  };
  
  const handleRemoveWidget = (id: string) => {
    console.log('Remove widget:', id);
    // In a real app, this would update the dashboard items
  };
  
  const handleEditWidget = (id: string) => {
    console.log('Edit widget:', id);
    // In a real app, this would open a widget edit modal
  };
  
  const handleRunReport = (filters: any[], columns: any[], timeRange: any) => {
    console.log('Run report with:', { filters, columns, timeRange });
    // In a real app, this would fetch the filtered data from the backend
  };
  
  const handleExportReport = (format: 'csv' | 'excel' | 'pdf') => {
    console.log('Export report as:', format);
    // In a real app, this would generate and download the file
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Visualize data and generate reports
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <ThemeSwitcher />
          <AccessibilityToggle />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col items-center justify-center text-center">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">$876,500</div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">Total Revenue</div>
          <div className="text-xs text-green-600 dark:text-green-400 mt-1">↑ 12% vs last month</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col items-center justify-center text-center">
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">12,846</div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">Active Users</div>
          <div className="text-xs text-green-600 dark:text-green-400 mt-1">↑ 8% vs last month</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col items-center justify-center text-center">
          <div className="text-3xl font-bold text-teal-600 dark:text-teal-400">8.7%</div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">Conversion Rate</div>
          <div className="text-xs text-red-600 dark:text-red-400 mt-1">↓ 2% vs last month</div>
        </div>
      </div>
      
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-6">Key Business Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DataVisualization
            title="Monthly Sales Trend"
            description="Revenue growth over the past 12 months"
            data={monthlySalesData}
            type="line"
            xAxisLabel="Month"
            yAxisLabel="Revenue"
            units="USD"
          />
          
          <DataVisualization
            title="Product Performance"
            description="Comparison of key metrics across product lines"
            data={productPerformanceData}
            type="bar"
            series={[
              { dataKey: 'sales', name: 'Units Sold' },
              { dataKey: 'revenue', name: 'Revenue' },
              { dataKey: 'profit', name: 'Profit' },
            ]}
            nameKey="name"
          />
        </div>
      </section>
      
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-6">Customizable Dashboard</h2>
        <CustomDashboard 
          items={dashboardItems}
          onSaveLayout={handleSaveLayout}
          onAddWidget={handleAddWidget}
          onRemoveWidget={handleRemoveWidget}
          onEditWidget={handleEditWidget}
        />
      </section>
      
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-6">Report Builder</h2>
        <ReportBuilder 
          reportName="Sales Performance Report"
          description="Analyze sales performance across products, regions, and time periods"
          availableFields={availableFields}
          data={reportData}
          onRunReport={handleRunReport}
          onExport={handleExportReport}
        />
      </section>
    </div>
  );
}
