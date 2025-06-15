'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Calendar,
  Download,
  HelpCircle,
  ArrowRight,
  Sun,
  Award
} from 'lucide-react';
import { BarChart as ChartIcon } from 'lucide-react';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { api } from '@/utils/api';

export interface ScoringSystemVisualizerProps {
  className?: string;
}

interface ScoreSimulation {
  activityScore: number;
  activityDifficulty: 'easy' | 'medium' | 'hard';
  attendanceStreak: number;
  participationQuality: 'low' | 'medium' | 'high';
  achievementCount: number;
  achievementDifficulty: 'easy' | 'medium' | 'hard';
}

interface PointBreakdown {
  category: string;
  points: number;
  color: string;
  icon: React.ReactNode;
  details: string;
}

export function ScoringSystemVisualizer({
  className
}: ScoringSystemVisualizerProps) {
  const [activeTab, setActiveTab] = useState<string>('simulator');
  const [simulation, setSimulation] = useState<ScoreSimulation>({
    activityScore: 85,
    activityDifficulty: 'medium',
    attendanceStreak: 3,
    participationQuality: 'medium',
    achievementCount: 1,
    achievementDifficulty: 'medium'
  });
  const [pointBreakdown, setPointBreakdown] = useState<PointBreakdown[]>([]);
  const [totalPoints, setTotalPoints] = useState<number>(0);

  // Calculate points based on simulation values
  useEffect(() => {
    // Activity points calculation
    const activityBasePoints = 100;
    const difficultyMultiplier =
      simulation.activityDifficulty === 'easy' ? 1 :
      simulation.activityDifficulty === 'medium' ? 2 : 3;
    const activityPoints = Math.round(activityBasePoints * difficultyMultiplier * (simulation.activityScore / 100));

    // Attendance points calculation
    const attendanceBasePoints = 10;
    const streakMultiplier = 1 + (simulation.attendanceStreak * 0.1); // 10% bonus per day in streak
    const attendancePoints = Math.round(attendanceBasePoints * streakMultiplier);

    // Participation points calculation
    const participationBasePoints = 20;
    const qualityMultiplier =
      simulation.participationQuality === 'low' ? 0.5 :
      simulation.participationQuality === 'medium' ? 1 : 1.5;
    const participationPoints = Math.round(participationBasePoints * qualityMultiplier);

    // Achievement points calculation
    const achievementBasePoints =
      simulation.achievementDifficulty === 'easy' ? 50 :
      simulation.achievementDifficulty === 'medium' ? 100 : 200;
    const achievementPoints = simulation.achievementCount * achievementBasePoints;

    // Create point breakdown
    const breakdown: PointBreakdown[] = [
      {
        category: 'Activities',
        points: activityPoints,
        color: '#4CAF50',
        icon: <ChartIcon className="h-4 w-4" />,
        details: `${simulation.activityScore}% score on ${simulation.activityDifficulty} activity (×${difficultyMultiplier})`
      },
      {
        category: 'Attendance',
        points: attendancePoints,
        color: '#2196F3',
        icon: <Calendar className="h-4 w-4" />,
        details: `${simulation.attendanceStreak}-day streak (×${streakMultiplier.toFixed(1)})`
      },
      {
        category: 'Participation',
        points: participationPoints,
        color: '#FFC107',
        icon: <BookOpen className="h-4 w-4" />,
        details: `${simulation.participationQuality} quality participation (×${qualityMultiplier})`
      },
      {
        category: 'Achievements',
        points: achievementPoints,
        color: '#FF5722',
        icon: <Award className="h-4 w-4" />,
        details: `${simulation.achievementCount} ${simulation.achievementDifficulty} achievement(s) (${achievementBasePoints} each)`
      }
    ];

    setPointBreakdown(breakdown);
    setTotalPoints(activityPoints + attendancePoints + participationPoints + achievementPoints);
  }, [simulation]);

  // Handle simulation changes
  const handleSimulationChange = (key: keyof ScoreSimulation, value: any) => {
    setSimulation(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Reset simulation to defaults
  const resetSimulation = () => {
    setSimulation({
      activityScore: 85,
      activityDifficulty: 'medium',
      attendanceStreak: 3,
      participationQuality: 'medium',
      achievementCount: 1,
      achievementDifficulty: 'medium'
    });
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded p-2 shadow-md">
          <div className="flex items-center gap-2">
            {data.icon}
            <span className="font-medium">{data.category}</span>
          </div>
          <div className="text-sm mt-1">
            <div>{data.points.toLocaleString()} points</div>
            <div className="text-xs text-muted-foreground">{data.details}</div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Scoring System Visualizer</CardTitle>
            <CardDescription>
              Understand how points are calculated
            </CardDescription>
          </div>
          <TooltipProvider>
            <UITooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" align="center" className="max-w-xs">
                <p className="text-sm">
                  This tool helps you understand how points are calculated for different activities.
                  Adjust the parameters to see how they affect your total points.
                </p>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="simulator">Point Simulator</TabsTrigger>
            <TabsTrigger value="formulas">Scoring Formulas</TabsTrigger>
          </TabsList>

          <TabsContent value="simulator" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="activity-score">Activity Score: {simulation.activityScore}%</Label>
                    <Badge variant="outline" className="font-mono">
                      {Math.round(simulation.activityScore)} / 100
                    </Badge>
                  </div>
                  <Slider
                    id="activity-score"
                    min={0}
                    max={100}
                    step={1}
                    value={[simulation.activityScore]}
                    onValueChange={(value) => handleSimulationChange('activityScore', value[0])}
                  />

                  <div className="mt-2">
                    <Label>Activity Difficulty</Label>
                    <RadioGroup
                      value={simulation.activityDifficulty}
                      onValueChange={(value) => handleSimulationChange('activityDifficulty', value)}
                      className="flex space-x-2 mt-1"
                    >
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="easy" id="easy" />
                        <Label htmlFor="easy" className="text-sm">Easy</Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="medium" id="medium" />
                        <Label htmlFor="medium" className="text-sm">Medium</Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="hard" id="hard" />
                        <Label htmlFor="hard" className="text-sm">Hard</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="attendance-streak">Attendance Streak: {simulation.attendanceStreak} days</Label>
                    <Badge variant="outline" className="font-mono">
                      +{(simulation.attendanceStreak * 10)}% bonus
                    </Badge>
                  </div>
                  <Slider
                    id="attendance-streak"
                    min={0}
                    max={10}
                    step={1}
                    value={[simulation.attendanceStreak]}
                    onValueChange={(value) => handleSimulationChange('attendanceStreak', value[0])}
                  />
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label>Participation Quality</Label>
                  <RadioGroup
                    value={simulation.participationQuality}
                    onValueChange={(value) => handleSimulationChange('participationQuality', value)}
                    className="flex space-x-2 mt-1"
                  >
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="low" id="low" />
                      <Label htmlFor="low" className="text-sm">Low</Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="medium" id="medium-participation" />
                      <Label htmlFor="medium-participation" className="text-sm">Medium</Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="high" id="high" />
                      <Label htmlFor="high" className="text-sm">High</Label>
                    </div>
                  </RadioGroup>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="achievement-count">Achievements: {simulation.achievementCount}</Label>
                  </div>
                  <Slider
                    id="achievement-count"
                    min={0}
                    max={5}
                    step={1}
                    value={[simulation.achievementCount]}
                    onValueChange={(value) => handleSimulationChange('achievementCount', value[0])}
                  />

                  <div className="mt-2">
                    <Label>Achievement Difficulty</Label>
                    <RadioGroup
                      value={simulation.achievementDifficulty}
                      onValueChange={(value) => handleSimulationChange('achievementDifficulty', value)}
                      className="flex space-x-2 mt-1"
                    >
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="easy" id="easy-achievement" />
                        <Label htmlFor="easy-achievement" className="text-sm">Easy</Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="medium" id="medium-achievement" />
                        <Label htmlFor="medium-achievement" className="text-sm">Medium</Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="hard" id="hard-achievement" />
                        <Label htmlFor="hard-achievement" className="text-sm">Hard</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={resetSimulation}>
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-center mb-2">
                  <div className="text-3xl font-bold">{totalPoints.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Total Points</div>
                </div>

                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pointBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="points" name="Points">
                        {pointBreakdown.map((entry, index) => (
                          <Bar key={`cell-${index}`} dataKey="points" fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 mt-4">
                  {pointBreakdown.map((source, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-full" style={{ backgroundColor: `${source.color}30` }}>
                          {source.icon}
                        </div>
                        <div>
                          <div className="font-medium">{source.category}</div>
                          <div className="text-xs text-muted-foreground">{source.details}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{source.points.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">
                          {Math.round((source.points / totalPoints) * 100)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="formulas" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-full bg-green-100">
                      <ChartIcon className="h-4 w-4 text-green-700" />
                    </div>
                    <CardTitle className="text-base">Activity Points</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="p-2 bg-muted rounded-md font-mono text-sm">
                      Base × Difficulty × (Score ÷ 100)
                    </div>
                    <p className="text-sm">Where:</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li><strong>Base</strong>: 100 points</li>
                      <li><strong>Difficulty</strong>: Easy (×1), Medium (×2), Hard (×3)</li>
                      <li><strong>Score</strong>: Percentage score (0-100)</li>
                    </ul>
                    <div className="mt-2 p-2 bg-muted/50 rounded-md text-xs">
                      Example: 100 × 2 × (85 ÷ 100) = 170 points
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-full bg-blue-100">
                      <Calendar className="h-4 w-4 text-blue-700" />
                    </div>
                    <CardTitle className="text-base">Attendance Points</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="p-2 bg-muted rounded-md font-mono text-sm">
                      Base × (1 + (Streak × 0.1))
                    </div>
                    <p className="text-sm">Where:</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li><strong>Base</strong>: 10 points per class</li>
                      <li><strong>Streak</strong>: Consecutive days of attendance</li>
                      <li><strong>0.1</strong>: 10% bonus per day in streak</li>
                    </ul>
                    <div className="mt-2 p-2 bg-muted/50 rounded-md text-xs">
                      Example: 10 × (1 + (3 × 0.1)) = 10 × 1.3 = 13 points
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-full bg-yellow-100">
                      <BookOpen className="h-4 w-4 text-yellow-700" />
                    </div>
                    <CardTitle className="text-base">Participation Points</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="p-2 bg-muted rounded-md font-mono text-sm">
                      Base × Quality
                    </div>
                    <p className="text-sm">Where:</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li><strong>Base</strong>: 20 points per participation</li>
                      <li><strong>Quality</strong>: Low (×0.5), Medium (×1), High (×1.5)</li>
                    </ul>
                    <div className="mt-2 p-2 bg-muted/50 rounded-md text-xs">
                      Example: 20 × 1 = 20 points
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-full bg-orange-100">
                      <Award className="h-4 w-4 text-orange-700" />
                    </div>
                    <CardTitle className="text-base">Achievement Points</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="p-2 bg-muted rounded-md font-mono text-sm">
                      Count × Points per Achievement
                    </div>
                    <p className="text-sm">Where:</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li><strong>Count</strong>: Number of achievements</li>
                      <li><strong>Points per Achievement</strong>:</li>
                      <ul className="list-disc list-inside ml-4 text-sm">
                        <li>Easy: 50 points</li>
                        <li>Medium: 100 points</li>
                        <li>Hard: 200 points</li>
                      </ul>
                    </ul>
                    <div className="mt-2 p-2 bg-muted/50 rounded-md text-xs">
                      Example: 1 × 100 = 100 points
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-4 p-3 bg-muted/50 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <Sun className="h-5 w-5 text-yellow-500" />
                <h3 className="font-medium">Tips for Maximizing Points</h3>
              </div>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Focus on completing hard activities with high scores</li>
                <li>Maintain attendance streaks for bonus multipliers</li>
                <li>Aim for high-quality participation in class</li>
                <li>Work on unlocking harder achievements for more points</li>
                <li>Consistency is key - regular activity leads to more points over time</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="flex justify-between border-t pt-4">
        <div className="flex items-center text-xs text-muted-foreground">
          <HelpCircle className="h-3 w-3 mr-1" />
          Points may vary slightly in actual implementation
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Download Formula Sheet
        </Button>
      </CardFooter>
    </Card>
  );
}
