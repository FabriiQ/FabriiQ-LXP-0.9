export interface Course {
  id: string;
  name: string;
  code: string;
  description: string | null;
  program: {
    id: string;
    name: string;
    code: string;
  };
  _count: {
    campusOfferings: number;
    subjects: number;
  };
  // Add other course properties as needed
} 