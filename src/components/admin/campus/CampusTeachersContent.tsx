'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, Filter, Plus, Upload, Mail, Phone } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DataTable } from "@/components/ui/data-display/data-table";
import { useRouter } from 'next/navigation';

interface CampusTeachersContentProps {
  campus: {
    id: string;
    name: string;
    code: string;
    status: string;
  };
  searchParams: {
    search?: string;
  };
  isCoordinator?: boolean;
}

export function CampusTeachersContent({
  campus,
  searchParams,
  isCoordinator = false
}: CampusTeachersContentProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(searchParams.search || '');
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const basePath = isCoordinator ? '/admin/coordinator' : '/admin/campus';

  // Define columns for the data table
  const teacherColumns = [
    {
      accessorKey: "name",
      header: "Teacher Name",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>{getInitials(row.original.name)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{row.original.name}</div>
            <div className="text-sm text-muted-foreground">{row.original.email}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "specialization",
      header: "Specialization",
    },
    {
      accessorKey: "contact",
      header: "Contact",
      cell: ({ row }: any) => (
        <div className="space-y-1">
          <div className="flex items-center text-sm">
            <Mail className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
            <span>{row.original.email}</span>
          </div>
          {row.original.phone && (
            <div className="flex items-center text-sm">
              <Phone className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
              <span>{row.original.phone}</span>
            </div>
          )}
        </div>
      ),
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
          <Link href={`${basePath}/teachers/${row.original.id}`}>
            View
          </Link>
        </Button>
      ),
    },
  ];

  // Fetch teachers data
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        // In a real implementation, this would be an API call
        // For now, we'll use mock data
        const mockTeachers = [
          {
            id: "1",
            name: "John Smith",
            email: "john.smith@example.com",
            phone: "+1 (555) 123-4567",
            specialization: "Mathematics",
            classCount: 4,
            status: "ACTIVE"
          },
          {
            id: "2",
            name: "Sarah Johnson",
            email: "sarah.johnson@example.com",
            phone: "+1 (555) 234-5678",
            specialization: "English Literature",
            classCount: 3,
            status: "ACTIVE"
          },
          {
            id: "3",
            name: "Michael Brown",
            email: "michael.brown@example.com",
            phone: "+1 (555) 345-6789",
            specialization: "Physics",
            classCount: 2,
            status: "ACTIVE"
          },
          {
            id: "4",
            name: "Emily Davis",
            email: "emily.davis@example.com",
            phone: "+1 (555) 456-7890",
            specialization: "History",
            classCount: 5,
            status: "INACTIVE"
          },
          {
            id: "5",
            name: "David Wilson",
            email: "david.wilson@example.com",
            phone: "+1 (555) 567-8901",
            specialization: "Computer Science",
            classCount: 3,
            status: "ACTIVE"
          }
        ];

        setTeachers(mockTeachers);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching teachers:", error);
        setLoading(false);
      }
    };

    fetchTeachers();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);

    router.push(`${basePath}/teachers?${params.toString()}`);
  };

  // Helper function to get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Filter teachers based on search
  const filteredTeachers = teachers.filter(teacher => {
    return !searchQuery ||
      teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (teacher.specialization && teacher.specialization.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teacher Management</h1>
          <p className="text-muted-foreground">Manage teachers at {campus.name}</p>
        </div>
        {!isCoordinator && (
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`${basePath}/teachers/import`}>
                <Upload className="mr-2 h-4 w-4" /> Import
              </Link>
            </Button>
            <Button asChild>
              <Link href={`${basePath}/teachers/new`}>
                <Plus className="mr-2 h-4 w-4" /> Add Teacher
              </Link>
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Teacher Management</CardTitle>
          <CardDescription>View and manage teachers for your campus</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search teachers..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" type="submit">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </form>

          <DataTable
            columns={teacherColumns}
            data={filteredTeachers}
            pagination
            loading={loading}
          />
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {filteredTeachers.length} teachers
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
