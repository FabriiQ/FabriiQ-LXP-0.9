'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, Filter, Plus } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-display/data-table";
import { useRouter } from 'next/navigation';
import { api } from '@/trpc/react';
import { SystemStatus } from '@/server/api/constants';

interface CampusAssessmentsContentProps {
  campus: {
    id: string;
    name: string;
    code: string;
    status: string;
  };
  classes: {
    id: string;
    name: string;
    code: string;
    courseCampus?: {
      course?: {
        name: string;
      };
    };
  }[];
  subjects: {
    id: string;
    name: string;
    code: string;
    course?: {
      name: string;
    };
  }[];
  searchParams: {
    search?: string;
    classId?: string;
    subjectId?: string;
  };
  isCoordinator?: boolean;
}

export function CampusAssessmentsContent({
  campus,
  classes,
  subjects,
  searchParams,
  isCoordinator = false
}: CampusAssessmentsContentProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(searchParams.search || '');
  const [selectedClassId, setSelectedClassId] = useState(searchparams.id || '');
  const [selectedSubjectId, setSelectedSubjectId] = useState(searchParams.subjectId || '');
  const [assessments, setAssessments] = useState<any[]>([]);

  const basePath = isCoordinator ? '/admin/coordinator' : '/admin/campus';

  // Define columns for the data table
  const assessmentColumns = [
    {
      accessorKey: "title",
      header: "Assessment Title",
      cell: ({ row }: any) => (
        <div>
          <div className="font-medium">{row.original.title}</div>
          <div className="text-sm text-muted-foreground">{row.original.code}</div>
        </div>
      ),
    },
    {
      accessorKey: "class",
      header: "Class",
    },
    {
      accessorKey: "subject",
      header: "Subject",
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }: any) => (
        <Badge variant="outline">{row.original.type}</Badge>
      ),
    },
    {
      accessorKey: "dueDate",
      header: "Due Date",
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
          <Link href={`${basePath}/assessments/${row.original.id}`}>
            View
          </Link>
        </Button>
      ),
    },
  ];

  // Fetch assessments data using tRPC
  const { data: assessmentsData, isLoading: isLoadingAssessments } = api.assessment.list.useQuery(
    {
      status: SystemStatus.ACTIVE,
      subjectId: selectedSubjectId || undefined,
      search: searchQuery || undefined,
    },
    {
      enabled: true,
      refetchOnWindowFocus: false,
    }
  );

  // For debugging
  console.log('Loading state:', isLoadingAssessments);

  // Process assessment data when it arrives
  useEffect(() => {
    if (assessmentsData?.items) {
      // Map the API response to the format expected by the component
      const formattedAssessments = assessmentsData.items.map((assessment) => {
        // Get class and subject info safely
        const className = assessment.classId ?
          (classes.find(c => c.id === assessment.classId)?.name || 'Unknown Class') : 'Unknown Class';

        const subjectName = assessment.subjectId ?
          (subjects.find(s => s.id === assessment.subjectId)?.name || 'Unknown Subject') : 'Unknown Subject';

        return {
          id: assessment.id,
          title: assessment.title,
          code: assessment.id.substring(0, 8), // Use part of the ID as a code
          class: className,
          subject: subjectName,
          type: 'ASSIGNMENT', // Default type since category might not exist
          dueDate: assessment.dueDate ? new Date(assessment.dueDate).toLocaleDateString() : 'No due date',
          status: assessment.status,
        };
      });

      setAssessments(formattedAssessments);
    }
  }, [assessmentsData, classes, subjects]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (selectedClassId) params.set('classId', selectedClassId);
    if (selectedSubjectId) params.set('subjectId', selectedSubjectId);

    router.push(`${basePath}/assessments?${params.toString()}`);
  };

  // Filter assessments based on search, class, and subject
  const filteredAssessments = assessments.filter(assessment => {
    const matchesSearch = !searchQuery ||
      assessment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assessment.code.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesClass = !selectedClassId || assessment.class.includes(selectedClassId);
    const matchesSubject = !selectedSubjectId || assessment.subject.includes(selectedSubjectId);

    return matchesSearch && matchesClass && matchesSubject;
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assessment Management</h1>
          <p className="text-muted-foreground">Manage assessments at {campus.name}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href={`${basePath}/assessments/new`}>
              <Plus className="mr-2 h-4 w-4" /> Create Assessment
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assessment Management</CardTitle>
          <CardDescription>View and manage assessments for your campus</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search assessments..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-col md:flex-row gap-2">
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Classes</SelectItem>
                  {classes.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Subjects</SelectItem>
                  {subjects.map(subject => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
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

          <DataTable
            columns={assessmentColumns}
            data={filteredAssessments}
            pagination
            isLoading={isLoadingAssessments}
          />
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {filteredAssessments.length} assessments
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

