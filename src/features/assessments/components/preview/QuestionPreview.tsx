'use client';

import React from 'react';
import { Question, QuestionType } from '../../types/question';
import { BLOOMS_LEVELS } from '../../utils/bloom-integration';

interface QuestionPreviewProps {
  question: Question;
  index: number;
  showAnswer?: boolean;
}

/**
 * QuestionPreview component for previewing assessment questions
 * 
 * This component provides a preview of a question with optional answer display.
 */
export function QuestionPreview({
  question,
  index,
  showAnswer = false,
}: QuestionPreviewProps) {
  const { type, text, points, bloomsLevel, difficulty } = question;

  // Get Bloom's level info
  const bloomsInfo = bloomsLevel
    ? BLOOMS_LEVELS[bloomsLevel as keyof typeof BLOOMS_LEVELS]
    : null;

  return (
    <div className="question-preview p-4 border rounded">
      {/* Question Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="font-medium text-lg">
            {index}. {text}
          </div>
          <div className="flex flex-wrap gap-2 mt-1 text-xs">
            <span className="px-2 py-0.5 bg-gray-100 rounded-full">
              {type}
            </span>
            <span className="px-2 py-0.5 bg-gray-100 rounded-full">
              {points} {points === 1 ? 'point' : 'points'}
            </span>
            <span className="px-2 py-0.5 bg-gray-100 rounded-full">
              {difficulty}
            </span>
            {bloomsInfo && (
              <span
                className="px-2 py-0.5 rounded-full text-gray-800"
                style={{ backgroundColor: `${bloomsInfo.color}30` }}
              >
                {bloomsInfo.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="ml-4">
        {/* Multiple Choice */}
        {type === QuestionType.MULTIPLE_CHOICE && (
          <div className="space-y-2">
            {question.choices?.map((choice, choiceIndex) => (
              <div key={choice.id || choiceIndex} className="flex items-center">
                <input
                  type="radio"
                  disabled
                  checked={showAnswer && choice.isCorrect}
                  className="h-4 w-4 mr-2"
                />
                <span>{choice.text}</span>
                {showAnswer && choice.isCorrect && (
                  <span className="ml-2 text-green-600 font-medium">(Correct)</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* True/False */}
        {type === QuestionType.TRUE_FALSE && (
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="radio"
                disabled
                checked={showAnswer && question.correctAnswer === true}
                className="h-4 w-4 mr-2"
              />
              <span>True</span>
              {showAnswer && question.correctAnswer === true && (
                <span className="ml-2 text-green-600 font-medium">(Correct)</span>
              )}
            </div>
            <div className="flex items-center">
              <input
                type="radio"
                disabled
                checked={showAnswer && question.correctAnswer === false}
                className="h-4 w-4 mr-2"
              />
              <span>False</span>
              {showAnswer && question.correctAnswer === false && (
                <span className="ml-2 text-green-600 font-medium">(Correct)</span>
              )}
            </div>
          </div>
        )}

        {/* Short Answer */}
        {type === QuestionType.SHORT_ANSWER && (
          <div>
            <div className="p-2 border border-dashed rounded mb-2">
              Answer space
            </div>
            {showAnswer && question.correctAnswer && (
              <div className="text-green-600 font-medium">
                Correct Answer: {question.correctAnswer}
              </div>
            )}
          </div>
        )}

        {/* Essay */}
        {type === QuestionType.ESSAY && (
          <div>
            <div className="p-2 border border-dashed rounded h-24 mb-2">
              Essay response space
            </div>
            {showAnswer && question.rubric && (
              <div className="mt-2 p-2 bg-gray-50 rounded">
                <div className="font-medium text-sm mb-1">Grading Rubric:</div>
                <ul className="text-xs space-y-1">
                  {question.rubric.map((criterion, i) => (
                    <li key={i}>
                      <span className="font-medium">{criterion.criterion}</span> ({criterion.points} points)
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Fill in the Blank */}
        {type === QuestionType.FILL_IN_THE_BLANK && (
          <div>
            <div className="p-2 border border-dashed rounded mb-2">
              Fill in the blank space
            </div>
            {showAnswer && question.blanks && (
              <div className="text-green-600 font-medium">
                <div className="font-medium text-sm mb-1">Correct Answers:</div>
                <ul className="text-xs space-y-1">
                  {question.blanks.map((blank, i) => (
                    <li key={i}>
                      Blank {i + 1}: {blank.correctAnswer}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Matching */}
        {type === QuestionType.MATCHING && (
          <div>
            <div className="grid grid-cols-2 gap-4 mb-2">
              <div>
                <div className="font-medium text-sm mb-1">Items:</div>
                <ul className="space-y-1">
                  {question.pairs?.map((pair, i) => (
                    <li key={i} className="p-1 border rounded">
                      {pair.left}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="font-medium text-sm mb-1">Matches:</div>
                <ul className="space-y-1">
                  {question.pairs?.map((pair, i) => (
                    <li key={i} className="p-1 border rounded">
                      {pair.right}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {showAnswer && (
              <div className="text-green-600 font-medium">
                <div className="font-medium text-sm mb-1">Correct Matches:</div>
                <ul className="text-xs space-y-1">
                  {question.pairs?.map((pair, i) => (
                    <li key={i}>
                      {pair.left} → {pair.right}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Default for other question types */}
        {![
          QuestionType.MULTIPLE_CHOICE,
          QuestionType.TRUE_FALSE,
          QuestionType.SHORT_ANSWER,
          QuestionType.ESSAY,
          QuestionType.FILL_IN_THE_BLANK,
          QuestionType.MATCHING,
        ].includes(type) && (
          <div className="p-2 border border-dashed rounded">
            Preview not implemented for {type} questions
          </div>
        )}
      </div>
    </div>
  );
}
