import { UiActivity } from '@/types/ui';

interface ActivityListProps {
  activities: UiActivity[];
  className?: string;
}

export function ActivityList({ activities, className }: ActivityListProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-center justify-between border-b border-gray-200 pb-2 dark:border-gray-800">
          <div>
            <p className="font-medium">{activity.action}</p>
            {activity.user && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                by {activity.user}
              </p>
            )}
            {activity.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {activity.description}
              </p>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{activity.timestamp}</p>
        </div>
      ))}
    </div>
  );
}
