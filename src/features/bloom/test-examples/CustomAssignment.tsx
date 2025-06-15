'use client';

/**
 * Custom Assignment Example with Bloom's Taxonomy Integration
 * 
 * This component demonstrates a custom assignment that uses Bloom's Taxonomy
 * and rubrics implementation for testing with manual grading.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/trpc/react';
import { useToast } from '@/components/ui/feedback/toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/data-display/card';
import { Button } from '@/components/ui/core/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/navigation/tabs';
import { Textarea } from '@/components/ui/form/textarea';
import { Input } from '@/components/ui/form/input';
import { Label } from '@/components/ui/form/label';
import { Separator } from '@/components/ui/data-display/separator';
import { Checkbox } from '@/components/ui/form/checkbox';
import { BloomsTaxonomySelector } from '@/features/bloom/components/taxonomy/BloomsTaxonomySelector';
import { BloomsDistributionChart } from '@/features/bloom/components/visualization/BloomsDistributionChart';
import { RubricPreview } from '@/features/bloom/components/rubric/RubricPreview';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';
import { RubricType } from '@/features/bloom/types/rubric';

// Define the props for the component
interface CustomAssignmentProps {
  classId: string;
  subjectId: string;
  topicId?: string;
}

/**
 * CustomAssignment Component
 */
