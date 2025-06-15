'use client';

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen,
  Users,
  Building,
  Calendar,
  Clock,
  FileText,
  Search,
  ArrowUpDown,
  ChevronLeft
} from "lucide-react";
import { useRouter } from "next/navigation";
import { SystemStatus } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/forms/select";
import { LoadingSpinner } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";

interface Course {
  id: string;
  name: string;
  code: string;
  description: string | null;
  level: number;
  credits: number;
  status: SystemStatus;
  campusOfferings: {
    id: string;
    campusId: string;
    campus: {
      id: string;
      name: string;
      code: string;
    };
  }[];
  _count: {
    subjects: number;
  };
}

interface CoordinatorProgramCoursesProps {
  programId: string;
  programName: string;
  courses: Course[];
  isLoading?: boolean;
  campuses?: {
    id: string;
    name: string;
    code: string;
  }[];
}

export function CoordinatorProgramCourses({ 
  programId, 
  programName, 
  courses, 
  isLoading = false,
  campuses = []
}: CoordinatorProgramCoursesProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("ALL");
  const [campusFilter, setCampusFilter] = useState<string>("ALL");
  const [sortField, setSortField] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!courses || courses.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={() => router.push(`/admin/coordinator/programs/${programId}`)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{programName} - Courses</h1>
        </div>
        
        <EmptyState
          title="No Courses"
          description="This program doesn't have any courses yet."
          icon={<BookOpen className="h-10 w-10" />}
        />
      </div>
    );
  }

  // Filter courses based on search term and filters
  const filteredCourses = courses.filter(course => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      course.name.toLowerCase().includes(searchLower) ||
      course.code.toLowerCase().includes(searchLower) ||
      (course.description && course.description.toLowerCase().includes(searchLower));
    
    const matchesLevel = levelFilter === "ALL" || course.level.toString() === levelFilter;
    
    const matchesCampus = campusFilter === "ALL" || 
      course.campusOfferings.some(offering => offering.campusId === campusFilter);
    
    return matchesSearch && matchesLevel && matchesCampus;
  });

  // Sort courses
  const sortedCourses = [...filteredCourses].sort((a, b) => {
    let valueA, valueB;

    switch (sortField) {
      case "name":
        valueA = a.name;
        valueB = b.name;
        break;
      case "code":
        valueA = a.code;
        valueB = b.code;
        break;
      case "level":
        valueA = a.level;
        valueB = b.level;
        break;
      case "credits":
        valueA = a.credits;
        valueB = b.credits;
        break;
      case "subjects":
        valueA = a._count.subjects;
        valueB = b._count.subjects;
        break;
      default:
        valueA = a.name;
        valueB = b.name;
    }

    if (valueA < valueB) return sortOrder === "asc" ? -1 : 1;
    if (valueA > valueB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Get unique levels for filtering
  const levels = Array.from(new Set(courses.map(course => course.level))).sort();

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon" onClick={() => router.push(`/admin/coordinator/programs/${programId}`)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">{programName} - Courses</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course Management</CardTitle>
          <CardDescription>
            Manage courses for the {programName} program
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search courses..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="w-full md:w-40">
              <Select
                value={levelFilter}
                onValueChange={(value) => setLevelFilter(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Levels</SelectItem>
                  {levels.map(level => (
                    <SelectItem key={level} value={level.toString()}>
                      Level {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {campuses.length > 0 && (
              <div className="w-full md:w-40">
                <Select
                  value={campusFilter}
                  onValueChange={(value) => setCampusFilter(value)}
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
          </div>

          <div className="rounded-md border">
            <div className="grid grid-cols-12 bg-muted p-3 text-sm font-medium">
              <div className="col-span-5 flex items-center cursor-pointer" onClick={() => handleSort("name")}>
                <span>Course Name</span>
                <ArrowUpDown className={`ml-1 h-4 w-4 ${sortField === "name" ? "opacity-100" : "opacity-40"}`} />
              </div>
              <div className="col-span-2 flex items-center cursor-pointer" onClick={() => handleSort("code")}>
                <span>Code</span>
                <ArrowUpDown className={`ml-1 h-4 w-4 ${sortField === "code" ? "opacity-100" : "opacity-40"}`} />
              </div>
              <div className="col-span-1 flex items-center cursor-pointer" onClick={() => handleSort("level")}>
                <span>Level</span>
                <ArrowUpDown className={`ml-1 h-4 w-4 ${sortField === "level" ? "opacity-100" : "opacity-40"}`} />
              </div>
              <div className="col-span-1 flex items-center cursor-pointer" onClick={() => handleSort("credits")}>
                <span>Credits</span>
                <ArrowUpDown className={`ml-1 h-4 w-4 ${sortField === "credits" ? "opacity-100" : "opacity-40"}`} />
              </div>
              <div className="col-span-2 flex items-center cursor-pointer" onClick={() => handleSort("subjects")}>
                <span>Subjects</span>
                <ArrowUpDown className={`ml-1 h-4 w-4 ${sortField === "subjects" ? "opacity-100" : "opacity-40"}`} />
              </div>
              <div className="col-span-1 text-right">Actions</div>
            </div>
            
            {sortedCourses.length > 0 ? (
              sortedCourses.map((course) => (
                <div key={course.id} className="grid grid-cols-12 p-3 text-sm border-t">
                  <div className="col-span-5">
                    <div className="font-medium">{course.name}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-xs">
                      {course.description || "No description available"}
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <Badge variant="outline">{course.code}</Badge>
                  </div>
                  <div className="col-span-1 flex items-center">{course.level}</div>
                  <div className="col-span-1 flex items-center">{course.credits}</div>
                  <div className="col-span-2 flex items-center">{course._count.subjects}</div>
                  <div className="col-span-1 flex justify-end">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => router.push(`/admin/coordinator/courses/${course.id}`)}
                    >
                      View
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                No courses match your filters
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
