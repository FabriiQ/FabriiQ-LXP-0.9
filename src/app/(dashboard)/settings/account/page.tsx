import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Account Settings | Aivy LXP',
  description: 'Manage your account settings in Aivy LXP',
};

export default function AccountSettingsPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Account Settings</h2>
      <p className="text-muted-foreground mb-6">
        Manage your account information and profile settings.
      </p>
      
      <div className="bg-card rounded-lg border p-6">
        <p>Account settings content will be implemented here.</p>
      </div>
    </div>
  );
} 