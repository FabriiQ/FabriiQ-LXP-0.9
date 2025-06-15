"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/data-display/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/atoms/page-header";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { ArrowLeft, FileText, BookOpen, ClipboardCheck } from "lucide-react";
import Link from "next/link";

export default function CreateContentPage() {
  const router = useRouter();

  return (
    <div className="container py-6 max-w-4xl mx-auto px-4">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/teacher/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/teacher/content-studio">AI Content Studio</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Create Content</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex justify-between items-center mb-6">
        <PageHeader
          title="Create Content"
          description="Choose the type of content you want to create"
        />
        <Button variant="outline" asChild className="flex items-center">
          <Link href="/teacher/content-studio">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-all">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Worksheet
            </CardTitle>
            <CardDescription>
              Create printable worksheets for your students
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Generate worksheets with various question types including multiple choice,
              short answer, true/false, and fill-in-the-blanks.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/teacher/content-studio/create/worksheet">
                Create Worksheet
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="hover:shadow-md transition-all">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="mr-2 h-5 w-5" />
              Activity
            </CardTitle>
            <CardDescription>
              Create interactive learning activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Generate interactive learning activities including reading materials,
              videos, and other interactive content for your classes.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/teacher/content-studio/create/activity">
                Create Activity
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="hover:shadow-md transition-all">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ClipboardCheck className="mr-2 h-5 w-5" />
              Assessment
            </CardTitle>
            <CardDescription>
              Create quizzes and assessments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Generate quizzes, exams, and assignments with various question types
              to assess student learning and provide feedback.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/teacher/content-studio/create/assessment">
                Create Assessment
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
