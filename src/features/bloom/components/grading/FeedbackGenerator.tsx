'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/atoms/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, RefreshCw, Copy, CheckCircle, Sparkles, Lightbulb } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

import {
  BloomsTaxonomyLevel
} from '../../types';
import { BLOOMS_LEVEL_METADATA } from '../../constants/bloom-levels';
import { BloomsFeedbackSuggestion } from '../../types/grading';

interface FeedbackGeneratorProps {
  bloomsLevels: BloomsTaxonomyLevel[];
  studentName?: string;
  submissionContent?: string;
  onFeedbackSelect: (feedback: string, bloomsLevel?: BloomsTaxonomyLevel) => void;
  className?: string;
}

/**
 * FeedbackGenerator component
 *
 * This component provides AI-assisted feedback generation for student submissions
 * based on Bloom's Taxonomy cognitive levels.
 */
export function FeedbackGenerator({
  bloomsLevels,
  studentName = 'Student',
  submissionContent = '',
  onFeedbackSelect,
  className = '',
}: FeedbackGeneratorProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<BloomsTaxonomyLevel | 'general'>(
    bloomsLevels.length > 0 ? bloomsLevels[0] : 'general'
  );
  const [isGenerating, setIsGenerating] = useState<Record<string, boolean>>({});
  const [suggestions, setSuggestions] = useState<Record<string, BloomsFeedbackSuggestion[]>>({});
  const [generalFeedback, setGeneralFeedback] = useState<string[]>([]);

  // Sort levels by Bloom's taxonomy order
  const sortedLevels = [...bloomsLevels].sort((a, b) => {
    const aOrder = BLOOMS_LEVEL_METADATA[a].order;
    const bOrder = BLOOMS_LEVEL_METADATA[b].order;
    return aOrder - bOrder;
  });

  // Generate feedback for a specific level
  const generateFeedback = async (level: BloomsTaxonomyLevel | 'general') => {
    setIsGenerating(prev => ({ ...prev, [level]: true }));

    try {
      // In a real implementation, this would call an API endpoint
      // that uses an LLM to generate feedback based on the submission
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call

      if (level === 'general') {
        // Generate general feedback
        const newFeedback = [
          `${studentName} demonstrates a good understanding of the core concepts.`,
          `${studentName}'s work shows thoughtful engagement with the material.`,
          `Overall, ${studentName} has made good progress, but could benefit from more detailed explanations.`
        ];
        setGeneralFeedback(newFeedback);
      } else {
        // Generate level-specific feedback
        const metadata = BLOOMS_LEVEL_METADATA[level];
        const newSuggestions: BloomsFeedbackSuggestion[] = [
          {
            bloomsLevel: level,
            suggestion: `${studentName} demonstrates ${metadata.name.toLowerCase()} skills by accurately ${getActionVerbForLevel(level)} the key concepts.`,
            improvementTips: [
              `To further develop ${metadata.name.toLowerCase()} skills, try to ${getActionVerbForLevel(level)} more complex examples.`,
              `Practice ${getActionVerbForLevel(level)} in different contexts to strengthen this cognitive skill.`
            ],
            resources: [
              `Review chapter 3 for more examples of ${metadata.name.toLowerCase()} tasks.`,
              `The supplementary materials provide additional practice for ${metadata.name.toLowerCase()} skills.`
            ]
          },
          {
            bloomsLevel: level,
            suggestion: `${studentName}'s ability to ${getActionVerbForLevel(level)} shows good progress at the ${metadata.name} level of Bloom's Taxonomy.`,
            improvementTips: [
              `To improve, focus on ${getActionVerbForLevel(level)} with greater precision and detail.`,
              `Try to connect ${metadata.name.toLowerCase()} skills with other cognitive levels.`
            ],
            resources: [
              `The practice exercises in section 4 will help strengthen ${metadata.name.toLowerCase()} abilities.`
            ]
          }
        ];

        setSuggestions(prev => ({
          ...prev,
          [level]: [...(prev[level] || []), ...newSuggestions]
        }));
      }

      toast({
        title: "Feedback generated",
        description: `${level === 'general' ? 'General' : BLOOMS_LEVEL_METADATA[level].name} feedback suggestions are ready.`,
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error generating feedback",
        description: "There was an error generating feedback. Please try again.",
        variant: "error",
      });
    } finally {
      setIsGenerating(prev => ({ ...prev, [level]: false }));
    }
  };

  // Get a relevant action verb for a specific Bloom's level
  const getActionVerbForLevel = (level: BloomsTaxonomyLevel): string => {
    switch (level) {
      case BloomsTaxonomyLevel.REMEMBER:
        return 'recalling';
      case BloomsTaxonomyLevel.UNDERSTAND:
        return 'explaining';
      case BloomsTaxonomyLevel.APPLY:
        return 'implementing';
      case BloomsTaxonomyLevel.ANALYZE:
        return 'examining';
      case BloomsTaxonomyLevel.EVALUATE:
        return 'critiquing';
      case BloomsTaxonomyLevel.CREATE:
        return 'designing';
      default:
        return 'demonstrating';
    }
  };

  // Handle feedback selection
  const handleFeedbackSelect = (feedback: string, level?: BloomsTaxonomyLevel) => {
    onFeedbackSelect(feedback, level);
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

  // Render feedback suggestions for a specific level
  const renderLevelSuggestions = (level: BloomsTaxonomyLevel) => {
    const levelSuggestions = suggestions[level] || [];
    const metadata = BLOOMS_LEVEL_METADATA[level];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge
              className="text-white"
              style={{ backgroundColor: metadata.color }}
            >
              {metadata.name}
            </Badge>
            <span className="text-sm text-muted-foreground">{metadata.description}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateFeedback(level)}
            disabled={isGenerating[level]}
          >
            {isGenerating[level] ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Feedback
              </>
            )}
          </Button>
        </div>

        {levelSuggestions.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No feedback suggestions available. Click "Generate Feedback" to create suggestions.
          </div>
        ) : (
          <div className="space-y-4">
            {levelSuggestions.map((suggestion, index) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader className="pb-2 bg-muted/50">
                  <CardTitle className="text-base">Feedback Suggestion</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm">{suggestion.suggestion}</p>
                    </div>

                    {suggestion.improvementTips.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Improvement Tips</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          {suggestion.improvementTips.map((tip, tipIndex) => (
                            <li key={tipIndex} className="text-sm">{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {suggestion.resources && suggestion.resources.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Resources</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          {suggestion.resources.map((resource, resourceIndex) => (
                            <li key={resourceIndex} className="text-sm">{resource}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 border-t pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(suggestion.suggestion)}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleFeedbackSelect(suggestion.suggestion, suggestion.bloomsLevel)}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Use Feedback
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render general feedback suggestions
  const renderGeneralSuggestions = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              General Feedback
            </Badge>
            <span className="text-sm text-muted-foreground">Overall feedback for the submission</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateFeedback('general')}
            disabled={isGenerating['general']}
          >
            {isGenerating['general'] ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Feedback
              </>
            )}
          </Button>
        </div>

        {generalFeedback.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No general feedback available. Click "Generate Feedback" to create suggestions.
          </div>
        ) : (
          <div className="space-y-4">
            {generalFeedback.map((feedback, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="pt-6">
                  <p className="text-sm">{feedback}</p>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 border-t pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(feedback)}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleFeedbackSelect(feedback)}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Use Feedback
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          AI Feedback Generator
        </CardTitle>
        <CardDescription>
          Generate personalized feedback based on Bloom's Taxonomy
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as BloomsTaxonomyLevel | 'general')}>
          <TabsList className="mb-4">
            <TabsTrigger value="general">General</TabsTrigger>
            {sortedLevels.map(level => {
              const metadata = BLOOMS_LEVEL_METADATA[level];
              return (
                <TabsTrigger
                  key={level}
                  value={level}
                  className="flex items-center gap-2"
                  style={{
                    borderBottomColor: metadata.color,
                    borderBottomWidth: '2px'
                  }}
                >
                  <span style={{ color: metadata.color }}>{metadata.name}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="general">
            {renderGeneralSuggestions()}
          </TabsContent>

          {sortedLevels.map(level => (
            <TabsContent key={level} value={level}>
              {renderLevelSuggestions(level)}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
