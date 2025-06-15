'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Button } from '@/components/ui/atoms/button';
import { Switch } from '@/components/ui/atoms/switch';
import { Label } from '@/components/ui/atoms/label';
import { RadioGroup } from '@/components/ui/forms/radio';
import { Bell, Mail, MessageSquare, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function NotificationSettings() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Notification preferences state
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: true,
    inAppNotifications: true,
    marketingEmails: false,
    weeklyDigest: true,
    mentionNotifications: true,
    reminderFrequency: 'daily',
  });

  // Handle toggle changes
  const handleToggleChange = (key: keyof typeof preferences) => (checked: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: checked
    }));
  };

  // Handle radio changes
  const handleRadioChange = (key: keyof typeof preferences) => (value: string) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccess(false);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real app, you would call an API endpoint here
      // await updateNotificationPreferences(preferences);
      
      setSuccess(true);
      toast.success('Notification settings updated successfully');
    } catch (err) {
      setError('Failed to update notification settings. Please try again.');
      toast.error('Failed to update notification settings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>
            Manage how and when you receive notifications from the platform.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Notification Channels */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Notification Channels</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="email-notifications" className="flex-1">
                  Email Notifications
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </Label>
              </div>
              <Switch 
                id="email-notifications"
                checked={preferences.emailNotifications}
                onCheckedChange={handleToggleChange('emailNotifications')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="push-notifications" className="flex-1">
                  Push Notifications
                  <p className="text-sm text-muted-foreground">
                    Receive push notifications on your devices
                  </p>
                </Label>
              </div>
              <Switch 
                id="push-notifications"
                checked={preferences.pushNotifications}
                onCheckedChange={handleToggleChange('pushNotifications')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="inapp-notifications" className="flex-1">
                  In-App Notifications
                  <p className="text-sm text-muted-foreground">
                    Receive notifications within the application
                  </p>
                </Label>
              </div>
              <Switch 
                id="inapp-notifications"
                checked={preferences.inAppNotifications}
                onCheckedChange={handleToggleChange('inAppNotifications')}
              />
            </div>
          </div>
          
          {/* Notification Types */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Notification Types</h3>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="marketing-emails" className="flex-1">
                Marketing Emails
                <p className="text-sm text-muted-foreground">
                  Receive emails about new features and offers
                </p>
              </Label>
              <Switch 
                id="marketing-emails"
                checked={preferences.marketingEmails}
                onCheckedChange={handleToggleChange('marketingEmails')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="weekly-digest" className="flex-1">
                Weekly Digest
                <p className="text-sm text-muted-foreground">
                  Receive a weekly summary of your activity
                </p>
              </Label>
              <Switch 
                id="weekly-digest"
                checked={preferences.weeklyDigest}
                onCheckedChange={handleToggleChange('weeklyDigest')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="mention-notifications" className="flex-1">
                Mention Notifications
                <p className="text-sm text-muted-foreground">
                  Get notified when someone mentions you
                </p>
              </Label>
              <Switch 
                id="mention-notifications"
                checked={preferences.mentionNotifications}
                onCheckedChange={handleToggleChange('mentionNotifications')}
              />
            </div>
          </div>
          
          {/* Reminder Frequency */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Reminder Frequency</h3>
            <div className="flex items-start space-x-2">
              <Clock className="h-4 w-4 mt-1 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-2">
                  How often would you like to receive reminders?
                </p>
                <RadioGroup
                  name="reminder-frequency"
                  options={[
                    { value: 'daily', label: 'Daily' },
                    { value: 'weekly', label: 'Weekly' },
                    { value: 'monthly', label: 'Monthly' },
                    { value: 'never', label: 'Never' }
                  ]}
                  value={preferences.reminderFrequency}
                  onChange={handleRadioChange('reminderFrequency')}
                  direction="vertical"
                />
              </div>
            </div>
          </div>
          
          {/* Status Messages */}
          {error && (
            <div className="text-sm text-destructive">{error}</div>
          )}
          {success && (
            <div className="text-sm text-success">Settings updated successfully!</div>
          )}
        </CardContent>
        
        <CardFooter>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
} 