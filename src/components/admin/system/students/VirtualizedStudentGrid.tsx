'use client';

import { useRef, useState, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/data-display/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { Eye, BookOpen, GraduationCap, Calendar, MapPin } from 'lucide-react';

// Types
interface Student {
  id: string;
  userId: string;
  name: string;
  email: string;
  status: string;
  enrollmentDate: Date;
  enrollmentNumber?: string;
  campus?: {
    id: string;
    name: string;
  } | null;
  program?: {
    id: string;
    name: string;
  } | null;
  classCount: number;
  avatar?: string | null;
  studentProfileId?: string;
}

interface VirtualizedStudentGridProps {
  students: Student[];
  isLoading?: boolean;
  containerHeight?: number | string;
  columnCount?: number;
  estimatedRowHeight?: number;
  overscan?: number;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export function VirtualizedStudentGrid({
  students,
  isLoading = false,
  containerHeight = 800,
  columnCount: initialColumnCount = 3,
  estimatedRowHeight = 320,
  overscan = 5,
  hasMore = false,
  onLoadMore
}: VirtualizedStudentGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [columnCount, setColumnCount] = useState(initialColumnCount);

  // Adjust column count based on screen size
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setColumnCount(1);
      } else if (width < 1024) {
        setColumnCount(2);
      } else {
        setColumnCount(initialColumnCount);
      }
    };

    handleResize(); // Initial call
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initialColumnCount]);

  // Calculate number of rows based on students and column count
  const rowCount = Math.ceil(students.length / columnCount);

  // Set up virtualization
  const rowVirtualizer = useVirtualizer({
    count: isLoading ? 3 : rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimatedRowHeight,
    overscan,
  });

  // Handle intersection observer for infinite loading
  useEffect(() => {
    if (!hasMore || !onLoadMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    const loadMoreTrigger = document.getElementById('load-more-trigger');
    if (loadMoreTrigger) {
      observer.observe(loadMoreTrigger);
    }

    return () => {
      if (loadMoreTrigger) {
        observer.unobserve(loadMoreTrigger);
      }
    };
  }, [hasMore, onLoadMore, isLoading]);

  // Render a skeleton card
  const renderSkeleton = () => (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24 mt-1" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );

  // Render a student card
  const renderStudentCard = (student: Student) => (
    <Card key={student.id} className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={student.avatar || `https://avatar.vercel.sh/${student.name}`} alt={student.name} />
            <AvatarFallback>{student.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-base">{student.name}</CardTitle>
            <CardDescription>{student.email}</CardDescription>
          </div>
          <Badge className="ml-auto" variant={
            student.status === 'ACTIVE' ? 'success' :
            student.status === 'INACTIVE' ? 'warning' :
            'secondary'
          }>
            {student.status.charAt(0) + student.status.slice(1).toLowerCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          {student.campus && (
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>{student.campus.name}</span>
            </div>
          )}
          {student.program && (
            <div className="flex items-center">
              <GraduationCap className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>{student.program.name}</span>
            </div>
          )}
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>Enrolled: {new Date(student.enrollmentDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center">
            <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{student.classCount} {student.classCount === 1 ? 'Class' : 'Classes'}</span>
          </div>
          {student.enrollmentNumber && (
            <div className="flex items-center">
              <GraduationCap className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>ID: {student.enrollmentNumber}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link href={`/admin/system/students/${student.id}`}>
            <Eye className="h-4 w-4 mr-2" />
            View Profile
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );

  // Render a row of student cards
  const renderRow = (rowIndex: number) => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {Array.from({ length: columnCount }).map((_, colIndex) => (
            <div key={colIndex}>
              {renderSkeleton()}
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
        {Array.from({ length: columnCount }).map((_, colIndex) => {
          const studentIndex = rowIndex * columnCount + colIndex;
          if (studentIndex >= students.length) return null;
          return (
            <div key={colIndex}>
              {renderStudentCard(students[studentIndex])}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      ref={parentRef}
      style={{
        height: typeof containerHeight === 'number' ? `${containerHeight}px` : containerHeight,
        overflow: 'auto'
      }}
      className="w-full"
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.index}
            data-index={virtualRow.index}
            className="absolute top-0 left-0 w-full"
            style={{
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
              padding: '0.5rem 0',
            }}
          >
            {renderRow(virtualRow.index)}
          </div>
        ))}
      </div>

      {/* Load more trigger element */}
      {hasMore && (
        <div id="load-more-trigger" className="h-10 w-full flex items-center justify-center">
          {isLoading ? (
            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default VirtualizedStudentGrid;
