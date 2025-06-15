"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/data-display/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/atoms/page-header";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { ArrowLeft, CheckSquare, FileQuestion, MessageSquare, Briefcase, Award, PenTool } from "lucide-react";
import Link from "next/link";
import { AssessmentType } from "@/server/api/constants";

export default function AssessmentTypePage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const assessmentTypeCards = [
    {
      id: AssessmentType.QUIZ,
      title: "Quiz",
      description: "Short assessment with multiple choice, true/false, and short answer questions",
      icon: <CheckSquare className="h-8 w-8 mb-2" />
    },
    {
      id: AssessmentType.EXAM,
      title: "Exam",
      description: "Comprehensive assessment with various question types",
      icon: <FileQuestion className="h-8 w-8 mb-2" />
    },
    {
      id: AssessmentType.ASSIGNMENT,
      title: "Assignment",
      description: "Project or task-based assessment with rubric",
      icon: <MessageSquare className="h-8 w-8 mb-2" />
    },
    {
      id: AssessmentType.PROJECT,
      title: "Project",
      description: "Long-term project with multiple components",
      icon: <Briefcase className="h-8 w-8 mb-2" />
    },
    {
      id: AssessmentType.PRESENTATION,
      title: "Presentation",
      description: "Student presentation assessment",
      icon: <Award className="h-8 w-8 mb-2" />
    },
    {
      id: AssessmentType.HOMEWORK,
      title: "Homework",
      description: "Take-home assignments",
      icon: <PenTool className="h-8 w-8 mb-2" />
    }
  ];

  const handleContinue = () => {
    if (selectedType) {
      router.push(`/teacher/content-studio/create/assessment/form?type=${selectedType}`);
    }
  };

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
            <BreadcrumbLink href="/teacher/content-studio/create">Create Content</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Select Assessment Type</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex justify-between items-center mb-6">
        <PageHeader
          title="Select Assessment Type"
          description="Choose the type of assessment you want to create"
        />
        <Button variant="outline" asChild className="flex items-center">
          <Link href="/teacher/content-studio/create">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {assessmentTypeCards.map((type) => (
          <Card 
            key={type.id} 
            className={`cursor-pointer hover:shadow-md transition-all ${selectedType === type.id ? 'border-primary bg-primary/5' : ''}`}
            onClick={() => setSelectedType(type.id)}
          >
            <CardContent className="p-6 text-center relative">
              {selectedType === type.id && (
                <div className="absolute top-2 right-2 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                  <svg key="check-icon" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
              )}
              <div className={`${selectedType === type.id ? 'text-primary' : ''}`}>
                {type.icon}
              </div>
              <h3 className={`font-medium ${selectedType === type.id ? 'text-primary' : ''}`}>{type.title}</h3>
              <p className="text-sm text-muted-foreground mt-2">{type.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={handleContinue} 
          disabled={!selectedType}
          className="px-8"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
