'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DatabaseConnectionErrorProps {
  message?: string;
  showRefresh?: boolean;
  showBackButton?: boolean;
  backPath?: string;
}

/**
 * Component to display when a database connection error occurs
 */
export function DatabaseConnectionError({
  message = 'Unable to connect to the database. Please check your database connection.',
  showRefresh = true,
  showBackButton = true,
  backPath = '/'
}: DatabaseConnectionErrorProps) {
  const router = useRouter();

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleBack = () => {
    router.push(backPath);
  };

  return (
    <div className="flex items-center justify-center min-h-[50vh] p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle>Database Connection Error</CardTitle>
          </div>
          <CardDescription>
            There was a problem connecting to the database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">{message}</p>
          <div className="bg-muted p-3 rounded-md text-sm">
            <p className="font-medium mb-1">Troubleshooting steps:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Check if your database server is running</li>
              <li>Verify your database connection string in .env file</li>
              <li>Ensure your database credentials are correct</li>
              <li>Check if your database server is accessible from your application</li>
            </ol>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          {showBackButton && (
            <Button variant="outline" onClick={handleBack}>
              Go Back
            </Button>
          )}
          {showRefresh && (
            <Button onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Connection
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
