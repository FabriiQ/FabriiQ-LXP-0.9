#!/bin/bash

# Create backup directory
mkdir -p backups/teacher/activities

# Backup existing files
echo "Backing up existing files..."
cp -r src/app/teacher/classes/[classId]/activities/* backups/teacher/activities/

# Copy enhanced components to teacher activities folder
echo "Copying enhanced components..."
cp -r src/components/teacher/activities/enhanced/* src/components/teacher/activities/

# Replace existing pages with enhanced versions
echo "Replacing pages with enhanced versions..."
cp src/app/teacher/classes/[classId]/activities/create/page.enhanced.tsx src/app/teacher/classes/[classId]/activities/create/page.tsx
cp src/app/teacher/classes/[classId]/activities/[activityId]/page.enhanced.tsx src/app/teacher/classes/[classId]/activities/[activityId]/page.tsx
cp src/app/teacher/classes/[classId]/activities/page.enhanced.tsx src/app/teacher/classes/[classId]/activities/page.tsx
cp src/app/teacher/classes/[classId]/activities/[activityId]/grade/page.enhanced.tsx src/app/teacher/classes/[classId]/activities/[activityId]/grade/page.tsx

# Add batch-grade page
cp src/app/teacher/classes/[classId]/activities/[activityId]/batch-grade/page.enhanced.tsx src/app/teacher/classes/[classId]/activities/[activityId]/batch-grade/page.tsx

echo "Deployment completed successfully!"
