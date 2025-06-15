"use client";

import { useState } from "react";
import { Button } from "@/components/ui/core/button";
import { SearchBar } from "@/components/ui/search-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/data-display/card";
import { SystemStatus } from "@/server/api/constants";
import { Edit, Eye, BookOpen, Calendar, GraduationCap } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Badge } from "@/components/ui/atoms/badge";
import { formatDate } from "@/utils/format";
import { cn } from "@/lib/utils";

// Interface to match the API response structure
interface Subject {
  id: string;
  code: string;
  name: string;
  status: SystemStatus;
  course: {
    name: string;
    id: string;
    code: string;
  };
  createdAt: Date;
  updatedAt: Date;
  credits: number;
  syllabus: any; // Using any for JsonValue
  courseId: string;
}

export function SubjectList() {
  const [filters, setFilters] = useState({
    status: SystemStatus.ACTIVE as SystemStatus | undefined,
    search: "",
    skip: 0,
    take: 10,
  });

  const router = useRouter();

  // Fetch subjects from API
  const { data, isLoading, refetch } = api.subject.list.useQuery({
    skip: filters.skip,
    take: filters.take,
    search: filters.search,
    status: filters.status,
  });

  const subjects = data?.items || [];
  const totalCount = data?.total || 0;

  // Handle search functionality
  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  return (
    <Card className="p-4">
      <div className="flex justify-between mb-6">
        <SearchBar
          value={filters.search}
          onChange={handleSearch}
          placeholder="Search subjects..."
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="overflow-hidden animate-pulse">
              <CardHeader className="p-4 pb-2">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : subjects.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No subjects found. Try adjusting your search criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject) => (
            <Card
              key={subject.id}
              className={cn(
                "overflow-hidden border-l-4 transition-all hover:shadow-md cursor-pointer",
                subject.status === SystemStatus.ACTIVE
                  ? "border-l-primary-green"
                  : "border-l-gray-300"
              )}
              onClick={() => router.push(`/admin/system/subjects/${subject.id}`)}
            >
              <CardHeader className="p-4 pb-2 flex flex-row justify-between items-start">
                <div>
                  <CardTitle className="text-base flex items-center">
                    <BookOpen className="h-4 w-4 mr-2 text-primary-green" />
                    {subject.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Code: {subject.code}
                  </p>
                </div>
                <Badge
                  variant={subject.status === SystemStatus.ACTIVE ? "success" : "secondary"}
                >
                  {subject.status}
                </Badge>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center">
                    <GraduationCap className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {subject.course?.name || "No course"}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {formatDate(subject.updatedAt)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end mt-4 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/admin/system/subjects/${subject.id}`);
                    }}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1.5" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/admin/system/subjects/${subject.id}/edit`);
                    }}
                  >
                    <Edit className="h-3.5 w-3.5 mr-1.5" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
}