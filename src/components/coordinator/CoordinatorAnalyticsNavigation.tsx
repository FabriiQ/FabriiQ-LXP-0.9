'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { useOfflineStorage } from '@/features/coordinator/offline/hooks/use-offline-storage';
import { ProgramAnalyticsDashboard } from '@/components/coordinator/ProgramAnalyticsDashboard';
import { CoordinatorCampusCourseAnalytics } from '@/components/coordinator/CoordinatorCampusCourseAnalytics';
// Import the existing ClassDashboard component instead of creating a new one
import { ClassDashboard } from '@/components/class/ClassDashboard';

interface Campus {
  id: string;
  name: string;
  code: string;
}

interface ProgramAssignment {
  programId: string;
  programName: string;
  programCode: string;
  campusId: string;
  campusName: string;
  campusCode: string;
  role: string;
  responsibilities: string[];
  assignedAt: Date;
}

interface CoordinatorAnalyticsNavigationProps {
  programId: string;
  programName: string;
  programCode: string;
  campuses: Campus[];
  coordinatorAssignments: ProgramAssignment[];
}

type AnalyticsView = 'program' | 'courses' | 'class';

export function CoordinatorAnalyticsNavigation({
  programId,
  programName,
  programCode,
  campuses,
  coordinatorAssignments,
}: CoordinatorAnalyticsNavigationProps) {
  const [selectedCampus, setSelectedCampus] = useState<string | null>(
    campuses.length > 0 ? campuses[0].id : null
  );
  const [currentView, setCurrentView] = useState<AnalyticsView>('program');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedClassName, setSelectedClassName] = useState<string | null>(null);
  const { isOnline } = useOfflineStorage('coordinatorAnalytics');

  // Get campus name for the selected campus
  const selectedCampusName = campuses.find((campus) => campus.id === selectedCampus)?.name || '';

  // Check if coordinator is assigned to the selected campus
  const isAssignedToCampus = coordinatorAssignments.some(
    (assignment) => assignment.campusId === selectedCampus
  );

  // Handle navigation to courses view
  const handleNavigateToCourses = () => {
    setCurrentView('courses');
  };

  // Handle navigation to program view
  const handleNavigateToProgram = () => {
    setCurrentView('program');
  };

  // Handle navigation to class view
  const handleNavigateToClass = (classId: string, className: string) => {
    setSelectedClassId(classId);
    setSelectedClassName(className);
    setCurrentView('class');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {programName} ({programCode}) Analytics
          </h2>
          <p className="text-muted-foreground">
            View analytics for program, courses, and classes
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isOnline && (
            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
              Offline Mode
            </Badge>
          )}
          <Select
            value={selectedCampus || ''}
            onValueChange={(value) => setSelectedCampus(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select campus" />
            </SelectTrigger>
            <SelectContent>
              {campuses.map((campus) => (
                <SelectItem key={campus.id} value={campus.id}>
                  {campus.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!isAssignedToCampus && selectedCampus && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <p className="text-yellow-800">
              You are not assigned as a coordinator for this campus. Some data may be limited.
            </p>
          </CardContent>
        </Card>
      )}

      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink onClick={handleNavigateToProgram} className={currentView === 'program' ? 'font-bold' : ''}>
              Program Analytics
            </BreadcrumbLink>
          </BreadcrumbItem>
          {currentView !== 'program' && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink onClick={handleNavigateToCourses} className={currentView === 'courses' ? 'font-bold' : ''}>
                  Course Analytics
                </BreadcrumbLink>
              </BreadcrumbItem>
            </>
          )}
          {currentView === 'class' && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink className="font-bold">
                  {selectedClassName} Class Analytics
                </BreadcrumbLink>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      {selectedCampus ? (
        <>
          {currentView === 'program' && (
            <ProgramAnalyticsDashboard
              programId={programId}
              programName={programName}
              selectedCampus={selectedCampus}
              campusName={selectedCampusName}
              onViewCourses={handleNavigateToCourses}
            />
          )}

          {currentView === 'courses' && (
            <CoordinatorCampusCourseAnalytics
              programId={programId}
              programName={programName}
              campusId={selectedCampus}
              campusName={selectedCampusName}
              onNavigateToProgram={handleNavigateToProgram}
              onNavigateToClass={handleNavigateToClass}
            />
          )}

          {currentView === 'class' && selectedClassId && (
            <ClassDashboard
              classId={selectedClassId}
              className={selectedClassName || ''}
              initialData={{
                studentsCount: 0,
                assessmentsCount: 0,
                activitiesCount: 0,
                attendanceRecordsCount: 0
              }}
            />
          )}
        </>
      ) : (
        <Card>
          <CardContent className="flex justify-center items-center h-40">
            <p className="text-muted-foreground">
              Please select a campus to view analytics
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
