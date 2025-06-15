'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertCircle,
  Calendar,
  Clock,
  HelpCircle,
  Sun,
  ArrowRight,
  Save,
  Settings,
  Star,
  User
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface HandicapConfig {
  // Whether the handicap system is enabled
  enabled: boolean;

  // Maximum handicap percentage (e.g., 20 = 20% boost)
  maxHandicapPercentage: number;

  // Number of days after which the handicap starts to decrease
  gracePeriodDays: number;

  // Number of days after which the handicap is completely phased out
  phaseOutDays: number;

  // Whether to apply the handicap to all activities or only to missed activities
  applyToAllActivities: boolean;

  // Whether to show the handicap indicator on the leaderboard
  showHandicapIndicator: boolean;
}

export interface StudentHandicap {
  studentId: string;
  studentName: string;
  joinDate: Date;
  currentHandicapPercentage: number;
  daysRemaining: number;
  pointsAdjustment: number;
}

export interface LateJoinerHandicapSystemProps {
  config: HandicapConfig;
  studentHandicaps?: StudentHandicap[];
  onConfigChange?: (config: HandicapConfig) => void;
  onRefresh?: () => void;
  className?: string;
}

export function LateJoinerHandicapSystem({
  config,
  studentHandicaps = [],
  onConfigChange,
  onRefresh,
  className
}: LateJoinerHandicapSystemProps) {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [localConfig, setLocalConfig] = useState<HandicapConfig>(config);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Handle config change
  const handleConfigChange = <K extends keyof HandicapConfig>(key: K, value: HandicapConfig[K]) => {
    setLocalConfig(prev => {
      const newConfig = { ...prev, [key]: value };
      setHasUnsavedChanges(true);
      return newConfig;
    });
  };

  // Save config changes
  const saveChanges = () => {
    if (onConfigChange) {
      onConfigChange(localConfig);
      setHasUnsavedChanges(false);
    }
  };

  // Reset config changes
  const resetChanges = () => {
    setLocalConfig(config);
    setHasUnsavedChanges(false);
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  // Calculate handicap expiration date
  const calculateExpirationDate = (joinDate: Date) => {
    const expirationDate = new Date(joinDate);
    expirationDate.setDate(expirationDate.getDate() + localConfig.gracePeriodDays + localConfig.phaseOutDays);
    return expirationDate;
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Late Joiner Handicap System</CardTitle>
            <CardDescription>
              Fair adjustments for students who join late
            </CardDescription>
          </div>
          <Badge variant={localConfig.enabled ? "default" : "outline"}>
            {localConfig.enabled ? "Enabled" : "Disabled"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Alert>
              <HelpCircle className="h-4 w-4" />
              <AlertTitle>Fair Competition</AlertTitle>
              <AlertDescription>
                The Late Joiner Handicap System provides temporary point adjustments for students who join a class after it has started,
                ensuring they can still compete fairly on the leaderboard.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">How It Works</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm">
                      Students who join late receive a temporary point boost that gradually decreases over time:
                    </p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li>Maximum boost: <span className="font-medium">{localConfig.maxHandicapPercentage}%</span></li>
                      <li>Grace period: <span className="font-medium">{localConfig.gracePeriodDays} days</span></li>
                      <li>Phase-out period: <span className="font-medium">{localConfig.phaseOutDays} days</span></li>
                    </ul>
                    <p className="text-sm mt-2">
                      The handicap is automatically calculated based on join date and gradually decreases until it's completely phased out.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Current Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">System Status:</span>
                      <Badge variant={localConfig.enabled ? "default" : "outline"}>
                        {localConfig.enabled ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Students with Handicap:</span>
                      <Badge variant="outline">{studentHandicaps.length}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Average Handicap:</span>
                      <Badge variant="outline">
                        {studentHandicaps.length > 0
                          ? `${(studentHandicaps.reduce((sum, s) => sum + s.currentHandicapPercentage, 0) / studentHandicaps.length).toFixed(1)}%`
                          : "0%"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total Points Adjusted:</span>
                      <Badge variant="outline">
                        {studentHandicaps.reduce((sum, s) => sum + s.pointsAdjustment, 0).toLocaleString()}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="p-4 bg-muted/50 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <Sun className="h-5 w-5 text-yellow-500" />
                <h3 className="font-medium">Benefits of the Handicap System</h3>
              </div>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Encourages new students to participate in the leaderboard</li>
                <li>Prevents discouragement from starting with a significant point disadvantage</li>
                <li>Provides a fair transition period for late joiners</li>
                <li>Maintains competitive integrity with automatic phase-out</li>
                <li>Transparent system with clear indicators for adjusted scores</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="students" className="space-y-4">
            {studentHandicaps.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No students currently have an active handicap</p>
              </div>
            ) : (
              <div className="space-y-3">
                {studentHandicaps.map((student) => (
                  <Card key={student.studentId}>
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <div className="font-medium">{student.studentName}</div>
                          <div className="text-sm text-muted-foreground">Joined: {formatDate(student.joinDate)}</div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                          <div className="text-center px-3 py-1 bg-muted rounded-md">
                            <div className="text-sm text-muted-foreground">Current Handicap</div>
                            <div className="font-medium text-lg">+{student.currentHandicapPercentage.toFixed(1)}%</div>
                          </div>

                          <div className="text-center px-3 py-1 bg-muted rounded-md">
                            <div className="text-sm text-muted-foreground">Days Remaining</div>
                            <div className="font-medium text-lg">{student.daysRemaining}</div>
                          </div>

                          <div className="text-center px-3 py-1 bg-muted rounded-md">
                            <div className="text-sm text-muted-foreground">Points Adjusted</div>
                            <div className="font-medium text-lg">+{student.pointsAdjustment.toLocaleString()}</div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="text-xs text-muted-foreground mb-1">Handicap Phase-out Progress</div>
                        <div className="w-full bg-muted rounded-full h-2.5">
                          <div
                            className="bg-primary h-2.5 rounded-full"
                            style={{
                              width: `${100 - (student.daysRemaining / (localConfig.gracePeriodDays + localConfig.phaseOutDays)) * 100}%`
                            }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>Joined: {formatDate(student.joinDate)}</span>
                          <span>Expires: {formatDate(calculateExpirationDate(student.joinDate))}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <ArrowRight className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="handicap-enabled">Enable Handicap System</Label>
                  <div className="text-sm text-muted-foreground">
                    Turn the handicap system on or off
                  </div>
                </div>
                <Switch
                  id="handicap-enabled"
                  checked={localConfig.enabled}
                  onCheckedChange={(checked) => handleConfigChange('enabled', checked)}
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <Label htmlFor="max-handicap">Maximum Handicap Percentage: {localConfig.maxHandicapPercentage}%</Label>
                <Slider
                  id="max-handicap"
                  min={0}
                  max={50}
                  step={1}
                  value={[localConfig.maxHandicapPercentage]}
                  onValueChange={(value) => handleConfigChange('maxHandicapPercentage', value[0])}
                  disabled={!localConfig.enabled}
                />
                <div className="text-sm text-muted-foreground">
                  The maximum percentage boost that late joiners can receive
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="grace-period">Grace Period (days): {localConfig.gracePeriodDays}</Label>
                <Slider
                  id="grace-period"
                  min={0}
                  max={30}
                  step={1}
                  value={[localConfig.gracePeriodDays]}
                  onValueChange={(value) => handleConfigChange('gracePeriodDays', value[0])}
                  disabled={!localConfig.enabled}
                />
                <div className="text-sm text-muted-foreground">
                  Number of days the full handicap applies before starting to phase out
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="phase-out">Phase-out Period (days): {localConfig.phaseOutDays}</Label>
                <Slider
                  id="phase-out"
                  min={0}
                  max={60}
                  step={1}
                  value={[localConfig.phaseOutDays]}
                  onValueChange={(value) => handleConfigChange('phaseOutDays', value[0])}
                  disabled={!localConfig.enabled}
                />
                <div className="text-sm text-muted-foreground">
                  Number of days over which the handicap gradually decreases to zero
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="apply-all">Apply to All Activities</Label>
                  <div className="text-sm text-muted-foreground">
                    Apply handicap to all activities, not just missed ones
                  </div>
                </div>
                <Switch
                  id="apply-all"
                  checked={localConfig.applyToAllActivities}
                  onCheckedChange={(checked) => handleConfigChange('applyToAllActivities', checked)}
                  disabled={!localConfig.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-indicator">Show Handicap Indicator</Label>
                  <div className="text-sm text-muted-foreground">
                    Display an indicator next to students with active handicaps
                  </div>
                </div>
                <Switch
                  id="show-indicator"
                  checked={localConfig.showHandicapIndicator}
                  onCheckedChange={(checked) => handleConfigChange('showHandicapIndicator', checked)}
                  disabled={!localConfig.enabled}
                />
              </div>
            </div>

            {hasUnsavedChanges && (
              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You have unsaved changes. Save or reset to apply.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="flex justify-between border-t pt-4">
        <div className="flex items-center text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5 mr-1" />
          Last updated: {new Date().toLocaleString()}
        </div>

        {activeTab === 'settings' && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetChanges}
              disabled={!hasUnsavedChanges}
            >
              Reset
            </Button>
            <Button
              size="sm"
              onClick={saveChanges}
              disabled={!hasUnsavedChanges}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
