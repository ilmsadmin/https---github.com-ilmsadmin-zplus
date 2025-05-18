import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  statusMap?: Record<string, { bg: string; text: string }>;
  className?: string;
}

export function StatusBadge({ status, statusMap, className }: StatusBadgeProps) {
  // Default status styling map
  const defaultStatusMap: Record<string, { bg: string; text: string }> = {
    active: {
      bg: 'bg-green-100 dark:bg-green-900',
      text: 'text-green-800 dark:text-green-100'
    },
    suspended: {
      bg: 'bg-yellow-100 dark:bg-yellow-900',
      text: 'text-yellow-800 dark:text-yellow-100'
    },
    deleted: {
      bg: 'bg-red-100 dark:bg-red-900',
      text: 'text-red-800 dark:text-red-100'
    },
    pending: {
      bg: 'bg-yellow-100 dark:bg-yellow-900',
      text: 'text-yellow-800 dark:text-yellow-100'
    },
    disabled: {
      bg: 'bg-gray-100 dark:bg-gray-800',
      text: 'text-gray-800 dark:text-gray-300'
    },
    inactive: {
      bg: 'bg-gray-100 dark:bg-gray-700',
      text: 'text-gray-800 dark:text-gray-300'
    }
  };

  const mergedStatusMap = { ...defaultStatusMap, ...statusMap };
  const statusKey = status.toLowerCase();
  const statusStyle = mergedStatusMap[statusKey] || mergedStatusMap.inactive;

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        statusStyle.bg,
        statusStyle.text,
        className
      )}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </div>
  );
}
