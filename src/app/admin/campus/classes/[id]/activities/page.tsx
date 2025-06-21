'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/core/button';
import { PageLayout } from '@/components/layout/page-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/forms/select';
import { Plus } from 'lucide-react';
import { ArrowLeft } from '@/components/ui/icons';
import { useToast } from '@/components/ui/feedback/toast';
import { api } from '@/trpc/react';
import { ActivityPurpose, LearningActivityType, AssessmentType, SystemStatus } from '@prisma/client';
import { DataTable } from '@/components/ui/data-display/data-table';
import { Badge } from '@/components/ui/data-display/badge';
import { ActivityLessonPlanFilter } from '@/components/shared/entities/activities/ActivityLessonPlanFilter';

export default function ClassActivitiesPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const classId = params?.id as string;

  const [purpose, setPurpose] = useState<ActivityPurpose | 'ALL'>('ALL');
  const [learningType, setLearningType] = useState<LearningActivityType | 'ALL'>('ALL');
  const [assessmentType, setAssessmentType] = useState<AssessmentType | 'ALL'>('ALL');
  const [status, setStatus] = useState<SystemStatus>('ACTIVE');
  const [lessonPlanId, setLessonPlanId] = useState<string | null>(searchParams.get('lessonPlanId'));

  const { data: classData } = api.class.getById.useQuery({
    classId,
    include: {
      students: false,
      teachers: true,
      classTeacher: {
        include: {
          user: true
        }
      }
    }
  });

  const { data: activities, isLoading } = api.activity.list.useQuery({
    classId,
    purpose: purpose === 'ALL' ? undefined : purpose,
    learningType: learningType === 'ALL' ? undefined : learningType,
    assessmentType: assessmentType === 'ALL' ? undefined : assessmentType,
    status,
    lessonPlanId: lessonPlanId || undefined,
    page: 1,
    pageSize: 50
  });

  const columns = [
    {
      header: 'Title',
      accessorKey: 'title',
      cell: ({ row }: any) => (
        <Link
          href={`/admin/campus/classes/${classId}/activities/${row.original.id}`}
          className="text-primary hover:underline"
        >
          {row.original.title}
        </Link>
      ),
    },
    {
      header: 'Purpose',
      accessorKey: 'purpose',
      cell: ({ row }: any) => (
        <Badge className="border border-gray-200 bg-transparent text-gray-800">
          {row.original.purpose}
        </Badge>
      ),
    },
    {
      header: 'Type',
      accessorKey: 'type',
      cell: ({ row }: any) => {
        if (row.original.purpose === 'LEARNING' && row.original.learningType) {
          return <Badge className="bg-secondary/10 text-secondary">{row.original.learningType}</Badge>;
        } else if (row.original.purpose === 'ASSESSMENT' && row.original.assessmentType) {
          return <Badge className="bg-secondary/10 text-secondary">{row.original.assessmentType}</Badge>;
        }
        return null;
      },
    },
    {
      header: 'Gradable',
      accessorKey: 'isGradable',
      cell: ({ row }: any) => (
        row.original.isGradable ? 'Yes' : 'No'
      ),
    },
    {
      header: 'Max Score',
      accessorKey: 'maxScore',
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }: any) => (
        <Badge className={row.original.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-secondary/10 text-secondary'}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      cell: ({ row }: any) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link href={`/admin/campus/classes/${classId}/activities/${row.original.id}`}>
              View
            </Link>
          </Button>
          {row.original.isGradable && (
            <Button size="sm" variant="outline" asChild>
              <Link href={`/admin/campus/classes/${classId}/activities/${row.original.id}/grades`}>
                Grades
              </Link>
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <PageLayout
      title={`Activities: ${classData?.name || ''}`}
      description="Manage class activities"
      breadcrumbs={[
        { label: 'Classes', href: '/admin/campus/classes' },
        { label: classData?.name || 'Class', href: `/admin/campus/classes/${classId}` },
        { label: 'Activities', href: '#' },
      ]}
      actions={
        <>
          <Button asChild variant="outline" className="mr-2">
            <Link href={`/admin/campus/classes/${classId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Class
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/admin/campus/classes/${classId}/activities/new`}>
              <Plus className="h-4 w-4 mr-2" />
              New Activity
            </Link>
          </Button>
        </>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6 flex-wrap">
            <div className="w-48">
              <Select
                value={purpose}
                onValueChange={(value) => setPurpose(value as ActivityPurpose | 'ALL')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by purpose" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Purposes</SelectItem>
                  {Object.values(ActivityPurpose).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {purpose === 'LEARNING' || purpose === 'ALL' ? (
              <div className="w-48">
                <Select
                  value={learningType}
                  onValueChange={(value) => setLearningType(value as LearningActivityType | 'ALL')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Learning Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Types</SelectItem>
                    {Object.values(LearningActivityType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {purpose === 'ASSESSMENT' || purpose === 'ALL' ? (
              <div className="w-48">
                <Select
                  value={assessmentType}
                  onValueChange={(value) => setAssessmentType(value as AssessmentType | 'ALL')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Assessment Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Types</SelectItem>
                    {Object.values(AssessmentType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <div className="w-48">
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as SystemStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(SystemStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-48">
              <ActivityLessonPlanFilter
                classId={classId}
                onFilterChange={(value) => setLessonPlanId(value)}
              />
            </div>
          </div>

          <DataTable
            columns={columns}
            data={activities?.items || []}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </PageLayout>
  );
}