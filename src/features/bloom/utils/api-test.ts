/**
 * API Test Utility
 *
 * This utility helps test the Google Generative AI configuration
 */

export async function testGeminiAPIConfiguration(): Promise<{ success: boolean; message: string; details?: any }> {
  try {
    // Use environment checker for detailed diagnostics
    const { checkEnvironmentVariables } = await import('./env-checker');
    const envCheck = checkEnvironmentVariables();

    if (!envCheck.hasApiKey) {
      return {
        success: false,
        message: 'No API key found in environment variables',
        details: envCheck
      };
    }

    // Get the API key
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
                   process.env.GEMINI_API_KEY ||
                   process.env.NEXT_PUBLIC_GOOGLE_API_KEY ||
                   process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      return {
        success: false,
        message: 'API key check passed but key not accessible',
        details: envCheck
      };
    }

    // Test API key format
    if (!envCheck.isValidFormat) {
      return {
        success: false,
        message: 'API key format appears invalid',
        details: envCheck
      };
    }

    // Try to import and initialize the library
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);

    // Test with a simple model initialization
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // Test with a very simple prompt
      const result = await model.generateContent("Say 'test' in one word");
      const response = result.response.text();

      if (response && response.trim().length > 0) {
        return {
          success: true,
          message: 'API configuration is working correctly',
          details: {
            ...envCheck,
            testResponse: response.substring(0, 50)
          }
        };
      } else {
        return {
          success: false,
          message: 'API responded but with empty content',
          details: { response }
        };
      }
    } catch (modelError: any) {
      return {
        success: false,
        message: 'Failed to test API call',
        details: {
          ...envCheck,
          error: modelError.message
        }
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to test API configuration',
      details: { error: error.message }
    };
  }
}

/**
 * Simple test function that can be called from the browser console
 */
export async function quickAPITest() {
  console.log('Testing Gemini API configuration...');
  const result = await testGeminiAPIConfiguration();
  console.log('Test result:', result);
  return result;
}
