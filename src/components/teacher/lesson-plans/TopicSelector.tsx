'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/trpc/react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TopicSelectorProps {
  subjectId: string;
  selectedTopics: string[];
  customTopics: string[];
  onTopicsChange: (selectedTopicIds: string[], customTopics: string[]) => void;
}

export function TopicSelector({
  subjectId,
  selectedTopics,
  customTopics,
  onTopicsChange,
}: TopicSelectorProps) {
  const [newCustomTopic, setNewCustomTopic] = useState('');
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>(selectedTopics || []);
  const [customTopicsList, setCustomTopicsList] = useState<string[]>(customTopics || []);

  // Fetch subject topics
  const { data: topics, isLoading } = api.lessonPlan.getSubjectTopics.useQuery(
    { subjectId },
    { enabled: !!subjectId }
  );

  // Initialize from props only once
  useEffect(() => {
    if (selectedTopics) setSelectedTopicIds(selectedTopics);
    if (customTopics) setCustomTopicsList(customTopics);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update when props change - with proper dependency array
  useEffect(() => {
    if (selectedTopics && JSON.stringify(selectedTopics) !== JSON.stringify(selectedTopicIds)) {
      setSelectedTopicIds(selectedTopics);
    }

    if (customTopics && JSON.stringify(customTopics) !== JSON.stringify(customTopicsList)) {
      setCustomTopicsList(customTopics);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTopics, customTopics, JSON.stringify(selectedTopicIds), JSON.stringify(customTopicsList)]);

  // Create a ref outside of useEffect
  const initialRenderRef = React.useRef(true);

  // Update parent component when local state changes
  useEffect(() => {
    if (initialRenderRef.current) {
      initialRenderRef.current = false;
      return;
    }

    onTopicsChange(selectedTopicIds, customTopicsList);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(selectedTopicIds), JSON.stringify(customTopicsList)]);

  // Handle topic selection
  const handleTopicChange = (topicId: string, checked: boolean) => {
    if (checked) {
      setSelectedTopicIds((prev) => [...prev, topicId]);
    } else {
      setSelectedTopicIds((prev) => prev.filter((id) => id !== topicId));
    }
  };

  // Add custom topic
  const handleAddCustomTopic = () => {
    if (newCustomTopic.trim()) {
      setCustomTopicsList((prev) => [...prev, newCustomTopic.trim()]);
      setNewCustomTopic('');
    }
  };

  // Remove custom topic
  const handleRemoveCustomTopic = (index: number) => {
    setCustomTopicsList((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Select from Subject Topics</h3>
        {!subjectId ? (
          <div className="flex flex-col items-center justify-center p-6 border rounded-md bg-muted/20">
            <p className="text-sm text-muted-foreground text-center">
              Please select a subject first to see available topics.
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 border rounded-md">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Loading topics...</p>
          </div>
        ) : !topics || topics.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 border rounded-md bg-muted/20">
            <p className="text-sm text-muted-foreground text-center">
              No topics available for this subject. You can add custom topics below.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-48 sm:h-60 border rounded-md p-2">
            <div className="space-y-2">
              {topics.map((topic) => (
                <div key={topic.id} className="flex items-start space-x-2 py-1">
                  <Checkbox
                    id={`topic-${topic.id}`}
                    checked={selectedTopicIds.includes(topic.id)}
                    onCheckedChange={(checked) => handleTopicChange(topic.id, !!checked)}
                  />
                  <Label
                    htmlFor={`topic-${topic.id}`}
                    className="text-sm font-normal leading-tight cursor-pointer"
                  >
                    {topic.title}
                  </Label>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">Add Custom Topics</h3>
        <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
          <Input
            placeholder="Enter custom topic"
            value={newCustomTopic}
            onChange={(e) => setNewCustomTopic(e.target.value)}
            className="flex-1"
          />
          <Button
            type="button"
            size="sm"
            onClick={handleAddCustomTopic}
            disabled={!newCustomTopic.trim()}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>

        {customTopicsList.length > 0 && (
          <div className="mt-2 space-y-2">
            {customTopicsList.map((topic, index) => (
              <div key={index} className="flex items-center justify-between bg-muted p-2 rounded-md">
                <span className="text-sm">{topic}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveCustomTopic(index)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
