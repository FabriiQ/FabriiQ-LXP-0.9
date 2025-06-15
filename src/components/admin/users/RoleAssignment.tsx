import { useState } from "react";
import { Card } from "@/components/ui/data-display/card";
import { Button } from "@/components/ui/core/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/forms/select";
import { api } from "@/trpc/react";
import { toast } from "@/components/ui/feedback/toast";
import { LoadingSpinner } from "@/components/ui/loading";

// Define the types locally
interface Role {
  id: string;
  name: string;
  permissions: Permission[];
}

interface Permission {
  id: string;
  name: string;
  code: string;
}

interface Campus {
  id: string;
  name: string;
  code: string;
}

type RoleAssignmentProps = {
  userId: string;
};

type UserRole = {
  id: string;
  role: Role;
  campus: Campus;
};

export const RoleAssignment = ({ userId }: RoleAssignmentProps) => {
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedCampus, setSelectedCampus] = useState("");

  // Fetch user data
  const { data: userData, isLoading: isLoadingUser } = api.user.getById.useQuery(userId, {
    enabled: !!userId,
    refetchOnWindowFocus: false,
  });

  // Fetch available campuses
  const { data: campusesData, isLoading: isLoadingCampuses } = api.campus.getAllCampuses.useQuery(undefined, {
    enabled: true,
    refetchOnWindowFocus: false,
  });

  // Mock data for roles (in a real app, these would come from the API)
  const roles: Role[] = [
    {
      id: "SYSTEM_ADMIN",
      name: "System Administrator",
      permissions: [
        { id: "perm-1", name: "Create User", code: "USER_CREATE" },
        { id: "perm-2", name: "Edit User", code: "USER_EDIT" },
        { id: "perm-3", name: "Delete User", code: "USER_DELETE" }
      ]
    },
    {
      id: "CAMPUS_ADMIN",
      name: "Campus Administrator",
      permissions: [
        { id: "perm-4", name: "View Classes", code: "CLASS_VIEW" },
        { id: "perm-5", name: "Grade Students", code: "STUDENT_GRADE" }
      ]
    },
    {
      id: "CAMPUS_PRINCIPAL",
      name: "Campus Principal",
      permissions: [
        { id: "perm-9", name: "View Analytics", code: "ANALYTICS_VIEW" },
        { id: "perm-10", name: "Manage Teachers", code: "TEACHER_MANAGE" },
        { id: "perm-11", name: "Manage Students", code: "STUDENT_MANAGE" }
      ]
    },
    {
      id: "CAMPUS_TEACHER",
      name: "Teacher",
      permissions: [
        { id: "perm-6", name: "View Classes", code: "CLASS_VIEW" },
        { id: "perm-7", name: "Grade Students", code: "STUDENT_GRADE" }
      ]
    },
    {
      id: "CAMPUS_STUDENT",
      name: "Student",
      permissions: [
        { id: "perm-8", name: "View Classes", code: "CLASS_VIEW" }
      ]
    }
  ];

  // Get user's active campus roles
  const userRoles: UserRole[] = userData?.activeCampuses?.map((access: any) => {
    const campus = campusesData?.find((c: any) => c.id === access.campusId);
    const role = roles.find(r => r.id === access.roleType) || {
      id: access.roleType,
      name: access.roleType,
      permissions: []
    };

    return {
      id: access.id,
      role,
      campus: campus || { id: access.campusId, name: 'Unknown Campus', code: '' }
    };
  }) || [];

  // Mock mutation (in a real app, this would be a TRPC mutation)
  const assignRoleMutation = {
    mutate: (data: { userId: string; roleId: string; campusId: string }) => {
      console.log("Assigning role:", data);
      toast({
        title: "Role Assignment",
        description: "This feature is not fully implemented yet."
      });
    }
  };

  if (isLoadingUser || isLoadingCampuses) {
    return <LoadingSpinner />;
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Select
            value={selectedRole}
            onValueChange={setSelectedRole}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role: Role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedCampus}
            onValueChange={setSelectedCampus}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select campus" />
            </SelectTrigger>
            <SelectContent>
              {campusesData?.map((campus: Campus) => (
                <SelectItem key={campus.id} value={campus.id}>
                  {campus.name}
                </SelectItem>
              )) || []}
            </SelectContent>
          </Select>
        </div>

        {selectedRole && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Permissions</h4>
            <div className="space-y-2">
              {roles.find((r: Role) => r.id === selectedRole)?.permissions.map((permission: Permission) => (
                <div key={permission.id} className="text-sm">
                  {permission.name}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            onClick={() => assignRoleMutation.mutate({
              userId,
              roleId: selectedRole,
              campusId: selectedCampus
            })}
          >
            Assign Role
          </Button>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Current Roles</h3>
          {userRoles.length > 0 ? (
            <div className="space-y-2">
              {userRoles.map((userRole: UserRole) => (
                <div key={userRole.id} className="flex justify-between items-center p-4 border rounded">
                  <div>
                    <p className="font-medium">{userRole.role.name}</p>
                    <p className="text-sm text-gray-500">{userRole.campus.name}</p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      toast({
                        title: "Role Removal",
                        description: "This feature is not fully implemented yet."
                      });
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-6 border rounded bg-muted/20">
              <p className="text-muted-foreground">No roles assigned to this user yet.</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};