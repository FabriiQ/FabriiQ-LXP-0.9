'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Assuming this exists
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Assuming this exists

import { EssayActivity, createDefaultEssayActivity } from '../../models/essay';
import { EssayEditor } from '../../../question-bank/components/editor/EssayEditor';
import { EssayContent, EssayRubric } from '../../../question-bank/models/types';

interface EssayActivityCreatorProps {
  activity?: EssayActivity; // Existing activity data if editing
  onSave: (activity: EssayActivity) => void;
  onCancel: () => void;
}

export const EssayActivityCreator: React.FC<EssayActivityCreatorProps> = ({ activity, onSave, onCancel }) => {
  const [currentActivity, setCurrentActivity] = useState<EssayActivity>(
    activity || createDefaultEssayActivity()
  );

  // Handle changes from the adapted EssayEditor
  const handleEssayContentChange = (essayContent: EssayContent) => {
    setCurrentActivity(prevActivity => ({
      ...prevActivity,
      prompt: essayContent.text, // Map EssayContent.text to EssayActivity.prompt
      wordCountMin: essayContent.wordCountMin,
      wordCountMax: essayContent.wordCountMax,
      rubric: essayContent.rubric,
      // Ensure other EssayActivity specific fields are preserved or updated as needed
      // For example, metadata or instructions if they are edited separately.
    }));
  };

  // Handler for activity title change (if not part of EssayEditor)
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentActivity(prev => ({ ...prev, title: e.target.value }));
  };

  // Handler for activity description change (if not part of EssayEditor)
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentActivity(prev => ({ ...prev, description: e.target.value }));
  };

  // Handler for activity instructions change (if not part of EssayEditor)
  const handleInstructionsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentActivity(prev => ({ ...prev, instructions: e.target.value }));
  };

  const handleSaveClick = () => {
    onSave(currentActivity);
  };

  // Initial mapping from activity to essayContent for the EssayEditor
  // This is important if an existing activity is being edited.
  const initialEssayEditorContent: EssayContent = {
    text: currentActivity.prompt,
    wordCountMin: currentActivity.wordCountMin,
    wordCountMax: currentActivity.wordCountMax,
    rubric: currentActivity.rubric,
    // Map other relevant fields if EssayEditor expects them (e.g., explanation, hint, media)
    // For now, we assume these are part of the prompt or handled by EssayEditor's defaults.
    explanation: currentActivity.metadata?.learningObjectives?.join('\n') || '', // Example mapping
    hint: '', // Example
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{activity ? 'Edit Essay Activity' : 'Create New Essay Activity'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="activityTitle">Activity Title</Label>
            <Input
              id="activityTitle"
              value={currentActivity.title}
              onChange={handleTitleChange}
              placeholder="Enter activity title"
            />
          </div>
          <div>
            <Label htmlFor="activityDescription">Activity Description</Label>
            <Textarea // Assuming Textarea component exists, like Input
              id="activityDescription"
              value={currentActivity.description || ''}
              onChange={handleDescriptionChange}
              placeholder="Enter activity description"
            />
          </div>
          <div>
            <Label htmlFor="activityInstructions">Activity Instructions</Label>
            <Textarea // Assuming Textarea component exists
              id="activityInstructions"
              value={currentActivity.instructions || ''}
              onChange={handleInstructionsChange}
              placeholder="Enter activity instructions for the student"
            />
          </div>
        </CardContent>
      </Card>

      {/* Use the existing EssayEditor for prompt, rubric, word counts etc. */}
      <EssayEditor
        content={initialEssayEditorContent}
        onChange={handleEssayContentChange}
      />

      {/* Add other activity-specific settings fields here if necessary */}
      {/* For example, settings from BaseActivity.metadata like difficulty, estimatedTime etc. */}
       <Card>
           <CardHeader><CardTitle>Activity Settings</CardTitle></CardHeader>
           <CardContent className="space-y-4">
               <div>
                   <Label htmlFor="difficulty">Difficulty</Label>
                   <Select // Assuming a Select component
                       value={currentActivity.metadata?.difficulty || 'medium'}
                       onValueChange={(value) => setCurrentActivity(prev => ({
                           ...prev,
                           metadata: { ...prev.metadata, difficulty: value as 'easy' | 'medium' | 'hard' }
                       }))}
                   >
                       <SelectTrigger><SelectValue placeholder="Select difficulty" /></SelectTrigger>
                       <SelectContent>
                           <SelectItem value="easy">Easy</SelectItem>
                           <SelectItem value="medium">Medium</SelectItem>
                           <SelectItem value="hard">Hard</SelectItem>
                       </SelectContent>
                   </Select>
               </div>
               <div>
                   <Label htmlFor="estimatedTime">Estimated Time (minutes)</Label>
                   <Input
                       id="estimatedTime"
                       type="number"
                       value={currentActivity.metadata?.estimatedTime || 60}
                       onChange={(e) => setCurrentActivity(prev => ({
                           ...prev,
                           metadata: { ...prev.metadata, estimatedTime: parseInt(e.target.value) }
                       }))}
                   />
               </div>
           </CardContent>
       </Card>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSaveClick}>Save Activity</Button>
      </div>
    </div>
  );
};
