'use client';

import { StudentAssistantContext, Message, DiscussedConcept, ConfusionArea } from '../types';
import { GRADE_LEVEL_COMPLEXITY } from '../constants';

/**
 * Analyzes messages to detect confusion
 * 
 * @param messages Recent messages in the conversation
 * @returns Object containing detected confusion topic and level
 */
export function detectConfusion(messages: Message[]): { topic: string; level: 'low' | 'medium' | 'high' } | null {
  // Only analyze if we have enough messages
  if (messages.length < 3) {
    return null;
  }
  
  // Get the last few user messages
  const userMessages = messages
    .filter(msg => msg.role === 'user')
    .slice(-3);
  
  // Look for confusion indicators
  const confusionIndicators = [
    "I don't understand",
    "I'm confused",
    "I don't get it",
    "This doesn't make sense",
    "I'm lost",
    "Can you explain again",
    "I'm not following",
    "What do you mean",
    "I'm still not sure",
    "That's not clear"
  ];
  
  // Check for confusion indicators in user messages
  const confusionCount = userMessages.reduce((count, msg) => {
    const content = msg.content.toLowerCase();
    return count + confusionIndicators.filter(indicator => content.includes(indicator.toLowerCase())).length;
  }, 0);
  
  if (confusionCount === 0) {
    return null;
  }
  
  // Determine confusion level
  let level: 'low' | 'medium' | 'high' = 'low';
  if (confusionCount >= 3) {
    level = 'high';
  } else if (confusionCount >= 2) {
    level = 'medium';
  }
  
  // Try to identify the topic of confusion
  // For simplicity, we'll use the most recent assistant message as the topic context
  const lastAssistantMessage = [...messages].reverse().find(msg => msg.role === 'assistant');
  
  if (!lastAssistantMessage) {
    return null;
  }
  
  // Extract a topic from the assistant message (first 50 characters)
  const topic = lastAssistantMessage.content.substring(0, 50).trim() + '...';
  
  return { topic, level };
}

/**
 * Detects learning preferences from conversation history
 * 
 * @param messages Conversation history
 * @returns Detected learning preference or null
 */
export function detectLearningPreference(messages: Message[]): string | null {
  // Only analyze if we have enough messages
  if (messages.length < 5) {
    return null;
  }
  
  // Get the user messages
  const userMessages = messages
    .filter(msg => msg.role === 'user')
    .map(msg => msg.content.toLowerCase());
  
  // Define learning preference indicators
  const visualIndicators = [
    "show me",
    "diagram",
    "picture",
    "image",
    "visual",
    "see it",
    "looks like",
    "draw"
  ];
  
  const auditoryIndicators = [
    "tell me",
    "explain",
    "sounds like",
    "hear",
    "listen",
    "say it",
    "talk"
  ];
  
  const kinestheticIndicators = [
    "try it",
    "practice",
    "do it",
    "hands-on",
    "example",
    "step by step",
    "walk through",
    "feel"
  ];
  
  // Count indicators for each preference
  let visualCount = 0;
  let auditoryCount = 0;
  let kinestheticCount = 0;
  
  userMessages.forEach(message => {
    visualIndicators.forEach(indicator => {
      if (message.includes(indicator)) visualCount++;
    });
    
    auditoryIndicators.forEach(indicator => {
      if (message.includes(indicator)) auditoryCount++;
    });
    
    kinestheticIndicators.forEach(indicator => {
      if (message.includes(indicator)) kinestheticCount++;
    });
  });
  
  // Determine dominant preference
  if (visualCount > auditoryCount && visualCount > kinestheticCount && visualCount >= 2) {
    return 'visual';
  } else if (auditoryCount > visualCount && auditoryCount > kinestheticCount && auditoryCount >= 2) {
    return 'auditory';
  } else if (kinestheticCount > visualCount && kinestheticCount > auditoryCount && kinestheticCount >= 2) {
    return 'kinesthetic';
  }
  
  return null;
}

/**
 * Generates adaptive hints based on confusion level
 * 
 * @param topic The topic to provide hints for
 * @param confusionLevel The level of confusion
 * @param gradeLevel The student's grade level
 * @returns An array of hints with increasing specificity
 */
