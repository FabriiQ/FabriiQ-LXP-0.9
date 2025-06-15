'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  CheckCircle,
  BarChart,
  Users,
  BookOpen,
  Award,
  Clock,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AssessmentCategory } from '@/server/api/constants';

interface AssessmentTypeSelectorProps {
  selectedType: AssessmentCategory;
  onSelect: (type: AssessmentCategory) => void;
}

const ASSESSMENT_TYPES = [
  {
    type: AssessmentCategory.QUIZ,
    title: 'Quiz',
    description: 'Short assessment with multiple choice, true/false, or brief answer questions',
    icon: CheckCircle,
    duration: '15-30 minutes',
    difficulty: 'Easy',
    bloomsLevels: ['Remember', 'Understand'],
    features: ['Quick feedback', 'Auto-grading', 'Multiple attempts'],
    color: 'bg-green-100 text-green-800 border-green-200'
  },
  {
    type: AssessmentCategory.EXAM,
    title: 'Exam',
    description: 'Comprehensive assessment covering multiple topics with various question types',
    icon: FileText,
    duration: '45-90 minutes',
    difficulty: 'Medium',
    bloomsLevels: ['Remember', 'Understand', 'Apply'],
    features: ['Detailed grading', 'Mixed question types', 'Formal assessment'],
    color: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  {
    type: AssessmentCategory.ASSIGNMENT,
    title: 'Assignment',
    description: 'Extended work requiring research, analysis, and detailed responses',
    icon: BookOpen,
    duration: '1-2 weeks',
    difficulty: 'Medium',
    bloomsLevels: ['Apply', 'Analyze', 'Evaluate'],
    features: ['Rubric grading', 'File submissions', 'Peer review'],
    color: 'bg-orange-100 text-orange-800 border-orange-200'
  },
  {
    type: AssessmentCategory.PROJECT,
    title: 'Project',
    description: 'Complex, creative work demonstrating mastery through practical application',
    icon: BarChart,
    duration: '2-4 weeks',
    difficulty: 'Hard',
    bloomsLevels: ['Analyze', 'Evaluate', 'Create'],
    features: ['Portfolio submission', 'Presentation component', 'Collaborative work'],
    color: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  {
    type: AssessmentCategory.CLASS_ACTIVITY,
    title: 'Class Activity',
    description: 'Interactive classroom assessment and participation tracking',
    icon: Users,
    duration: '10-20 minutes',
    difficulty: 'Medium',
    bloomsLevels: ['Understand', 'Apply', 'Create'],
    features: ['Live assessment', 'Communication skills', 'Q&A component'],
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200'
  },
  {
    type: AssessmentCategory.PRACTICAL,
    title: 'Practical',
    description: 'Hands-on assessment demonstrating practical skills and application',
    icon: Award,
    duration: '30-60 minutes',
    difficulty: 'Medium',
    bloomsLevels: ['Apply', 'Analyze'],
    features: ['Skill demonstration', 'Real-world application', 'Performance-based'],
    color: 'bg-teal-100 text-teal-800 border-teal-200'
  }
];

export function AssessmentTypeSelector({
  selectedType,
  onSelect
}: AssessmentTypeSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Choose Assessment Type *</h3>
        <p className="text-muted-foreground">
          Select the type of assessment that best fits your learning objectives and available time.
          <span className="text-red-600 font-medium"> This field is required.</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ASSESSMENT_TYPES.map((assessmentType) => {
          const Icon = assessmentType.icon;
          const isSelected = selectedType === assessmentType.type;

          return (
            <Card
              key={assessmentType.type}
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-md",
                isSelected
                  ? "ring-2 ring-primary border-primary bg-primary/5"
                  : "hover:border-primary/50"
              )}
              onClick={() => onSelect(assessmentType.type)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        {assessmentType.title}
                        {isSelected && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </CardTitle>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn("text-xs", assessmentType.color)}
                  >
                    {assessmentType.difficulty}
                  </Badge>
                </div>
                <CardDescription className="text-sm">
                  {assessmentType.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0 space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{assessmentType.duration}</span>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Bloom's Levels:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {assessmentType.bloomsLevels.map((level) => (
                      <Badge key={level} variant="secondary" className="text-xs">
                        {level}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Key Features:
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {assessmentType.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-1">
                        <div className="w-1 h-1 rounded-full bg-muted-foreground" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedType && (
        <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-primary">
            <Check className="h-4 w-4" />
            <span className="font-medium">
              Assessment type selected: {ASSESSMENT_TYPES.find(t => t.type === selectedType)?.title}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            This will help determine the appropriate grading methods and rubric suggestions.
          </p>
        </div>
      )}
    </div>
  );
}
