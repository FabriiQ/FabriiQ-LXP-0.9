'use client';

/**
 * Activity Registry
 *
 * This file exports the activity registry singleton and initializes all activity types.
 */

import { ActivityPurpose } from '@/server/api/constants';

// Activity type definition interface
export interface ActivityTypeDefinition {
  id: string;
  name: string;
  description: string;
  category: ActivityPurpose | string;
  subCategory?: string;
  configSchema: any;
  defaultConfig: any;
  capabilities: {
    isGradable: boolean;
    hasSubmission: boolean;
    hasInteraction: boolean;
    hasRealTimeComponents: boolean;
    requiresTeacherReview?: boolean;
  };
  components: {
    editor: any;
    viewer: any;
    analytics?: any;
  };
}

// Registry singleton
class ActivityRegistry {
  private static instance: ActivityRegistry;
  private activityTypes = new Map<string, ActivityTypeDefinition>();

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  public static getInstance(): ActivityRegistry {
    if (!ActivityRegistry.instance) {
      ActivityRegistry.instance = new ActivityRegistry();
    }
    return ActivityRegistry.instance;
  }

  register(activityType: ActivityTypeDefinition) {
    this.activityTypes.set(activityType.id, activityType);
    console.log(`Registered activity type: ${activityType.id}`);
  }

  get(id: string) {
    return this.activityTypes.get(id);
  }

  getAll() {
    return Array.from(this.activityTypes.values());
  }

  getByCategory(category: ActivityPurpose | string) {
    return this.getAll().filter(type => type.category === category);
  }

  logAllActivityTypes() {
    console.log('Registered activity types:');
    this.activityTypes.forEach((type, id) => {
      console.log(`- ${id}: ${type.name}`);
    });
  }
}

// Export the singleton instance
export const activityRegistry = ActivityRegistry.getInstance();

// Log all registered activity types in development mode
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  setTimeout(() => {
    activityRegistry.logAllActivityTypes();
  }, 1000);
}

// We'll initialize activity types in a separate file to avoid circular dependencies
