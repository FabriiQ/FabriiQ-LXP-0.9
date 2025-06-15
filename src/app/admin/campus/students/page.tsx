'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/data-display/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/navigation/tabs";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, Download, UploadIcon, MoreHorizontal, Settings } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FixStudentsCampusAccess } from "./fix-students-button";
import { StudentImportDialog } from "@/components/admin/campus/students/StudentImportDialog";
import { StudentExportDialog } from "@/components/admin/campus/students/StudentExportDialog";
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

interface StudentWithDetails {
  id: string;
  user_id: string;
  name: string;
  email: string;
  status: string;
  enrollment_date: Date | null;
  program_name: string | null;
  class_count: number;
}

export default function CampusStudentsPage() {
  const [campus, setCampus] = useState<any>(null);
  const [studentsWithDetails, setStudentsWithDetails] = useState<StudentWithDetails[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [programFilter, setProgramFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);

  // Reference for the virtualized list container
  const parentRef = useRef<HTMLDivElement>(null);

  // Generate a large dataset for testing
  const generateLargeDataset = (count: number) => {
    const data: StudentWithDetails[] = [];
    const programs = ['Computer Science', 'Business Administration', 'Engineering', 'Medicine', 'Arts'];
    const statuses = ['ACTIVE', 'PENDING', 'INACTIVE'];

    for (let i = 0; i < count; i++) {
      data.push({
        id: `student-${i}`,
        user_id: `user-${i}`,
        name: `Student ${i}`,
        email: `student${i}@example.com`,
        status: statuses[i % statuses.length],
        enrollment_date: new Date(Date.now() - Math.floor(Math.random() * 10000000000)),
        program_name: programs[i % programs.length],
        class_count: Math.floor(Math.random() * 6) + 1
      });
    }

    return data;
  };

  // Setup virtualization
  const rowVirtualizer = useVirtualizer({
    count: filteredStudents.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Estimated row height
    overscan: 10, // Number of items to render outside of the visible area
  });

  // Fetch initial data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // Simulate campus data
        setCampus({
          id: 'campus-1',
          name: 'Main Campus',
          code: 'MC',
          status: 'ACTIVE'
        });

        // Generate large dataset for testing
        const largeDataset = generateLargeDataset(1000); // Start with 1000 for testing
        setStudentsWithDetails(largeDataset);
        setTotalCount(50000); // Simulate total count of 50,000 students
        setHasNextPage(true);

        // Apply initial filters
        const initialFiltered = largeDataset.filter(student =>
          statusFilter === 'all' || student.status.toLowerCase() === statusFilter
        );
        setFilteredStudents(initialFiltered);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    }

    fetchData();

    // Setup cache invalidation every 5 minutes
    const cacheInvalidationTimer = setInterval(() => {
      // In a real app, this would check if the cache needs refreshing
      console.log('Checking if cache needs refreshing...');
    }, 5 * 60 * 1000);

    return () => clearInterval(cacheInvalidationTimer);
  }, []);

  // Filter students when search query or filters change
  useEffect(() => {
    if (!studentsWithDetails.length) return;

    const filtered = studentsWithDetails.filter(student => {
      // Filter by status
      if (statusFilter !== 'all' && student.status.toLowerCase() !== statusFilter) {
        return false;
      }

      // Filter by program
      if (programFilter && student.program_name !== programFilter) {
        return false;
      }

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          student.name.toLowerCase().includes(query) ||
          student.email.toLowerCase().includes(query)
        );
      }

      return true;
    });

    setFilteredStudents(filtered);
  }, [searchQuery, programFilter, statusFilter, studentsWithDetails]);

  // Handle infinite scrolling
  const loadMoreStudents = async () => {
    if (isFetchingNextPage || !hasNextPage) return;

    try {
      setIsFetchingNextPage(true);

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Generate more data
      const nextPageData = generateLargeDataset(500);

      // Append to existing data
      setStudentsWithDetails(prev => [...prev, ...nextPageData]);

      // Check if we have more pages
      setHasNextPage(studentsWithDetails.length + nextPageData.length < totalCount);
      setPage(prev => prev + 1);

      setIsFetchingNextPage(false);
    } catch (error) {
      console.error('Error loading more students:', error);
      setIsFetchingNextPage(false);
    }
  };

  // Handle scroll to detect when to load more data
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

    // Load more when scrolled to 80% of the way down
    if (scrollTop + clientHeight >= scrollHeight * 0.8 && !isFetchingNextPage && hasNextPage) {
      loadMoreStudents();
    }
  };

  if (loading || !campus) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Student Management</h1>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
        <div className="h-96 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Management</h1>
          <p className="text-muted-foreground">Manage students at {campus.name}</p>
        </div>
        <div className="flex gap-2">
          <StudentImportDialog campusId={campus.id} />
          <StudentExportDialog campusId={campus.id} />
          <Button asChild>
            <Link href="/admin/campus/students/new">
              <Plus className="mr-2 h-4 w-4" /> Add Student
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative w-full md:w-auto md:min-w-[300px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search students..."
            className="w-full pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            className="px-3 py-1 border rounded-md text-sm"
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
          >
            <option value="">All Programs</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Business Administration">Business Administration</option>
            <option value="Engineering">Engineering</option>
            <option value="Medicine">Medicine</option>
            <option value="Arts">Arts</option>
          </select>
          <Button variant="outline" size="sm" onClick={() => {
            setSearchQuery('');
            setProgramFilter('');
          }}>
            <Filter className="mr-2 h-4 w-4" /> Reset Filters
          </Button>
        </div>
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="active">Active Students</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <div className="rounded-md">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium sticky top-0 bg-white z-10">Student</th>
                      <th className="text-left p-4 font-medium sticky top-0 bg-white z-10">Email</th>
                      <th className="text-left p-4 font-medium sticky top-0 bg-white z-10">Program</th>
                      <th className="text-left p-4 font-medium sticky top-0 bg-white z-10">Enrollment Date</th>
                      <th className="text-left p-4 font-medium sticky top-0 bg-white z-10">Classes</th>
                      <th className="text-left p-4 font-medium sticky top-0 bg-white z-10">Status</th>
                      <th className="text-right p-4 font-medium sticky top-0 bg-white z-10">Actions</th>
                    </tr>
                  </thead>

                  {/* Virtualized table body wrapper */}
                  <tbody className="divide-y">
                    <tr>
                      <td colSpan={7} style={{ padding: 0 }}>
                        <div
                          ref={parentRef}
                          onScroll={handleScroll}
                          style={{
                            height: '600px',
                            overflow: 'auto',
                            position: 'relative'
                          }}
                        >
                          {/* Spacer to account for virtualized content */}
                          <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative', width: '100%' }}>
                            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                              const student = filteredStudents[virtualRow.index];
                              return (
                                <div
                                  key={student.id}
                                  className="hover:bg-muted/50 absolute w-full border-b"
                                  style={{
                                    height: `${virtualRow.size}px`,
                                    transform: `translateY(${virtualRow.start}px)`,
                                    display: 'flex',
                                    width: '100%'
                                  }}
                                >
                                  <div className="p-4 flex-1 min-w-[200px]">
                                    <div className="flex items-center gap-3">
                                      <Avatar>
                                        <AvatarImage src={`https://avatar.vercel.sh/${student.name}`} alt={student.name} />
                                        <AvatarFallback>{student.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <p className="font-medium">{student.name}</p>
                                        <p className="text-xs text-muted-foreground">ID: {student.id.substring(0, 8)}</p>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="p-4 flex-1 min-w-[200px]">{student.email}</div>
                                  <div className="p-4 flex-1 min-w-[150px]">{student.program_name || "Not assigned"}</div>
                                  <div className="p-4 flex-1 min-w-[150px]">{student.enrollment_date ? new Date(student.enrollment_date).toLocaleDateString() : "N/A"}</div>
                                  <div className="p-4 flex-1 min-w-[80px]">{student.class_count}</div>
                                  <div className="p-4 flex-1 min-w-[100px]">
                                    <Badge
                                      variant="outline"
                                      className={
                                        student.status === 'ACTIVE'
                                          ? "bg-green-50 text-green-700"
                                          : student.status === 'PENDING'
                                          ? "bg-yellow-50 text-yellow-700"
                                          : "bg-gray-50 text-gray-700"
                                      }
                                    >
                                      {student.status}
                                    </Badge>
                                  </div>
                                  <div className="p-4 text-right flex-1 min-w-[200px]">
                                    <div className="flex justify-end gap-2">
                                      <Button variant="ghost" size="sm" asChild>
                                        <Link href={`/admin/campus/students/${student.id}`}>
                                          View
                                        </Link>
                                      </Button>
                                      <Button variant="ghost" size="sm" asChild>
                                        <Link href={`/admin/campus/students/${student.id}/enroll`}>
                                          Enroll
                                        </Link>
                                      </Button>
                                      <Button variant="ghost" size="icon" asChild>
                                        <Link href={`/admin/campus/students/${student.id}/actions`}>
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Link>
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                            );
                          })}
                        </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {filteredStudents.length === 0 && !loading && (
                  <div className="p-8 text-center text-muted-foreground">
                    No students found matching your filters
                  </div>
                )}

                {isFetchingNextPage && (
                  <div className="p-4 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-2">Loading more students...</p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between py-4">
              <div className="text-sm text-muted-foreground">
                Showing {filteredStudents.length} of {totalCount} students
              </div>
              <div className="text-sm">
                Page {page}
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              {/* Similar virtualized table for pending students */}
              <div className="text-center py-10">
                <p className="text-muted-foreground">
                  {filteredStudents.filter(s => s.status === 'PENDING').length === 0
                    ? "No pending students"
                    : `${filteredStudents.filter(s => s.status === 'PENDING').length} pending students`}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inactive" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              {/* Similar virtualized table for inactive students */}
              <div className="text-center py-10">
                <p className="text-muted-foreground">
                  {filteredStudents.filter(s => s.status === 'INACTIVE').length === 0
                    ? "No inactive students"
                    : `${filteredStudents.filter(s => s.status === 'INACTIVE').length} inactive students`}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-10 pt-8 border-t border-gray-200">
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold">Maintenance Actions</h3>
          <p className="text-sm text-muted-foreground">These actions are for system maintenance and fixing legacy data issues.</p>
          <div className="flex gap-2">
            <FixStudentsCampusAccess campusId={campus?.id} />
          </div>
        </div>
      </div>
    </div>
  );
}