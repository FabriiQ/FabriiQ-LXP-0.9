'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertCircle,
  ArrowDown,
  CheckCircle,
  Download,
  FileText,
  HelpCircle,
  Pencil,
  Plus,
  ArrowRight,
  Search,
  Settings,
  XCircle
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

export interface AdjustmentRecord {
  id: string;
  studentId: string;
  studentName: string;
  pointsAdjustment: number;
  reason: string;
  timestamp: Date;
  adjustedBy: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
}

export interface FlaggedActivity {
  id: string;
  studentId: string;
  studentName: string;
  activityType: string;
  activityTitle: string;
  pointsAmount: number;
  flagReason: string;
  flaggedAt: Date;
  flaggedBy: string;
  status: 'pending' | 'resolved' | 'dismissed';
}

export interface LeaderboardSetting {
  id: string;
  name: string;
  description: string;
  value: boolean | number | string;
  type: 'boolean' | 'number' | 'string' | 'select';
  options?: string[];
}

export interface EducatorControlPanelProps {
  adjustments?: AdjustmentRecord[];
  flaggedActivities?: FlaggedActivity[];
  settings?: LeaderboardSetting[];
  onCreateAdjustment?: (adjustment: Omit<AdjustmentRecord, 'id' | 'timestamp' | 'adjustedBy' | 'status'>) => void;
  onApproveAdjustment?: (id: string) => void;
  onRejectAdjustment?: (id: string, reason: string) => void;
  onResolveFlaggedActivity?: (id: string, action: 'approve' | 'reject') => void;
  onUpdateSetting?: (id: string, value: any) => void;
  className?: string;
}

