'use client'

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../atoms/button";
import { Input } from "../atoms/input";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useDebounce } from "@/hooks/use-debounce";
import { Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { signIn } from "next-auth/react";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required")
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const { isLoading: authLoading } = useAuth();
  
  // State declarations - all in one place at the top
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [loginAttempted, setLoginAttempted] = useState(false);
  const [formData, setFormData] = useState<LoginFormData>({
    username: "",
    password: ""
  });
  const [usernameValid, setUsernameValid] = useState<boolean | null>(null);
  const [passwordValid, setPasswordValid] = useState<boolean | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Refs
  const formRef = useRef<HTMLFormElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  
  // Derived state
  const isLoading = authLoading || localLoading;
  
  // Debounced values for validation
  const debouncedUsername = useDebounce(formData.username, 500);
  const debouncedPassword = useDebounce(formData.password, 500);

  // Initialize component
  useEffect(() => {
    // Set initialized after component mounts to prevent SSR issues
    setIsInitialized(true);
    
    // Focus the username input when the component mounts
    if (usernameRef.current) {
      setTimeout(() => {
        usernameRef.current?.focus();
      }, 100);
    }
  }, []);

  // Fix for clickability issues
  useEffect(() => {
    const fixClickability = () => {
      // Ensure all form elements are clickable
      const formElements = formRef.current?.querySelectorAll('input, button, a');
      formElements?.forEach(element => {
        if (element instanceof HTMLElement) {
          element.style.pointerEvents = 'auto';
        }
      });
    };

    // Run on mount and whenever the form might re-render
    if (isInitialized && formRef.current) {
      fixClickability();
    }
  }, [isInitialized, formData, error]);

  // Password validation effect
  useEffect(() => {
    if (!debouncedPassword || debouncedPassword.length === 0) {
      setPasswordValid(null);
      return;
    }
    
    const isValid = validatePassword(debouncedPassword);
    setPasswordValid(isValid);
    
    // Only enable auto-login if both fields are valid and not empty
    if (isValid && usernameValid && !loginAttempted) {
      if (submitButtonRef.current) {
        submitButtonRef.current.focus();
      }
      // Don't auto-login, just focus the button
    }
  }, [debouncedPassword, usernameValid, loginAttempted]);

  // Username validation effect
  useEffect(() => {
    if (!debouncedUsername || debouncedUsername.length === 0) {
      setUsernameValid(null);
      return;
    }
    
    const isValid = validateUsername(debouncedUsername);
    setUsernameValid(isValid);

    // Move focus to password field if username is valid
    if (isValid && passwordRef.current) {
      passwordRef.current.focus();
    }
  }, [debouncedUsername]);

  // Handle redirection after successful login
  useEffect(() => {
    if (loginSuccess) {
      // This effect handles redirection after successful login
      const redirectTimer = setTimeout(() => {
        console.log("Redirecting after successful login");
        router.push('/dashboard');
      }, 1000);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [loginSuccess, router]);

  // Validation functions
  const validateUsername = (username: string): boolean => {
    return username.trim().length > 0;
  };
  
  const validatePassword = (password: string): boolean => {
    return password.trim().length > 0;
  };
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Validate on change for better UX
    if (name === 'username') {
      setUsernameValid(validateUsername(value));
    } else if (name === 'password') {
      setPasswordValid(validatePassword(value));
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLocalLoading(true);
    setLoginAttempted(true);

    try {
      if (!formData.username || !formData.password) {
        throw new Error('Please enter both username and password.');
      }

      console.log('Attempting login with:', { 
        username: formData.username,
      });
      
      const result = await signIn('credentials', {
        username: formData.username,
        password: formData.password,
        redirect: false,
        callbackUrl: '/dashboard'
      });
      
      if (result?.error) {
        throw new Error(result.error);
      }
      
      if (result?.ok) {
        setLoginSuccess(true);
        
        // Redirect after successful login
        window.location.href = result.url || '/dashboard';
      }
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'Login failed. Please try again.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        // Try to extract error message from TRPC error
        const anyError = error as any;
        if (anyError.message) {
          errorMessage = anyError.message;
        } else if (anyError.data?.message) {
          errorMessage = anyError.data.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleButtonSubmit = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const form = formRef.current;
    if (form) {
      handleSubmit(new Event('submit') as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  // If not initialized yet, show a non-interactive form to prevent tRPC errors
  if (!isInitialized) {
    return (
      <div className="space-y-6 opacity-80">
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">
            Username
          </label>
          <div className="h-10 w-full rounded-md border border-input bg-background px-3 py-2"></div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">
            Password
          </label>
          <div className="h-10 w-full rounded-md border border-input bg-background px-3 py-2"></div>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Forgot password?</div>
          <div className="h-10 w-20 rounded-md bg-primary-400"></div>
        </div>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label
          htmlFor="username"
          className={cn(
            "text-sm font-medium leading-none flex items-center justify-between",
            usernameValid === false && "text-red-500"
          )}
        >
          Username
          {usernameValid !== null && formData.username.length > 0 && (
            <span className={cn(
              "transition-opacity duration-300",
              usernameValid ? "text-green-500" : "text-red-500"
            )}>
              {usernameValid ? (
                <CheckCircle className="h-4 w-4 animate-in fade-in-50" />
              ) : (
                <XCircle className="h-4 w-4 animate-in fade-in-50" />
              )}
            </span>
          )}
        </label>
        <input
          id="username"
          name="username"
          type="text"
          ref={usernameRef}
          required
          value={formData.username}
          onChange={handleChange}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2",
            "focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50",
            "transition-colors duration-200",
            usernameValid === false && formData.username.length > 0 ? "border-red-500 focus-visible:ring-red-500" : 
            usernameValid === true && formData.username.length > 0 ? "border-green-500 focus-visible:ring-green-500" : ""
          )}
          autoComplete="username"
          placeholder="Enter your username"
          style={{ pointerEvents: 'auto' }}
        />
        {usernameValid === false && formData.username.length > 0 && (
          <p className="text-xs text-red-500 animate-in fade-in-50">
            Username is required
          </p>
        )}
      </div>
      
      <div className="space-y-2">
        <label
          htmlFor="password"
          className={cn(
            "text-sm font-medium leading-none flex items-center justify-between",
            passwordValid === false && "text-red-500"
          )}
        >
          Password
          {passwordValid !== null && formData.password.length > 0 && (
            <span className={cn(
              "transition-opacity duration-300",
              passwordValid ? "text-green-500" : "text-red-500"
            )}>
              {passwordValid ? (
                <CheckCircle className="h-4 w-4 animate-in fade-in-50" />
              ) : (
                <XCircle className="h-4 w-4 animate-in fade-in-50" />
              )}
            </span>
          )}
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            ref={passwordRef}
            required
            value={formData.password}
            onChange={handleChange}
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background pr-10",
              "file:border-0 file:bg-transparent file:text-sm file:font-medium",
              "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2",
              "focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50",
              "transition-colors duration-200",
              passwordValid === false && formData.password.length > 0 ? "border-red-500 focus-visible:ring-red-500" : 
              passwordValid === true && formData.password.length > 0 ? "border-green-500 focus-visible:ring-green-500" : ""
            )}
            autoComplete="current-password"
            placeholder="Enter your password"
            style={{ pointerEvents: 'auto' }}
          />
          <button
            type="button"
            onClick={toggleShowPassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
            tabIndex={-1}
            style={{ pointerEvents: 'auto' }}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {passwordValid === false && formData.password.length > 0 && (
          <p className="text-xs text-red-500 animate-in fade-in-50">
            Password is required
          </p>
        )}
      </div>
      
      {error && 
       !error.toLowerCase().includes("username is required") && 
       !error.toLowerCase().includes("password is required") && (
        <div className="text-sm text-red-500 animate-in fade-in-50 bg-red-50 p-2 rounded-md border border-red-200">
          {error}
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="text-sm text-gray-600 hover:text-gray-900 hover:underline focus:outline-none"
            onClick={() => router.push("/forgot-password")}
            style={{ pointerEvents: 'auto' }}
          >
            Forgot password?
          </button>
        </div>
        
        <button 
          type="submit" 
          ref={submitButtonRef}
          className={cn(
            "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
            "h-10 px-4 py-2 transition-all duration-300",
            (usernameValid && passwordValid) 
              ? "bg-primary-600 hover:bg-primary-700 text-white" 
              : "bg-primary-400 text-white cursor-not-allowed",
            (isLoading) ? "opacity-70" : ""
          )}
          onClick={handleButtonSubmit}
          disabled={!(usernameValid && passwordValid)}
          style={{ pointerEvents: 'auto' }}
        >
          {(isLoading) ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </button>
      </div>
      
      {loginSuccess && (
        <div className="mt-4 p-2 bg-green-50 border border-green-200 rounded-md text-sm text-green-700 animate-in fade-in-50">
          Login successful! Redirecting to dashboard...
        </div>
      )}
    </form>
  );
} 
