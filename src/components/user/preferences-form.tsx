import React, { useState } from 'react';
import { usePreferences } from '@/contexts/preferences-context';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Button } from '@/components/ui/atoms/button';
import { RadioGroup } from '@/components/ui/forms/radio';
import { Checkbox } from '@/components/ui/forms/checkbox';
import { Switch } from '@/components/ui/atoms/switch';
import { Label } from '@/components/ui/atoms/label';
import { Separator } from '@/components/ui/atoms/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/feedback/alert';
import { AlertCircle, Check, Moon, Sun, Monitor, Bell, Eye, Accessibility } from 'lucide-react';
import { UserPreferences } from '@/server/api/constants';

export function PreferencesForm() {
  const { preferences, isLoading, error, updatePreferences, resetPreferences } = usePreferences();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Create a local copy of preferences for the form
  const [formValues, setFormValues] = useState<UserPreferences>(preferences);

  // Update form values when preferences change
  React.useEffect(() => {
    setFormValues(preferences);
  }, [preferences]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await updatePreferences(formValues);
      setSaveSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle reset to defaults
  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset all preferences to default values?')) {
      setIsSaving(true);
      setSaveError(null);
      setSaveSuccess(false);

      try {
        await resetPreferences();
        setSaveSuccess(true);
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSaveSuccess(false);
        }, 3000);
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : 'Failed to reset preferences');
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Handle form field changes
  const handleChange = (section: keyof UserPreferences, field: string, value: boolean | string) => {
    setFormValues(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as Record<string, any>),
        [field]: value
      }
    }));
  };

  const [activeTab, setActiveTab] = useState<'theme' | 'notifications' | 'display' | 'accessibility'>('theme');

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>User Preferences</CardTitle>
          <CardDescription>
            Customize your experience with Aivy LXP. Changes will be saved automatically and synced across your devices.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* Custom Tabs Implementation */}
          <div className="w-full">
            {/* Tab Navigation */}
            <div className="grid grid-cols-4 mb-8 border-b border-border">
              <button 
                type="button"
                role="tab" 
                aria-selected={activeTab === 'theme'}
                onClick={() => setActiveTab('theme')} 
                className={`flex items-center gap-2 justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                  activeTab === 'theme' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sun className="h-4 w-4" />
                <span>Theme</span>
              </button>
              <button 
                type="button"
                role="tab" 
                aria-selected={activeTab === 'notifications'}
                onClick={() => setActiveTab('notifications')} 
                className={`flex items-center gap-2 justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                  activeTab === 'notifications' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Bell className="h-4 w-4" />
                <span>Notifications</span>
              </button>
              <button 
                type="button"
                role="tab" 
                aria-selected={activeTab === 'display'}
                onClick={() => setActiveTab('display')} 
                className={`flex items-center gap-2 justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                  activeTab === 'display' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Eye className="h-4 w-4" />
                <span>Display</span>
              </button>
              <button 
                type="button"
                role="tab" 
                aria-selected={activeTab === 'accessibility'}
                onClick={() => setActiveTab('accessibility')} 
                className={`flex items-center gap-2 justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                  activeTab === 'accessibility' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Accessibility className="h-4 w-4" />
                <span>Accessibility</span>
              </button>
            </div>
            
            {/* Tab Content */}
            <div className="relative mt-2">
              {/* Theme Settings */}
              {activeTab === 'theme' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Theme Preferences</h3>
                    <RadioGroup
                      name="theme"
                      value={formValues.theme}
                      onChange={(value) => setFormValues({ ...formValues, theme: value as 'light' | 'dark' | 'system' })}
                      options={[
                        { 
                          value: 'light', 
                          label: 'Light Theme', 
                          description: 'Use light mode for the interface',
                          icon: <Sun className="h-5 w-5" />
                        },
                        { 
                          value: 'dark', 
                          label: 'Dark Theme', 
                          description: 'Use dark mode for the interface',
                          icon: <Moon className="h-5 w-5" />
                        },
                        { 
                          value: 'system', 
                          label: 'System Theme', 
                          description: 'Follow your system preferences',
                          icon: <Monitor className="h-5 w-5" />
                        }
                      ]}
                    />
                  </div>
                </div>
              )}
              
              {/* Notification Settings */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Notification Preferences</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="email-notifications" className="text-base">Email Notifications</Label>
                          <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                        </div>
                        <Switch
                          id="email-notifications"
                          checked={formValues.notifications.email}
                          onCheckedChange={(checked: boolean) => handleChange('notifications', 'email', checked)}
                        />
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="push-notifications" className="text-base">Push Notifications</Label>
                          <p className="text-sm text-muted-foreground">Receive push notifications in your browser</p>
                        </div>
                        <Switch
                          id="push-notifications"
                          checked={formValues.notifications.push}
                          onCheckedChange={(checked: boolean) => handleChange('notifications', 'push', checked)}
                        />
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="inapp-notifications" className="text-base">In-App Notifications</Label>
                          <p className="text-sm text-muted-foreground">Show notifications within the application</p>
                        </div>
                        <Switch
                          id="inapp-notifications"
                          checked={formValues.notifications.inApp}
                          onCheckedChange={(checked: boolean) => handleChange('notifications', 'inApp', checked)}
                        />
                      </div>
                      
                      <Separator />
                      
                      <div className="pt-2">
                        <Label className="text-base mb-2 block">Digest Frequency</Label>
                        <p className="text-sm text-muted-foreground mb-4">How often would you like to receive notification digests?</p>
                        
                        <RadioGroup
                          name="digest"
                          value={formValues.notifications.digest}
                          onChange={(value) => handleChange('notifications', 'digest', value)}
                          options={[
                            { value: 'none', label: 'None', description: 'Do not send digest emails' },
                            { value: 'daily', label: 'Daily', description: 'Receive a daily summary' },
                            { value: 'weekly', label: 'Weekly', description: 'Receive a weekly summary' }
                          ]}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Display Settings */}
              {activeTab === 'display' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Display Preferences</h3>
                    
                    <div className="space-y-6">
                      <div>
                        <Label className="text-base mb-2 block">Interface Density</Label>
                        <p className="text-sm text-muted-foreground mb-4">Control how compact the interface appears</p>
                        
                        <RadioGroup
                          name="density"
                          value={formValues.display.density}
                          onChange={(value) => handleChange('display', 'density', value)}
                          options={[
                            { value: 'compact', label: 'Compact', description: 'Show more content with less spacing' },
                            { value: 'comfortable', label: 'Comfortable', description: 'Balanced spacing and content density' },
                            { value: 'spacious', label: 'Spacious', description: 'More space between elements' }
                          ]}
                        />
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <Label className="text-base mb-2 block">Font Size</Label>
                        <p className="text-sm text-muted-foreground mb-4">Adjust the text size throughout the application</p>
                        
                        <RadioGroup
                          name="fontSize"
                          value={formValues.display.fontSize}
                          onChange={(value) => handleChange('display', 'fontSize', value)}
                          options={[
                            { value: 'small', label: 'Small', description: 'Smaller text size' },
                            { value: 'medium', label: 'Medium', description: 'Default text size' },
                            { value: 'large', label: 'Large', description: 'Larger text size' }
                          ]}
                        />
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <Label className="text-base mb-2 block">Color Scheme</Label>
                        <p className="text-sm text-muted-foreground mb-4">Choose a color scheme for the interface</p>
                        
                        <RadioGroup
                          name="colorScheme"
                          value={formValues.display.colorScheme}
                          onChange={(value) => handleChange('display', 'colorScheme', value)}
                          options={[
                            { value: 'default', label: 'Default', description: 'Standard color scheme' },
                            { value: 'high-contrast', label: 'High Contrast', description: 'Increased contrast for better visibility' },
                            { value: 'pastel', label: 'Pastel', description: 'Softer, pastel color palette' }
                          ]}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Accessibility Settings */}
              {activeTab === 'accessibility' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Accessibility Preferences</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="reduce-motion" className="text-base">Reduce Motion</Label>
                          <p className="text-sm text-muted-foreground">Minimize animations and transitions</p>
                        </div>
                        <Switch
                          id="reduce-motion"
                          checked={formValues.accessibility.reduceMotion}
                          onCheckedChange={(checked: boolean) => handleChange('accessibility', 'reduceMotion', checked)}
                        />
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="high-contrast" className="text-base">High Contrast Mode</Label>
                          <p className="text-sm text-muted-foreground">Increase contrast for better visibility</p>
                        </div>
                        <Switch
                          id="high-contrast"
                          checked={formValues.accessibility.highContrast}
                          onCheckedChange={(checked: boolean) => handleChange('accessibility', 'highContrast', checked)}
                        />
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="screen-reader" className="text-base">Screen Reader Optimization</Label>
                          <p className="text-sm text-muted-foreground">Optimize the interface for screen readers</p>
                        </div>
                        <Switch
                          id="screen-reader"
                          checked={formValues.accessibility.screenReader}
                          onCheckedChange={(checked: boolean) => handleChange('accessibility', 'screenReader', checked)}
                        />
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="keyboard-navigation" className="text-base">Enhanced Keyboard Navigation</Label>
                          <p className="text-sm text-muted-foreground">Improve keyboard navigation throughout the app</p>
                        </div>
                        <Switch
                          id="keyboard-navigation"
                          checked={formValues.accessibility.keyboardNavigation}
                          onCheckedChange={(checked: boolean) => handleChange('accessibility', 'keyboardNavigation', checked)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Error and Success Messages */}
          {saveError && (
            <Alert variant="destructive" className="mt-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{saveError}</AlertDescription>
            </Alert>
          )}
          
          {saveSuccess && (
            <Alert variant="success" className="mt-6">
              <Check className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>Your preferences have been saved successfully.</AlertDescription>
            </Alert>
          )}
          
          {error && (
            <Alert variant="destructive" className="mt-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Loading Preferences</AlertTitle>
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={isSaving}
          >
            Reset to Defaults
          </Button>
          
          <Button
            type="submit"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Saving...
              </>
            ) : 'Save Preferences'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
} 