export function EducatorControlPanel({
  adjustments = [],
  flaggedActivities = [],
  settings = [],
  onCreateAdjustment,
  onApproveAdjustment,
  onRejectAdjustment,
  onResolveFlaggedActivity,
  onUpdateSetting,
  className
}: EducatorControlPanelProps) {
  const [activeTab, setActiveTab] = useState<string>('adjustments');
  const [newAdjustment, setNewAdjustment] = useState({
    studentId: '',
    studentName: '',
    pointsAdjustment: 0,
    reason: ''
  });
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [selectedAdjustmentId, setSelectedAdjustmentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter and sort adjustments
  const filteredAdjustments = adjustments
    .filter(adj =>
      adj.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      adj.reason.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

  // Filter flagged activities
  const filteredFlaggedActivities = flaggedActivities
    .filter(activity =>
      activity.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.activityTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.flagReason.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // Handle creating a new adjustment
  const handleCreateAdjustment = () => {
    if (onCreateAdjustment) {
      onCreateAdjustment(newAdjustment);
      setNewAdjustment({
        studentId: '',
        studentName: '',
        pointsAdjustment: 0,
        reason: ''
      });
    }
  };

  // Handle approving an adjustment
  const handleApproveAdjustment = (id: string) => {
    if (onApproveAdjustment) {
      onApproveAdjustment(id);
    }
  };

  // Handle rejecting an adjustment
  const handleRejectAdjustment = (id: string) => {
    if (onRejectAdjustment && rejectionReason) {
      onRejectAdjustment(id, rejectionReason);
      setRejectionReason('');
      setSelectedAdjustmentId(null);
    }
  };

  // Handle resolving a flagged activity
  const handleResolveFlaggedActivity = (id: string, action: 'approve' | 'reject') => {
    if (onResolveFlaggedActivity) {
      onResolveFlaggedActivity(id, action);
    }
  };

  // Handle updating a setting
  const handleUpdateSetting = (id: string, value: any) => {
    if (onUpdateSetting) {
      onUpdateSetting(id, value);
    }
  };

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Educator Control Panel</CardTitle>
            <CardDescription>
              Manage leaderboard adjustments and settings
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <AlertCircle className="h-3.5 w-3.5 mr-1" />
            Admin Controls
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="adjustments">Point Adjustments</TabsTrigger>
            <TabsTrigger value="flagged">Flagged Activities</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            {activeTab === 'adjustments' && (
              <Button variant="outline" size="icon" onClick={toggleSortOrder}>
                <ArrowDown className="h-4 w-4" />
              </Button>
            )}
          </div>

          <TabsContent value="adjustments" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Create New Adjustment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="student-id">Student ID</Label>
                    <Input
                      id="student-id"
                      value={newAdjustment.studentId}
                      onChange={(e) => setNewAdjustment(prev => ({ ...prev, studentId: e.target.value }))}
                      placeholder="Enter student ID"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="student-name">Student Name</Label>
                    <Input
                      id="student-name"
                      value={newAdjustment.studentName}
                      onChange={(e) => setNewAdjustment(prev => ({ ...prev, studentName: e.target.value }))}
                      placeholder="Enter student name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="points-adjustment">Points Adjustment</Label>
                    <Input
                      id="points-adjustment"
                      type="number"
                      value={newAdjustment.pointsAdjustment}
                      onChange={(e) => setNewAdjustment(prev => ({ ...prev, pointsAdjustment: parseInt(e.target.value) || 0 }))}
                      placeholder="Enter points (positive or negative)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason</Label>
                    <Input
                      id="reason"
                      value={newAdjustment.reason}
                      onChange={(e) => setNewAdjustment(prev => ({ ...prev, reason: e.target.value }))}
                      placeholder="Enter reason for adjustment"
                    />
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={handleCreateAdjustment}
                    disabled={!newAdjustment.studentId || !newAdjustment.studentName || !newAdjustment.reason || newAdjustment.pointsAdjustment === 0}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Adjustment
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdjustments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                        No adjustments found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAdjustments.map((adjustment) => (
                      <TableRow key={adjustment.id}>
                        <TableCell>
                          <div className="font-medium">{adjustment.studentName}</div>
                          <div className="text-xs text-muted-foreground">{adjustment.studentId}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(
                            adjustment.pointsAdjustment > 0
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-red-100 text-red-800 hover:bg-red-200"
                          )}>
                            {adjustment.pointsAdjustment > 0 ? '+' : ''}{adjustment.pointsAdjustment}
                          </Badge>
                        </TableCell>
                        <TableCell>{adjustment.reason}</TableCell>
                        <TableCell>
                          <div>{new Date(adjustment.timestamp).toLocaleDateString()}</div>
                          <div className="text-xs text-muted-foreground">{new Date(adjustment.timestamp).toLocaleTimeString()}</div>
                        </TableCell>
                        <TableCell>
                          {adjustment.status === 'pending' && (
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                              Pending
                            </Badge>
                          )}
                          {adjustment.status === 'approved' && (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                              Approved
                            </Badge>
                          )}
                          {adjustment.status === 'rejected' && (
                            <Badge variant="destructive">
                              Rejected
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {adjustment.status === 'pending' && (
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleApproveAdjustment(adjustment.id)}
                              >
                                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                Approve
                              </Button>

                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedAdjustmentId(adjustment.id)}
                                  >
                                    <XCircle className="h-3.5 w-3.5 mr-1" />
                                    Reject
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80">
                                  <div className="space-y-2">
                                    <h4 className="font-medium">Rejection Reason</h4>
                                    <Textarea
                                      placeholder="Enter reason for rejection..."
                                      value={rejectionReason}
                                      onChange={(e) => setRejectionReason(e.target.value)}
                                    />
                                    <div className="flex justify-end">
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleRejectAdjustment(adjustment.id)}
                                        disabled={!rejectionReason.trim()}
                                      >
                                        Confirm Rejection
                                      </Button>
                                    </div>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                          )}

                          {adjustment.status !== 'pending' && (
                            <Button variant="ghost" size="sm">
                              <FileText className="h-3.5 w-3.5 mr-1" />
                              View History
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="flagged" className="space-y-4">
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Flag Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFlaggedActivities.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                        No flagged activities found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredFlaggedActivities.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell>
                          <div className="font-medium">{activity.studentName}</div>
                          <div className="text-xs text-muted-foreground">{activity.studentId}</div>
                        </TableCell>
                        <TableCell>
                          <div>{activity.activityTitle}</div>
                          <div className="text-xs text-muted-foreground">{activity.activityType}</div>
                        </TableCell>
                        <TableCell>
                          <Badge>
                            {activity.pointsAmount}
                          </Badge>
                        </TableCell>
                        <TableCell>{activity.flagReason}</TableCell>
                        <TableCell>
                          {activity.status === 'pending' && (
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                              Pending
                            </Badge>
                          )}
                          {activity.status === 'resolved' && (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                              Resolved
                            </Badge>
                          )}
                          {activity.status === 'dismissed' && (
                            <Badge variant="outline">
                              Dismissed
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {activity.status === 'pending' && (
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResolveFlaggedActivity(activity.id, 'approve')}
                              >
                                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResolveFlaggedActivity(activity.id, 'reject')}
                              >
                                <XCircle className="h-3.5 w-3.5 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}

                          {activity.status !== 'pending' && (
                            <Button variant="ghost" size="sm">
                              <FileText className="h-3.5 w-3.5 mr-1" />
                              View Details
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-4">
              {settings.map((setting) => (
                <div key={setting.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <div className="font-medium">{setting.name}</div>
                    <div className="text-sm text-muted-foreground">{setting.description}</div>
                  </div>

                  <div>
                    {setting.type === 'boolean' && (
                      <Switch
                        checked={setting.value as boolean}
                        onCheckedChange={(checked) => handleUpdateSetting(setting.id, checked)}
                      />
                    )}

                    {setting.type === 'number' && (
                      <Input
                        type="number"
                        value={setting.value as number}
                        onChange={(e) => handleUpdateSetting(setting.id, parseInt(e.target.value) || 0)}
                        className="w-24"
                      />
                    )}

                    {setting.type === 'string' && (
                      <Input
                        value={setting.value as string}
                        onChange={(e) => handleUpdateSetting(setting.id, e.target.value)}
                        className="w-48"
                      />
                    )}

                    {setting.type === 'select' && setting.options && (
                      <Select
                        value={setting.value as string}
                        onValueChange={(value) => handleUpdateSetting(setting.id, value)}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {setting.options.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              ))}

              {settings.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  No settings available
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="flex justify-between border-t pt-4">
        <div className="flex items-center text-xs text-muted-foreground">
          <HelpCircle className="h-3.5 w-3.5 mr-1" />
          All actions are logged for audit purposes
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
          <Button variant="outline" size="sm">
            <ArrowRight className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
