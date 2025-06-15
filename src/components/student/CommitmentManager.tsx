'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { api } from '@/trpc/react';
import { useToast } from '@/components/ui/use-toast';
import { Calendar, CheckCircle, Clock } from 'lucide-react';
import { Target } from '@/components/ui/icons/reward-icons';
import { AlertTriangle } from '@/components/ui/icons/lucide-icons';
import { PlusCircle } from '@/components/ui/icons-fix';
import { formatDistanceToNow, format, addDays } from 'date-fns';

// Custom isPast function since date-fns isPast is not available
const isPast = (date: Date): boolean => {
  return date < new Date();
};

interface CommitmentContract {
  id: string;
  title: string;
  description?: string;
  deadline: Date;
  isCompleted: boolean;
  completedAt?: Date;
  createdAt: Date;
  metadata?: {
    targetValue?: number;
    currentValue?: number;
    activities?: string[];
  };
}

interface Activity {
  id: string;
  title: string;
  status: string;
}

interface CommitmentManagerProps {
  studentId: string;
  classId: string;
  subjectId?: string;
  activities: Activity[];
  commitments: CommitmentContract[];
  onCommitmentCreated?: (commitment: CommitmentContract) => void;
}

/**
 * CommitmentManager component for creating and managing student commitments
 *
 * Features:
 * - List of active commitments with progress indicators
 * - Form for creating new commitments
 * - Activity selection for commitment targets
 * - Deadline setting with date picker
 */
export function CommitmentManager({
  studentId,
  classId,
  subjectId,
  activities,
  commitments,
  onCommitmentCreated
}: CommitmentManagerProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState<Date>(addDays(new Date(), 7)); // Default to 1 week from now

  // Filter activities to only show pending ones
  const pendingActivities = activities.filter(activity =>
    activity.status === 'pending' || activity.status === 'in-progress'
  );

  // Create commitment mutation
  const createCommitmentMutation = api.commitmentContract.createActivityCommitment.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Commitment created",
        description: "Your commitment has been created successfully.",
        variant: "success",
      });
      setIsDialogOpen(false);
      resetForm();
      if (onCommitmentCreated) {
        onCommitmentCreated(data as unknown as CommitmentContract);
      }
    },
    onError: (error) => {
      toast({
        title: "Error creating commitment",
        description: error.message,
        variant: "error",
      });
    }
  });

  const handleCreateCommitment = () => {
    if (selectedActivities.length === 0) {
      toast({
        title: "No activities selected",
        description: "Please select at least one activity for your commitment.",
        variant: "warning",
      });
      return;
    }

    createCommitmentMutation.mutate({
      studentId,
      activities: selectedActivities,
      title: title || `Complete ${selectedActivities.length} activities`,
      description: description || `Commitment to complete ${selectedActivities.length} activities by ${format(deadline, 'PPP')}`,
      deadline,
      classId,
      subjectId
    });
  };

  const resetForm = () => {
    setSelectedActivities([]);
    setTitle('');
    setDescription('');
    setDeadline(addDays(new Date(), 7));
  };

  const handleActivityToggle = (activityId: string) => {
    setSelectedActivities(prev =>
      prev.includes(activityId)
        ? prev.filter(id => id !== activityId)
        : [...prev, activityId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Active Commitments */}
      {commitments.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Active Commitments</h3>
          {commitments.map(commitment => (
            <CommitmentCard
              key={commitment.id}
              commitment={commitment}
              activities={activities}
            />
          ))}
        </div>
      )}

      {/* Create New Commitment Button */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full">
            <PlusCircle className="h-4 w-4 mr-2" />
            Create New Commitment
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create a New Commitment</DialogTitle>
            <DialogDescription>
              Select activities you commit to complete by a specific deadline.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title (Optional)</Label>
              <Input
                id="title"
                placeholder="Complete selected activities"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="I commit to completing these activities by the deadline"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <DatePicker
                value={deadline}
                onChange={(date) => date && setDeadline(date)}
                placeholder="Select deadline date"
                disabled={false} // We'll handle date validation in the form submission
              />
            </div>

            <div className="space-y-2">
              <Label>Select Activities</Label>
              <div className="border rounded-md p-3 max-h-[200px] overflow-y-auto space-y-2">
                {pendingActivities.length > 0 ? (
                  pendingActivities.map(activity => (
                    <div key={activity.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`activity-${activity.id}`}
                        checked={selectedActivities.includes(activity.id)}
                        onCheckedChange={() => handleActivityToggle(activity.id)}
                      />
                      <Label
                        htmlFor={`activity-${activity.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {activity.title}
                      </Label>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No pending activities available</p>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Selected: {selectedActivities.length} activities
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateCommitment}
              disabled={selectedActivities.length === 0 || createCommitmentMutation.isLoading}
            >
              {createCommitmentMutation.isLoading ? "Creating..." : "Create Commitment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper component to display a single commitment
function CommitmentCard({ commitment, activities }: {
  commitment: CommitmentContract,
  activities: Activity[]
}) {
  const deadline = new Date(commitment.deadline);
  const isOverdue = isPast(deadline);
  const formattedDeadline = formatDistanceToNow(deadline, { addSuffix: true });

  // Calculate progress
  const targetValue = commitment.metadata?.targetValue || 0;
  const currentValue = commitment.metadata?.currentValue || 0;
  const progress = targetValue > 0 ? Math.round((currentValue / targetValue) * 100) : 0;

  // Determine status badge
  let statusBadge = (
    <Badge variant="secondary" className="ml-2">
      <Clock className="h-3 w-3 mr-1" />
      In Progress
    </Badge>
  );

  if (commitment.isCompleted) {
    statusBadge = (
      <Badge variant="success" className="ml-2">
        <CheckCircle className="h-3 w-3 mr-1" />
        Completed
      </Badge>
    );
  } else if (isOverdue) {
    statusBadge = (
      <Badge variant="destructive" className="ml-2">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Overdue
      </Badge>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base flex items-center">
              <Target className="h-4 w-4 mr-2 text-primary" />
              {commitment.title}
              {statusBadge}
            </CardTitle>
            <CardDescription>
              Due {format(deadline, 'PPP')} ({formattedDeadline})
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        {commitment.description && (
          <p className="text-sm text-muted-foreground mb-2">{commitment.description}</p>
        )}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Progress: {currentValue}/{targetValue} activities</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <div className="w-full flex justify-end">
          <Button variant="outline" size="sm">
            View Activities
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
