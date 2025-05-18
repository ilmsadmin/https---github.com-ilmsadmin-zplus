'use client';

import React from 'react';
import { VisuallyHidden } from './visually-hidden';

interface AccessibleIconProps {
  children: React.ReactNode;
  label: string;
}

export function AccessibleIcon({ children, label }: AccessibleIconProps) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      {children}
      <VisuallyHidden>{label}</VisuallyHidden>
    </span>
  );
}

interface AccessibleLabelProps {
  id: string;
  label: string;
}

export function AccessibleLabel({ id, label }: AccessibleLabelProps) {
  return (
    <label htmlFor={id} className="block text-sm font-medium mb-1">
      {label}
    </label>
  );
}

interface KeyboardFocusWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function KeyboardFocusWrapper({ children, className = '' }: KeyboardFocusWrapperProps) {
  return (
    <div 
      className={`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary ${className}`}
      tabIndex={0}
    >
      {children}
    </div>
  );
}

export function SkipToContent() {
  return (
    <a 
      href="#main-content" 
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 px-4 py-2 bg-primary text-white z-50"
    >
      Skip to content
    </a>
  );
}
