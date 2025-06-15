# Term Type Implementation and Academic Structure Simplification

## Change Overview
**Change ID**: TERM-001  
**Title**: Simplify Academic Structure with Enhanced Term Model  
**Status**: Proposed  
**Impact Level**: High  
**Date**: [Current Date]

## 1. Purpose
Simplify the academic structure by removing the AcademicPeriod model and enhancing the Term model to handle all period-related functionality. This change will reduce complexity, improve maintainability, and provide a clearer data structure for academic cycle management.

## 2. Current vs. Proposed Structure

### Current Structure (To Be Removed):
```
AcademicCycle
   └── Term
        └── AcademicPeriod
```

### Proposed Structure:
```
AcademicCycle
   └── Term (with TermType and TermPeriod)
```

## 3. Schema Changes

### 3.1 New Enums
```prisma
enum TermType {
  SEMESTER
  TRIMESTER
  QUARTER
  THEME_BASED
  CUSTOM
}

enum TermPeriod {
  FALL
  SPRING
  SUMMER
  WINTER
  FIRST_QUARTER
  SECOND_QUARTER
  THIRD_QUARTER
  FOURTH_QUARTER
  FIRST_TRIMESTER
  SECOND_TRIMESTER
  THIRD_TRIMESTER
  THEME_UNIT
}
```

### 3.2 Updated Term Model
```prisma
model Term {
  id              String       @id @default(cuid())
  name            String
  termType        TermType     @default(SEMESTER)
  termPeriod      TermPeriod
  startDate       DateTime
  endDate         DateTime
  status          SystemStatus @default(ACTIVE)
  academicCycleId String
  courseId        String
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  deletedAt       DateTime?
  
  // Relations
  academicCycle   AcademicCycle @relation(fields: [academicCycleId], references: [id])
  course          Course        @relation(fields: [courseId], references: [id])
  assessments     Assessment[]
  classes         Class[]
  facilitySchedules FacilitySchedule[]
  gradeBooks      GradeBook[]
  teacherSchedules TeacherSchedule[]

  @@index([academicCycleId])
  @@index([courseId])
}
```

### 3.3 Models to Remove
- Complete AcademicPeriod model and its references
- Remove academicPeriodId from Term model

## 4. Impact Analysis

### 4.1 Database Impact
- **Tables Affected**: 
  - Remove: `academic_periods`
  - Modify: `terms`
- **Data Migration Required**: Yes
- **Indexes**: New indexes on termType and termPeriod may be needed
- **Foreign Keys**: Remove academicPeriodId references

### 4.2 Code Impact
#### Models/Types Affected:
1. Term
2. AcademicCycle
3. Assessment
4. Class
5. FacilitySchedule
6. TeacherSchedule

#### API Endpoints Affected:
1. `/api/terms/*` - Update for new structure
2. `/api/academic-periods/*` - Remove completely
3. `/api/academic-cycles/*` - Update references

### 4.3 Frontend Impact
- Term creation/edit forms
- Academic calendar views
- Term listing pages
- Reports and analytics

## 5. Implementation Details

### 5.1 Type Definitions
```typescript
// types/term.ts
export enum TermType {
  SEMESTER = 'SEMESTER',
  TRIMESTER = 'TRIMESTER',
  QUARTER = 'QUARTER',
  THEME_BASED = 'THEME_BASED',
  CUSTOM = 'CUSTOM'
}

export enum TermPeriod {
  FALL = 'FALL',
  SPRING = 'SPRING',
  SUMMER = 'SUMMER',
  WINTER = 'WINTER',
  FIRST_QUARTER = 'FIRST_QUARTER',
  SECOND_QUARTER = 'SECOND_QUARTER',
  THIRD_QUARTER = 'THIRD_QUARTER',
  FOURTH_QUARTER = 'FOURTH_QUARTER',
  FIRST_TRIMESTER = 'FIRST_TRIMESTER',
  SECOND_TRIMESTER = 'SECOND_TRIMESTER',
  THIRD_TRIMESTER = 'THIRD_TRIMESTER',
  THEME_UNIT = 'THEME_UNIT'
}

export interface Term {
  id: string;
  name: string;
  termType: TermType;
  termPeriod: TermPeriod;
  startDate: Date;
  endDate: Date;
  status: SystemStatus;
  academicCycleId: string;
  courseId: string;
  // ... other fields
}
```

