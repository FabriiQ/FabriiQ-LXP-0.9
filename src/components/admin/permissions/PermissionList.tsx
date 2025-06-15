import { useState } from "react";
import { Card } from "~/components/ui";
import { DataTable } from "~/components/ui/data-display/data-table";
import { Badge } from "~/components/ui/data-display/badge";
import { Button } from "~/components/ui/button";
import { PermissionFilters } from "./PermissionFilters";
import { SystemStatus, AccessScope, EntityType } from "@prisma/client";

// Define the Permission type locally to match the API response
interface Permission {
  id: string;
  code: string;
  name: string;
  description?: string;
  scope: AccessScope;
  entityType?: EntityType;
  status: SystemStatus;
  type: string;
}

// Mock permission data
const mockPermissions: Permission[] = [
  {
    id: "1",
    code: "USER_CREATE",
    name: "Create User",
    description: "Allows creating new users",
    scope: "SYSTEM" as AccessScope,
    entityType: "PROGRAM" as EntityType,
    status: "ACTIVE" as SystemStatus,
    type: "USER_MANAGEMENT"
  },
  {
    id: "2",
    code: "USER_EDIT",
    name: "Edit User",
    description: "Allows editing existing users",
    scope: "SYSTEM" as AccessScope,
    entityType: "PROGRAM" as EntityType,
    status: "ACTIVE" as SystemStatus,
    type: "USER_MANAGEMENT"
  },
  {
    id: "3",
    code: "CONTENT_CREATE",
    name: "Create Content",
    description: "Allows creating new content",
    scope: "SINGLE_CAMPUS" as AccessScope,
    entityType: "COURSE" as EntityType,
    status: "INACTIVE" as SystemStatus,
    type: "CONTENT_MANAGEMENT"
  }
];

export const PermissionList = () => {
  const [filters, setFilters] = useState({
    scope: "",
    type: "",
    status: "" as SystemStatus | ""
  });

  // Use mock data instead of API call
  const isLoading = false;
  const filteredData = mockPermissions.filter(permission => {
    if (filters.scope && permission.scope !== filters.scope) return false;
    if (filters.type && permission.entityType !== filters.type) return false;
    if (filters.status && permission.status !== filters.status) return false;
    return true;
  });

  const columns = [
    { header: "Name", accessorKey: "name" },
    {
      header: "Scope",
      cell: ({ row }: { row: { original: Permission } }) => (
        <Badge variant="outline">{row.original.scope}</Badge>
      )
    },
    {
      header: "Type",
      cell: ({ row }: { row: { original: Permission } }) => (
        <Badge>{row.original.type}</Badge>
      )
    },
    {
      header: "Status",
      cell: ({ row }: { row: { original: Permission } }) => (
        <Badge 
          variant={row.original.status === SystemStatus.ACTIVE ? "success" : "warning"}
        >
          {row.original.status}
        </Badge>
      )
    },
    {
      header: "Actions",
      cell: ({ row }: { row: { original: Permission } }) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Edit
          </Button>
          <Button variant="destructive" size="sm">
            Delete
          </Button>
        </div>
      )
    }
  ];

  // Create a handler that properly types the filters
  const handleFilterChange = (newFilters: {
    scope: string;
    type: string;
    status: string;
  }) => {
    setFilters({
      ...newFilters,
      status: newFilters.status as SystemStatus | ""
    });
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <PermissionFilters
          filters={filters}
          onChange={handleFilterChange}
        />
        <DataTable
          columns={columns}
          data={filteredData}
          isLoading={isLoading}
        />
      </div>
    </Card>
  );
}; 