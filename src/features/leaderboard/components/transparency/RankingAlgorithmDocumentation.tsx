'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  AlertCircle,
  BookOpen,
  BarChart,
  ChevronRight,
  FileText,
  HelpCircle,
  List,
  Settings
} from 'lucide-react';
import {
  Sun as Lightbulb,
  ArrowRight as Play
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { api } from '@/utils/api';

export interface RankingAlgorithmDocumentationProps {
  className?: string;
}

export function RankingAlgorithmDocumentation({
  className
}: RankingAlgorithmDocumentationProps) {
  const [activeTab, setActiveTab] = useState<string>('overview');

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Ranking Algorithm Documentation</CardTitle>
            <CardDescription>
              How your position on the leaderboard is calculated
            </CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" align="center" className="max-w-xs">
                <p className="text-sm">
                  This documentation explains how the leaderboard ranking algorithm works,
                  including how points are calculated and how ties are broken.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Technical Details</TabsTrigger>
            <TabsTrigger value="examples">Examples</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Fair and Transparent</AlertTitle>
              <AlertDescription>
                Our ranking algorithm is designed to be fair, transparent, and to encourage positive learning behaviors.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">How Rankings Work</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-full bg-blue-100">
                        <BarChart className="h-4 w-4 text-blue-700" />
                      </div>
                      <CardTitle className="text-base">Point Calculation</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      Points are earned through various activities including completing assignments,
                      attendance, participation, and achievements. Different activities award different
                      point values based on their difficulty and importance.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-full bg-green-100">
                        <List className="h-4 w-4 text-green-700" />
                      </div>
                      <CardTitle className="text-base">Ranking Order</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      Students are ranked in descending order based on their total points.
                      The student with the most points is ranked #1. In case of a tie,
                      academic scores and consistency are used as tiebreakers.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-full bg-purple-100">
                        <BarChart className="h-4 w-4 text-purple-700" />
                      </div>
                      <CardTitle className="text-base">Tiebreakers</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      When two students have the same number of points, ties are broken by:
                    </p>
                    <ol className="list-decimal list-inside text-sm mt-2 space-y-1">
                      <li>Academic score (higher is better)</li>
                      <li>Consistency score (higher is better)</li>
                      <li>Completion rate (higher is better)</li>
                      <li>Most recent activity (more recent is better)</li>
                    </ol>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-full bg-yellow-100">
                        <Settings className="h-4 w-4 text-yellow-700" />
                      </div>
                      <CardTitle className="text-base">Update Frequency</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      Leaderboard rankings are updated:
                    </p>
                    <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                      <li>Immediately when points are earned</li>
                      <li>Daily at midnight for daily leaderboards</li>
                      <li>Weekly on Sunday for weekly leaderboards</li>
                      <li>Monthly on the 1st for monthly leaderboards</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>Ranking Algorithm</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <p className="text-sm">
                      The ranking algorithm follows these steps:
                    </p>
                    <ol className="list-decimal list-inside text-sm space-y-2">
                      <li>
                        <strong>Collect Data:</strong> Gather all students' points, academic scores, and other metrics
                      </li>
                      <li>
                        <strong>Sort by Points:</strong> Sort students in descending order by total points
                      </li>
                      <li>
                        <strong>Apply Tiebreakers:</strong> For students with equal points, apply tiebreakers in sequence
                      </li>
                      <li>
                        <strong>Assign Ranks:</strong> Assign rank numbers based on position in the sorted list
                      </li>
                      <li>
                        <strong>Store Previous Ranks:</strong> Save previous ranks to calculate rank changes
                      </li>
                    </ol>

                    <div className="bg-muted p-3 rounded-md mt-2">
                      <p className="text-xs font-mono">
                        // Pseudocode for ranking algorithm<br />
                        function calculateRanks(studentList) &#123;<br />
                        &nbsp;&nbsp;// Sort by points (descending)<br />
                        &nbsp;&nbsp;studentList.sort((a, b) =&gt; b.points - a.points || <br />
                        &nbsp;&nbsp;&nbsp;&nbsp;// Tiebreaker 1: Academic score<br />
                        &nbsp;&nbsp;&nbsp;&nbsp;b.academicScore - a.academicScore || <br />
                        &nbsp;&nbsp;&nbsp;&nbsp;// Tiebreaker 2: Consistency<br />
                        &nbsp;&nbsp;&nbsp;&nbsp;b.consistencyScore - a.consistencyScore || <br />
                        &nbsp;&nbsp;&nbsp;&nbsp;// Tiebreaker 3: Completion rate<br />
                        &nbsp;&nbsp;&nbsp;&nbsp;b.completionRate - a.completionRate);<br />
                        <br />
                        &nbsp;&nbsp;// Assign ranks<br />
                        &nbsp;&nbsp;for (let i = 0; i &lt; studentList.length; i++) &#123;<br />
                        &nbsp;&nbsp;&nbsp;&nbsp;studentList[i].previousRank = studentList[i].rank;<br />
                        &nbsp;&nbsp;&nbsp;&nbsp;studentList[i].rank = i + 1;<br />
                        &nbsp;&nbsp;&nbsp;&nbsp;studentList[i].rankChange = studentList[i].previousRank - studentList[i].rank;<br />
                        &nbsp;&nbsp;&#125;<br />
                        <br />
                        &nbsp;&nbsp;return studentList;<br />
                        &#125;
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <BarChart className="h-4 w-4" />
                    <span>Point Calculation Formula</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <p className="text-sm">
                      Points are calculated based on various activities:
                    </p>

                    <div className="space-y-3">
                      <div>
                        <Badge variant="outline" className="mb-1">Activities</Badge>
                        <p className="text-sm">
                          <strong>Base Formula:</strong> Difficulty × Completion × Score
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Example: A difficult activity (×3) completed 100% with 90% score = 3 × 1.0 × 0.9 = 2.7 × base points
                        </p>
                      </div>

                      <Separator />

                      <div>
                        <Badge variant="outline" className="mb-1">Attendance</Badge>
                        <p className="text-sm">
                          <strong>Formula:</strong> Base points × (1 + Streak bonus)
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Example: 10 points per class, with a 5-day streak (0.5 bonus) = 10 × 1.5 = 15 points
                        </p>
                      </div>

                      <Separator />

                      <div>
                        <Badge variant="outline" className="mb-1">Participation</Badge>
                        <p className="text-sm">
                          <strong>Formula:</strong> Base points × Quality factor
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Example: 5 points for participation, with high quality (×2) = 10 points
                        </p>
                      </div>

                      <Separator />

                      <div>
                        <Badge variant="outline" className="mb-1">Achievements</Badge>
                        <p className="text-sm">
                          <strong>Formula:</strong> Fixed points based on achievement difficulty
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Example: Easy (50 points), Medium (100 points), Hard (200 points)
                        </p>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>Data Sources and Freshness</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <p className="text-sm">
                      The leaderboard uses data from multiple sources:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      <div className="border rounded p-2">
                        <p className="text-sm font-medium">Activity Grades</p>
                        <p className="text-xs text-muted-foreground">Updated immediately after grading</p>
                      </div>

                      <div className="border rounded p-2">
                        <p className="text-sm font-medium">Attendance Records</p>
                        <p className="text-xs text-muted-foreground">Updated daily after class</p>
                      </div>

                      <div className="border rounded p-2">
                        <p className="text-sm font-medium">Participation Points</p>
                        <p className="text-xs text-muted-foreground">Updated when awarded by teachers</p>
                      </div>

                      <div className="border rounded p-2">
                        <p className="text-sm font-medium">Achievement Records</p>
                        <p className="text-xs text-muted-foreground">Updated immediately when unlocked</p>
                      </div>
                    </div>

                    <Alert className="mt-2">
                      <HelpCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        All leaderboard data is cached for performance and refreshed every 5 minutes.
                        Real-time events may take up to 5 minutes to reflect in the rankings.
                      </AlertDescription>
                    </Alert>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          <TabsContent value="examples" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Example Scenarios
              </h3>

              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Scenario 1: Basic Ranking</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-2">
                      Three students with different point totals:
                    </p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li>Student A: 1000 points</li>
                      <li>Student B: 1200 points</li>
                      <li>Student C: 800 points</li>
                    </ul>
                    <div className="mt-3 p-2 bg-muted rounded-md">
                      <p className="text-sm font-medium">Result:</p>
                      <ol className="list-decimal list-inside text-sm">
                        <li>Student B (Rank #1)</li>
                        <li>Student A (Rank #2)</li>
                        <li>Student C (Rank #3)</li>
                      </ol>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Scenario 2: Tiebreaker</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-2">
                      Two students with the same points but different academic scores:
                    </p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li>Student A: 1000 points, 85% academic score</li>
                      <li>Student B: 1000 points, 92% academic score</li>
                    </ul>
                    <div className="mt-3 p-2 bg-muted rounded-md">
                      <p className="text-sm font-medium">Result:</p>
                      <ol className="list-decimal list-inside text-sm">
                        <li>Student B (Rank #1) - Higher academic score</li>
                        <li>Student A (Rank #2)</li>
                      </ol>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Scenario 3: Multiple Tiebreakers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-2">
                      Two students with the same points and academic scores:
                    </p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li>Student A: 1000 points, 90% academic score, 85% consistency</li>
                      <li>Student B: 1000 points, 90% academic score, 78% consistency</li>
                    </ul>
                    <div className="mt-3 p-2 bg-muted rounded-md">
                      <p className="text-sm font-medium">Result:</p>
                      <ol className="list-decimal list-inside text-sm">
                        <li>Student A (Rank #1) - Higher consistency score</li>
                        <li>Student B (Rank #2)</li>
                      </ol>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="flex justify-between border-t pt-4">
        <div className="flex items-center text-xs text-muted-foreground">
          <BookOpen className="h-3 w-3 mr-1" />
          Last updated: {new Date().toLocaleDateString()}
        </div>
        <Button variant="outline" size="sm">
          <Play className="h-4 w-4 mr-2" />
          Watch Tutorial
        </Button>
      </CardFooter>
    </Card>
  );
}
