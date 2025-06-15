"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/trpc/react";
import { LeaderboardEntityType, TimeGranularity } from "@/features/leaderboard/types/standard-leaderboard";

export default function LeaderboardTest() {
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Test the unified leaderboard API
  const testUnifiedLeaderboard = async () => {
    setIsLoading(true);
    try {
      const result = await api.unifiedLeaderboard.getLeaderboard.query({
        type: LeaderboardEntityType.CLASS,
        referenceId: "class-1", // This is a mock ID
        timeGranularity: TimeGranularity.WEEKLY,
        limit: 10,
        offset: 0,
        includeCurrentStudent: false,
        sortBy: 'rank',
        sortDirection: 'asc'
      });
      setTestResults(result);
    } catch (error) {
      console.error("Error testing unified leaderboard:", error);
      setTestResults({ error: "Failed to test unified leaderboard" });
    } finally {
      setIsLoading(false);
    }
  };

  // Test the leaderboard trends API
  const testLeaderboardTrends = async () => {
    setIsLoading(true);
    try {
      const result = await api.leaderboard.getLeaderboardTrends.query({
        type: LeaderboardEntityType.CLASS,
        referenceId: "class-1", // This is a mock ID
        timeGranularity: TimeGranularity.WEEKLY,
        months: 6
      });
      setTestResults(result);
    } catch (error) {
      console.error("Error testing leaderboard trends:", error);
      setTestResults({ error: "Failed to test leaderboard trends" });
    } finally {
      setIsLoading(false);
    }
  };

  // Test the correlation analysis API
  const testCorrelationAnalysis = async () => {
    setIsLoading(true);
    try {
      const result = await api.analytics.getLeaderboardCorrelation.query({
        entityType: LeaderboardEntityType.CLASS,
        entityId: "class-1", // This is a mock ID
        timeframe: "weekly"
      });
      setTestResults(result);
    } catch (error) {
      console.error("Error testing correlation analysis:", error);
      setTestResults({ error: "Failed to test correlation analysis" });
    } finally {
      setIsLoading(false);
    }
  };

  // Test the cohort comparison API
  const testCohortComparison = async () => {
    setIsLoading(true);
    try {
      const result = await api.analytics.getCohortComparison.query({
        entityType: LeaderboardEntityType.CLASS,
        entityId: "class-1", // This is a mock ID
        timeframe: "weekly"
      });
      setTestResults(result);
    } catch (error) {
      console.error("Error testing cohort comparison:", error);
      setTestResults({ error: "Failed to test cohort comparison" });
    } finally {
      setIsLoading(false);
    }
  };

  // Test the intervention suggestions API
  const testInterventionSuggestions = async () => {
    setIsLoading(true);
    try {
      const result = await api.analytics.getInterventionSuggestions.query({
        entityType: LeaderboardEntityType.CLASS,
        entityId: "class-1", // This is a mock ID
        timeframe: "weekly"
      });
      setTestResults(result);
    } catch (error) {
      console.error("Error testing intervention suggestions:", error);
      setTestResults({ error: "Failed to test intervention suggestions" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Leaderboard API Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={testUnifiedLeaderboard} disabled={isLoading}>
              Test Unified Leaderboard
            </Button>
            <Button onClick={testLeaderboardTrends} disabled={isLoading}>
              Test Leaderboard Trends
            </Button>
            <Button onClick={testCorrelationAnalysis} disabled={isLoading}>
              Test Correlation Analysis
            </Button>
            <Button onClick={testCohortComparison} disabled={isLoading}>
              Test Cohort Comparison
            </Button>
            <Button onClick={testInterventionSuggestions} disabled={isLoading}>
              Test Intervention Suggestions
            </Button>
          </div>

          {isLoading && <div>Loading...</div>}

          {testResults && (
            <Card>
              <CardHeader>
                <CardTitle>Test Results</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96">
                  {JSON.stringify(testResults, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
