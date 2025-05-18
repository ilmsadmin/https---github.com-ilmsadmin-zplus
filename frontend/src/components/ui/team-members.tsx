import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from '@/types/tenant';

interface TeamMember extends User {
  teamRole: 'OWNER' | 'ADMIN' | 'MEMBER';
}

interface TeamMembersProps {
  members: TeamMember[];
  onAddMember?: (email: string, role: string) => void;
  onRemoveMember?: (userId: string) => void;
  onChangeMemberRole?: (userId: string, role: string) => void;
}

export default function TeamMembers({
  members,
  onAddMember,
  onRemoveMember,
  onChangeMemberRole,
}: TeamMembersProps) {
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('MEMBER');
  
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (onAddMember && newMemberEmail) {
      onAddMember(newMemberEmail, newMemberRole);
      setNewMemberEmail('');
    }
  };
  
  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'ADMIN':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'MEMBER':
      default:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Members</CardTitle>
        <CardDescription>Manage members in this team</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <form onSubmit={handleAddMember} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Enter email address"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                type="email"
                required
              />
            </div>
            <div className="flex space-x-2">
              <select
                className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 text-sm"
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value)}
              >
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
                <option value="OWNER">Owner</option>
              </select>
              <Button type="submit">Add</Button>
            </div>
          </form>
          
          <div className="border-t pt-4">
            <div className="space-y-2">
              {members.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No members in this team yet
                </div>
              ) : (
                members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <div className="flex items-center">
                      {member.avatar ? (
                        <img
                          src={member.avatar}
                          alt={`${member.firstName} ${member.lastName}`}
                          className="h-10 w-10 rounded-full mr-3"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                          <span className="text-gray-600 font-medium">
                            {member.firstName.charAt(0)}
                            {member.lastName.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="font-medium">
                          {member.firstName} {member.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{member.email}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeStyle(
                          member.teamRole
                        )}`}
                      >
                        {member.teamRole}
                      </span>
                      
                      {onChangeMemberRole && member.teamRole !== 'OWNER' && (
                        <select
                          className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-1 px-2 text-sm"
                          value={member.teamRole}
                          onChange={(e) =>
                            onChangeMemberRole(member.id, e.target.value)
                          }
                        >
                          <option value="MEMBER">Member</option>
                          <option value="ADMIN">Admin</option>
                          <option value="OWNER">Owner</option>
                        </select>
                      )}
                      
                      {onRemoveMember && member.teamRole !== 'OWNER' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => onRemoveMember(member.id)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
