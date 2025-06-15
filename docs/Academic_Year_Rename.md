# Academic Year to Academic Cycle Rename

## Table of Contents
1. [Introduction](#introduction)
2. [Current Codebase Analysis](#current-codebase-analysis)
3. [Impact Analysis](#impact-analysis)
4. [Implementation Plan](#implementation-plan)
5. [File Update Inventory](#file-update-inventory)
6. [Testing Strategy](#testing-strategy)
7. [Rollback Plan](#rollback-plan)
8. [Documentation Updates](#documentation-updates)

## Introduction

This document outlines the process of renaming "Academic Year" to "Academic Cycle" in the Aivy LXP system. This change is designed to better accommodate educational programs of varying durations, from half-year programs to multi-year degree programs. By using the term "Academic Cycle" instead of "Academic Year," we create a more flexible model that accurately represents different types of educational timeframes while minimizing changes to the underlying data structure.

### Rationale for Change

The current terminology "Academic Year" implies a fixed annual duration, which creates conceptual misalignment when representing:
- Short-term programs (less than a year)
- Traditional single-year academic programs
- Multi-year degree programs (e.g., 4-year Bachelor's degrees)

The term "Academic Cycle" better captures the variable nature of educational timeframes while requiring minimal changes to the underlying data model.

## Current Codebase Analysis

### Schema Structure

The current schema defines an `AcademicYear` model with relationships to several other entities:

```prisma
model AcademicYear {
  id              String           @id @default(cuid())
  name            String
  description     String?
  startDate       DateTime
  endDate         DateTime
  status          SystemStatus     @default(ACTIVE)
  academicPeriods AcademicPeriod[]
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  
  @@map("academic_years")
}
```

Key relationships:
- One-to-many with `AcademicPeriod`
- Referenced by `Term` model through foreign key
- Referenced by `FeedbackBase` model (optional field)
- Referenced by `Institution` model (one-to-many relationship)

### Current Implementation Status

Based on a review of the current codebase:

1. **Backend Implementation**:
   - The `AcademicYear` model is fully implemented in the Prisma schema
   - API routers and services for academic year management are implemented
   - Integration with other models like Term and Feedback is in place

2. **Frontend Implementation**:
   - Currently only Institution and Campus management are implemented in the frontend
   - No dedicated Academic Year management UI components exist yet
   - No direct references to Academic Year in the current frontend code

3. **Documentation**:
   - Academic Year is referenced in several documentation files
   - Conceptual models and architecture diagrams include Academic Year

## Impact Analysis

### 1. Database Schema Impact

**Severity: Medium**

Changes required:
- Rename table from `academic_years` to `academic_cycles`
- Update foreign key references in related tables (Term, AcademicPeriod)
- Update indexes and constraints referencing the table

```sql
-- Example migration SQL
ALTER TABLE academic_years RENAME TO academic_cycles;
ALTER TABLE terms RENAME COLUMN academic_year_id TO academic_cycle_id;
ALTER TABLE academic_periods RENAME COLUMN academic_year_id TO academic_cycle_id;
-- Update foreign key constraints
```

### 2. Prisma Schema Impact

**Severity: Medium**

Changes required:
- Update model name from `AcademicYear` to `AcademicCycle`
- Update field references across related models
- Update map directive from `academic_years` to `academic_cycles`

Affected files:
- `prisma/schema.prisma`

```prisma
model AcademicCycle {
  id              String           @id @default(cuid())
  name            String
  description     String?
  startDate       DateTime
  endDate         DateTime
  status          SystemStatus     @default(ACTIVE)
  academicPeriods AcademicPeriod[]
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  
  @@map("academic_cycles")
}

model Term {
  // ... existing fields
  academicCycleId String        // Changed from academicYearId
  academicCycle   AcademicCycle @relation(fields: [academicCycleId], references: [id]) // Changed from academicYear
  // ... other fields
}

model Institution {
  // ... existing fields
  academicCycles AcademicCycle[] // Changed from academicYears
  // ... other fields
}
```

### 3. Backend Code Impact

**Severity: Medium**

Areas affected:
- Service layer classes and methods
- API routes and controllers
- Type definitions

Specific files to update:
- `src/server/api/types/academic-period.ts`
- `src/server/api/services/academic-period.service.ts`
- `src/server/api/services/feedback.service.ts`
- `src/server/api/routers/academic-period.ts`
- `src/server/api/routers/feedback.ts`
- `src/lib/validations/feedback.ts`

### 4. Frontend Code Impact

**Severity: Low**

Since the frontend implementation of Academic Year management is not yet developed, the impact is minimal. However, planning for the future implementation should use the new terminology.

### 5. API Impact

**Severity: Medium**

Changes required:
- Update endpoint paths in the academic-period router
- Update request/response schemas

### 6. UI/UX Impact

**Severity: Low**

Since the UI for Academic Year management is not yet implemented, the impact is minimal. Future UI development should use the new terminology.

### 7. Documentation Impact

**Severity: Medium**

Files to update:
- `Academic_Year_Structure.md` → Rename to `Academic_Cycle_Structure.md`
- `Acadmic Calendar implimenttaion.md`
- `system-architecture.md`
- `backend-implementation-plan.md`
- `FrontendDevelopmentTasklist.md`

## Implementation Plan

### Phase 1: Preparation and Planning (2 days)

1. **Detailed Code Inventory**:
   - Finalize the list of files requiring updates
   - Identify critical path components and dependencies

2. **Development Environment Setup**:
   - Create feature branch for development
   - Set up test database with sample data

3. **Communication Plan**:
   - Notify all developers of upcoming changes
   - Schedule implementation and deployment timeline

### Phase 2: Database and Schema Changes (1 day)

1. **Schema Migration Creation**:
   - Create Prisma migration for renaming tables and fields
   - Test migration on development database
   - Verify data integrity after migration

2. **Update Prisma Schema**:
   - Update model definitions in schema.prisma
   - Generate Prisma client

### Phase 3: Backend Implementation (2 days)

1. **Service Layer Updates**:
   - Update academic-period.service.ts
   - Update feedback.service.ts
   - Update any other services with references

2. **API Layer Updates**:
   - Update academic-period.ts router
   - Update feedback.ts router
   - Update type definitions

3. **Validation Updates**:
   - Update validation schemas in lib/validations

### Phase 4: Documentation Updates (1 day)

1. **Update Documentation Files**:
   - Rename and update Academic_Year_Structure.md
   - Update references in other documentation files
   - Update architecture diagrams

### Phase 5: Testing and Quality Assurance (2 days)

1. **Comprehensive Testing**:
   - Unit test all updated components
   - Integration test all affected features
   - End-to-end test critical API endpoints

2. **Data Validation**:
   - Verify data integrity across all academic-related features
   - Test API functionality

### Phase 6: Deployment (1 day)

1. **Staged Deployment**:
   - Deploy to staging environment
   - Conduct final testing

2. **Production Deployment**:
   - Schedule maintenance window
   - Deploy database migrations
   - Deploy application updates

3. **Post-Deployment Monitoring**:
   - Monitor application performance
   - Monitor error rates

## File Update Inventory

### Database Files

1. `prisma/schema.prisma`
   - Update `AcademicYear` model name to `AcademicCycle`
   - Update `@@map("academic_years")` to `@@map("academic_cycles")`
   - Update references in `Term` model
   - Update references in `Institution` model
   - Update references in `FeedbackBase` model

### Backend Files

1. **API Routers**:
   - `src/server/api/routers/academic-period.ts`
     - Update references to academicYear to academicCycle
     - Update function names and parameters
   - `src/server/api/routers/feedback.ts`
     - Update references to academicYear to academicCycle

2. **Services**:
   - `src/server/api/services/academic-period.service.ts`
     - Update function names (createAcademicYear → createAcademicCycle)
     - Update variable names and database queries
   - `src/server/api/services/feedback.service.ts`
     - Update references to academicYear to academicCycle

3. **Types and Validations**:
   - `src/server/api/types/academic-period.ts`
     - Rename interfaces (CreateAcademicYearInput → CreateAcademicCycleInput)
     - Update field names
   - `src/lib/validations/feedback.ts`
     - Update validation schema field names

### Documentation Files

1. `Academic_Year_Structure.md` → Rename to `Academic_Cycle_Structure.md`
   - Update all content to use "Academic Cycle" terminology

2. `Acadmic Calendar implimenttaion.md`
   - Update references to AcademicYear
   - Update model definitions and relationships

3. `system-architecture.md`
   - Update entity relationship diagrams
   - Update references to AcademicYear

4. `backend-implementation-plan.md`
   - Update router references

5. `FrontendDevelopmentTasklist.md`
   - Update API endpoint references

## Testing Strategy

### Unit Testing

1. **Backend Unit Tests**:
   - Test updated service methods in academic-period.service.ts
   - Test updated API endpoints
   - Test data validation

### Integration Testing

1. **API Integration Tests**:
   - Test end-to-end API workflows
   - Test relationships between models
   - Test data integrity across related models

### Data Migration Testing

1. **Migration Verification**:
   - Verify all data is correctly migrated
   - Verify foreign key relationships are maintained
   - Verify indexes and constraints are correctly updated

## Rollback Plan

In case of critical issues during deployment:

1. **Database Rollback**:
   - Execute reverse migration script
   - Verify data integrity after rollback

2. **Application Rollback**:
   - Deploy previous version of application code

3. **Communication**:
   - Notify development team of rollback
   - Communicate timeline for re-implementation

## Documentation Updates

1. **Developer Documentation**:
   - Update all references to Academic Year in documentation
   - Update API documentation
   - Update database schema documentation

2. **Future UI Planning**:
   - Ensure all UI planning documents use the new terminology
   - Update wireframes and mockups if they exist 