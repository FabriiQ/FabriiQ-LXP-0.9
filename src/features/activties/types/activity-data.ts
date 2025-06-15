/**
 * Activity Data Types
 * 
 * This file contains type definitions for activity data.
 */

/**
 * Base Activity Data interface
 */
export interface ActivityData {
  title: string;
  activityType: string;
  description?: string;
  instructions?: string;
  metadata?: {
    generatedBy?: 'ai' | 'manual';
    [key: string]: any;
  };
  [key: string]: any;
}

/**
 * Multiple Choice Activity Data
 */
export interface MultipleChoiceActivityData extends ActivityData {
  activityType: 'multiple-choice';
  questions: MultipleChoiceQuestion[];
}

/**
 * Multiple Choice Question
 */
export interface MultipleChoiceQuestion {
  id: string;
  text: string;
  options: MultipleChoiceOption[];
  explanation?: string;
  hint?: string;
}

/**
 * Multiple Choice Option
 */
export interface MultipleChoiceOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

/**
 * True/False Activity Data
 */
export interface TrueFalseActivityData extends ActivityData {
  activityType: 'true-false';
  questions: TrueFalseQuestion[];
}

/**
 * True/False Question
 */
export interface TrueFalseQuestion {
  id: string;
  statement: string;
  isTrue: boolean;
  explanation?: string;
  hint?: string;
}

/**
 * Fill in the Blanks Activity Data
 */
export interface FillInTheBlanksActivityData extends ActivityData {
  activityType: 'fill-in-the-blanks' | 'fill-in-blanks';
  questions: FillInTheBlanksQuestion[];
}

/**
 * Fill in the Blanks Question
 */
export interface FillInTheBlanksQuestion {
  id: string;
  text: string;
  blanks: FillInTheBlanksBlanks[];
  explanation?: string;
  hint?: string;
}

/**
 * Fill in the Blanks Blanks
 */
export interface FillInTheBlanksBlanks {
  id: string;
  acceptableAnswers: string[];
}

/**
 * Multiple Response Activity Data
 */
export interface MultipleResponseActivityData extends ActivityData {
  activityType: 'multiple-response';
  questions: MultipleResponseQuestion[];
}

/**
 * Multiple Response Question
 */
export interface MultipleResponseQuestion {
  id: string;
  text: string;
  options: MultipleResponseOption[];
  explanation?: string;
  hint?: string;
}

/**
 * Multiple Response Option
 */
export interface MultipleResponseOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

/**
 * Matching Activity Data
 */
export interface MatchingActivityData extends ActivityData {
  activityType: 'matching';
  questions: MatchingQuestion[];
}

/**
 * Matching Question
 */
export interface MatchingQuestion {
  id: string;
  text: string;
  pairs: MatchingPair[];
  explanation?: string;
  hint?: string;
}

/**
 * Matching Pair
 */
export interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

/**
 * Sequence Activity Data
 */
export interface SequenceActivityData extends ActivityData {
  activityType: 'sequence';
  questions: SequenceQuestion[];
}

/**
 * Sequence Question
 */
export interface SequenceQuestion {
  id: string;
  text: string;
  items: SequenceItem[];
  explanation?: string;
  hint?: string;
}

/**
 * Sequence Item
 */
export interface SequenceItem {
  id: string;
  text: string;
  correctPosition: number;
}

/**
 * Numeric Activity Data
 */
export interface NumericActivityData extends ActivityData {
  activityType: 'numeric';
  questions: NumericQuestion[];
}

/**
 * Numeric Question
 */
export interface NumericQuestion {
  id: string;
  text: string;
  correctAnswer: number;
  tolerance?: number;
  unit?: string;
  explanation?: string;
  hint?: string;
}

/**
 * Drag and Drop Activity Data
 */
export interface DragAndDropActivityData extends ActivityData {
  activityType: 'drag-and-drop';
  questions: DragAndDropQuestion[];
}

/**
 * Drag and Drop Question
 */
export interface DragAndDropQuestion {
  id: string;
  text: string;
  draggables: DragAndDropDraggable[];
  dropZones: DragAndDropDropZone[];
  explanation?: string;
  hint?: string;
}

/**
 * Drag and Drop Draggable
 */
export interface DragAndDropDraggable {
  id: string;
  text: string;
}

/**
 * Drag and Drop Drop Zone
 */
export interface DragAndDropDropZone {
  id: string;
  text: string;
  correctDraggableId: string;
}

/**
 * Flash Cards Activity Data
 */
export interface FlashCardsActivityData extends ActivityData {
  activityType: 'flash-cards';
  cards: FlashCard[];
}

/**
 * Flash Card
 */
export interface FlashCard {
  id: string;
  front: string;
  back: string;
}

/**
 * Video Activity Data
 */
export interface VideoActivityData extends ActivityData {
  activityType: 'video';
  videoUrl: string;
  duration?: number;
  questions?: VideoQuestion[];
}

/**
 * Video Question
 */
export interface VideoQuestion {
  id: string;
  text: string;
  timeStamp: number;
  options?: MultipleChoiceOption[];
  type: 'multiple-choice' | 'free-response';
}
