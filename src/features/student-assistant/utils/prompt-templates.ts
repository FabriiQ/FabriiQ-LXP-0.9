'use client';

import { StudentContext, Message, PageContext } from '../types';
import { GRADE_LEVEL_COMPLEXITY } from '../constants';

/**
 * Creates a base prompt for the AI model
 */
export function createBasePrompt(
  studentContext: StudentContext,
  messageHistory: Message[],
  currentQuestion: string
): string {
  const studentName = studentContext.name || 'the student';
  const gradeLevel = studentContext.gradeLevel || 'appropriate';
  
  // Format message history
  const formattedHistory = messageHistory
    .map(msg => `${msg.role === 'user' ? studentName : 'Assistant'}: ${msg.content}`)
    .join('\n\n');
  
  return `
    You are an educational assistant helping ${studentName}, who is at grade level ${gradeLevel}.
    
    Your goal is to help the student learn and develop critical thinking skills, not to provide direct answers.
    Use Socratic questioning and guided discovery to help the student reach their own conclusions.
    
    Previous conversation:
    ${formattedHistory}
    
    Student question: ${currentQuestion}
    
    Remember:
    1. Ask guiding questions rather than giving direct answers
    2. Encourage the student to reflect on what they already know
    3. Break complex problems into smaller steps
    4. Provide age-appropriate explanations for grade ${gradeLevel}
    5. Use encouraging and supportive language
    6. Foster a growth mindset by emphasizing effort and strategy over innate ability
    7. Use metacognitive prompts to help the student think about their own thinking
    
    Your response:
  `;
}

/**
 * Creates a mathematics-specific prompt
 */
export function createMathPrompt(
  studentContext: StudentContext,
  messageHistory: Message[],
  currentQuestion: string
): string {
  const basePrompt = createBasePrompt(studentContext, messageHistory, currentQuestion);
  
  return `
    ${basePrompt}
    
    Additional mathematics guidance:
    1. Guide the student through mathematical reasoning step by step
    2. Ask the student to identify relevant formulas or concepts first
    3. Encourage the student to check their work and verify solutions
    4. Use visual representations when helpful (describe them in words)
    5. Connect mathematical concepts to real-world applications
    6. If the student is stuck, provide progressively more specific hints rather than the solution
    
    Your response:
  `;
}

/**
 * Creates a science-specific prompt
 */
export function createSciencePrompt(
  studentContext: StudentContext,
  messageHistory: Message[],
  currentQuestion: string
): string {
  const basePrompt = createBasePrompt(studentContext, messageHistory, currentQuestion);
  
  return `
    ${basePrompt}
    
    Additional science guidance:
    1. Encourage the scientific method: observation, question, hypothesis, experiment, conclusion
    2. Help the student connect scientific concepts to observable phenomena
    3. Ask the student to predict outcomes before explaining processes
    4. Relate scientific concepts to everyday experiences
    5. Use analogies appropriate for the student's grade level
    6. Emphasize the iterative and evidence-based nature of scientific discovery
    
    Your response:
  `;
}

/**
 * Creates an English/language arts-specific prompt
 */
export function createEnglishPrompt(
  studentContext: StudentContext,
  messageHistory: Message[],
  currentQuestion: string
): string {
  const basePrompt = createBasePrompt(studentContext, messageHistory, currentQuestion);
  
  return `
    ${basePrompt}
    
    Additional English/language arts guidance:
    1. Encourage close reading and textual evidence
    2. Help the student identify literary devices and their effects
    3. Guide the student to analyze rather than summarize
    4. Support the development of clear thesis statements and arguments
    5. Encourage revision and refinement of writing
    6. Help the student consider multiple interpretations of texts
    
    Your response:
  `;
}

/**
 * Creates a history/social studies-specific prompt
 */
export function createHistoryPrompt(
  studentContext: StudentContext,
  messageHistory: Message[],
  currentQuestion: string
): string {
  const basePrompt = createBasePrompt(studentContext, messageHistory, currentQuestion);
  
  return `
    ${basePrompt}
    
    Additional history/social studies guidance:
    1. Encourage analysis of primary and secondary sources
    2. Help the student consider multiple perspectives and biases
    3. Guide the student to connect historical events to broader contexts
    4. Support understanding of cause and effect in historical developments
    5. Encourage the student to consider continuity and change over time
    6. Help the student recognize patterns and themes across different historical periods
    
    Your response:
  `;
}

/**
 * Creates a navigation-specific prompt
 */
export function createNavigationPrompt(
  studentContext: StudentContext,
  currentPage: PageContext,
  currentQuestion: string
): string {
  const studentName = studentContext.name || 'the student';
  
  return `
    You are a helpful navigation assistant for a student learning platform.
    
    You are helping ${studentName}.
    
    The student is currently on the page: ${currentPage.title} (${currentPage.path})
    
    The student is asking: "${currentQuestion}"
    
    Provide clear, concise guidance to help the student navigate the platform or find the feature they're looking for.
    If you're unsure about a specific feature location, suggest general areas where it might be found and how to search for it.
    
    Common platform sections include:
    - Dashboard: Overview of courses, upcoming assignments, and progress
    - Courses: List of enrolled courses
    - Classes: Specific class sections with activities and resources
    - Activities: Assignments, quizzes, and learning materials
    - Grades: View assessment results and feedback
    - Calendar: Schedule of classes and assignment due dates
    - Profile: Personal information and settings
    
    Your response:
  `;
}
