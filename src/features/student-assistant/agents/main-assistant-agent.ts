'use client';

import { StudentAssistantContext, Message } from '../types';
import { createBasePrompt } from '../utils/prompt-templates';
import { DEFAULT_AI_MODEL_SETTINGS } from '../constants';

/**
 * MainAssistantAgent
 * 
 * Handles general questions and provides educational guidance using
 * Socratic questioning and guided discovery approaches.
 */
export class MainAssistantAgent {
  private context: StudentAssistantContext;
  private conversationHistory: Message[] = [];
  
  constructor(context: StudentAssistantContext) {
    this.context = context;
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
      // Create prompt with context and history
      const prompt = this.createPrompt(content);
      
      // Call AI service
      const response = await this.callAIModel(prompt);
      
      return response;
    } catch (error) {
      console.error('Error in MainAssistantAgent:', error);
      return "I'm sorry, but I encountered an error while processing your question. Could you try asking in a different way?";
    }
  }
  
  /**
   * Create a prompt for the AI model
   */
  private createPrompt(content: string): string {
    const studentName = this.context.student?.name || 'the student';
    const gradeLevel = this.context.student?.gradeLevel || 'appropriate';
    
    // Format message history
    const formattedHistory = this.conversationHistory
      .map(msg => `${msg.role === 'user' ? studentName : 'Assistant'}: ${msg.content}`)
      .join('\n\n');
    
    return createBasePrompt(
      this.context.student || { name: 'the student', gradeLevel: 'appropriate' },
      this.conversationHistory,
      content
    );
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
      
      // Use Gemini 2.0 Flash model
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        generationConfig: {
          temperature: DEFAULT_AI_MODEL_SETTINGS.temperature,
          maxOutputTokens: DEFAULT_AI_MODEL_SETTINGS.maxTokens,
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
