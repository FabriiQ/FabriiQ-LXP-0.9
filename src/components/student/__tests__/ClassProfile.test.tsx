import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ClassProfile } from '../ClassProfile';

// Mock data for testing
const mockAchievements = [
  {
    id: '1',
    title: 'Perfect Attendance',
    description: 'Attend all classes for a month',
    type: 'attendance',
    progress: 25,
    total: 30,
    unlocked: false,
    icon: 'calendar',
    classId: 'class-1',
    className: 'Mathematics 101'
  },
  {
    id: '2',
    title: 'Quiz Master',
    description: 'Score 90% or higher on 5 quizzes',
    type: 'academic',
    progress: 3,
    total: 5,
    unlocked: false,
    icon: 'star',
    classId: 'class-1',
    className: 'Mathematics 101'
  }
];

const mockLearningGoals = [
  {
    id: '1',
    title: 'Master Algebra Equations',
    description: 'Be able to solve complex algebraic equations',
    progress: 70,
    total: 100,
    createdAt: new Date('2023-04-01'),
    isCustom: false
  }
];

const mockPointsHistory = [
  {
    id: '1',
    amount: 50,
    source: 'activity',
    description: 'Completed quiz with 90% score',
    createdAt: new Date('2023-06-10'),
    className: 'Mathematics 101'
  }
];

const mockStats = {
  totalPoints: 1250,
  level: 5,
  levelProgress: 65,
  levelTotal: 100,
  attendanceRate: 92,
  averageGrade: 'A-',
  completedActivities: 28,
  totalActivities: 35
};

// Mock handlers
const mockHandlers = {
  onAchievementClick: jest.fn(),
  onGoalCreate: jest.fn(),
  onGoalEdit: jest.fn(),
  onAvatarChange: jest.fn()
};

