'use client';

import AuthJsIntegrationTest from '@/components/auth/AUTH_JS_INTEGRATION_TEST';

export default function AuthTestPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Auth.js Integration Testing</h1>
      <AuthJsIntegrationTest />
    </div>
  );
} 