'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/trpc/react';
import { Award, BookOpen, Check, User, FileText, Calendar, Clock } from 'lucide-react';

// Define point categories with preset values
const POINT_CATEGORIES = [
  { id: 'lesson_plan', label: 'Lesson Plan Creation', icon: <FileText className="h-4 w-4" />, defaultPoints: 25, maxPoints: 50 },
  { id: 'activity_creation', label: 'Activity Creation', icon: <BookOpen className="h-4 w-4" />, defaultPoints: 15, maxPoints: 30 },
  { id: 'feedback', label: 'Feedback Timeliness', icon: <Clock className="h-4 w-4" />, defaultPoints: 10, maxPoints: 20 },
  { id: 'attendance', label: 'Perfect Attendance', icon: <Calendar className="h-4 w-4" />, defaultPoints: 10, maxPoints: 20 },
  { id: 'class_performance', label: 'Class Performance', icon: <Award className="h-4 w-4" />, defaultPoints: 30, maxPoints: 100 },
  { id: 'special', label: 'Special Recognition', icon: <Award className="h-4 w-4" />, defaultPoints: 25, maxPoints: 100 }
];

export interface Teacher {
  id: string;
  name: string;
  profileImage?: string;
}

interface CoordinatorAwardPointsDialogProps {
  teachers: Teacher[];
  classId?: string;
  onPointsAwarded?: () => void;
  trigger?: React.ReactNode;
}

export function CoordinatorAwardPointsDialog({
  teachers,
  classId,
  onPointsAwarded,
  trigger
}: CoordinatorAwardPointsDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(POINT_CATEGORIES[0].id);
  const [points, setPoints] = useState(POINT_CATEGORIES[0].defaultPoints);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();

  // Get the award points mutation using the teacher points service
  const awardPointsMutation = api.teacherPoints.awardPoints.useMutation({
    onSuccess: (data) => {
      console.log("Points awarded successfully:", data);
      toast({
        title: 'Points awarded successfully',
        description: `${points} points awarded to ${selectedTeachers.length} teacher(s)`,
        variant: 'success',
      });

      // Reset form and close dialog
      resetForm();
      setOpen(false);

      // Call the callback if provided
      if (onPointsAwarded) {
        onPointsAwarded();
      }
    },
    onError: (error) => {
      console.error("Error awarding points:", error);
      toast({
        title: 'Error awarding points',
        description: error.message,
      });
      setIsSubmitting(false);
    }
  });

  // Reset form to initial state
  const resetForm = () => {
    setSelectedTeachers([]);
    setSelectedCategory(POINT_CATEGORIES[0].id);
    setPoints(POINT_CATEGORIES[0].defaultPoints);
    setReason('');
    setIsSubmitting(false);
  };

  // Handle category change
  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    const category = POINT_CATEGORIES.find(cat => cat.id === value);
    if (category) {
      setPoints(category.defaultPoints);
    }
  };

  // Handle teacher selection
  const handleTeacherSelection = (teacherId: string) => {
    setSelectedTeachers(prev => {
      if (prev.includes(teacherId)) {
        return prev.filter(id => id !== teacherId);
      } else {
        return [...prev, teacherId];
      }
    });
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (selectedTeachers.length === 0 || !reason.trim()) {
      toast({
        title: 'Validation error',
        description: 'Please select at least one teacher and provide a reason',
        variant: 'error',
      });
      return;
    }

    setIsSubmitting(true);

    // Award points to each selected teacher
    try {
      // Create a descriptive reason with category
      const category = POINT_CATEGORIES.find(cat => cat.id === selectedCategory);
      const fullDescription = `${category?.label || 'Bonus'}: ${reason}`;

      // Process each teacher
      for (const teacherId of selectedTeachers) {
        await awardPointsMutation.mutateAsync({
          teacherId,
          amount: points,
          source: selectedCategory,
          sourceId: undefined,
          classId,
          description: fullDescription,
        });
      }
    } catch (error) {
      // Error is handled by the mutation
      console.error('Error awarding points:', error);
    }
  };

  // Get the current category
  const currentCategory = POINT_CATEGORIES.find(cat => cat.id === selectedCategory) || POINT_CATEGORIES[0];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Award className="h-4 w-4" />
            Award Points
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Award Points to Teachers</DialogTitle>
          <DialogDescription>
            Recognize teacher achievements and contributions by awarding points.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          {/* Teacher Selection */}
          <div className="space-y-2">
            <Label>Select Teachers</Label>
            <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto border rounded-md p-2">
              {teachers.map((teacher) => (
                <div
                  key={teacher.id}
                  className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md cursor-pointer"
                  onClick={() => handleTeacherSelection(teacher.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedTeachers.includes(teacher.id)}
                    onChange={() => {}}
                    className="h-4 w-4"
                  />
                  <span>{teacher.name}</span>
                </div>
              ))}
              {teachers.length === 0 && (
                <div className="p-2 text-muted-foreground text-center">
                  No teachers available
                </div>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              Selected: {selectedTeachers.length} teacher(s)
            </div>
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <Label htmlFor="category">Point Category</Label>
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {POINT_CATEGORIES.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      {category.icon}
                      <span>{category.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Points Amount */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="points">Points Amount</Label>
              <div className="flex items-center gap-1">
                <Award className="h-4 w-4 text-amber-500" />
                <span className="font-medium text-amber-600">{points}</span>
              </div>
            </div>

            <Slider
              id="points"
              min={1}
              max={currentCategory.maxPoints}
              step={1}
              value={[points]}
              onValueChange={(value) => setPoints(value[0])}
              className="py-2"
            />

            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1</span>
              <span>{currentCategory.maxPoints}</span>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              placeholder="Why are you awarding these points?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 flex-shrink-0 mt-2">
          <Button variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedTeachers.length === 0 || !reason.trim()}
            className="gap-2 w-full sm:w-auto"
          >
            <Award className="h-4 w-4" />
            {isSubmitting ? 'Awarding...' : 'Award Points'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
