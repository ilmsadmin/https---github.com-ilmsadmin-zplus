import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { UiDomain } from '@/types/ui';
import { ColumnDef } from '@tanstack/react-table';

export interface Domain {
  id: string;
  domain: string;
  isDefault: boolean;
  status: string;
  sslEnabled: boolean;
  sslExpiresAt?: string | null;
}

interface DomainTableProps {
  domains: UiDomain[];
  onRowClick?: (domain: UiDomain) => void;
  className?: string;
}

export function DomainTable({ domains, onRowClick, className }: DomainTableProps) {
  // Column definitions for domains table
  const domainColumns: ColumnDef<UiDomain>[] = [
    {
      accessorKey: 'domain',
      header: 'Domain',
    },
    {
      accessorKey: 'isDefault',
      header: 'Default',
      cell: ({ row }) => (
        <div>{row.original.isDefault ? 'Yes' : 'No'}</div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        return <StatusBadge status={row.getValue('status') as string} />;
      },
    },
    {
      accessorKey: 'sslEnabled',
      header: 'SSL',
      cell: ({ row }) => (
        <div>{row.original.sslEnabled ? 'Enabled' : 'Disabled'}</div>
      ),
    },
    {
      accessorKey: 'sslExpiresAt',
      header: 'SSL Expires',
      cell: ({ row }) => (
        <div>{row.original.sslExpiresAt || 'N/A'}</div>
      ),
    },
  ];

  return (
    <div className={className}>
      <DataTable 
        columns={domainColumns} 
        data={domains} 
        onRowClick={onRowClick}
      />
    </div>
  );
}
