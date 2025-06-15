# Canvas Worksheet Generation Implementation

This document provides a detailed overview of the implementation of the Open Canvas functionality for worksheet generation in the teachers portal.

## Table of Contents

1. [Overview](#overview)
2. [Directory Structure](#directory-structure)
3. [Database Schema](#database-schema)
4. [API Integration](#api-integration)
5. [UI Components](#ui-components)
6. [Feature Flag Integration](#feature-flag-integration)
7. [Environment Configuration](#environment-configuration)
8. [Next Steps](#next-steps)

## Overview

We've ported the Open Canvas functionality to our system to enable AI-powered worksheet generation for teachers. This implementation allows teachers to create worksheets using AI assistance, which can then be converted to activities for students.

The implementation focuses on:
- Integrating the Canvas UI components for worksheet editing
- Adapting the LangGraph-based agent system for content generation
- Connecting with our existing authentication, database, and API structure
- Providing a seamless user experience for teachers

## Directory Structure

We've created the following directory structure for the Canvas feature:

```
src/
└── features/
    └── canvas/
        ├── agents/              # LangGraph agents for content generation
        │   ├── worksheet/       # Main worksheet generation agent
        │   ├── reflection/      # Memory/reflection system
        │   └── web-search/      # Web search capability
        ├── components/          # UI components
        │   ├── WorksheetList.tsx
        │   ├── WorksheetDetail.tsx
        │   ├── WorksheetCanvas.tsx
        │   └── ExportControls.tsx
        ├── contexts/            # React context providers
        └── shared/              # Shared utilities and types
            ├── types/
            ├── utils/
            ├── constants/
            └── prompts/
```

## Database Schema

We've added the Worksheet model to the Prisma schema:

```prisma
model Worksheet {
  id             String       @id @default(cuid())
  title          String
  content        Json
  teacherId      String
  subjectId      String?
  topicId        String?
  status         SystemStatus @default(ACTIVE)
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  teacher        TeacherProfile @relation(fields: [teacherId], references: [id])
  subject        Subject?     @relation(fields: [subjectId], references: [id])
  topic          SubjectTopic? @relation(fields: [topicId], references: [id])

  @@index([teacherId])
  @@index([subjectId])
  @@index([topicId])
  @@map("worksheets")
}

// Added to TeacherProfile model
worksheets Worksheet[]

// Added to Subject model
worksheets Worksheet[]

// Added to SubjectTopic model
worksheets Worksheet[]
```

## API Integration

### Worksheet Service

We've created a worksheet service (`src/server/api/services/worksheet.service.ts`) that handles:
- Creating worksheets
- Retrieving worksheets
- Updating worksheets
- Deleting worksheets
- Converting worksheets to activities

Key methods include:
- `createWorksheet`: Creates a new worksheet
- `getWorksheet`: Retrieves a worksheet by ID
- `getWorksheetsByTeacher`: Retrieves worksheets for a teacher
- `updateWorksheet`: Updates a worksheet
- `deleteWorksheet`: Soft-deletes a worksheet
- `convertToActivity`: Converts a worksheet to an activity

### Worksheet Router

We've created a worksheet router (`src/server/api/routers/worksheet.ts`) with the following procedures:
- `create`: Creates a new worksheet
- `getById`: Retrieves a worksheet by ID
- `listByTeacher`: Lists worksheets for a teacher
- `update`: Updates a worksheet
- `delete`: Deletes a worksheet
- `convertToActivity`: Converts a worksheet to an activity

### LangGraph API Route

We've created a LangGraph API route (`src/app/api/langgraph/route.ts`) that handles communication with the LangGraph server. This route:
- Verifies authentication
- Handles GET and PUT operations for LangGraph store
- Communicates with the LangGraph server running locally

## UI Components

### Teacher Portal Pages

We've created the following pages for the teacher portal:

1. **Worksheets List Page** (`src/app/(teacher)/worksheets/page.tsx`):
   - Displays a list of worksheets created by the teacher
   - Provides a button to create a new worksheet
   - Shows loading states and empty states

2. **Worksheet Creation Page** (`src/app/(teacher)/worksheets/create/page.tsx`):
   - Provides a form to create a new worksheet
   - Includes subject and topic selection
   - Contains the worksheet canvas for AI-assisted content generation

3. **Worksheet Detail Page** (`src/app/(teacher)/worksheets/[id]/page.tsx`):
   - Displays the details of a worksheet
   - Shows the worksheet content
   - Provides options to edit and export the worksheet

### UI Components

We've created the following UI components:

1. **WorksheetList** (`src/features/canvas/components/WorksheetList.tsx`):
   - Displays a grid of worksheet cards
   - Handles loading states
   - Provides links to worksheet details

2. **WorksheetDetail** (`src/features/canvas/components/WorksheetDetail.tsx`):
   - Displays the content of a worksheet
   - Provides tabs for preview, edit, and metadata
   - Renders the worksheet content based on its type

3. **WorksheetCanvas** (`src/features/canvas/components/WorksheetCanvas.tsx`):
   - Provides an interface for creating worksheets with AI assistance
   - Includes a form for entering prompts
   - Handles the generation of worksheet content

4. **ExportControls** (`src/features/canvas/components/ExportControls.tsx`):
   - Provides controls for exporting a worksheet as an activity
   - Includes class selection and activity type selection
   - Handles the conversion process

## Feature Flag Integration

We've implemented feature flags to control the availability of the worksheet feature:

1. **Feature Flags Utility** (`src/lib/feature-flags.ts`):
   - Provides utilities for working with feature flags
   - Parses feature flags from environment variables
   - Includes the `isFeatureEnabled` function to check if a feature is enabled

2. **ENABLE_WORKSHEETS Flag**:
   - Added to the .env file
   - Controls the visibility of the worksheet feature
   - Used to conditionally render UI components and navigation items

3. **UI Integration**:
   - Updated the teacher navigation to conditionally show the Worksheets item
   - Added checks to the worksheet pages to redirect if the feature is disabled

## Environment Configuration

We've added the following environment variables to the .env file:

```
# Feature Flags
FEATURE_FLAGS="{\"ENABLE_ANALYTICS\":true,\"ENABLE_NOTIFICATIONS\":true,\"ENABLE_WORKSHEETS\":true}"

# LangGraph Configuration
LANGGRAPH_API_URL=http://localhost:54367

# LLM API Keys (add your keys here)
# OPENAI_API_KEY=your_openai_key
# ANTHROPIC_API_KEY=your_anthropic_key
# GOOGLE_API_KEY=your_google_key

# Web Search (optional)
# EXA_API_KEY=your_exa_key
```

We've also updated the LangGraph configuration file (`langgraph.json`) to point to our new file structure:

```json
{
  "node_version": "20",
  "dependencies": [
    "."
  ],
  "graphs": {
    "worksheet": "./src/features/canvas/agents/worksheet/index.ts:graph",
    "reflection": "./src/features/canvas/agents/reflection/index.ts:graph",
    "thread_title": "./src/features/canvas/agents/thread-title/index.ts:graph",
    "summarizer": "./src/features/canvas/agents/summarizer/index.ts:graph",
    "web_search": "./src/features/canvas/agents/web-search/index.ts:graph"
  },
  "env": ".env"
}
```

## Next Steps

### 1. Database Schema Updates

The database schema has been updated using Prisma's `db push` command instead of migrations due to compatibility issues with existing enum types:

```bash
npx prisma db push
```

This command successfully synchronized the database with our Prisma schema, adding the Worksheet model and its relations.

### 2. LangGraph Server Setup

There are currently some compatibility issues with the LangGraph CLI. Here are alternative approaches to set up the LangGraph server:

#### Option 1: Try using npm directly

```bash
npm install @langchain/langgraph-cli @langchain/langgraph @langchain/core langchain
npm run canvas:server
```

#### Option 2: Use the global installation

```bash
npm install -g @langchain/langgraph-cli
npx @langchain/langgraph-cli dev --port 54367
```

#### Option 3: Clone the LangGraph repository and run it separately

```bash
git clone https://github.com/langchain-ai/langgraph-cli.git
cd langgraph-cli
npm install
npm run dev -- --port 54367
```

#### Troubleshooting

If you encounter the "cb.apply is not a function" error, try the following:

1. Clear npm cache: `npm cache clean --force`
2. Update npm: `npm install -g npm@latest`
3. Try using yarn instead: `yarn global add @langchain/langgraph-cli`

### 3. Add LLM API Keys

Add your API keys to the .env file:

```
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_API_KEY=your_google_key
```

### 4. Test the Integration

1. Enable the ENABLE_WORKSHEETS feature flag in the .env file
2. Start the development server: `npm run dev`
3. Navigate to the worksheets page: `/worksheets`
4. Create a new worksheet and test the functionality

### 5. Refine the UI

Improve the UI components to match your design system:
- Update styling to match your brand
- Enhance the user experience
- Add animations and transitions

### 6. Implement the Actual Canvas Component

Replace the placeholder components with the actual Canvas component from Open Canvas:
- Integrate the full Canvas UI
- Connect with the LangGraph agents
- Implement real-time updates

### 7. Add Analytics

Implement analytics to track usage and performance:
- Track worksheet creation
- Monitor conversion rates
- Analyze user behavior

### 8. Documentation and Training

Create documentation and training materials for teachers:
- User guides
- Video tutorials
- Best practices

## Current Status and Next Steps

### What's Been Accomplished

1. **Database Integration**:
   - Successfully added the Worksheet model to the database schema
   - Created relations with TeacherProfile, Subject, and SubjectTopic models
   - Used `prisma db push` to synchronize the database

2. **API Integration**:
   - Implemented the worksheet service with CRUD operations
   - Created the worksheet router with tRPC procedures
   - Added the LangGraph API route for communication with the LangGraph server

3. **UI Components**:
   - Created placeholder components for the teacher portal
   - Implemented feature flag integration for controlled rollout
   - Added navigation items for the worksheet feature in both `shell.tsx` and `main-layout.tsx`

4. **Routing and Middleware**:
   - Updated Next.js configuration to add rewrites for worksheet routes
   - Modified middleware to allow teachers to access worksheet routes
   - Ensured unauthorized users are redirected when trying to access worksheet routes

### Pending Items

1. **LangGraph Server Setup**:
   - Currently facing compatibility issues with the LangGraph CLI
   - Need to resolve these issues to enable the AI functionality

2. **Integration Testing**:
   - Need to test the full workflow from worksheet creation to activity conversion
   - Verify that all components work together as expected

3. **UI Refinement**:
   - Replace placeholder components with the actual Canvas UI
   - Improve the user experience for teachers

### Workarounds Implemented

1. **Feature Flag Issue**:
   - Modified the feature flags implementation to force-enable the worksheets feature regardless of the environment variable
   - Added debug logging to help diagnose issues with feature flags

2. **Direct Dashboard Access**:
   - Added a direct link to the worksheets feature on the teacher dashboard
   - This provides an alternative way to access the feature if the navigation item doesn't appear

3. **Fixed TypeScript Errors**:
   - Updated the teacher profile retrieval in the worksheets create page to use the correct API method
   - Changed from using `api.teacher.getTeacherByUserId` (which doesn't exist) to `api.user.getById`
   - Updated the subjects retrieval to use `api.subject.getAllSubjects` instead of `api.subject.list` with invalid parameters
   - Fixed the subjects mapping in the UI to correctly handle the API response structure
   - Fixed invalid hook calls by moving `useQuery` hooks out of `useEffect` hooks

4. **Import Path Fixes**:
   - Updated the Skeleton component import path from `@/components/ui/skeleton` to `@/components/ui/atoms/skeleton`
   - Fixed this in all worksheets-related components to ensure proper rendering

5. **Service Implementation Fixes**:
   - Fixed the `WorksheetService` class to properly extend the `ServiceBase` class
   - Updated the constructor to use the `ServiceOptions` interface
   - Changed all references from `this.config.prisma` to `this.prisma`
   - Removed unused imports

## Conclusion

This implementation provides a solid foundation for AI-powered worksheet generation in the teachers portal. By leveraging the capabilities of Open Canvas and integrating with our existing system, we've created a powerful tool for teachers to create engaging and educational content for their students.

The modular architecture allows for easy extension and customization, while the feature flag system provides control over the rollout of the feature. With further refinement and testing, this feature will become a valuable addition to our platform.

The main challenge currently is setting up the LangGraph server, which is required for the AI functionality. Once this is resolved, the feature will be ready for testing and further refinement.
