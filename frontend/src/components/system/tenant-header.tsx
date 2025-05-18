import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import Link from 'next/link';

interface TenantHeaderProps {
  tenant: {
    id: string;
    name: string;
    status: string;
  };
  onActivate?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function TenantHeader({ tenant, onActivate, onEdit, onDelete }: TenantHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <h1 className="text-2xl font-bold">{tenant.name}</h1>
        <StatusBadge status={tenant.status} />
      </div>
      <div className="flex items-center space-x-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onActivate}
        >
          {tenant.status === 'active' ? 'Suspend' : 'Activate'}
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={onEdit}
        >
          Edit
        </Button>
        <Button 
          variant="destructive" 
          size="sm"
          onClick={onDelete}
        >
          Delete
        </Button>
        <Link href="/system/tenants">
          <Button variant="ghost" size="sm">
            Back to Tenants
          </Button>
        </Link>
      </div>
    </div>
  );
}
