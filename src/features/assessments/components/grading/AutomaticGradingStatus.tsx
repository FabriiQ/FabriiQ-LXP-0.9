'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Activity,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  RefreshCw
} from 'lucide-react';

interface AutomaticGradingStatusProps {
  submission: {
    id: string;
    status: string;
    score?: number | null;
    gradedAt?: Date | null;
    metadata?: any;
  };
  onRequestManualReview?: () => void;
  onAcceptAIGrading?: () => void;
  onRejectAIGrading?: () => void;
  readOnly?: boolean;
}

export const AutomaticGradingStatus: React.FC<AutomaticGradingStatusProps> = ({
  submission,
  onRequestManualReview,
  onAcceptAIGrading,
  onRejectAIGrading,
  readOnly = false
}) => {
  const metadata = submission.metadata as any;
  const gradingType = metadata?.gradingType;
  const aiGrading = metadata?.aiGrading;
  const isAutomaticallyGraded = gradingType === 'AUTOMATIC_AI';
  const isManuallyGraded = gradingType === 'MANUAL';
  const hasAIGrading = !!aiGrading;

  if (!isAutomaticallyGraded && !hasAIGrading) {
    return null;
  }

  const getGradingStatusIcon = () => {
    if (isAutomaticallyGraded) {
      return <Activity className="h-5 w-5 text-blue-600" />;
    }
    if (isManuallyGraded) {
      return <User className="h-5 w-5 text-green-600" />;
    }
    return <Clock className="h-5 w-5 text-yellow-600" />;
  };

  const getGradingStatusText = () => {
    if (isAutomaticallyGraded) {
      return 'Automatically Graded by AI';
    }
    if (isManuallyGraded) {
      return 'Manually Graded by Teacher';
    }
    return 'Pending Grading';
  };

  const getGradingStatusColor = () => {
    if (isAutomaticallyGraded) return 'blue';
    if (isManuallyGraded) return 'green';
    return 'yellow';
  };

  const getConfidenceLevel = () => {
    if (!aiGrading?.confidence) return null;
    const confidence = Math.round(aiGrading.confidence * 100);
    
    if (confidence >= 80) return { level: 'High', color: 'green' };
    if (confidence >= 60) return { level: 'Medium', color: 'yellow' };
    return { level: 'Low', color: 'red' };
  };

  const confidenceInfo = getConfidenceLevel();

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getGradingStatusIcon()}
            <CardTitle className="text-lg">{getGradingStatusText()}</CardTitle>
          </div>
          <Badge 
            variant={getGradingStatusColor() === 'blue' ? 'default' : 'secondary'}
            className={
              getGradingStatusColor() === 'green' ? 'bg-green-100 text-green-800' :
              getGradingStatusColor() === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
              ''
            }
          >
            {gradingType || 'PENDING'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isAutomaticallyGraded && (
          <>
            {/* AI Grading Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 border rounded-md">
                <div className="text-2xl font-bold text-blue-600">
                  {submission.score || 0}
                </div>
                <div className="text-sm text-muted-foreground">AI Score</div>
              </div>
              {confidenceInfo && (
                <div className="text-center p-3 border rounded-md">
                  <div className={`text-2xl font-bold ${
                    confidenceInfo.color === 'green' ? 'text-green-600' :
                    confidenceInfo.color === 'yellow' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {Math.round(aiGrading.confidence * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {confidenceInfo.level} Confidence
                  </div>
                </div>
              )}
            </div>

            {/* Grading Details */}
            {submission.gradedAt && (
              <div className="text-sm text-muted-foreground">
                <Clock className="h-4 w-4 inline mr-1" />
                Graded on {submission.gradedAt.toLocaleString()}
              </div>
            )}

            {/* Confidence Warning */}
            {confidenceInfo && confidenceInfo.color === 'red' && (
              <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                  <strong>Low Confidence:</strong> The AI grading has low confidence. 
                  Manual review is recommended.
                </AlertDescription>
              </Alert>
            )}

            {/* Manual Review Recommendation */}
            {metadata?.reviewRecommendation?.recommendManualReview && (
              <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800 dark:text-orange-200">
                  <strong>Review Recommended:</strong> 
                  {metadata.reviewRecommendation.reasons.join(', ')}
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            {!readOnly && (
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-2">
                  {onRequestManualReview && (
                    <Button variant="outline" size="sm" onClick={onRequestManualReview}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Manual Review
                    </Button>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  {onRejectAIGrading && (
                    <Button variant="outline" size="sm" onClick={onRejectAIGrading}>
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Reject AI Grade
                    </Button>
                  )}
                  {onAcceptAIGrading && (
                    <Button size="sm" onClick={onAcceptAIGrading}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Accept AI Grade
                    </Button>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* AI Assistance Available (not automatically graded) */}
        {!isAutomaticallyGraded && hasAIGrading && (
          <div className="p-3 border rounded-md bg-blue-50 dark:bg-blue-900/20">
            <div className="flex items-center space-x-2 mb-2">
              <Activity className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                AI Grading Suggestions Available
              </span>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              AI has analyzed this essay and provided grading suggestions. 
              Check the "AI Assist" tab for detailed recommendations.
            </p>
            {confidenceInfo && (
              <div className="mt-2">
                <Badge variant="outline" className="text-xs">
                  AI Confidence: {Math.round(aiGrading.confidence * 100)}%
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* AI Model Information */}
        {aiGrading?.model && (
          <div className="text-xs text-muted-foreground">
            Graded using: {aiGrading.model}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
