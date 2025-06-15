'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { api } from '@/trpc/react';

/**
 * API Test Component for debugging Gemini API issues
 */
export function APITestComponent() {
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Test API configuration mutation
  const testAPIMutation = api.bloom.testAPIConfiguration.useMutation({
    onSuccess: (result) => {
      setTestResult(result);
      setIsLoading(false);
    },
    onError: (error) => {
      setTestResult({
        success: false,
        message: error.message,
        details: { error: 'Mutation failed' }
      });
      setIsLoading(false);
    }
  });

  // Test learning outcomes generation
  const testGenerationMutation = api.bloom.generateLearningOutcomes.useMutation({
    onSuccess: (result) => {
      setTestResult({
        success: true,
        message: 'Learning outcomes generated successfully',
        details: { 
          outcomes: result,
          count: Array.isArray(result) ? result.length : 0
        }
      });
      setIsLoading(false);
    },
    onError: (error) => {
      setTestResult({
        success: false,
        message: error.message,
        details: { error: 'Generation failed' }
      });
      setIsLoading(false);
    }
  });

  const handleTestAPI = async () => {
    setIsLoading(true);
    setTestResult(null);
    await testAPIMutation.mutateAsync();
  };

  const handleTestGeneration = async () => {
    setIsLoading(true);
    setTestResult(null);
    await testGenerationMutation.mutateAsync({
      topic: 'Mathematics',
      level: 'UNDERSTAND',
      count: 2,
      customPrompt: 'Generate simple learning outcomes for basic math concepts'
    });
  };

  const getStatusIcon = () => {
    if (isLoading) return <Loader2 className="h-5 w-5 animate-spin" />;
    if (!testResult) return null;
    if (testResult.success) return <CheckCircle className="h-5 w-5 text-green-500" />;
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getStatusColor = () => {
    if (!testResult) return 'border-gray-200';
    return testResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50';
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            API Diagnostics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={handleTestAPI}
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Test API Configuration
            </Button>
            
            <Button 
              onClick={handleTestGeneration}
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Test Generation
            </Button>
          </div>

          {testResult && (
            <Card className={`${getStatusColor()}`}>
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  {getStatusIcon()}
                  <div className="flex-1">
                    <h4 className="font-medium mb-2">
                      {testResult.success ? 'Success' : 'Error'}
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">
                      {testResult.message}
                    </p>
                    
                    {testResult.details && (
                      <details className="text-xs">
                        <summary className="cursor-pointer font-medium mb-2">
                          Details
                        </summary>
                        <pre className="bg-gray-100 p-2 rounded overflow-auto">
                          {JSON.stringify(testResult.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This component helps diagnose API configuration issues. If tests fail, check:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Environment variables (GEMINI_API_KEY or NEXT_PUBLIC_GEMINI_API_KEY)</li>
                <li>API key validity and permissions</li>
                <li>Network connectivity</li>
                <li>API quotas and rate limits</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
