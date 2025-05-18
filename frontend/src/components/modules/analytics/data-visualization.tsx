'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useTheme } from '@/components/ui/theme-context';

type ChartType = 'bar' | 'line' | 'pie';

interface DataVisualizationProps {
  title: string;
  description?: string;
  data: any[];
  type?: ChartType;
  width?: number | string;
  height?: number | string;
  dataKey?: string;
  nameKey?: string;
  colors?: string[];
  xAxisLabel?: string;
  yAxisLabel?: string;
  units?: string;
  categoryKey?: string;
  series?: {
    dataKey: string;
    name: string;
    color?: string;
  }[];
}

export function DataVisualization({
  title,
  description,
  data,
  type = 'bar',
  width = '100%',
  height = 300,
  dataKey = 'value',
  nameKey = 'name',
  colors = ['#0284c7', '#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#ec4899'],
  xAxisLabel,
  yAxisLabel,
  units,
  categoryKey,
  series = [],
}: DataVisualizationProps) {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  
  // Default text color based on theme
  const textColor = isDarkMode ? '#e5e7eb' : '#374151';
  const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  
  // Custom tooltip formatter
  const formatTooltipValue = (value: number) => {
    return units ? `${value} ${units}` : value;
  };
  
  // Create unique series if not provided
  const effectiveSeries = series.length > 0 
    ? series 
    : (categoryKey 
        ? Array.from(new Set(data.map(item => item[categoryKey]))).map((category, index) => ({
            dataKey: category as string,
            name: category as string,
            color: colors[index % colors.length],
          }))
        : [{ dataKey, name: dataKey, color: colors[0] }]
      );
  
  return (
    <Card className="p-4">
      <div className="mb-4">
        <h3 className="text-lg font-medium">{title}</h3>
        {description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>}
      </div>
      
      <div className="h-[300px]" role="img" aria-label={`${title} chart`}>
        <ResponsiveContainer width={width} height={height}>
          {type === 'bar' && (
            <BarChart
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis 
                dataKey={nameKey} 
                tick={{ fill: textColor }} 
                label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -5, fill: textColor } : undefined} 
              />
              <YAxis 
                tick={{ fill: textColor }} 
                label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft', fill: textColor } : undefined}
              />
              <Tooltip 
                formatter={(value: number) => formatTooltipValue(value)}
                contentStyle={{ backgroundColor: isDarkMode ? '#374151' : '#fff', borderColor: gridColor }}
                labelStyle={{ color: isDarkMode ? '#e5e7eb' : '#374151' }}
              />
              <Legend wrapperStyle={{ color: textColor }} />
              {effectiveSeries.map((s, index) => (
                <Bar 
                  key={s.dataKey} 
                  dataKey={s.dataKey} 
                  name={s.name} 
                  fill={s.color || colors[index % colors.length]} 
                />
              ))}
            </BarChart>
          )}
          
          {type === 'line' && (
            <LineChart
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis 
                dataKey={nameKey} 
                tick={{ fill: textColor }} 
                label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -5, fill: textColor } : undefined} 
              />
              <YAxis 
                tick={{ fill: textColor }} 
                label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft', fill: textColor } : undefined}
              />
              <Tooltip 
                formatter={(value: number) => formatTooltipValue(value)}
                contentStyle={{ backgroundColor: isDarkMode ? '#374151' : '#fff', borderColor: gridColor }}
                labelStyle={{ color: isDarkMode ? '#e5e7eb' : '#374151' }}
              />
              <Legend wrapperStyle={{ color: textColor }} />
              {effectiveSeries.map((s, index) => (
                <Line 
                  key={s.dataKey} 
                  type="monotone" 
                  dataKey={s.dataKey} 
                  name={s.name} 
                  stroke={s.color || colors[index % colors.length]} 
                  activeDot={{ r: 8 }} 
                />
              ))}
            </LineChart>
          )}
          
          {type === 'pie' && (
            <PieChart>
              <Pie
                data={data}
                nameKey={nameKey}
                dataKey={dataKey}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => formatTooltipValue(value)}
                contentStyle={{ backgroundColor: isDarkMode ? '#374151' : '#fff', borderColor: gridColor }}
                labelStyle={{ color: isDarkMode ? '#e5e7eb' : '#374151' }}
              />
              <Legend wrapperStyle={{ color: textColor }} />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
