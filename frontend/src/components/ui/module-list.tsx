import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { UiModule } from '@/types/ui';

interface ModuleListProps {
  modules: UiModule[];
  onToggleStatus?: (moduleId: string, currentStatus: string) => void;
  className?: string;
}

export function ModuleList({ modules, onToggleStatus, className }: ModuleListProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {modules.map((module) => (
        <div key={module.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-800">
          <div>
            <h3 className="text-lg font-medium">{module.name}</h3>
            {module.description && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                {module.description}
              </p>
            )}
            <div className="mt-1 flex items-center space-x-4">
              <StatusBadge status={module.status} />
              {module.usersCount !== undefined && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {module.usersCount} {module.usersCount === 1 ? 'user' : 'users'}
                </p>
              )}
              {module.lastActivity && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Last activity: {module.lastActivity}
                </p>
              )}
            </div>
          </div>
          {onToggleStatus && (
            <div>
              <Button 
                variant={module.status === 'active' ? 'outline' : 'primary'} 
                size="sm"
                onClick={() => onToggleStatus(module.id, module.status)}
              >
                {module.status === 'active' ? 'Disable' : 'Enable'}
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
