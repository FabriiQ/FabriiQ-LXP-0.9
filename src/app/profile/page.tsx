'use client';

import React from 'react';
import { Tabs } from '@/components/ui/navigation/tabs';
import { ProfileForm } from '@/components/user/profile-form';
import { PasswordForm } from '@/components/user/password-form';
import { NotificationSettings } from '@/components/user/notification-settings';
import { User, Lock, Bell } from 'lucide-react';

export default function ProfilePage() {
  const tabItems = [
    {
      id: 'profile',
      label: (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span>Profile Information</span>
        </div>
      ),
      content: <ProfileForm />
    },
    {
      id: 'password',
      label: (
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4" />
          <span>Password</span>
        </div>
      ),
      content: <PasswordForm />
    },
    {
      id: 'notifications',
      label: (
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          <span>Notifications</span>
        </div>
      ),
      content: <NotificationSettings />
    }
  ];

  return (
    <>
      <h1 className="text-3xl font-bold mb-6">Account Settings</h1>
      <Tabs 
        items={tabItems} 
        variant="underline"
        className="w-full mb-8"
      />
    </>
  );
} 