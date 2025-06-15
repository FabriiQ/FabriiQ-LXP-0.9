import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Pencil, 
  Trash2, 
  ArrowUpDown,
  BookOpen,
  Users,
  Building,
  Settings
} from "lucide-react";
import { useRouter } from "next/navigation";
import { SystemStatus } from "@prisma/client";

interface ProgramListProps {
  programs: Array<{
    id: string;
    name: string;
    code: string;
    status: SystemStatus;
    description?: string | null;
    _count: {
      courses: number;
      campusOfferings: number;
      studentEnrollments: number;
    };
  }>;
  onSort: (field: string) => void;
  sortField: string;
  sortOrder: "asc" | "desc";
}

export function ProgramList({ programs, onSort, sortField, sortOrder }: ProgramListProps) {
  const router = useRouter();

  const getStatusColor = (status: SystemStatus) => {
    switch (status) {
      case "ACTIVE":
        return "success";
      case "INACTIVE":
        return "warning";
      case "ARCHIVED":
      case "ARCHIVED_CURRENT_YEAR":
      case "ARCHIVED_PREVIOUS_YEAR":
      case "ARCHIVED_HISTORICAL":
        return "secondary";
      case "DELETED":
        return "destructive";
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-4">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-muted rounded-lg">
        <div className="col-span-4 flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSort("name")}
            className="hover:bg-transparent"
          >
            <span>Program Name</span>
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
        <div className="col-span-2">Code</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-3">Statistics</div>
        <div className="col-span-1">Actions</div>
      </div>

      {/* Program Items */}
      {programs.map((program) => (
        <Card key={program.id} className="p-6">
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-4">
              <h3 className="font-medium">{program.name}</h3>
              {program.description && (
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {program.description}
                </p>
              )}
            </div>
            
            <div className="col-span-2">
              <code className="px-2 py-1 bg-muted rounded-md text-sm">
                {program.code}
              </code>
            </div>

            <div className="col-span-2">
              <Badge variant={getStatusColor(program.status)}>
                {program.status}
              </Badge>
            </div>

            <div className="col-span-3">
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{program._count.courses}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{program._count.campusOfferings}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{program._count.studentEnrollments}</span>
                </div>
              </div>
            </div>

            <div className="col-span-1">
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/admin/system/programs/${program.id}/edit`)}
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/admin/system/programs/${program.id}/config`)}
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Configure
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
} 
