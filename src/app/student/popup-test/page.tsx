'use client';

import { useState } from 'react';
import { AchievementPopup } from '@/components/student/AchievementPopup';
import { PointsDetailPopup } from '@/components/student/PointsDetailPopup';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ThemeProvider } from '@/providers/theme-provider';

/**
 * Test page for popup components
 * 
 * This page allows testing both the AchievementPopup and PointsDetailPopup components
 * with various configurations.
 */
export default function PopupTestPage() {
  // Achievement popup state
  const [showAchievement, setShowAchievement] = useState(false);
  const [achievementType, setAchievementType] = useState<string>('milestone');
  const [showConfetti, setShowConfetti] = useState(true);
  const [enableSounds, setEnableSounds] = useState(true);
  const [enableHaptic, setEnableHaptic] = useState(true);
  
  // Points detail popup state
  const [showPointsDetail, setShowPointsDetail] = useState(false);
  const [streakDays, setStreakDays] = useState(3);
  
  // Mock data for points detail
  const pointsData = {
    current: 1250,
    total: 1250,
    recentlyEarned: 75,
    breakdown: [
      { source: 'Completed Math Quiz', amount: 25, date: 'Today' },
      { source: 'Login Streak Bonus', amount: 15, date: 'Today' },
      { source: 'Completed Reading Activity', amount: 35, date: 'Yesterday' },
      { source: 'Answered Discussion Question', amount: 10, date: '2 days ago' },
      { source: 'Completed Science Activity', amount: 30, date: '3 days ago' },
    ]
  };
  
  const levelData = {
    current: 5,
    progress: 65,
    pointsToNextLevel: 350
  };
  
  // Update user preferences in localStorage
  const updatePreferences = () => {
    localStorage.setItem('enableSounds', enableSounds.toString());
    localStorage.setItem('enableHaptic', enableHaptic.toString());
  };
  
  // Handle achievement share
  const handleShare = () => {
    alert('Sharing achievement...');
  };
  
  // Handle achievement snooze
  const handleSnooze = () => {
    setShowAchievement(false);
    setTimeout(() => {
      alert('Achievement reminder snoozed for later');
    }, 500);
  };
  
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
          <h1 className="text-3xl font-bold mb-6">Popup Components Test</h1>
          
          <Tabs defaultValue="achievement">
            <TabsList className="mb-4">
              <TabsTrigger value="achievement">Achievement Popup</TabsTrigger>
              <TabsTrigger value="points">Points Detail Popup</TabsTrigger>
            </TabsList>
            
            <TabsContent value="achievement">
              <Card>
                <CardHeader>
                  <CardTitle>Achievement Popup</CardTitle>
                  <CardDescription>
                    Test the AchievementPopup component with different configurations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="achievement-type">Achievement Type</Label>
                        <Select 
                          value={achievementType} 
                          onValueChange={setAchievementType}
                        >
                          <SelectTrigger id="achievement-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="class">Class</SelectItem>
                            <SelectItem value="subject">Subject</SelectItem>
                            <SelectItem value="login">Login</SelectItem>
                            <SelectItem value="streak">Streak</SelectItem>
                            <SelectItem value="milestone">Milestone</SelectItem>
                            <SelectItem value="special">Special</SelectItem>
                            <SelectItem value="grade">Grade</SelectItem>
                            <SelectItem value="activity">Activity</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="confetti" 
                          checked={showConfetti} 
                          onCheckedChange={setShowConfetti}
                        />
                        <Label htmlFor="confetti">Show Confetti</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="sounds" 
                          checked={enableSounds} 
                          onCheckedChange={(checked) => {
                            setEnableSounds(checked);
                            localStorage.setItem('enableSounds', checked.toString());
                          }}
                        />
                        <Label htmlFor="sounds">Enable Sounds</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="haptic" 
                          checked={enableHaptic} 
                          onCheckedChange={(checked) => {
                            setEnableHaptic(checked);
                            localStorage.setItem('enableHaptic', checked.toString());
                          }}
                        />
                        <Label htmlFor="haptic">Enable Haptic Feedback</Label>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <p className="text-muted-foreground">
                        This popup demonstrates:
                      </p>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>Entrance/exit animations that draw attention without jarring users</li>
                        <li>Confetti celebration effects (Peak-End Rule)</li>
                        <li>Encouraging language that emphasizes growth mindset</li>
                        <li>Storytelling elements in achievement descriptions</li>
                        <li>Haptic feedback for mobile users (Sensory Appeal)</li>
                        <li>Sound effects (respecting user preferences)</li>
                        <li>"Share achievement" option for social validation</li>
                        <li>Accessibility features (keyboard navigation, ARIA)</li>
                        <li>"Snooze" option for notifications (user control)</li>
                        <li>Exit points that invite users to continue</li>
                      </ul>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => {
                      updatePreferences();
                      setShowAchievement(true);
                    }}
                    className="w-full"
                  >
                    Show Achievement Popup
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="points">
              <Card>
                <CardHeader>
                  <CardTitle>Points Detail Popup</CardTitle>
                  <CardDescription>
                    Test the PointsDetailPopup component with different configurations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="streak-days">Streak Days</Label>
                        <Select 
                          value={streakDays.toString()} 
                          onValueChange={(value) => setStreakDays(parseInt(value))}
                        >
                          <SelectTrigger id="streak-days">
                            <SelectValue placeholder="Select streak days" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">No streak</SelectItem>
                            <SelectItem value="1">1 day</SelectItem>
                            <SelectItem value="3">3 days</SelectItem>
                            <SelectItem value="5">5 days</SelectItem>
                            <SelectItem value="7">7 days</SelectItem>
                            <SelectItem value="10">10 days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="sounds-points" 
                          checked={enableSounds} 
                          onCheckedChange={(checked) => {
                            setEnableSounds(checked);
                            localStorage.setItem('enableSounds', checked.toString());
                          }}
                        />
                        <Label htmlFor="sounds-points">Enable Sounds</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="haptic-points" 
                          checked={enableHaptic} 
                          onCheckedChange={(checked) => {
                            setEnableHaptic(checked);
                            localStorage.setItem('enableHaptic', checked.toString());
                          }}
                        />
                        <Label htmlFor="haptic-points">Enable Haptic Feedback</Label>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <p className="text-muted-foreground">
                        This popup demonstrates:
                      </p>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>Progress visualization with clear metrics</li>
                        <li>Variable rewards for consecutive days (Variable Reward)</li>
                        <li>Entrance/exit animations that are smooth and non-jarring</li>
                        <li>Haptic feedback for mobile users (Sensory Appeal)</li>
                        <li>Sound effects (respecting user preferences)</li>
                        <li>Accessibility features (keyboard navigation, ARIA)</li>
                        <li>Confetti for notable streaks (5+ days)</li>
                        <li>Clear organization of information (Progressive Disclosure)</li>
                      </ul>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => {
                      updatePreferences();
                      setShowPointsDetail(true);
                    }}
                    className="w-full"
                  >
                    Show Points Detail Popup
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          {/* Achievement Popup */}
          <AchievementPopup
            title={
              achievementType === 'class' ? "Math Master" :
              achievementType === 'subject' ? "Science Explorer" :
              achievementType === 'login' ? "Consistent Learner" :
              achievementType === 'streak' ? "7-Day Streak" :
              achievementType === 'milestone' ? "100 Activities Completed" :
              achievementType === 'special' ? "Early Adopter" :
              achievementType === 'grade' ? "Perfect Score" :
              "Quick Learner"
            }
            description={
              achievementType === 'class' ? "You've mastered 5 math concepts in a row!" :
              achievementType === 'subject' ? "You've completed all science activities this week!" :
              achievementType === 'login' ? "You've logged in for 5 consecutive days!" :
              achievementType === 'streak' ? "You've maintained activity for a full week!" :
              achievementType === 'milestone' ? "You've completed 100 learning activities!" :
              achievementType === 'special' ? "You're one of the first to use our new feature!" :
              achievementType === 'grade' ? "You got 100% on your recent assessment!" :
              "You completed 3 activities in one day!"
            }
            type={achievementType as any}
            isVisible={showAchievement}
            onClose={() => setShowAchievement(false)}
            onShare={handleShare}
            onSnooze={handleSnooze}
            showConfetti={showConfetti}
          />
          
          {/* Points Detail Popup */}
          <PointsDetailPopup
            isVisible={showPointsDetail}
            onClose={() => setShowPointsDetail(false)}
            points={pointsData}
            level={levelData}
            streak={streakDays > 0 ? { days: streakDays, maxDays: 14 } : undefined}
          />
        </div>
      </div>
    </ThemeProvider>
  );
}
