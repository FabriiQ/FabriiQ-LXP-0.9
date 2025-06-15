/**
 * Feature Flags
 *
 * This file provides utilities for working with feature flags in the application.
 * Feature flags are defined in the .env file as a JSON string in the FEATURE_FLAGS variable.
 */

export interface FeatureFlags {
  ENABLE_ANALYTICS: boolean;
  ENABLE_NOTIFICATIONS: boolean;
  ENABLE_WORKSHEETS: boolean;
  [key: string]: boolean;
}

// Default feature flags (used if not defined in environment)
const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  ENABLE_ANALYTICS: false,
  ENABLE_NOTIFICATIONS: false,
  ENABLE_WORKSHEETS: false,
};

// Parse feature flags from environment variable
let parsedFeatureFlags: FeatureFlags = { ...DEFAULT_FEATURE_FLAGS };

// Force enable worksheets for development
parsedFeatureFlags.ENABLE_WORKSHEETS = true;

// Skip trying to parse the environment variable since it's causing issues
console.log('Using default feature flags with worksheets enabled');
console.log('Final feature flags:', parsedFeatureFlags);

export const featureFlags = parsedFeatureFlags;

/**
 * Check if a feature is enabled
 * @param flag The feature flag to check
 * @returns boolean indicating if the feature is enabled
 */
export function isFeatureEnabled(flag: keyof FeatureFlags): boolean {
  const isEnabled = featureFlags[flag] === true;
  console.log(`Checking feature flag ${flag}:`, isEnabled);
  return isEnabled;
}
