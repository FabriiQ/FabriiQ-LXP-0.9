'use client';

import { MessageClassification } from '../types';
import { NAVIGATION_KEYWORDS, SUBJECT_KEYWORDS } from '../constants';

/**
 * Classifies a message to determine which agent should handle it
 * 
 * @param content The message content to classify
 * @param currentSubjectId The ID of the current subject (if any)
 * @param currentSubjectName The name of the current subject (if any)
 * @returns A MessageClassification object
 */
export async function classifyMessage(
  content: string,
  currentSubjectId?: string,
  currentSubjectName?: string
): Promise<MessageClassification> {
  const lowerContent = content.toLowerCase();
  
  // Check if it's a navigation question
  if (NAVIGATION_KEYWORDS.some(keyword => lowerContent.includes(keyword))) {
    return { type: 'navigation' };
  }
  
  // Check if it's related to the current subject
  if (currentSubjectId && currentSubjectName) {
    const lowerSubjectName = currentSubjectName.toLowerCase();
    
    // If the message mentions the current subject, route to the subject agent
    if (lowerContent.includes(lowerSubjectName)) {
      return { type: 'subject', subjectId: currentSubjectId };
    }
    
    // Check if the message contains keywords related to the current subject
    for (const [subjectType, keywords] of Object.entries(SUBJECT_KEYWORDS)) {
      if (keywords.some(keyword => lowerContent.includes(keyword)) && 
          lowerSubjectName.includes(subjectType)) {
        return { type: 'subject', subjectId: currentSubjectId };
      }
    }
  }
  
  // If no specific routing is determined, use more sophisticated classification
  try {
    // Use Google Generative AI for message classification
    const classification = await classifyMessageWithAI(content);
    
    // If it's a subject classification and we have a current subject
    if (classification.startsWith('subject_') && currentSubjectId) {
      return { 
        type: 'subject', 
        subjectId: currentSubjectId 
      };
    }
    
    // If it's a navigation classification
    if (classification === 'navigation') {
      return { type: 'navigation' };
    }
  } catch (error) {
    console.error('Error classifying message with AI:', error);
    // Fall back to general classification on error
  }
  
  // Default to general
  return { type: 'general' };
}

/**
 * Uses AI to classify a message
 * 
 * @param content The message content to classify
 * @returns A string representing the classification
 */
async function classifyMessageWithAI(content: string): Promise<string> {
  try {
    // Import the Google Generative AI library
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    
    // Try to get the API key from environment variables
    let apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    // If not found and we're on the server, try the server-side variable
    if (!apiKey && typeof window === 'undefined') {
      apiKey = process.env.GEMINI_API_KEY;
    }
    
    // For backward compatibility, try the old variable names
    if (!apiKey) {
      apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || process.env.GOOGLE_API_KEY;
    }
    
    if (!apiKey) {
      throw new Error('Google Generative AI API key not found in environment variables');
    }
    
    // Initialize the API client
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Use Gemini 2.0 Flash model with low temperature for consistent classification
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.1, // Very low temperature for consistent classification
        maxOutputTokens: 20, // Classification responses are very short
      }
    });
    
    // Create classification prompt
    const classificationPrompt = `
      Classify the following student message into one of these categories:
      - navigation: Questions about finding features or using the platform
      - subject_math: Questions related to mathematics
      - subject_science: Questions related to science
      - subject_english: Questions related to English or language arts
      - subject_history: Questions related to history or social studies
      - general: General questions or other topics
      
      Respond with ONLY the category name, nothing else.
      
      Student message: "${content}"
    `;
    
    // Generate classification
    const result = await model.generateContent(classificationPrompt);
    const classification = result.response.text().trim().toLowerCase();
    
    return classification;
  } catch (error) {
    console.error('Error classifying message with AI:', error);
    return 'general'; // Default to general on error
  }
}
