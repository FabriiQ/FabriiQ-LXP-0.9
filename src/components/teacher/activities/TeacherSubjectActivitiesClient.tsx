'use client';

import { useRouter } from 'next/navigation';
import { TeacherSubjectActivitiesView } from './TeacherSubjectActivitiesView';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Plus } from 'lucide-react';
import Link from 'next/link';

interface TeacherSubjectActivitiesClientProps {
  classId: string;
  className: string;
  subjects: {
    id: string;
    name: string;
    code?: string;
  }[];
}

export function TeacherSubjectActivitiesClient({
  classId,
  className,
  subjects
}: TeacherSubjectActivitiesClientProps) {
  const router = useRouter();
  
  const handleBack = () => {
    router.push('/teacher/classes');
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold">{className}</h1>
            <p className="text-muted-foreground">Activities</p>
          </div>
        </div>
        
        <Button asChild>
          <Link href={`/teacher/classes/${classId}/activities/create`}>
            <Plus className="h-4 w-4 mr-2" />
            Create Activity
          </Link>
        </Button>
      </div>
      
      <TeacherSubjectActivitiesView
        classId={classId}
        subjects={subjects}
      />
    </div>
  );
}
