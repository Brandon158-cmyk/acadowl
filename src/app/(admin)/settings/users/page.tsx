'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, UserPlus, Settings2, UserX } from 'lucide-react';
import { Role } from '@/lib/roles/types';

export default function UserManagementPage() {
  const users = useQuery(api.users.queries.getUsersBySchool) || [];
  const deactivateUser = useMutation(api.users.mutations.deactivateUser);
  const updateUserRole = useMutation(api.users.mutations.updateUserRole);

  const handleDeactivate = async (userId: any) => {
    if (
      !confirm(
        'Are you sure you want to deactivate this user? They will no longer be able to log in.',
      )
    )
      return;
    try {
      await deactivateUser({ userId });
      toast.success('User deactivated successfully.');
    } catch (err) {
      toast.error('Failed to deactivate user.');
    }
  };

  const handleRoleChange = async (userId: any, newRole: Role) => {
    try {
      await updateUserRole({ userId, role: newRole as any });
      toast.success('Role updated successfully.');
    } catch (err) {
      toast.error('Failed to update role.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Manage access and roles for staff and administrators."
      >
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="rounded-tl-lg px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email / Phone</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="rounded-tr-lg px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-muted-foreground px-4 py-8 text-center">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((u: any) => (
                    <tr key={u._id} className="hover:bg-muted/30">
                      <td className="px-4 py-4 font-medium">{u.name || 'Unnamed User'}</td>
                      <td className="px-4 py-4">{u.email || u.phone || '-'}</td>
                      <td className="px-4 py-4">
                        <select
                          className="border-input h-8 w-full max-w-[140px] rounded-md border bg-transparent px-2 py-1 text-sm shadow-sm focus:outline-none"
                          value={u.role || ''}
                          onChange={(e) => handleRoleChange(u._id, e.target.value as Role)}
                          disabled={!u.isActive}
                        >
                          <option value="school_admin">School Admin</option>
                          <option value="deputy_head">Deputy Head</option>
                          <option value="bursar">Bursar</option>
                          <option value="teacher">Teacher</option>
                          <option value="class_teacher">Class Teacher</option>
                          <option value="matron">Matron</option>
                          <option value="librarian">Librarian</option>
                          <option value="driver">Driver</option>
                          <option value="guardian">Guardian</option>
                        </select>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                        >
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        {u.isActive && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive h-8 px-2"
                            onClick={() => handleDeactivate(u._id)}
                          >
                            <UserX className="mr-1 h-3 w-3" />
                            Deactivate
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
