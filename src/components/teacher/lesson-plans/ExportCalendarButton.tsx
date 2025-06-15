'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Download } from 'lucide-react';
import { api } from '@/trpc/react';
import { toast } from '@/components/ui/toast';

interface ExportCalendarButtonProps {
  lessonPlanId: string;
}

export default function ExportCalendarButton({ lessonPlanId }: ExportCalendarButtonProps) {
  const handleExport = async () => {
    try {
      const icalData = await api.lessonPlan.exportToCalendar.query(lessonPlanId);
      
      // Create a blob and download it
      const blob = new Blob([icalData], { type: 'text/calendar' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lesson-plan-${lessonPlanId}.ics`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Calendar exported',
        description: 'The lesson plan has been exported to your calendar',
      });
    } catch (error) {
      console.error('Error exporting calendar:', error);
      toast({
        title: 'Export failed',
        description: 'Failed to export the lesson plan to calendar',
        variant: 'error',
      });
    }
  };
  
  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleExport}
      className="flex items-center gap-2"
    >
      <Calendar className="h-4 w-4" />
      <span>Export to Calendar</span>
    </Button>
  );
}
