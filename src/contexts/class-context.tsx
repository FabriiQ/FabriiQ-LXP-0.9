'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// Define the shape of the subject data
interface Subject {
  id: string;
  name: string;
  code: string;
  color?: string;
}

// Define the shape of the class data
interface ClassData {
  className: string;
  courseName: string;
  termName?: string;
  averageGrade: number;
  leaderboardPosition: number;
  points: number;
  level: number;
  attendance: {
    present: number;
    total: number;
  };
  achievements: Array<{
    id?: string;
    title: string;
    description: string;
  }>;
  subjects: Subject[];
  // Add more fields as needed
}

// Define the shape of the context
interface ClassContextType {
  classId: string;
  className: string;
  loading: boolean;
  error: boolean;
  errorMessage?: string;
  data: ClassData | null;
  learningFact: string;
  retry: () => void;
}

// Create the context with a default value
const ClassContext = createContext<ClassContextType>({
  classId: '',
  className: '',
  loading: true,
  error: false,
  data: null,
  learningFact: '',
  retry: () => {}
});

// Learning facts for loading state
const learningFacts = [
  "The human brain can process information at the equivalent of 1 exaFLOP, faster than the world's most powerful supercomputer.",
  "Students who take handwritten notes retain information better than those who type notes on a laptop.",
  "The 'spacing effect' shows that studying in shorter sessions over time is more effective than cramming.",
  "Reading material out loud can improve memory retention by up to 10%.",
  "The brain processes images 60,000 times faster than text, which is why visual learning is so effective.",
  "Learning a new skill creates new neural pathways in your brain, a process called neuroplasticity.",
  "The average attention span for focused learning is about 25 minutes before a short break is beneficial.",
  "Studies show that teaching others what you've learned increases your own understanding and retention.",
  "Regular physical exercise has been shown to improve cognitive function and learning ability.",
  "Sleep is crucial for memory consolidation - studying right before bed can help retention."
];

// Provider component
export function ClassProvider({ children, classId = '123' }: { children: ReactNode, classId?: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [data, setData] = useState<ClassData | null>(null);
  const [learningFact, setLearningFact] = useState('');

  // Function to load class data
  const loadClassData = async () => {
    setLoading(true);
    setError(false);
    setErrorMessage(undefined);

    // Select a random learning fact
    setLearningFact(learningFacts[Math.floor(Math.random() * learningFacts.length)]);

    try {
      // In a real implementation, this would fetch data from the API
      // For now, we'll use a simulated API call with timeout
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Attempt to fetch from cache first if offline
      const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
      let cachedData = null;

      if (isOffline && typeof localStorage !== 'undefined') {
        try {
          const cached = localStorage.getItem(`class-data-${classId}`);
          if (cached) {
            cachedData = JSON.parse(cached);
            console.log('Using cached class data:', cachedData);
          }
        } catch (e) {
          console.error('Error reading from cache:', e);
        }
      }

      // If we have cached data and we're offline, use it
      if (isOffline && cachedData) {
        setData(cachedData);
        setLoading(false);
        return;
      }

      // In a real implementation, this would be an API call
      // For now, we'll use mock data
      const mockData: ClassData = {
        className: 'Mathematics 101',
        courseName: 'Introduction to Mathematics',
        termName: 'Spring 2023',
        averageGrade: 85,
        leaderboardPosition: 3,
        points: 1250,
        level: 12,
        attendance: {
          present: 18,
          total: 20
        },
        achievements: [
          {
            id: '1',
            title: 'Perfect Score',
            description: 'Achieved 100% on a quiz'
          },
          {
            id: '2',
            title: 'Fast Learner',
            description: 'Completed 5 activities in one day'
          },
          {
            id: '3',
            title: 'Consistent Effort',
            description: 'Logged in for 7 consecutive days'
          }
        ],
        subjects: [
          {
            id: 'subj-1',
            name: 'Algebra',
            code: 'ALG101',
            color: '#4F46E5' // Indigo
          },
          {
            id: 'subj-2',
            name: 'Geometry',
            code: 'GEO101',
            color: '#10B981' // Emerald
          },
          {
            id: 'subj-3',
            name: 'Statistics',
            code: 'STAT101',
            color: '#8B5CF6' // Violet
          },
          {
            id: 'subj-4',
            name: 'Calculus',
            code: 'CALC101',
            color: '#F59E0B' // Amber
          },
          {
            id: 'subj-5',
            name: 'Trigonometry',
            code: 'TRIG101',
            color: '#EC4899' // Pink
          }
        ]
      };

      // Cache the data for offline use
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(`class-data-${classId}`, JSON.stringify(mockData));
        } catch (e) {
          console.error('Error caching class data:', e);
        }
      }

      setData(mockData);
      setLoading(false);
    } catch (err) {
      setError(true);
      setErrorMessage('Failed to load class data. Please try again.');
      setLoading(false);

      // If offline, show a more specific error message
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setErrorMessage('You appear to be offline. Please check your connection and try again.');
      }
    }
  };

  // Load data on mount or when classId changes
  useEffect(() => {
    loadClassData();
  }, [classId]);

  return (
    <ClassContext.Provider
      value={{
        classId,
        className: data?.className || '',
        loading,
        error,
        errorMessage,
        data,
        learningFact,
        retry: loadClassData
      }}
    >
      {children}
    </ClassContext.Provider>
  );
}

// Custom hook to use the class context
export function useClass() {
  const context = useContext(ClassContext);
  if (context === undefined) {
    throw new Error('useClass must be used within a ClassProvider');
  }
  return context;
}