describe('ClassProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders student information correctly', () => {
    render(
      <ClassProfile
        classId="class-1"
        className="Mathematics 101"
        studentId="student-1"
        studentName="John Doe"
        studentImage="https://avatar.vercel.sh/johndoe"
        achievements={mockAchievements}
        learningGoals={mockLearningGoals}
        pointsHistory={mockPointsHistory}
        stats={mockStats}
        {...mockHandlers}
      />
    );

    // Check student name is displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    
    // Check class name is displayed
    expect(screen.getByText('Mathematics 101')).toBeInTheDocument();
    
    // Check stats are displayed
    expect(screen.getByText('Level 5')).toBeInTheDocument();
    expect(screen.getByText('1250')).toBeInTheDocument();
    expect(screen.getByText('92%')).toBeInTheDocument();
    expect(screen.getByText('A-')).toBeInTheDocument();
    expect(screen.getByText('28/35')).toBeInTheDocument();
  });

  it('displays achievements correctly', () => {
    render(
      <ClassProfile
        classId="class-1"
        className="Mathematics 101"
        studentId="student-1"
        studentName="John Doe"
        studentImage="https://avatar.vercel.sh/johndoe"
        achievements={mockAchievements}
        learningGoals={mockLearningGoals}
        pointsHistory={mockPointsHistory}
        stats={mockStats}
        {...mockHandlers}
      />
    );

    // Check achievements tab exists
    expect(screen.getByRole('tab', { name: /achievements/i })).toBeInTheDocument();
    
    // Click on achievements tab
    fireEvent.click(screen.getByRole('tab', { name: /achievements/i }));
    
    // Check achievement titles are displayed
    expect(screen.getByText('Perfect Attendance')).toBeInTheDocument();
    expect(screen.getByText('Quiz Master')).toBeInTheDocument();
  });

  it('displays learning goals correctly', () => {
    render(
      <ClassProfile
        classId="class-1"
        className="Mathematics 101"
        studentId="student-1"
        studentName="John Doe"
        studentImage="https://avatar.vercel.sh/johndoe"
        achievements={mockAchievements}
        learningGoals={mockLearningGoals}
        pointsHistory={mockPointsHistory}
        stats={mockStats}
        {...mockHandlers}
      />
    );

    // Check learning goals tab exists
    expect(screen.getByRole('tab', { name: /learning goals/i })).toBeInTheDocument();
    
    // Click on learning goals tab
    fireEvent.click(screen.getByRole('tab', { name: /learning goals/i }));
    
    // Check learning goal title is displayed
    expect(screen.getByText('Master Algebra Equations')).toBeInTheDocument();
    
    // Check learning goal description is displayed
    expect(screen.getByText('Be able to solve complex algebraic equations')).toBeInTheDocument();
  });

  it('displays points history correctly', () => {
    render(
      <ClassProfile
        classId="class-1"
        className="Mathematics 101"
        studentId="student-1"
        studentName="John Doe"
        studentImage="https://avatar.vercel.sh/johndoe"
        achievements={mockAchievements}
        learningGoals={mockLearningGoals}
        pointsHistory={mockPointsHistory}
        stats={mockStats}
        {...mockHandlers}
      />
    );

    // Check points history tab exists
    expect(screen.getByRole('tab', { name: /points history/i })).toBeInTheDocument();
    
    // Click on points history tab
    fireEvent.click(screen.getByRole('tab', { name: /points history/i }));
    
    // Check points history description is displayed
    expect(screen.getByText('Completed quiz with 90% score')).toBeInTheDocument();
    
    // Check points amount is displayed
    expect(screen.getByText('+50')).toBeInTheDocument();
  });

  it('allows avatar customization', () => {
    render(
      <ClassProfile
        classId="class-1"
        className="Mathematics 101"
        studentId="student-1"
        studentName="John Doe"
        studentImage="https://avatar.vercel.sh/johndoe"
        achievements={mockAchievements}
        learningGoals={mockLearningGoals}
        pointsHistory={mockPointsHistory}
        stats={mockStats}
        {...mockHandlers}
      />
    );

    // Check customize avatar button exists
    const customizeButton = screen.getByRole('button', { name: /customize avatar/i });
    expect(customizeButton).toBeInTheDocument();
    
    // Click on customize avatar button
    fireEvent.click(customizeButton);
    
    // Check avatar options are displayed
    expect(screen.getByText('Choose Your Avatar')).toBeInTheDocument();
    
    // Click on an avatar option
    const avatarOptions = screen.getAllByRole('img', { name: /avatar/i });
    fireEvent.click(avatarOptions[0]);
    
    // Check onAvatarChange was called
    expect(mockHandlers.onAvatarChange).toHaveBeenCalled();
  });

  it('allows creating learning goals', () => {
    render(
      <ClassProfile
        classId="class-1"
        className="Mathematics 101"
        studentId="student-1"
        studentName="John Doe"
        studentImage="https://avatar.vercel.sh/johndoe"
        achievements={mockAchievements}
        learningGoals={mockLearningGoals}
        pointsHistory={mockPointsHistory}
        stats={mockStats}
        {...mockHandlers}
      />
    );

    // Click on learning goals tab
    fireEvent.click(screen.getByRole('tab', { name: /learning goals/i }));
    
    // Check add goal button exists
    const addGoalButton = screen.getByRole('button', { name: /add goal/i });
    expect(addGoalButton).toBeInTheDocument();
    
    // Click on add goal button
    fireEvent.click(addGoalButton);
    
    // Check goal form is displayed
    expect(screen.getByText('Create New Learning Goal')).toBeInTheDocument();
    
    // Fill out the form
    fireEvent.change(screen.getByPlaceholderText(/e.g., Master algebra equations/i), {
      target: { value: 'Complete all practice exercises' }
    });
    
    fireEvent.change(screen.getByPlaceholderText(/Describe your goal in more detail/i), {
      target: { value: 'Finish all the practice exercises in chapters 1-5' }
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create goal/i }));
    
    // Check onGoalCreate was called with correct data
    expect(mockHandlers.onGoalCreate).toHaveBeenCalledWith({
      title: 'Complete all practice exercises',
      description: 'Finish all the practice exercises in chapters 1-5',
      progress: 0,
      total: 100,
      isCustom: true
    });
  });
});
