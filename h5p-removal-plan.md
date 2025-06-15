# H5P Implementation Review and Removal Plan

## Current H5P Implementation Overview

The current implementation integrates H5P content creation and delivery into our learning platform using the Lumi Education H5P libraries. This document outlines the current implementation and provides a detailed plan for removing H5P in favor of our own custom activities.

### Components and Architecture

#### 1. Dependencies

The system currently relies on the following H5P-related packages:
- `@lumieducation/h5p-server` - Server-side H5P content management
- `@lumieducation/h5p-express` - Express middleware for H5P
- `@lumieducation/h5p-react` - React components for H5P editor and player

#### 2. Server-Side Implementation

The H5P server implementation is primarily located in:
- `src/server/h5p/h5p-server.ts` - Core H5P server setup
- `src/server/api/h5p-routes.ts` - API routes for H5P

Key server-side features:
- H5P content storage and retrieval
- H5P library management
- H5P content processing
- H5P AJAX endpoints

#### 3. Client-Side Components

The H5P client implementation includes:
- `src/features/activities/types/h5p/H5PActivity.tsx` - H5P activity components
- `src/components/h5p/H5PInitializer.tsx` - H5P initialization component
- `src/components/h5p/H5PPackageProcessor.tsx` - H5P package upload and processing

#### 4. API Routes

Several API routes handle H5P-specific functionality:
- `/api/h5p/ajax` - H5P AJAX endpoints
- `/api/h5p/content/:contentId` - Content retrieval
- `/api/h5p/editor/:contentId` - Editor content
- `/api/h5p/import` - H5P package import
- `/api/h5p/process-package` - H5P package processing
- `/api/h5p/status` - H5P system status

#### 5. Database Models

The database schema includes H5P-specific models:
- `H5PContent` - Stores H5P content metadata and parameters
- `H5PContentCompletion` - Tracks user completion of H5P content

```prisma
model H5PContent {
  id          String                 @id @default(cuid())
  contentId   String                 @unique // H5P content ID
  title       String
  library     String // H5P library used
  params      Json // H5P content parameters
  metadata    Json? // H5P content metadata
  slug        String?                @unique // URL-friendly identifier
  status      SystemStatus           @default(ACTIVE)
  createdAt   DateTime               @default(now())
  updatedAt   DateTime               @updatedAt
  createdById String
  createdBy   User                   @relation("CreatedH5PContents", fields: [createdById], references: [id])
  activities  Activity[] // Activities using this H5P content
  completions H5PContentCompletion[]

  @@index([createdById])
  @@index([status])
  @@map("h5p_content")
}

model H5PContentCompletion {
  id        String   @id @default(cuid())
  userId    String
  contentId String
  score     Int?
  maxScore  Int?
  completed Boolean  @default(false)
  progress  Float?   @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user    User       @relation(fields: [userId], references: [id])
  content H5PContent @relation(fields: [contentId], references: [id])

  @@unique([userId, contentId])
  @@index([userId])
  @@index([contentId])
  @@index([completed])
  @@map("h5p_content_completions")
}
```

#### 6. Activity Integration

H5P is integrated into the activity system through:
- Activity model with `h5pContentId` field
- H5P activity type registration in the activity registry
- H5P editor and viewer components

#### 7. Configuration

H5P-specific configuration in:
- `next.config.js` - Transpile packages and webpack configuration
- `src/server/h5p/h5p-server.ts` - H5P server configuration

## Removal Plan

### Phase 1: Preparation and Analysis

1. **Identify Usage**
   - Analyze database to identify existing H5P activities
   - Determine which H5P content types are currently in use
   - Identify users who have created H5P content

2. **Create Migration Strategy**
   - Develop a plan for migrating existing H5P content to custom activities
   - Map H5P content types to equivalent custom activity types
   - Design data migration scripts

3. **Notify Users**
   - Inform users about the upcoming removal of H5P
   - Provide timeline and migration path
   - Offer support for transitioning content

### Phase 2: Code Removal

1. **Remove H5P Dependencies**
   - Remove H5P packages from `package.json`:
     ```
     npm uninstall @lumieducation/h5p-express @lumieducation/h5p-react @lumieducation/h5p-server
     ```

2. **Remove H5P Server Implementation**
   - Delete `src/server/h5p/h5p-server.ts`
   - Remove H5P-related imports and code from server files

3. **Remove H5P API Routes**
   - Delete the following API route files:
     - `src/app/api/h5p/ajax/route.ts`
     - `src/app/api/h5p/content/[contentId]/route.ts`
     - `src/app/api/h5p/editor/[contentId]/route.ts`
     - `src/app/api/h5p/import/route.ts`
     - `src/app/api/h5p/process-package/route.ts`
     - `src/app/api/h5p/status/route.ts`

