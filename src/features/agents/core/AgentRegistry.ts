import { AgentConfig, AgentState, AgentType } from './types';

/**
 * Interface for agent factory functions
 */
export interface AgentFactory {
  (baseAgent: AgentState): AgentState;
}

/**
 * Interface for agent type registration
 */
export interface AgentTypeRegistration {
  type: AgentType;
  name: string;
  description: string;
  factory: AgentFactory | null;
  factoryPath?: string; // Path for lazy loading
  metadata?: Record<string, any>;
}

/**
 * Agent Registry for managing agent types and their factories
 *
 * This registry allows for:
 * 1. Registering agent types and their factory functions
 * 2. Retrieving agent factories by type
 * 3. Listing all available agent types
 * 4. Lazy loading agent implementations
 */
export class AgentRegistry {
  private static instance: AgentRegistry;
  private registrations: Map<AgentType, AgentTypeRegistration>;
  private loadedFactories: Map<AgentType, AgentFactory>;

  private constructor() {
    this.registrations = new Map();
    this.loadedFactories = new Map();
    this.registerBuiltInAgentTypes();
  }

  /**
   * Get the singleton instance of the registry
   */
  public static getInstance(): AgentRegistry {
    if (!AgentRegistry.instance) {
      AgentRegistry.instance = new AgentRegistry();
    }
    return AgentRegistry.instance;
  }

  /**
   * Register a new agent type with its factory function
   */
  public registerAgentType(registration: AgentTypeRegistration): void {
    if (this.registrations.has(registration.type)) {
      console.warn(`Agent type ${registration.type} is already registered. Overwriting.`);
    }

    this.registrations.set(registration.type, registration);

    // If factory is provided directly, add it to loaded factories
    if (registration.factory) {
      this.loadedFactories.set(registration.type, registration.factory);
    }
  }

  /**
   * Get an agent factory by type, loading it if necessary
   */
  public async getAgentFactory(type: AgentType): Promise<AgentFactory | null> {
    // Return from cache if already loaded
    if (this.loadedFactories.has(type)) {
      return this.loadedFactories.get(type) || null;
    }

    // Check if type is registered
    const registration = this.registrations.get(type);
    if (!registration) {
      console.error(`Agent type ${type} is not registered`);
      return null;
    }

    // If factory is already available, cache and return it
    if (registration.factory) {
      this.loadedFactories.set(type, registration.factory);
      return registration.factory;
    }

    // If factoryPath is provided, try to load it based on agent type
    if (registration.factoryPath) {
      try {
        let factory: AgentFactory | null = null;

        // Use explicit imports for each agent type instead of dynamic imports
        // This approach is more webpack-friendly
        switch (type) {
          case AgentType.WORKSHEET:
            const worksheetModule = await import('../specialized/WorksheetAgent');
            factory = worksheetModule.createWorksheetAgent;
            break;
          case AgentType.ASSESSMENT:
            const assessmentModule = await import('../specialized/AssessmentAgent');
            factory = assessmentModule.createAssessmentAgent;
            break;
          case AgentType.CONTENT_REFINEMENT:
            const contentRefinementModule = await import('../specialized/ContentRefinementAgent');
            factory = contentRefinementModule.createContentRefinementAgent;
            break;
          case AgentType.LESSON_PLAN:
            const lessonPlanModule = await import('../specialized/LessonPlanAgent');
            factory = lessonPlanModule.createLessonPlanAgent;
            break;
          case AgentType.SEARCH:
            const searchModule = await import('../specialized/SearchAgent');
            factory = searchModule.createSearchAgent;
            break;
          case AgentType.RESOURCE:
            const resourceModule = await import('../specialized/ResourceAgent');
            factory = resourceModule.createResourceAgent;
            break;
          case AgentType.FEEDBACK:
            const feedbackModule = await import('../specialized/FeedbackAgent');
            factory = feedbackModule.createFeedbackAgent;
            break;
          default:
            console.error(`Unknown agent type: ${type}`);
            return null;
        }

        if (factory) {
          // Update registration and cache
          registration.factory = factory;
          this.registrations.set(type, registration);
          this.loadedFactories.set(type, factory);
          return factory;
        } else {
          console.error(`Could not find factory function for agent type ${type}`);
          return null;
        }
      } catch (error) {
        console.error(`Error loading agent factory for ${type}:`, error);
        return null;
      }
    }

    return null;
  }

  /**
   * Get all registered agent types
   */
  public getRegisteredAgentTypes(): AgentTypeRegistration[] {
    return Array.from(this.registrations.values());
  }

  /**
   * Check if an agent type is registered
   */
  public isAgentTypeRegistered(type: AgentType): boolean {
    return this.registrations.has(type);
  }

