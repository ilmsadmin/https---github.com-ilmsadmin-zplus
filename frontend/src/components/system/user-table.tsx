import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { UiUser } from '@/types/ui';
import { ColumnDef } from '@tanstack/react-table';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  lastLogin: string;
}

interface UserTableProps {
  users: UiUser[];
  onRowClick?: (user: UiUser) => void;
  className?: string;
}

export function UserTable({ users, onRowClick, className }: UserTableProps) {
  // Column definitions for users table
  const userColumns: ColumnDef<UiUser>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'role',
      header: 'Role',
    },
    {
      accessorKey: 'lastLogin',
      header: 'Last Login',
    },
  ];

  return (
    <div className={className}>
      <DataTable 
        columns={userColumns} 
        data={users} 
        onRowClick={onRowClick}
      />
    </div>
  );
}
