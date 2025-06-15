"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/atoms/skeleton";
import Link from "next/link";
import { ChevronLeft, Plus } from "lucide-react";
import { format } from "date-fns";
import { SystemStatus } from "@/server/api/constants";

// Define the Assessment type based on your API response
interface Assessment {
  id: string;
  title: string;
  status: SystemStatus;
  institutionId: string;
  createdAt: Date;
  updatedAt: Date;
  dueDate: Date | null;
  maxScore: number | null;
  passingScore: number | null;
  weightage: number | null;
  gradingConfig: any | null;
  rubric: any | null;
  createdById: string;
  updatedById: string | null;
  deletedAt: Date | null;
  policyId: string | null;
  class: {
    id: string;
    name: string;
  };
  subject: {
    id: string;
    code: string;
    name: string;
  };
  _count: {
    submissions: number;
  };
}

const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status.toLowerCase()) {
    case "open":
      return "default";
    case "closed":
      return "secondary";
    case "overdue":
      return "destructive";
    default:
      return "outline";
  }
};

export default function TeacherAssessmentsPage() {
  const { data: session } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/api/auth/signin");
    },
  });

  const teacherId = session?.user?.id;
  const [selectedTab, setSelectedTab] = useState<string>("all");

  if (!teacherId) {
    return null;
  }

  const { data: assessmentsData, isLoading } = api.assessment.list.useQuery({ 
    status: SystemStatus.ACTIVE
  });

  const assessments = (assessmentsData?.items || []) as unknown as Assessment[];
  
  const upcomingAssessments = assessments.filter((assessment) => {
    return assessment.dueDate && new Date(assessment.dueDate) > new Date();
  });
  
  const pastAssessments = assessments.filter((assessment) => {
    return assessment.dueDate && new Date(assessment.dueDate) <= new Date();
  });

  if (isLoading) {
    return (
      <div className="container py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <Skeleton className="h-12 w-full mb-4" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[180px] w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader
          title="Assessments"
          description="Manage your class assessments"
        />
        <div className="flex gap-2">
          <Link href="/teacher/dashboard">
            <Button variant="outline" size="sm">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <Link href="/teacher/assessments/create">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Create Assessment
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="all" onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="all">All Assessments</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          {!assessments || assessments.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-500">No assessments found. Create your first assessment to get started.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assessments.map((assessment) => (
                <AssessmentCard key={assessment.id} assessment={assessment} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="upcoming" className="mt-6">
          {upcomingAssessments.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-500">No upcoming assessments found.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingAssessments.map((assessment) => (
                <AssessmentCard key={assessment.id} assessment={assessment} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="past" className="mt-6">
          {pastAssessments.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-500">No past assessments found.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastAssessments.map((assessment) => (
                <AssessmentCard key={assessment.id} assessment={assessment} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface AssessmentCardProps {
  assessment: Assessment;
}

function AssessmentCard({ assessment }: AssessmentCardProps) {
  return (
    <Link href={`/teacher/assessments/${assessment.id}`}>
      <Card className="hover:bg-accent/5 transition-colors">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">{assessment.title}</CardTitle>
            <Badge variant={getStatusVariant(assessment.status)}>
              {assessment.status}
            </Badge>
          </div>
          <CardDescription>
            {assessment.subject.code} - {assessment.subject.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Class:</span>
              <span>{assessment.class.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Due Date:</span>
              <span>{assessment.dueDate ? format(new Date(assessment.dueDate), 'PPP') : 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Max Score:</span>
              <span>{assessment.maxScore ?? 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Submissions:</span>
              <span>{assessment._count.submissions}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
} 