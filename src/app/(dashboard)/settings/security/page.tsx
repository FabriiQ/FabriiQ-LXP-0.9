import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Security Settings | Aivy LXP',
  description: 'Manage your security settings in Aivy LXP',
};

export default function SecuritySettingsPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Security Settings</h2>
      <p className="text-muted-foreground mb-6">
        Manage your password, two-factor authentication, and other security settings.
      </p>
      
      <div className="bg-card rounded-lg border p-6">
        <p>Security settings content will be implemented here.</p>
      </div>
    </div>
  );
} 