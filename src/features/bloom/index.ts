/**
 * Bloom's Taxonomy Feature Index
 *
 * This file exports all types, constants, utils, hooks, components, services, and agents
 * related to Bloom's Taxonomy integration.
 */

// Export types
export * from './types';

// Export constants
export * from './constants/bloom-levels';
export * from './constants/action-verbs';
export * from './constants/mastery-thresholds';

// Export utils
export * from './utils/bloom-helpers';
export * from './utils/rubric-helpers';
export * from './utils/mastery-helpers';

// Export hooks
export * from './hooks';

// Export components
export * from './components';

// Export services
export * from './services';

// Export agents
export * from './agents';

// Register Bloom's agents with the agent registry
import { registerBloomsAgents } from './agents';

// Register agents when this module is imported
registerBloomsAgents();
