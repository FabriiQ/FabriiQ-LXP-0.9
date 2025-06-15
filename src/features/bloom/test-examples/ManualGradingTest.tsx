'use client';

/**
 * Manual Grading Test with Bloom's Taxonomy Integration
 * 
 * This component demonstrates manual grading of custom activities and assignments
 * using Bloom's Taxonomy grading components.
 */

import { useState } from 'react';
import { api } from '@/trpc/react';
import { useToast } from '@/components/ui/feedback/toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/data-display/card';
import { Button } from '@/components/ui/core/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/navigation/tabs';
import { Separator } from '@/components/ui/data-display/separator';
import { RubricGrading, CognitiveGrading, GradingInterface, FeedbackGenerator } from '@/features/bloom/components/grading';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';
import { RubricType } from '@/features/bloom/types/rubric';
import { GradableContentType } from '@/features/bloom/types/grading';

// Define the props for the component
interface ManualGradingTestProps {
  classId: string;
  studentId: string;
}

/**
 * ManualGradingTest Component
 */
export function ManualGradingTest({
  classId,
  studentId
}: ManualGradingTestProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('activity');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Example activity data
  const exampleActivity = {
    id: 'activity-1',
    title: 'Critical Analysis Essay',
    description: 'Analyze a literary work of your choice using critical thinking skills.',
    bloomsLevel: BloomsTaxonomyLevel.ANALYZE,
    maxScore: 100
  };
  
  // Example assignment data
  const exampleAssignment = {
    id: 'assignment-1',
    title: 'Research Project: Environmental Impact Analysis',
    description: 'Conduct research on an environmental issue and analyze its impact on local ecosystems.',
    bloomsLevel: BloomsTaxonomyLevel.EVALUATE,
    maxScore: 100
  };
  
  // Example student submission for activity
  const exampleActivitySubmission = {
    id: 'submission-1',
    studentId,
    activityId: exampleActivity.id,
    content: {
      text: "In 'To Kill a Mockingbird' by Harper Lee, the theme of racial injustice is portrayed through the trial of Tom Robinson. The character of Atticus Finch represents moral integrity in the face of societal prejudice. The author uses symbolism, such as the mockingbird, to represent innocence destroyed by evil. The novel effectively critiques the deep-seated racism in the American South during the 1930s through its narrative structure and character development."
    },
    status: 'SUBMITTED',
    submittedAt: new Date(),
    score: null,
    feedback: null,
    attachments: {}
  };
  
  // Example student submission for assignment
  const exampleAssignmentSubmission = {
    id: 'submission-2',
    studentId,
    assessmentId: exampleAssignment.id,
    content: {
      text: "This research project examines the impact of plastic pollution on coastal ecosystems in our local area. Data collected from beach cleanups shows an average of 5.2 kg of plastic waste per 100m of shoreline. Analysis of water samples indicates microplastic concentrations of 3-5 particles per liter. Local marine species show evidence of plastic ingestion, with 28% of examined fish containing microplastics. Current mitigation efforts include monthly community cleanups and educational programs, but these are insufficient given the scale of the problem. Recommended solutions include implementing a plastic bag ban, installing more effective waste management systems, and developing biodegradable alternatives to common plastic products."
    },
    status: 'SUBMITTED',
    submittedAt: new Date(),
    score: null,
    feedback: null,
    bloomsLevelScores: {}
  };
  
  // Example rubric for activity
  const activityRubric = {
    id: 'rubric-1',
    title: 'Critical Analysis Essay Rubric',
    type: RubricType.ANALYTIC,
    criteria: [
      {
        id: 'criterion-1',
        name: 'Thesis Statement',
        description: 'Clear and focused thesis statement that presents an analytical argument',
        bloomsLevel: BloomsTaxonomyLevel.ANALYZE,
        weight: 25,
        learningOutcomeIds: [],
        performanceLevels: [
          {
            levelId: 'level-1',
            description: 'Thesis is unclear or missing',
            score: 5
          },
          {
            levelId: 'level-2',
            description: 'Thesis is present but lacks focus or analytical depth',
            score: 15
          },
          {
            levelId: 'level-3',
            description: 'Clear thesis with good analytical focus',
            score: 20
          },
          {
            levelId: 'level-4',
            description: 'Exceptional thesis that presents a sophisticated analytical argument',
            score: 25
          }
        ]
      },
      {
        id: 'criterion-2',
        name: 'Textual Evidence',
        description: 'Use of specific examples and quotes from the text to support analysis',
        bloomsLevel: BloomsTaxonomyLevel.ANALYZE,
        weight: 25,
        learningOutcomeIds: [],
        performanceLevels: [
          {
            levelId: 'level-1',
            description: 'Little or no textual evidence',
            score: 5
          },
          {
            levelId: 'level-2',
            description: 'Some textual evidence but not well integrated',
            score: 15
          },
          {
            levelId: 'level-3',
            description: 'Good use of textual evidence that supports analysis',
            score: 20
          },
          {
            levelId: 'level-4',
            description: 'Excellent use of textual evidence that enhances analysis',
            score: 25
          }
        ]
      },
      {
        id: 'criterion-3',
        name: 'Critical Thinking',
        description: 'Depth of analysis and critical thinking about the text',
        bloomsLevel: BloomsTaxonomyLevel.EVALUATE,
        weight: 25,
        learningOutcomeIds: [],
        performanceLevels: [
          {
            levelId: 'level-1',
            description: 'Minimal analysis, mostly summary',
            score: 5
          },
          {
            levelId: 'level-2',
            description: 'Basic analysis with some critical thinking',
            score: 15
          },
          {
            levelId: 'level-3',
            description: 'Good analysis with clear critical thinking',
            score: 20
          },
          {
            levelId: 'level-4',
            description: 'Exceptional analysis with sophisticated critical thinking',
            score: 25
          }
        ]
      },
      {
        id: 'criterion-4',
        name: 'Organization and Clarity',
        description: 'Essay structure, flow, and clarity of expression',
        bloomsLevel: BloomsTaxonomyLevel.CREATE,
        weight: 25,
        learningOutcomeIds: [],
        performanceLevels: [
          {
            levelId: 'level-1',
            description: 'Poorly organized and unclear',
            score: 5
          },
          {
            levelId: 'level-2',
            description: 'Basic organization with some clarity issues',
            score: 15
          },
          {
            levelId: 'level-3',
            description: 'Well-organized with good clarity',
            score: 20
          },
          {
            levelId: 'level-4',
            description: 'Exceptionally well-organized and clear',
            score: 25
          }
        ]
      }
    ],
    performanceLevels: [
      {
        id: 'level-1',
        name: 'Needs Improvement',
        description: 'Does not meet expectations',
        scoreRange: { min: 0, max: 59 }
      },
      {
        id: 'level-2',
        name: 'Developing',
        description: 'Partially meets expectations',
        scoreRange: { min: 60, max: 74 }
      },
      {
        id: 'level-3',
        name: 'Proficient',
        description: 'Meets expectations',
        scoreRange: { min: 75, max: 89 }
      },
      {
        id: 'level-4',
        name: 'Exemplary',
        description: 'Exceeds expectations',
        scoreRange: { min: 90, max: 100 }
      }
    ],
    maxScore: 100
  };
  
  // Handle activity grading
  const handleActivityGradeChange = (values: any) => {
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: 'Activity graded',
        description: 'The activity has been graded successfully.',
      });
      setIsSubmitting(false);
    }, 1000);
    
    console.log('Activity grading values:', values);
  };
  
  // Handle assignment grading
  const handleAssignmentGradeChange = (values: any) => {
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: 'Assignment graded',
        description: 'The assignment has been graded successfully.',
      });
      setIsSubmitting(false);
    }, 1000);
    
    console.log('Assignment grading values:', values);
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Manual Grading Test</CardTitle>
          <CardDescription>
            Test manual grading of activities and assignments with Bloom's Taxonomy integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="activity">Activity Grading</TabsTrigger>
              <TabsTrigger value="assignment">Assignment Grading</TabsTrigger>
            </TabsList>
            
            <TabsContent value="activity">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{exampleActivity.title}</CardTitle>
                    <CardDescription>{exampleActivity.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <h3 className="text-lg font-medium mb-2">Student Submission</h3>
                      <div className="bg-muted p-4 rounded-md">
                        <p>{exampleActivitySubmission.content.text}</p>
                      </div>
                    </div>
                    
                    <Separator className="my-6" />
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">Rubric Grading</h3>
                      <RubricGrading
                        rubricId={activityRubric.id}
                        rubricType={activityRubric.type}
                        criteria={activityRubric.criteria}
                        performanceLevels={activityRubric.performanceLevels}
                        maxScore={exampleActivity.maxScore}
                        initialValues={{}}
                        onGradeChange={handleActivityGradeChange}
                        showBloomsLevels={true}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="assignment">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{exampleAssignment.title}</CardTitle>
                    <CardDescription>{exampleAssignment.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <h3 className="text-lg font-medium mb-2">Student Submission</h3>
                      <div className="bg-muted p-4 rounded-md">
                        <p>{exampleAssignmentSubmission.content.text}</p>
                      </div>
                    </div>
                    
                    <Separator className="my-6" />
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">Cognitive Grading</h3>
                      <CognitiveGrading
                        bloomsLevels={[
                          BloomsTaxonomyLevel.ANALYZE,
                          BloomsTaxonomyLevel.EVALUATE,
                          BloomsTaxonomyLevel.CREATE
                        ]}
                        maxScorePerLevel={{
                          [BloomsTaxonomyLevel.REMEMBER]: 0,
                          [BloomsTaxonomyLevel.UNDERSTAND]: 0,
                          [BloomsTaxonomyLevel.APPLY]: 0,
                          [BloomsTaxonomyLevel.ANALYZE]: 40,
                          [BloomsTaxonomyLevel.EVALUATE]: 40,
                          [BloomsTaxonomyLevel.CREATE]: 20
                        }}
                        initialValues={{}}
                        onGradeChange={handleAssignmentGradeChange}
                        showAnalysis={true}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
