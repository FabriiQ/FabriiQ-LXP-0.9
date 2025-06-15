// Export all custom icons from the lucide-icons file
export * from './lucide-icons';

// Also export from the direct exports file to ensure all icons are available
// Using a direct import to avoid extension issues
import * as IconExports from '../../icons-fix';
export * from '../../icons-fix';
