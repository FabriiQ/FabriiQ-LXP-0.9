'use client';

/**
 * PlanStructureEditor
 *
 * A reusable component for editing the structure of lesson plans.
 * Allows adding, removing, and reordering sections, as well as
 * allocating time for each section.
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult
} from '@hello-pangea/dnd';
import {
  Plus,
  Trash2,
  Menu as GripIcon,
  Clock,
  ChevronDown,
  ChevronUp,
  FileText,
  CheckSquare as ListChecksIcon,
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Define the section types
export enum SectionType {
  INTRODUCTION = 'introduction',
  CONTENT = 'content',
  ACTIVITY = 'activity',
  ASSESSMENT = 'assessment',
  CONCLUSION = 'conclusion',
  CUSTOM = 'custom',
}

// Define the section interface
export interface PlanSection {
  id: string;
  type: SectionType;
  title: string;
  description: string;
  timeAllocation: number; // in minutes
  content?: string;
  activities?: Array<{
    id: string;
    title: string;
    description: string;
    timeAllocation: number;
  }>;
  resources?: Array<{
    id: string;
    title: string;
    type: string;
    url?: string;
  }>;
}

export interface PlanStructureEditorProps {
  sections: PlanSection[];
  onChange: (sections: PlanSection[]) => void;
  className?: string;
  totalTime?: number; // in minutes
  showTimeAllocation?: boolean;
  showActivities?: boolean;
  showResources?: boolean;
}

export function PlanStructureEditor({
  sections,
  onChange,
  className,
  totalTime = 60,
  showTimeAllocation = true,
  showActivities = true,
  showResources = true,
}: PlanStructureEditorProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Check if a section is expanded
  const isSectionExpanded = (sectionId: string) => {
    return !!expandedSections[sectionId];
  };

  // Handle drag end
  const handleDragEnd = (result: DropResult) => {
    const { destination, source } = result;

    // If dropped outside the list or at the same position
    if (!destination ||
        (destination.droppableId === source.droppableId &&
         destination.index === source.index)) {
      return;
    }

    // Reorder the sections
    const newSections = Array.from(sections);
    const [removed] = newSections.splice(source.index, 1);
    newSections.splice(destination.index, 0, removed);

    // Update the sections
    onChange(newSections);
  };

  // Add a new section
  const addSection = () => {
    const newSection: PlanSection = {
      id: `section-${Date.now()}`,
      type: SectionType.CONTENT,
      title: 'New Section',
      description: '',
      timeAllocation: 10,
      activities: [],
      resources: [],
    };

    onChange([...sections, newSection]);

    // Expand the new section
    setExpandedSections(prev => ({
      ...prev,
      [newSection.id]: true
    }));
  };

  // Remove a section
  const removeSection = (sectionId: string) => {
    onChange(sections.filter(section => section.id !== sectionId));
  };

  // Update a section
  const updateSection = (sectionId: string, updates: Partial<PlanSection>) => {
    onChange(
      sections.map(section =>
        section.id === sectionId
          ? { ...section, ...updates }
          : section
      )
    );
  };

  // Add an activity to a section
  const addActivity = (sectionId: string) => {
    const newActivity = {
      id: `activity-${Date.now()}`,
      title: 'New Activity',
      description: '',
      timeAllocation: 5,
    };

    onChange(
      sections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              activities: [...(section.activities || []), newActivity]
            }
          : section
      )
    );
  };

  // Remove an activity from a section
  const removeActivity = (sectionId: string, activityId: string) => {
    onChange(
      sections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              activities: (section.activities || []).filter(
                activity => activity.id !== activityId
              )
            }
          : section
      )
    );
  };

  // Update an activity in a section
  const updateActivity = (
    sectionId: string,
    activityId: string,
    updates: Partial<PlanSection['activities'][0]>
  ) => {
    onChange(
      sections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              activities: (section.activities || []).map(
                activity => activity.id === activityId
                  ? { ...activity, ...updates }
                  : activity
              )
            }
          : section
      )
    );
  };

  // Add a resource to a section
  const addResource = (sectionId: string) => {
    const newResource = {
      id: `resource-${Date.now()}`,
      title: 'New Resource',
      type: 'link',
      url: '',
    };

    onChange(
      sections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              resources: [...(section.resources || []), newResource]
            }
          : section
      )
    );
  };

  // Remove a resource from a section
  const removeResource = (sectionId: string, resourceId: string) => {
    onChange(
      sections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              resources: (section.resources || []).filter(
                resource => resource.id !== resourceId
              )
            }
          : section
      )
    );
  };

  // Update a resource in a section
  const updateResource = (
    sectionId: string,
    resourceId: string,
    updates: Partial<PlanSection['resources'][0]>
  ) => {
    onChange(
      sections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              resources: (section.resources || []).map(
                resource => resource.id === resourceId
                  ? { ...resource, ...updates }
                  : resource
              )
            }
          : section
      )
    );
  };

  // Calculate total allocated time
  const allocatedTime = sections.reduce(
    (total, section) => total + section.timeAllocation,
    0
  );

  // Get section icon based on type
  const getSectionIcon = (type: SectionType) => {
    switch (type) {
      case SectionType.INTRODUCTION:
        return <BookOpen className="h-4 w-4" />;
      case SectionType.CONTENT:
        return <FileText className="h-4 w-4" />;
      case SectionType.ACTIVITY:
        return <ListChecksIcon className="h-4 w-4" />;
      case SectionType.ASSESSMENT:
        return <ListChecksIcon className="h-4 w-4" />;
      case SectionType.CONCLUSION:
        return <BookOpen className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Lesson Plan Structure</h3>
          <p className="text-sm text-muted-foreground">
            Organize your lesson plan into sections and allocate time for each.
          </p>
        </div>

        {showTimeAllocation && (
          <div className="text-sm">
            <span className="font-medium">Time Allocated:</span>{' '}
            <span className={allocatedTime > totalTime ? 'text-red-500' : ''}>
              {allocatedTime} / {totalTime} minutes
            </span>
          </div>
        )}
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="sections">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-3"
            >
              {sections.map((section, index) => (
                <Draggable
                  key={section.id}
                  draggableId={section.id}
                  index={index}
                >
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className="rounded-md border"
                    >
                      <Collapsible
                        open={isSectionExpanded(section.id)}
                        onOpenChange={() => toggleSection(section.id)}
                      >
                        <div className="flex items-center p-3">
                          <div
                            {...provided.dragHandleProps}
                            className="mr-2 cursor-grab"
                          >
                            <GripIcon className="h-5 w-5 text-muted-foreground" />
                          </div>

                          <div className="flex-1 flex items-center">
                            <div className="mr-2">
                              {getSectionIcon(section.type)}
                            </div>
                            <div className="font-medium truncate">
                              {section.title || 'Untitled Section'}
                            </div>
                          </div>

                          {showTimeAllocation && (
                            <div className="flex items-center mr-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4 mr-1" />
                              {section.timeAllocation} min
                            </div>
                          )}

                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="p-0 h-8 w-8">
                              {isSectionExpanded(section.id) ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-0 h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => removeSection(section.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <CollapsibleContent>
                          <div className="p-3 pt-0 border-t">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <Label htmlFor={`section-title-${section.id}`}>
                                  Section Title
                                </Label>
                                <Input
                                  id={`section-title-${section.id}`}
                                  value={section.title}
                                  onChange={(e) => updateSection(section.id, { title: e.target.value })}
                                  className="mt-1"
                                />
                              </div>

                              <div>
                                <Label htmlFor={`section-type-${section.id}`}>
                                  Section Type
                                </Label>
                                <Select
                                  value={section.type}
                                  onValueChange={(value) => updateSection(section.id, { type: value as SectionType })}
                                >
                                  <SelectTrigger id={`section-type-${section.id}`} className="mt-1">
                                    <SelectValue placeholder="Select section type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value={SectionType.INTRODUCTION}>Introduction</SelectItem>
                                    <SelectItem value={SectionType.CONTENT}>Content</SelectItem>
                                    <SelectItem value={SectionType.ACTIVITY}>Activity</SelectItem>
                                    <SelectItem value={SectionType.ASSESSMENT}>Assessment</SelectItem>
                                    <SelectItem value={SectionType.CONCLUSION}>Conclusion</SelectItem>
                                    <SelectItem value={SectionType.CUSTOM}>Custom</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="mb-4">
                              <Label htmlFor={`section-description-${section.id}`}>
                                Description
                              </Label>
                              <Textarea
                                id={`section-description-${section.id}`}
                                value={section.description}
                                onChange={(e) => updateSection(section.id, { description: e.target.value })}
                                className="mt-1"
                                rows={2}
                              />
                            </div>

                            {showTimeAllocation && (
                              <div className="mb-4">
                                <Label htmlFor={`section-time-${section.id}`}>
                                  Time Allocation (minutes)
                                </Label>
                                <Input
                                  id={`section-time-${section.id}`}
                                  type="number"
                                  min={1}
                                  max={totalTime}
                                  value={section.timeAllocation}
                                  onChange={(e) => updateSection(section.id, { timeAllocation: parseInt(e.target.value) || 0 })}
                                  className="mt-1 w-full md:w-1/3"
                                />
                              </div>
                            )}

                            <div className="mb-4">
                              <Label htmlFor={`section-content-${section.id}`}>
                                Content
                              </Label>
                              <Textarea
                                id={`section-content-${section.id}`}
                                value={section.content || ''}
                                onChange={(e) => updateSection(section.id, { content: e.target.value })}
                                className="mt-1"
                                rows={4}
                              />
                            </div>

                            {showActivities && (
                              <div className="mb-4">
                                <div className="flex justify-between items-center mb-2">
                                  <Label>Activities</Label>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addActivity(section.id)}
                                  >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Activity
                                  </Button>
                                </div>

                                <div className="space-y-3">
                                  {(section.activities || []).map((activity) => (
                                    <Card key={activity.id}>
                                      <CardHeader className="p-3 pb-0">
                                        <div className="flex justify-between items-center">
                                          <CardTitle className="text-sm font-medium">
                                            {activity.title || 'Untitled Activity'}
                                          </CardTitle>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="p-0 h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => removeActivity(section.id, activity.id)}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </CardHeader>
                                      <CardContent className="p-3">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                                          <div>
                                            <Label htmlFor={`activity-title-${activity.id}`} className="text-xs">
                                              Activity Title
                                            </Label>
                                            <Input
                                              id={`activity-title-${activity.id}`}
                                              value={activity.title}
                                              onChange={(e) => updateActivity(section.id, activity.id, { title: e.target.value })}
                                              className="mt-1"
                                            />
                                          </div>

                                          {showTimeAllocation && (
                                            <div>
                                              <Label htmlFor={`activity-time-${activity.id}`} className="text-xs">
                                                Time (minutes)
                                              </Label>
                                              <Input
                                                id={`activity-time-${activity.id}`}
                                                type="number"
                                                min={1}
                                                max={section.timeAllocation}
                                                value={activity.timeAllocation}
                                                onChange={(e) => updateActivity(section.id, activity.id, { timeAllocation: parseInt(e.target.value) || 0 })}
                                                className="mt-1"
                                              />
                                            </div>
                                          )}
                                        </div>

                                        <div>
                                          <Label htmlFor={`activity-description-${activity.id}`} className="text-xs">
                                            Description
                                          </Label>
                                          <Textarea
                                            id={`activity-description-${activity.id}`}
                                            value={activity.description}
                                            onChange={(e) => updateActivity(section.id, activity.id, { description: e.target.value })}
                                            className="mt-1"
                                            rows={2}
                                          />
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}

                                  {(section.activities || []).length === 0 && (
                                    <div className="text-center p-4 border border-dashed rounded-md text-muted-foreground text-sm">
                                      No activities added yet. Click "Add Activity" to create one.
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {showResources && (
                              <div>
                                <div className="flex justify-between items-center mb-2">
                                  <Label>Resources</Label>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addResource(section.id)}
                                  >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Resource
                                  </Button>
                                </div>

                                <div className="space-y-3">
                                  {(section.resources || []).map((resource) => (
                                    <Card key={resource.id}>
                                      <CardHeader className="p-3 pb-0">
                                        <div className="flex justify-between items-center">
                                          <CardTitle className="text-sm font-medium">
                                            {resource.title || 'Untitled Resource'}
                                          </CardTitle>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="p-0 h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => removeResource(section.id, resource.id)}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </CardHeader>
                                      <CardContent className="p-3">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                                          <div>
                                            <Label htmlFor={`resource-title-${resource.id}`} className="text-xs">
                                              Resource Title
                                            </Label>
                                            <Input
                                              id={`resource-title-${resource.id}`}
                                              value={resource.title}
                                              onChange={(e) => updateResource(section.id, resource.id, { title: e.target.value })}
                                              className="mt-1"
                                            />
                                          </div>

                                          <div>
                                            <Label htmlFor={`resource-type-${resource.id}`} className="text-xs">
                                              Resource Type
                                            </Label>
                                            <Select
                                              value={resource.type}
                                              onValueChange={(value) => updateResource(section.id, resource.id, { type: value })}
                                            >
                                              <SelectTrigger id={`resource-type-${resource.id}`} className="mt-1">
                                                <SelectValue placeholder="Select resource type" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="link">Link</SelectItem>
                                                <SelectItem value="document">Document</SelectItem>
                                                <SelectItem value="video">Video</SelectItem>
                                                <SelectItem value="image">Image</SelectItem>
                                                <SelectItem value="audio">Audio</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </div>
                                        </div>

                                        <div>
                                          <Label htmlFor={`resource-url-${resource.id}`} className="text-xs">
                                            URL (optional)
                                          </Label>
                                          <Input
                                            id={`resource-url-${resource.id}`}
                                            value={resource.url || ''}
                                            onChange={(e) => updateResource(section.id, resource.id, { url: e.target.value })}
                                            className="mt-1"
                                            placeholder="https://"
                                          />
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}

                                  {(section.resources || []).length === 0 && (
                                    <div className="text-center p-4 border border-dashed rounded-md text-muted-foreground text-sm">
                                      No resources added yet. Click "Add Resource" to create one.
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={addSection}
          className="w-full md:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Section
        </Button>
      </div>
    </div>
  );
}
