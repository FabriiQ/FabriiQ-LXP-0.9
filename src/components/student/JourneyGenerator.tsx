'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, RotateCw } from 'lucide-react';
import { api } from '@/trpc/react';
import { useToast } from '@/components/ui/use-toast';

interface JourneyGeneratorProps {
  studentId: string;
  classId: string;
  onComplete?: () => void;
}

/**
 * JourneyGenerator component
 *
 * This component provides a UI to generate journey events from completed activities
 * for a student in a specific class.
 */
export function JourneyGenerator({ studentId, classId, onComplete }: JourneyGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  // Get the journey events query to refetch after generating
  const utils = api.useContext();

  // tRPC mutation for generating journey events
  const generateJourneyEvents = api.activityJourney.generateJourneyEventsForStudent.useMutation({
    onSuccess: (data) => {
      setIsGenerating(false);
      toast({
        title: 'Journey Events Generated',
        description: `Successfully created ${data.length} journey events from your completed activities.`,
        duration: 5000,
      });

      // Invalidate the journey events query to refetch the data
      utils.journeyEvent.getStudentJourneyEvents.invalidate({
        studentId,
        classId,
      });

      if (onComplete) {
        onComplete();
      }
    },
    onError: (error) => {
      setIsGenerating(false);
      toast({
        title: 'Error Generating Journey Events',
        description: error.message || 'An error occurred while generating journey events.',
        variant: 'error',
        duration: 5000,
      });
    }
  });

  const handleGenerateJourneyEvents = () => {
    setIsGenerating(true);
    generateJourneyEvents.mutate({
      studentId,
      classId,
      limit: 50 // Generate events for up to 50 activities
    });
  };

  return (
    <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <RotateCw className="h-5 w-5 mr-2 text-primary" />
          Update Your Learning Journey
        </CardTitle>
        <CardDescription>
          Generate journey events from your completed activities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-primary/80 mb-4">
          This will create timeline events for all your completed activities in this class,
          making your learning journey more complete and visually engaging.
        </p>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleGenerateJourneyEvents}
          disabled={isGenerating}
          className="bg-primary hover:bg-primary/90"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            'Update Journey'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