  /**
   * Register built-in agent types
   */
  private registerBuiltInAgentTypes(): void {
    // Register all agent types from the AgentType enum with explicit imports
    // This avoids dynamic imports with expressions that cause webpack issues

    // Worksheet agent
    this.registerAgentType({
      type: AgentType.WORKSHEET,
      name: this.formatAgentTypeName(AgentType.WORKSHEET),
      description: this.getDefaultDescription(AgentType.WORKSHEET),
      factory: null,
      factoryPath: '../specialized/WorksheetAgent',
    });

    // Assessment agent
    this.registerAgentType({
      type: AgentType.ASSESSMENT,
      name: this.formatAgentTypeName(AgentType.ASSESSMENT),
      description: this.getDefaultDescription(AgentType.ASSESSMENT),
      factory: null,
      factoryPath: '../specialized/AssessmentAgent',
    });

    // Content refinement agent
    this.registerAgentType({
      type: AgentType.CONTENT_REFINEMENT,
      name: this.formatAgentTypeName(AgentType.CONTENT_REFINEMENT),
      description: this.getDefaultDescription(AgentType.CONTENT_REFINEMENT),
      factory: null,
      factoryPath: '../specialized/ContentRefinementAgent',
    });

    // Lesson plan agent
    this.registerAgentType({
      type: AgentType.LESSON_PLAN,
      name: this.formatAgentTypeName(AgentType.LESSON_PLAN),
      description: this.getDefaultDescription(AgentType.LESSON_PLAN),
      factory: null,
      factoryPath: '../specialized/LessonPlanAgent',
    });

    // Search agent
    this.registerAgentType({
      type: AgentType.SEARCH,
      name: this.formatAgentTypeName(AgentType.SEARCH),
      description: this.getDefaultDescription(AgentType.SEARCH),
      factory: null,
      factoryPath: '../specialized/SearchAgent',
    });

    // Resource agent
    this.registerAgentType({
      type: AgentType.RESOURCE,
      name: this.formatAgentTypeName(AgentType.RESOURCE),
      description: this.getDefaultDescription(AgentType.RESOURCE),
      factory: null,
      factoryPath: '../specialized/ResourceAgent',
    });

    // Feedback agent
    this.registerAgentType({
      type: AgentType.FEEDBACK,
      name: this.formatAgentTypeName(AgentType.FEEDBACK),
      description: this.getDefaultDescription(AgentType.FEEDBACK),
      factory: null,
      factoryPath: '../specialized/FeedbackAgent',
    });

    // Essay grading agent
    this.registerAgentType({
      type: AgentType.ESSAY_GRADING,
      name: this.formatAgentTypeName(AgentType.ESSAY_GRADING),
      description: this.getDefaultDescription(AgentType.ESSAY_GRADING),
      factory: null,
      factoryPath: '../specialized/EssayGradingAgent',
    });
  }

  /**
   * Format agent type name for display and path construction
   */
  private formatAgentTypeName(type: AgentType): string {
    // Convert kebab-case to PascalCase
    return type
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  }

  /**
   * Get default description for an agent type
   */
  private getDefaultDescription(type: AgentType): string {
    switch (type) {
      case AgentType.WORKSHEET:
        return 'Creates educational worksheets with print layout optimization';
      case AgentType.ASSESSMENT:
        return 'Generates assessments with question generation capabilities';
      case AgentType.CONTENT_REFINEMENT:
        return 'Refines and improves educational content';
      case AgentType.LESSON_PLAN:
        return 'Creates comprehensive lesson plans with activity integration';
      case AgentType.SEARCH:
        return 'Searches for educational content across various media types';
      case AgentType.RESOURCE:
        return 'Discovers and evaluates educational resources';
      case AgentType.FEEDBACK:
        return 'Provides feedback and suggestions for educational content';
      case AgentType.ESSAY_GRADING:
        return 'AI-powered essay grading with rubric-based evaluation and feedback generation';
      default:
        return `Agent for ${type}`;
    }
  }

  /**
   * Create an agent instance using the appropriate factory
   */
  public async createAgent(config: AgentConfig, baseAgent: AgentState): Promise<AgentState | null> {
    const factory = await this.getAgentFactory(config.type);
    if (!factory) {
      console.error(`No factory available for agent type ${config.type}`);
      return null;
    }

    try {
      return factory(baseAgent);
    } catch (error) {
      console.error(`Error creating agent of type ${config.type}:`, error);
      return null;
    }
  }
}

/**
 * Hook-like function to get the agent registry instance
 */
export function useAgentRegistry(): AgentRegistry {
  return AgentRegistry.getInstance();
}
