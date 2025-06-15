'use client';

import { useState } from 'react';
import { ClassLeaderboard } from '@/components/student/ClassLeaderboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Test page for the ClassLeaderboard component
 * 
 * This page allows testing the ClassLeaderboard component with different class IDs
 * and student IDs without needing to navigate through the app.
 */
export default function LeaderboardTestPage() {
  const [classId, setClassId] = useState('class-123');
  const [studentId, setStudentId] = useState('student-456');
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Leaderboard Component Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 space-y-2">
              <label htmlFor="classId" className="text-sm font-medium">Class ID</label>
              <Input 
                id="classId"
                value={classId} 
                onChange={(e) => setClassId(e.target.value)} 
                placeholder="Enter class ID" 
              />
            </div>
            <div className="flex-1 space-y-2">
              <label htmlFor="studentId" className="text-sm font-medium">Student ID (current user)</label>
              <Input 
                id="studentId"
                value={studentId} 
                onChange={(e) => setStudentId(e.target.value)} 
                placeholder="Enter student ID" 
              />
            </div>
          </div>
          <Button 
            onClick={() => {
              // Force refresh by changing the key
              setClassId(prev => prev === 'class-123' ? 'class-456' : 'class-123');
            }}
          >
            Toggle Class
          </Button>
        </CardContent>
      </Card>
      
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">ClassLeaderboard Component</h2>
        <ClassLeaderboard 
          classId={classId} 
          currentStudentId={studentId} 
        />
      </div>
    </div>
  );
}
