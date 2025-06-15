'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ProgramGrid } from "@/components/program/ProgramGrid";
import { ProgramList } from "@/components/program/ProgramList";
import { PageHeader } from "@/components/ui/page-header";
import { api } from "@/trpc/react";
import { LoadingSpinner } from "@/components/ui/loading";
import { SystemStatus } from "@/server/api/constants";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/forms/select";
import { PlusIcon, SearchIcon, LayoutGrid, LayoutList } from "lucide-react";

// Define the type to match the ProgramList component's expected props
type ProgramWithCounts = {
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
};

export default function ProgramsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Fetch programs with filters
  const { data, isLoading } = api.program.list.useQuery({
    search: searchTerm,
    status: statusFilter === "ALL" ? undefined : statusFilter as SystemStatus,
    sortBy: sortField,
    sortOrder: sortOrder,
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Transform the data to match the expected type
  const transformedPrograms: ProgramWithCounts[] = (data?.programs || []).map(program => ({
    id: program.id,
    name: program.name,
    code: program.code,
    status: program.status as SystemStatus,
    description: null, // Set to null since it doesn't exist in the API response
    _count: {
      courses: program._count?.courses || 0,
      campusOfferings: program._count?.campusOfferings || 0,
      studentEnrollments: 0 // Add the missing property
    }
  }));

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader
          title="Academic Programs"
          description="Manage your institution's academic programs"
        />
        <Button onClick={() => router.push("/admin/system/programs/new")}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Program
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search programs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2 items-center">
              <div className="w-40">
                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value={SystemStatus.ACTIVE}>Active</SelectItem>
                    <SelectItem value={SystemStatus.INACTIVE}>Inactive</SelectItem>
                    <SelectItem value={SystemStatus.ARCHIVED}>Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex border rounded-md overflow-hidden">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-none"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-none"
                >
                  <LayoutList className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {viewMode === "grid" ? (
            <ProgramGrid programs={transformedPrograms} />
          ) : (
            <ProgramList
              programs={transformedPrograms}
              onSort={handleSort}
              sortField={sortField}
              sortOrder={sortOrder}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
