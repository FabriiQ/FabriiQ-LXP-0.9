'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, BookOpen, Calendar, GraduationCap, MapPin, Mail, Phone, User, School } from 'lucide-react';
import { Button } from '@/components/ui/atoms/button';
import { PageHeader } from '@/components/ui/atoms/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/navigation/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Badge } from '@/components/ui/atoms/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { api } from '@/trpc/react';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { format } from 'date-fns';

export default function SystemStudentDetailPage() {
  const params = useParams();
  const studentId = params.id as string;
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch student details
  const { data: student, isLoading: isLoadingStudent } = api.systemAnalytics.getStudentById.useQuery(
    { id: studentId },
    {
      enabled: !!studentId,
      retry: 1,
    }
  );

  if (isLoadingStudent) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" disabled>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div>
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>

          <div className="md:col-span-2">
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <PageHeader
          title="Student Not Found"
          description="The requested student could not be found."
        />
        <Button asChild>
          <Link href="/admin/system/students">Back to Students</Link>
        </Button>
      </div>
    );
  }

  // Format date function
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'MMM dd, yyyy');
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/system/students">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Students
            </Link>
          </Button>
          <PageHeader
            title={`Student: ${student.name}`}
            description={student.email}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={
            student.status === 'ACTIVE' ? 'success' :
            student.status === 'INACTIVE' || student.status === 'ARCHIVED' ? 'warning' :
            'secondary'
          }>
            {student.status.charAt(0) + student.status.slice(1).toLowerCase()}
          </Badge>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/system/students/${studentId}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>Student Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={`https://avatar.vercel.sh/${student.name}`} alt={student.name} />
                <AvatarFallback>{student.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-medium">{student.name}</h3>
                <p className="text-sm text-muted-foreground">{student.email}</p>
              </div>
            </div>

            {student.profile?.enrollmentNumber && (
              <div className="flex items-center">
                <GraduationCap className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="font-medium">ID:</span>
                <span className="ml-2">{student.profile.enrollmentNumber}</span>
              </div>
            )}

            {student.campuses.length > 0 && (
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="font-medium">Campus:</span>
                <span className="ml-2">{student.campuses.find(c => c.isPrimary)?.name || student.campuses[0].name}</span>
              </div>
            )}

            {student.enrollments.length > 0 && (
              <div className="flex items-center">
                <School className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="font-medium">Program:</span>
                <span className="ml-2">{student.enrollments[0]?.program?.name || 'Not assigned'}</span>
              </div>
            )}

            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="font-medium">Enrolled:</span>
              <span className="ml-2">{formatDate(student.createdAt)}</span>
            </div>

            {student.profile?.currentGrade && (
              <div className="flex items-center">
                <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="font-medium">Current Grade:</span>
                <span className="ml-2">{student.profile.currentGrade}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Academic Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Academic Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted rounded-md text-center">
                <p className="text-sm text-muted-foreground">Classes</p>
                <p className="text-2xl font-bold">{student.classes.length}</p>
              </div>
              <div className="p-3 bg-muted rounded-md text-center">
                <p className="text-sm text-muted-foreground">Programs</p>
                <p className="text-2xl font-bold">{student.enrollments.length}</p>
              </div>
              <div className="p-3 bg-muted rounded-md text-center">
                <p className="text-sm text-muted-foreground">Attendance</p>
                <p className="text-2xl font-bold">{student.profile?.attendanceRate ? `${Math.round(student.profile.attendanceRate * 100)}%` : 'N/A'}</p>
              </div>
              <div className="p-3 bg-muted rounded-md text-center">
                <p className="text-sm text-muted-foreground">Academic Score</p>
                <p className="text-2xl font-bold">{student.profile?.academicScore ? student.profile.academicScore.toFixed(1) : 'N/A'}</p>
              </div>
            </div>

            {student.profile?.participationRate !== null && student.profile?.participationRate !== undefined && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                <p className="text-sm text-muted-foreground">Participation Rate</p>
                <p className="font-bold">{Math.round(student.profile.participationRate * 100)}%</p>
              </div>
            )}

            {student.profile?.lastCounseling && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                <p className="text-sm text-muted-foreground">Last Counseling</p>
                <p className="font-bold">{formatDate(student.profile.lastCounseling)}</p>
              </div>
            )}

            {student.profile?.lastParentMeeting && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                <p className="text-sm text-muted-foreground">Last Parent Meeting</p>
                <p className="font-bold">{formatDate(student.profile.lastParentMeeting)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center">
              <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="font-medium">Email:</span>
              <span className="ml-2">{student.email}</span>
            </div>

            {student.profile?.guardianInfo && (
              <div>
                <h3 className="text-sm font-medium mb-2">Guardian Information</h3>
                <div className="space-y-2 pl-2 border-l-2 border-muted">
                  {typeof student.profile.guardianInfo === 'object' && student.profile.guardianInfo !== null && (
                    <>
                      {'name' in student.profile.guardianInfo && (
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="font-medium">Name:</span>
                          <span className="ml-2">{(student.profile.guardianInfo as any).name}</span>
                        </div>
                      )}
                      {'email' in student.profile.guardianInfo && (
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="font-medium">Email:</span>
                          <span className="ml-2">{(student.profile.guardianInfo as any).email}</span>
                        </div>
                      )}
                      {'phone' in student.profile.guardianInfo && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="font-medium">Phone:</span>
                          <span className="ml-2">{(student.profile.guardianInfo as any).phone}</span>
                        </div>
                      )}
                      {'relationship' in student.profile.guardianInfo && (
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="font-medium">Relationship:</span>
                          <span className="ml-2">{(student.profile.guardianInfo as any).relationship}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="grades">Grades</TabsTrigger>
          <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Student Overview</CardTitle>
              <CardDescription>General information about this student</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {student.profile?.interests && student.profile.interests.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Interests</h3>
                    <div className="flex flex-wrap gap-2">
                      {student.profile.interests.map((interest, index) => (
                        <Badge key={index} variant="outline">{interest}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {student.profile?.achievements && student.profile.achievements.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Achievements</h3>
                    <div className="space-y-2">
                      {student.profile.achievements.map((achievement, index) => {
                        if (typeof achievement === 'object' && achievement !== null) {
                          return (
                            <div key={index} className="p-3 border rounded-md">
                              {'title' in achievement && <p className="font-medium">{(achievement as any).title}</p>}
                              {'date' in achievement && <p className="text-sm text-muted-foreground">{formatDate((achievement as any).date)}</p>}
                              {'description' in achievement && <p className="mt-1">{(achievement as any).description}</p>}
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                )}

                {student.profile?.academicHistory && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Academic History</h3>
                    <div className="p-3 border rounded-md">
                      <pre className="whitespace-pre-wrap text-sm">
                        {JSON.stringify(student.profile.academicHistory, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {student.profile?.specialNeeds && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Special Needs</h3>
                    <div className="p-3 border rounded-md">
                      <pre className="whitespace-pre-wrap text-sm">
                        {JSON.stringify(student.profile.specialNeeds, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes">
          <Card>
            <CardHeader>
              <CardTitle>Classes</CardTitle>
              <CardDescription>Classes this student is enrolled in</CardDescription>
            </CardHeader>
            <CardContent>
              {student.classes.length > 0 ? (
                <div className="space-y-4">
                  {student.classes.map((cls) => (
                    <div key={cls.id} className="p-4 border rounded-md">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium">{cls.class.name}</h3>
                          <p className="text-sm text-muted-foreground">{cls.class.code}</p>
                        </div>
                        <Badge variant={cls.status === 'ACTIVE' ? 'success' : 'secondary'}>
                          {cls.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div className="flex items-center">
                          <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{cls.class.course.name}</span>
                        </div>

                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{cls.class.term.name}</span>
                        </div>

                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{cls.class.campus.name}</span>
                        </div>
                      </div>

                      <div className="mt-4">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/system/classes/${cls.class.id}`}>
                            <BookOpen className="h-4 w-4 mr-2" />
                            View Class
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No classes found for this student.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grades">
          <Card>
            <CardHeader>
              <CardTitle>Grades</CardTitle>
              <CardDescription>Academic performance and grades</CardDescription>
            </CardHeader>
            <CardContent>
              {student.grades.length > 0 ? (
                <div className="space-y-4">
                  {student.grades.map((grade) => (
                    <div key={grade.id} className="p-4 border rounded-md">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium">{grade.class?.name || 'Unknown Class'}</h3>
                          <p className="text-sm text-muted-foreground">Grade recorded on {formatDate(grade.createdAt)}</p>
                        </div>
                        {grade.letterGrade && (
                          <Badge variant="outline" className="text-lg">
                            {grade.letterGrade}
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        {grade.finalGrade !== null && grade.finalGrade !== undefined && (
                          <div className="flex items-center">
                            <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span className="font-medium">Final Grade:</span>
                            <span className="ml-2">{grade.finalGrade.toFixed(1)}</span>
                          </div>
                        )}

                        {grade.attendance !== null && grade.attendance !== undefined && (
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span className="font-medium">Attendance:</span>
                            <span className="ml-2">{Math.round(grade.attendance * 100)}%</span>
                          </div>
                        )}
                      </div>

                      {grade.comments && (
                        <div className="mt-4 p-3 bg-muted rounded-md">
                          <p className="text-sm font-medium">Comments:</p>
                          <p className="text-sm mt-1">{grade.comments}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No grades found for this student.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enrollments">
          <Card>
            <CardHeader>
              <CardTitle>Program Enrollments</CardTitle>
              <CardDescription>Programs this student is enrolled in</CardDescription>
            </CardHeader>
            <CardContent>
              {student.enrollments.length > 0 ? (
                <div className="space-y-4">
                  {student.enrollments.map((enrollment) => (
                    <div key={enrollment.id} className="p-4 border rounded-md">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium">{enrollment.program?.name || 'Unknown Program'}</h3>
                          <p className="text-sm text-muted-foreground">{enrollment.campus.name}</p>
                        </div>
                        <Badge variant={enrollment.status === 'ACTIVE' ? 'success' : 'secondary'}>
                          {enrollment.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="font-medium">Term:</span>
                          <span className="ml-2">{enrollment.term.name}</span>
                        </div>

                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="font-medium">Start Date:</span>
                          <span className="ml-2">{formatDate(enrollment.startDate)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No program enrollments found for this student.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
