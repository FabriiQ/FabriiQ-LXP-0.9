// Export adapter types
export * from './types';

// Export adapter registry class
import { AdapterRegistry as AdapterRegistryClass } from './AdapterRegistry';
export { AdapterRegistryClass };

// Export adapters
export * from './LegacyArtifactAdapter';
export * from './LegacyMessageAdapter';

// Initialize and configure the adapter registry
import { AdapterRegistry } from './AdapterRegistry';
import { LegacyArtifactAdapter } from './LegacyArtifactAdapter';
import { LegacyMessageAdapter } from './LegacyMessageAdapter';

// Get the registry instance
const registry = AdapterRegistry.getInstance();

// Register adapters
registry.registerArtifactAdapter(new LegacyArtifactAdapter());
registry.registerMessageAdapter(new LegacyMessageAdapter());

// Export the configured registry
export { registry as adapterRegistry };
