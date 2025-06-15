'use client';

/**
 * ResourceLinker
 *
 * A reusable component for linking resources to content.
 * Allows searching for existing resources and adding new ones.
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Search,
  Link2,
  FileText,
  FileVideo,
  FileImage,
  FileAudio,
  Trash2,
  ExternalLink,
  Check,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { api } from '@/utils/api';

// Define resource types
export enum ResourceType {
  LINK = 'link',
  DOCUMENT = 'document',
  VIDEO = 'video',
  IMAGE = 'image',
  AUDIO = 'audio',
  OTHER = 'other',
}

// Define resource interface
export interface Resource {
  id: string;
  title: string;
  description?: string;
  type: ResourceType;
  url?: string;
  fileId?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  createdAt?: Date;
  updatedAt?: Date;
  tags?: string[];
}

export interface ResourceLinkerProps {
  selectedResources: Resource[];
  onChange: (resources: Resource[]) => void;
  className?: string;
  maxResources?: number;
  allowedTypes?: ResourceType[];
  showPreview?: boolean;
  showTags?: boolean;
  showDescription?: boolean;
  title?: string;
  description?: string;
}

export function ResourceLinker({
  selectedResources,
  onChange,
  className,
  maxResources = 10,
  allowedTypes,
  showPreview = true,
  showTags = true,
  showDescription = true,
  title = 'Resources',
  description = 'Link resources to your content.',
}: ResourceLinkerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'create'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Resource[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSearchResults, setSelectedSearchResults] = useState<string[]>([]);

  // New resource form state
  const [newResource, setNewResource] = useState<Partial<Resource>>({
    title: '',
    description: '',
    type: ResourceType.LINK,
    url: '',
    tags: [],
  });
  const [newTag, setNewTag] = useState('');

  // Mock API call for searching resources
  const searchResources = async (query: string) => {
    setIsSearching(true);

    // Simulate API call
    setTimeout(() => {
      // Mock results
      const results: Resource[] = [
        {
          id: 'resource-1',
          title: 'Introduction to Algebra',
          description: 'A comprehensive guide to basic algebra concepts.',
          type: ResourceType.DOCUMENT,
          url: 'https://example.com/algebra-intro.pdf',
          fileId: 'file-1',
          fileName: 'algebra-intro.pdf',
          fileSize: 1024 * 1024 * 2, // 2MB
          fileType: 'application/pdf',
          tags: ['algebra', 'mathematics', 'introduction'],
        },
        {
          id: 'resource-2',
          title: 'Solving Equations Video Tutorial',
          description: 'Step-by-step video tutorial on solving linear equations.',
          type: ResourceType.VIDEO,
          url: 'https://example.com/solving-equations.mp4',
          tags: ['equations', 'tutorial', 'video'],
        },
        {
          id: 'resource-3',
          title: 'Math Worksheets Collection',
          description: 'A collection of printable math worksheets for various topics.',
          type: ResourceType.LINK,
          url: 'https://example.com/math-worksheets',
          tags: ['worksheets', 'practice', 'printable'],
        },
      ].filter(resource =>
        resource.title.toLowerCase().includes(query.toLowerCase()) ||
        (resource.description && resource.description.toLowerCase().includes(query.toLowerCase())) ||
        (resource.tags && resource.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())))
      );

      setSearchResults(results);
      setIsSearching(false);
    }, 500);
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchResources(searchQuery);
    }
  };

  // Handle search result selection
  const toggleSearchResult = (resourceId: string) => {
    setSelectedSearchResults(prev =>
      prev.includes(resourceId)
        ? prev.filter(id => id !== resourceId)
        : [...prev, resourceId]
    );
  };

  // Handle adding selected search results
  const addSelectedResources = () => {
    const resourcesToAdd = searchResults.filter(resource =>
      selectedSearchResults.includes(resource.id) &&
      !selectedResources.some(r => r.id === resource.id)
    );

    onChange([...selectedResources, ...resourcesToAdd]);
    setSelectedSearchResults([]);
    setIsDialogOpen(false);
  };

  // Handle new resource form change
  const handleNewResourceChange = (field: keyof Resource, value: any) => {
    setNewResource(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle adding a tag to new resource
  const handleAddTag = () => {
    if (newTag.trim() && newResource.tags && !newResource.tags.includes(newTag.trim())) {
      setNewResource(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()],
      }));
      setNewTag('');
    }
  };

  // Handle removing a tag from new resource
  const handleRemoveTag = (tag: string) => {
    setNewResource(prev => ({
      ...prev,
      tags: (prev.tags || []).filter(t => t !== tag),
    }));
  };

  // Handle creating a new resource
  const handleCreateResource = () => {
    if (!newResource.title || !newResource.type) return;

    // Create a new resource with a unique ID
    const resource: Resource = {
      id: `resource-${Date.now()}`,
      title: newResource.title,
      description: newResource.description,
      type: newResource.type as ResourceType,
      url: newResource.url,
      tags: newResource.tags,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    onChange([...selectedResources, resource]);

    // Reset form
    setNewResource({
      title: '',
      description: '',
      type: ResourceType.LINK,
      url: '',
      tags: [],
    });

    setIsDialogOpen(false);
  };

  // Handle removing a resource
  const handleRemoveResource = (resourceId: string) => {
    onChange(selectedResources.filter(resource => resource.id !== resourceId));
  };

  // Get icon for resource type
  const getResourceTypeIcon = (type: ResourceType) => {
    switch (type) {
      case ResourceType.LINK:
        return <Link2 className="h-4 w-4" />;
      case ResourceType.DOCUMENT:
        return <FileText className="h-4 w-4" />;
      case ResourceType.VIDEO:
        return <FileVideo className="h-4 w-4" />;
      case ResourceType.IMAGE:
        return <FileImage className="h-4 w-4" />;
      case ResourceType.AUDIO:
        return <FileAudio className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Get label for resource type
  const getResourceTypeLabel = (type: ResourceType) => {
    switch (type) {
      case ResourceType.LINK:
        return 'Link';
      case ResourceType.DOCUMENT:
        return 'Document';
      case ResourceType.VIDEO:
        return 'Video';
      case ResourceType.IMAGE:
        return 'Image';
      case ResourceType.AUDIO:
        return 'Audio';
      default:
        return 'Other';
    }
  };

  // Format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';

    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              disabled={selectedResources.length >= maxResources}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Resource
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add Resources</DialogTitle>
              <DialogDescription>
                Search for existing resources or create a new one.
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="search" onValueChange={(value) => setActiveTab(value as 'search' | 'create')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="search">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </TabsTrigger>
                <TabsTrigger value="create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New
                </TabsTrigger>
              </TabsList>

              <TabsContent value="search" className="space-y-4 mt-4">
                <form onSubmit={handleSearch}>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Search resources..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                    />
                    <Button type="submit" disabled={!searchQuery.trim() || isSearching}>
                      {isSearching ? 'Searching...' : 'Search'}
                    </Button>
                  </div>
                </form>

                <ScrollArea className="h-[300px] border rounded-md">
                  {searchResults.length > 0 ? (
                    <div className="p-4 space-y-3">
                      {searchResults.map(resource => (
                        <div
                          key={resource.id}
                          className={cn(
                            "flex items-start p-3 border rounded-md",
                            selectedSearchResults.includes(resource.id) && "border-primary bg-primary/5"
                          )}
                        >
                          <Checkbox
                            id={`resource-${resource.id}`}
                            checked={selectedSearchResults.includes(resource.id)}
                            onCheckedChange={() => toggleSearchResult(resource.id)}
                            className="mr-3 mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center">
                              <div className="mr-2">
                                {getResourceTypeIcon(resource.type)}
                              </div>
                              <Label
                                htmlFor={`resource-${resource.id}`}
                                className="font-medium cursor-pointer"
                              >
                                {resource.title}
                              </Label>
                            </div>

                            {resource.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {resource.description}
                              </p>
                            )}

                            <div className="flex flex-wrap gap-1 mt-2">
                              {resource.tags && resource.tags.map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      {isSearching ? (
                        <p>Searching...</p>
                      ) : searchQuery ? (
                        <p>No resources found. Try a different search term or create a new resource.</p>
                      ) : (
                        <p>Enter a search term to find resources.</p>
                      )}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="create" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="resource-title">Title</Label>
                    <Input
                      id="resource-title"
                      value={newResource.title}
                      onChange={(e) => handleNewResourceChange('title', e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="resource-type">Type</Label>
                    <Select
                      value={newResource.type as string}
                      onValueChange={(value) => handleNewResourceChange('type', value)}
                    >
                      <SelectTrigger id="resource-type" className="mt-1">
                        <SelectValue placeholder="Select resource type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ResourceType.LINK}>Link</SelectItem>
                        <SelectItem value={ResourceType.DOCUMENT}>Document</SelectItem>
                        <SelectItem value={ResourceType.VIDEO}>Video</SelectItem>
                        <SelectItem value={ResourceType.IMAGE}>Image</SelectItem>
                        <SelectItem value={ResourceType.AUDIO}>Audio</SelectItem>
                        <SelectItem value={ResourceType.OTHER}>Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="resource-description">Description (Optional)</Label>
                  <Textarea
                    id="resource-description"
                    value={newResource.description || ''}
                    onChange={(e) => handleNewResourceChange('description', e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="resource-url">URL</Label>
                  <Input
                    id="resource-url"
                    value={newResource.url || ''}
                    onChange={(e) => handleNewResourceChange('url', e.target.value)}
                    className="mt-1"
                    placeholder="https://"
                  />
                </div>

                <div>
                  <Label>Tags (Optional)</Label>
                  <div className="flex space-x-2 mt-1">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add a tag"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddTag}
                      disabled={!newTag.trim()}
                    >
                      Add
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-1 mt-2">
                    {newResource.tags && newResource.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>

              {activeTab === 'search' ? (
                <Button
                  onClick={addSelectedResources}
                  disabled={selectedSearchResults.length === 0}
                >
                  Add Selected ({selectedSearchResults.length})
                </Button>
              ) : (
                <Button
                  onClick={handleCreateResource}
                  disabled={!newResource.title || !newResource.type}
                >
                  Create Resource
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {selectedResources.length > 0 ? (
          selectedResources.map(resource => (
            <Card key={resource.id}>
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <div className="mr-2">
                      {getResourceTypeIcon(resource.type)}
                    </div>
                    <CardTitle className="text-base font-medium">
                      {resource.title}
                    </CardTitle>
                  </div>

                  <div className="flex items-center space-x-1">
                    {resource.url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        asChild
                      >
                        <a href={resource.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                          <span className="sr-only">Open link</span>
                        </a>
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleRemoveResource(resource.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </div>
                </div>

                <div className="flex items-center mt-1 text-xs text-muted-foreground">
                  <span className="mr-2">
                    {getResourceTypeLabel(resource.type)}
                  </span>

                  {resource.fileSize && (
                    <span className="mr-2">
                      {formatFileSize(resource.fileSize)}
                    </span>
                  )}

                  {resource.createdAt && (
                    <span>
                      Added {new Date(resource.createdAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </CardHeader>

              {(showDescription && resource.description) && (
                <CardContent className="p-4 pt-0">
                  <p className="text-sm text-muted-foreground">
                    {resource.description}
                  </p>
                </CardContent>
              )}

              {(showTags && resource.tags && resource.tags.length > 0) && (
                <CardFooter className="p-4 pt-0">
                  <div className="flex flex-wrap gap-1">
                    {resource.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardFooter>
              )}
            </Card>
          ))
        ) : (
          <div className="text-center p-8 border border-dashed rounded-md text-muted-foreground">
            No resources added yet. Click "Add Resource" to get started.
          </div>
        )}
      </div>

      {selectedResources.length >= maxResources && (
        <p className="text-sm text-amber-600">
          Maximum number of resources reached ({maxResources}).
        </p>
      )}
    </div>
  );
}
