# Terms and Results System Documentation

This document provides a comprehensive overview of how terms are structured, how results are passed between terms, and how result cards are generated in the Aivy Learning Experience Platform (LXP).

## Table of Contents

1. [Term Structure and Management](#term-structure-and-management)
   - [Term Types and Periods](#term-types-and-periods)
   - [Term Creation and Configuration](#term-creation-and-configuration)
   - [Term Relationships](#term-relationships)
2. [Student Progression Between Terms](#student-progression-between-terms)
   - [Enrollment Process](#enrollment-process)
   - [Term Completion Requirements](#term-completion-requirements)
   - [Promotion Criteria](#promotion-criteria)
3. [Result Calculation and Management](#result-calculation-and-management)
   - [Grade Calculation](#grade-calculation)
   - [Final Grade Determination](#final-grade-determination)
   - [Term-to-Term Result Transfer](#term-to-term-result-transfer)
4. [Result Cards and Reports](#result-cards-and-reports)
   - [Result Card Generation](#result-card-generation)
   - [Report Types](#report-types)
   - [Data Visualization](#data-visualization)
5. [Academic Cycle Completion](#academic-cycle-completion)
   - [Cycle Completion Requirements](#cycle-completion-requirements)
   - [Final Certification](#final-certification)

## Term Structure and Management

### Term Types and Periods

The system supports various term types and periods to accommodate different educational structures:

```typescript
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

Each term type has valid associated periods:

```typescript
private validPeriodsByType: Record<TermType, TermPeriod[]> = {
  [TermType.SEMESTER]: [TermPeriod.FALL, TermPeriod.SPRING],
  [TermType.TRIMESTER]: [TermPeriod.FIRST_TRIMESTER, TermPeriod.SECOND_TRIMESTER, TermPeriod.THIRD_TRIMESTER],
  [TermType.QUARTER]: [TermPeriod.FIRST_QUARTER, TermPeriod.SECOND_QUARTER, TermPeriod.THIRD_QUARTER, TermPeriod.FOURTH_QUARTER],
  [TermType.THEME_BASED]: [TermPeriod.THEME_UNIT],
  [TermType.CUSTOM]: [TermPeriod.SUMMER, TermPeriod.WINTER]
};
```

### Term Creation and Configuration

Terms are created within academic cycles and are associated with courses. The term creation process includes validation to ensure:

1. Term dates fall within the academic cycle dates
2. No overlapping terms for the same course
3. Valid term type and period combinations
4. Start date is before end date

```typescript
// Create the term
return ctx.prisma.term.create({
  data: {
    code: input.code,
    name: input.name,
    description: input.description,
    termType: input.termType,
    termPeriod: input.termPeriod,
    startDate: input.startDate,
    endDate: input.endDate,
    status: input.status,
    course: {
      connect: { id: input.courseId }
    },
    academicCycle: {
      connect: { id: input.academicCycleId }
    }
  },
  include: {
    course: {
      select: {
        id: true,
        code: true,
        name: true,
      }
    },
    academicCycle: {
      select: {
        id: true,
        code: true,
        name: true,
        startDate: true,
        endDate: true,
      }
    }
  }
});
```

### Term Relationships

Terms exist within a hierarchical structure:
- Academic Cycles contain Terms
- Terms contain Classes
- Classes contain Students (via Enrollments)
- Classes are associated with Gradebooks

This structure ensures proper organization of academic data and facilitates reporting and progression tracking.

## Student Progression Between Terms

### Enrollment Process

Students are enrolled in classes that are associated with specific terms. The enrollment process includes:

1. Identifying the appropriate class for the student based on program, campus, and term
2. Creating an enrollment record with status and start date
3. Connecting the student to the class via the enrollment record

```typescript
// Create new enrollment
return ctx.prisma.studentEnrollment.create({
  data: {
    studentId: input.studentId,
    classId: targetClass.id,
    startDate: input.startDate || new Date(),
    status: input.status === 'ACTIVE' ? SystemStatus.ACTIVE : SystemStatus.INACTIVE,
    createdById: ctx.session.user.id,
  },
  include: {
    class: {
      include: {
        courseCampus: {
          include: {
            programCampus: {
              include: {
                program: true,
              }
            }
          }
        },
        term: true,
      }
    },
  },
});
```

### Term Completion Requirements

For a student to complete a term, they must satisfy several requirements:

1. Complete all required activities and assessments
2. Achieve passing grades according to the gradebook configuration
3. Meet attendance requirements (if applicable)
4. Fulfill any program-specific requirements

These requirements are tracked through the gradebook system, which aggregates grades from activities and assessments.

### Promotion Criteria

Promotion to the next term is based on:

1. Successful completion of the current term
2. Meeting minimum GPA requirements (if applicable)
3. Completing all prerequisite courses
4. Satisfying program-specific promotion criteria

Program configuration includes settings that affect promotion:

```typescript
const configSchema = z.object({
  settings: z.object({
    allowConcurrentEnrollment: z.boolean().default(false),
    requirePrerequisites: z.boolean().default(true),
    gradingScheme: z.enum(['STANDARD', 'CUSTOM', 'PASS_FAIL']).default('STANDARD'),
    autoEnrollPrerequisites: z.boolean().default(false),
    allowLateEnrollment: z.boolean().default(true),
    maxCreditsPerTerm: z.number().min(0).default(18),
  }),
});
```

## Result Calculation and Management

### Grade Calculation

Grades are calculated at multiple levels:

1. **Activity Level**: Individual activities are graded based on correctness
   ```typescript
   // Calculate percentage and passing status
   const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
   const passed = percentage >= (activity.settings?.passingPercentage || 60);
   ```

2. **Assessment Level**: Assessments have their own grading logic
   ```typescript
   // Process each question
   for (const question of activity.questions || []) {
     const questionId = question.id;
     const selectedAnswer = answerData[questionId];
     const isCorrect = selectedAnswer === question.isTrue;
     
     // Add to max score
     const points = question.points || 1;
     maxScore += points;
     
     // Add to score if correct
     if (isCorrect) {
       score += points;
     }
   }
   ```

3. **Gradebook Level**: Final grades are calculated based on weighted components
   ```typescript
   // Calculate weighted average of activity grades
   if (calculationRules.activityWeight) {
     const activityScores = Object.values(activityGrades)
       .filter((grade: any) => grade.score !== null && grade.maxScore > 0)
       .map((grade: any) => (grade.score / grade.maxScore) * 100);

     if (activityScores.length > 0) {
       const activityAverage = activityScores.reduce((sum, score) => sum + score, 0) / activityScores.length;
       finalGrade += activityAverage * (calculationRules.activityWeight / 100);
       totalWeight += calculationRules.activityWeight;
     }
   }
   ```

### Final Grade Determination

Final grades are determined by combining weighted components according to the gradebook's calculation rules:

```typescript
// Calculate the final grade based on the calculation rules
let finalGrade = 0;
let totalWeight = 0;

// Calculate weighted average of activity grades
if (calculationRules.activityWeight) {
  const activityScores = Object.values(activityGrades)
    .filter((grade: any) => grade.score !== null && grade.maxScore > 0)
    .map((grade: any) => (grade.score / grade.maxScore) * 100);

  if (activityScores.length > 0) {
    const activityAverage = activityScores.reduce((sum, score) => sum + score, 0) / activityScores.length;
    finalGrade += activityAverage * (calculationRules.activityWeight / 100);
    totalWeight += calculationRules.activityWeight;
  }
}

// Calculate weighted average of assessment grades
if (calculationRules.assessmentWeight) {
  const assessmentScores = Object.values(assessmentGrades)
    .filter((grade: any) => grade.score !== null && grade.maxScore > 0)
    .map((grade: any) => (grade.score / grade.maxScore) * 100);

  if (assessmentScores.length > 0) {
    const assessmentAverage = assessmentScores.reduce((sum, score) => sum + score, 0) / assessmentScores.length;
    finalGrade += assessmentAverage * (calculationRules.assessmentWeight / 100);
    totalWeight += calculationRules.assessmentWeight;
  }
}

// Normalize the final grade if weights don't add up to 100
if (totalWeight > 0 && totalWeight !== 100) {
  finalGrade = (finalGrade / totalWeight) * 100;
}

// Determine the letter grade based on the final grade
let letterGrade = '';
if (calculationRules.letterGradeScale) {
  for (const [grade, threshold] of Object.entries(calculationRules.letterGradeScale)) {
    if (finalGrade >= (threshold as number)) {
      letterGrade = grade;
      break;
    }
  }
}
```

Letter grades are assigned based on percentage thresholds:

```typescript
// Convert numeric score to letter grade
let letterGrade = "N/A";
if (grade.score !== null) {
  const score = grade.score;
  const maxScore = grade.activity.maxScore || 100;
  const percentage = (score / maxScore) * 100;

  if (percentage >= 90) letterGrade = "A";
  else if (percentage >= 80) letterGrade = "B+";
  else if (percentage >= 70) letterGrade = "B";
  else if (percentage >= 60) letterGrade = "C+";
  else if (percentage >= 50) letterGrade = "C";
  else letterGrade = "D";
}
```

### Term-to-Term Result Transfer

When a student completes a term and moves to the next, their academic record is maintained and carried forward:

1. Final grades from the previous term are stored in the student's academic record
2. Prerequisite completion status is updated based on final grades
3. GPA is calculated and updated in the student profile
4. Achievement progress is carried forward to the new term

The system maintains a complete academic history for each student, allowing for comprehensive reporting and analysis across terms.

## Result Cards and Reports

### Result Card Generation

Result cards are generated to provide students with a visual representation of their academic performance. The system creates result cards for:

1. Individual activities and assessments
2. Term-end reports
3. Comprehensive academic records

Result cards include:

```typescript
return {
  id: grade.id,
  title: `${grade.gradeBook.class?.name || 'Unknown Class'} Final Grade`,
  subject: grade.gradeBook.class?.name || 'Unknown Subject',
  type: 'Final Grade',
  date: grade.updatedAt,
  score: grade.finalGrade || 0,
  totalScore: 100,
  grade: letterGrade,
  feedback: grade.comments || '',
  classId: grade.gradeBook.classId,
  className: grade.gradeBook.class?.name || 'Unknown Class',
  term: 'Current Term', // This would come from the academic term in a real implementation
};
```

### Report Types

The system supports various report types:

1. **Performance Reports**: Academic performance across activities and assessments
   ```typescript
   if (input.type === 'PERFORMANCE') {
     reportTitle = `Performance Report - ${classExists.name}`;

     // Get all activities for this class
     const activities = await this.prisma.activity.findMany({
       where: {
         classId: input.classId,
         createdAt: {
           gte: startDate,
           lte: endDate,
         },
       },
     });

     // Get all enrollments for this class
     const enrollments = await this.prisma.studentEnrollment.findMany({
       where: {
         classId: input.classId,
         status: SystemStatus.ACTIVE,
       },
       include: {
         student: {
           include: {
             user: true,
           },
         },
       },
     });

     // Get all grades for these activities and students
     const grades = await this.prisma.activityGrade.findMany({
       where: {
         activity: {
           classId,
         },
         studentId: {
           in: enrollments.map(e => e.studentId),
         },
       },
     });
   }
   ```

2. **Attendance Reports**: Student attendance records
   ```typescript
   if (input.type === 'ATTENDANCE') {
     reportTitle = `Attendance Report - ${classExists.name}`;

     // Get attendance data
     const attendanceData = await this.prisma.attendance.findMany({
       where: {
         classId: input.classId,
         date: {
           gte: startDate,
           lte: endDate,
         },
       },
       include: {
         student: {
           include: {
             user: true,
           },
         },
       },
     });
   }
   ```

3. **Summary Reports**: Overall academic progress
   ```typescript
   if (input.type === 'SUMMARY') {
     reportTitle = `Summary Report - ${classExists.name}`;

     // Get all activities, assessments, and attendance for this class
     const [activities, assessments, attendance] = await Promise.all([
       this.prisma.activity.findMany({
         where: {
           classId: input.classId,
           createdAt: {
             gte: startDate,
             lte: endDate,
           },
         },
       }),
       this.prisma.assessment.findMany({
         where: {
           classId: input.classId,
           createdAt: {
             gte: startDate,
             lte: endDate,
           },
         },
       }),
       this.prisma.attendance.findMany({
         where: {
           classId: input.classId,
           date: {
             gte: startDate,
             lte: endDate,
           },
         },
       }),
     ]);
   }
   ```

4. **Term Calendar Reports**: Academic calendar for the term
   ```typescript
   return {
     term: {
       id: term.id,
       name: term.name,
       academicCycle: term.academicCycle.name,
       startDate: term.startDate,
       endDate: term.endDate
     },
     summary: {
       totalEvents: events.length,
       totalHolidays: holidays.length,
       workingDays: this.calculateWorkingDays(term.startDate, term.endDate, holidays),
       events: events.map(this.formatEventForReport),
       holidays: holidays.map(this.formatHolidayForReport)
     },
     monthlyBreakdowns
   };
   ```

### Data Visualization

Result cards and reports include data visualization components to help students and teachers understand academic performance:

1. Grade distribution charts
2. Progress over time graphs
3. Comparison to class averages
4. Achievement and reward visualizations

## Academic Cycle Completion

### Cycle Completion Requirements

For a student to complete an academic cycle, they must:

1. Successfully complete all required terms
2. Meet the minimum GPA requirements for the program
3. Complete all required courses and credit hours
4. Satisfy any program-specific completion criteria

Program requirements are defined in the program configuration:

```typescript
const requirementsSchema = z.object({
  totalCredits: z.number().min(0),
  minimumGPA: z.number().min(0),
  requiredCourses: z.array(z.string()),
  electiveCreditHours: z.number().min(0)
});
```

### Final Certification

Upon successful completion of an academic cycle, the system:

1. Generates a final transcript with all term results
2. Updates the student's academic record with completion status
3. Issues any applicable certificates or diplomas
4. Prepares for enrollment in the next academic cycle (if applicable)

The system maintains a complete record of the student's academic journey, from individual activities to final certification, providing a comprehensive view of their educational achievements.
