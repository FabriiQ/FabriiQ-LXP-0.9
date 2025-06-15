import React from 'react';
import Image from 'next/image';
import { UserType } from '@prisma/client';

interface ProfileDisplayProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    username: string;
    userType: UserType;
    phoneNumber: string | null;
    dateOfBirth: Date | null;
    profileData: Record<string, unknown> | null;
    profileImageUrl?: string | null;
  };
  onEdit: () => void;
  onChangePassword: () => void;
}

// Map user types to display names
const userTypeDisplayNames: Record<string, string> = {
  STUDENT: 'Student',
  TEACHER: 'Teacher',
  COORDINATOR: 'Coordinator',
  CAMPUS_ADMIN: 'Campus Administrator',
  SYSTEM_ADMIN: 'System Administrator',
  SYSTEM_MANAGER: 'System Manager',
  CAMPUS_COORDINATOR: 'Campus Coordinator',
  CAMPUS_TEACHER: 'Teacher',
  CAMPUS_STUDENT: 'Student',
  CAMPUS_PARENT: 'Parent',
};

export const ProfileDisplay: React.FC<ProfileDisplayProps> = ({
  user,
  onEdit,
  onChangePassword,
}) => {
  // Format date of birth for display
  const formattedDateOfBirth = user.dateOfBirth
    ? new Date(user.dateOfBirth).toLocaleDateString()
    : 'Not specified';

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">My Profile</h1>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Profile Image */}
        <div className="flex flex-col items-center">
          <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-100 mb-4">
            {user.profileImageUrl ? (
              <Image
                src={user.profileImageUrl}
                alt={user.name || user.username}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary-100 text-primary-800 text-4xl font-semibold">
                {user.name ? user.name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <h2 className="text-xl font-medium text-gray-900">
            {user.name || user.username}
          </h2>
          <p className="text-sm text-gray-500">{userTypeDisplayNames[user.userType] || String(user.userType)}</p>
        </div>

        {/* Profile Information */}
        <div className="flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Username</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.username}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">User Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {userTypeDisplayNames[user.userType] || String(user.userType)}
                  </dd>
                </div>
              </dl>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.name || 'Not specified'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phone Number</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {user.phoneNumber || 'Not specified'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formattedDateOfBirth}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Additional profile data could be rendered here based on user type */}
          {user.profileData && Object.keys(user.profileData).length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                {Object.entries(user.profileData).map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-sm font-medium text-gray-500">
                      {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {typeof value === 'string' ? value : JSON.stringify(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4 mt-8">
        <button
          onClick={onChangePassword}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Change Password
        </button>
        <button
          onClick={onEdit}
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Edit Profile
        </button>
      </div>
    </div>
  );
};

export default ProfileDisplay; 