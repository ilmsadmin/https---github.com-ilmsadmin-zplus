'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/components/ui/theme-context';
import { Moon, Sun, Monitor } from 'lucide-react';
import { AccessibleIcon } from './accessibility';

interface ThemeSwitcherProps {
  className?: string;
}

export function ThemeSwitcher({ className = '' }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <button
        onClick={() => setTheme('light')}
        className={`p-2 rounded-md ${theme === 'light' ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
        aria-label="Light mode"
      >
        <AccessibleIcon label="Light mode">
          <Sun className="h-5 w-5" />
        </AccessibleIcon>
      </button>
      
      <button
        onClick={() => setTheme('dark')}
        className={`p-2 rounded-md ${theme === 'dark' ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
        aria-label="Dark mode"
      >
        <AccessibleIcon label="Dark mode">
          <Moon className="h-5 w-5" />
        </AccessibleIcon>
      </button>
      
      <button
        onClick={() => setTheme('system')}
        className={`p-2 rounded-md ${theme === 'system' ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
        aria-label="System theme"
      >
        <AccessibleIcon label="System theme">
          <Monitor className="h-5 w-5" />
        </AccessibleIcon>
      </button>
    </div>
  );
}
