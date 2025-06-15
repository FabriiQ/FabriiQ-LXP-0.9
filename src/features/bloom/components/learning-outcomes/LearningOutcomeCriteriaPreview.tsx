'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  BloomsTaxonomyLevel,
  LearningOutcomeCriterion,
  LearningOutcomePerformanceLevel
} from '../../types';
import { BLOOMS_LEVEL_METADATA } from '../../constants/bloom-levels';

interface LearningOutcomeCriteriaPreviewProps {
  hasCriteria: boolean;
  criteria: LearningOutcomeCriterion[];
  performanceLevels: LearningOutcomePerformanceLevel[];
  className?: string;
}

export function LearningOutcomeCriteriaPreview({
  hasCriteria,
  criteria,
  performanceLevels,
  className = '',
}: LearningOutcomeCriteriaPreviewProps) {
  if (!hasCriteria || !criteria || criteria.length === 0 || !performanceLevels || performanceLevels.length === 0) {
    return (
      <Card className={`${className} bg-muted/20`}>
        <CardContent className="p-4 text-center text-muted-foreground">
          No rubric criteria defined for this learning outcome.
        </CardContent>
      </Card>
    );
  }

  // Sort performance levels by score (highest to lowest)
  const sortedLevels = [...performanceLevels].sort((a, b) => b.scorePercentage - a.scorePercentage);

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Rubric Criteria</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Criterion</TableHead>
                {sortedLevels.map((level) => (
                  <TableHead
                    key={level.id}
                    style={{
                      backgroundColor: `${level.color}10`,
                      borderBottom: `2px solid ${level.color}`
                    }}
                  >
                    {level.name} ({level.scorePercentage}%)
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {criteria.map((criterion) => {
                const bloomsMetadata = BLOOMS_LEVEL_METADATA[criterion.bloomsLevel];

                return (
                  <TableRow key={criterion.id}>
                    <TableCell className="font-medium align-top">
                      <div className="space-y-1">
                        <div>{criterion.name}</div>
                        <Badge
                          style={{
                            backgroundColor: bloomsMetadata.color,
                            color: '#fff'
                          }}
                        >
                          {bloomsMetadata.name}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          {criterion.description}
                        </div>
                      </div>
                    </TableCell>

                    {sortedLevels.map((level) => (
                      <TableCell
                        key={`${criterion.id}-${level.id}`}
                        className="align-top"
                        style={{ backgroundColor: `${level.color}05` }}
                      >
                        <div className="text-sm">
                          {level.description}
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
