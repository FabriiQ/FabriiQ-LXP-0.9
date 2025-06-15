'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, Filter, Plus, BookOpen } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-display/data-table";
import { useRouter } from 'next/navigation';
import { CoordinatorCourseGrid } from '@/components/coordinator/CoordinatorCourseGrid';

interface CampusCoursesContentProps {
  campus: {
    id: string;
    name: string;
    code: string;
    status: string;
  };
  courses: any[];
  programs: any[];
  levels: number[];
  searchParams: {
    search?: string;
    programId?: string;
    level?: string;
  };
  isCoordinator?: boolean;
}

export function CampusCoursesContent({
  campus,
  courses,
  programs,
  levels,
  searchParams,
  isCoordinator = false
}: CampusCoursesContentProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(searchParams.search || '');
  const [selectedProgramId, setSelectedProgramId] = useState(searchParams.programId || '');
  const [selectedLevel, setSelectedLevel] = useState(searchParams.level || '');

  const basePath = isCoordinator ? '/admin/coordinator' : '/admin/campus';

  // Define columns for the data table
  const courseColumns = [
    {
      accessorKey: "name",
      header: "Course Name",
      cell: ({ row }: any) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          <div className="text-sm text-muted-foreground">{row.original.code}</div>
        </div>
      ),
    },
    {
      accessorKey: "program",
      header: "Program",
    },
    {
      accessorKey: "level",
      header: "Level",
      cell: ({ row }: any) => (
        <Badge variant="outline">Level {row.original.level}</Badge>
      ),
    },
    {
      accessorKey: "subjectCount",
      header: "Subjects",
      cell: ({ row }: any) => row.original.subjectCount,
    },
    {
      accessorKey: "classCount",
      header: "Classes",
      cell: ({ row }: any) => row.original.classCount,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => (
        <Badge variant={row.original.status === "ACTIVE" ? "success" : "secondary"}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }: any) => (
        <Button variant="ghost" size="sm" asChild>
          <Link href={`${basePath}/courses/${row.original.id}`}>
            View
          </Link>
        </Button>
      ),
    },
  ];

  // Format courses for the data table
  const formattedCourses = courses.map(course => ({
    id: course.id,
    name: course.name,
    code: course.code,
    program: course.program.name,
    programId: course.programId,
    level: course.level,
    subjectCount: course._count.subjects,
    classCount: course.campusOfferings.reduce((acc: number, offering: any) => acc + offering._count.classes, 0),
    status: course.status
  }));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (selectedProgramId) params.set('programId', selectedProgramId);
    if (selectedLevel) params.set('level', selectedLevel);

    router.push(`${basePath}/courses?${params.toString()}`);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Course Management</h1>
          <p className="text-muted-foreground">Manage courses at {campus.name}</p>
        </div>
        {!isCoordinator && (
          <div className="flex gap-2">
            <Button asChild>
              <Link href={`${basePath}/courses/new`}>
                <Plus className="mr-2 h-4 w-4" /> Add Course
              </Link>
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course Management</CardTitle>
          <CardDescription>View and manage courses for your campus</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search courses..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-col md:flex-row gap-2">
              <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="All Programs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Programs</SelectItem>
                  {programs.map(program => (
                    <SelectItem key={program.id} value={program.id}>
                      {program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Levels</SelectItem>
                  {levels.map(level => (
                    <SelectItem key={level} value={level.toString()}>
                      Level {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" type="submit">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </form>

          {isCoordinator ? (
            <CoordinatorCourseGrid
              courses={courses}
              basePath="/admin/coordinator/courses"
            />
          ) : (
            <DataTable
              columns={courseColumns}
              data={formattedCourses}
              searchField="name"
              pagination
            />
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {formattedCourses.length} courses
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
