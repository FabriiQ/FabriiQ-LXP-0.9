'use client';

/**
 * Drag and Drop Activity AI Converter
 *
 * This file contains functions for converting AI-generated content to drag and drop activities.
 */

import { DragAndDropActivity, DragAndDropQuestion, DragAndDropItem, DropZone } from '../models/drag-and-drop';
import { generateId } from '../models/base';

/**
 * Convert AI-generated content to a drag and drop activity
 *
 * @param aiContent AI-generated content
 * @returns Drag and drop activity
 */
export function convertAIContentToDragAndDropActivity(aiContent: any): DragAndDropActivity {
  // Start with a default activity
  const activity: DragAndDropActivity = {
    id: aiContent.id || generateId(),
    title: aiContent.title || 'AI Generated Drag and Drop Activity',
    description: aiContent.description || '',
    instructions: aiContent.instructions || 'Drag the items to their correct zones.',
    activityType: 'drag-and-drop',
    questions: [],
    isGradable: aiContent.isGradable ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
    settings: {
      shuffleQuestions: aiContent.shuffleQuestions ?? false,
      showFeedbackImmediately: aiContent.showFeedbackImmediately ?? true,
      showCorrectAnswers: aiContent.showCorrectAnswers ?? true,
      passingPercentage: aiContent.passingPercentage ?? 60,
      attemptsAllowed: aiContent.attemptsAllowed ?? 1,
      snapToGrid: aiContent.snapToGrid ?? true,
      showItemsInColumn: aiContent.showItemsInColumn ?? true,
      allowMultipleItemsPerZone: aiContent.allowMultipleItemsPerZone ?? false
    }
  };

  // Find questions in the AI content (check all possible locations)
  const aiQuestions = aiContent.questions || 
                     aiContent.content?.questions || 
                     aiContent.config?.questions || 
                     [];

  // Convert each question to our format
  activity.questions = aiQuestions.map((q: any) => {
    // Create zones
    const zones: DropZone[] = (q.zones || []).map((z: any, index: number) => ({
      id: z.id || generateId(),
      text: z.text || `Zone ${index + 1}`,
      x: z.x || 50 + index * 250,
      y: z.y || 100,
      width: z.width || 200,
      height: z.height || 150,
      backgroundColor: z.backgroundColor || `rgba(${200 + index * 20}, ${230 - index * 10}, ${255 - index * 20}, 0.5)`,
      borderColor: z.borderColor || `#${(index * 3).toString(16).padStart(2, '0')}66cc`
    }));

    // If no zones were provided, create default ones
    if (zones.length === 0) {
      for (let i = 0; i < 3; i++) {
        zones.push({
          id: generateId(),
          text: `Zone ${i + 1}`,
          x: 50 + i * 250,
          y: 100,
          width: 200,
          height: 150,
          backgroundColor: `rgba(${200 + i * 20}, ${230 - i * 10}, ${255 - i * 20}, 0.5)`,
          borderColor: `#${(i * 3).toString(16).padStart(2, '0')}66cc`
        });
      }
    }

    // Create items
    const items: DragAndDropItem[] = (q.items || []).map((item: any, index: number) => {
      // Determine correct zone
      let correctZoneId = item.correctZoneId || item.correctZone;
      
      // If no correct zone is specified, assign to zones in a round-robin fashion
      if (!correctZoneId && zones.length > 0) {
        correctZoneId = zones[index % zones.length].id;
      }
      
      return {
        id: item.id || generateId(),
        text: item.text || `Item ${index + 1}`,
        correctZoneId: correctZoneId || zones[0]?.id || '',
        feedback: item.feedback || `This item belongs to ${zones.find(z => z.id === correctZoneId)?.text || 'the correct zone'}.`
      };
    });

    // If no items were provided, create default ones
    if (items.length === 0) {
      for (let i = 0; i < zones.length * 2; i++) {
        const zoneIndex = i % zones.length;
        items.push({
          id: generateId(),
          text: `Item ${i + 1}`,
          correctZoneId: zones[zoneIndex].id,
          feedback: `This item belongs to ${zones[zoneIndex].text}.`
        });
      }
    }

    // Create the question
    return {
      id: q.id || generateId(),
      text: q.text || q.question || 'Drag the items to their correct categories',
      items,
      zones,
      explanation: q.explanation || '',
      hint: q.hint || '',
      points: q.points || items.length,
      backgroundImage: q.backgroundImage || ''
    };
  });

  // If no questions were found, add a default one
  if (activity.questions.length === 0) {
    const zoneIds = [generateId(), generateId(), generateId()];
    
    activity.questions = [
      {
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
      }
    ];
  }

  return activity;
}
