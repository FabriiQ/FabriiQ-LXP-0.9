import { VirtualizedDataTable } from "@/components/ui/data-display/virtualized-data-table";
import { Button } from "@/components/ui/core/button";
import { Card } from "@/components/ui/data-display/card";
import { UserFilters } from "./UserFilters";
import { Badge } from "@/components/ui/atoms/badge";
import { toast } from "@/components/ui/feedback/toast";
import { useState, useEffect, useCallback } from "react";
import { SystemStatus } from "@prisma/client";
import { api } from "@/trpc/react";

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
  primaryCampusId?: string;
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
  primaryCampusId?: string;
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

export const UserListNew = ({ onEdit, onViewProfile }: UserListProps) => {
  const [filters, setFilters] = useState<UserFiltersState>({
    search: "",
    role: "",
    status: "",
    campus: "",
    dateRange: { from: null, to: null }
  });

  // Fetch users from API with optimized caching
  const { data: usersData, isLoading, refetch } = api.user.list.useQuery({
    search: filters.search || undefined,
    role: filters.role || undefined,
    status: filters.status as SystemStatus || undefined,
    campus: filters.campus || undefined,
    skip: 0,
    take: 100
  }, {
    enabled: true,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000 // 10 minutes
  });

  // Transform API data to match UserRow interface
  const transformUsers = (apiUsers: ApiUser[]): UserRow[] => {
    return apiUsers.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      userType: user.userType,
      status: user.status,
      primaryCampusId: user.primaryCampusId,
      activeCampuses: user.activeCampuses?.map(access => ({
        campusId: access.campusId,
        campus: {
          name: access.campus?.name || 'Unknown'
        }
      }))
    }));
  };

  const users = usersData?.items ? transformUsers(usersData.items as ApiUser[]) : [];

  // Refetch when filters change - using a stable reference to prevent infinite loops
  useEffect(() => {
    // Only refetch if we have actual filter values
    const hasActiveFilters =
      filters.search ||
      filters.role ||
      filters.status ||
      filters.campus;

    if (hasActiveFilters) {
      void refetch();
    }
  }, [filters.search, filters.role, filters.status, filters.campus, refetch]);

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
      header: "Primary Campus",
      cell: ({ row }: { row: { original: UserRow } }) => {
        if (!row.original.primaryCampusId) return "Not assigned";

        // Find the primary campus in the active campuses
        const primaryCampus = row.original.activeCampuses?.find(
          c => c.campusId === row.original.primaryCampusId
        );

        return primaryCampus?.campus?.name || "Unknown";
      }
    },
    {
      header: "Active Campuses",
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
      id: "actions", // Add a stable ID to prevent re-renders
      cell: ({ row }: { row: { original: UserRow } }) => {
        // Extract values outside JSX to reduce re-renders
        const userId = row.original.id;
        const isActive = row.original.status === "ACTIVE";
        const statusText = isActive ? "Deactivate" : "Activate";
        const statusVariant = isActive ? "destructive" : "default";

        // Create stable callback functions
        const handleViewProfile = onViewProfile ? () => {
          onViewProfile(userId);
        } : undefined;

        const handleEdit = onEdit ? () => {
          onEdit(userId);
        } : undefined;

        const handleStatusUpdate = () => {
          updateStatus(
            userId,
            isActive ? "INACTIVE" as SystemStatus : "ACTIVE" as SystemStatus
          );
        };

        return (
          <div className="flex gap-2">
            {onViewProfile && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewProfile}
              >
                View Profile
              </Button>
            )}
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
              >
                Edit
              </Button>
            )}
            <Button
              variant={statusVariant}
              size="sm"
              onClick={handleStatusUpdate}
            >
              {statusText}
            </Button>
          </div>
        );
      }
    }
  ];

  // Memoize the render function to prevent unnecessary re-renders
  const renderTable = useCallback(() => {
    return (
      <VirtualizedDataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        searchColumn="name"
        searchPlaceholder="Search users..."
        containerHeight={600}
        estimatedRowHeight={56}
        overscan={10}
        emptyMessage="No users found. Try adjusting your filters."
      />
    );
  }, [columns, users, isLoading]);

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <UserFilters
          onFiltersChange={(newFilters) => {
            setFilters(prev => ({ ...prev, ...newFilters }));
          }}
        />
        {renderTable()}
      </div>
    </Card>
  );
};
