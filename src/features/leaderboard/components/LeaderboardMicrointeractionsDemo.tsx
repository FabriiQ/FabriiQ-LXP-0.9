'use client';

import React, { useState, useEffect } from 'react';
import { BaseLeaderboardTable } from './BaseLeaderboardTable';
import { StandardLeaderboardEntry } from '../types/standard-leaderboard';
import { PersonalBestType } from './LeaderboardPersonalBestIndicator';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

/**
 * Demo component to showcase leaderboard microinteractions
 */
export function LeaderboardMicrointeractionsDemo() {
  const [leaderboard, setLeaderboard] = useState<StandardLeaderboardEntry[]>(generateMockLeaderboard());
  const [personalBests, setPersonalBests] = useState<Record<string, PersonalBestType[]>>(generateMockPersonalBests());
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [hasNewData, setHasNewData] = useState(false);
  const [enableAnimations, setEnableAnimations] = useState(true);
  const [enableHapticFeedback, setEnableHapticFeedback] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  
  // Function to simulate rank changes
  const simulateRankChanges = () => {
    setIsLoading(true);
    
    setTimeout(() => {
      const updatedLeaderboard = [...leaderboard];
      
      // Randomly change some ranks
      for (let i = 0; i < updatedLeaderboard.length; i++) {
        const shouldChange = Math.random() > 0.5;
        
        if (shouldChange) {
          const currentRank = updatedLeaderboard[i].rank;
          const newRank = Math.max(1, Math.min(updatedLeaderboard.length, currentRank + Math.floor(Math.random() * 5) - 2));
          
          // Skip if rank didn't change
          if (newRank === currentRank) continue;
          
          // Find the entry with the new rank
          const swapIndex = updatedLeaderboard.findIndex(entry => entry.rank === newRank);
          
          if (swapIndex !== -1) {
            // Update rank change values
            updatedLeaderboard[i].previousRank = updatedLeaderboard[i].rank;
            updatedLeaderboard[swapIndex].previousRank = updatedLeaderboard[swapIndex].rank;
            
            // Swap ranks
            updatedLeaderboard[i].rank = newRank;
            updatedLeaderboard[swapIndex].rank = currentRank;
            
            // Calculate rank changes
            updatedLeaderboard[i].rankChange = updatedLeaderboard[i].previousRank! - updatedLeaderboard[i].rank;
            updatedLeaderboard[swapIndex].rankChange = updatedLeaderboard[swapIndex].previousRank! - updatedLeaderboard[swapIndex].rank;
          }
        }
      }
      
      // Sort by rank
      updatedLeaderboard.sort((a, b) => a.rank - b.rank);
      
      setLeaderboard(updatedLeaderboard);
      setIsLoading(false);
      setLastUpdated(new Date());
      setHasNewData(true);
      
      // Reset new data flag after a delay
      setTimeout(() => {
        setHasNewData(false);
      }, 3000);
    }, 1000);
  };
  
  // Function to simulate new personal best
  const simulateNewPersonalBest = () => {
    // Pick a random student
    const studentIds = Object.keys(personalBests);
    const randomStudentId = studentIds[Math.floor(Math.random() * studentIds.length)];
    
    // Create a new personal best
    const newPersonalBest: PersonalBestType = {
      type: ['rank', 'points', 'academic', 'achievement'][Math.floor(Math.random() * 4)] as 'rank' | 'points' | 'academic' | 'achievement',
      value: Math.floor(Math.random() * 100),
      date: new Date()
    };
    
    // Update personal bests
    setPersonalBests(prev => ({
      ...prev,
      [randomStudentId]: [...(prev[randomStudentId] || []), newPersonalBest]
    }));
    
    // Update last updated
    setLastUpdated(new Date());
    setHasNewData(true);
    
    // Reset new data flag after a delay
    setTimeout(() => {
      setHasNewData(false);
    }, 3000);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Leaderboard Microinteractions Demo</h2>
          <p className="text-muted-foreground">
            Showcase of microinteractions for the leaderboard component
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Button 
            onClick={simulateRankChanges} 
            disabled={isLoading}
          >
            Simulate Rank Changes
          </Button>
          <Button 
            onClick={simulateNewPersonalBest} 
            variant="outline"
          >
            Simulate New Personal Best
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center space-x-2">
          <Switch 
            id="animations" 
            checked={enableAnimations} 
            onCheckedChange={setEnableAnimations} 
          />
          <Label htmlFor="animations">Enable Animations</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch 
            id="haptic" 
            checked={enableHapticFeedback} 
            onCheckedChange={setEnableHapticFeedback} 
          />
          <Label htmlFor="haptic">Enable Haptic Feedback</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch 
            id="reduced-motion" 
            checked={reducedMotion} 
            onCheckedChange={setReducedMotion} 
          />
          <Label htmlFor="reduced-motion">Reduced Motion</Label>
        </div>
      </div>
      
      <BaseLeaderboardTable
        leaderboard={leaderboard}
        title="Class Leaderboard"
        description="Student rankings based on performance with microinteractions"
        currentStudentId="student-1"
        isLoading={isLoading}
        showRankChange={true}
        showAcademicScore={true}
        showRewardPoints={true}
        showLevel={true}
        showAchievements={true}
        showDetails={true}
        lastUpdated={lastUpdated}
        hasNewData={hasNewData}
        onRefresh={simulateRankChanges}
        personalBests={personalBests}
        enableAnimations={enableAnimations}
        enableHapticFeedback={enableHapticFeedback}
        reducedMotion={reducedMotion}
      />
    </div>
  );
}

// Helper function to generate mock leaderboard data
function generateMockLeaderboard(): StandardLeaderboardEntry[] {
  return Array.from({ length: 10 }).map((_, index) => ({
    studentId: `student-${index + 1}`,
    studentName: `Student ${index + 1}`,
    studentAvatar: `https://api.dicebear.com/7.x/initials/svg?seed=Student ${index + 1}`,
    enrollmentNumber: `EN${1000 + index}`,
    academicScore: Math.floor(70 + Math.random() * 30),
    totalGradePoints: Math.floor(800 + Math.random() * 200),
    totalMaxGradePoints: 1000,
    rewardPoints: Math.floor(1000 + Math.random() * 5000),
    level: Math.floor(1 + Math.random() * 10),
    achievements: Math.floor(Math.random() * 20),
    completionRate: Math.floor(60 + Math.random() * 40),
    totalActivities: 50,
    completedActivities: Math.floor(30 + Math.random() * 20),
    rank: index + 1,
    previousRank: index + 1,
    rankChange: 0,
    consistencyScore: Math.floor(50 + Math.random() * 50),
    helpingScore: Math.floor(Math.random() * 100),
    challengeScore: Math.floor(Math.random() * 100),
    isAnonymous: false,
    lastUpdated: new Date()
  }));
}

// Helper function to generate mock personal bests
function generateMockPersonalBests(): Record<string, PersonalBestType[]> {
  const result: Record<string, PersonalBestType[]> = {};
  
  // Generate personal bests for some students
  for (let i = 1; i <= 5; i++) {
    const studentId = `student-${i}`;
    result[studentId] = [
      {
        type: 'rank',
        value: i,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      },
      {
        type: 'points',
        value: Math.floor(1000 + Math.random() * 5000),
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      }
    ];
  }
  
  return result;
}
