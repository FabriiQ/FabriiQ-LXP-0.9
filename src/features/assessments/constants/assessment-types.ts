import { AssessmentCategory } from '../types/enums';

/**
 * Assessment type definitions and metadata
 */

// Assessment type metadata
export const ASSESSMENT_TYPE_METADATA: Record<AssessmentCategory, {
  label: string;
  description: string;
  icon: string;
  color: string;
  defaultMaxScore: number;
  defaultPassingScore: number;
  defaultWeightage: number;
}> = {
  [AssessmentCategory.QUIZ]: {
    label: 'Quiz',
    description: 'A short assessment with a few questions to test basic understanding',
    icon: 'QuizIcon',
    color: 'blue',
    defaultMaxScore: 20,
    defaultPassingScore: 12,
    defaultWeightage: 5,
  },
  [AssessmentCategory.TEST]: {
    label: 'Test',
    description: 'A medium-length assessment covering multiple topics',
    icon: 'TestIcon',
    color: 'green',
    defaultMaxScore: 50,
    defaultPassingScore: 25,
    defaultWeightage: 15,
  },
  [AssessmentCategory.EXAM]: {
    label: 'Exam',
    description: 'A comprehensive assessment covering an entire subject or term',
    icon: 'ExamIcon',
    color: 'red',
    defaultMaxScore: 100,
    defaultPassingScore: 50,
    defaultWeightage: 30,
  },
  [AssessmentCategory.ASSIGNMENT]: {
    label: 'Assignment',
    description: 'A take-home assessment with extended response questions',
    icon: 'AssignmentIcon',
    color: 'purple',
    defaultMaxScore: 100,
    defaultPassingScore: 60,
    defaultWeightage: 20,
  },
  [AssessmentCategory.PROJECT]: {
    label: 'Project',
    description: 'A long-term assessment requiring research and application',
    icon: 'ProjectIcon',
    color: 'orange',
    defaultMaxScore: 100,
    defaultPassingScore: 60,
    defaultWeightage: 25,
  },
  [AssessmentCategory.PRESENTATION]: {
    label: 'Presentation',
    description: 'An oral assessment where students present their work',
    icon: 'PresentationIcon',
    color: 'teal',
    defaultMaxScore: 50,
    defaultPassingScore: 30,
    defaultWeightage: 15,
  },
  [AssessmentCategory.PARTICIPATION]: {
    label: 'Participation',
    description: 'Assessment of student engagement and participation',
    icon: 'ParticipationIcon',
    color: 'yellow',
    defaultMaxScore: 20,
    defaultPassingScore: 10,
    defaultWeightage: 5,
  },
  [AssessmentCategory.ESSAY]: {
    label: 'Essay',
    description: 'Written essay assessment with rubric-based grading',
    icon: 'FileTextIcon',
    color: 'indigo',
    defaultMaxScore: 100,
    defaultPassingScore: 60,
    defaultWeightage: 20,
  },
  [AssessmentCategory.OTHER]: {
    label: 'Other',
    description: 'Custom assessment type',
    icon: 'OtherIcon',
    color: 'gray',
    defaultMaxScore: 100,
    defaultPassingScore: 60,
    defaultWeightage: 10,
  },
};

// Assessment type options for dropdowns
export const ASSESSMENT_TYPE_OPTIONS = Object.entries(ASSESSMENT_TYPE_METADATA).map(
  ([value, { label }]) => ({
    value,
    label,
  })
);

// Assessment type that can be printed
export const PRINTABLE_ASSESSMENT_TYPES = [
  AssessmentCategory.QUIZ,
  AssessmentCategory.TEST,
  AssessmentCategory.EXAM,
  AssessmentCategory.ASSIGNMENT,
  AssessmentCategory.ESSAY,
];

// Assessment types that support online submission
export const ONLINE_ASSESSMENT_TYPES = [
  AssessmentCategory.QUIZ,
  AssessmentCategory.TEST,
  AssessmentCategory.ASSIGNMENT,
  AssessmentCategory.ESSAY,
];

// Assessment types that support automatic grading
export const AUTO_GRADABLE_ASSESSMENT_TYPES = [
  AssessmentCategory.QUIZ,
  AssessmentCategory.TEST,
];
