'use client';

import React, { useState } from 'react';
import { Assessment, CreateAssessmentInput } from '../../types/assessment';
import { ASSESSMENT_TYPE_OPTIONS } from '../../constants/assessment-types';
import { AssessmentCategory, GradingType } from '../../types/enums';
import { QuestionEditor } from '../creation/QuestionEditor';
import { BloomsTaxonomySelector } from '../creation/BloomsTaxonomySelector';
import { CognitiveDistributionChart } from '../creation/CognitiveDistributionChart';
import { calculateBloomsDistribution } from '../../utils/assessment-helpers';
import { analyzeBloomsDistribution } from '../../utils/bloom-integration';

interface AssessmentFormProps {
  initialData?: Assessment;
  onSubmit: (data: CreateAssessmentInput) => void;
  onCancel: () => void;
  subjects: { id: string; name: string }[];
  classes: { id: string; name: string }[];
  topics?: { id: string; name: string }[];
}

/**
 * AssessmentForm component for creating and editing assessments
 *
 * This component provides a form for creating and editing assessments with
 * Bloom's Taxonomy integration and cognitive level distribution visualization.
 */
export function AssessmentForm({
  initialData,
  onSubmit,
  onCancel,
  subjects,
  classes,
  topics = [],
}: AssessmentFormProps) {
  // Form state
  const [formData, setFormData] = useState<Partial<Assessment>>(initialData || {
    title: '',
    description: '',
    subjectId: '',
    classId: '',
    topicId: '',
    category: AssessmentCategory.QUIZ,
    instructions: '',
    maxScore: 100,
    passingScore: 60,
    weightage: 10,
    gradingType: GradingType.MANUAL,
    questions: [],
    bloomsDistribution: {},
  });

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle question changes
  const handleQuestionsChange = (questions: any[]) => {
    setFormData(prev => {
      const updatedData = { ...prev, questions };

      // Recalculate Bloom's distribution
      const bloomsDistribution = calculateBloomsDistribution(questions);
      return { ...updatedData, bloomsDistribution };
    });
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData as CreateAssessmentInput);
  };

  // Get Bloom's distribution analysis
  const bloomsAnalysis = analyzeBloomsDistribution(formData.questions || []);

  return (
    <div className="assessment-form">
      <h2 className="text-2xl font-bold mb-4">
        {initialData ? 'Edit Assessment' : 'Create New Assessment'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Basic Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="form-group">
              <label htmlFor="title" className="block text-sm font-medium mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title || ''}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            {/* Assessment Type */}
            <div className="form-group">
              <label htmlFor="category" className="block text-sm font-medium mb-1">
                Assessment Type <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                name="category"
                value={formData.category || 'QUIZ'}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              >
                {ASSESSMENT_TYPE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              rows={3}
            />
          </div>

          {/* Subject, Class, Topic */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Subject */}
            <div className="form-group">
              <label htmlFor="subjectId" className="block text-sm font-medium mb-1">
                Subject <span className="text-red-500">*</span>
              </label>
              <select
                id="subjectId"
                name="subjectId"
                value={formData.subjectId || ''}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select Subject</option>
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Class */}
            <div className="form-group">
              <label htmlFor="classId" className="block text-sm font-medium mb-1">
                Class <span className="text-red-500">*</span>
              </label>
              <select
                id="classId"
                name="classId"
                value={formData.classId || ''}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select Class</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Topic */}
            <div className="form-group">
              <label htmlFor="topicId" className="block text-sm font-medium mb-1">
                Topic
              </label>
              <select
                id="topicId"
                name="topicId"
                value={formData.topicId || ''}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              >
                <option value="">Select Topic</option>
                {topics.map(topic => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Scoring */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Max Score */}
            <div className="form-group">
              <label htmlFor="maxScore" className="block text-sm font-medium mb-1">
                Max Score <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="maxScore"
                name="maxScore"
                value={formData.maxScore || 100}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                min={1}
                required
              />
            </div>

            {/* Passing Score */}
            <div className="form-group">
              <label htmlFor="passingScore" className="block text-sm font-medium mb-1">
                Passing Score <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="passingScore"
                name="passingScore"
                value={formData.passingScore || 60}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                min={0}
                required
              />
            </div>

            {/* Weightage */}
            <div className="form-group">
              <label htmlFor="weightage" className="block text-sm font-medium mb-1">
                Weightage (%) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="weightage"
                name="weightage"
                value={formData.weightage || 10}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                min={0}
                max={100}
                required
              />
            </div>
          </div>

          {/* Instructions */}
          <div className="form-group">
            <label htmlFor="instructions" className="block text-sm font-medium mb-1">
              Instructions
            </label>
            <textarea
              id="instructions"
              name="instructions"
              value={formData.instructions || ''}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              rows={3}
            />
          </div>
        </div>

        {/* Questions Section */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Questions</h3>

          {/* Question Editor */}
          <QuestionEditor
            questions={formData.questions || []}
            onChange={handleQuestionsChange}
          />
        </div>

        {/* Bloom's Taxonomy Section */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Cognitive Level Distribution</h3>

          {/* Distribution Chart */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CognitiveDistributionChart
              distribution={formData.bloomsDistribution || {}}
            />

            <div className="space-y-4">
              <h4 className="text-lg font-medium">Analysis</h4>
              <div className="p-4 bg-gray-50 rounded">
                <p className="font-medium">
                  {bloomsAnalysis.isBalanced
                    ? '✅ Cognitive balance is good'
                    : '⚠️ Cognitive balance needs improvement'}
                </p>
                <ul className="mt-2 space-y-1 text-sm">
                  {bloomsAnalysis.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-4 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {initialData ? 'Update Assessment' : 'Create Assessment'}
          </button>
        </div>
      </form>
    </div>
  );
}
