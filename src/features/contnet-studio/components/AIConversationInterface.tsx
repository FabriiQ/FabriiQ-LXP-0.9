"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/core/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/data-display/card";
import { Textarea } from "@/components/ui/core/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/data-display/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Mail, Save, ChevronLeft, FileText, Eye } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/navigation/tabs";
// Import the SimpleActivityPreview and utility functions from our new activities implementation
import {
  SimpleActivityPreview,
  AccessibilityTester,
  mapActivityTypeToId,
  getActivityTypeDisplayName
} from "@/features/activties";
import { toast } from "@/components/ui/feedback/toast";
import { ActivityPurpose } from "@/server/api/constants";
import { saveGeneratedContent, getStoredContent, saveDraftContent, addToContentHistory } from "../utils/client-storage";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIConversationInterfaceProps {
  initialContent: any;
  onSave: (content: any) => void;
  onBack: () => void;
  activityType: string;
  activityTitle: string;
  activityPurpose?: ActivityPurpose; // Kept for backward compatibility
}

export function AIConversationInterface({
  initialContent,
  onSave,
  onBack,
  activityType,
  activityTitle,
  activityPurpose = ActivityPurpose.LEARNING
}: AIConversationInterfaceProps) {
  // We now use the utility functions directly from the activities module

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `I've created a ${activityType} activity titled "${activityTitle}". Take a look at the preview and let me know if you'd like to make any changes.`,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentContent, setCurrentContent] = useState(initialContent);
  const [activeTab, setActiveTab] = useState<string>("preview");
  const [previewMode, setPreviewMode] = useState<"student" | "teacher" | "preview">("student");

  // Get the activity type ID directly from the content or map from the display name
  const getActivityTypeId = (): string => {
    // First check if the content already has an activityType property
    if (initialContent && initialContent.activityType) {
      console.log('Using activityType from content:', initialContent.activityType);
      return initialContent.activityType;
    }

    // If not, map from the display name using the bridge utility
    // Convert display name to enum value (approximate mapping)
    const activityTypeEnum = activityType.toUpperCase().replace(/\s+/g, '_');

    // Use the bridge utility to map to the correct activity type ID
    const mappedType = mapActivityTypeToId(activityTypeEnum, activityPurpose);
    console.log(`AIConversationInterface: Mapped activity type ${activityTypeEnum} to ${mappedType} for purpose ${activityPurpose}`);
    return mappedType;
  };

  const activityTypeId = getActivityTypeId();

  // Ensure the current content has the correct activity type and structure
  useEffect(() => {
    if (!currentContent) return;

    const needsUpdate = !currentContent.activityType ||
                        currentContent.activityType !== activityTypeId ||
                        !currentContent.config;

    if (needsUpdate) {
      console.log(`AIConversationInterface: Updating content structure for ${activityTypeId}`);

      // Create a properly structured content object
      const updatedContent = {
        ...currentContent,
        // Ensure activity type is set correctly
        activityType: activityTypeId,
        type: currentContent.type || activityType.toUpperCase().replace(/\s+/g, '_'),
        // Ensure we have a config object for the activity-specific content
        config: currentContent.config || {},
        // Ensure version is set
        version: currentContent.version || 1
      };

      // Also spread the config fields at the top level for the editor
      if (updatedContent.config) {
        Object.assign(updatedContent, updatedContent.config);
      }

      // For specific activity types, ensure the config has the required structure
      switch (activityTypeId) {
        case 'multiple-choice':
          // Ensure the config has a questions array
          if (!updatedContent.config.questions && currentContent.questions) {
            updatedContent.config.questions = currentContent.questions;
          } else if (!updatedContent.config.questions) {
            updatedContent.config.questions = [];
          }

          // Ensure required fields for multiple-choice activities
          updatedContent.config.shuffleQuestions = updatedContent.config.shuffleQuestions || false;
          updatedContent.config.shuffleOptions = updatedContent.config.shuffleOptions || false;
          updatedContent.config.showFeedbackImmediately = updatedContent.config.showFeedbackImmediately || true;
          updatedContent.config.showCorrectAnswers = updatedContent.config.showCorrectAnswers || true;
          updatedContent.config.passingPercentage = updatedContent.config.passingPercentage || 60;
          updatedContent.config.allowPartialCredit = updatedContent.config.allowPartialCredit || false;

          // Ensure each question has the required fields
          if (updatedContent.config.questions && Array.isArray(updatedContent.config.questions)) {
            updatedContent.config.questions = updatedContent.config.questions.map((question: any) => ({
              ...question,
              points: question.points || 1,
              options: Array.isArray(question.options) ? question.options.map((option: any) => ({
                ...option,
                isCorrect: option.isCorrect || false,
                text: option.text || 'Option text'
              })) : []
            }));
          }
          break;
        case 'fill-in-the-blanks':
          // Ensure the config has a text property
          if (!updatedContent.config.text && currentContent.text) {
            updatedContent.config.text = currentContent.text;
          }
          break;
        case 'reading':
          // Ensure the config has a content property
          if (!updatedContent.config.content && currentContent.content) {
            updatedContent.config.content = currentContent.content;
          }
          break;
        case 'video':
          // Ensure the config has a url property
          if (!updatedContent.config.url && currentContent.url) {
            updatedContent.config.url = currentContent.url;
          }
          break;
        case 'discussion':
          // Ensure the config has a prompt property
          if (!updatedContent.config.prompt && currentContent.prompt) {
            updatedContent.config.prompt = currentContent.prompt;
          }
          break;
      }

      // Log the content structure
      console.log('AIConversationInterface: Updated content structure:', {
        activityType: updatedContent.activityType,
        hasConfig: !!updatedContent.config,
        configKeys: updatedContent.config ? Object.keys(updatedContent.config) : [],
        topLevelKeys: Object.keys(updatedContent)
      });

      setCurrentContent(updatedContent);
    }
  }, [currentContent, activityTypeId, activityType, activityPurpose]);

  // Log the activity type mapping for debugging
  console.log(`Activity type mapping: "${activityType}" -> "${activityTypeId}"`);
  console.log(`Activity purpose: ${activityPurpose}`);
  console.log(`Initial content:`, initialContent);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Generate a unique ID for this content
  const contentId = useRef<string>(`${activityType}-${Date.now()}`);

  // Initialize from localStorage or use initialContent
  useEffect(() => {
    // Try to get stored content
    const storedContent = getStoredContent(contentId.current);
    if (storedContent) {
      setCurrentContent(storedContent);
    } else {
      // Save initial content to localStorage
      saveGeneratedContent(contentId.current, initialContent);
    }
  }, [initialContent]);

  // Save content changes to localStorage
  useEffect(() => {
    if (currentContent) {
      saveDraftContent(contentId.current, currentContent);
    }
  }, [currentContent]);

  // Scroll to bottom of messages when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      role: "user",
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsProcessing(true);

    try {
      // In a real implementation, we would call the AI agent here
      // For now, simulate a response
      setTimeout(() => {
        const assistantMessage: Message = {
          role: "assistant",
          content: getSimulatedResponse(inputValue, currentContent),
          timestamp: new Date()
        };

        console.log('AI response for activity type:', currentContent.activityType);

        setMessages(prev => [...prev, assistantMessage]);

        // Simulate content update based on user request
        const updatedContent = simulateContentUpdate(inputValue, currentContent);

        // Update state and save to localStorage
        setCurrentContent(updatedContent);
        saveGeneratedContent(contentId.current, updatedContent);

        setIsProcessing(false);
      }, 1500);
    } catch (error) {
      console.error("Error processing message:", error);
      toast({
        title: "Error",
        description: "Failed to process your request. Please try again.",
        variant: "error",
      });
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSaveActivity = () => {
    try {
      // Add to content history before saving
      addToContentHistory(currentContent);

      // Extract activity-specific data from the current content
      const activitySpecificData = { ...currentContent };

      // Remove standard properties to isolate activity-specific data
      const standardProps = ['id', 'title', 'description', 'activityType', 'purpose',
                            'content', 'isGradable', 'maxScore', 'passingScore',
                            'gradingConfig', 'startDate', 'endDate', 'duration',
                            'status', 'subjectId', 'topicId', 'classId', 'createdAt',
                            'updatedAt', 'createdById', 'analyticsConfig', 'config',
                            'version', 'type'];

      standardProps.forEach(prop => {
        delete activitySpecificData[prop];
      });

      // Ensure the content has the required fields
      const contentToSave = {
        ...currentContent,
        // Make sure these fields are always present
        version: currentContent.version || 1,
        activityType: activityTypeId, // Always use the mapped activity type ID
        type: currentContent.type || activityType.toUpperCase().replace(/\s+/g, '_'), // Preserve the original type
        // Ensure we have a config object for the activity-specific content that includes all activity-specific data
        config: {
          ...(currentContent.config || {}),
          ...activitySpecificData
        }
      };

      // Also spread the config fields at the top level for the editor
      Object.assign(contentToSave, contentToSave.config);

      // For specific activity types, ensure the config has the required structure
      switch (activityTypeId) {
        case 'multiple-choice':
          console.log('Processing multiple-choice activity for save', {
            hasQuestionsInContent: contentToSave.questions ? true : false,
            hasQuestionsInConfig: contentToSave.config.questions ? true : false,
            questionsCountInContent: contentToSave.questions ? contentToSave.questions.length : 0,
            questionsCountInConfig: contentToSave.config.questions ? contentToSave.config.questions.length : 0
          });

          // Ensure the config has a questions array
          if (!contentToSave.config.questions && contentToSave.questions) {
            console.log('Using questions from top level');
            contentToSave.config.questions = contentToSave.questions;
          } else if (!contentToSave.config.questions) {
            console.log('No questions found, creating empty array');
            contentToSave.config.questions = [];
          }

          // Ensure required fields for multiple-choice activities
          contentToSave.config.shuffleQuestions = contentToSave.shuffleQuestions ||
                                                contentToSave.config.shuffleQuestions || false;

          contentToSave.config.shuffleOptions = contentToSave.shuffleOptions ||
                                              contentToSave.config.shuffleOptions || false;

          contentToSave.config.showFeedbackImmediately = contentToSave.showFeedbackImmediately ||
                                                       contentToSave.config.showFeedbackImmediately || true;

          contentToSave.config.showCorrectAnswers = contentToSave.showCorrectAnswers ||
                                                  contentToSave.config.showCorrectAnswers || true;

          contentToSave.config.passingPercentage = contentToSave.passingPercentage ||
                                                 contentToSave.config.passingPercentage || 60;

          contentToSave.config.allowPartialCredit = contentToSave.allowPartialCredit ||
                                                  contentToSave.config.allowPartialCredit || false;

          // Ensure each question has the required fields
          if (contentToSave.config.questions && Array.isArray(contentToSave.config.questions)) {
            contentToSave.config.questions = contentToSave.config.questions.map((question: any) => ({
              ...question,
              id: question.id || `q${Math.random().toString(36).substring(2, 9)}`,
              points: question.points || 1,
              options: Array.isArray(question.options) ? question.options.map((option: any) => ({
                ...option,
                id: option.id || `o${Math.random().toString(36).substring(2, 9)}`,
                isCorrect: option.isCorrect || false,
                text: option.text || 'Option text',
                feedback: option.feedback || ''
              })) : []
            }));
          }

          // Make sure the top level has the same data as the config
          contentToSave.questions = contentToSave.config.questions;
          contentToSave.shuffleQuestions = contentToSave.config.shuffleQuestions;
          contentToSave.shuffleOptions = contentToSave.config.shuffleOptions;
          contentToSave.showFeedbackImmediately = contentToSave.config.showFeedbackImmediately;
          contentToSave.showCorrectAnswers = contentToSave.config.showCorrectAnswers;
          contentToSave.passingPercentage = contentToSave.config.passingPercentage;
          contentToSave.allowPartialCredit = contentToSave.config.allowPartialCredit;

          console.log('Processed multiple-choice activity for save', {
            questionsCount: contentToSave.questions.length
          });
          break;
        case 'fill-in-the-blanks':
          // Ensure the config has a text property
          if (!contentToSave.config.text && contentToSave.text) {
            contentToSave.config.text = contentToSave.text;
          }
          break;
        case 'reading':
          // Ensure the config has a content property
          if (!contentToSave.config.content && contentToSave.content && typeof contentToSave.content !== 'object') {
            contentToSave.config.content = contentToSave.content;
          }
          break;
        case 'video':
          // Ensure the config has a url property
          if (!contentToSave.config.url && contentToSave.url) {
            contentToSave.config.url = contentToSave.url;
          }
          break;
        case 'discussion':
          // Ensure the config has a prompt property
          if (!contentToSave.config.prompt && contentToSave.prompt) {
            contentToSave.config.prompt = contentToSave.prompt;
          }
          break;
      }

      console.log("Saving activity with content from AI conversation:", {
        activityTypeId,
        originalType: currentContent.type,
        originalActivityType: currentContent.activityType,
        finalActivityType: contentToSave.activityType,
        hasConfig: !!contentToSave.config,
        configKeys: contentToSave.config ? Object.keys(contentToSave.config) : []
      });

      // Basic validation for all activity types
      if (!contentToSave.title) {
        throw new Error('Activity must have a title');
      }

      // Activity-specific validation
      if (activityTypeId === 'fill-in-the-blanks') {
        // Ensure we have the required structure for fill-in-the-blanks
        if (!contentToSave.config || !contentToSave.config.questions || !Array.isArray(contentToSave.config.questions) || contentToSave.config.questions.length === 0) {
          throw new Error('Fill-in-the-blanks activity must have at least one question');
        }
      } else if (activityTypeId === 'multiple-choice' || activityTypeId === 'quiz') {
        // Ensure we have the required structure for multiple-choice activities
        if (!contentToSave.config || !contentToSave.config.questions || !Array.isArray(contentToSave.config.questions) || contentToSave.config.questions.length === 0) {
          throw new Error('Multiple-choice activity must have at least one question');
        }
      }

      // Call the parent's onSave handler
      onSave(contentToSave);

      // Show success toast
      toast({
        title: "Content saved",
        description: "Your activity has been saved successfully.",
        variant: "success",
      });
    } catch (error) {
      console.error('Error saving activity:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save activity. Please check the activity data.",
        variant: "error",
      });
    }
  };

  // Simulate AI responses based on user input and activity type
  const getSimulatedResponse = (userInput: string, content: any): string => {
    const input = userInput.toLowerCase();
    const activityType = content.activityType || 'reading';

    // Common responses for all activity types
    if (input.includes("thank")) {
      return "You're welcome! Is there anything else you'd like to change before saving the activity?";
    } else if (input.includes("change title")) {
      return "I've updated the title. You can see the change in the preview tab.";
    }

    // Activity-specific responses
    switch (activityType) {
      case 'reading':
        if (input.includes("add more") || input.includes("expand")) {
          return "I've expanded the reading content with more details. Take a look at the updated preview.";
        } else if (input.includes("simplify") || input.includes("shorter")) {
          return "I've simplified the reading content to make it more concise. Check the preview to see if it meets your needs.";
        } else if (input.includes("add checkpoint")) {
          return "I've added a new checkpoint to the reading activity. This will help students reflect on what they've learned.";
        }
        break;

      case 'video':
        if (input.includes("add youtube") || input.includes("add video")) {
          return "I've added a YouTube video to the activity. You can see it in the preview tab.";
        } else if (input.includes("add checkpoint")) {
          return "I've added a new checkpoint at a specific timestamp in the video. This will help students engage with the content.";
        }
        break;

      case 'multiple-choice':
        if (input.includes("add question")) {
          return "I've added a new multiple-choice question to the quiz. Each question has one correct answer.";
        } else if (input.includes("add option")) {
          return "I've added another option to the question. Remember that multiple-choice questions should have only one correct answer.";
        }
        break;

      case 'multiple-response':
        if (input.includes("add question")) {
          return "I've added a new multiple-response question to the quiz. These questions can have multiple correct answers.";
        }
        break;

      case 'true-false':
        if (input.includes("add question")) {
          return "I've added a new true/false question to the quiz. Each statement can be either true or false.";
        }
        break;
    }

    // Default response if no specific match
    if (input.includes("add more") || input.includes("expand")) {
      return "I've expanded the content with more details. Take a look at the updated preview.";
    } else if (input.includes("simplify") || input.includes("shorter")) {
      return "I've simplified the content to make it more concise. Check the preview to see if it meets your needs.";
    } else if (input.includes("add question")) {
      return "I've added a new question to the activity. Take a look at the updated preview.";
    } else if (input.includes("add checkpoint")) {
      return "I've added a new checkpoint to the activity. Take a look at the updated preview.";
    } else {
      return "I've made the requested changes. Please check the preview tab to see the updated content.";
    }
  };

  // Simulate content updates based on user input and activity type
  const simulateContentUpdate = (userInput: string, content: any): any => {
    const input = userInput.toLowerCase();
    const updatedContent = { ...content };
    const activityType = updatedContent.activityType || 'reading';

    // Ensure we have a config object for the activity-specific content
    if (!updatedContent.config) {
      updatedContent.config = {};
    }

    // Ensure activity type is set correctly
    updatedContent.activityType = activityTypeId;

    console.log(`Simulating content update for activity type: ${activityType}`, {
      hasConfig: !!updatedContent.config,
      configKeys: updatedContent.config ? Object.keys(updatedContent.config) : [],
      topLevelKeys: Object.keys(updatedContent)
    });

    // Handle common updates for all activity types
    if (input.includes("change title")) {
      // Update the title
      updatedContent.title = "Updated: " + updatedContent.title;
      return updatedContent;
    }

    // Handle activity-specific updates
    switch (activityType) {
      case 'reading':
        if (input.includes("add more") || input.includes("expand")) {
          // Add more content to the reading activity
          if (updatedContent.config && updatedContent.config.content && Array.isArray(updatedContent.config.content)) {
            updatedContent.config.content.push({
              type: "p",
              children: [{ text: "This is additional content that has been added based on your request. It provides more details and context for the activity." }]
            });
          }
        } else if (input.includes("simplify") || input.includes("shorter")) {
          // Simplify by removing some content
          if (updatedContent.config && updatedContent.config.content &&
              Array.isArray(updatedContent.config.content) &&
              updatedContent.config.content.length > 1) {
            updatedContent.config.content = updatedContent.config.content.slice(0, Math.max(1, updatedContent.config.content.length - 1));
          }
        } else if (input.includes("add checkpoint")) {
          // Add a checkpoint to the reading activity
          if (updatedContent.config && updatedContent.config.checkpoints && Array.isArray(updatedContent.config.checkpoints)) {
            updatedContent.config.checkpoints.push({
              id: `cp${updatedContent.config.checkpoints.length + 1}`,
              title: "New Checkpoint",
              question: "What did you learn from this section?",
              type: "SHORT_ANSWER"
            });
          }
        }
        break;

      case 'video':
        if (input.includes("add youtube") || input.includes("add video")) {
          // Add a YouTube video URL
          if (updatedContent.config) {
            updatedContent.config.videoType = 'youtube';
            updatedContent.config.videoId = 'dQw4w9WgXcQ'; // Example YouTube ID
            updatedContent.config.videoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
          }
        } else if (input.includes("add checkpoint")) {
          // Add a checkpoint to the video activity
          if (updatedContent.config && updatedContent.config.checkpoints && Array.isArray(updatedContent.config.checkpoints)) {
            const newCheckpointIndex = updatedContent.config.checkpoints.length + 1;
            updatedContent.config.checkpoints.push({
              id: `cp${newCheckpointIndex}`,
              title: `Checkpoint ${newCheckpointIndex}`,
              timeInSeconds: newCheckpointIndex * 60,
              question: `What did you learn from minute ${newCheckpointIndex}?`,
              type: "SHORT_ANSWER"
            });
          }
        }
        break;

      case 'multiple-choice':
      case 'multiple-response':
      case 'true-false':
      case 'quiz':
        if (input.includes("add question")) {
          // Add a question to the quiz activity
          if (updatedContent.config && updatedContent.config.questions && Array.isArray(updatedContent.config.questions)) {
            const newQuestionIndex = updatedContent.config.questions.length + 1;

            if (activityType === 'multiple-choice') {
              updatedContent.config.questions.push({
                id: `q${newQuestionIndex}`,
                text: `New question ${newQuestionIndex} added based on your request`,
                options: [
                  { id: `q${newQuestionIndex}a`, text: 'Option A', isCorrect: true, feedback: 'Correct!' },
                  { id: `q${newQuestionIndex}b`, text: 'Option B', isCorrect: false, feedback: 'Incorrect' },
                  { id: `q${newQuestionIndex}c`, text: 'Option C', isCorrect: false, feedback: 'Incorrect' },
                  { id: `q${newQuestionIndex}d`, text: 'Option D', isCorrect: false, feedback: 'Incorrect' }
                ],
                explanation: 'This is an explanation for the correct answer.'
              });
            } else if (activityType === 'multiple-response') {
              updatedContent.config.questions.push({
                id: `q${newQuestionIndex}`,
                text: `New question ${newQuestionIndex} added based on your request`,
                options: [
                  { id: `q${newQuestionIndex}a`, text: 'Option A', isCorrect: true, feedback: 'Correct!' },
                  { id: `q${newQuestionIndex}b`, text: 'Option B', isCorrect: true, feedback: 'Correct!' },
                  { id: `q${newQuestionIndex}c`, text: 'Option C', isCorrect: false, feedback: 'Incorrect' },
                  { id: `q${newQuestionIndex}d`, text: 'Option D', isCorrect: false, feedback: 'Incorrect' }
                ],
                explanation: 'This is an explanation for the correct answers.'
              });
            } else if (activityType === 'true-false') {
              updatedContent.config.questions.push({
                id: `q${newQuestionIndex}`,
                text: `New true/false question ${newQuestionIndex} added based on your request`,
                isTrue: true,
                explanation: 'This statement is true because...'
              });
            } else {
              // Generic quiz question
              updatedContent.config.questions.push({
                id: `q${newQuestionIndex}`,
                type: 'MULTIPLE_CHOICE',
                question: `New question ${newQuestionIndex} added based on your request?`,
                options: [
                  { id: 'a', text: 'Option A', isCorrect: false },
                  { id: 'b', text: 'Option B', isCorrect: true },
                  { id: 'c', text: 'Option C', isCorrect: false },
                ],
                points: 10,
              });
            }
          }
        }
        break;

      default:
        // For other activity types, use a generic approach
        if (input.includes("add more") || input.includes("expand")) {
          // Add more content to the appropriate section
          if (updatedContent.content && Array.isArray(updatedContent.content)) {
            updatedContent.content.push({
              type: "p",
              children: [{ text: "This is additional content that has been added based on your request." }]
            });
          } else if (updatedContent.config && updatedContent.config.content && Array.isArray(updatedContent.config.content)) {
            updatedContent.config.content.push({
              type: "p",
              children: [{ text: "This is additional content that has been added based on your request." }]
            });
          } else if (updatedContent.sections && Array.isArray(updatedContent.sections)) {
            updatedContent.sections.push({
              title: "Additional Information",
              content: "This section provides more details and examples to help students better understand the topic."
            });
          } else if (updatedContent.config && updatedContent.config.sections && Array.isArray(updatedContent.config.sections)) {
            updatedContent.config.sections.push({
              title: "Additional Information",
              content: "This section provides more details and examples to help students better understand the topic."
            });
          }
        } else if (input.includes("simplify") || input.includes("shorter")) {
          // Simplify by removing some content
          if (updatedContent.content && Array.isArray(updatedContent.content) && updatedContent.content.length > 1) {
            updatedContent.content = updatedContent.content.slice(0, Math.max(1, updatedContent.content.length - 1));
          } else if (updatedContent.config && updatedContent.config.content &&
                     Array.isArray(updatedContent.config.content) &&
                     updatedContent.config.content.length > 1) {
            updatedContent.config.content = updatedContent.config.content.slice(0, Math.max(1, updatedContent.config.content.length - 1));
          } else if (updatedContent.sections && Array.isArray(updatedContent.sections) && updatedContent.sections.length > 1) {
            updatedContent.sections = updatedContent.sections.slice(0, Math.max(1, updatedContent.sections.length - 1));
          } else if (updatedContent.config && updatedContent.config.sections &&
                     Array.isArray(updatedContent.config.sections) &&
                     updatedContent.config.sections.length > 1) {
            updatedContent.config.sections = updatedContent.config.sections.slice(0, Math.max(1, updatedContent.config.sections.length - 1));
          }
        } else if (input.includes("add question") || input.includes("add checkpoint")) {
          // Add a question or checkpoint
          if (updatedContent.questions && Array.isArray(updatedContent.questions)) {
            updatedContent.questions.push({
              id: `q${updatedContent.questions.length + 1}`,
              type: 'MULTIPLE_CHOICE',
              question: 'New question added based on your request?',
              options: [
                { id: 'a', text: 'Option A', isCorrect: false },
                { id: 'b', text: 'Option B', isCorrect: true },
                { id: 'c', text: 'Option C', isCorrect: false },
              ],
              points: 10,
            });
          } else if (updatedContent.config && updatedContent.config.questions && Array.isArray(updatedContent.config.questions)) {
            updatedContent.config.questions.push({
              id: `q${updatedContent.config.questions.length + 1}`,
              type: 'MULTIPLE_CHOICE',
              question: 'New question added based on your request?',
              options: [
                { id: 'a', text: 'Option A', isCorrect: false },
                { id: 'b', text: 'Option B', isCorrect: true },
                { id: 'c', text: 'Option C', isCorrect: false },
              ],
              points: 10,
            });
          } else if (updatedContent.checkpoints && Array.isArray(updatedContent.checkpoints)) {
            updatedContent.checkpoints.push({
              id: `cp${updatedContent.checkpoints.length + 1}`,
              title: "New Checkpoint",
              question: "What did you learn from this section?",
              type: "SHORT_ANSWER"
            });
          } else if (updatedContent.config && updatedContent.config.checkpoints && Array.isArray(updatedContent.config.checkpoints)) {
            updatedContent.config.checkpoints.push({
              id: `cp${updatedContent.config.checkpoints.length + 1}`,
              title: "New Checkpoint",
              question: "What did you learn from this section?",
              type: "SHORT_ANSWER"
            });
          }
        }
    }

    return updatedContent;
  };

  return (
    <div className="flex flex-col h-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <TabsList>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="conversation">AI Conversation</TabsTrigger>
              {/* JSON tab removed as it's now part of the ActivityPreview component */}
            </TabsList>

            {activeTab === "preview" && (
              <div className="ml-4 flex gap-2">
                <Button
                  variant={previewMode === "student" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreviewMode("student")}
                  className="flex items-center gap-1"
                >
                  <Eye className="h-4 w-4" />
                  Student View
                </Button>
                <Button
                  variant={previewMode === "teacher" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreviewMode("teacher")}
                  className="flex items-center gap-1"
                >
                  <FileText className="h-4 w-4" />
                  Teacher View
                </Button>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onBack} className="flex items-center">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button onClick={handleSaveActivity} className="flex items-center">
              <Save className="h-4 w-4 mr-2" />
              Save Activity
            </Button>
          </div>
        </div>

        <TabsContent value="preview" className="flex-1 overflow-auto">
          <SimpleActivityPreview
            activityData={currentContent}
            activityType={activityTypeId}
            onSave={handleSaveActivity}
            onContentChange={(newContent) => {
              try {
                console.log('Activity content updated:', newContent);
                setCurrentContent(newContent);
              } catch (error) {
                console.error('Error updating content:', error);
                toast({
                  title: "Error",
                  description: "Failed to update content. Please try again.",
                  variant: "error",
                });
              }
            }}
            isLoading={false}
            previewMode={previewMode === "preview" ? "teacher" : previewMode}
            showAccessibilityTester={true}
            className="p-4 border rounded-lg bg-white dark:bg-gray-800"
          />
        </TabsContent>

        {/* JSON tab removed as it's now part of the ActivityPreview component */}

        <TabsContent value="conversation" className="flex-1 flex flex-col">
          <Card className="flex-1 flex flex-col">
            <CardHeader>
              <CardTitle>Chat with AI</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`flex items-start gap-2 max-w-[80%] ${
                          message.role === "user" ? "flex-row-reverse" : ""
                        }`}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className={message.role === "user" ? "bg-primary text-white" : "bg-secondary text-primary"}>
                            {message.role === "user" ? "U" : <MessageSquare className="h-4 w-4" />}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`rounded-lg p-3 ${
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p className="text-xs mt-1 opacity-70">
                            {message.timestamp.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <div className="flex w-full items-center space-x-2">
                <Textarea
                  placeholder="Ask the AI to modify the activity..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 min-h-[60px] max-h-[120px]"
                  disabled={isProcessing}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isProcessing}
                  className="h-10"
                >
                  {isProcessing ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AIConversationInterface;
