import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { cn } from '@/lib/utils';

interface SidebarNavProps {
  items: {
    title: string;
    href: string;
    icon?: ReactNode;
  }[];
}

const SidebarNav = ({ items }: SidebarNavProps) => {
  const pathname = usePathname();
  
  return (
    <nav className="flex flex-col space-y-1">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'group flex items-center rounded-md px-3 py-2 text-sm font-medium',
            pathname === item.href
              ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
          )}
        >
          {item.icon && <span className="mr-3 h-4 w-4">{item.icon}</span>}
          <span>{item.title}</span>
        </Link>
      ))}
    </nav>
  );
};

interface HeaderProps {
  tenantName?: string;
}

const Header = ({ tenantName }: HeaderProps) => {
  const { user, logout } = useAuth();
  
  return (
    <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <Link href="/dashboard" className="flex items-center">
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              {tenantName ? `${tenantName} Portal` : 'System Admin'}
            </span>
          </Link>
        </div>
        
        <div className="flex items-center">
          <div className="mr-4 text-sm font-medium text-gray-600 dark:text-gray-300">
            {user?.firstName} {user?.lastName}
          </div>
          
          <button
            onClick={() => logout()}
            className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
};

interface DashboardLayoutProps {
  children: ReactNode;
  tenantName?: string;
  navItems: {
    title: string;
    href: string;
    icon?: ReactNode;
  }[];
}

export function DashboardLayout({ children, tenantName, navItems }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header tenantName={tenantName} />
      
      <div className="flex flex-1">
        <aside className="w-64 border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="flex h-full flex-col px-4 py-6">
            <SidebarNav items={navItems} />
          </div>
        </aside>
        
        <main className="flex-1 bg-gray-50 p-6 dark:bg-gray-950">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
