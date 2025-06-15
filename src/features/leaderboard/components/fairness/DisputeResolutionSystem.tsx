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
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Clock,
  FileText,
  Filter,
  HelpCircle,
  MessageSquare,
  Plus,
  ArrowRight,
  Search,
  User,
  XCircle
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface DisputeRecord {
  id: string;
  studentId: string;
  studentName: string;
  disputeType: 'missing_points' | 'incorrect_points' | 'incorrect_rank' | 'other';
  activityId?: string;
  activityTitle?: string;
  pointsInDispute?: number;
  description: string;
  evidence?: string;
  status: 'pending' | 'under_review' | 'resolved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  resolvedBy?: string;
  resolution?: string;
}

export interface DisputeResolutionSystemProps {
  disputes: DisputeRecord[];
  currentStudentId?: string;
  isTeacher?: boolean;
  isLoading?: boolean;
  onCreateDispute?: (dispute: Omit<DisputeRecord, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateDispute?: (id: string, status: DisputeRecord['status'], resolution?: string) => void;
  onRefresh?: () => void;
  className?: string;
}

export function DisputeResolutionSystem({
  disputes,
  currentStudentId,
  isTeacher = false,
  isLoading = false,
  onCreateDispute,
  onUpdateDispute,
  onRefresh,
  className
}: DisputeResolutionSystemProps) {
  const [activeTab, setActiveTab] = useState<string>('my-disputes');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);
  const [resolution, setResolution] = useState<string>('');

  // New dispute form state
  const [newDispute, setNewDispute] = useState({
    studentId: currentStudentId || '',
    studentName: '',
    disputeType: 'missing_points' as DisputeRecord['disputeType'],
    activityTitle: '',
    pointsInDispute: 0,
    description: '',
    evidence: ''
  });

  // Filter disputes
  const filteredDisputes = disputes.filter(dispute => {
    // Filter by search query
    const matchesSearch =
      dispute.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dispute.activityTitle && dispute.activityTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      dispute.description.toLowerCase().includes(searchQuery.toLowerCase());

    // Filter by status
    const matchesStatus = statusFilter === 'all' || dispute.status === statusFilter;

    // Filter by student ID if not a teacher
    const matchesStudent = isTeacher || dispute.studentId === currentStudentId;

    return matchesSearch && matchesStatus && matchesStudent;
  });

  // Get selected dispute
  const selectedDispute = selectedDisputeId
    ? disputes.find(d => d.id === selectedDisputeId)
    : null;

  // Handle creating a new dispute
  const handleCreateDispute = () => {
    if (onCreateDispute) {
      onCreateDispute(newDispute);

      // Reset form
      setNewDispute({
        studentId: currentStudentId || '',
        studentName: '',
        disputeType: 'missing_points',
        activityTitle: '',
        pointsInDispute: 0,
        description: '',
        evidence: ''
      });
    }
  };

  // Handle updating a dispute
  const handleUpdateDispute = (id: string, status: DisputeRecord['status']) => {
    if (onUpdateDispute) {
      onUpdateDispute(id, status, resolution);
      setSelectedDisputeId(null);
      setResolution('');
    }
  };

  // Get dispute type label
  const getDisputeTypeLabel = (type: DisputeRecord['disputeType']) => {
    switch (type) {
      case 'missing_points':
        return 'Missing Points';
      case 'incorrect_points':
        return 'Incorrect Points';
      case 'incorrect_rank':
        return 'Incorrect Rank';
      case 'other':
        return 'Other Issue';
      default:
        return 'Unknown';
    }
  };

