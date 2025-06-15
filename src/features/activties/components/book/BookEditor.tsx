'use client';

import React, { useState, useEffect } from 'react';
import {
  BookActivity,
  BookSection,
  BookCheckpoint,
  createDefaultBookActivity,
  createDefaultBookSection,
  createDefaultBookCheckpoint
} from '../../models/book';
import { ReadingEditor } from '../reading/ReadingEditor';
import { cn } from '@/lib/utils';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  BookOpen,
  CheckCircle
} from 'lucide-react';
import { generateId } from '../../models/base';

// Import UI components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface BookEditorProps {
  activity?: BookActivity;
  onSave?: (activity: BookActivity) => void;
  className?: string;
}

/**
 * Book Activity Editor
 *
 * This component allows creating and editing Book activities with:
 * - Multiple sections with rich text content
 * - Embedded activity checkpoints
 * - Configuration options for book behavior
 */
export const BookEditor: React.FC<BookEditorProps> = ({
  activity: initialActivity,
  onSave,
  className
}) => {
  // Initialize with provided activity or create a default one
  const [activity, setActivity] = useState<BookActivity>(
    initialActivity || createDefaultBookActivity()
  );

  // State for managing checkpoint editing
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [isAddingCheckpoint, setIsAddingCheckpoint] = useState(false);
  const [newCheckpoint, setNewCheckpoint] = useState<Partial<BookCheckpoint>>(
    createDefaultBookCheckpoint()
  );
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Current section
  const currentSection = activity.sections[currentSectionIndex];

  // Update activity with changes from ReadingEditor
  const handleReadingUpdate = (updatedReading: any) => {
    setActivity(prev => ({
      ...prev,
      title: updatedReading.title,
      description: updatedReading.description,
      instructions: updatedReading.instructions,
      sections: updatedReading.sections.map((section: any, index: number) => {
        // Preserve checkpoints when updating sections
        const existingCheckpoints = prev.sections[index]?.checkpoints || [];
        return {
          ...section,
          checkpoints: existingCheckpoints
        };
      }),
      settings: {
        ...prev.settings,
        ...updatedReading.settings
      }
    }));
  };

  // Add a checkpoint to the current section
  const handleAddCheckpoint = () => {
    if (!newCheckpoint.title || !newCheckpoint.activityType) {
      return;
    }

    const checkpoint: BookCheckpoint = {
      id: generateId(),
      activityId: newCheckpoint.activityId || '', // This would be set when an activity is selected
      title: newCheckpoint.title || 'New Checkpoint',
      description: newCheckpoint.description || '',
      activityType: newCheckpoint.activityType || 'MULTIPLE_CHOICE',
      isRequired: newCheckpoint.isRequired !== false,
      position: newCheckpoint.position || 'after',
      content: newCheckpoint.content
    };

    setActivity(prev => {
      const updatedSections = [...prev.sections];
      const updatedSection = {
        ...updatedSections[currentSectionIndex],
        checkpoints: [
          ...(updatedSections[currentSectionIndex].checkpoints || []),
          checkpoint
        ]
      };
      updatedSections[currentSectionIndex] = updatedSection;

      return {
        ...prev,
        sections: updatedSections
      };
    });

    // Reset form
    setNewCheckpoint(createDefaultBookCheckpoint());
    setIsAddingCheckpoint(false);
  };

  // Remove a checkpoint
  const handleRemoveCheckpoint = (checkpointId: string) => {
    setActivity(prev => {
      const updatedSections = [...prev.sections];
      const updatedSection = {
        ...updatedSections[currentSectionIndex],
        checkpoints: updatedSections[currentSectionIndex].checkpoints?.filter(
          cp => cp.id !== checkpointId
        ) || []
      };
      updatedSections[currentSectionIndex] = updatedSection;

      return {
        ...prev,
        sections: updatedSections
      };
    });
  };

  // Update a checkpoint
  const handleUpdateCheckpoint = (checkpointId: string, updates: Partial<BookCheckpoint>) => {
    setActivity(prev => {
      const updatedSections = [...prev.sections];
      const sectionIndex = currentSectionIndex;

      const updatedCheckpoints = updatedSections[sectionIndex].checkpoints?.map(cp =>
        cp.id === checkpointId ? { ...cp, ...updates } : cp
      ) || [];

      updatedSections[sectionIndex] = {
        ...updatedSections[sectionIndex],
        checkpoints: updatedCheckpoints
      };

      return {
        ...prev,
        sections: updatedSections
      };
    });
  };

  // Update book settings
  const handleSettingsChange = (key: string, value: any) => {
    setActivity(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [key]: value
      }
    }));
  };

  // Save the activity
  const handleSave = () => {
    if (onSave) {
      try {
        onSave(activity);
        setFeedbackMessage({
          type: 'success',
          message: 'Book activity saved successfully!'
        });
      } catch (error) {
        setFeedbackMessage({
          type: 'error',
          message: 'Failed to save book activity. Please try again.'
        });
      }
      setTimeout(() => setFeedbackMessage(null), 3000);
    }
  };

  // Convert Book activity to Reading activity for the ReadingEditor
  const readingActivity = {
    ...activity,
    activityType: 'reading' as const,
    learningActivityType: 'READING'
  };

  // Activity type options for checkpoints
  const activityTypeOptions = [
    { value: 'MULTIPLE_CHOICE', label: 'Multiple Choice' },
    { value: 'TRUE_FALSE', label: 'True/False' },
    { value: 'MULTIPLE_RESPONSE', label: 'Multiple Response' },
    { value: 'FILL_IN_THE_BLANKS', label: 'Fill in the Blanks' },
    { value: 'MATCHING', label: 'Matching' },
    { value: 'SEQUENCE', label: 'Sequence' },
    { value: 'DRAG_AND_DROP', label: 'Drag and Drop' },
    { value: 'DRAG_THE_WORDS', label: 'Drag the Words' },
    { value: 'NUMERIC', label: 'Numeric' },
    { value: 'QUIZ', label: 'Quiz' }
  ];

  return (
    <div className={cn("space-y-8", className)}>
      <Tabs defaultValue="content" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="checkpoints">Checkpoints</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-4">
          {/* Use ReadingEditor for basic content editing */}
          <ReadingEditor
            activity={readingActivity}
            onSave={handleReadingUpdate}
          />
        </TabsContent>

        <TabsContent value="checkpoints" className="space-y-4">
          {/* Section selector */}
          <div className="mb-6">
            <Label htmlFor="section-selector" className="block mb-2">Select Section</Label>
            <Select
              value={currentSectionIndex.toString()}
              onValueChange={(value) => setCurrentSectionIndex(parseInt(value))}
            >
              <SelectTrigger id="section-selector">
                <SelectValue placeholder="Select a section" />
              </SelectTrigger>
              <SelectContent>
                {activity.sections.map((section, index) => (
                  <SelectItem key={section.id} value={index.toString()}>
                    {index + 1}. {section.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Current section info */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="mr-2 h-5 w-5" />
                Section: {currentSection.title}
              </CardTitle>
              <CardDescription>
                Add checkpoints to this section that students must complete to progress
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Checkpoint list */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Checkpoints</h3>
              <Button
                onClick={() => setIsAddingCheckpoint(true)}
                variant="outline"
                size="sm"
                className="flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Checkpoint
              </Button>
            </div>

            {currentSection.checkpoints && currentSection.checkpoints.length > 0 ? (
              <div className="space-y-4">
                {currentSection.checkpoints.map((checkpoint, index) => (
                  <Card key={checkpoint.id} className="relative">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base flex items-center">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            {checkpoint.title}
                            {checkpoint.isRequired && (
                              <span className="ml-2 text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 px-2 py-0.5 rounded">
                                Required
                              </span>
                            )}
                          </CardTitle>
                          <CardDescription>
                            {activityTypeOptions.find(opt => opt.value === checkpoint.activityType)?.label || checkpoint.activityType}
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveCheckpoint(checkpoint.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="edit">
                          <AccordionTrigger className="text-sm py-2">Edit Checkpoint</AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-4 pt-2">
                              <div>
                                <Label htmlFor={`checkpoint-title-${index}`}>Title</Label>
                                <Input
                                  id={`checkpoint-title-${index}`}
                                  value={checkpoint.title}
                                  onChange={(e) => handleUpdateCheckpoint(checkpoint.id, { title: e.target.value })}
                                  className="mt-1"
                                />
                              </div>

                              <div>
                                <Label htmlFor={`checkpoint-description-${index}`}>Description</Label>
                                <Textarea
                                  id={`checkpoint-description-${index}`}
                                  value={checkpoint.description || ''}
                                  onChange={(e) => handleUpdateCheckpoint(checkpoint.id, { description: e.target.value })}
                                  className="mt-1"
                                />
                              </div>

                              <div>
                                <Label htmlFor={`checkpoint-type-${index}`}>Activity Type</Label>
                                <Select
                                  value={checkpoint.activityType}
                                  onValueChange={(value) => handleUpdateCheckpoint(checkpoint.id, { activityType: value })}
                                >
                                  <SelectTrigger id={`checkpoint-type-${index}`} className="mt-1">
                                    <SelectValue placeholder="Select activity type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {activityTypeOptions.map(option => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label htmlFor={`checkpoint-position-${index}`}>Position</Label>
                                <Select
                                  value={checkpoint.position}
                                  onValueChange={(value) => handleUpdateCheckpoint(
                                    checkpoint.id,
                                    { position: value as 'before' | 'after' | 'middle' }
                                  )}
                                >
                                  <SelectTrigger id={`checkpoint-position-${index}`} className="mt-1">
                                    <SelectValue placeholder="Select position" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="before">Before section content</SelectItem>
                                    <SelectItem value="middle">Middle of section content</SelectItem>
                                    <SelectItem value="after">After section content</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="flex items-center space-x-2">
                                <Switch
                                  id={`checkpoint-required-${index}`}
                                  checked={checkpoint.isRequired}
                                  onCheckedChange={(checked) => handleUpdateCheckpoint(checkpoint.id, { isRequired: checked })}
                                />
                                <Label htmlFor={`checkpoint-required-${index}`}>Required to proceed</Label>
                              </div>

                              <div>
                                <Label htmlFor={`checkpoint-activity-id-${index}`}>Activity ID (optional)</Label>
                                <Input
                                  id={`checkpoint-activity-id-${index}`}
                                  value={checkpoint.activityId || ''}
                                  onChange={(e) => handleUpdateCheckpoint(checkpoint.id, { activityId: e.target.value })}
                                  className="mt-1"
                                  placeholder="Enter existing activity ID or leave blank"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  Leave blank to create a new activity or enter an existing activity ID
                                </p>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border border-dashed rounded-lg">
                <p className="text-gray-500">No checkpoints added to this section yet</p>
                <Button
                  onClick={() => setIsAddingCheckpoint(true)}
                  variant="outline"
                  size="sm"
                  className="mt-4"
                >
                  Add Your First Checkpoint
                </Button>
              </div>
            )}
          </div>

          {/* Add checkpoint dialog */}
          <Dialog open={isAddingCheckpoint} onOpenChange={setIsAddingCheckpoint}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Checkpoint</DialogTitle>
                <DialogDescription>
                  Add an interactive checkpoint to this section
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="checkpoint-title">Title</Label>
                  <Input
                    id="checkpoint-title"
                    value={newCheckpoint.title || ''}
                    onChange={(e) => setNewCheckpoint(prev => ({ ...prev, title: e.target.value }))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="checkpoint-description">Description</Label>
                  <Textarea
                    id="checkpoint-description"
                    value={newCheckpoint.description || ''}
                    onChange={(e) => setNewCheckpoint(prev => ({ ...prev, description: e.target.value }))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="checkpoint-type">Activity Type</Label>
                  <Select
                    value={newCheckpoint.activityType || 'MULTIPLE_CHOICE'}
                    onValueChange={(value) => setNewCheckpoint(prev => ({ ...prev, activityType: value }))}
                  >
                    <SelectTrigger id="checkpoint-type" className="mt-1">
                      <SelectValue placeholder="Select activity type" />
                    </SelectTrigger>
                    <SelectContent>
                      {activityTypeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="checkpoint-position">Position</Label>
                  <Select
                    value={newCheckpoint.position || 'after'}
                    onValueChange={(value) => setNewCheckpoint(
                      prev => ({ ...prev, position: value as 'before' | 'after' | 'middle' })
                    )}
                  >
                    <SelectTrigger id="checkpoint-position" className="mt-1">
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="before">Before section content</SelectItem>
                      <SelectItem value="middle">Middle of section content</SelectItem>
                      <SelectItem value="after">After section content</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="checkpoint-required"
                    checked={newCheckpoint.isRequired !== false}
                    onCheckedChange={(checked) => setNewCheckpoint(prev => ({ ...prev, isRequired: checked }))}
                  />
                  <Label htmlFor="checkpoint-required">Required to proceed</Label>
                </div>

                <div>
                  <Label htmlFor="checkpoint-activity-id">Activity ID (optional)</Label>
                  <Input
                    id="checkpoint-activity-id"
                    value={newCheckpoint.activityId || ''}
                    onChange={(e) => setNewCheckpoint(prev => ({ ...prev, activityId: e.target.value }))}
                    className="mt-1"
                    placeholder="Enter existing activity ID or leave blank"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave blank to create a new activity or enter an existing activity ID
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddingCheckpoint(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddCheckpoint}>
                  Add Checkpoint
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Book Settings</CardTitle>
              <CardDescription>
                Configure how the book activity behaves
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-table-of-contents">Show Table of Contents</Label>
                    <Switch
                      id="show-table-of-contents"
                      checked={activity.settings?.showTableOfContents !== false}
                      onCheckedChange={(checked) => handleSettingsChange('showTableOfContents', checked)}
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    Display a table of contents for easy navigation
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enable-text-to-speech">Enable Text-to-Speech</Label>
                    <Switch
                      id="enable-text-to-speech"
                      checked={activity.settings?.enableTextToSpeech === true}
                      onCheckedChange={(checked) => handleSettingsChange('enableTextToSpeech', checked)}
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    Allow students to listen to the content
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enable-highlighting">Enable Highlighting</Label>
                    <Switch
                      id="enable-highlighting"
                      checked={activity.settings?.enableHighlighting === true}
                      onCheckedChange={(checked) => handleSettingsChange('enableHighlighting', checked)}
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    Allow students to highlight important text
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enable-notes">Enable Notes</Label>
                    <Switch
                      id="enable-notes"
                      checked={activity.settings?.enableNotes === true}
                      onCheckedChange={(checked) => handleSettingsChange('enableNotes', checked)}
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    Allow students to add notes to sections
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-progress-bar">Show Progress Bar</Label>
                    <Switch
                      id="show-progress-bar"
                      checked={activity.settings?.showProgressBar !== false}
                      onCheckedChange={(checked) => handleSettingsChange('showProgressBar', checked)}
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    Display a progress indicator for the book
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="font-size-adjustable">Adjustable Font Size</Label>
                    <Switch
                      id="font-size-adjustable"
                      checked={activity.settings?.fontSizeAdjustable === true}
                      onCheckedChange={(checked) => handleSettingsChange('fontSizeAdjustable', checked)}
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    Allow students to adjust the text size
                  </p>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Checkpoint Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="require-checkpoint-completion">Require Checkpoint Completion</Label>
                      <Switch
                        id="require-checkpoint-completion"
                        checked={activity.settings?.requireCheckpointCompletion !== false}
                        onCheckedChange={(checked) => handleSettingsChange('requireCheckpointCompletion', checked)}
                      />
                    </div>
                    <p className="text-sm text-gray-500">
                      Students must complete required checkpoints to progress
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-checkpoint-feedback">Show Checkpoint Feedback</Label>
                      <Switch
                        id="show-checkpoint-feedback"
                        checked={activity.settings?.showCheckpointFeedback !== false}
                        onCheckedChange={(checked) => handleSettingsChange('showCheckpointFeedback', checked)}
                      />
                    </div>
                    <p className="text-sm text-gray-500">
                      Display feedback after completing checkpoints
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="checkpoint-style">Checkpoint Display Style</Label>
                    <Select
                      value={activity.settings?.checkpointStyle || 'inline'}
                      onValueChange={(value) => handleSettingsChange(
                        'checkpointStyle',
                        value as 'inline' | 'modal' | 'sidebar'
                      )}
                    >
                      <SelectTrigger id="checkpoint-style">
                        <SelectValue placeholder="Select display style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inline">Inline (below section)</SelectItem>
                        <SelectItem value="modal">Modal (popup)</SelectItem>
                        <SelectItem value="sidebar">Sidebar</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-500">
                      How checkpoints are displayed to students
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reading-time-estimate">Estimated Reading Time (minutes)</Label>
                    <Input
                      id="reading-time-estimate"
                      type="number"
                      min="1"
                      value={activity.settings?.readingTimeEstimate || 10}
                      onChange={(e) => handleSettingsChange('readingTimeEstimate', parseInt(e.target.value) || 10)}
                    />
                    <p className="text-sm text-gray-500">
                      Approximate time to complete the book
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save button */}
      <div className="flex justify-end mt-8">
        <Button onClick={handleSave} size="lg">
          Save Book Activity
        </Button>
      </div>

      {/* Feedback message */}
      {feedbackMessage && (
        <div className={cn(
          "fixed bottom-4 right-4 p-4 rounded-md shadow-lg z-50 transition-opacity",
          feedbackMessage.type === 'success'
            ? "bg-green-100 text-green-800 border border-green-200"
            : "bg-red-100 text-red-800 border border-red-200"
        )}>
          {feedbackMessage.message}
        </div>
      )}
    </div>
  );
};

export default BookEditor;
