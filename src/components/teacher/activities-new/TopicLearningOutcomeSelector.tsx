'use client';

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { api } from "@/trpc/react";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { BloomsTaxonomyLevel } from "@/features/bloom/types";
import { BLOOMS_LEVEL_METADATA } from "@/features/bloom/constants/bloom-levels";
import { cn } from "@/lib/utils";

interface TopicLearningOutcomeSelectorProps {
  subjectId: string;
  topicId?: string;
  bloomsLevel?: BloomsTaxonomyLevel;
  selectedOutcomeIds: string[];
  onOutcomesChange: (outcomeIds: string[]) => void;
  disabled?: boolean;
}

export function TopicLearningOutcomeSelector({
  subjectId,
  topicId,
  bloomsLevel,
  selectedOutcomeIds,
  onOutcomesChange,
  disabled = false,
}: TopicLearningOutcomeSelectorProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedOutcomeIds || []);

  // Fetch learning outcomes for the selected topic and Bloom's level
  const { data: learningOutcomes, isLoading } = api.lessonPlan.getLearningOutcomesByBloomsLevel.useQuery(
    {
      subjectId,
      topicId,
      bloomsLevel
    },
    {
      enabled: !!subjectId && (!!topicId || !!bloomsLevel),
    }
  );

  // Handle selection change
  const handleSelectionChange = (outcomeId: string, checked: boolean) => {
    let newSelectedIds: string[];
    
    if (checked) {
      newSelectedIds = [...selectedIds, outcomeId];
    } else {
      newSelectedIds = selectedIds.filter(id => id !== outcomeId);
    }
    
    setSelectedIds(newSelectedIds);
    onOutcomesChange(newSelectedIds);
  };

  // Update selected IDs when props change
  useEffect(() => {
    setSelectedIds(selectedOutcomeIds || []);
  }, [selectedOutcomeIds]);

  // Filter outcomes by Bloom's level if specified
  const filteredOutcomes = bloomsLevel 
    ? learningOutcomes?.filter(outcome => outcome.bloomsLevel === bloomsLevel) 
    : learningOutcomes;

  return (
    <div className="space-y-2">
      <Label>Learning Outcomes</Label>
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : !filteredOutcomes || filteredOutcomes.length === 0 ? (
        <Card className="p-4 text-center text-sm text-muted-foreground">
          {!topicId 
            ? "Select a topic to view learning outcomes" 
            : !bloomsLevel 
              ? "Select a Bloom's taxonomy level to view learning outcomes" 
              : "No learning outcomes found for the selected topic and Bloom's level"}
        </Card>
      ) : (
        <ScrollArea className="h-[200px] border rounded-md">
          <div className="divide-y">
            {filteredOutcomes.map(outcome => {
              const isSelected = selectedIds.includes(outcome.id);
              const metadata = BLOOMS_LEVEL_METADATA[outcome.bloomsLevel];
              const levelColor = metadata?.color || '#888888';

              return (
                <div
                  key={outcome.id}
                  className={cn(
                    "p-3 flex items-start space-x-3 hover:bg-muted/50 transition-colors",
                    isSelected && "bg-muted/50"
                  )}
                  style={{
                    borderLeft: isSelected ? `4px solid ${levelColor}` : '4px solid transparent'
                  }}
                >
                  <Checkbox
                    id={`outcome-${outcome.id}`}
                    checked={isSelected}
                    onCheckedChange={(checked) => handleSelectionChange(outcome.id, !!checked)}
                    disabled={disabled}
                  />
                  <div className="space-y-1">
                    <label
                      htmlFor={`outcome-${outcome.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {outcome.statement}
                    </label>
                    <p className="text-xs text-muted-foreground">
                      <span 
                        className="font-medium" 
                        style={{ color: levelColor }}
                      >
                        {metadata?.name}
                      </span>
                      {outcome.description && ` - ${outcome.description}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
      <p className="text-xs text-muted-foreground">
        Select learning outcomes to target with this activity.
      </p>
    </div>
  );
}
