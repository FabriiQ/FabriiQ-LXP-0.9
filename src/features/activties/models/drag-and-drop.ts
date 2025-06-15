'use client';

/**
 * Drag and Drop Activity Models
 *
 * This file contains the data models for drag and drop activities.
 * These models are designed to be:
 * 1. AI-native - Easy for AI to generate
 * 2. Simple - Minimal complexity
 * 3. Consistent - Follow the same patterns as other activity types
 * 4. Extensible - Easy to add new features
 */

import { BaseActivity, ActivitySettings, generateId } from './base';

/**
 * Drag and Drop Item Interface
 * Represents a draggable item in a drag and drop activity
 */
export interface DragAndDropItem {
  id: string;
  text: string;
  correctZoneId: string;
  feedback?: string;
  media?: {
    type: 'image' | 'video' | 'audio';
    url: string;
    alt?: string;
    caption?: string;
  };
}

/**
 * Drop Zone Interface
 * Represents a drop zone in a drag and drop activity
 */
export interface DropZone {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  backgroundColor?: string;
  borderColor?: string;
}

/**
 * Drag and Drop Question Interface
 * Represents a single question in a drag and drop activity
 */
export interface DragAndDropQuestion {
  id: string;
  text: string;
  items: DragAndDropItem[];
  zones: DropZone[];
  backgroundImage?: string;
  explanation?: string;
  hint?: string;
  points?: number;
}

/**
 * Drag and Drop Activity Interface
 * Represents a complete drag and drop activity
 */
export interface DragAndDropActivity extends BaseActivity {
  activityType: 'drag-and-drop';
  questions: DragAndDropQuestion[];
  settings?: ActivitySettings & {
    snapToGrid?: boolean;
    showItemsInColumn?: boolean;
    allowMultipleItemsPerZone?: boolean;
  };
}

/**
 * Create a default drag and drop activity
 * Used for initializing new activities
 */
export function createDefaultDragAndDropActivity(): DragAndDropActivity {
  return {
    id: generateId(),
    title: 'New Drag and Drop Activity',
    description: 'A drag and drop activity with sample items and zones',
    instructions: 'Drag the items to their correct zones.',
    activityType: 'drag-and-drop',
    questions: [createDefaultDragAndDropQuestion()],
    settings: {
      shuffleQuestions: false,
      showFeedbackImmediately: true,
      showCorrectAnswers: true,
      passingPercentage: 60,
      attemptsAllowed: 1,
      snapToGrid: true,
      showItemsInColumn: true,
      allowMultipleItemsPerZone: false
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Create a default drag and drop question
 * Used for adding new questions to an activity
 */
export function createDefaultDragAndDropQuestion(): DragAndDropQuestion {
  const zoneIds = [generateId(), generateId(), generateId()];
  
  return {
    id: generateId(),
    text: 'Drag the items to their correct categories',
    items: [
      {
        id: generateId(),
        text: 'Item 1',
        correctZoneId: zoneIds[0],
        feedback: 'Correct! This item belongs to Zone 1.'
      },
      {
        id: generateId(),
        text: 'Item 2',
        correctZoneId: zoneIds[1],
        feedback: 'Correct! This item belongs to Zone 2.'
      },
      {
        id: generateId(),
        text: 'Item 3',
        correctZoneId: zoneIds[2],
        feedback: 'Correct! This item belongs to Zone 3.'
      }
    ],
    zones: [
      {
        id: zoneIds[0],
        text: 'Zone 1',
        x: 50,
        y: 100,
        width: 200,
        height: 150,
        backgroundColor: 'rgba(200, 230, 255, 0.5)',
        borderColor: '#0066cc'
      },
      {
        id: zoneIds[1],
        text: 'Zone 2',
        x: 300,
        y: 100,
        width: 200,
        height: 150,
        backgroundColor: 'rgba(255, 230, 200, 0.5)',
        borderColor: '#cc6600'
      },
      {
        id: zoneIds[2],
        text: 'Zone 3',
        x: 550,
        y: 100,
        width: 200,
        height: 150,
        backgroundColor: 'rgba(230, 255, 200, 0.5)',
        borderColor: '#66cc00'
      }
    ],
    explanation: 'This question tests your ability to categorize items correctly.',
    hint: 'Think about the characteristics of each item and which category it best fits into.',
    points: 3
  };
}
