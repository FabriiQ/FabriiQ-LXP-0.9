'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/trpc/react';
import { useToast } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading';
import { ArrowLeft, Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function FixCoordinatorProfilesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any>(null);

  // Create missing coordinator profiles mutation
  const createMissingProfiles = api.user.createMissingCoordinatorProfiles.useMutation({
    onSuccess: (data) => {
      setResults(data);
      setIsProcessing(false);
      toast({
        description: `Successfully created ${data.successCount} coordinator profiles`,
        variant: 'success'
      });
    },
    onError: (error) => {
      setIsProcessing(false);
      toast({
        description: error.message || 'Failed to create coordinator profiles',
        variant: 'error'
      });
    }
  });

  const handleFixProfiles = () => {
    setIsProcessing(true);
    createMissingProfiles.mutate();
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/campus/coordinators">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Fix Coordinator Profiles</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Missing Coordinator Profiles</CardTitle>
          <CardDescription>
            This utility will create coordinator profiles for all users with the role 'COORDINATOR' or 'CAMPUS_COORDINATOR' who don't already have a profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            If you have coordinators in the system but they don't appear in the coordinator management page, 
            they might be missing their coordinator profiles. This tool will fix that issue.
          </p>
          
          {results && (
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-muted/20">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{results.totalCoordinators}</p>
                      <p className="text-sm text-muted-foreground">Total Coordinators</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-muted/20">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{results.successCount}</p>
                      <p className="text-sm text-muted-foreground">Profiles Created</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {results.results.length > 0 && (
                <div className="border rounded-md overflow-hidden">
                  <div className="bg-muted px-4 py-2 font-medium">Results</div>
                  <div className="divide-y">
                    {results.results.map((result: any, index: number) => (
                      <div key={index} className="px-4 py-3 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{result.name || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">{result.email || result.userId}</p>
                        </div>
                        <div className="flex items-center">
                          {result.success ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <div className="flex items-center">
                              <XCircle className="h-5 w-5 text-red-600 mr-2" />
                              <span className="text-sm text-red-600">{result.error}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/campus/coordinators')}
          >
            Back to Coordinators
          </Button>
          <Button 
            onClick={handleFixProfiles} 
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Create Missing Profiles'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
