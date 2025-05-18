import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Metadata } from 'next';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';

export const metadata: Metadata = {
  title: 'Create Team | Tenant Admin',
  description: 'Create a new team in your organization',
};

// Define navigation items for tenant admin
const navItems = [
  { title: 'Dashboard', href: '/tenant/dashboard' },
  { title: 'Users', href: '/tenant/users' },
  { title: 'Teams', href: '/tenant/teams' },
  { title: 'Modules', href: '/tenant/modules' },
  { title: 'Settings', href: '/tenant/settings' },
  { title: 'Billing', href: '/tenant/billing' },
];

export default function CreateTeamPage() {
  // In a real app, this would be fetched from the API
  const tenantName = "Example Company";
  
  return (
    <DashboardLayout navItems={navItems} tenantName={tenantName}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Create Team</h1>
        <Link href="/tenant/teams">
          <Button variant="outline">Cancel</Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Team Information</CardTitle>
          <CardDescription>Enter the details for the new team</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Team Name
                </label>
                <Input
                  id="name"
                  placeholder="Enter team name"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <Textarea
                  id="description"
                  placeholder="Enter team description"
                  rows={3}
                />
              </div>
              
              <div className="pt-4">
                <h3 className="text-base font-semibold mb-2">Initial Team Members</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  You can add more members after creating the team.
                </p>
                
                <div className="border rounded-md p-4 space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="col-span-2">
                      <label htmlFor="member" className="text-sm font-medium">
                        Member
                      </label>
                      <select 
                        id="member"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Select a user</option>
                        <option value="1">John Smith (john.smith@example.com)</option>
                        <option value="2">Jane Doe (jane.doe@example.com)</option>
                        <option value="3">Alex Johnson (alex.johnson@example.com)</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="role" className="text-sm font-medium">
                        Role
                      </label>
                      <select 
                        id="role"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="owner">Owner</option>
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                      </select>
                    </div>
                  </div>
                  
                  <Button type="button" variant="outline" size="sm">
                    Add Another Member
                  </Button>
                </div>
              </div>
              
              <div className="pt-4">
                <h3 className="text-base font-semibold mb-2">Team Permissions</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Configure what modules and features this team can access.
                </p>
                
                <div className="border rounded-md p-4 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        id="crm-module"
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="crm-module" className="ml-2 text-sm font-medium">
                        CRM Module
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="hrm-module"
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="hrm-module" className="ml-2 text-sm font-medium">
                        HRM Module
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="analytics-module"
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="analytics-module" className="ml-2 text-sm font-medium">
                        Analytics Module
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 pt-4">
              <Link href="/tenant/teams">
                <Button variant="outline">Cancel</Button>
              </Link>
              <Button type="submit">Create Team</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
