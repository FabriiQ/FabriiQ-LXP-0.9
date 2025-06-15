'use client';

/**
 * Reading Activity AI Converter
 *
 * This file contains functions for converting AI-generated content to reading activities.
 */

import { ReadingActivity, ReadingSection } from '../models/reading';
import { generateId } from '../models/base';

/**
 * Convert AI-generated content to a reading activity
 *
 * @param aiContent AI-generated content
 * @returns Reading activity
 */
export function convertAIContentToReadingActivity(aiContent: any): ReadingActivity {
  // Start with a default activity
  const activity: ReadingActivity = {
    id: aiContent.id || generateId(),
    title: aiContent.title || 'AI Generated Reading Activity',
    description: aiContent.description || '',
    instructions: aiContent.instructions || 'Read through the content at your own pace.',
    activityType: 'reading',
    sections: [],
    isGradable: false, // Reading activities are not gradable
    createdAt: new Date(),
    updatedAt: new Date(),
    settings: {
      showTableOfContents: aiContent.showTableOfContents ?? true,
      enableTextToSpeech: aiContent.enableTextToSpeech ?? true,
      enableHighlighting: aiContent.enableHighlighting ?? true,
      enableNotes: aiContent.enableNotes ?? true,
      readingTimeEstimate: aiContent.readingTimeEstimate || 5,
      showProgressBar: aiContent.showProgressBar ?? true,
      fontSizeAdjustable: aiContent.fontSizeAdjustable ?? true
    }
  };

  // Find sections in the AI content (check all possible locations)
  const aiSections = aiContent.sections || 
                    aiContent.content?.sections || 
                    aiContent.config?.sections || 
                    [];

  // If no sections are found, try to create a section from the content
  if (aiSections.length === 0 && aiContent.content) {
    // Create a single section from the content
    activity.sections = [
      {
        id: generateId(),
        title: 'Content',
        content: typeof aiContent.content === 'string' 
          ? formatContentAsHtml(aiContent.content)
          : '<p>No content available</p>'
      }
    ];
  } else {
    // Convert each section to our format
    activity.sections = aiSections.map((section: any) => {
      // Create the section
      const newSection: ReadingSection = {
        id: section.id || generateId(),
        title: section.title || 'Untitled Section',
        content: ''
      };
      
      // Handle content
      if (section.content) {
        if (typeof section.content === 'string') {
          // Plain text or HTML content
          newSection.content = formatContentAsHtml(section.content);
        } else if (typeof section.content === 'object') {
          // Object with HTML property
          newSection.content = section.content.html || section.content.text || '<p>No content available</p>';
        }
      } else if (section.text) {
        // Alternative content property
        newSection.content = formatContentAsHtml(section.text);
      } else if (section.html) {
        // Direct HTML content
        newSection.content = section.html;
      } else {
        newSection.content = '<p>No content available</p>';
      }
      
      // Add media if provided
      if (section.image || section.imageUrl) {
        newSection.media = {
          type: 'image',
          url: section.image || section.imageUrl,
          alt: section.imageAlt || section.alt || '',
          caption: section.imageCaption || section.caption || ''
        };
      } else if (section.additionalText) {
        newSection.media = {
          type: 'text',
          content: section.additionalText,
          caption: section.textCaption || ''
        };
      }
      
      return newSection;
    });
  }

  // If still no sections, create a default one
  if (activity.sections.length === 0) {
    activity.sections = [
      {
        id: generateId(),
        title: 'Introduction',
        content: `
          <h2>Introduction</h2>
          <p>This is a sample reading section. You can edit this content using the rich text editor.</p>
          <p>Reading activities are designed to provide students with informative content that they can read at their own pace.</p>
          <p>You can include:</p>
          <ul>
            <li>Text formatting (bold, italic, etc.)</li>
            <li>Lists (ordered and unordered)</li>
            <li>Images</li>
            <li>Tables</li>
            <li>And more!</li>
          </ul>
        `
      }
    ];
  }

  return activity;
}

/**
 * Format plain text content as HTML
 * 
 * @param content Plain text content
 * @returns HTML content
 */
function formatContentAsHtml(content: string): string {
  // Check if content is already HTML
  if (content.trim().startsWith('<') && (
    content.includes('<p>') || 
    content.includes('<h1>') || 
    content.includes('<h2>') || 
    content.includes('<div>') || 
    content.includes('<ul>')
  )) {
    return content;
  }
  
  // Convert plain text to HTML
  return content
    // Replace newlines with paragraph breaks
    .split('\n\n')
    .map(paragraph => `<p>${paragraph}</p>`)
    .join('')
    // Replace single newlines with line breaks
    .replace(/\n/g, '<br>');
}
