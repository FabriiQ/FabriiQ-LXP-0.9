'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, ChevronRight, Users, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/atoms/skeleton";
import { useResponsive } from '@/lib/hooks/use-responsive';

interface Class {
  id: string;
  name: string;
  code: string;
  courseName: string;
  campusName: string;
  termName?: string;
  studentCount?: number;
  teacherCount?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
}

interface MobileClassListProps {
  classes: Class[];
  isLoading?: boolean;
  campusId?: string;
  programId?: string;
}

export function MobileClassList({
  classes,
  isLoading = false,
  campusId,
  programId
}: MobileClassListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const { isMobile } = useResponsive();
  
  if (!isMobile) {
    return null; // Only render on mobile
  }

  // Filter classes based on search query
  const filteredClasses = classes.filter(cls => 
    cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.courseName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleClassClick = (classId: string) => {
    let basePath = '/admin/coordinator/classes';
    if (programId) {
      basePath = `/admin/coordinator/programs/${programId}/classes`;
    } else if (campusId) {
      basePath = `/admin/coordinator/campus/${campusId}/classes`;
    }
    router.push(`${basePath}/${classId}`);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          type="search"
          placeholder="Search classes..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No classes found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredClasses.map((cls) => (
            <Card 
              key={cls.id} 
              className="overflow-hidden"
              onClick={() => handleClassClick(cls.id)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-sm">{cls.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {cls.code} • {cls.courseName}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
                
                <div className="mt-3 flex flex-wrap gap-2">
                  {cls.status && (
                    <Badge variant={cls.status === 'ACTIVE' ? 'success' : 'secondary'} className="text-xs">
                      {cls.status}
                    </Badge>
                  )}
                  
                  {cls.termName && (
                    <Badge variant="outline" className="text-xs">
                      {cls.termName}
                    </Badge>
                  )}
                </div>
                
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {cls.studentCount !== undefined && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Users className="h-3 w-3 mr-1" />
                      {cls.studentCount} {cls.studentCount === 1 ? 'Student' : 'Students'}
                    </div>
                  )}
                  
                  {cls.startDate && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(cls.startDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
