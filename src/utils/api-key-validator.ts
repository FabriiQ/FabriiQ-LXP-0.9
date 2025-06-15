/**
 * Utility functions for validating API keys
 */

/**
 * Validates a Google Generative AI API key by making a test request
 * @param apiKey The API key to validate
 * @returns A promise that resolves to true if the API key is valid, false otherwise
 */
export async function validateGoogleApiKey(apiKey: string): Promise<boolean> {
  if (!apiKey) return false;
  
  try {
    // Import the Google Generative AI library
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    
    // Initialize the API client with the key to test
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Make a simple test request
    const result = await model.generateContent("Hello, please respond with 'API key is valid'");
    const response = result.response.text();
    
    // Check if we got a valid response
    return response && response.length > 0;
  } catch (error) {
    console.error('Error validating Google API key:', error);
    return false;
  }
}

/**
 * Checks if an API key has the correct format for Google Generative AI
 * @param apiKey The API key to check
 * @returns True if the API key has the correct format, false otherwise
 */
export function hasValidGoogleApiKeyFormat(apiKey: string): boolean {
  if (!apiKey) return false;
  
  // Check if the API key starts with "AIza" (common for Google API keys)
  if (!apiKey.startsWith('AIza')) {
    return false;
  }
  
  // Check if the API key has the expected length (typically 39 characters)
  if (apiKey.length !== 39) {
    return false;
  }
  
  return true;
}
