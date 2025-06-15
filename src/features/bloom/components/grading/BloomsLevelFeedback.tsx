'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/atoms/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Lightbulb, 
  Copy, 
  CheckCircle, 
  ExternalLink, 
  BookOpen,
  HelpCircle
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

import {
  BloomsTaxonomyLevel
} from '../../types';
import { BLOOMS_LEVEL_METADATA, BLOOMS_LEVEL_ACTION_VERBS } from '../../constants/bloom-levels';

interface BloomsLevelFeedbackProps {
  bloomsLevel: BloomsTaxonomyLevel;
  studentName?: string;
  onFeedbackSelect: (feedback: string) => void;
  className?: string;
}

/**
 * BloomsLevelFeedback component
 * 
 * This component provides level-specific feedback templates and suggestions
 * for each Bloom's Taxonomy cognitive level.
 */
export function BloomsLevelFeedback({
  bloomsLevel,
  studentName = 'Student',
  onFeedbackSelect,
  className = '',
}: BloomsLevelFeedbackProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('templates');
  const [customFeedback, setCustomFeedback] = useState<string>('');
  
  const metadata = BLOOMS_LEVEL_METADATA[bloomsLevel];
  const actionVerbs = BLOOMS_LEVEL_ACTION_VERBS[bloomsLevel];

  // Feedback templates for each level
  const getFeedbackTemplates = (): string[] => {
    const templates: Record<BloomsTaxonomyLevel, string[]> = {
      [BloomsTaxonomyLevel.REMEMBER]: [
        `${studentName} demonstrates good recall of key facts and terminology.`,
        `${studentName} accurately identifies and lists the main concepts.`,
        `${studentName} needs to work on memorizing the essential terminology and definitions.`,
        `${studentName} shows strong ability to recall specific details from the material.`
      ],
      [BloomsTaxonomyLevel.UNDERSTAND]: [
        `${studentName} clearly explains the main concepts in their own words.`,
        `${studentName} effectively summarizes the key ideas from the material.`,
        `${studentName} needs to focus on interpreting the information rather than just repeating it.`,
        `${studentName} demonstrates good understanding by providing relevant examples.`
      ],
      [BloomsTaxonomyLevel.APPLY]: [
        `${studentName} successfully applies concepts to solve new problems.`,
        `${studentName} demonstrates the ability to use learned material in new situations.`,
        `${studentName} needs to practice applying the concepts to different scenarios.`,
        `${studentName} shows good application skills by implementing the procedures correctly.`
      ],
      [BloomsTaxonomyLevel.ANALYZE]: [
        `${studentName} effectively breaks down complex information into component parts.`,
        `${studentName} identifies patterns and relationships between concepts.`,
        `${studentName} needs to develop stronger analytical skills to examine the underlying structure.`,
        `${studentName} demonstrates good analysis by distinguishing between facts and inferences.`
      ],
      [BloomsTaxonomyLevel.EVALUATE]: [
        `${studentName} makes well-reasoned judgments based on specific criteria.`,
        `${studentName} critically assesses the validity of ideas and information.`,
        `${studentName} needs to develop stronger evaluation skills with more supporting evidence.`,
        `${studentName} demonstrates good evaluation by comparing and contrasting different perspectives.`
      ],
      [BloomsTaxonomyLevel.CREATE]: [
        `${studentName} generates innovative ideas and original solutions.`,
        `${studentName} synthesizes information to create a cohesive and novel product.`,
        `${studentName} needs to develop more creative approaches rather than relying on existing models.`,
        `${studentName} demonstrates creativity by designing unique solutions to complex problems.`
      ]
    };
    
    return templates[bloomsLevel];
  };

  // Improvement suggestions for each level
  const getImprovementSuggestions = (): string[] => {
    const suggestions: Record<BloomsTaxonomyLevel, string[]> = {
      [BloomsTaxonomyLevel.REMEMBER]: [
        `Practice creating flashcards with key terms and definitions.`,
        `Create concept maps to visualize relationships between facts.`,
        `Use spaced repetition techniques to improve long-term retention.`,
        `Try explaining concepts to someone else without referring to notes.`
      ],
      [BloomsTaxonomyLevel.UNDERSTAND]: [
        `Practice summarizing information in your own words.`,
        `Create examples that illustrate the concepts.`,
        `Compare and contrast related concepts to deepen understanding.`,
        `Try to predict questions that might be asked about the material.`
      ],
      [BloomsTaxonomyLevel.APPLY]: [
        `Work through additional practice problems that use the concepts in new ways.`,
        `Try to identify real-world situations where these concepts apply.`,
        `Create your own scenarios that would require applying these concepts.`,
        `Practice explaining your problem-solving process step by step.`
      ],
      [BloomsTaxonomyLevel.ANALYZE]: [
        `Practice breaking complex problems into smaller components.`,
        `Identify assumptions and biases in arguments or information.`,
        `Create diagrams that show relationships between different elements.`,
        `Compare multiple perspectives on the same issue to identify patterns.`
      ],
      [BloomsTaxonomyLevel.EVALUATE]: [
        `Develop specific criteria for evaluating the quality of work.`,
        `Practice supporting opinions with evidence and reasoning.`,
        `Analyze the strengths and weaknesses of different approaches.`,
        `Consider alternative viewpoints and evaluate their merits.`
      ],
      [BloomsTaxonomyLevel.CREATE]: [
        `Brainstorm multiple solutions before settling on one approach.`,
        `Combine ideas from different sources to create something new.`,
        `Challenge assumptions and look for unconventional approaches.`,
        `Seek feedback on creative work and be willing to iterate.`
      ]
    };
    
    return suggestions[bloomsLevel];
  };

  // Resources for each level
  const getLevelResources = (): { title: string; url: string }[] => {
    const resources: Record<BloomsTaxonomyLevel, { title: string; url: string }[]> = {
      [BloomsTaxonomyLevel.REMEMBER]: [
        { title: "Memory Techniques for Students", url: "https://www.learningscientists.org/blog/2016/6/23-1" },
        { title: "Effective Flashcard Strategies", url: "https://www.learningscientists.org/blog/2016/2/20-1" }
      ],
      [BloomsTaxonomyLevel.UNDERSTAND]: [
        { title: "Comprehension Strategies", url: "https://www.readingrockets.org/strategies/comprehension" },
        { title: "Concept Mapping Guide", url: "https://www.lucidchart.com/pages/concept-map" }
      ],
      [BloomsTaxonomyLevel.APPLY]: [
        { title: "Problem-Based Learning Resources", url: "https://www.pblworks.org/what-is-pbl" },
        { title: "Application Exercises for Students", url: "https://teachingcommons.stanford.edu/resources/learning/learning-activities" }
      ],
      [BloomsTaxonomyLevel.ANALYZE]: [
        { title: "Critical Thinking Foundation", url: "https://www.criticalthinking.org/pages/critical-thinking-in-everyday-life-9-strategies/512" },
        { title: "Analytical Thinking Skills", url: "https://www.skillsyouneed.com/learn/critical-thinking.html" }
      ],
      [BloomsTaxonomyLevel.EVALUATE]: [
        { title: "Evaluation Criteria Development", url: "https://www.cmu.edu/teaching/assessment/assesslearning/rubrics.html" },
        { title: "Critical Evaluation Skills", url: "https://www.skillsyouneed.com/learn/critical-thinking-evaluation.html" }
      ],
      [BloomsTaxonomyLevel.CREATE]: [
        { title: "Creative Thinking Techniques", url: "https://www.mindtools.com/pages/article/creative-thinking.htm" },
        { title: "Design Thinking Process", url: "https://www.interaction-design.org/literature/article/5-stages-in-the-design-thinking-process" }
      ]
    };
    
    return resources[bloomsLevel];
  };

  // Handle feedback selection
  const handleFeedbackSelect = (feedback: string) => {
    onFeedbackSelect(feedback);
    toast({
      title: "Feedback selected",
      description: "The feedback has been added to your grading form.",
      variant: "success",
    });
  };

  // Handle copy to clipboard
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "The feedback has been copied to your clipboard.",
      variant: "success",
    });
  };

  // Handle custom feedback submission
  const handleCustomFeedbackSubmit = () => {
    if (!customFeedback.trim()) {
      toast({
        title: "Empty feedback",
        description: "Please enter some feedback before submitting.",
        variant: "destructive",
      });
      return;
    }
    
    onFeedbackSelect(customFeedback);
    toast({
      title: "Custom feedback added",
      description: "Your custom feedback has been added to the grading form.",
      variant: "success",
    });
    setCustomFeedback('');
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div 
            className="w-4 h-4 rounded-full" 
            style={{ backgroundColor: metadata.color }}
          />
          <span>{metadata.name} Level Feedback</span>
        </CardTitle>
        <CardDescription>
          Feedback templates and suggestions for {metadata.name.toLowerCase()} cognitive skills
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>Templates</span>
            </TabsTrigger>
            <TabsTrigger value="improvement" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              <span>Improvement</span>
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span>Resources</span>
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              <span>Custom</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge
                  className="text-white"
                  style={{ backgroundColor: metadata.color }}
                >
                  {metadata.name}
                </Badge>
                <span className="text-sm text-muted-foreground">{metadata.description}</span>
              </div>
              
              <div className="space-y-2">
                {getFeedbackTemplates().map((template, index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardContent className="pt-6">
                      <p className="text-sm">{template}</p>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2 border-t pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(template)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleFeedbackSelect(template)}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Use Feedback
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="improvement">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge
                  className="text-white"
                  style={{ backgroundColor: metadata.color }}
                >
                  {metadata.name}
                </Badge>
                <span className="text-sm text-muted-foreground">Suggestions for improvement</span>
              </div>
              
              <div className="space-y-2">
                {getImprovementSuggestions().map((suggestion, index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardContent className="pt-6">
                      <p className="text-sm">{suggestion}</p>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2 border-t pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(suggestion)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleFeedbackSelect(suggestion)}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Use Feedback
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="resources">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge
                  className="text-white"
                  style={{ backgroundColor: metadata.color }}
                >
                  {metadata.name}
                </Badge>
                <span className="text-sm text-muted-foreground">Helpful resources</span>
              </div>
              
              <div className="space-y-2">
                {getLevelResources().map((resource, index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{resource.title}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <a href={resource.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Suggested Action Verbs</h3>
                <div className="flex flex-wrap gap-2">
                  {actionVerbs.map((verb, index) => (
                    <TooltipProvider key={index}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="cursor-help">
                            {verb}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Use "{verb}" in your feedback to target {metadata.name.toLowerCase()} skills</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="custom">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge
                  className="text-white"
                  style={{ backgroundColor: metadata.color }}
                >
                  {metadata.name}
                </Badge>
                <span className="text-sm text-muted-foreground">Create custom feedback</span>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="custom-feedback">Custom Feedback</Label>
                <Textarea
                  id="custom-feedback"
                  placeholder={`Enter custom feedback for ${metadata.name.toLowerCase()} level skills...`}
                  value={customFeedback}
                  onChange={(e) => setCustomFeedback(e.target.value)}
                  className="min-h-[100px]"
                />
                
                <div className="flex justify-end gap-2 mt-2">
                  <Button
                    variant="outline"
                    onClick={() => setCustomFeedback('')}
                  >
                    Clear
                  </Button>
                  <Button
                    variant="default"
                    onClick={handleCustomFeedbackSubmit}
                    disabled={!customFeedback.trim()}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Use Feedback
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
