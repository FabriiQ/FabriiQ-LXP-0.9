import { 
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem 
} from "~/components/ui/forms/select";
import { SystemStatus, AccessScope, EntityType } from "@prisma/client";

type PermissionFiltersProps = {
  filters: {
    scope: string;
    type: string;
    status: string;
  };
  onChange: (filters: PermissionFiltersProps["filters"]) => void;
};

export const PermissionFilters = ({ filters, onChange }: PermissionFiltersProps) => {
  return (
    <div className="grid grid-cols-3 gap-4">
      <Select
        value={filters.scope}
        onValueChange={(value) => onChange({ ...filters, scope: value })}
      >
        <SelectTrigger>
          <SelectValue placeholder="Filter by scope" />
        </SelectTrigger>
        <SelectContent>
          {Object.values(AccessScope).map((scope) => (
            <SelectItem key={scope} value={scope}>
              {scope}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.type}
        onValueChange={(value) => onChange({ ...filters, type: value })}
      >
        <SelectTrigger>
          <SelectValue placeholder="Filter by type" />
        </SelectTrigger>
        <SelectContent>
          {Object.values(EntityType).map((type) => (
            <SelectItem key={type} value={type}>
              {type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.status}
        onValueChange={(value) => onChange({ ...filters, status: value })}
      >
        <SelectTrigger>
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          {Object.values(SystemStatus).map((status) => (
            <SelectItem key={status} value={status}>
              {status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}; 