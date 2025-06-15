import { useState, useEffect } from "react";
import { SystemStatus } from '@prisma/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/forms/select';
import { Input } from '@/components/ui/core/input';
import { Button } from '@/components/ui/core/button';
import { Search, X } from "lucide-react";

interface UserFiltersProps {
  onFiltersChange: (filters: {
    status?: SystemStatus;
    role?: string;
    search?: string;
  }) => void;
}

export function UserFilters({ onFiltersChange }: UserFiltersProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState<SystemStatus | "">("");
  const [role, setRole] = useState("");

  // Debounce search to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only trigger filter change if searchTerm has actually changed
      onFiltersChange({ search: searchTerm });
    }, 500); // Increased debounce time for better performance

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // Handle status change with debounce
  const handleStatusChange = (value: SystemStatus) => {
    // Only update if value has changed
    if (value !== status) {
      setStatus(value);
      // Use a small timeout to prevent rapid consecutive calls
      setTimeout(() => {
        onFiltersChange({ status: value });
      }, 10);
    }
  };

  // Handle role change with debounce
  const handleRoleChange = (value: string) => {
    // Only update if value has changed
    if (value !== role) {
      setRole(value);
      // Use a small timeout to prevent rapid consecutive calls
      setTimeout(() => {
        onFiltersChange({ role: value });
      }, 10);
    }
  };

  // Clear all filters with a single update
  const clearFilters = () => {
    // Update local state
    setSearchTerm("");
    setStatus("");
    setRole("");

    // Use a small timeout to batch the filter change
    setTimeout(() => {
      // Send a single update with all filters cleared
      onFiltersChange({
        search: "",
        status: undefined,
        role: ""
      });
    }, 10);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => {
                setSearchTerm("");
                // Use a small timeout to prevent rapid consecutive calls
                setTimeout(() => {
                  onFiltersChange({ search: "" });
                }, 10);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value={SystemStatus.ACTIVE}>Active</SelectItem>
            <SelectItem value={SystemStatus.INACTIVE}>Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Select value={role} onValueChange={handleRoleChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Roles</SelectItem>
            <SelectItem value="STUDENT">Student</SelectItem>
            <SelectItem value="TEACHER">Teacher</SelectItem>
            <SelectItem value="COORDINATOR">Coordinator</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="SYSTEM_ADMIN">System Admin</SelectItem>
          </SelectContent>
        </Select>

        {(searchTerm || status || role) && (
          <Button variant="outline" size="sm" onClick={clearFilters}>
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
}
