import { DataTable } from "@/components/ui/data-display/data-table";
import { Button } from "@/components/ui/core/button";
import { Card } from "@/components/ui/data-display/card";
import { UserFilters } from "./UserFilters";
import { Badge } from "@/components/ui/atoms/badge";
import { toast } from "@/components/ui/feedback/toast";
import { useState, useEffect } from "react";
import { SystemStatus } from "@prisma/client";
import { api } from "@/trpc/react";
import { Loader2 } from "lucide-react";

type UserListProps = {
  onEdit?: (id: string) => void;
  onViewProfile?: (id: string) => void;
};

interface UserFiltersState {
  search: string;
  role: string;
  status: SystemStatus | string;
  campus: string;
  dateRange: { from: null; to: null };
}

// Interface for the raw user data from the API
interface ApiUser {
  id: string;
  name: string | null;
  email: string | null;
  userType: string;
  status: SystemStatus;
  activeCampuses?: {
    id: string;
    userId: string;
    campusId: string;
    roleType: string;
    status: SystemStatus;
    startDate: Date;
    endDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    campus?: {
      id: string;
      name: string;
      code: string;
    };
  }[];
}

// Interface for the transformed user data used in the component
interface UserRow {
  id: string;
  name: string | null;
  email: string | null;
  userType: string;
  status: SystemStatus;
  activeCampuses?: { campusId: string; campus: { name: string } }[];
}

// Map user types to readable names
const userTypeMap: Record<string, string> = {
  STUDENT: "Student",
  TEACHER: "Teacher",
  COORDINATOR: "Campus Coordinator",
  ADMIN: "Campus Admin",
  SYSTEM_ADMIN: "System Admin"
};

export const UserList = (props: UserListProps) => {
  const { onEdit, onViewProfile } = props;
  const [filters, setFilters] = useState<UserFiltersState>({
    search: "",
    role: "",
    status: "",
    campus: "",
    dateRange: { from: null, to: null }
  });

  // Fetch users from API
  const { data: usersData, isLoading, refetch } = api.user.list.useQuery({
    search: filters.search || undefined,
    role: filters.role || undefined,
    status: filters.status as SystemStatus || undefined,
    campus: filters.campus || undefined,
    skip: 0,
    take: 100
  }, {
    enabled: true,
    refetchOnWindowFocus: false
  });

  // Transform API data to match UserRow interface
  const transformUsers = (apiUsers: ApiUser[]): UserRow[] => {
    return apiUsers.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      userType: user.userType,
      status: user.status,
      activeCampuses: user.activeCampuses?.map(access => ({
        campusId: access.campusId,
        campus: {
          name: access.campus?.name || 'Unknown'
        }
      }))
    }));
  };

  const users = usersData?.items ? transformUsers(usersData.items as ApiUser[]) : [];

  // Refetch when filters change
  useEffect(() => {
    void refetch();
  }, [filters, refetch]);

  // Users are already filtered by the API

  // Update user status mutation
  const updateUserMutation = api.user.update.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User status updated successfully",
      });
      void refetch();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
      });
    }
  });

  // Update user status
  const updateStatus = (id: string, newStatus: SystemStatus) => {
    updateUserMutation.mutate({
      id,
      data: { status: newStatus }
    });
  };

  const columns = [
    { header: "Name", accessorKey: "name" },
    { header: "Email", accessorKey: "email" },
    {
      header: "Role",
      cell: ({ row }: { row: { original: UserRow } }) => (
        <Badge variant="outline">{userTypeMap[row.original.userType] || row.original.userType}</Badge>
      )
    },
    {
      header: "Status",
      cell: ({ row }: { row: { original: UserRow } }) => (
        <Badge
          variant={row.original.status === "ACTIVE" ? "success" : "warning"}
        >
          {row.original.status}
        </Badge>
      )
    },
    {
      header: "Campus",
      cell: ({ row }: { row: { original: UserRow } }) => {
        const campuses = row.original.activeCampuses || [];

        // Filter out campuses without valid data
        const validCampuses = campuses.filter(c => c?.campus?.name);

        if (validCampuses.length === 0) return "Not assigned";
        if (validCampuses.length === 1) {
          return validCampuses[0]?.campus?.name;
        }

        return `${validCampuses[0]?.campus?.name} +${validCampuses.length - 1} more`;
      }
    },
    {
      header: "Actions",
      cell: ({ row }: { row: { original: UserRow } }) => (
        <div className="flex gap-2">
          {onViewProfile && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewProfile(row.original.id)}
            >
              View Profile
            </Button>
          )}
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(row.original.id)}
            >
              Edit
            </Button>
          )}
          <Button
            variant={row.original.status === "ACTIVE" ? "destructive" : "default"}
            size="sm"
            onClick={() => updateStatus(
              row.original.id,
              row.original.status === "ACTIVE" ? "INACTIVE" as SystemStatus : "ACTIVE" as SystemStatus
            )}
          >
            {row.original.status === "ACTIVE" ? "Deactivate" : "Activate"}
          </Button>
        </div>
      )
    }
  ];

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <UserFilters
          onFiltersChange={(newFilters) => {
            setFilters(prev => ({ ...prev, ...newFilters }));
          }}
        />
        <DataTable
          columns={columns}
          data={users}
          isLoading={isLoading}
        />
      </div>
    </Card>
  );
};