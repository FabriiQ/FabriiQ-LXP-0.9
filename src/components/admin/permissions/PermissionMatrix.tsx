import { useState } from "react";
import { Card } from "@/components/ui";
import { DataTable } from "@/components/ui/data-display/data-table";
import { Checkbox } from "@/components/ui/forms/checkbox";
import { 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem 
} from "@/components/ui/forms/select";
import { SystemStatus } from "@prisma/client";

interface Permission {
  id: string;
  name: string;
  scope: string;
  code: string;
  status: SystemStatus;
}

interface User {
  id: string;
  name: string;
  username: string;
  status: SystemStatus;
}

interface UserPermission {
  permissionId: string;
  userId: string;
}

// Mock data
const mockUsers: User[] = [
  { id: "user-1", name: "John Doe", username: "johndoe", status: "ACTIVE" as SystemStatus },
  { id: "user-2", name: "Jane Smith", username: "janesmith", status: "ACTIVE" as SystemStatus },
  { id: "user-3", name: "Bob Johnson", username: "bjohnson", status: "ACTIVE" as SystemStatus }
];

const mockPermissions: Permission[] = [
  { id: "perm-1", name: "Create User", scope: "SYSTEM", code: "USER_CREATE", status: "ACTIVE" as SystemStatus },
  { id: "perm-2", name: "Edit User", scope: "SYSTEM", code: "USER_EDIT", status: "ACTIVE" as SystemStatus },
  { id: "perm-3", name: "Delete User", scope: "SYSTEM", code: "USER_DELETE", status: "ACTIVE" as SystemStatus },
  { id: "perm-4", name: "View Reports", scope: "CAMPUS", code: "REPORT_VIEW", status: "ACTIVE" as SystemStatus }
];

const mockUserPermissions: Record<string, UserPermission[]> = {
  "user-1": [
    { userId: "user-1", permissionId: "perm-1" },
    { userId: "user-1", permissionId: "perm-2" }
  ],
  "user-2": [
    { userId: "user-2", permissionId: "perm-3" },
    { userId: "user-2", permissionId: "perm-4" }
  ],
  "user-3": [
    { userId: "user-3", permissionId: "perm-1" },
    { userId: "user-3", permissionId: "perm-4" }
  ]
};

export const PermissionMatrix = () => {
  const [selectedUser, setSelectedUser] = useState("");
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  
  // Use mock data instead of API calls
  const users = mockUsers;
  const permissions = mockPermissions;
  
  // Update user permissions when a user is selected
  const handleUserChange = (userId: string) => {
    setSelectedUser(userId);
    setUserPermissions(mockUserPermissions[userId] || []);
  };

  // Map permissions with assigned status
  const permissionsWithAssignedStatus = permissions.map(permission => {
    const isAssigned = userPermissions.some(
      (up: UserPermission) => up.permissionId === permission.id
    );
    return {
      ...permission,
      assigned: !!isAssigned
    };
  });

  // Toggle permission assignment
  const togglePermission = (permissionId: string) => {
    const isCurrentlyAssigned = userPermissions.some(up => up.permissionId === permissionId);
    
    if (isCurrentlyAssigned) {
      // Remove permission
      setUserPermissions(userPermissions.filter(up => up.permissionId !== permissionId));
    } else {
      // Add permission
      setUserPermissions([...userPermissions, { userId: selectedUser, permissionId }]);
    }
  };

  const columns = [
    { header: "Permission", accessorKey: "name" },
    {
      header: "Scope",
      accessorKey: "scope"
    },
    {
      header: "Assigned",
      cell: ({ row }: { row: { original: Permission & { assigned: boolean } } }) => (
        <Checkbox
          checked={row.original.assigned}
          onChange={() => togglePermission(row.original.id)}
          disabled={!selectedUser}
        />
      )
    }
  ];

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Permission Matrix</h3>
          <Select
            value={selectedUser}
            onValueChange={handleUserChange}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select user" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user: User) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name || user.username}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DataTable
          columns={columns}
          data={permissionsWithAssignedStatus}
          isLoading={false}
        />
      </div>
    </Card>
  );
};