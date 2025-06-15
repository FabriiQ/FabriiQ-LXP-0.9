#!/bin/bash

# Create backup directory
mkdir -p backups/teacher/activities

# Backup existing files
echo "Backing up existing files..."
cp -r src/app/teacher/classes/[classId]/activities/* backups/teacher/activities/
cp -r src/components/teacher/activities/* backups/teacher/activities/components/

# Create a new directory for enhanced components
echo "Creating directory for enhanced components..."
mkdir -p src/components/teacher/activities/new

# Copy enhanced components to the new directory
echo "Copying enhanced components..."
cp -r src/components/teacher/activities/enhanced/* src/components/teacher/activities/new/

# Create an index file that exports the enhanced components
echo "Creating index file for enhanced components..."
cat > src/components/teacher/activities/new/index.ts << EOL
// Export all enhanced components
export { ActivityTypeSelectorGrid } from './ActivityTypeSelectorGrid';
export { UnifiedActivityCreator } from './UnifiedActivityCreator';
export { ActivityViewer } from './ActivityViewer';
export { ActivityEditor } from './ActivityEditor';
export { ActivityAnalyticsWrapper } from './ActivityAnalyticsWrapper';
EOL

# Create a directory for enhanced pages
echo "Creating directory for enhanced pages..."
mkdir -p src/app/teacher/classes/[classId]/activities/new

# Copy enhanced pages to the new directory
echo "Copying enhanced pages..."
cp src/app/teacher/classes/[classId]/activities/create/page.enhanced.tsx src/app/teacher/classes/[classId]/activities/new/create/page.tsx
cp src/app/teacher/classes/[classId]/activities/[activityId]/page.enhanced.tsx src/app/teacher/classes/[classId]/activities/new/[activityId]/page.tsx
cp src/app/teacher/classes/[classId]/activities/page.enhanced.tsx src/app/teacher/classes/[classId]/activities/new/page.tsx
cp src/app/teacher/classes/[classId]/activities/[activityId]/grade/page.enhanced.tsx src/app/teacher/classes/[classId]/activities/new/[activityId]/grade/page.tsx

# Create a README file explaining the deployment
echo "Creating README file..."
cat > src/components/teacher/activities/new/README.md << EOL
# Enhanced Teacher Activities Components

This directory contains enhanced versions of the teacher activities components that use the new activities architecture from the \`features/activities\` folder.

## Usage

To use these enhanced components, import them from \`@/components/teacher/activities/new\`:

\`\`\`tsx
import {
  ActivityTypeSelectorGrid,
  UnifiedActivityCreator,
  ActivityViewer,
  ActivityEditor,
  ActivityAnalyticsWrapper
} from '@/components/teacher/activities/new';
\`\`\`

## Enhanced Pages

Enhanced versions of the teacher activities pages are available in \`src/app/teacher/classes/[classId]/activities/new/\`.

To switch to the enhanced versions, update the navigation links in your application to point to these new pages.
EOL

echo "Deployment completed successfully!"
echo "The enhanced components are available at src/components/teacher/activities/new/"
echo "The enhanced pages are available at src/app/teacher/classes/[classId]/activities/new/"
echo "To use the enhanced components, update your imports to use @/components/teacher/activities/new"
