'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { api } from '@/trpc/react';
import { Bell, BellOff, Clock, Mail, MessageSquare, School } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  icon: React.ReactNode;
  category: 'email' | 'push' | 'in_app';
}

interface NotificationSettingsProps {
  teacherId: string;
  initialSettings?: NotificationSetting[];
  className?: string;
}

/**
 * NotificationSettings component for managing notification preferences
 * 
 * Features:
 * - Toggle switches for different notification types
 * - Grouped by category (email, push, in-app)
 * - Visual indicators with icons
 * - Save functionality with feedback
 */
export function NotificationSettings({
  teacherId,
  initialSettings,
  className
}: NotificationSettingsProps) {
  // Default settings if none provided
  const defaultSettings: NotificationSetting[] = [
    {
      id: 'class_updates_email',
      label: 'Class Updates',
      description: 'Receive emails about class changes and announcements',
      enabled: true,
      icon: <School className="h-4 w-4" />,
      category: 'email'
    },
    {
      id: 'student_submissions_email',
      label: 'Student Submissions',
      description: 'Get emails when students submit assignments',
      enabled: true,
      icon: <MessageSquare className="h-4 w-4" />,
      category: 'email'
    },
    {
      id: 'assessment_reminders_email',
      label: 'Assessment Reminders',
      description: 'Receive email reminders about upcoming assessments',
      enabled: true,
      icon: <Clock className="h-4 w-4" />,
      category: 'email'
    },
    {
      id: 'class_updates_push',
      label: 'Class Updates',
      description: 'Receive push notifications about class changes',
      enabled: true,
      icon: <School className="h-4 w-4" />,
      category: 'push'
    },
    {
      id: 'student_submissions_push',
      label: 'Student Submissions',
      description: 'Get push notifications for new submissions',
      enabled: false,
      icon: <MessageSquare className="h-4 w-4" />,
      category: 'push'
    },
    {
      id: 'assessment_reminders_push',
      label: 'Assessment Reminders',
      description: 'Receive push reminders about upcoming assessments',
      enabled: true,
      icon: <Clock className="h-4 w-4" />,
      category: 'push'
    },
    {
      id: 'class_updates_in_app',
      label: 'Class Updates',
      description: 'See in-app notifications for class changes',
      enabled: true,
      icon: <School className="h-4 w-4" />,
      category: 'in_app'
    },
    {
      id: 'student_submissions_in_app',
      label: 'Student Submissions',
      description: 'See in-app notifications for new submissions',
      enabled: true,
      icon: <MessageSquare className="h-4 w-4" />,
      category: 'in_app'
    },
    {
      id: 'assessment_reminders_in_app',
      label: 'Assessment Reminders',
      description: 'See in-app reminders about upcoming assessments',
      enabled: true,
      icon: <Clock className="h-4 w-4" />,
      category: 'in_app'
    },
  ];

  const [settings, setSettings] = useState<NotificationSetting[]>(
    initialSettings || defaultSettings
  );
  
  const [isSaving, setIsSaving] = useState(false);

  // Group settings by category
  const emailSettings = settings.filter(s => s.category === 'email');
  const pushSettings = settings.filter(s => s.category === 'push');
  const inAppSettings = settings.filter(s => s.category === 'in_app');

  // Toggle a setting
  const toggleSetting = (id: string) => {
    setSettings(prev =>
      prev.map(setting =>
        setting.id === id
          ? { ...setting, enabled: !setting.enabled }
          : setting
      )
    );
  };

  // Toggle all settings in a category
  const toggleCategory = (category: 'email' | 'push' | 'in_app', enabled: boolean) => {
    setSettings(prev =>
      prev.map(setting =>
        setting.category === category
          ? { ...setting, enabled }
          : setting
      )
    );
  };

  // Check if all settings in a category are enabled/disabled
  const isCategoryEnabled = (category: 'email' | 'push' | 'in_app') => {
    const categorySettings = settings.filter(s => s.category === category);
    return categorySettings.every(s => s.enabled);
  };

  const isCategoryPartiallyEnabled = (category: 'email' | 'push' | 'in_app') => {
    const categorySettings = settings.filter(s => s.category === category);
    const enabledCount = categorySettings.filter(s => s.enabled).length;
    return enabledCount > 0 && enabledCount < categorySettings.length;
  };

  // Save settings
  const saveSettings = async () => {
    setIsSaving(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success toast
      toast({
        title: "Settings saved",
        description: "Your notification preferences have been updated.",
      });
    } catch (error) {
      // Show error toast
      toast({
        title: "Error saving settings",
        description: "There was a problem saving your preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
        <CardDescription>
          Manage how you receive notifications and alerts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Email Notifications */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-medium">Email Notifications</h3>
            </div>
            <Switch
              checked={isCategoryEnabled('email')}
              onCheckedChange={(checked) => toggleCategory('email', checked)}
              aria-label="Toggle all email notifications"
              data-state={
                isCategoryPartiallyEnabled('email')
                  ? "indeterminate"
                  : isCategoryEnabled('email')
                  ? "checked"
                  : "unchecked"
              }
            />
          </div>
          
          <div className="space-y-4 pl-7">
            {emailSettings.map(setting => (
              <div key={setting.id} className="flex items-start justify-between space-x-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {setting.icon}
                    <Label htmlFor={setting.id} className="text-base font-medium">
                      {setting.label}
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {setting.description}
                  </p>
                </div>
                <Switch
                  id={setting.id}
                  checked={setting.enabled}
                  onCheckedChange={() => toggleSetting(setting.id)}
                  aria-label={`Toggle ${setting.label} email notifications`}
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* Push Notifications */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-medium">Push Notifications</h3>
            </div>
            <Switch
              checked={isCategoryEnabled('push')}
              onCheckedChange={(checked) => toggleCategory('push', checked)}
              aria-label="Toggle all push notifications"
              data-state={
                isCategoryPartiallyEnabled('push')
                  ? "indeterminate"
                  : isCategoryEnabled('push')
                  ? "checked"
                  : "unchecked"
              }
            />
          </div>
          
          <div className="space-y-4 pl-7">
            {pushSettings.map(setting => (
              <div key={setting.id} className="flex items-start justify-between space-x-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {setting.icon}
                    <Label htmlFor={setting.id} className="text-base font-medium">
                      {setting.label}
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {setting.description}
                  </p>
                </div>
                <Switch
                  id={setting.id}
                  checked={setting.enabled}
                  onCheckedChange={() => toggleSetting(setting.id)}
                  aria-label={`Toggle ${setting.label} push notifications`}
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* In-App Notifications */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-medium">In-App Notifications</h3>
            </div>
            <Switch
              checked={isCategoryEnabled('in_app')}
              onCheckedChange={(checked) => toggleCategory('in_app', checked)}
              aria-label="Toggle all in-app notifications"
              data-state={
                isCategoryPartiallyEnabled('in_app')
                  ? "indeterminate"
                  : isCategoryEnabled('in_app')
                  ? "checked"
                  : "unchecked"
              }
            />
          </div>
          
          <div className="space-y-4 pl-7">
            {inAppSettings.map(setting => (
              <div key={setting.id} className="flex items-start justify-between space-x-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {setting.icon}
                    <Label htmlFor={setting.id} className="text-base font-medium">
                      {setting.label}
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {setting.description}
                  </p>
                </div>
                <Switch
                  id={setting.id}
                  checked={setting.enabled}
                  onCheckedChange={() => toggleSetting(setting.id)}
                  aria-label={`Toggle ${setting.label} in-app notifications`}
                />
              </div>
            ))}
          </div>
        </div>
        
        <Button 
          onClick={saveSettings} 
          disabled={isSaving}
          className="w-full sm:w-auto"
        >
          {isSaving ? 'Saving...' : 'Save Notification Settings'}
        </Button>
      </CardContent>
    </Card>
  );
}
