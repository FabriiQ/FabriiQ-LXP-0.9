'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { BloomsTaxonomyLevel } from '@/features/bloom';
import { useToast } from '@/components/ui/use-toast';

interface RubricIntegrationProps {
  initialRubricId?: string;
  bloomsLevels?: BloomsTaxonomyLevel[];
  onSelectRubric: (rubricId: string) => void;
  onCreateRubric: (rubricData: any) => Promise<string>;
  className?: string;
}

/**
 * Component for integrating rubric selection and creation into the assessment workflow
 */
export function RubricIntegration({
  initialRubricId,
  bloomsLevels = [],
  onSelectRubric,
  onCreateRubric,
  className = '',
}: RubricIntegrationProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>(initialRubricId ? 'preview' : 'select');
  const [selectedRubricId, setSelectedRubricId] = useState<string | null>(initialRubricId || null);
  const [isCreatingRubric, setIsCreatingRubric] = useState(false);
  const [newRubricData, setNewRubricData] = useState<any>(null);

  // Handle rubric selection
  const handleRubricSelect = (rubricId: string) => {
    setSelectedRubricId(rubricId);
    setActiveTab('preview');
  };

  // Handle rubric creation
  const handleRubricCreate = async () => {
    if (!newRubricData) return;

    try {
      setIsCreatingRubric(true);
      const rubricId = await onCreateRubric(newRubricData);
      setSelectedRubricId(rubricId);
      setActiveTab('preview');

      toast({
        title: 'Rubric Created',
        description: 'The rubric has been successfully created and linked to this assessment.',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Error Creating Rubric',
        description: 'There was an error creating the rubric. Please try again.',
        variant: 'error',
      });
      console.error('Error creating rubric:', error);
    } finally {
      setIsCreatingRubric(false);
    }
  };

  // Handle rubric confirmation
  const handleConfirmRubric = () => {
    if (selectedRubricId) {
      onSelectRubric(selectedRubricId);

      toast({
        title: 'Rubric Selected',
        description: 'The rubric has been successfully linked to this assessment.',
        variant: 'success',
      });
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Assessment Rubric</CardTitle>
        <CardDescription>
          Select an existing rubric or create a new one for this assessment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="select">Select Existing</TabsTrigger>
            <TabsTrigger value="create">Create New</TabsTrigger>
            {selectedRubricId && (
              <TabsTrigger value="preview">Preview Selected</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="select" className="space-y-4">
            {/* Mock implementation - in a real app, fetch templates from API */}
            {/* Mock implementation with any type to bypass type checking */}
            <div className="p-4 border rounded-md bg-gray-50">
              <p className="text-center text-gray-500">
                Select a rubric template from the list
              </p>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className="p-4 border rounded-md bg-white cursor-pointer hover:shadow-md"
                  onClick={() => handleRubricSelect('1')}
                >
                  <h3 className="font-medium">General Assessment Rubric</h3>
                  <p className="text-sm text-gray-500">A general rubric for assessments</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            {/* Mock implementation of RubricBuilder */}
            <div className="p-4 border rounded-md">
              <h3 className="font-medium mb-4">Create New Rubric</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-md"
                    placeholder="Enter rubric title"
                    onChange={(e) => setNewRubricData({ title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    className="w-full p-2 border rounded-md"
                    placeholder="Enter rubric description"
                    rows={3}
                    onChange={(e) => setNewRubricData((prev: any) => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleRubricCreate}
                disabled={isCreatingRubric || !newRubricData}
              >
                {isCreatingRubric ? 'Creating...' : 'Create Rubric'}
              </Button>
            </div>
          </TabsContent>

          {selectedRubricId && (
            <TabsContent value="preview" className="space-y-4">
              {/* Mock implementation of RubricPreview */}
              <div className="p-4 border rounded-md">
                <h3 className="font-medium mb-2">Selected Rubric Preview</h3>
                <p className="text-sm text-gray-500">Rubric ID: {selectedRubricId}</p>

                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <p className="text-center text-gray-500">Rubric content would be displayed here</p>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => setActiveTab('select')}>
          Back to Selection
        </Button>

        <Button
          onClick={handleConfirmRubric}
          disabled={!selectedRubricId}
        >
          Confirm Rubric Selection
        </Button>
      </CardFooter>
    </Card>
  );
}
