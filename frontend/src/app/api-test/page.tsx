"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function ApiTestPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testApi = async () => {
    setLoading(true);
    setResult('Testing...');
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      setResult(`API URL: ${apiUrl}\n\nTesting /health endpoint...`);
      
      const response = await fetch(`${apiUrl}/health`);
      const data = await response.json();
      
      setResult(`✅ Success!\n\nAPI URL: ${apiUrl}\nStatus: ${response.status}\nResponse: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setResult(`❌ Error!\n\n${error instanceof Error ? error.message : String(error)}\n\nMake sure:\n1. Backend is running: python -m uvicorn app.main:app --reload\n2. Backend is on port 8000\n3. CORS is enabled in backend`);
    } finally {
      setLoading(false);
    }
  };

  const testCategories = async () => {
    setLoading(true);
    setResult('Testing...');
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      setResult(`API URL: ${apiUrl}\n\nTesting /categories endpoint...`);
      
      const response = await fetch(`${apiUrl}/categories`);
      const data = await response.json();
      
      setResult(`✅ Success!\n\nAPI URL: ${apiUrl}\nStatus: ${response.status}\nCategories found: ${data.data?.length || 0}\nResponse: ${JSON.stringify(data, null, 2).substring(0, 500)}...`);
    } catch (error) {
      setResult(`❌ Error!\n\n${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">API Connection Test</h1>
        
        <Card className="p-6 space-y-4">
          <div className="space-y-2">
            <p><strong>Environment Variable:</strong></p>
            <code className="block bg-muted p-2 rounded">
              NEXT_PUBLIC_API_URL = {process.env.NEXT_PUBLIC_API_URL || 'NOT SET (using default: http://localhost:8000)'}
            </code>
          </div>
          
          <div className="flex gap-4">
            <Button onClick={testApi} disabled={loading}>
              Test /health
            </Button>
            <Button onClick={testCategories} disabled={loading}>
              Test /categories
            </Button>
          </div>
          
          {result && (
            <pre className="bg-muted p-4 rounded overflow-auto max-h-96 text-sm">
              {result}
            </pre>
          )}
        </Card>
        
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Troubleshooting Steps</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Make sure backend is running: <code className="bg-muted px-2 py-1 rounded">cd backend && python -m uvicorn app.main:app --reload</code></li>
            <li>Check backend is accessible: <code className="bg-muted px-2 py-1 rounded">curl http://localhost:8000/health</code></li>
            <li>Restart Next.js dev server to pick up environment variables</li>
            <li>Check browser console for CORS errors</li>
            <li>Verify .env.local has NEXT_PUBLIC_API_URL set</li>
          </ol>
        </Card>
      </div>
    </div>
  );
}
