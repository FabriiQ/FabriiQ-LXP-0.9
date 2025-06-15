'use client';

import React, { useState } from 'react';
import { 
  ClassMasteryAnalytics, 
  BloomsTaxonomyLevel,
  MasteryLevel
} from '../../types';
import { BLOOMS_LEVEL_METADATA } from '../../constants/bloom-levels';
import { MASTERY_LEVEL_COLORS } from '../../constants/mastery-thresholds';
import { MasteryRadarChart } from './MasteryRadarChart';
import { MasteryLeaderboard } from './MasteryLeaderboard';
import { useTrpcMastery } from '../../hooks/useTrpcMastery';

interface ClassMasteryDashboardProps {
  classId: string;
  className: string;
  subjectId?: string;
  initialAnalytics?: ClassMasteryAnalytics;
  showLeaderboards?: boolean;
  showDistribution?: boolean;
  containerClassName?: string;
}

/**
 * Component for displaying class mastery analytics
 * 
 * This component follows mobile-first design principles and aligns with existing UI/UX.
 */
export function ClassMasteryDashboard({
  classId,
  className: classDisplayName,
  subjectId,
  initialAnalytics,
  showLeaderboards = true,
  showDistribution = true,
  containerClassName = '',
}: ClassMasteryDashboardProps) {
  // State for active tab
  const [activeTab, setActiveTab] = useState<'overview' | 'topics' | 'students' | 'gaps'>('overview');
  
  // Get class analytics
  const { data: analytics, isLoading } = useTrpcMastery().getClassAnalytics(
    classId,
    subjectId
  );
  
  // Get leaderboards if enabled
  const { data: leaderboards, isLoading: isLoadingLeaderboards } = useTrpcMastery().getPartitionedMastery(
    {
      partitionType: 'class',
      classId,
      limit: 10
    },
    {
      enabled: showLeaderboards
    }
  );
  
  // Use initial analytics if provided and data is loading
  const displayAnalytics = analytics || initialAnalytics;
  
  // If no analytics are available, show loading or empty state
  if (!displayAnalytics) {
    return (
      <div className={`p-4 bg-white dark:bg-gray-800 rounded-lg shadow ${containerClassName}`}>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500 dark:text-gray-400">
              Loading class analytics...
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="text-gray-500 dark:text-gray-400 mb-2">
              No class mastery data available
            </div>
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center max-w-md">
              Students need to complete assessments to generate mastery data.
            </p>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${containerClassName}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Class Mastery Analytics
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {classDisplayName}'s mastery across Bloom's Taxonomy levels
            </p>
          </div>
          
          <div className="mt-2 md:mt-0 flex items-center">
            <div 
              className="px-3 py-1 rounded-full text-white font-medium text-sm"
              style={{ backgroundColor: MASTERY_LEVEL_COLORS[getMasteryLevel(displayAnalytics.overallMastery)] }}
            >
              {Math.round(displayAnalytics.overallMastery)}% Class Average
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
              activeTab === 'topics'
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('topics')}
          >
            Topics
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'students'
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('students')}
          >
            Students
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
                Class Bloom's Taxonomy Mastery
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
            
            {/* Mastery Distribution */}
            {showDistribution && (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Mastery Level Distribution
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {Object.values(MasteryLevel).map((level) => {
                    const count = displayAnalytics.masteryDistribution?.[level] || 0;
                    const percentage = displayAnalytics.studentCount > 0
                      ? Math.round((count / displayAnalytics.studentCount) * 100)
                      : 0;
                    
                    return (
                      <div 
                        key={level}
                        className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm"
                        style={{ borderLeft: `4px solid ${MASTERY_LEVEL_COLORS[level]}` }}
                      >
                        <div className="text-lg font-bold" style={{ color: MASTERY_LEVEL_COLORS[level] }}>
                          {count}
                        </div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {level}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {percentage}% of class
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Leaderboards */}
            {showLeaderboards && leaderboards && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Class Leaderboard
                </h3>
                <MasteryLeaderboard
                  entries={leaderboards.entries}
                  title={`${classDisplayName} Leaderboard`}
                  limit={10}
                  showBloomsLevels={true}
                />
              </div>
            )}
          </div>
        )}
        
        {/* Topics Tab */}
        {activeTab === 'topics' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Mastery by Topic
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayAnalytics.topicMastery.map((topic) => (
                <div 
                  key={topic.topicId}
                  className="bg-white dark:bg-gray-800 border rounded-lg overflow-hidden shadow-sm"
                  style={{ borderColor: MASTERY_LEVEL_COLORS[getMasteryLevel(topic.averageMastery)] }}
                >
                  <div 
                    className="px-4 py-3"
                    style={{ backgroundColor: `${MASTERY_LEVEL_COLORS[getMasteryLevel(topic.averageMastery)]}20` }}
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {topic.topicName}
                      </h4>
                      <div className="text-xl font-bold" style={{ color: MASTERY_LEVEL_COLORS[getMasteryLevel(topic.averageMastery)] }}>
                        {Math.round(topic.averageMastery)}%
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3">
                    <div className="space-y-2">
                      {Object.entries(topic.bloomsLevels).map(([level, value]) => (
                        <div key={level} className="flex items-center justify-between">
                          <div className="text-xs font-medium" style={{ color: BLOOMS_LEVEL_METADATA[level as BloomsTaxonomyLevel].color }}>
                            {BLOOMS_LEVEL_METADATA[level as BloomsTaxonomyLevel].name}
                          </div>
                          <div className="text-xs text-gray-700 dark:text-gray-300">
                            {Math.round(value)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Student Mastery
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Overall
                    </th>
                    {Object.values(BloomsTaxonomyLevel).map((level) => (
                      <th 
                        key={level}
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                        style={{ color: BLOOMS_LEVEL_METADATA[level].color }}
                      >
                        {BLOOMS_LEVEL_METADATA[level].name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-800">
                  {displayAnalytics.studentMastery.map((student) => (
                    <tr key={student.studentId}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            {student.studentName.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {student.studentName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div 
                          className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                          style={{ 
                            backgroundColor: `${MASTERY_LEVEL_COLORS[getMasteryLevel(student.overallMastery)]}20`,
                            color: MASTERY_LEVEL_COLORS[getMasteryLevel(student.overallMastery)]
                          }}
                        >
                          {Math.round(student.overallMastery)}%
                        </div>
                      </td>
                      {Object.values(BloomsTaxonomyLevel).map((level) => (
                        <td key={level} className="px-6 py-4 whitespace-nowrap">
                          <div 
                            className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                            style={{ 
                              backgroundColor: `${BLOOMS_LEVEL_METADATA[level].color}20`,
                              color: BLOOMS_LEVEL_METADATA[level].color
                            }}
                          >
                            {Math.round(student.bloomsLevels[level] || 0)}%
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Gaps Tab */}
        {activeTab === 'gaps' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Class Mastery Gaps
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
                          {Math.round(gap.averageMastery)}%
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
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-3 mb-2">
                        Struggling Students:
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {gap.strugglingStudents.map((student) => (
                          <div
                            key={student.studentId}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-700 dark:text-gray-300"
                          >
                            {student.studentName} ({Math.round(student.mastery)}%)
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
                  No significant class mastery gaps detected.
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
