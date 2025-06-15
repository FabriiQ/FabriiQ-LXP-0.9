'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MasteryLeaderboard } from '../mastery/MasteryLeaderboard';
import { BloomsTaxonomyLevel } from '../../types';
import { BLOOMS_LEVEL_METADATA } from '../../constants/bloom-levels';
import { useTrpcMastery } from '../../hooks/useTrpcMastery';
import { Skeleton } from '@/components/ui/skeleton';

interface MasteryLeaderboardIntegrationProps {
  classId?: string;
  subjectId?: string;
  topicId?: string;
  studentId?: string;
  className?: string;
}

/**
 * Component for integrating mastery metrics into leaderboards
 */
export function MasteryLeaderboardIntegration({
  classId,
  subjectId,
  topicId,
  studentId,
  className = '',
}: MasteryLeaderboardIntegrationProps) {
  // State for active tab and selected level
  const [activeTab, setActiveTab] = useState<'overall' | 'cognitive'>('overall');
  const [selectedLevel, setSelectedLevel] = useState<BloomsTaxonomyLevel>(BloomsTaxonomyLevel.REMEMBER);

  // Get leaderboard data
  const {
    getGlobalLeaderboard,
    getClassLeaderboard,
    getSubjectLeaderboard,
    getTopicLeaderboard,
    getBloomsLevelLeaderboard,
    isLoadingMastery
  } = useTrpcMastery();

  // Get appropriate leaderboard based on provided IDs
  const { data: globalLeaderboard } = getGlobalLeaderboard(10);
  const { data: classLeaderboard } = classId ? getClassLeaderboard(classId, 10) : { data: undefined };
  const { data: subjectLeaderboard } = subjectId ? getSubjectLeaderboard(subjectId, 10) : { data: undefined };
  const { data: topicLeaderboard } = topicId ? getTopicLeaderboard(topicId, 10) : { data: undefined };
  const { data: bloomsLeaderboard } = getBloomsLevelLeaderboard(selectedLevel, 10);

  // Determine which leaderboard to use
  const overallLeaderboard = topicLeaderboard || subjectLeaderboard || classLeaderboard || globalLeaderboard;

  // Loading state
  const isLoading = isLoadingMastery;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Mastery Leaderboard</CardTitle>
        <CardDescription>
          Student rankings based on mastery levels
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overall" onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="overall">Overall Mastery</TabsTrigger>
            <TabsTrigger value="cognitive">Cognitive Levels</TabsTrigger>
          </TabsList>

          {/* Overall Mastery Tab */}
          <TabsContent value="overall">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : overallLeaderboard?.entries ? (
              <MasteryLeaderboard
                entries={overallLeaderboard.entries}
                highlightUserId={studentId}
                showBloomsLevels={true}
              />
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No leaderboard data available
              </div>
            )}
          </TabsContent>

          {/* Cognitive Levels Tab */}
          <TabsContent value="cognitive">
            <div className="mb-4">
              <Select
                value={selectedLevel}
                onValueChange={(value) => setSelectedLevel(value as BloomsTaxonomyLevel)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a cognitive level" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(BloomsTaxonomyLevel).map((level) => {
                    const metadata = BLOOMS_LEVEL_METADATA[level];
                    return (
                      <SelectItem key={level} value={level}>
                        <span className="flex items-center">
                          <span
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: metadata.color }}
                          />
                          {metadata.name}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : bloomsLeaderboard?.entries ? (
              <MasteryLeaderboard
                entries={bloomsLeaderboard.entries}
                highlightUserId={studentId}
                title={`${BLOOMS_LEVEL_METADATA[selectedLevel].name} Leaderboard`}
              />
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No leaderboard data available for this cognitive level
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
