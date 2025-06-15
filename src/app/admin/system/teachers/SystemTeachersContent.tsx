'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/atoms/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { EyeIcon, BookOpenIcon, PhoneIcon, MailIcon, MapPinIcon, RefreshCw } from 'lucide-react';
import { api } from '@/trpc/react';

interface SystemTeachersContentProps {
  activeTab: string;
}

export function SystemTeachersContent({ activeTab }: SystemTeachersContentProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [campusId, setCampusId] = useState<string | undefined>(undefined);

  // Convert activeTab to status for API
  const getStatusFromTab = (tab: string) => {
    switch (tab) {
      case 'active': return 'ACTIVE';
      case 'inactive': return 'INACTIVE';
      default: return 'ALL';
    }
  };

  // Fetch teachers data
  const {
    data,
    isLoading: loading,
    refetch
  } = api.systemAnalytics.getSystemTeachers.useQuery({
    status: getStatusFromTab(activeTab),
    campusId,
    search,
    skip: 0,
    take: 12
  }, {
    keepPreviousData: true,
    refetchOnWindowFocus: false
  });

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  // Teachers data
  const teachers = data?.teachers || [];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="overflow-hidden">
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
        ))}
      </div>
    );
  }

  if (teachers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
        <BookOpenIcon className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No teachers found</h3>
        <p className="text-sm text-gray-500 mt-1">
          {activeTab !== 'all'
            ? `No ${activeTab.toLowerCase()} teachers found. Try selecting a different filter.`
            : "No teachers have been created yet."}
        </p>
        <div className="mt-4">
          <Button asChild>
            <Link href="/admin/system/teachers/create">Create Teacher</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {teachers.map((teacher) => (
        <Card key={teacher.id} className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={teacher.avatar || `https://avatar.vercel.sh/${teacher.name || 'unknown'}`} alt={teacher.name || 'Teacher'} />
                <AvatarFallback>{(teacher.name || 'UN').substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-base">{teacher.name}</CardTitle>
                <CardDescription>{teacher.specialization}</CardDescription>
              </div>
              <Badge className="ml-auto" variant={
                teacher.status === 'ACTIVE' ? 'success' : 'secondary'
              }>
                {teacher.status.charAt(0) + teacher.status.slice(1).toLowerCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <MapPinIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{teacher.campus?.name || 'No Campus Assigned'}</span>
              </div>
              <div className="flex items-center">
                <MailIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{teacher.email}</span>
              </div>
              <div className="flex items-center">
                <PhoneIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{teacher.phone}</span>
              </div>
              <div className="flex items-center">
                <BookOpenIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{teacher.classCount} {teacher.classCount === 1 ? 'Class' : 'Classes'}, {teacher.subjectCount} {teacher.subjectCount === 1 ? 'Subject' : 'Subjects'}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href={`/admin/system/teachers/${teacher.id}`}>
                <EyeIcon className="h-4 w-4 mr-2" />
                View Profile
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