export function generateProgressiveHints(
  topic: string,
  confusionLevel: 'low' | 'medium' | 'high',
  gradeLevel: string
): string[] {
  // Determine complexity based on grade level
  const complexity = GRADE_LEVEL_COMPLEXITY[gradeLevel] || GRADE_LEVEL_COMPLEXITY.middle;
  
  // Generate hints with increasing specificity based on confusion level
  const hints: string[] = [];
  
  if (confusionLevel === 'low') {
    hints.push(`Let's think about ${topic} differently. What do you already know about this topic?`);
    hints.push(`One way to approach ${topic} is to break it down into smaller parts. What's the first step?`);
  } else if (confusionLevel === 'medium') {
    hints.push(`When working with ${topic}, it often helps to start with the basic principles. Can you identify those?`);
    hints.push(`Here's a hint: ${topic} is related to [key concept]. How might that help?`);
    hints.push(`Let's try a simpler example first. What if we applied this to [simplified scenario]?`);
  } else if (confusionLevel === 'high') {
    hints.push(`I can see this is challenging. Let's take a step back and focus on just one part of ${topic}.`);
    hints.push(`Here's a more direct hint: When working with ${topic}, you need to [specific step].`);
    hints.push(`Let me walk you through this step by step. First, [detailed explanation].`);
    hints.push(`Here's a complete example: [worked example]. Does that help clarify things?`);
  }
  
  return hints;
}

/**
 * Suggests topics for further exploration based on discussed concepts
 * 
 * @param discussedConcepts Array of concepts that have been discussed
 * @param confusionAreas Array of areas where confusion has been detected
 * @returns Array of suggested topics
 */
export function suggestTopics(
  discussedConcepts: DiscussedConcept[],
  confusionAreas: ConfusionArea[]
): string[] {
  const suggestions: string[] = [];
  
  // Suggest revisiting concepts with low mastery
  const lowMasteryConcepts = discussedConcepts
    .filter(concept => concept.mastery === 'low')
    .sort((a, b) => b.lastDiscussed.getTime() - a.lastDiscussed.getTime())
    .slice(0, 2);
  
  lowMasteryConcepts.forEach(concept => {
    suggestions.push(`Review ${concept.name} to strengthen your understanding`);
  });
  
  // Suggest topics related to confusion areas
  const activeConfusionAreas = confusionAreas
    .filter(area => !area.resolved)
    .sort((a, b) => b.lastDetected.getTime() - a.lastDetected.getTime())
    .slice(0, 2);
  
  activeConfusionAreas.forEach(area => {
    suggestions.push(`Revisit ${area.topic} to clear up confusion`);
  });
  
  // Suggest building on frequently discussed concepts
  const frequentConcepts = discussedConcepts
    .filter(concept => concept.discussionCount >= 3 && concept.mastery !== 'low')
    .sort((a, b) => b.discussionCount - a.discussionCount)
    .slice(0, 2);
  
  frequentConcepts.forEach(concept => {
    suggestions.push(`Explore advanced topics related to ${concept.name}`);
  });
  
  return suggestions;
}

/**
 * Enhances a prompt with personalization based on context
 * 
 * @param basePrompt The base prompt to enhance
 * @param context The student assistant context
 * @returns Enhanced prompt with personalization
 */
export function enhancePromptWithPersonalization(
  basePrompt: string,
  context: StudentAssistantContext
): string {
  let enhancedPrompt = basePrompt;
  
  // Add learning preferences if available
  if (context.student?.learningPreferences?.length) {
    const preferences = context.student.learningPreferences.join(', ');
    enhancedPrompt += `\n\nThe student has shown a preference for ${preferences} learning styles. Adapt your explanation accordingly.`;
  }
  
  // Add information about confusion areas
  if (context.confusionAreas?.length) {
    const recentConfusion = context.confusionAreas
      .filter(area => !area.resolved)
      .sort((a, b) => b.lastDetected.getTime() - a.lastDetected.getTime())[0];
    
    if (recentConfusion) {
      enhancedPrompt += `\n\nThe student has previously shown confusion about "${recentConfusion.topic}". Be especially clear when discussing related concepts.`;
    }
  }
  
  // Add information about discussed concepts
  if (context.discussedConcepts?.length) {
    const recentConcepts = context.discussedConcepts
      .sort((a, b) => b.lastDiscussed.getTime() - a.lastDiscussed.getTime())
      .slice(0, 3)
      .map(c => c.name)
      .join(', ');
    
    enhancedPrompt += `\n\nRecently discussed concepts: ${recentConcepts}. You can reference these if relevant.`;
  }
  
  return enhancedPrompt;
}
