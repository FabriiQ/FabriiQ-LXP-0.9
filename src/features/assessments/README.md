# Assessment System

This module provides a comprehensive assessment system for the Q2 Learning platform, including:

- Assessment creation with Bloom's Taxonomy integration
- Printable and online assessment formats
- Rubric-based grading
- Integration with the existing grading and rewards systems

## Features

### Assessment Creation with Bloom's Taxonomy

- Create assessments aligned with Bloom's cognitive levels
- Visualize cognitive level distribution
- Select appropriate rubrics based on assessment objectives
- Align questions with learning outcomes

### Printable Assessments

- Generate print-ready assessment documents
- Support various paper sizes and orientations
- Include answer keys for teachers
- Optimize layout for printing

### Online Assessments

- Interactive assessment taking interface
- Automatic and manual grading options
- Detailed feedback for students
- Analytics for teachers

### Rubric-Based Grading

- Create and use rubrics for consistent grading
- Support for partial credit and weighted criteria
- Generate feedback based on performance levels
- Track student progress across Bloom's cognitive levels

## Directory Structure

```
src/features/assessments/
├── types/                      # TypeScript type definitions
│   ├── assessment.ts           # Assessment types
│   ├── question.ts             # Question types
│   ├── submission.ts           # Submission types
│   ├── grading.ts              # Grading types
│   └── index.ts                # Type exports
├── constants/                  # Constants and configuration
│   ├── assessment-types.ts     # Assessment type definitions
│   ├── question-types.ts       # Question type definitions
│   └── grading-scales.ts       # Grading scale definitions
├── utils/                      # Utility functions
│   ├── assessment-helpers.ts   # Assessment helpers
│   ├── print-helpers.ts        # Print formatting helpers
│   ├── grading-helpers.ts      # Grading calculation helpers
│   └── bloom-integration.ts    # Bloom's Taxonomy integration
├── hooks/                      # React hooks
│   ├── useAssessment.ts        # Hook for assessment functionality
│   ├── useQuestions.ts         # Hook for question management
│   ├── useGrading.ts           # Hook for grading functionality
│   ├── usePrintPreview.ts      # Hook for print preview
│   └── index.ts                # Hook exports
├── components/                 # React components
│   ├── creation/               # Assessment creation components
│   ├── preview/                # Assessment preview components
│   ├── grading/                # Grading interface components
│   ├── print/                  # Print-related components
│   └── index.ts                # Component exports
├── services/                   # Service layer
│   ├── assessment.service.ts   # Assessment service
│   ├── question.service.ts     # Question service
│   ├── grading.service.ts      # Grading service
│   └── print.service.ts        # Print service
├── api/                        # API integration
│   ├── assessment.api.ts       # Assessment API endpoints
│   ├── question.api.ts         # Question API endpoints
│   ├── submission.api.ts       # Submission API endpoints
│   └── grading.api.ts          # Grading API endpoints
└── index.ts                    # Main exports
```

## Integration Points

- **Bloom's Taxonomy**: Integrates with the Bloom's Taxonomy feature for cognitive level alignment
- **Rubrics**: Uses rubrics for structured assessment and grading
- **Topic Mastery**: Contributes to topic mastery tracking
- **Rewards**: Connects with the reward system for achievement tracking
- **Activities**: Can be converted to/from activities

## Usage

See the documentation in each component for specific usage examples.
