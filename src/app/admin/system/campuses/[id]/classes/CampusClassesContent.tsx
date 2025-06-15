'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/data-display/card";
import { Badge } from "@/components/ui/atoms/badge";
import { ArrowLeftIcon, PlusIcon, HomeIcon, UsersIcon, CalendarIcon, BookOpenIcon } from "lucide-react";
import { ClassFilters } from "@/components/campus/ClassFilters";
import { Campus, Class, ProgramCampus, Program, Term, SystemStatus } from "@prisma/client";
import { JsonValue } from "@prisma/client/runtime/library";

interface CampusClassesContentProps {
  campus: Campus & {
    institution: {
      id: string;
      name: string;
      code: string;
    };
  };
  classes: (Class & {
    courseCampus: {
      course: {
        name: string;
        code: string;
      };
    };
    term: Term;
    classTeacher: {
      user: {
        id: string;
        name: string | null;
        email: string | null;
      };
    } | null;
    facility: {
      id: string;
      name: string;
    } | null;
    programCampus: {
      program: {
        id: string;
        name: string;
        code: string;
        status: SystemStatus;
        institutionId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        type: string;
        level: number;
        duration: number;
        settings: JsonValue;
        curriculum: JsonValue;
      };
    } | null;
    _count: {
      students: number;
      teachers: number;
      activities: number;
      assessments: number;
    };
  })[];
  programCampuses: (ProgramCampus & { program: Program })[];
  terms: Term[];
  searchParams: {
    programId?: string;
    termId?: string;
    search?: string;
  };
}

export function CampusClassesContent({
  campus,
  classes,
  programCampuses,
  terms,
  searchParams,
}: CampusClassesContentProps) {
  // Group classes by term
  const classesByTerm: Record<string, typeof classes> = {};
  
  classes.forEach(cls => {
    if (!classesByTerm[cls.termId]) {
      classesByTerm[cls.termId] = [];
    }
    classesByTerm[cls.termId].push(cls);
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Link href={`/admin/system/campuses/${campus.id}`}>
          <Button variant="outline" size="icon">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader
          title={`Classes - ${campus.name}`}
          description={`Manage classes for ${campus.code} campus`}
        />
      </div>
      
      {/* Filters */}
      <ClassFilters
        programCampuses={programCampuses}
        terms={terms}
        currentProgramId={searchParams.programId}
        currentTermId={searchParams.termId}
        campusId={campus.id}
      />
      
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Campus Classes</h2>
        <Link href={`/admin/system/campuses/${campus.id}/classes/new`}>
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Class
          </Button>
        </Link>
      </div>
      
      {classes.length > 0 ? (
        <div className="space-y-8">
          {Object.entries(classesByTerm).map(([termId, termClasses]) => {
            const term = termClasses[0]?.term;
            return (
              <div key={termId} className="space-y-4">
                <h3 className="text-lg font-medium flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2 text-muted-foreground" />
                  {term?.name} ({new Date(term?.startDate).toLocaleDateString()} - {new Date(term?.endDate).toLocaleDateString()})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {termClasses.map((cls) => (
                    <Card key={cls.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base">{cls.name}</CardTitle>
                          <Badge variant="secondary">{cls.code}</Badge>
                        </div>
                        <CardDescription>
                          {cls.courseCampus.course.name} ({cls.courseCampus.course.code})
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="space-y-2">
                          {cls.programCampus && (
                            <div className="flex items-center text-sm">
                              <BookOpenIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span>{cls.programCampus.program.name}</span>
                            </div>
                          )}
                          {cls.classTeacher && (
                            <div className="flex items-center text-sm">
                              <UsersIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span>Teacher: {cls.classTeacher.user.name}</span>
                            </div>
                          )}
                          <div className="flex items-center text-sm">
                            <UsersIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>Students: {cls._count.students}</span>
                          </div>
                          {cls.facility && (
                            <div className="flex items-center text-sm">
                              <HomeIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span>Facility: {cls.facility.name}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter className="pt-2 flex justify-between">
                        <Link href={`/admin/system/classes/${cls.id}`}>
                          <Button variant="outline" size="sm">View Details</Button>
                        </Link>
                        <Link href={`/admin/system/classes/${cls.id}/edit`}>
                          <Button variant="secondary" size="sm">Edit</Button>
                        </Link>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <HomeIcon className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No classes found</h3>
          <p className="text-sm text-gray-500 mt-1">
            {searchParams.programId || searchParams.termId || searchParams.search
              ? "Try adjusting your filters to see more results."
              : "Add classes to this campus to get started."}
          </p>
          <div className="mt-4 flex gap-2">
            {(searchParams.programId || searchParams.termId || searchParams.search) && (
              <Link href={`/admin/system/campuses/${campus.id}/classes`}>
                <Button variant="outline">Clear Filters</Button>
              </Link>
            )}
            <Link href={`/admin/system/campuses/${campus.id}/classes/new`}>
              <Button>Add Class</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
} 