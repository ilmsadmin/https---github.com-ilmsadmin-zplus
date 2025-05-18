'use client';

import { useTheme } from '@/components/ui/theme-context';
import { Eye } from 'lucide-react';
import { AccessibleIcon } from './accessibility';

interface AccessibilityToggleProps {
  className?: string;
}

export function AccessibilityToggle({ className = '' }: AccessibilityToggleProps) {
  const { isHighContrast, toggleHighContrast } = useTheme();
  
  return (
    <button
      onClick={toggleHighContrast}
      className={`p-2 rounded-md ${isHighContrast ? 'bg-yellow-300 text-black' : 'bg-gray-200 dark:bg-gray-700'} ${className}`}
      aria-label={isHighContrast ? 'Disable high contrast mode' : 'Enable high contrast mode'}
    >
      <AccessibleIcon label={isHighContrast ? 'Disable high contrast mode' : 'Enable high contrast mode'}>
        <Eye className="h-5 w-5" />
      </AccessibleIcon>
      <span className="sr-only md:not-sr-only md:ml-2 text-sm">
        {isHighContrast ? 'Standard contrast' : 'High contrast'}
      </span>
    </button>
  );
}
