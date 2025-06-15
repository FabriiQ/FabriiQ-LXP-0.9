import { Metadata } from 'next';
import { APITestComponent } from '@/features/bloom/components/debug/APITestComponent';

export const metadata: Metadata = {
  title: 'API Test - Debug',
  description: 'Test and debug AI API configuration',
};

/**
 * API Test Debug Page
 * 
 * This page provides tools to test and debug the AI API configuration.
 * It helps diagnose issues with the Google Generative AI integration.
 */
export default function APITestPage() {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          AI API Configuration Test
        </h1>
        <p className="text-muted-foreground mt-2">
          Test and diagnose AI API configuration issues
        </p>
      </div>
      
      <APITestComponent />
    </div>
  );
}
