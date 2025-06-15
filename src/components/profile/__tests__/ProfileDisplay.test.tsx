import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProfileDisplay } from '../ProfileDisplay';
import { UserType } from '@prisma/client';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} src={props.src || ''} alt={props.alt || ''} />;
  },
}));

describe('ProfileDisplay', () => {
  const mockUser = {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    username: 'johndoe',
    userType: UserType.STUDENT,
    phoneNumber: '+1234567890',
    dateOfBirth: new Date('1990-01-01'),
    profileData: null,
    profileImageUrl: null,
  };

  const mockHandlers = {
    onEdit: jest.fn(),
    onChangePassword: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders user information correctly', () => {
    render(<ProfileDisplay user={mockUser} {...mockHandlers} />);

    // Check if user name is displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    
    // Check if user email is displayed
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    
    // Check if username is displayed
    expect(screen.getByText('johndoe')).toBeInTheDocument();
    
    // Check if user type is displayed
    expect(screen.getByText('Student')).toBeInTheDocument();
    
    // Check if phone number is displayed
    expect(screen.getByText('+1234567890')).toBeInTheDocument();
    
    // Check if date of birth is displayed (format may vary by locale)
    const dateRegex = /1\/1\/1990|01\/01\/1990|1990-01-01/;
    const dateElements = screen.getAllByText(dateRegex);
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it('displays initials when no profile image is provided', () => {
    render(<ProfileDisplay user={mockUser} {...mockHandlers} />);
    
    // Check if the first letter of the name is displayed
    const initial = screen.getByText('J');
    expect(initial).toBeInTheDocument();
  });

  it('displays profile image when provided', () => {
    const userWithImage = {
      ...mockUser,
      profileImageUrl: 'https://example.com/profile.jpg',
    };
    
    render(<ProfileDisplay user={userWithImage} {...mockHandlers} />);
    
    // Check if the image is rendered
    const image = screen.getByAltText('John Doe');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/profile.jpg');
  });

  it('displays additional profile data when available', () => {
    const userWithProfileData = {
      ...mockUser,
      profileData: {
        department: 'Computer Science',
        studentId: '12345',
      },
    };
    
    render(<ProfileDisplay user={userWithProfileData} {...mockHandlers} />);
    
    // Check if additional information section is displayed
    expect(screen.getByText('Additional Information')).toBeInTheDocument();
    
    // Check if profile data fields are displayed
    expect(screen.getByText('Department')).toBeInTheDocument();
    expect(screen.getByText('Computer Science')).toBeInTheDocument();
    expect(screen.getByText('Student Id')).toBeInTheDocument();
    expect(screen.getByText('12345')).toBeInTheDocument();
  });

  it('calls onEdit when Edit Profile button is clicked', () => {
    render(<ProfileDisplay user={mockUser} {...mockHandlers} />);
    
    // Find and click the Edit Profile button
    const editButton = screen.getByText('Edit Profile');
    fireEvent.click(editButton);
    
    // Check if onEdit was called
    expect(mockHandlers.onEdit).toHaveBeenCalledTimes(1);
  });

  it('calls onChangePassword when Change Password button is clicked', () => {
    render(<ProfileDisplay user={mockUser} {...mockHandlers} />);
    
    // Find and click the Change Password button
    const changePasswordButton = screen.getByText('Change Password');
    fireEvent.click(changePasswordButton);
    
    // Check if onChangePassword was called
    expect(mockHandlers.onChangePassword).toHaveBeenCalledTimes(1);
  });

  it('handles null values gracefully', () => {
    const userWithNulls = {
      ...mockUser,
      name: null,
      phoneNumber: null,
      dateOfBirth: null,
    };
    
    render(<ProfileDisplay user={userWithNulls} {...mockHandlers} />);
    
    // Check if fallback values are displayed
    expect(screen.getByText('johndoe')).toBeInTheDocument(); // Username as fallback for name
    expect(screen.getAllByText('Not specified').length).toBeGreaterThan(0);
  });
}); 