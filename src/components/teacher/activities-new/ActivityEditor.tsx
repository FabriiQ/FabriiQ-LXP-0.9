'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, Save, Eye } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { ActivityPurpose } from '@/server/api/constants';

// Import all activity editors and viewers from the new architecture
import {
  MultipleChoiceEditor,
  TrueFalseEditor,
  MultipleResponseEditor,
  FillInTheBlanksEditor,
  MatchingEditor,
  SequenceEditor,
  DragAndDropEditor,
  DragTheWordsEditor,
  FlashCardsEditor,
  NumericEditor,
  QuizEditor,
  ReadingEditor,
  VideoEditor,
  
  // Import viewer components for preview
  MultipleChoiceViewer,
  TrueFalseViewer,
  MultipleResponseViewer,
  FillInTheBlanksViewer,
  MatchingViewer,
  SequenceViewer,
  DragAndDropViewer,
  DragTheWordsViewer,
  FlashCardsViewer,
  NumericViewer,
  QuizViewer,
  ReadingViewer,
  VideoViewer,
} from '@/features/activties';

interface ActivityEditorProps {
  activity: any;
  onSave: (updatedActivity: any) => void;
  onCancel: () => void;
  className?: string;
}

export function ActivityEditor({
  activity: initialActivity,
  onSave,
  onCancel,
  className
}: ActivityEditorProps) {
  const { toast } = useToast();
  
  // State for the activity
  const [activity, setActivity] = useState<any>(initialActivity);
  const [title, setTitle] = useState(initialActivity?.title || '');
  const [description, setDescription] = useState(initialActivity?.description || '');
  const [instructions, setInstructions] = useState(initialActivity?.instructions || '');
  const [purpose, setPurpose] = useState<ActivityPurpose>(initialActivity?.purpose || ActivityPurpose.LEARNING);
  const [isGradable, setIsGradable] = useState(initialActivity?.isGradable || false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  
  // Update activity when form values change
  useEffect(() => {
    if (!activity) return;
    
    setActivity({
      ...activity,
      title,
      description,
      instructions,
    });
  }, [title, description, instructions]);
  
  // Handle save
  const handleSave = () => {
    if (!activity) {
      toast({
        title: "Error",
        description: "Activity data is missing",
        variant: "error",
      });
      return;
    }
    
    // Prepare the updated activity
    const updatedActivity = {
      ...activity,
      title,
      description,
      instructions,
      purpose,
      isGradable,
    };
    
    onSave(updatedActivity);
  };
  
  // Render the appropriate editor component based on activity type
  const renderEditor = () => {
    if (!activity) return null;
    
    const commonProps = {
      activity,
      onChange: setActivity,
    };
    
    switch (activity.activityType) {
      case 'multiple-choice':
        return <MultipleChoiceEditor {...commonProps} />;
      case 'true-false':
        return <TrueFalseEditor {...commonProps} />;
      case 'multiple-response':
        return <MultipleResponseEditor {...commonProps} />;
      case 'fill-in-the-blanks':
        return <FillInTheBlanksEditor {...commonProps} />;
      case 'matching':
        return <MatchingEditor {...commonProps} />;
      case 'sequence':
        return <SequenceEditor {...commonProps} />;
      case 'drag-and-drop':
        return <DragAndDropEditor {...commonProps} />;
      case 'drag-the-words':
        return <DragTheWordsEditor {...commonProps} />;
      case 'flash-cards':
        return <FlashCardsEditor {...commonProps} />;
      case 'numeric':
        return <NumericEditor {...commonProps} />;
      case 'quiz':
        return <QuizEditor {...commonProps} />;
      case 'reading':
        return <ReadingEditor {...commonProps} />;
      case 'video':
        return <VideoEditor {...commonProps} />;
      default:
        return <div>No editor available for this activity type</div>;
    }
  };
  
  // Render the appropriate viewer component based on activity type
  const renderViewer = () => {
    if (!activity) return null;
    
    const commonProps = {
      activity,
      mode: 'teacher' as const,
    };
    
    switch (activity.activityType) {
      case 'multiple-choice':
        return <MultipleChoiceViewer {...commonProps} />;
      case 'true-false':
        return <TrueFalseViewer {...commonProps} />;
      case 'multiple-response':
        return <MultipleResponseViewer {...commonProps} />;
      case 'fill-in-the-blanks':
        return <FillInTheBlanksViewer {...commonProps} />;
      case 'matching':
        return <MatchingViewer {...commonProps} />;
      case 'sequence':
        return <SequenceViewer {...commonProps} />;
      case 'drag-and-drop':
        return <DragAndDropViewer {...commonProps} />;
      case 'drag-the-words':
        return <DragTheWordsViewer {...commonProps} />;
      case 'flash-cards':
        return <FlashCardsViewer {...commonProps} />;
      case 'numeric':
        return <NumericViewer {...commonProps} />;
      case 'quiz':
        return <QuizViewer {...commonProps} />;
      case 'reading':
        return <ReadingViewer {...commonProps} />;
      case 'video':
        return <VideoViewer {...commonProps} />;
      default:
        return <div>No viewer available for this activity type</div>;
    }
  };
  
  if (!activity) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="p-6 text-center">
          <p>Activity not found or failed to load</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Activity</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Activity Details</CardTitle>
          <CardDescription>
            Edit the basic information for your activity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter activity title"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter activity description"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Enter activity instructions"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose</Label>
            <div className="flex items-center space-x-2">
              <select
                id="purpose"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value as ActivityPurpose)}
                className="w-full p-2 border rounded-md"
              >
                <option value={ActivityPurpose.LEARNING}>Learning</option>
                <option value={ActivityPurpose.ASSESSMENT}>Assessment</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="isGradable"
              checked={isGradable}
              onCheckedChange={setIsGradable}
            />
            <Label htmlFor="isGradable">Gradable</Label>
          </div>
        </CardContent>
      </Card>
      
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'edit' | 'preview')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="edit">Edit</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="edit" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Content</CardTitle>
              <CardDescription>
                Configure the content for your activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderEditor()}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="preview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Preview</CardTitle>
              <CardDescription>
                Preview how your activity will appear to students
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderViewer()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}
