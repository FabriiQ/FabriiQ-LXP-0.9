'use client';

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users,
  Building,
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  Mail
} from "lucide-react";
import { useRouter } from "next/navigation";
import { SystemStatus } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/forms/select";
import { LoadingSpinner } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Pagination } from "@/components/ui/pagination";

interface Student {
  id: string;
  student: {
    id: string;
    enrollmentNumber: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
  programCampus: {
    id: string;
    campus: {
      id: string;
      name: string;
      code: string;
    };
    program: {
      id: string;
      name: string;
      code: string;
    };
  };
  status: SystemStatus;
  createdAt: Date;
}

interface CoordinatorProgramStudentsProps {
  programId: string;
  programName: string;
  students: Student[];
  total: number;
  page: number;
  pageSize: number;
  isLoading?: boolean;
  campuses?: {
    id: string;
    name: string;
    code: string;
  }[];
  onPageChange: (page: number) => void;
  onSearch: (search: string) => void;
  onCampusFilter: (campusId: string) => void;
}

export function CoordinatorProgramStudents({ 
  programId, 
  programName, 
  students, 
  total,
  page,
  pageSize,
  isLoading = false,
  campuses = [],
  onPageChange,
  onSearch,
  onCampusFilter
}: CoordinatorProgramStudentsProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [campusFilter, setCampusFilter] = useState<string>("ALL");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSearch = () => {
    onSearch(searchTerm);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleCampusChange = (value: string) => {
    setCampusFilter(value);
    onCampusFilter(value === "ALL" ? "" : value);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon" onClick={() => router.push(`/admin/coordinator/programs/${programId}`)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">{programName} - Students</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Management</CardTitle>
          <CardDescription>
            Manage students enrolled in the {programName} program
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search students by name, email, or enrollment number..."
                className="pl-8"
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyPress={handleKeyPress}
              />
            </div>
            
            <Button variant="outline" onClick={handleSearch}>
              Search
            </Button>
            
            {campuses.length > 0 && (
              <div className="w-full md:w-40">
                <Select
                  value={campusFilter}
                  onValueChange={handleCampusChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Campus" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Campuses</SelectItem>
                    {campuses.map(campus => (
                      <SelectItem key={campus.id} value={campus.id}>
                        {campus.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <Button variant="outline" className="md:ml-auto">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          {students.length > 0 ? (
            <div className="rounded-md border">
              <div className="grid grid-cols-12 bg-muted p-3 text-sm font-medium">
                <div className="col-span-4">Student</div>
                <div className="col-span-2">Enrollment #</div>
                <div className="col-span-3">Campus</div>
                <div className="col-span-2">Enrollment Date</div>
                <div className="col-span-1 text-right">Actions</div>
              </div>
              
              {students.map((enrollment) => (
                <div key={enrollment.id} className="grid grid-cols-12 p-3 text-sm border-t">
                  <div className="col-span-4 flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" alt={enrollment.student.user.name || ""} />
                      <AvatarFallback>
                        {enrollment.student.user.name?.charAt(0) || "S"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{enrollment.student.user.name}</div>
                      <div className="text-xs text-muted-foreground">{enrollment.student.user.email}</div>
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <Badge variant="outline">{enrollment.student.enrollmentNumber}</Badge>
                  </div>
                  <div className="col-span-3 flex items-center">
                    <div className="flex items-center space-x-1">
                      <Building className="h-3 w-3 text-muted-foreground" />
                      <span>{enrollment.programCampus.campus.name}</span>
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center">
                    {new Date(enrollment.createdAt).toLocaleDateString()}
                  </div>
                  <div className="col-span-1 flex justify-end space-x-1">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      title="View Student Profile"
                      onClick={() => router.push(`/admin/coordinator/students/${enrollment.student.id}`)}
                    >
                      <Users className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      title="Contact Student"
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No Students Found"
              description={
                searchTerm 
                  ? "No students match your search criteria" 
                  : "No students are enrolled in this program"
              }
              icon={<Users className="h-10 w-10" />}
            />
          )}

          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