### 5.2 Service Layer
```typescript
// services/term.service.ts
interface CreateTermDTO {
  name: string;
  termType: TermType;
  termPeriod: TermPeriod;
  startDate: Date;
  endDate: Date;
  academicCycleId: string;
  courseId: string;
}

class TermService {
  private readonly validPeriodsByType = {
    [TermType.SEMESTER]: [
      TermPeriod.FALL,
      TermPeriod.SPRING,
      TermPeriod.SUMMER,
      TermPeriod.WINTER
    ],
    [TermType.QUARTER]: [
      TermPeriod.FIRST_QUARTER,
      TermPeriod.SECOND_QUARTER,
      TermPeriod.THIRD_QUARTER,
      TermPeriod.FOURTH_QUARTER
    ],
    [TermType.TRIMESTER]: [
      TermPeriod.FIRST_TRIMESTER,
      TermPeriod.SECOND_TRIMESTER,
      TermPeriod.THIRD_TRIMESTER
    ],
    [TermType.THEME_BASED]: [
      TermPeriod.THEME_UNIT
    ]
  };

  async createTerm(data: CreateTermDTO) {
    this.validateTermTypeAndPeriod(data.termType, data.termPeriod);
    this.validateTermDates(data.startDate, data.endDate);
    
    return await prisma.term.create({
      data
    });
  }

  private validateTermTypeAndPeriod(type: TermType, period: TermPeriod) {
    const validPeriods = this.validPeriodsByType[type];
    if (!validPeriods?.includes(period)) {
      throw new Error(`Invalid period "${period}" for term type "${type}"`);
    }
  }

  private validateTermDates(startDate: Date, endDate: Date) {
    if (startDate >= endDate) {
      throw new Error('Term end date must be after start date');
    }
  }
}
```

### 5.3 API Layer
```typescript
// api/terms/validation.ts
export const createTermSchema = z.object({
  name: z.string().min(1),
  termType: z.enum([
    'SEMESTER',
    'TRIMESTER',
    'QUARTER',
    'THEME_BASED',
    'CUSTOM'
  ]).default('SEMESTER'),
  termPeriod: z.enum([
    'FALL', 'SPRING', 'SUMMER', 'WINTER',
    'FIRST_QUARTER', 'SECOND_QUARTER', 'THIRD_QUARTER', 'FOURTH_QUARTER',
    'FIRST_TRIMESTER', 'SECOND_TRIMESTER', 'THIRD_TRIMESTER',
    'THEME_UNIT'
  ]),
  startDate: z.date(),
  endDate: z.date(),
  academicCycleId: z.string(),
  courseId: z.string()
});

// api/terms/route.ts
router.post('/terms', async (req, res) => {
  const data = createTermSchema.parse(req.body);
  const term = await termService.createTerm(data);
  res.status(201).json(term);
});
```

## 6. Migration Plan

### 6.1 Database Migration Script
```typescript
// migrations/term-structure-update.ts
async function migrateTermStructure() {
  // 1. Add new columns to terms table
  await prisma.$executeRaw`
    ALTER TABLE terms 
    ADD COLUMN term_type TEXT,
    ADD COLUMN term_period TEXT
  `;

  // 2. Migrate data from academic_periods
  const academicPeriods = await prisma.academicPeriod.findMany({
    include: { terms: true }
  });

  for (const period of academicPeriods) {
    for (const term of period.terms) {
      await prisma.term.update({
        where: { id: term.id },
        data: {
          termType: determineTermType(period),
          termPeriod: determineTermPeriod(period),
        }
      });
    }
  }

  // 3. Make new columns required
  await prisma.$executeRaw`
    ALTER TABLE terms 
    ALTER COLUMN term_type SET NOT NULL,
    ALTER COLUMN term_period SET NOT NULL
  `;

  // 4. Remove academic_periods table and references
  await prisma.$executeRaw`
    ALTER TABLE terms DROP COLUMN academic_period_id;
    DROP TABLE academic_periods;
  `;
}

function determineTermType(period: AcademicPeriod): TermType {
  // Implementation based on your data
}

function determineTermPeriod(period: AcademicPeriod): TermPeriod {
  // Implementation based on your data
}
```

