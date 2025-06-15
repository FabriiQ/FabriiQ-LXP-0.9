'use client';

import React, { useState } from 'react';
import { Question, QuestionType } from '../../types/question';
import { QUESTION_TYPE_OPTIONS, QUESTION_DIFFICULTY_OPTIONS } from '../../constants/question-types';
import { BloomsTaxonomySelector } from './BloomsTaxonomySelector';
import { generateAssessmentId } from '../../utils/assessment-helpers';
import { getRecommendedQuestionTypes } from '../../utils/bloom-integration';

interface QuestionEditorProps {
  questions: Question[];
  onChange: (questions: Question[]) => void;
}

/**
 * QuestionEditor component for creating and editing assessment questions
 * 
 * This component provides an interface for managing questions with
 * Bloom's Taxonomy integration and question type recommendations.
 */
export function QuestionEditor({ questions, onChange }: QuestionEditorProps) {
  // Selected question for editing
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number | null>(null);
  
  // New question template
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
    id: generateAssessmentId(),
    type: QuestionType.MULTIPLE_CHOICE,
    text: '',
    points: 1,
    difficulty: 'MEDIUM',
    bloomsLevel: 'REMEMBER',
    choices: [
      { id: `choice-${Date.now()}-1`, text: '', isCorrect: true },
      { id: `choice-${Date.now()}-2`, text: '', isCorrect: false },
    ],
  });

  // Handle adding a new question
  const handleAddQuestion = () => {
    if (!newQuestion.text) return;
    
    const updatedQuestions = [...questions, newQuestion as Question];
    onChange(updatedQuestions);
    
    // Reset new question form
    setNewQuestion({
      id: generateAssessmentId(),
      type: QuestionType.MULTIPLE_CHOICE,
      text: '',
      points: 1,
      difficulty: 'MEDIUM',
      bloomsLevel: 'REMEMBER',
      choices: [
        { id: `choice-${Date.now()}-1`, text: '', isCorrect: true },
        { id: `choice-${Date.now()}-2`, text: '', isCorrect: false },
      ],
    });
  };

  // Handle editing a question
  const handleEditQuestion = (index: number) => {
    setSelectedQuestionIndex(index);
  };

  // Handle updating a question
  const handleUpdateQuestion = (updatedQuestion: Question) => {
    if (selectedQuestionIndex === null) return;
    
    const updatedQuestions = [...questions];
    updatedQuestions[selectedQuestionIndex] = updatedQuestion;
    onChange(updatedQuestions);
    
    setSelectedQuestionIndex(null);
  };

  // Handle deleting a question
  const handleDeleteQuestion = (index: number) => {
    const updatedQuestions = questions.filter((_, i) => i !== index);
    onChange(updatedQuestions);
  };

  // Handle new question field changes
  const handleNewQuestionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewQuestion(prev => ({ ...prev, [name]: value }));
  };

  // Handle Bloom's level change
  const handleBloomsLevelChange = (bloomsLevel: string) => {
    setNewQuestion(prev => {
      // Get recommended question types for this Bloom's level
      const recommendedTypes = getRecommendedQuestionTypes(bloomsLevel);
      
      // If current type is not recommended, switch to first recommended type
      const updatedQuestion = { ...prev, bloomsLevel };
      if (recommendedTypes.length > 0 && !recommendedTypes.includes(prev.type as QuestionType)) {
        updatedQuestion.type = recommendedTypes[0];
      }
      
      return updatedQuestion;
    });
  };

  // Handle choice changes for multiple choice questions
  const handleChoiceChange = (index: number, field: string, value: string | boolean) => {
    setNewQuestion(prev => {
      const updatedChoices = [...(prev.choices || [])];
      updatedChoices[index] = { ...updatedChoices[index], [field]: value };
      
      // If setting this choice as correct, make others incorrect
      if (field === 'isCorrect' && value === true) {
        updatedChoices.forEach((choice, i) => {
          if (i !== index) {
            updatedChoices[i] = { ...choice, isCorrect: false };
          }
        });
      }
      
      return { ...prev, choices: updatedChoices };
    });
  };

  // Handle adding a new choice
  const handleAddChoice = () => {
    setNewQuestion(prev => {
      const updatedChoices = [...(prev.choices || [])];
      updatedChoices.push({
        id: `choice-${Date.now()}-${updatedChoices.length + 1}`,
        text: '',
        isCorrect: false,
      });
      return { ...prev, choices: updatedChoices };
    });
  };

  // Handle removing a choice
  const handleRemoveChoice = (index: number) => {
    setNewQuestion(prev => {
      const updatedChoices = [...(prev.choices || [])].filter((_, i) => i !== index);
      return { ...prev, choices: updatedChoices };
    });
  };

  return (
    <div className="question-editor space-y-6">
      {/* Question List */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium">Questions ({questions.length})</h4>
        
        {questions.length === 0 ? (
          <div className="p-4 bg-gray-50 rounded text-center">
            No questions added yet. Use the form below to add questions.
          </div>
        ) : (
          <div className="space-y-2">
            {questions.map((question, index) => (
              <div key={question.id || index} className="p-4 border rounded flex justify-between items-center">
                <div>
                  <div className="font-medium">{index + 1}. {question.text}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {question.type} • {question.points} points • {question.bloomsLevel} level
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => handleEditQuestion(index)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteQuestion(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add New Question Form */}
      <div className="border rounded p-4 space-y-4">
        <h4 className="text-lg font-medium">Add New Question</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Question Type */}
          <div className="form-group">
            <label htmlFor="type" className="block text-sm font-medium mb-1">
              Question Type <span className="text-red-500">*</span>
            </label>
            <select
              id="type"
              name="type"
              value={newQuestion.type}
              onChange={handleNewQuestionChange}
              className="w-full p-2 border rounded"
              required
            >
              {QUESTION_TYPE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Points */}
          <div className="form-group">
            <label htmlFor="points" className="block text-sm font-medium mb-1">
              Points <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="points"
              name="points"
              value={newQuestion.points || 1}
              onChange={handleNewQuestionChange}
              className="w-full p-2 border rounded"
              min={1}
              required
            />
          </div>

          {/* Difficulty */}
          <div className="form-group">
            <label htmlFor="difficulty" className="block text-sm font-medium mb-1">
              Difficulty <span className="text-red-500">*</span>
            </label>
            <select
              id="difficulty"
              name="difficulty"
              value={newQuestion.difficulty}
              onChange={handleNewQuestionChange}
              className="w-full p-2 border rounded"
              required
            >
              {QUESTION_DIFFICULTY_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bloom's Taxonomy Selector */}
        <div className="form-group">
          <label className="block text-sm font-medium mb-1">
            Cognitive Level <span className="text-red-500">*</span>
          </label>
          <BloomsTaxonomySelector
            selectedLevel={newQuestion.bloomsLevel || 'REMEMBER'}
            onChange={handleBloomsLevelChange}
          />
        </div>

        {/* Question Text */}
        <div className="form-group">
          <label htmlFor="text" className="block text-sm font-medium mb-1">
            Question Text <span className="text-red-500">*</span>
          </label>
          <textarea
            id="text"
            name="text"
            value={newQuestion.text || ''}
            onChange={handleNewQuestionChange}
            className="w-full p-2 border rounded"
            rows={3}
            required
          />
        </div>

        {/* Question-specific fields based on type */}
        {newQuestion.type === QuestionType.MULTIPLE_CHOICE && (
          <div className="space-y-3">
            <label className="block text-sm font-medium">
              Choices <span className="text-red-500">*</span>
            </label>
            
            {newQuestion.choices?.map((choice, index) => (
              <div key={choice.id} className="flex items-center space-x-2">
                <input
                  type="radio"
                  checked={choice.isCorrect}
                  onChange={() => handleChoiceChange(index, 'isCorrect', true)}
                  className="h-4 w-4"
                />
                <input
                  type="text"
                  value={choice.text}
                  onChange={(e) => handleChoiceChange(index, 'text', e.target.value)}
                  className="flex-1 p-2 border rounded"
                  placeholder={`Choice ${index + 1}`}
                  required
                />
                {newQuestion.choices && newQuestion.choices.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveChoice(index)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            
            <button
              type="button"
              onClick={handleAddChoice}
              className="text-blue-600 hover:underline text-sm"
            >
              + Add Choice
            </button>
          </div>
        )}

        {/* Add Question Button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleAddQuestion}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            disabled={!newQuestion.text}
          >
            Add Question
          </button>
        </div>
      </div>
    </div>
  );
}
