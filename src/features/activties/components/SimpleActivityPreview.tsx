'use client';

import React, { useState, useEffect } from 'react';
import { MultipleChoiceActivity, createDefaultMultipleChoiceActivity } from '../models/multiple-choice';
import { TrueFalseActivity, createDefaultTrueFalseActivity } from '../models/true-false';
import { MultipleResponseActivity, createDefaultMultipleResponseActivity } from '../models/multiple-response';
import { FillInTheBlanksActivity, createDefaultFillInTheBlanksActivity } from '../models/fill-in-the-blanks';
import { MatchingActivity, createDefaultMatchingActivity } from '../models/matching';
import { SequenceActivity, createDefaultSequenceActivity } from '../models/sequence';
import { MultipleChoiceViewer } from './multiple-choice/MultipleChoiceViewer';
import { MultipleChoiceEditor } from './multiple-choice/MultipleChoiceEditor';
import { TrueFalseViewer } from './true-false/TrueFalseViewer';
import { TrueFalseEditor } from './true-false/TrueFalseEditor';
import { MultipleResponseViewer } from './multiple-response/MultipleResponseViewer';
import { MultipleResponseEditor } from './multiple-response/MultipleResponseEditor';
import { FillInTheBlanksViewer } from './fill-in-the-blanks/FillInTheBlanksViewer';
import { FillInTheBlanksEditor } from './fill-in-the-blanks/FillInTheBlanksEditor';
import { MatchingViewer } from './matching/MatchingViewer';
import { MatchingEditor } from './matching/MatchingEditor';
import { SequenceViewer } from './sequence/SequenceViewer';
import { SequenceEditor } from './sequence/SequenceEditor';
import { convertAIContentToActivity } from '../ai-integration/converter';
import { convertAIContentToTrueFalseActivity } from '../ai-integration/true-false-converter';
import { convertAIContentToMultipleResponseActivity } from '../ai-integration/multiple-response-converter';
import { convertAIContentToFillInTheBlanksActivity } from '../ai-integration/fill-in-the-blanks-converter';
import { convertAIContentToMatchingActivity } from '../ai-integration/matching-converter';
import { convertAIContentToSequenceActivity } from '../ai-integration/sequence-converter';
import { AccessibilityTester } from './ui/AccessibilityTester';
// Analytics import removed as it's handled in individual components
import { cn } from '@/lib/utils';

export interface SimpleActivityPreviewProps {
  activityData: any;
  activityType: string;
  onSave?: (activity: any) => void;
  onContentChange?: (content: any) => void;
  isLoading?: boolean;
  previewMode?: 'student' | 'teacher';
  className?: string;
  showAccessibilityTester?: boolean;
  // enableAnalytics prop removed as analytics are handled in individual components
}

/**
 * Simple Activity Preview Component
 *
 * This component provides a unified interface for previewing and editing
 * different types of activities. It handles:
 * - Converting AI-generated content to activity format
 * - Switching between preview and edit modes
 * - Saving changes
 */
