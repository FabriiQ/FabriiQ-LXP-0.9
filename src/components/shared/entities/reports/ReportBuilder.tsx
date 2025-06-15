import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/core/card';
import { Button } from '@/components/ui/core/button';
import { Input } from '@/components/ui/core/input';
import { Label } from '@/components/ui/core/label';
// Import the textarea component we created earlier
import { Textarea } from '@/components/ui/core/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/core/select';
// Import the tabs components we created earlier
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/core/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/core/accordion';
import {
  Calendar,
  Plus,
  Trash,
  ArrowUp,
  ArrowDown,
  Menu,
  X
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/core/popover';
import { Calendar as CalendarComponent } from '@/components/ui/core/calendar';
import { Badge } from '@/components/ui/core/badge';
// import { format } from 'date-fns';
import {
  Report,
  ReportStatus,
  ReportType,
  ReportFormat,
  ReportFrequency,
  ReportVisibility,
  ReportSection
} from './types';
import { AnalyticsEntityType, AnalyticsVisualization } from '../analytics/types';

export interface ReportBuilderProps {
  report?: Report;
  onSave: (report: Partial<Report>) => void;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string;
  availableVisualizations?: AnalyticsVisualization[];
  className?: string;
}

export function ReportBuilder({
  report,
  onSave,
  onCancel,
  isLoading = false,
  error,
  availableVisualizations = [],
  className = '',
}: ReportBuilderProps) {
  // State for the report being built
  const [title, setTitle] = useState(report?.title || '');
  const [description, setDescription] = useState(report?.description || '');
  const [type, setType] = useState<ReportType>(
    report?.type || ReportType.STANDARD
  );
  const [status, setStatus] = useState<ReportStatus>(
    report?.status || ReportStatus.DRAFT
  );
  const [format, setFormat] = useState<ReportFormat>(
    report?.format || ReportFormat.PDF
  );
  const [frequency, setFrequency] = useState<ReportFrequency>(
    report?.frequency || ReportFrequency.ONCE
  );
  const [visibility, setVisibility] = useState<ReportVisibility>(
    report?.visibility || ReportVisibility.PRIVATE
  );
  const [entityType, setEntityType] = useState<AnalyticsEntityType | undefined>(
    report?.entityType
  );
  const [entityId] = useState<string | undefined>(
    report?.entityId
  );
  const [scheduledAt, setScheduledAt] = useState<Date | undefined>(
    report?.scheduledAt
  );
  const [tags, setTags] = useState<string[]>(
    report?.tags || []
  );
  const [sections, setSections] = useState<Partial<ReportSection>[]>(
    report?.sections || []
  );
  const [newTag, setNewTag] = useState('');

  // State for the active tab
  const [activeTab, setActiveTab] = useState('details');

  // Handle adding a new tag
  const handleAddTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };

  // Handle removing a tag
  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  // Handle adding a new section
  const handleAddSection = () => {
    const newSection: Partial<ReportSection> = {
      id: `temp-${Date.now()}`,
      title: 'New Section',
      order: sections.length,
    };

    setSections([...sections, newSection]);
  };

  // Handle removing a section
  const handleRemoveSection = (sectionId: string) => {
    setSections(sections.filter(s => s.id !== sectionId));
  };

  // Handle moving a section up
  const handleMoveUp = (index: number) => {
    if (index === 0) return;

    const newSections = [...sections];
    const temp = newSections[index];
    newSections[index] = newSections[index - 1];
    newSections[index - 1] = temp;

    // Update order
    newSections.forEach((section, i) => {
      section.order = i;
    });

    setSections(newSections);
  };

  // Handle moving a section down
  const handleMoveDown = (index: number) => {
    if (index === sections.length - 1) return;

    const newSections = [...sections];
    const temp = newSections[index];
    newSections[index] = newSections[index + 1];
    newSections[index + 1] = temp;

    // Update order
    newSections.forEach((section, i) => {
      section.order = i;
    });

    setSections(newSections);
  };

  // Handle updating a section
  const handleUpdateSection = (index: number, field: string, value: any) => {
    const newSections = [...sections];
    newSections[index] = {
      ...newSections[index],
      [field]: value,
    };
    setSections(newSections);
  };

  // Handle save
  const handleSave = () => {
    onSave({
    // @ts-ignore - Type error in the format property
      title,
      description,
      type,
      status,
      format,
      frequency,
      visibility,
      entityType,
      entityId,
      scheduledAt,
      tags,
      sections: sections as ReportSection[],
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle>
            {report ? 'Edit Report' : 'Create Report'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4">
              {error}
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="sections">Sections</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter report title"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter report description"
                  disabled={isLoading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Report Type</Label>
                  <Select
                    value={type}
                    onValueChange={(value) => setType(value as ReportType)}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(ReportType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={status}
                    onValueChange={(value) => setStatus(value as ReportStatus)}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(ReportStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="format">Format</Label>
                  <Select
                    value={format}
                    onValueChange={(value) => setFormat(value as ReportFormat)}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="format">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(ReportFormat).map((format) => (
                        <SelectItem key={format} value={format}>
                          {format}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select
                    value={frequency}
                    onValueChange={(value) => setFrequency(value as ReportFrequency)}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="frequency">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(ReportFrequency).map((frequency) => (
                        <SelectItem key={frequency} value={frequency}>
                          {frequency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visibility">Visibility</Label>
                  <Select
                    value={visibility}
                    onValueChange={(value) => setVisibility(value as ReportVisibility)}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="visibility">
                      <SelectValue placeholder="Select visibility" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(ReportVisibility).map((visibility) => (
                        <SelectItem key={visibility} value={visibility}>
                          {visibility}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="entityType">Entity Type (optional)</Label>
                  <Select
                    value={entityType || ''}
                    onValueChange={(value) => setEntityType(value ? value as AnalyticsEntityType : undefined)}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="entityType">
                      <SelectValue placeholder="Select entity type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {Object.values(AnalyticsEntityType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {frequency !== ReportFrequency.ONCE && (
                  <div className="space-y-2">
                    <Label htmlFor="scheduledAt">Schedule Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                          disabled={isLoading}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {scheduledAt ? (
                            scheduledAt.toLocaleDateString()
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          selected={scheduledAt}
                          onSelect={setScheduledAt}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag"
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleAddTag}
                    disabled={isLoading || !newTag}
                  >
                    Add
                  </Button>
                </div>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 text-muted-foreground hover:text-foreground"
                          disabled={isLoading}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="sections" className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Report Sections</h3>
                <Button
                  type="button"
                  onClick={handleAddSection}
                  disabled={isLoading}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Section
                </Button>
              </div>

              {sections.length === 0 ? (
                <div className="text-center p-8 border rounded-md bg-muted/10">
                  <p className="text-muted-foreground">No sections added yet.</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={handleAddSection}
                    disabled={isLoading}
                  >
                    Add your first section
                  </Button>
                </div>
              ) : (
                <Accordion type="multiple" className="w-full">
                  {sections.map((section, index) => (
                    <AccordionItem key={section.id} value={section.id || `section-${index}`}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2">
                          <Menu className="h-4 w-4 text-muted-foreground" />
                          <span>{section.title || `Section ${index + 1}`}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 p-2">
                          <div className="space-y-2">
                            <Label htmlFor={`section-title-${index}`}>Title</Label>
                            <Input
                              id={`section-title-${index}`}
                              value={section.title || ''}
                              onChange={(e) => handleUpdateSection(index, 'title', e.target.value)}
                              placeholder="Enter section title"
                              disabled={isLoading}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`section-description-${index}`}>Description (optional)</Label>
                            <Textarea
                              id={`section-description-${index}`}
                              value={section.description || ''}
                              onChange={(e) => handleUpdateSection(index, 'description', e.target.value)}
                              placeholder="Enter section description"
                              disabled={isLoading}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`section-visualization-${index}`}>Visualization (optional)</Label>
                            <Select
                              value={section.visualizationId || ''}
                              onValueChange={(value) => handleUpdateSection(index, 'visualizationId', value || undefined)}
                              disabled={isLoading}
                            >
                              <SelectTrigger id={`section-visualization-${index}`}>
                                <SelectValue placeholder="Select a visualization" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">None</SelectItem>
                                {availableVisualizations.map((viz) => (
                                  <SelectItem key={viz.id} value={viz.id}>
                                    {viz.title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`section-content-${index}`}>Content (optional)</Label>
                            <Textarea
                              id={`section-content-${index}`}
                              value={section.content || ''}
                              onChange={(e) => handleUpdateSection(index, 'content', e.target.value)}
                              placeholder="Enter section content (HTML supported)"
                              disabled={isLoading}
                              rows={5}
                            />
                            <p className="text-xs text-muted-foreground">
                              Note: In a real implementation, this would be a rich text editor.
                            </p>
                          </div>

                          <div className="flex justify-between pt-2">
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleMoveUp(index)}
                                disabled={isLoading || index === 0}
                              >
                                <ArrowUp className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleMoveDown(index)}
                                disabled={isLoading || index === sections.length - 1}
                              >
                                <ArrowDown className="h-4 w-4" />
                              </Button>
                            </div>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemoveSection(section.id || '')}
                              disabled={isLoading}
                            >
                              <Trash className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !title}
          >
            {isLoading ? 'Saving...' : 'Save Report'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
