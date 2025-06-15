'use client';

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen,
  Users,
  Building,
  Calendar,
  Search,
  ArrowUpDown,
  GraduationCap
} from "lucide-react";
import { useRouter } from "next/navigation";
import { SystemStatus } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/forms/select";
import { LoadingSpinner } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";

interface Class {
  id: string;
  name: string;
  code: string;
  courseName: string;
  campusName: string;
  termName: string;
  studentsCount: number;
  status: SystemStatus;
}

interface CoordinatorClassListProps {
  classes: Class[];
  isLoading?: boolean;
  campuses?: { id: string; name: string }[];
  onCampusChange?: (campusId: string) => void;
  selectedCampusId?: string;
}

export function CoordinatorClassList({ 
  classes, 
  isLoading = false,
  campuses = [],
  onCampusChange,
  selectedCampusId
}: CoordinatorClassListProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!classes || classes.length === 0) {
    return (
      <EmptyState
        title="No Classes Found"
        description="There are no classes available for your assigned programs."
        icon={<GraduationCap className="h-10 w-10" />}
      />
    );
  }

  // Filter classes based on search term
  const filteredClasses = classes.filter(cls => 
    cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.campusName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort classes
  const sortedClasses = [...filteredClasses].sort((a, b) => {
    let aValue = a[sortField as keyof Class];
    let bValue = b[sortField as keyof Class];
    
    // Handle string comparison
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Toggle sort order
  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative w-full md:w-auto md:flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search classes..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {campuses && campuses.length > 0 && (
          <div className="w-full md:w-auto">
            <Select
              value={selectedCampusId || "all"}
              onValueChange={(value) => onCampusChange && onCampusChange(value === "all" ? "" : value)}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Select Campus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campuses</SelectItem>
                {campuses.map((campus) => (
                  <SelectItem key={campus.id} value={campus.id}>
                    {campus.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {sortedClasses.map((cls) => (
          <Card key={cls.id} className="overflow-hidden">
            <CardHeader className="bg-muted/50">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{cls.name}</CardTitle>
                  <CardDescription className="text-sm mt-1">
                    Code: {cls.code} | Course: {cls.courseName} | Campus: {cls.campusName}
                  </CardDescription>
                </div>
                <Button
                  variant="default"
                  onClick={() => router.push(`/admin/coordinator/classes/${cls.id}`)}
                >
                  View Class
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Term: {cls.termName}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Students: {cls.studentsCount}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={cls.status === 'ACTIVE' ? 'success' : 'secondary'}>
                    {cls.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
