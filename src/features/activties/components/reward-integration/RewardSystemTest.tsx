"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityCompletionHandler } from "./ActivityCompletionHandler";
import { PointsAnimation } from "@/components/rewards/PointsAnimation";
import { AchievementNotification } from "@/components/rewards/AchievementNotification";

export function RewardSystemTest() {
  const [showPoints, setShowPoints] = useState(false);
  const [showAchievement, setShowAchievement] = useState(false);
  const [showFullReward, setShowFullReward] = useState(false);
  
  // Sample reward result for testing
  const sampleRewardResult = {
    points: 25,
    levelUp: true,
    newLevel: 3,
    achievements: [
      {
        id: "1",
        title: "First Activity Completed",
        description: "You've completed your first activity!",
        type: "activity"
      },
      {
        id: "2",
        title: "Perfect Score",
        description: "You got a perfect score on this activity!",
        type: "grade"
      }
    ]
  };

  return (
    <div className="space-y-8 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Reward System Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={() => setShowPoints(true)}
              className="bg-teal-600 hover:bg-teal-700"
            >
              Test Points Animation
            </Button>
            
            <Button 
              onClick={() => setShowAchievement(true)}
              className="bg-teal-600 hover:bg-teal-700"
            >
              Test Achievement Notification
            </Button>
            
            <Button 
              onClick={() => setShowFullReward(true)}
              className="bg-teal-600 hover:bg-teal-700"
            >
              Test Full Reward Flow
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Individual component tests */}
      <PointsAnimation 
        points={25} 
        isVisible={showPoints} 
        onComplete={() => setShowPoints(false)}
      />
      
      <AchievementNotification
        title="Test Achievement"
        description="This is a test achievement notification"
        type="activity"
        isVisible={showAchievement}
        onClose={() => setShowAchievement(false)}
      />
      
      {/* Full reward flow test */}
      <ActivityCompletionHandler
        rewardResult={showFullReward ? sampleRewardResult : null}
        onComplete={() => setShowFullReward(false)}
      >
        <Card>
          <CardContent className="p-4">
            <p>This is a test activity content.</p>
            <p className="text-sm text-gray-500 mt-2">
              The reward flow will automatically progress through points, level-up, and achievements.
            </p>
          </CardContent>
        </Card>
      </ActivityCompletionHandler>
    </div>
  );
}
