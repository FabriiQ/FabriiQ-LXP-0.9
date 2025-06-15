'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, Filter, Plus } from "lucide-react";
import Link from "next/link";
import { DataTable } from "@/components/ui/data-display/data-table";
import { createClassColumns } from "@/components/admin/classes/ClassColumns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from 'next/navigation';

interface CampusClassesContentProps {
  campus: {
    id: string;
    name: string;
    code: string;
    status: string;
  };
  classes: any[];
  programCampuses: any[];
  terms: any[];
  searchParams: {
    search?: string;
    programId?: string;
    termId?: string;
  };
  isCoordinator?: boolean;
}

export function CampusClassesContent({
  campus,
  classes,
  programCampuses,
  terms,
  searchParams,
  isCoordinator = false
}: CampusClassesContentProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(searchParams.search || '');
  const [selectedProgramId, setSelectedProgramId] = useState(searchParams.programId || '');
  const [selectedTermId, setSelectedTermId] = useState(searchParams.termId || '');

  const basePath = isCoordinator ? '/admin/coordinator' : '/admin/campus';

  // Format classes for the data table
  const formattedClasses = classes.map(cls => ({
    id: cls.id,
    code: cls.code,
    name: cls.name,
    program: cls.courseCampus.course.program.name,
    programId: cls.courseCampus.course.programId,
    course: cls.courseCampus.course.name,
    courseId: cls.courseCampus.courseId,
    campus: cls.courseCampus.campus.name,
    campusId: cls.courseCampus.campusId,
    term: cls.term?.name || 'No Term',
    termId: cls.termId,
    studentCount: cls._count.students,
    teacherCount: cls._count.teachers,
    activityCount: cls._count.activities,
    assessmentCount: cls._count.assessments,
    status: cls.status
  }));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (selectedProgramId) params.set('programId', selectedProgramId);
    if (selectedTermId) params.set('termId', selectedTermId);

    router.push(`${basePath}/classes?${params.toString()}`);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Class Management</h1>
          <p className="text-muted-foreground">Manage classes at {campus.name}</p>
        </div>
        {!isCoordinator && (
          <div className="flex gap-2">
            <Button asChild>
              <Link href={`${basePath}/classes/new`}>
                <Plus className="mr-2 h-4 w-4" /> Add Class
              </Link>
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Class Management</CardTitle>
          <CardDescription>View and manage classes for your campus</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search classes..."
                className="pl-8"
                name="search"
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
                  {programCampuses.map(pc => (
                    <SelectItem key={pc.program.id} value={pc.program.id}>
                      {pc.program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedTermId} onValueChange={setSelectedTermId}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="All Terms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Terms</SelectItem>
                  {terms.map(term => (
                    <SelectItem key={term.id} value={term.id}>
                      {term.name}
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

          <div className="rounded-md border">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  {createClassColumns(isCoordinator).map((column) => (
                    <th key={column.id || column.accessorKey} className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {formattedClasses.length > 0 ? (
                  formattedClasses.map((row, rowIndex) => (
                    <tr key={row.id || rowIndex} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      {createClassColumns(isCoordinator).map((column) => (
                        <td key={column.id || column.accessorKey} className="px-4 py-3 text-sm">
                          {column.cell ? column.cell({ row: { original: row } }) : row[column.accessorKey as keyof typeof row]}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={createClassColumns(isCoordinator).length} className="p-4 text-center text-muted-foreground">
                      No classes found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {formattedClasses.length} classes
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
