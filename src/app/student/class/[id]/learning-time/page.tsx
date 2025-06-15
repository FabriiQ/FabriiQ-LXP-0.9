'use client';

import { useParams } from 'next/navigation';
import { Clock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LearningTimeAnalytics } from '@/components/student/LearningTimeAnalytics';
import Link from 'next/link';
import { api } from '@/trpc/react';

/**
 * Dedicated page for learning time analytics
 */
export default function LearningTimePage() {
  const params = useParams();
  const classId = params?.id as string || "";
  
  // Fetch class details
  const { data: classData } = api.student.getClassDetails.useQuery(
    { classId },
    {
      enabled: !!classId,
      retry: 1
    }
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center">
            <Link href={`/student/class/${classId}/dashboard`}>
              <Button variant="ghost" size="icon" className="mr-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Learning Time Analytics</h1>
          </div>
          <p className="text-muted-foreground">
            Track and analyze your learning time investment
          </p>
        </div>
        <Clock className="h-8 w-8 text-primary" />
      </div>
      
      {/* Class info */}
      {classData && (
        <div className="text-sm text-muted-foreground">
          <span className="font-medium">{classData.className}</span>
          {classData.courseName && (
            <span> • {classData.courseName}</span>
          )}
          {classData.termName && (
            <span> • {classData.termName}</span>
          )}
        </div>
      )}
      
      {/* Main content */}
      <div className="grid grid-cols-1 gap-6">
        <LearningTimeAnalytics classId={classId} />
        
        {/* Learning time insights */}
        <div className="bg-muted/30 p-6 rounded-lg">
          <h2 className="text-lg font-medium mb-4">Learning Time Insights</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Consistent Learning</h3>
                <p className="text-sm text-muted-foreground">
                  Research shows that consistent, spaced learning is more effective than cramming. 
                  Aim for regular study sessions of 25-45 minutes with short breaks.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Quality Over Quantity</h3>
                <p className="text-sm text-muted-foreground">
                  Focus on the quality of your study time, not just the quantity. 
                  Deep, focused learning with minimal distractions leads to better retention.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Varied Learning Activities</h3>
                <p className="text-sm text-muted-foreground">
                  Engage with different types of learning activities to strengthen neural connections.
                  Mix reading, practice exercises, and interactive content for optimal learning.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
