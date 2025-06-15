'use client';

import { useState } from 'react';
import { api } from '@/utils/api';
import { Button } from '@/components/ui/button';

export function TestTrpc() {
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const testTrpc = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Create a direct client for testing
      const client = api.createClient({
        links: [
          {
            async request({ op, next }) {
              try {
                const res = await fetch('/api/trpc/' + op.path, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    input: op.input,
                  }),
                });
                
                const text = await res.text();
                setResult(`Response: ${text}`);
                
                // Continue with the regular flow
                return next(op);
              } catch (error) {
                setError(`Error: ${error instanceof Error ? error.message : String(error)}`);
                throw error;
              }
            },
          },
        ],
      });

      // Try a simple query
      const result = await client.example.hello.query({ text: 'Test' });
      setResult(`Success: ${JSON.stringify(result)}`);
    } catch (error) {
      setError(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg space-y-4">
      <h2 className="text-lg font-semibold">Test tRPC Connection</h2>
      <Button onClick={testTrpc} disabled={loading}>
        {loading ? 'Testing...' : 'Test tRPC'}
      </Button>
      {result && <div className="p-2 bg-green-50 text-green-800 rounded">{result}</div>}
      {error && <div className="p-2 bg-red-50 text-red-800 rounded">{error}</div>}
    </div>
  );
} 