  // Get status badge
  const getStatusBadge = (status: DisputeRecord['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending</Badge>;
      case 'under_review':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Under Review</Badge>;
      case 'resolved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Resolved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Dispute Resolution System</CardTitle>
            <CardDescription>
              Appeal process for leaderboard issues
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <ArrowRight className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="my-disputes">
              {isTeacher ? 'All Disputes' : 'My Disputes'}
            </TabsTrigger>
            <TabsTrigger value="new-dispute">New Dispute</TabsTrigger>
            <TabsTrigger value="help">Help & Guidelines</TabsTrigger>
          </TabsList>

          <TabsContent value="my-disputes" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search disputes..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedDispute ? (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">Dispute Details</CardTitle>
                      <CardDescription>
                        {getDisputeTypeLabel(selectedDispute.disputeType)}
                      </CardDescription>
                    </div>
                    {getStatusBadge(selectedDispute.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Student</div>
                      <div className="font-medium">{selectedDispute.studentName}</div>
                      <div className="text-xs text-muted-foreground">{selectedDispute.studentId}</div>
                    </div>

                    <div>
                      <div className="text-sm text-muted-foreground">Submitted</div>
                      <div>{new Date(selectedDispute.createdAt).toLocaleDateString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(selectedDispute.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>

                  {selectedDispute.activityTitle && (
                    <div>
                      <div className="text-sm text-muted-foreground">Activity</div>
                      <div className="font-medium">{selectedDispute.activityTitle}</div>
                      {selectedDispute.pointsInDispute && (
                        <div className="text-sm">
                          Points in dispute: <Badge variant="outline">{selectedDispute.pointsInDispute}</Badge>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <div className="text-sm text-muted-foreground">Description</div>
                    <div className="p-3 bg-muted rounded-md mt-1">
                      {selectedDispute.description}
                    </div>
                  </div>

                  {selectedDispute.evidence && (
                    <div>
                      <div className="text-sm text-muted-foreground">Evidence</div>
                      <div className="p-3 bg-muted rounded-md mt-1">
                        {selectedDispute.evidence}
                      </div>
                    </div>
                  )}

                  {selectedDispute.resolution && (
                    <div>
                      <div className="text-sm text-muted-foreground">Resolution</div>
                      <div className="p-3 bg-muted rounded-md mt-1">
                        {selectedDispute.resolution}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Resolved by: {selectedDispute.resolvedBy}
                      </div>
                    </div>
                  )}

                  {isTeacher && selectedDispute.status !== 'resolved' && selectedDispute.status !== 'rejected' && (
                    <div className="space-y-2">
                      <Label htmlFor="resolution">Resolution</Label>
                      <Textarea
                        id="resolution"
                        placeholder="Enter resolution details..."
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                      />
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-4">
                  <Button variant="outline" onClick={() => setSelectedDisputeId(null)}>
                    Back to List
                  </Button>

                  {isTeacher && selectedDispute.status !== 'resolved' && selectedDispute.status !== 'rejected' && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleUpdateDispute(selectedDispute.id, 'rejected')}
                        disabled={!resolution.trim()}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                      <Button
                        onClick={() => handleUpdateDispute(selectedDispute.id, 'resolved')}
                        disabled={!resolution.trim()}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Resolve
                      </Button>
                    </div>
                  )}

                  {isTeacher && selectedDispute.status === 'pending' && (
                    <Button
                      variant="outline"
                      onClick={() => handleUpdateDispute(selectedDispute.id, 'under_review')}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Mark as Under Review
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      {isTeacher && <TableHead>Student</TableHead>}
                      <TableHead>Description</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={isTeacher ? 6 : 5} className="text-center py-4 text-muted-foreground">
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : filteredDisputes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isTeacher ? 6 : 5} className="text-center py-4 text-muted-foreground">
                          No disputes found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDisputes.map((dispute) => (
                        <TableRow key={dispute.id}>
                          <TableCell>
                            <Badge variant="outline">
                              {getDisputeTypeLabel(dispute.disputeType)}
                            </Badge>
                          </TableCell>

                          {isTeacher && (
                            <TableCell>
                              <div className="font-medium">{dispute.studentName}</div>
                              <div className="text-xs text-muted-foreground">{dispute.studentId}</div>
                            </TableCell>
                          )}

                          <TableCell>
                            <div className="truncate max-w-[200px]" title={dispute.description}>
                              {dispute.activityTitle ? `${dispute.activityTitle}: ` : ''}
                              {dispute.description}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div>{new Date(dispute.createdAt).toLocaleDateString()}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(dispute.createdAt).toLocaleTimeString()}
                            </div>
                          </TableCell>

                          <TableCell>
                            {getStatusBadge(dispute.status)}
                          </TableCell>

                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedDisputeId(dispute.id)}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="new-dispute" className="space-y-4">
            <Alert>
              <HelpCircle className="h-4 w-4" />
              <AlertTitle>Before Submitting a Dispute</AlertTitle>
              <AlertDescription>
                Please check the point earning rules and your activity history to ensure there is actually an issue.
                Provide as much detail as possible to help us resolve your dispute quickly.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dispute-type">Dispute Type</Label>
                  <Select
                    value={newDispute.disputeType}
                    onValueChange={(value: DisputeRecord['disputeType']) =>
                      setNewDispute(prev => ({ ...prev, disputeType: value }))
                    }
                  >
                    <SelectTrigger id="dispute-type">
                      <SelectValue placeholder="Select dispute type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="missing_points">Missing Points</SelectItem>
                      <SelectItem value="incorrect_points">Incorrect Points</SelectItem>
                      <SelectItem value="incorrect_rank">Incorrect Rank</SelectItem>
                      <SelectItem value="other">Other Issue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="student-name">Your Name</Label>
                  <Input
                    id="student-name"
                    value={newDispute.studentName}
                    onChange={(e) => setNewDispute(prev => ({ ...prev, studentName: e.target.value }))}
                    placeholder="Enter your name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="activity-title">Activity Title (if applicable)</Label>
                  <Input
                    id="activity-title"
                    value={newDispute.activityTitle}
                    onChange={(e) => setNewDispute(prev => ({ ...prev, activityTitle: e.target.value }))}
                    placeholder="Enter activity title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="points-in-dispute">Points in Dispute (if applicable)</Label>
                  <Input
                    id="points-in-dispute"
                    type="number"
                    value={newDispute.pointsInDispute}
                    onChange={(e) => setNewDispute(prev => ({ ...prev, pointsInDispute: parseInt(e.target.value) || 0 }))}
                    placeholder="Enter points amount"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newDispute.description}
                  onChange={(e) => setNewDispute(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the issue in detail"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="evidence">Evidence (optional)</Label>
                <Textarea
                  id="evidence"
                  value={newDispute.evidence}
                  onChange={(e) => setNewDispute(prev => ({ ...prev, evidence: e.target.value }))}
                  placeholder="Provide any evidence to support your dispute"
                  rows={3}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleCreateDispute}
                  disabled={!newDispute.studentName || !newDispute.description}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Submit Dispute
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="help" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Dispute Resolution Guidelines</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-full bg-blue-100">
                        <ChevronRight className="h-4 w-4 text-blue-700" />
                      </div>
                      <CardTitle className="text-base">When to Submit a Dispute</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li>You completed an activity but didn't receive points</li>
                      <li>You received incorrect points for an activity</li>
                      <li>Your rank doesn't reflect your actual points</li>
                      <li>You notice a technical issue affecting your score</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-full bg-red-100">
                        <XCircle className="h-4 w-4 text-red-700" />
                      </div>
                      <CardTitle className="text-base">When Not to Submit a Dispute</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li>You disagree with the point values in the rules</li>
                      <li>You want more points for an activity than the rules allow</li>
                      <li>You're unhappy with your rank but have no specific issue</li>
                      <li>Less than 24 hours have passed since completing an activity</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Dispute Resolution Process</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="list-decimal list-inside text-sm space-y-2">
                    <li>
                      <strong>Submission:</strong> Student submits a dispute with all relevant details
                    </li>
                    <li>
                      <strong>Review:</strong> Teacher reviews the dispute and marks it as "Under Review"
                    </li>
                    <li>
                      <strong>Investigation:</strong> Teacher investigates the issue, checking activity records and system logs
                    </li>
                    <li>
                      <strong>Resolution:</strong> Teacher resolves the dispute with one of two outcomes:
                      <ul className="list-disc list-inside ml-6 mt-1">
                        <li><strong>Approved:</strong> Issue is confirmed and points are adjusted</li>
                        <li><strong>Rejected:</strong> Issue is not confirmed or doesn't warrant adjustment</li>
                      </ul>
                    </li>
                    <li>
                      <strong>Notification:</strong> Student is notified of the resolution
                    </li>
                  </ol>
                </CardContent>
              </Card>

              <div className="p-4 bg-muted/50 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-blue-500" />
                  <h3 className="font-medium">Fair Play Policy</h3>
                </div>
                <p className="text-sm mb-2">
                  Our dispute resolution system is designed to ensure fairness and transparency.
                  All disputes are logged and reviewed impartially. Abuse of the dispute system
                  may result in temporary suspension of dispute privileges.
                </p>
                <p className="text-sm">
                  We aim to resolve all disputes within 3 business days. Complex issues may take longer.
                  All resolutions include an explanation of the decision.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="flex justify-between border-t pt-4">
        <div className="flex items-center text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5 mr-1" />
          Last updated: {new Date().toLocaleString()}
        </div>

        <div className="flex items-center text-xs text-muted-foreground">
          <Filter className="h-3.5 w-3.5 mr-1" />
          Showing {filteredDisputes.length} of {disputes.length} disputes
        </div>
      </CardFooter>
    </Card>
  );
}
