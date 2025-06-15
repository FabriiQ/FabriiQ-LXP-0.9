'use client';

/**
 * Custom Activity Example with Bloom's Taxonomy Integration
 * 
 * This component demonstrates a custom activity that uses Bloom's Taxonomy
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
import { BloomsTaxonomySelector } from '@/features/bloom/components/taxonomy/BloomsTaxonomySelector';
import { BloomsDistributionChart } from '@/features/bloom/components/visualization/BloomsDistributionChart';
import { RubricPreview } from '@/features/bloom/components/rubric/RubricPreview';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';
import { RubricType } from '@/features/bloom/types/rubric';

// Define the props for the component
interface CustomActivityProps {
  classId: string;
  subjectId: string;
  topicId?: string;
}

/**
 * CustomActivity Component
 */
export function CustomActivity({
  classId,
  subjectId,
  topicId
}: CustomActivityProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Activity state
  const [title, setTitle] = useState('Critical Analysis Essay');
  const [description, setDescription] = useState('Analyze a literary work of your choice using critical thinking skills.');
  const [instructions, setInstructions] = useState('Write a 500-word essay analyzing the themes, characters, and literary devices in a work of fiction. Support your analysis with specific examples from the text.');
  const [bloomsLevel, setBloomsLevel] = useState<BloomsTaxonomyLevel>(BloomsTaxonomyLevel.ANALYZE);
  const [maxScore, setMaxScore] = useState(100);
  const [dueDate, setDueDate] = useState<string>('');
  
  // Fetch rubric
  const { data: rubric, isLoading: isRubricLoading } = api.rubric.getById.useQuery(
    { id: 'example-rubric-id' },
    { enabled: false } // Disabled for this example
  );
  
  // Create activity mutation
  const createActivityMutation = api.activity.create.useMutation({
    onSuccess: (data) => {
      toast({
        title: 'Activity created',
        description: 'The activity has been created successfully.',
      });
      router.push(`/admin/campus/classes/${classId}/activities/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: 'Error creating activity',
        description: error.message,
        variant: 'error',
      });
      setIsSubmitting(false);
    }
  });
  
  // Example rubric data for preview
  const exampleRubric = {
    id: 'example-rubric-id',
    title: 'Critical Analysis Essay Rubric',
    description: 'Rubric for evaluating critical analysis essays',
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
    [BloomsTaxonomyLevel.ANALYZE]: 75,
    [BloomsTaxonomyLevel.EVALUATE]: 25,
    [BloomsTaxonomyLevel.CREATE]: 0
  };
  
  // Handle form submission
  const handleSubmit = () => {
    setIsSubmitting(true);
    
    createActivityMutation.mutate({
      title,
      description,
      instructions,
      classId,
      subjectId,
      topicId,
      bloomsLevel,
      maxScore,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      isGradable: true,
      rubricId: exampleRubric.id
    });
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Custom Activity</CardTitle>
          <CardDescription>
            Create a custom activity with Bloom's Taxonomy integration and rubric-based grading
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="details">Activity Details</TabsTrigger>
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
                    placeholder="Enter activity title"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter activity description"
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="instructions">Instructions</Label>
                  <Textarea
                    id="instructions"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Enter activity instructions"
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
              </div>
            </TabsContent>
            
            <TabsContent value="blooms">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Select Bloom's Taxonomy Level</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Choose the primary cognitive level for this activity
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
                    Distribution of cognitive levels in this activity
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
            {isSubmitting ? 'Creating...' : 'Create Activity'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
