import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Notification Settings | Aivy LXP',
  description: 'Manage your notification preferences in Aivy LXP',
};

export default function NotificationSettingsPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Notification Settings</h2>
      <p className="text-muted-foreground mb-6">
        Control how and when you receive notifications from Aivy LXP.
      </p>
      
      <div className="bg-card rounded-lg border p-6">
        <p>Notification settings content will be implemented here.</p>
      </div>
    </div>
  );
} 