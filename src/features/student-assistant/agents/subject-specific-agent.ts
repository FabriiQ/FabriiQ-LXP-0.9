'use client';

import { StudentAssistantContext, Message } from '../types';
import { 
  createMathPrompt, 
  createSciencePrompt,
  createEnglishPrompt,
  createHistoryPrompt,
  createBasePrompt
} from '../utils/prompt-templates';
import { DEFAULT_AI_MODEL_SETTINGS, SUBJECT_KEYWORDS } from '../constants';

/**
 * SubjectSpecificAgent
 * 
 * Handles subject-specific questions with specialized knowledge and
 * educational approaches tailored to different academic disciplines.
 */
export class SubjectSpecificAgent {
  private context: StudentAssistantContext;
  private subjectId: string;
  private conversationHistory: Message[] = [];
  
  constructor(context: StudentAssistantContext, subjectId: string) {
    this.context = context;
    this.subjectId = subjectId;
  }
  
  /**
   * Set the conversation history for context
   */
  setConversationHistory(history: Message[]) {
    this.conversationHistory = [...history];
  }
  
  /**
   * Process a message and generate a response
   */
  async processMessage(content: string): Promise<string> {
    try {
      // Determine subject type and select appropriate prompt
      const subjectName = this.getSubjectName();
      const prompt = this.createSubjectPrompt(subjectName, content);
      
      // Call AI service with subject-specific prompt
      const response = await this.callAIModel(prompt);
      
      return response;
    } catch (error) {
      console.error('Error in SubjectSpecificAgent:', error);
      return "I'm sorry, but I encountered an error while processing your question. Could you try asking in a different way?";
    }
  }
  
  /**
   * Get the subject name from context or subjectId
   */
  private getSubjectName(): string {
    // Get subject name from context or fallback to a default
    if (this.context.currentClass?.subject?.name) {
      return this.context.currentClass.subject.name.toLowerCase();
    }
    
    // Try to determine from subjectId if not in context
    // This would require a mapping of subject IDs to names
    // For now, return a default
    return 'general';
  }
  
  /**
   * Create a subject-specific prompt
   */
  private createSubjectPrompt(subjectName: string, content: string): string {
    // Select appropriate prompt template based on subject
    if (this.isSubjectType(subjectName, 'mathematics')) {
      return createMathPrompt(this.context.student!, this.conversationHistory, content);
    } else if (this.isSubjectType(subjectName, 'science')) {
      return createSciencePrompt(this.context.student!, this.conversationHistory, content);
    } else if (this.isSubjectType(subjectName, 'english')) {
      return createEnglishPrompt(this.context.student!, this.conversationHistory, content);
    } else if (this.isSubjectType(subjectName, 'history')) {
      return createHistoryPrompt(this.context.student!, this.conversationHistory, content);
    } else {
      // Fallback to base prompt if subject not recognized
      return createBasePrompt(this.context.student!, this.conversationHistory, content);
    }
  }
  
  /**
   * Check if a subject name matches a subject type
   */
  private isSubjectType(subjectName: string, subjectType: keyof typeof SUBJECT_KEYWORDS): boolean {
    const keywords = SUBJECT_KEYWORDS[subjectType];
    return keywords.some(keyword => subjectName.includes(keyword));
  }
  
  /**
   * Call the AI model with the prompt
   */
  private async callAIModel(prompt: string): Promise<string> {
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
      
      // Use Gemini 2.0 Flash model with slightly lower temperature for more consistent educational content
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        generationConfig: {
          temperature: 0.6, // Slightly lower temperature for educational content
          maxOutputTokens: 1200, // Allow for more detailed explanations
        }
      });
      
      // Generate content
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      
      return response;
    } catch (error) {
      console.error('Error calling AI model:', error);
      throw new Error(`Failed to generate AI response: ${(error as Error).message}`);
    }
  }
}