### 6.2 Deployment Steps
1. Deploy new code with dual support
2. Run database migrations
3. Execute data migration
4. Remove old code and endpoints
5. Deploy final version

## 7. Testing Strategy

### 7.1 Unit Tests
```typescript
describe('TermService', () => {
  describe('validateTermTypeAndPeriod', () => {
    it('should validate semester periods correctly', () => {
      const service = new TermService();
      
      expect(() => {
        service.validateTermTypeAndPeriod(TermType.SEMESTER, TermPeriod.FALL);
      }).not.toThrow();

      expect(() => {
        service.validateTermTypeAndPeriod(TermType.SEMESTER, TermPeriod.FIRST_QUARTER);
      }).toThrow();
    });

    it('should validate quarter periods correctly', () => {
      const service = new TermService();
      
      expect(() => {
        service.validateTermTypeAndPeriod(TermType.QUARTER, TermPeriod.FIRST_QUARTER);
      }).not.toThrow();

      expect(() => {
        service.validateTermTypeAndPeriod(TermType.QUARTER, TermPeriod.FALL);
      }).toThrow();
    });
  });
});
```

### 7.2 Integration Tests
```typescript
describe('Term API', () => {
  describe('POST /api/terms', () => {
    it('should create term with valid data', async () => {
      const response = await request(app)
        .post('/api/terms')
        .send({
          name: 'Fall 2023',
          termType: 'SEMESTER',
          termPeriod: 'FALL',
          startDate: '2023-09-01',
          endDate: '2023-12-31',
          academicCycleId: 'cycle-id',
          courseId: 'course-id'
        });
      
      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        termType: 'SEMESTER',
        termPeriod: 'FALL'
      });
    });

    it('should reject invalid type-period combination', async () => {
      const response = await request(app)
        .post('/api/terms')
        .send({
          name: 'Fall 2023',
          termType: 'SEMESTER',
          termPeriod: 'FIRST_QUARTER',
          startDate: '2023-09-01',
          endDate: '2023-12-31',
          academicCycleId: 'cycle-id',
          courseId: 'course-id'
        });
      
      expect(response.status).toBe(400);
    });
  });
});
```

## 8. Rollback Plan

### 8.1 Code Rollback
```bash
git revert <commit-hash>
```

### 8.2 Database Rollback
```sql
-- Restore academic_periods table
CREATE TABLE academic_periods ( ... );

-- Restore foreign key in terms
ALTER TABLE terms ADD COLUMN academic_period_id TEXT;

-- Remove new columns
ALTER TABLE terms 
  DROP COLUMN term_type,
  DROP COLUMN term_period;
```

## 9. Timeline

1. **Development Phase** (3 days)
   - Schema updates
   - Service layer implementation
   - API updates
   - Frontend changes

2. **Testing Phase** (2 days)
   - Unit testing
   - Integration testing
   - Migration testing

3. **Migration Phase** (1 day)
   - Data migration
   - Validation
   - Performance testing

4. **Deployment Phase** (1 day)
   - Deployment
   - Monitoring
   - Verification

Total: 7 days

## 10. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data Loss | High | Full backup before migration |
| Performance Impact | Medium | Index new columns |
| Integration Issues | Medium | Comprehensive testing |
| User Disruption | Low | Deploy during off-hours |

## 11. Success Criteria

1. All terms successfully migrated with correct type and period
2. No data loss or corruption
3. All API endpoints working as expected
4. Frontend functionality maintained
5. No performance degradation

## 12. Documentation Updates Required

1. API Documentation
2. Database Schema Documentation
3. Frontend Component Documentation
4. User Guides
5. Integration Guides

## 13. Monitoring and Metrics

1. Migration success rate
2. API response times
3. Error rates
4. Database query performance
5. User feedback

## 14. Approvals Required

- [ ] Technical Lead
- [ ] Product Manager
- [ ] Database Administrator
- [ ] QA Lead