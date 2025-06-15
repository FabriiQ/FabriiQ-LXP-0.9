import React from 'react';
import { Metadata } from 'next';
import { AssessmentsClientPage } from '@/app/admin/campus/classes/[id]/assessments/components/AssessmentsClientPage';
import { prisma } from '@/server/db';
import { PageLayout } from '@/components/layout/page-layout';

export const metadata: Metadata = {
  title: 'Class Assessments',
  description: 'Manage assessments for this class',
};

export default async function ClassAssessmentsPage({ params }: { params: { id: string } }) {
  const classId = params.id;

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

    // Fetch assessments directly from the database
    const assessments = await prisma.assessment.findMany({
      where: {
        classId,
        status: 'ACTIVE'
      },
      include: {
        subject: true,
        _count: {
          select: {
            submissions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Pass the data to the client component
    return (
      <PageLayout
        title="Class Assessments"
        description={`Manage assessments for ${classInfo.code} - ${classInfo.name}`}
        breadcrumbs={[
          { label: 'Classes', href: '/admin/campus/classes' },
          { label: classInfo.name, href: `/admin/campus/classes/${classId}` },
          { label: 'Assessments', href: '#' },
        ]}
      >
        <AssessmentsClientPage
          classId={classId}
          classInfo={classInfo}
          initialAssessments={assessments}
        />
      </PageLayout>
    );
  } catch (error) {
    console.error('Error fetching class assessments:', error);
    return (
      <PageLayout
        title="Class Assessments"
        description="Manage assessments"
        breadcrumbs={[
          { label: 'Classes', href: '/admin/campus/classes' },
          { label: 'Class', href: `/admin/campus/classes/${classId}` },
          { label: 'Assessments', href: '#' },
        ]}
      >
        <AssessmentsClientPage
          classId={classId}
          error="Failed to load assessments data"
        />
      </PageLayout>
    );
  }
}