export const SimpleActivityPreview: React.FC<SimpleActivityPreviewProps> = ({
  activityData,
  activityType,
  onSave,
  onContentChange,
  isLoading = false,
  previewMode = 'teacher',
  className,
  showAccessibilityTester = false
  // enableAnalytics prop removed as analytics are handled in individual components
}) => {
  // State for active tab
  const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('preview');

  // Convert the activity data to our format
  const [activity, setActivity] = useState<
    MultipleChoiceActivity |
    TrueFalseActivity |
    MultipleResponseActivity |
    FillInTheBlanksActivity |
    MatchingActivity |
    SequenceActivity
  >(createDefaultMultipleChoiceActivity());

  // Analytics initialization is handled in the individual viewer components
  // This allows for more granular tracking of user interactions

  // Update activity when data changes
  useEffect(() => {
    try {
      // Log the incoming data for debugging
      console.log('SimpleActivityPreview: Received activity data:', activityData);
      console.log('SimpleActivityPreview: Activity type:', activityType);

      // Default activity based on type
      let convertedActivity:
        MultipleChoiceActivity |
        TrueFalseActivity |
        MultipleResponseActivity |
        FillInTheBlanksActivity |
        MatchingActivity |
        SequenceActivity;

      // Select the appropriate default activity based on type
      if (activityType === 'true-false') {
        convertedActivity = createDefaultTrueFalseActivity();
      } else if (activityType === 'multiple-response') {
        convertedActivity = createDefaultMultipleResponseActivity();
      } else if (activityType === 'fill-in-the-blanks') {
        convertedActivity = createDefaultFillInTheBlanksActivity();
      } else if (activityType === 'matching') {
        convertedActivity = createDefaultMatchingActivity();
      } else if (activityType === 'sequence') {
        convertedActivity = createDefaultSequenceActivity();
      } else {
        // Default to multiple-choice for any other type
        convertedActivity = createDefaultMultipleChoiceActivity();
      }

      // Then try to convert the data if available
      if (activityData) {
        try {
          if (activityType === 'multiple-choice') {
            const mcActivity = convertAIContentToActivity(activityData);
            // Only use the converted activity if it has questions
            if (mcActivity.questions && mcActivity.questions.length > 0) {
              convertedActivity = mcActivity;
            } else {
              console.warn('Converted multiple-choice activity has no questions, using default');
            }
          } else if (activityType === 'true-false') {
            const tfActivity = convertAIContentToTrueFalseActivity(activityData);
            // Only use the converted activity if it has questions
            if (tfActivity.questions && tfActivity.questions.length > 0) {
              convertedActivity = tfActivity;
            } else {
              console.warn('Converted true/false activity has no questions, using default');
            }
          } else if (activityType === 'multiple-response') {
            const mrActivity = convertAIContentToMultipleResponseActivity(activityData);
            // Only use the converted activity if it has questions
            if (mrActivity.questions && mrActivity.questions.length > 0) {
              convertedActivity = mrActivity;
            } else {
              console.warn('Converted multiple-response activity has no questions, using default');
            }
          } else if (activityType === 'fill-in-the-blanks') {
            const fibActivity = convertAIContentToFillInTheBlanksActivity(activityData);
            // Only use the converted activity if it has questions
            if (fibActivity.questions && fibActivity.questions.length > 0) {
              convertedActivity = fibActivity;
            } else {
              console.warn('Converted fill-in-the-blanks activity has no questions, using default');
            }
          } else if (activityType === 'matching') {
            const matchingActivity = convertAIContentToMatchingActivity(activityData);
            // Only use the converted activity if it has questions
            if (matchingActivity.questions && matchingActivity.questions.length > 0) {
              convertedActivity = matchingActivity;
            } else {
              console.warn('Converted matching activity has no questions, using default');
            }
          } else if (activityType === 'sequence') {
            const sequenceActivity = convertAIContentToSequenceActivity(activityData);
            // Only use the converted activity if it has questions
            if (sequenceActivity.questions && sequenceActivity.questions.length > 0) {
              convertedActivity = sequenceActivity;
            } else {
              console.warn('Converted sequence activity has no questions, using default');
            }
          } else {
            console.warn('Unsupported activity type:', activityType);
          }
        } catch (conversionError) {
          console.error('Error in conversion:', conversionError);
        }
      }

      // Log the final activity we'll use
      console.log('SimpleActivityPreview: Final activity to display:', convertedActivity);
      setActivity(convertedActivity);
    } catch (error) {
      console.error('Error in SimpleActivityPreview:', error);
      // Default to multiple-choice if there's an error
      setActivity(createDefaultMultipleChoiceActivity());
      console.log('SimpleActivityPreview: Using default activity after error');
    }
  }, [activityData, activityType]);

  // Handle content change
  const handleContentChange = (updatedActivity:
    MultipleChoiceActivity |
    TrueFalseActivity |
    MultipleResponseActivity |
    FillInTheBlanksActivity |
    MatchingActivity |
    SequenceActivity
  ) => {
    setActivity(updatedActivity);

    if (onContentChange) {
      // Convert back to the format expected by the parent component
      onContentChange({
        ...updatedActivity,
        activityType: activityType,
        config: {
          ...updatedActivity.settings,
          questions: updatedActivity.questions
        }
      });
    }
  };

  // Handle save
  const handleSave = (savedActivity:
    MultipleChoiceActivity |
    TrueFalseActivity |
    MultipleResponseActivity |
    FillInTheBlanksActivity |
    MatchingActivity |
    SequenceActivity
  ) => {
    if (onSave) {
      // Convert to the format expected by the parent component
      onSave({
        ...savedActivity,
        activityType: activityType,
        config: {
          ...savedActivity.settings,
          questions: savedActivity.questions
        }
      });
    }
  };

  // Render the appropriate activity viewer based on activity type
  const renderActivityViewer = () => {
    // Render the appropriate viewer based on activity type
    if (activity.activityType === 'true-false') {
      return (
        <TrueFalseViewer
          activity={activity as TrueFalseActivity}
          mode={previewMode}
        />
      );
    } else if (activity.activityType === 'multiple-response') {
      return (
        <MultipleResponseViewer
          activity={activity as MultipleResponseActivity}
          mode={previewMode}
        />
      );
    } else if (activity.activityType === 'fill-in-the-blanks') {
      return (
        <FillInTheBlanksViewer
          activity={activity as FillInTheBlanksActivity}
          mode={previewMode}
        />
      );
    } else if (activity.activityType === 'matching') {
      return (
        <MatchingViewer
          activity={activity as MatchingActivity}
          mode={previewMode}
        />
      );
    } else if (activity.activityType === 'sequence') {
      return (
        <SequenceViewer
          activity={activity as SequenceActivity}
          mode={previewMode}
        />
      );
    } else {
      return (
        <MultipleChoiceViewer
          activity={activity as MultipleChoiceActivity}
          mode={previewMode}
        />
      );
    }
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Tabs */}
      <div className="flex border-b border-gray-300 dark:border-gray-700 mb-4">
        <button
          className={cn(
            "px-4 py-2 font-medium",
            activeTab === 'preview'
              ? 'bg-blue-50 dark:bg-blue-900/20 border-b-2 border-blue-500 dark:border-blue-400 text-blue-700 dark:text-blue-300'
              : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
          )}
          onClick={() => setActiveTab('preview')}
        >
          Preview
        </button>
        <button
          className={cn(
            "px-4 py-2 font-medium",
            activeTab === 'edit'
              ? 'bg-blue-50 dark:bg-blue-900/20 border-b-2 border-blue-500 dark:border-blue-400 text-blue-700 dark:text-blue-300'
              : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
          )}
          onClick={() => setActiveTab('edit')}
        >
          Edit
        </button>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        /* Content */
        <div>
          {activeTab === 'preview' ? (
            // Render the appropriate viewer based on activity type with accessibility testing if enabled
            showAccessibilityTester ? (
              <AccessibilityTester autoRun={false}>
                {renderActivityViewer()}
              </AccessibilityTester>
            ) : (
              renderActivityViewer()
            )
          ) : (
            // Render the appropriate editor based on activity type
            activity.activityType === 'true-false' ? (
              <TrueFalseEditor
                activity={activity as TrueFalseActivity}
                onChange={handleContentChange}
                onSave={handleSave}
              />
            ) : activity.activityType === 'multiple-response' ? (
              <MultipleResponseEditor
                activity={activity as MultipleResponseActivity}
                onChange={handleContentChange}
                onSave={handleSave}
              />
            ) : activity.activityType === 'fill-in-the-blanks' ? (
              <FillInTheBlanksEditor
                activity={activity as FillInTheBlanksActivity}
                onChange={handleContentChange}
                onSave={handleSave}
              />
            ) : activity.activityType === 'matching' ? (
              <MatchingEditor
                activity={activity as MatchingActivity}
                onChange={handleContentChange}
                onSave={handleSave}
              />
            ) : activity.activityType === 'sequence' ? (
              <SequenceEditor
                activity={activity as SequenceActivity}
                onChange={handleContentChange}
                onSave={handleSave}
              />
            ) : (
              <MultipleChoiceEditor
                activity={activity as MultipleChoiceActivity}
                onChange={handleContentChange}
                onSave={handleSave}
              />
            )
          )}
        </div>
      )}
    </div>
  );
};

export default SimpleActivityPreview;
