'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Loader2, 
  Save, 
  CheckCircle, 
  Filter, 
  SortAsc, 
  SortDesc, 
  MoreHorizontal,
  Search,
  FileText,
  Eye,
  Edit,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

import {
  BloomsTaxonomyLevel
} from '../../types';
import { BLOOMS_LEVEL_METADATA } from '../../constants/bloom-levels';
import { 
  BatchGradingEntry, 
  SubmissionStatus, 
  GradableContentType 
} from '../../types/grading';

interface BatchGradingProps {
  entries: BatchGradingEntry[];
  contentType: GradableContentType;
  onGradeSubmit: (entries: BatchGradingEntry[]) => Promise<void>;
  onViewSubmission: (submissionId: string) => void;
  onEditGrading: (submissionId: string) => void;
  className?: string;
}

/**
 * BatchGrading component
 * 
 * This component provides an interface for grading multiple submissions at once,
 * with support for filtering, sorting, and bulk actions.
 */
export function BatchGrading({
  entries,
  contentType,
  onGradeSubmit,
  onViewSubmission,
  onEditGrading,
  className = '',
}: BatchGradingProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [editedEntries, setEditedEntries] = useState<Record<string, BatchGradingEntry>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<string>('studentName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  // Initialize edited entries
  useEffect(() => {
    const initialEdited: Record<string, BatchGradingEntry> = {};
    entries.forEach(entry => {
      initialEdited[entry.submissionId] = { ...entry };
    });
    setEditedEntries(initialEdited);
  }, [entries]);

  // Filter entries based on active tab and search query
  const filteredEntries = entries.filter(entry => {
    // Filter by tab
    if (activeTab !== 'all' && entry.status !== activeTab) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery && !entry.studentName.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  // Sort entries
  const sortedEntries = [...filteredEntries].sort((a, b) => {
    let aValue: any = a[sortField as keyof BatchGradingEntry];
    let bValue: any = b[sortField as keyof BatchGradingEntry];
    
    // Handle special cases
    if (sortField === 'score') {
      aValue = a.score / a.maxScore;
      bValue = b.score / b.maxScore;
    }
    
    // Compare values
    if (aValue < bValue) {
      return sortDirection === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortDirection === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Handle score change
  const handleScoreChange = (submissionId: string, score: number) => {
    if (score < 0) score = 0;
    if (score > editedEntries[submissionId].maxScore) {
      score = editedEntries[submissionId].maxScore;
    }
    
    setEditedEntries(prev => ({
      ...prev,
      [submissionId]: {
        ...prev[submissionId],
        score
      }
    }));
    setHasChanges(true);
  };

  // Handle feedback change
  const handleFeedbackChange = (submissionId: string, feedback: string) => {
    setEditedEntries(prev => ({
      ...prev,
      [submissionId]: {
        ...prev[submissionId],
        feedback
      }
    }));
    setHasChanges(true);
  };

  // Handle status change
  const handleStatusChange = (submissionId: string, status: SubmissionStatus) => {
    setEditedEntries(prev => ({
      ...prev,
      [submissionId]: {
        ...prev[submissionId],
        status
      }
    }));
    setHasChanges(true);
  };

  // Handle selection change
  const handleSelectionChange = (submissionId: string, isSelected: boolean) => {
    setSelectedEntries(prev => {
      if (isSelected) {
        return [...prev, submissionId];
      } else {
        return prev.filter(id => id !== submissionId);
      }
    });
  };

  // Handle select all
  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedEntries(filteredEntries.map(entry => entry.submissionId));
    } else {
      setSelectedEntries([]);
    }
  };

  // Handle sort change
  const handleSortChange = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle bulk status change
  const handleBulkStatusChange = (status: SubmissionStatus) => {
    const newEditedEntries = { ...editedEntries };
    selectedEntries.forEach(submissionId => {
      newEditedEntries[submissionId] = {
        ...newEditedEntries[submissionId],
        status
      };
    });
    setEditedEntries(newEditedEntries);
    setHasChanges(true);
    
    toast({
      title: "Status updated",
      description: `Updated ${selectedEntries.length} submissions to ${status}`,
      variant: "success",
    });
  };

  // Handle save
  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      // Convert edited entries to array
      const entriesToSubmit = Object.values(editedEntries);
      await onGradeSubmit(entriesToSubmit);
      
      toast({
        title: "Grades saved",
        description: "All changes have been saved successfully.",
        variant: "success",
      });
      setHasChanges(false);
    } catch (error) {
      toast({
        title: "Error saving grades",
        description: "There was an error saving the grades. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render status badge
  const renderStatusBadge = (status: SubmissionStatus) => {
    switch (status) {
      case SubmissionStatus.GRADED:
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Graded
          </Badge>
        );
      case SubmissionStatus.SUBMITTED:
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            Submitted
          </Badge>
        );
      case SubmissionStatus.LATE:
        return (
          <Badge variant="warning" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Late
          </Badge>
        );
      case SubmissionStatus.RETURNED:
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Returned
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            {status}
          </Badge>
        );
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <div>
            <CardTitle>Batch Grading</CardTitle>
            <CardDescription>
              Grade multiple {contentType.toLowerCase()} submissions at once
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {filteredEntries.length} of {entries.length} submissions
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters and search */}
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value={SubmissionStatus.SUBMITTED}>Submitted</TabsTrigger>
                <TabsTrigger value={SubmissionStatus.GRADED}>Graded</TabsTrigger>
                <TabsTrigger value={SubmissionStatus.LATE}>Late</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-[200px]"
                />
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filter Options</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleSortChange('studentName')}>
                    Sort by Name {sortField === 'studentName' && (sortDirection === 'asc' ? <SortAsc className="h-4 w-4 ml-2" /> : <SortDesc className="h-4 w-4 ml-2" />)}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSortChange('score')}>
                    Sort by Score {sortField === 'score' && (sortDirection === 'asc' ? <SortAsc className="h-4 w-4 ml-2" /> : <SortDesc className="h-4 w-4 ml-2" />)}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSortChange('status')}>
                    Sort by Status {sortField === 'status' && (sortDirection === 'asc' ? <SortAsc className="h-4 w-4 ml-2" /> : <SortDesc className="h-4 w-4 ml-2" />)}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Bulk actions */}
          {selectedEntries.length > 0 && (
            <div className="flex items-center justify-between bg-muted p-2 rounded-md">
              <span className="text-sm font-medium">{selectedEntries.length} submissions selected</span>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Bulk Actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleBulkStatusChange(SubmissionStatus.GRADED)}>
                      Mark as Graded
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkStatusChange(SubmissionStatus.RETURNED)}>
                      Mark as Returned
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}

          {/* Submissions table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={filteredEntries.length > 0 && selectedEntries.length === filteredEntries.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Feedback</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      No submissions found
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedEntries.map(entry => {
                    const editedEntry = editedEntries[entry.submissionId];
                    return (
                      <TableRow key={entry.submissionId}>
                        <TableCell>
                          <Checkbox
                            checked={selectedEntries.includes(entry.submissionId)}
                            onCheckedChange={(checked) => handleSelectionChange(entry.submissionId, !!checked)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{entry.studentName}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={editedEntry?.score || 0}
                              onChange={(e) => handleScoreChange(entry.submissionId, parseFloat(e.target.value))}
                              className="w-16"
                              min={0}
                              max={entry.maxScore}
                            />
                            <span className="text-sm text-muted-foreground">/ {entry.maxScore}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={editedEntry?.feedback || ''}
                            onChange={(e) => handleFeedbackChange(entry.submissionId, e.target.value)}
                            placeholder="Add feedback..."
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          {renderStatusBadge(editedEntry?.status || entry.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onViewSubmission(entry.submissionId)}
                              title="View Submission"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onEditGrading(entry.submissionId)}
                              title="Edit Grading"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-6">
        <div>
          <span className="text-sm text-muted-foreground">
            {filteredEntries.filter(entry => entry.status === SubmissionStatus.GRADED).length} of {filteredEntries.length} graded
          </span>
        </div>

        <Button
          onClick={handleSave}
          disabled={isSubmitting || !hasChanges}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save All Changes
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
