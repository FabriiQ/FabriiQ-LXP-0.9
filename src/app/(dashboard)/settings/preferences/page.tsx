import React from 'react';
import { PreferencesForm } from '@/components/user/preferences-form';
import { PreferencesProvider } from '@/contexts/preferences-context';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'User Preferences | Aivy LXP',
  description: 'Customize your Aivy LXP experience with personalized preferences',
};

export default function PreferencesPage() {
  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">User Preferences</h1>
        <p className="text-muted-foreground mt-2">
          Customize your experience with Aivy LXP. Your preferences will be saved and synced across devices.
        </p>
      </div>
      
      <PreferencesProvider>
        <PreferencesForm />
      </PreferencesProvider>
    </div>
  );
} 