'use client';

/**
 * ContentStudioContext
 *
 * This context provides shared state and functions for the Content Studio.
 * It handles subject, topic, and learning objective selection, as well as
 * content type and creation method selection.
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ActivityPurpose } from '@/server/api/constants';
import { ContentType, CreationMethod } from '../components/ContentCreationFlow';

// Define the context interface
interface ContentStudioContextType {
  // Content selection
  contentType: ContentType | null;
  setContentType: (type: ContentType | null) => void;

  // Creation method
  creationMethod: CreationMethod | null;
  setCreationMethod: (method: CreationMethod | null) => void;

  // Subject selection
  subjectId: string;
  setSubjectId: (id: string) => void;

  // Topic selection
  selectedTopicIds: string[];
  addTopicId: (id: string) => void;
  removeTopicId: (id: string) => void;
  clearTopicIds: () => void;

  // Learning objectives
  selectedLearningObjectiveIds: string[];
  addLearningObjectiveId: (id: string) => void;
  removeLearningObjectiveId: (id: string) => void;
  clearLearningObjectiveIds: () => void;

  // Activity type
  activityType: string | null;
  setActivityType: (type: string | null) => void;

  // Activity purpose
  activityPurpose: ActivityPurpose | null;
  setActivityPurpose: (purpose: ActivityPurpose | null) => void;

  // Class ID
  classId: string | null;
  setClassId: (id: string | null) => void;

  // Reset all state
  resetState: () => void;
}

// Create the context
const ContentStudioContext = createContext<ContentStudioContextType | null>(null);

// Initial state interface
export interface ContentStudioInitialState {
  contentType?: string | ContentType;
  creationMethod?: CreationMethod;
  subjectId?: string;
  topicIds?: string[];
  learningObjectiveIds?: string[];
  activityType?: string;
  activityPurpose?: ActivityPurpose;
  classId?: string;
  initialContent?: any;
  onSaveContent?: (content: any) => void;
  onBack?: () => void;
}

// Provider props
interface ContentStudioProviderProps {
  children: ReactNode;
  initialState?: ContentStudioInitialState;
}

// Provider component
export function ContentStudioProvider({ children, initialState }: ContentStudioProviderProps) {
  // Content selection
  const [contentType, setContentType] = useState<ContentType | null>(
    initialState?.contentType ? initialState.contentType as ContentType : null
  );

  // Creation method
  const [creationMethod, setCreationMethod] = useState<CreationMethod | null>(
    initialState?.creationMethod || null
  );

  // Subject selection
  const [subjectId, setSubjectId] = useState<string>(
    initialState?.subjectId || ''
  );

  // Topic selection
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>(
    initialState?.topicIds || []
  );

  // Learning objectives
  const [selectedLearningObjectiveIds, setSelectedLearningObjectiveIds] = useState<string[]>(
    initialState?.learningObjectiveIds || []
  );

  // Activity type
  const [activityType, setActivityType] = useState<string | null>(
    initialState?.activityType || null
  );

  // Activity purpose
  const [activityPurpose, setActivityPurpose] = useState<ActivityPurpose | null>(
    initialState?.activityPurpose || null
  );

  // Class ID
  const [classId, setClassId] = useState<string | null>(
    initialState?.classId || null
  );

  // Topic selection functions
  const addTopicId = useCallback((id: string) => {
    setSelectedTopicIds(prev => {
      if (prev.includes(id)) {
        return prev;
      }
      return [...prev, id];
    });
  }, []);

  const removeTopicId = useCallback((id: string) => {
    setSelectedTopicIds(prev => prev.filter(topicId => topicId !== id));
  }, []);

  const clearTopicIds = useCallback(() => {
    setSelectedTopicIds([]);
  }, []);

  // Learning objective selection functions
  const addLearningObjectiveId = useCallback((id: string) => {
    setSelectedLearningObjectiveIds(prev => {
      if (prev.includes(id)) {
        return prev;
      }
      return [...prev, id];
    });
  }, []);

  const removeLearningObjectiveId = useCallback((id: string) => {
    setSelectedLearningObjectiveIds(prev => prev.filter(objectiveId => objectiveId !== id));
  }, []);

  const clearLearningObjectiveIds = useCallback(() => {
    setSelectedLearningObjectiveIds([]);
  }, []);

  // Reset all state
  const resetState = useCallback(() => {
    setContentType(null);
    setCreationMethod(null);
    setSubjectId('');
    setSelectedTopicIds([]);
    setSelectedLearningObjectiveIds([]);
    setActivityType(null);
    setActivityPurpose(null);
    setClassId(null);
  }, []);

  // Create the context value
  const contextValue: ContentStudioContextType = {
    contentType,
    setContentType,
    creationMethod,
    setCreationMethod,
    subjectId,
    setSubjectId,
    selectedTopicIds,
    addTopicId,
    removeTopicId,
    clearTopicIds,
    selectedLearningObjectiveIds,
    addLearningObjectiveId,
    removeLearningObjectiveId,
    clearLearningObjectiveIds,
    activityType,
    setActivityType,
    activityPurpose,
    setActivityPurpose,
    classId,
    setClassId,
    resetState
  };

  return (
    <ContentStudioContext.Provider value={contextValue}>
      {children}
    </ContentStudioContext.Provider>
  );
}

// Hook for using the context
export function useContentStudio() {
  const context = useContext(ContentStudioContext);

  if (!context) {
    throw new Error('useContentStudio must be used within a ContentStudioProvider');
  }

  return context;
}
