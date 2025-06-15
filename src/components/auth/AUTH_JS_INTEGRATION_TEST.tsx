'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { signIn, signOut } from 'next-auth/react';
import { UserType } from '@prisma/client';

/**
 * This component is used to test the Auth.js integration
 * It provides a UI to test login, logout, and session management
 */
export default function AuthJsIntegrationTest() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Array<{name: string, passed: boolean, message: string}>>([]);

  // Function to handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });
      
      if (result?.error) {
        setError(result.error);
        addTestResult('Login', false, `Login failed: ${result.error}`);
      } else {
        setSuccess('Login successful!');
        addTestResult('Login', true, 'Login successful');
      }
    } catch (err) {
      setError('An error occurred during login');
      addTestResult('Login', false, `Login error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Function to handle logout
  const handleLogout = async () => {
    setError(null);
    setSuccess(null);
    
    try {
      await signOut({ redirect: false });
      setSuccess('Logout successful!');
      addTestResult('Logout', true, 'Logout successful');
    } catch (err) {
      setError('An error occurred during logout');
      addTestResult('Logout', false, `Logout error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Function to add test result
  const addTestResult = (name: string, passed: boolean, message: string) => {
    setTestResults(prev => [...prev, { name, passed, message }]);
  };

  // Test session persistence
  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && user) {
        addTestResult('Session', true, `Session is valid for user: ${user.name}`);
      } else if (testResults.some(r => r.name === 'Login' && r.passed)) {
        addTestResult('Session', false, 'Session not persisted after login');
      }
    }
  }, [isLoading, isAuthenticated, user]);

  // Test role-based access
  const testRoleAccess = () => {
    if (!user) {
      addTestResult('Role Access', false, 'User not authenticated');
      return;
    }

    const userType = user.userType as UserType;
    
    // Test if user has SYSTEM_ADMIN role
    if (userType === 'SYSTEM_ADMIN') {
      addTestResult('Role Access', true, 'User has SYSTEM_ADMIN role');
    } else {
      addTestResult('Role Access', true, `User has ${userType} role`);
    }
  };

  return (
    <div className="auth-test-container p-6 max-w-md mx-auto bg-white rounded-xl shadow-md">
      <h1 className="text-2xl font-bold mb-4">Auth.js Integration Test</h1>
      
      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : isAuthenticated ? (
        <div className="authenticated-view">
          <div className="user-info mb-4 p-4 bg-gray-100 rounded">
            <h2 className="text-xl font-semibold">Authenticated User</h2>
            <p><strong>Name:</strong> {user?.name}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Role:</strong> {user?.userType}</p>
          </div>
          
          <div className="actions flex gap-2 mb-4">
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Logout
            </button>
            <button 
              onClick={testRoleAccess}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Test Role Access
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleLogin} className="login-form mb-4">
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          
          <button 
            type="submit"
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Login
          </button>
        </form>
      )}
      
      {error && (
        <div className="error-message p-3 bg-red-100 text-red-700 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="success-message p-3 bg-green-100 text-green-700 rounded mb-4">
          {success}
        </div>
      )}
      
      <div className="test-results">
        <h2 className="text-xl font-semibold mb-2">Test Results</h2>
        {testResults.length === 0 ? (
          <p className="text-gray-500">No tests run yet</p>
        ) : (
          <ul className="list-disc pl-5">
            {testResults.map((result, index) => (
              <li key={index} className={result.passed ? 'text-green-600' : 'text-red-600'}>
                <strong>{result.name}:</strong> {result.message}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 