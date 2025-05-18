import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class values into a single string using clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extracts tenant name from hostname or returns null if not found
 */
export function getTenantFromHostname(hostname: string): string | null {
  // System domain (no tenant)
  if (hostname === "admin.example.com" || hostname === "system.example.com") {
    return null;
  }

  // Local development
  if (hostname === "localhost" || hostname.startsWith("192.168.") || hostname.startsWith("127.0.0.1")) {
    // For local development, you can specify a tenant in localStorage or use default
    if (typeof window !== "undefined") {
      return localStorage.getItem("devTenant") || "development";
    }
    return "development";
  }

  // Extract tenant from subdomain (tenant.example.com)
  const parts = hostname.split(".");
  if (parts.length >= 3) {
    return parts[0];
  }

  return null;
}

/**
 * Formats date to locale string
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString(undefined, { 
    year: "numeric", 
    month: "long", 
    day: "numeric",
    ...options 
  });
}

/**
 * Safely access nested object properties
 */
export function getNestedValue<T>(obj: any, path: string, defaultValue: T): T {
  const travel = (regexp: RegExp, obj: any): any => {
    const matchedKey = Object.keys(obj).find(k => regexp.test(k));
    return matchedKey ? obj[matchedKey] : undefined;
  };

  const result = path.split(".").reduce((result, pathPart) => {
    return (result !== null && result !== undefined) 
      ? (result[pathPart] !== undefined)
        ? result[pathPart]
        : travel(new RegExp(`^${pathPart}$`, "i"), result)
      : undefined;
  }, obj);

  return result === undefined ? defaultValue : result;
}

/**
 * Formats currency value
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Generates initials from a name
 */
export function getInitials(name: string): string {
  const parts = name.split(' ');
  
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Check if a user has a specific permission
 */
export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  if (!userPermissions || userPermissions.length === 0) {
    return false;
  }
  
  // Admin has all permissions
  if (userPermissions.includes('*') || userPermissions.includes('admin')) {
    return true;
  }
  
  return userPermissions.includes(requiredPermission);
}

/**
 * Truncates a string to a specified length and adds ellipsis
 */
export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.substring(0, maxLength)}...`;
}
