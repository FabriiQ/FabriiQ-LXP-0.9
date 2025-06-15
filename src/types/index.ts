export interface Assessment {
  id: string;
  title: string;
  description?: string;
  category: string;
  maxScore?: number;
  passingScore?: number;
  dueDate?: Date | string;
  isPublished?: boolean;
  status: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  _count?: {
    submissions: number;
  };
} 