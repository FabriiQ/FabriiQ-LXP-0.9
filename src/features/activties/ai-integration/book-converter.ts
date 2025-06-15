'use client';

/**
 * Book Activity AI Converter
 *
 * This module provides functions for converting AI-generated content to book activities.
 * It handles parsing AI output and creating properly structured book activities.
 */

import { BookActivity, BookSection, BookCheckpoint, createDefaultBookActivity, createDefaultBookSection } from '../models/book';
import { generateId } from '../models/base';

/**
 * Convert AI-generated content to a book activity
 * @param aiContent The AI-generated content
 * @returns A properly structured book activity
 */
export function convertAIContentToBookActivity(aiContent: any): BookActivity {
  // Create a base book activity
  const bookActivity = createDefaultBookActivity();
  
  try {
    // Extract basic properties
    if (aiContent.title) {
      bookActivity.title = aiContent.title;
    }
    
    if (aiContent.description) {
      bookActivity.description = aiContent.description;
    }
    
    if (aiContent.instructions) {
      bookActivity.instructions = aiContent.instructions;
    }
    
    // Extract sections
    if (Array.isArray(aiContent.sections)) {
      bookActivity.sections = aiContent.sections.map((section: any) => {
        const bookSection: BookSection = {
          id: section.id || generateId(),
          title: section.title || 'Untitled Section',
          content: section.content || '<p>No content provided.</p>',
          checkpoints: []
        };
        
        // Extract media if available
        if (section.media) {
          bookSection.media = {
            type: section.media.type || 'text',
            url: section.media.url,
            content: section.media.content,
            alt: section.media.alt,
            caption: section.media.caption
          };
        }
        
        // Extract checkpoints if available
        if (Array.isArray(section.checkpoints)) {
          bookSection.checkpoints = section.checkpoints.map((checkpoint: any) => {
            const bookCheckpoint: BookCheckpoint = {
              id: checkpoint.id || generateId(),
              activityId: checkpoint.activityId || '',
              activityType: checkpoint.activityType || 'MULTIPLE_CHOICE',
              title: checkpoint.title || 'Checkpoint Question',
              description: checkpoint.description || '',
              isRequired: checkpoint.isRequired !== false,
              position: checkpoint.position || 'after',
              content: checkpoint.content
            };
            
            return bookCheckpoint;
          });
        }
        
        return bookSection;
      });
    }
    
    // Extract settings
    if (aiContent.settings) {
      bookActivity.settings = {
        ...bookActivity.settings,
        ...aiContent.settings
      };
    }
    
    // Ensure there's at least one section
    if (bookActivity.sections.length === 0) {
      bookActivity.sections = [createDefaultBookSection()];
    }
    
    return bookActivity;
  } catch (error) {
    console.error('Error converting AI content to book activity:', error);
    return bookActivity;
  }
}

/**
 * Generate a prompt for creating a book activity
 * @param topic The topic for the book activity
 * @param options Additional options for the prompt
 * @returns A prompt for the AI
 */
export function generateBookActivityPrompt(
  topic: string,
  options: {
    numSections?: number;
    includeCheckpoints?: boolean;
    checkpointTypes?: string[];
    difficulty?: 'easy' | 'medium' | 'hard';
    audience?: string;
    includeMedia?: boolean;
  } = {}
): string {
  const {
    numSections = 3,
    includeCheckpoints = true,
    checkpointTypes = ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_IN_THE_BLANKS'],
    difficulty = 'medium',
    audience = 'students',
    includeMedia = true
  } = options;
  
  return `
Create an interactive book activity about "${topic}" with the following structure:

1. Title: A clear, engaging title for the book
2. Description: A brief overview of what the book covers
3. Instructions: Clear directions for students on how to use the book
4. Sections (${numSections}): Each with:
   - Title: Descriptive section title
   - Content: Rich, informative content in HTML format
   ${includeMedia ? '- Media: Suggestions for images or diagrams that would enhance the section' : ''}
   ${includeCheckpoints ? `- Checkpoints: Interactive activities that test understanding (using these types: ${checkpointTypes.join(', ')})` : ''}
5. Settings: Appropriate settings for this book activity

The content should be:
- Appropriate for ${audience}
- At a ${difficulty} difficulty level
- Educational and accurate
- Engaging and well-structured
- Written in HTML format for the content sections

Format the response as a JSON object that can be parsed to create a book activity.
`;
}
