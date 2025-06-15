import React from 'react';
import { Metadata } from 'next';
import { NewAssessmentClientPage } from '@/app/admin/campus/classes/[id]/assessments/components/NewAssessmentClientPage';
import { prisma } from '@/server/db';
import { SystemStatus } from "@/server/api/constants";
import { PageLayout } from '@/components/layout/page-layout';

export const metadata: Metadata = {
  title: 'Create Assessment',
  description: 'Create a new assessment for the class',
};

export default async function NewAssessmentPage({ params }: { params: { id: string } }) {
  // Use await to resolve params to fix the error
  const { id } = await Promise.resolve(params);
  const classId = id;

  try {
    // Fetch class details directly from the database
    const classInfo = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        courseCampus: {
          include: {
            course: true
          }
        }
      }
    });

    if (!classInfo) {
      throw new Error('Class not found');
    }

    // Fetch subjects for this class directly from the database
    console.log('Class Info:', classInfo);
    console.log('Course ID:', classInfo.courseCampus?.courseId);

    // Make sure we have a courseId before querying subjects
    let subjects = [];
    if (classInfo.courseCampus?.courseId) {
      subjects = await prisma.subject.findMany({
        where: {
          courseId: classInfo.courseCampus.courseId,
          status: SystemStatus.ACTIVE
        },
        take: 100
      });
      console.log('Subjects found:', subjects.length);
    } else {
      console.log('No courseId found, fetching all active subjects');
      subjects = await prisma.subject.findMany({
        where: {
          status: SystemStatus.ACTIVE
        },
        take: 100
      });
      console.log('All subjects found:', subjects.length);
    }

    // Pass the data to the client component
    return (
      <PageLayout
        title="Create Assessment"
        description={`Create a new assessment for ${classInfo.code} - ${classInfo.name}`}
        breadcrumbs={[
          { label: 'Classes', href: '/admin/campus/classes' },
          { label: classInfo.name, href: `/admin/campus/classes/${classId}` },
          { label: 'Assessments', href: `/admin/campus/classes/${classId}/assessments` },
          { label: 'Create', href: '#' },
        ]}
      >
        <NewAssessmentClientPage
          classId={classId}
          classInfo={classInfo}
          subjects={subjects}
        />
      </PageLayout>
    );
  } catch (error) {
    console.error('Error loading new assessment page:', error);
    return (
      <PageLayout
        title="Create Assessment"
        description="Create a new assessment"
        breadcrumbs={[
          { label: 'Classes', href: '/admin/campus/classes' },
          { label: 'Class', href: `/admin/campus/classes/${classId}` },
          { label: 'Assessments', href: `/admin/campus/classes/${classId}/assessments` },
          { label: 'Create', href: '#' },
        ]}
      >
        <NewAssessmentClientPage
          classId={classId}
          error="Failed to load assessment form data"
        />
      </PageLayout>
    );
  }
}