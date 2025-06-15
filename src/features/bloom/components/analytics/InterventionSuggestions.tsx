'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InterventionSuggestion } from '../../types/analytics';
import { BLOOMS_LEVEL_METADATA } from '../../constants/bloom-levels';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

interface InterventionSuggestionsProps {
  suggestions: InterventionSuggestion[];
  title?: string;
  description?: string;
  className?: string;
  isLoading?: boolean;
}

export function InterventionSuggestions({
  suggestions,
  title = "Intervention Suggestions",
  description = "Recommended interventions based on cognitive gaps",
  className = "",
  isLoading = false
}: InterventionSuggestionsProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <div className="animate-pulse bg-gray-200 h-12 rounded-md" />
            <div className="animate-pulse bg-gray-200 h-12 rounded-md" />
            <div className="animate-pulse bg-gray-200 h-12 rounded-md" />
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No intervention suggestions needed at this time.
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {suggestions.map((suggestion, index) => {
              const levelMetadata = BLOOMS_LEVEL_METADATA[suggestion.bloomsLevel];

              return (
                <AccordionItem key={suggestion.id} value={`item-${index}`}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2 text-left">
                      <div
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          "text-white"
                        )}
                        style={{ backgroundColor: levelMetadata.color }}
                      >
                        {levelMetadata.name}
                      </div>
                      <span>{suggestion.description}</span>
                      <span className="text-muted-foreground text-sm ml-auto">
                        {suggestion.targetStudentCount} students
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pt-2 pb-4 px-4">
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Suggested Activities</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          {suggestion.activitySuggestions.map((activity, actIndex) => (
                            <li key={actIndex} className="text-sm">{activity}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium mb-2">Recommended Resources</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          {suggestion.resourceSuggestions.map((resource, resIndex) => (
                            <li key={resIndex} className="text-sm">{resource}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
