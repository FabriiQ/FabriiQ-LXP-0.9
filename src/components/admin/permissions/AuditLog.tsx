import { useState } from "react";
import { Card } from "~/components/ui";
import { DataTable } from "~/components/ui/data-display/data-table";
import { DatePicker } from "~/components/ui/forms/date-picker";

// Custom FilterPanel component
const FilterPanel = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="bg-gray-50 p-4 rounded-md mb-4">
      {children}
    </div>
  );
};

// Define the AuditLog type
interface AuditLogItem {
  id: string;
  action: string;
  timestamp: string | Date;
  user: { name: string };
  role: { name: string };
  details: string;
}

// Mock data for demonstration purposes
const mockData = {
  items: [
    {
      id: "1",
      action: "CREATE",
      timestamp: new Date(),
      user: { name: "John Doe" },
      role: { name: "Admin" },
      details: "Created new permission"
    },
    {
      id: "2",
      action: "UPDATE",
      timestamp: new Date(),
      user: { name: "Jane Smith" },
      role: { name: "Manager" },
      details: "Updated permission settings"
    }
  ]
};

export const AuditLog = () => {
  const [filters, setFilters] = useState({
    userId: "",
    roleId: "",
    dateRange: {
      from: undefined as Date | undefined,
      to: undefined as Date | undefined
    }
  });

  // Use mock data instead of API call
  const data = mockData;
  const isLoading = false;

  const columns = [
    { header: "Action", accessorKey: "action" },
    { header: "User", accessorKey: "user.name" },
    { header: "Role", accessorKey: "role.name" },
    { 
      header: "Timestamp", 
      accessorKey: "timestamp",
      cell: ({ row }: { row: { original: AuditLogItem } }) => 
        new Date(row.original.timestamp).toLocaleString()
    },
    { header: "Details", accessorKey: "details" }
  ];

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <FilterPanel>
          <div className="grid grid-cols-4 gap-4">
            <DatePicker
              selected={filters.dateRange.from}
              onSelect={(date: Date | undefined) => setFilters({
                ...filters,
                dateRange: { ...filters.dateRange, from: date }
              })}
              placeholder="From date"
            />
            <DatePicker
              selected={filters.dateRange.to}
              onSelect={(date: Date | undefined) => setFilters({
                ...filters,
                dateRange: { ...filters.dateRange, to: date }
              })}
              placeholder="To date"
            />
          </div>
        </FilterPanel>

        <DataTable
          columns={columns}
          data={data.items}
          isLoading={isLoading}
        />
      </div>
    </Card>
  );
}; 