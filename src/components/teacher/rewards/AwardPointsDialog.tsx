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
import { Award, BookOpen, Check, User } from 'lucide-react';

// Define point categories with preset values
const POINT_CATEGORIES = [
  { id: 'participation', label: 'Class Participation', icon: <User className="h-4 w-4" />, defaultPoints: 10, maxPoints: 25 },
  { id: 'behavior', label: 'Positive Behavior', icon: <Check className="h-4 w-4" />, defaultPoints: 15, maxPoints: 30 },
  { id: 'academic', label: 'Academic Achievement', icon: <BookOpen className="h-4 w-4" />, defaultPoints: 20, maxPoints: 50 },
  { id: 'improvement', label: 'Improvement', icon: <Award className="h-4 w-4" />, defaultPoints: 15, maxPoints: 40 },
  { id: 'special', label: 'Special Recognition', icon: <Award className="h-4 w-4" />, defaultPoints: 25, maxPoints: 100 },
  { id: 'custom', label: 'Custom Award', icon: <Award className="h-4 w-4" />, defaultPoints: 10, maxPoints: 100 }
];

export interface Student {
  id: string;
  name: string;
  profileImage?: string;
}

interface AwardPointsDialogProps {
  students: Student[];
  classId: string;
  onPointsAwarded?: () => void;
  trigger?: React.ReactNode;
}

export function AwardPointsDialog({
  students,
  classId,
  onPointsAwarded,
  trigger
}: AwardPointsDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(POINT_CATEGORIES[0].id);
  const [points, setPoints] = useState(POINT_CATEGORIES[0].defaultPoints);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();

  // Get the award points mutation using the existing points service
  const awardPointsMutation = api.points.awardPoints.useMutation({
    onSuccess: (data) => {
      console.log("Points awarded successfully:", data);
      toast({
        title: 'Points awarded successfully',
        description: `${points} points awarded to ${selectedStudents.length} student(s)`,
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

  // Get the current category
  const currentCategory = POINT_CATEGORIES.find(cat => cat.id === selectedCategory) || POINT_CATEGORIES[0];

  // Reset the form
  const resetForm = () => {
    setSelectedStudents([]);
    setSelectedCategory(POINT_CATEGORIES[0].id);
    setPoints(POINT_CATEGORIES[0].defaultPoints);
    setReason('');
    setIsSubmitting(false);
  };

  // Handle category change
  const handleCategoryChange = (value: string) => {
    const category = POINT_CATEGORIES.find(cat => cat.id === value);
    if (category) {
      setSelectedCategory(value);
      setPoints(category.defaultPoints);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (selectedStudents.length === 0) {
      toast({
        title: 'No students selected',
        description: 'Please select at least one student to award points to',
      });
      return;
    }

    if (points <= 0) {
      toast({
        title: 'Invalid points',
        description: 'Please enter a positive number of points',
      });
      return;
    }

    if (!reason.trim()) {
      toast({
        title: 'No reason provided',
        description: 'Please provide a reason for awarding points',
      });
      return;
    }

    setIsSubmitting(true);

    // Award points to each selected student
    try {
      // Create a descriptive reason with category
      const category = POINT_CATEGORIES.find(cat => cat.id === selectedCategory);
      const fullDescription = `${category?.label || 'Bonus'}: ${reason}`;

      // Process each student
      for (const studentId of selectedStudents) {
        await awardPointsMutation.mutateAsync({
          studentId,
          amount: points,
          source: 'teacher-bonus', // Use the source expected by your API
          sourceId: undefined, // Optional in your API
          classId, // Pass the class ID
          description: fullDescription,
        });
      }
    } catch (error) {
      // Error is handled by the mutation
      console.error('Error awarding points:', error);
    }
  };

  // Toggle student selection
  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  // Select all students
  const selectAllStudents = () => {
    setSelectedStudents(students.map(student => student.id));
  };

  // Deselect all students
  const deselectAllStudents = () => {
    setSelectedStudents([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Award className="h-4 w-4" />
            Award Points
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Award Points to Students</DialogTitle>
          <DialogDescription>
            Recognize student achievements by awarding points.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4 overflow-y-auto pr-1 flex-grow">
          {/* Student Selection */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
              <Label htmlFor="students">Select Students</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllStudents}
                  className="h-7 text-xs flex-1 sm:flex-none"
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deselectAllStudents}
                  className="h-7 text-xs flex-1 sm:flex-none"
                >
                  Deselect All
                </Button>
              </div>
            </div>

            <div className="max-h-[150px] overflow-y-auto border rounded-md p-2 touch-auto">
              {students.length > 0 ? (
                <div className="space-y-2">
                  {students.map(student => (
                    <div
                      key={student.id}
                      className="flex items-center space-x-2"
                    >
                      <input
                        type="checkbox"
                        id={`student-${student.id}`}
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => toggleStudentSelection(student.id)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <label
                        htmlFor={`student-${student.id}`}
                        className="text-sm flex-grow cursor-pointer py-1"
                      >
                        {student.name}
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-2 text-center">
                  No students available
                </p>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              {selectedStudents.length} student(s) selected
            </p>
          </div>

          {/* Point Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Point Category</Label>
            <Select
              value={selectedCategory}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {POINT_CATEGORIES.map(category => (
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
            disabled={isSubmitting || selectedStudents.length === 0 || !reason.trim()}
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
