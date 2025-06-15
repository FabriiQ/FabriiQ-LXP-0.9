/**
 * Environment Variable Checker
 * 
 * Utility to check and validate environment variables for AI services
 */

export interface EnvCheckResult {
  hasApiKey: boolean;
  keySource: string | null;
  keyPrefix: string | null;
  isValidFormat: boolean;
  availableVars: string[];
  recommendations: string[];
}

/**
 * Check environment variables for AI API configuration
 */
export function checkEnvironmentVariables(): EnvCheckResult {
  const result: EnvCheckResult = {
    hasApiKey: false,
    keySource: null,
    keyPrefix: null,
    isValidFormat: false,
    availableVars: [],
    recommendations: []
  };

  // List of possible API key environment variable names
  const possibleKeys = [
    'NEXT_PUBLIC_GEMINI_API_KEY',
    'GEMINI_API_KEY',
    'NEXT_PUBLIC_GOOGLE_API_KEY',
    'GOOGLE_API_KEY',
    'GOOGLE_GENERATIVE_AI_API_KEY'
  ];

  // Check which environment variables are available
  result.availableVars = Object.keys(process.env).filter(key => 
    key.includes('API') || key.includes('GEMINI') || key.includes('GOOGLE')
  );

  // Try to find an API key
  let apiKey: string | undefined;
  let keySource: string | undefined;

  for (const keyName of possibleKeys) {
    const value = process.env[keyName];
    if (value && value.trim().length > 0) {
      apiKey = value;
      keySource = keyName;
      break;
    }
  }

  if (apiKey && keySource) {
    result.hasApiKey = true;
    result.keySource = keySource;
    result.keyPrefix = apiKey.substring(0, 10) + '...';
    
    // Check if the API key format looks valid (Google API keys typically start with "AIza")
    result.isValidFormat = apiKey.startsWith('AIza') && apiKey.length > 30;
    
    if (!result.isValidFormat) {
      result.recommendations.push('API key format appears invalid. Google API keys should start with "AIza" and be longer than 30 characters.');
    }
  } else {
    result.recommendations.push('No API key found. Please set one of: ' + possibleKeys.join(', '));
  }

  // Additional recommendations
  if (result.availableVars.length === 0) {
    result.recommendations.push('No API-related environment variables found. Check your .env file.');
  }

  if (typeof window !== 'undefined' && result.keySource?.startsWith('NEXT_PUBLIC_')) {
    result.recommendations.push('Using client-side API key. Consider using server-side key for security.');
  }

  return result;
}

/**
 * Get a formatted report of environment variable status
 */
export function getEnvironmentReport(): string {
  const result = checkEnvironmentVariables();
  
  let report = '=== Environment Variables Report ===\n\n';
  
  report += `API Key Found: ${result.hasApiKey ? '✅' : '❌'}\n`;
  if (result.keySource) {
    report += `Key Source: ${result.keySource}\n`;
    report += `Key Preview: ${result.keyPrefix}\n`;
    report += `Valid Format: ${result.isValidFormat ? '✅' : '❌'}\n`;
  }
  
  report += `\nAvailable Environment Variables:\n`;
  if (result.availableVars.length > 0) {
    result.availableVars.forEach(varName => {
      report += `  - ${varName}\n`;
    });
  } else {
    report += '  (none found)\n';
  }
  
  if (result.recommendations.length > 0) {
    report += `\nRecommendations:\n`;
    result.recommendations.forEach((rec, index) => {
      report += `  ${index + 1}. ${rec}\n`;
    });
  }
  
  return report;
}

/**
 * Log environment status to console (for debugging)
 */
export function logEnvironmentStatus(): void {
  console.log(getEnvironmentReport());
}
