'use client';

import { StudentAssistantContext, Message, MessageClassification } from '../types';
import { MainAssistantAgent } from './main-assistant-agent';
import { SubjectSpecificAgent } from './subject-specific-agent';
import { NavigationAssistantAgent } from './navigation-assistant-agent';
import { NAVIGATION_KEYWORDS, SUBJECT_KEYWORDS } from '../constants';

/**
 * AgentOrchestrator
 * 
 * Coordinates between different specialized agents to handle student questions.
 */
export class AgentOrchestrator {
  private mainAgent: MainAssistantAgent;
  private subjectAgents: Map<string, SubjectSpecificAgent>;
  private navigationAgent: NavigationAssistantAgent;
  private context: StudentAssistantContext;
  private conversationHistory: Message[] = [];
  
  constructor(context: StudentAssistantContext) {
    this.context = context;
    this.mainAgent = new MainAssistantAgent(context);
    this.subjectAgents = new Map();
    this.navigationAgent = new NavigationAssistantAgent(context);
    
    // Initialize subject-specific agents based on student's classes
    if (context.currentClass?.subject) {
      const subjectId = context.currentClass.subject.id;
      if (subjectId && !this.subjectAgents.has(subjectId)) {
        this.subjectAgents.set(
          subjectId, 
          new SubjectSpecificAgent(context, subjectId)
        );
      }
    }
  }
  
  /**
   * Set the conversation history for context
   */
  setConversationHistory(history: Message[]) {
    this.conversationHistory = [...history];
    
    // Update history for all agents
    this.mainAgent.setConversationHistory(history);
    this.navigationAgent.setConversationHistory(history);
    
    // Update history for all subject agents
    this.subjectAgents.forEach(agent => {
      agent.setConversationHistory(history);
    });
  }
  
  /**
   * Process a message and route it to the appropriate agent
   */
  async processMessage(content: string): Promise<string> {
    try {
      // Classify the message to determine which agent should handle it
      const classification = await this.classifyMessage(content);
      
      // Route to the appropriate agent
      switch (classification.type) {
        case 'navigation':
          return this.navigationAgent.processMessage(content);
          
        case 'subject':
          const subjectId = classification.subjectId;
          if (!this.subjectAgents.has(subjectId)) {
            this.subjectAgents.set(
              subjectId, 
              new SubjectSpecificAgent(this.context, subjectId)
            );
          }
          return this.subjectAgents.get(subjectId)!.processMessage(content);
          
        case 'general':
        default:
          return this.mainAgent.processMessage(content);
      }
    } catch (error) {
      console.error('Error in AgentOrchestrator:', error);
      return "I'm sorry, but I encountered an error while processing your question. Could you try asking in a different way?";
    }
  }
  
  /**
   * Classify a message to determine which agent should handle it
   */
  private async classifyMessage(content: string): Promise<MessageClassification> {
    const lowerContent = content.toLowerCase();
    
    // Check if it's a navigation question
    if (NAVIGATION_KEYWORDS.some(keyword => lowerContent.includes(keyword))) {
      return { type: 'navigation' };
    }
    
    // Check if it's related to the current class subject
    if (this.context.currentClass?.subject) {
      const subjectName = this.context.currentClass.subject.name.toLowerCase();
      const subjectId = this.context.currentClass.subject.id;
      
      // If the message mentions the current subject, route to the subject agent
      if (lowerContent.includes(subjectName)) {
        return { type: 'subject', subjectId };
      }
      
      // Check if the message contains keywords related to the current subject
      for (const [subjectType, keywords] of Object.entries(SUBJECT_KEYWORDS)) {
        if (keywords.some(keyword => lowerContent.includes(keyword)) && 
            subjectName.includes(subjectType)) {
          return { type: 'subject', subjectId };
        }
      }
    }
    
    // If no specific routing is determined, use more sophisticated classification
    try {
      // Use Google Generative AI for message classification
      const classification = await this.classifyMessageWithAI(content);
      
      // If it's a subject classification and we have a current class subject
      if (classification.startsWith('subject_') && this.context.currentClass?.subject) {
        return { 
          type: 'subject', 
          subjectId: this.context.currentClass.subject.id 
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
   * Use AI to classify a message
   */
  private async classifyMessageWithAI(content: string): Promise<string> {
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
}