export function CustomAssignment({
  classId,
  subjectId,
  topicId
}: CustomAssignmentProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Assignment state
  const [title, setTitle] = useState('Research Project: Environmental Impact Analysis');
  const [description, setDescription] = useState('Conduct research on an environmental issue and analyze its impact on local ecosystems.');
  const [instructions, setInstructions] = useState('1. Choose an environmental issue affecting your local area.\n2. Research the causes and effects of this issue.\n3. Analyze the impact on local ecosystems using scientific data.\n4. Evaluate current solutions and propose improvements.\n5. Create a detailed report with your findings and recommendations.');
  const [bloomsLevel, setBloomsLevel] = useState<BloomsTaxonomyLevel>(BloomsTaxonomyLevel.EVALUATE);
  const [maxScore, setMaxScore] = useState(100);
  const [dueDate, setDueDate] = useState<string>('');
  const [allowLateSubmission, setAllowLateSubmission] = useState(true);
  
  // Create assignment mutation
  const createAssignmentMutation = api.assessment.create.useMutation({
    onSuccess: (data) => {
      toast({
        title: 'Assignment created',
        description: 'The assignment has been created successfully.',
      });
      router.push(`/admin/campus/classes/${classId}/assessments/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: 'Error creating assignment',
        description: error.message,
        variant: 'error',
      });
      setIsSubmitting(false);
    }
  });
  
  // Example rubric data for preview
  const exampleRubric = {
    id: 'example-rubric-id',
    title: 'Environmental Impact Analysis Rubric',
    description: 'Rubric for evaluating environmental impact analysis projects',
    type: RubricType.ANALYTIC,
    criteria: [
      {
        id: 'criterion-1',
        name: 'Research Quality',
        description: 'Depth and breadth of research on the environmental issue',
        bloomsLevel: BloomsTaxonomyLevel.ANALYZE,
        weight: 20,
        learningOutcomeIds: [],
        performanceLevels: [
          {
            levelId: 'level-1',
            description: 'Limited research with few sources',
            score: 5
          },
          {
            levelId: 'level-2',
            description: 'Basic research with some relevant sources',
            score: 10
          },
          {
            levelId: 'level-3',
            description: 'Thorough research with diverse, relevant sources',
            score: 15
          },
          {
            levelId: 'level-4',
            description: 'Exceptional research with comprehensive, high-quality sources',
            score: 20
          }
        ]
      },
      {
        id: 'criterion-2',
        name: 'Data Analysis',
        description: 'Analysis of scientific data related to the environmental issue',
        bloomsLevel: BloomsTaxonomyLevel.ANALYZE,
        weight: 25,
        learningOutcomeIds: [],
        performanceLevels: [
          {
            levelId: 'level-1',
            description: 'Minimal data analysis with significant errors',
            score: 6
          },
          {
            levelId: 'level-2',
            description: 'Basic data analysis with minor errors',
            score: 12
          },
          {
            levelId: 'level-3',
            description: 'Thorough data analysis with accurate interpretations',
            score: 19
          },
          {
            levelId: 'level-4',
            description: 'Sophisticated data analysis with insightful interpretations',
            score: 25
          }
        ]
      },
      {
        id: 'criterion-3',
        name: 'Impact Evaluation',
        description: 'Evaluation of the environmental impact on local ecosystems',
        bloomsLevel: BloomsTaxonomyLevel.EVALUATE,
        weight: 30,
        learningOutcomeIds: [],
        performanceLevels: [
          {
            levelId: 'level-1',
            description: 'Superficial evaluation with limited understanding',
            score: 7
          },
          {
            levelId: 'level-2',
            description: 'Basic evaluation with some understanding of impacts',
            score: 15
          },
          {
            levelId: 'level-3',
            description: 'Thorough evaluation with clear understanding of impacts',
            score: 22
          },
          {
            levelId: 'level-4',
            description: 'Comprehensive evaluation with nuanced understanding of impacts',
            score: 30
          }
        ]
      },
      {
        id: 'criterion-4',
        name: 'Solution Proposal',
        description: 'Quality and feasibility of proposed solutions',
        bloomsLevel: BloomsTaxonomyLevel.CREATE,
        weight: 25,
        learningOutcomeIds: [],
        performanceLevels: [
          {
            levelId: 'level-1',
            description: 'Vague or impractical solutions',
            score: 6
          },
          {
            levelId: 'level-2',
            description: 'Basic solutions with limited feasibility',
            score: 12
          },
          {
            levelId: 'level-3',
            description: 'Well-developed solutions with good feasibility',
            score: 19
          },
          {
            levelId: 'level-4',
            description: 'Innovative, comprehensive solutions with high feasibility',
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
        scoreRange: { min: 0, max: 59 },
        color: '#ff5252'
      },
      {
        id: 'level-2',
        name: 'Developing',
        description: 'Partially meets expectations',
        scoreRange: { min: 60, max: 74 },
        color: '#ffb74d'
      },
      {
        id: 'level-3',
        name: 'Proficient',
        description: 'Meets expectations',
        scoreRange: { min: 75, max: 89 },
        color: '#4caf50'
      },
      {
        id: 'level-4',
        name: 'Exemplary',
        description: 'Exceeds expectations',
        scoreRange: { min: 90, max: 100 },
        color: '#2196f3'
      }
    ],
    maxScore: 100,
    createdById: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Example Bloom's distribution
  const bloomsDistribution = {
    [BloomsTaxonomyLevel.REMEMBER]: 0,
    [BloomsTaxonomyLevel.UNDERSTAND]: 0,
    [BloomsTaxonomyLevel.APPLY]: 0,
    [BloomsTaxonomyLevel.ANALYZE]: 45,
    [BloomsTaxonomyLevel.EVALUATE]: 30,
    [BloomsTaxonomyLevel.CREATE]: 25
  };
  
  // Handle form submission
  const handleSubmit = () => {
    setIsSubmitting(true);
    
    createAssignmentMutation.mutate({
      title,
      description,
      instructions,
      classId,
      subjectId,
      topicId,
      bloomsLevel,
      maxScore,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      allowLateSubmission,
      rubricId: exampleRubric.id,
      type: 'PROJECT'
    });
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Custom Assignment</CardTitle>
          <CardDescription>
            Create a custom assignment with Bloom's Taxonomy integration and rubric-based grading
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="details">Assignment Details</TabsTrigger>
              <TabsTrigger value="blooms">Bloom's Taxonomy</TabsTrigger>
              <TabsTrigger value="rubric">Rubric</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter assignment title"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter assignment description"
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="instructions">Instructions</Label>
                  <Textarea
                    id="instructions"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Enter assignment instructions"
                    rows={5}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="maxScore">Maximum Score</Label>
                    <Input
                      id="maxScore"
                      type="number"
                      value={maxScore}
                      onChange={(e) => setMaxScore(Number(e.target.value))}
                      min={0}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="allowLateSubmission"
                    checked={allowLateSubmission}
                    onCheckedChange={(checked) => setAllowLateSubmission(!!checked)}
                  />
                  <Label htmlFor="allowLateSubmission">Allow late submission</Label>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="blooms">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Select Bloom's Taxonomy Level</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Choose the primary cognitive level for this assignment
                  </p>
                  
                  <BloomsTaxonomySelector
                    value={bloomsLevel}
                    onChange={setBloomsLevel}
                    variant="buttons"
                    showDescription={true}
                  />
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Cognitive Level Distribution</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Distribution of cognitive levels in this assignment
                  </p>
                  
                  <BloomsDistributionChart
                    distribution={bloomsDistribution}
                    showLegend={true}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="rubric">
              <div>
                <h3 className="text-lg font-medium mb-2">Grading Rubric</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  This rubric will be used for grading student submissions
                </p>
                
                <RubricPreview
                  rubric={exampleRubric}
                  showBloomsLevels={true}
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Assignment'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
