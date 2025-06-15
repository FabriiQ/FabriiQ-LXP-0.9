'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/atoms/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/core/alert';
import { Search, Check } from 'lucide-react';
import { AlertTriangle } from '@/components/ui/icons/alert-triangle';
import {
  BloomsTaxonomyLevel,
  LearningOutcome,
  BLOOMS_LEVEL_METADATA
} from '@/features/bloom';
import { cn } from '@/lib/utils';

interface LearningOutcomeAlignmentProps {
  subjectId: string;
  topicId?: string;
  selectedOutcomeIds: string[];
  bloomsLevels?: BloomsTaxonomyLevel[];
  onSelectOutcomes: (outcomeIds: string[]) => void;
  className?: string;
}

/**
 * Component for aligning assessments with learning outcomes
 */
export function LearningOutcomeAlignment({
  subjectId,
  topicId,
  selectedOutcomeIds,
  bloomsLevels = [],
  onSelectOutcomes,
  className = '',
}: LearningOutcomeAlignmentProps) {
  // Mock data for learning outcomes - in a real implementation, this would come from an API
  const [outcomes, setOutcomes] = useState<LearningOutcome[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedOutcomeIds);

  // Fetch learning outcomes - mock implementation
  useEffect(() => {
    // Simulate API call
    const fetchOutcomes = async () => {
      setLoading(true);
      try {
        // In a real implementation, this would be an API call
        // api.learningOutcomes.getBySubject.useQuery({ subjectId, topicId })

        // Mock data
        const mockOutcomes: LearningOutcome[] = [
          {
            id: '1',
            statement: 'Recall the basic principles of atomic structure',
            description: 'Students should be able to describe the components of an atom',
            bloomsLevel: BloomsTaxonomyLevel.REMEMBER,
            actionVerbs: ['Recall', 'Define', 'List'],
            subjectId,
            topicId: topicId || undefined,
            createdById: 'user1',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: '2',
            statement: 'Explain the relationship between atomic structure and chemical bonding',
            description: 'Students should be able to explain how atomic structure influences chemical bonding',
            bloomsLevel: BloomsTaxonomyLevel.UNDERSTAND,
            actionVerbs: ['Explain', 'Describe', 'Discuss'],
            subjectId,
            topicId: topicId || undefined,
            createdById: 'user1',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: '3',
            statement: 'Apply the principles of chemical bonding to predict molecular structures',
            description: 'Students should be able to use VSEPR theory to predict molecular shapes',
            bloomsLevel: BloomsTaxonomyLevel.APPLY,
            actionVerbs: ['Apply', 'Use', 'Demonstrate'],
            subjectId,
            topicId: topicId || undefined,
            createdById: 'user1',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: '4',
            statement: 'Analyze the factors that affect reaction rates',
            description: 'Students should be able to analyze how temperature, concentration, and catalysts affect reaction rates',
            bloomsLevel: BloomsTaxonomyLevel.ANALYZE,
            actionVerbs: ['Analyze', 'Examine', 'Investigate'],
            subjectId,
            topicId: topicId || undefined,
            createdById: 'user1',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];

        setOutcomes(mockOutcomes);
      } catch (error) {
        console.error('Error fetching learning outcomes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOutcomes();
  }, [subjectId, topicId]);

  // Filter outcomes based on search query and Bloom's levels
  const filteredOutcomes = outcomes.filter(outcome => {
    const matchesSearch = searchQuery === '' ||
      outcome.statement.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (outcome.description && outcome.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesBloomsLevels = bloomsLevels.length === 0 ||
      bloomsLevels.includes(outcome.bloomsLevel);

    return matchesSearch && matchesBloomsLevels;
  });

  // Handle outcome selection
  const handleOutcomeToggle = (outcomeId: string) => {
    setSelectedIds(prev => {
      if (prev.includes(outcomeId)) {
        return prev.filter(id => id !== outcomeId);
      } else {
        return [...prev, outcomeId];
      }
    });
  };

  // Handle saving selected outcomes
  const handleSaveSelection = () => {
    onSelectOutcomes(selectedIds);
  };

  // Check alignment with Bloom's levels
  const isAlignedWithBloomsLevels = () => {
    if (bloomsLevels.length === 0 || selectedIds.length === 0) return false;

    const selectedOutcomes = outcomes.filter(outcome => selectedIds.includes(outcome.id));
    const selectedLevels = new Set(selectedOutcomes.map(outcome => outcome.bloomsLevel));

    return bloomsLevels.every(level => selectedLevels.has(level));
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Learning Outcome Alignment</CardTitle>
        <CardDescription>
          Align this assessment with learning outcomes to ensure curriculum coherence
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filter */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search learning outcomes..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Alignment Status */}
        {bloomsLevels.length > 0 && (
          <Alert variant={isAlignedWithBloomsLevels() ? "success" : "warning"}>
            <AlertTitle className="flex items-center space-x-2">
              {isAlignedWithBloomsLevels() ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Aligned with Bloom's Levels</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4" />
                  <span>Not Fully Aligned</span>
                </>
              )}
            </AlertTitle>
            <AlertDescription>
              {isAlignedWithBloomsLevels()
                ? "This assessment is aligned with all the specified Bloom's Taxonomy levels."
                : "This assessment is not aligned with all the specified Bloom's Taxonomy levels. Consider selecting learning outcomes that cover all levels."}
            </AlertDescription>
          </Alert>
        )}

        {/* Learning Outcomes List */}
        <div className="border rounded-md">
          {loading ? (
            <div className="p-4 text-center">Loading learning outcomes...</div>
          ) : filteredOutcomes.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No learning outcomes found. Try adjusting your search or filters.
            </div>
          ) : (
            <div className="divide-y">
              {filteredOutcomes.map(outcome => {
                const isSelected = selectedIds.includes(outcome.id);
                const metadata = BLOOMS_LEVEL_METADATA[outcome.bloomsLevel];

                return (
                  <div
                    key={outcome.id}
                    className={cn(
                      "p-3 flex items-start space-x-3 hover:bg-muted/50 transition-colors",
                      isSelected && "bg-muted/50"
                    )}
                  >
                    <Checkbox
                      id={`outcome-${outcome.id}`}
                      checked={isSelected}
                      onCheckedChange={() => handleOutcomeToggle(outcome.id)}
                    />
                    <div className="space-y-1">
                      <Label
                        htmlFor={`outcome-${outcome.id}`}
                        className="font-medium cursor-pointer"
                      >
                        {outcome.statement}
                      </Label>
                      {outcome.description && (
                        <p className="text-sm text-muted-foreground">
                          {outcome.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-2 mt-1">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border border-gray-200`}
                          style={{
                            backgroundColor: `${metadata.color}20`,
                            color: metadata.color,
                            borderColor: metadata.color
                          }}
                        >
                          {metadata.name}
                        </span>
                        {outcome.actionVerbs.slice(0, 2).map(verb => (
                          <Badge key={verb} variant="outline" className="text-xs">
                            {verb}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          {selectedIds.length} outcome{selectedIds.length !== 1 ? 's' : ''} selected
        </div>
        <Button onClick={handleSaveSelection}>
          Save Alignment
        </Button>
      </CardFooter>
    </Card>
  );
}