4. **Remove H5P Components**
   - Delete `src/features/activities/types/h5p/H5PActivity.tsx`
   - Delete `src/components/h5p/H5PInitializer.tsx`
   - Delete `src/components/h5p/H5PPackageProcessor.tsx`
   - Delete `src/components/h5p/H5PSetupGuide.tsx`
   - Delete `src/components/h5p/H5PContentSelector.tsx`

5. **Remove H5P Test Pages**
   - Delete `src/app/h5p-test/page.tsx`
   - Delete `src/app/h5p-player/[contentId]/page.tsx`
   - Delete `src/app/h5p-editor/[contentId]/page.tsx`
   - Delete `src/app/h5p-analytics/page.tsx`

6. **Update Activity Registry**
   - Remove H5P activity type registration from `src/components/shared/entities/activities/register-activities.ts`
   - Remove H5P-related imports

7. **Update Next.js Configuration**
   - Remove H5P-specific configuration from `next.config.js`:
     ```js
     // Remove these lines
     transpilePackages: ['@lumieducation/h5p-react', '@lumieducation/h5p-webcomponents'],
     ```

### Phase 3: Database Schema Updates

1. **Create Migration to Remove H5P Relations**
   - Create a Prisma migration to:
     - Remove the `h5pContentId` field from the `Activity` model
     - Remove the relation between `Activity` and `H5PContent`
     - Remove the relation between `User` and `H5PContent`

2. **Create Migration to Remove H5P Models**
   - Create a Prisma migration to remove the `H5PContent` and `H5PContentCompletion` models

3. **Update Prisma Schema**
   - Remove H5P models from `prisma/schema.prisma`
   - Remove H5P-related fields and relations from other models

### Phase 4: Data Migration

1. **Export Existing H5P Content**
   - Create a script to export existing H5P content data
   - Store exported data for potential future reference

2. **Convert H5P Activities to Custom Activities**
   - Create a script to convert H5P activities to the most appropriate custom activity type
   - Migrate activity metadata and configuration

3. **Update User References**
   - Update user activity references to point to new custom activities
   - Update any dashboards or reports that referenced H5P content

### Phase 5: Documentation and Cleanup

1. **Update Documentation**
   - Remove H5P-related documentation
   - Update activity documentation to focus on custom activities
   - Create migration guides for content creators

2. **Final Cleanup**
   - Remove any remaining H5P-related files or references
   - Remove H5P-related environment variables
   - Remove H5P-related storage directories

3. **Testing**
   - Test the system thoroughly to ensure no H5P dependencies remain
   - Verify that all functionality works without H5P components
   - Check for any broken links or references

## Implementation Timeline

| Phase | Task | Estimated Time | Dependencies |
|-------|------|----------------|--------------|
| 1.1 | Identify Usage | 1 day | None |
| 1.2 | Create Migration Strategy | 2 days | 1.1 |
| 1.3 | Notify Users | 1 day | 1.2 |
| 2.1 | Remove H5P Dependencies | 0.5 day | 1.3 |
| 2.2 | Remove H5P Server Implementation | 0.5 day | 2.1 |
| 2.3 | Remove H5P API Routes | 0.5 day | 2.2 |
| 2.4 | Remove H5P Components | 0.5 day | 2.3 |
| 2.5 | Remove H5P Test Pages | 0.5 day | 2.4 |
| 2.6 | Update Activity Registry | 0.5 day | 2.5 |
| 2.7 | Update Next.js Configuration | 0.5 day | 2.6 |
| 3.1 | Create Migration to Remove H5P Relations | 1 day | 2.7 |
| 3.2 | Create Migration to Remove H5P Models | 1 day | 3.1 |
| 3.3 | Update Prisma Schema | 0.5 day | 3.2 |
| 4.1 | Export Existing H5P Content | 1 day | 3.3 |
| 4.2 | Convert H5P Activities to Custom Activities | 2 days | 4.1 |
| 4.3 | Update User References | 1 day | 4.2 |
| 5.1 | Update Documentation | 1 day | 4.3 |
| 5.2 | Final Cleanup | 1 day | 5.1 |
| 5.3 | Testing | 2 days | 5.2 |

**Total Estimated Time: 17.5 days**

## Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Data loss during migration | High | Medium | Create backups before migration, implement rollback plan |
| Broken functionality after removal | High | Medium | Comprehensive testing, phased approach |
| User resistance to change | Medium | High | Clear communication, training on new activities |
| Missing equivalent custom activities | Medium | Medium | Develop new custom activities to match H5P functionality |
| Performance issues with new activities | Medium | Low | Performance testing during development |

## Conclusion

Removing H5P from our platform will allow us to focus on developing and maintaining our own custom activities that better align with our platform's architecture and user needs. This plan provides a structured approach to removing H5P while minimizing disruption to users and ensuring a smooth transition to our custom activity system.

By following this plan, we can successfully remove H5P dependencies and replace them with our own custom activities, resulting in a more maintainable and cohesive platform.
