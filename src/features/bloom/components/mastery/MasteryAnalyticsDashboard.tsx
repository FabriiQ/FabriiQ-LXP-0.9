'use client';

import React, { useState } from 'react';
import {
  StudentMasteryAnalytics,
  BloomsTaxonomyLevel,
  MasteryLevel
} from '../../types';
import { BLOOMS_LEVEL_METADATA } from '../../constants/bloom-levels';
import { MASTERY_LEVEL_COLORS } from '../../constants/mastery-thresholds';
import { MasteryRadarChart } from './MasteryRadarChart';
import { TopicMasteryCard } from './TopicMasteryCard';
import { MasteryLeaderboard } from './MasteryLeaderboard';
import { useTrpcMastery } from '../../hooks/useTrpcMastery';

interface MasteryAnalyticsDashboardProps {
  studentId: string;
  studentName: string;
  subjectId?: string;
  initialAnalytics?: StudentMasteryAnalytics;
  showLeaderboards?: boolean;
  showRecommendations?: boolean;
  showGrowth?: boolean;
  className?: string;
}

/**
 * Component for displaying student mastery analytics
 *
 * This component follows mobile-first design principles and aligns with existing UI/UX.
 */
export function MasteryAnalyticsDashboard({
  studentId,
  studentName,
  subjectId,
  initialAnalytics,
  showLeaderboards = true,
  showRecommendations = true,
  showGrowth = true,
  className = '',
}: MasteryAnalyticsDashboardProps) {
  // State for active tab
  const [activeTab, setActiveTab] = useState<'overview' | 'subjects' | 'gaps' | 'recommendations'>('overview');

  // Get student analytics
  const { data: analytics, isLoading } = useTrpcMastery().getStudentAnalytics(
    studentId,
    subjectId
  );

  // Get leaderboards if enabled
  const { data: leaderboards, isLoading: isLoadingLeaderboards } = useTrpcMastery().getStudentDashboardLeaderboards(
    studentId,
    subjectId,
    undefined, // topicId
    undefined  // classId
  );

  // Use initial analytics if provided and data is loading
  const displayAnalytics = analytics || initialAnalytics;

  // If no analytics are available, show loading or empty state
  if (!displayAnalytics) {
    return (
      <div className={`p-4 bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500 dark:text-gray-400">
              Loading mastery analytics...
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="text-gray-500 dark:text-gray-400 mb-2">
              No mastery data available
            </div>
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center max-w-md">
              Complete assessments to start tracking your mastery across Bloom's Taxonomy levels.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Mastery Analytics
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {studentName}'s mastery across Bloom's Taxonomy levels
            </p>
          </div>

          <div className="mt-2 md:mt-0 flex items-center">
            <div
              className="px-3 py-1 rounded-full text-white font-medium text-sm"
              style={{ backgroundColor: MASTERY_LEVEL_COLORS[getMasteryLevel(displayAnalytics.overallMastery)] }}
            >
              {Math.round(displayAnalytics.overallMastery)}% Overall Mastery
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex overflow-x-auto scrollbar-hide">
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'overview'
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'subjects'
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('subjects')}
          >
            Subjects
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'gaps'
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('gaps')}
          >
            Mastery Gaps
          </button>
          {showRecommendations && (
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'recommendations'
                  ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('recommendations')}
            >
              Recommendations
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Bloom's Levels Radar Chart */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                Bloom's Taxonomy Mastery
              </h3>
              <div className="flex justify-center">
                <MasteryRadarChart
                  data={displayAnalytics.bloomsLevels}
                  size={300}
                  showLabels={true}
                  showValues={true}
                />
              </div>
            </div>

            {/* Growth Section */}
            {showGrowth && displayAnalytics.growth && (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Growth (Past {displayAnalytics.growth.period})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                    <div className="text-2xl font-bold text-center">
                      {displayAnalytics.growth.overall > 0 ? '+' : ''}
                      {displayAnalytics.growth.overall}%
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                      Overall Growth
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                    <div className="space-y-2">
                      {Object.entries(displayAnalytics.growth.byBloomsLevel).map(([level, growth]) => (
                        <div key={level} className="flex items-center justify-between">
                          <div className="text-sm font-medium" style={{ color: BLOOMS_LEVEL_METADATA[level as BloomsTaxonomyLevel].color }}>
                            {BLOOMS_LEVEL_METADATA[level as BloomsTaxonomyLevel].name}
                          </div>
                          <div className={`text-sm font-medium ${
                            growth > 0 ? 'text-green-600 dark:text-green-400' :
                            growth < 0 ? 'text-red-600 dark:text-red-400' :
                            'text-gray-500 dark:text-gray-400'
                          }`}>
                            {growth > 0 ? '+' : ''}
                            {growth}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Leaderboards */}
            {showLeaderboards && leaderboards && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Leaderboards
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Global Leaderboard */}
                  {leaderboards.global && (
                    <MasteryLeaderboard
                      entries={leaderboards.global.entries}
                      title="Global Leaderboard"
                      limit={5}
                      highlightUserId={studentId}
                    />
                  )}

                  {/* Subject Leaderboard */}
                  {subjectId && leaderboards[`subject_${subjectId}`] && (
                    <MasteryLeaderboard
                      entries={leaderboards[`subject_${subjectId}`].entries}
                      title={`${leaderboards[`subject_${subjectId}`].partitionName} Leaderboard`}
                      limit={5}
                      highlightUserId={studentId}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Subjects Tab */}
        {activeTab === 'subjects' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Mastery by Subject
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayAnalytics.masteryBySubject.map((subject) => (
                <div
                  key={subject.subjectId}
                  className="bg-white dark:bg-gray-800 border rounded-lg overflow-hidden shadow-sm"
                  style={{ borderColor: MASTERY_LEVEL_COLORS[getMasteryLevel(subject.mastery)] }}
                >
                  <div
                    className="px-4 py-3"
                    style={{ backgroundColor: `${MASTERY_LEVEL_COLORS[getMasteryLevel(subject.mastery)]}20` }}
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {subject.subjectName}
                      </h4>
                      <div className="text-xl font-bold" style={{ color: MASTERY_LEVEL_COLORS[getMasteryLevel(subject.mastery)] }}>
                        {Math.round(subject.mastery)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gaps Tab */}
        {activeTab === 'gaps' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Mastery Gaps
            </h3>
            {displayAnalytics.masteryGaps.length > 0 ? (
              <div className="space-y-4">
                {displayAnalytics.masteryGaps.map((gap) => (
                  <div
                    key={gap.topicId}
                    className="bg-white dark:bg-gray-800 border border-yellow-300 rounded-lg overflow-hidden shadow-sm"
                  >
                    <div className="px-4 py-3 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-300">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {gap.topicName}
                        </h4>
                        <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                          {Math.round(gap.currentMastery)}%
                        </div>
                      </div>
                    </div>
                    <div className="px-4 py-3">
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Bloom's Level Gaps:
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {gap.bloomsLevelGaps.map((level) => (
                          <div
                            key={level}
                            className="px-2 py-1 rounded-full text-xs"
                            style={{
                              backgroundColor: `${BLOOMS_LEVEL_METADATA[level].color}20`,
                              color: BLOOMS_LEVEL_METADATA[level].color,
                            }}
                          >
                            {BLOOMS_LEVEL_METADATA[level].name}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  No significant mastery gaps detected.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && showRecommendations && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Recommendations
            </h3>
            {displayAnalytics.recommendations.length > 0 ? (
              <div className="space-y-4">
                {displayAnalytics.recommendations.map((recommendation, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-gray-800 border rounded-lg overflow-hidden shadow-sm"
                    style={{ borderColor: BLOOMS_LEVEL_METADATA[recommendation.bloomsLevel].color }}
                  >
                    <div
                      className="px-4 py-3 border-b"
                      style={{ borderColor: BLOOMS_LEVEL_METADATA[recommendation.bloomsLevel].color }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: BLOOMS_LEVEL_METADATA[recommendation.bloomsLevel].color }}
                          />
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            {BLOOMS_LEVEL_METADATA[recommendation.bloomsLevel].name} Level
                          </h4>
                        </div>
                        <div
                          className="px-2 py-0.5 rounded-full text-xs"
                          style={{
                            backgroundColor: recommendation.type === 'practice' ? '#EBF5FF' : '#F0FDF4',
                            color: recommendation.type === 'practice' ? '#1E40AF' : '#166534',
                          }}
                        >
                          {recommendation.type}
                        </div>
                      </div>
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {recommendation.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  No recommendations available at this time.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to get mastery level
function getMasteryLevel(percentage: number): MasteryLevel {
  if (percentage >= 90) {
    return MasteryLevel.EXPERT;
  } else if (percentage >= 80) {
    return MasteryLevel.ADVANCED;
  } else if (percentage >= 70) {
    return MasteryLevel.PROFICIENT;
  } else if (percentage >= 60) {
    return MasteryLevel.DEVELOPING;
  } else {
    return MasteryLevel.NOVICE;
  }
}
