/**
 * Script to add sample journey events for testing the visual timeline
 * 
 * This script adds a series of journey events to a student's profile
 * to demonstrate the visual timeline feature.
 * 
 * Usage:
 * 1. Update the studentId and classId variables below
 * 2. Run with: npx ts-node -r tsconfig-paths/register src/scripts/add-sample-journey-events.ts
 */

import { PrismaClient, SystemStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

// Initialize Prisma client
const prisma = new PrismaClient();

// Configuration - Update these values
const studentId = 'STUDENT_ID_HERE'; // Replace with actual student ID
const classId = 'CLASS_ID_HERE'; // Replace with actual class ID

// Sample journey events data
const sampleEvents = [
  {
    title: 'Started Learning Journey',
    description: 'Enrolled in this class and began your learning adventure',
    date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
    type: 'enrollment',
  },
  {
    title: 'Completed First Activity',
    description: 'Finished your first learning activity in this class',
    date: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000), // 55 days ago
    type: 'activity',
  },
  {
    title: 'Earned 100 Points',
    description: 'Reached your first 100 points milestone',
    date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
    type: 'milestone',
  },
  {
    title: 'Unlocked "Fast Learner" Achievement',
    description: 'Completed 5 activities in a single day',
    date: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), // 40 days ago
    type: 'achievement',
  },
  {
    title: 'Reached Level 2',
    description: 'Advanced to level 2 by earning 250 points',
    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    type: 'level',
  },
  {
    title: 'Completed First Quiz with Perfect Score',
    description: 'Achieved 100% on your first quiz attempt',
    date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
    type: 'activity',
  },
  {
    title: 'Unlocked "Consistent Learner" Achievement',
    description: 'Completed activities on 7 consecutive days',
    date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
    type: 'achievement',
  },
  {
    title: 'Earned 500 Points',
    description: 'Reached the 500 points milestone',
    date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
    type: 'milestone',
  },
  {
    title: 'Reached Level 3',
    description: 'Advanced to level 3 by earning 750 points',
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    type: 'level',
  },
  {
    title: 'Completed 50 Activities',
    description: 'Successfully finished 50 learning activities',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    type: 'milestone',
  },
  {
    title: 'Unlocked "Knowledge Explorer" Achievement',
    description: 'Completed activities across all available topics',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    type: 'achievement',
  },
  {
    title: 'Earned First Place on Daily Leaderboard',
    description: 'Reached the top position on the class leaderboard',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    type: 'milestone',
  },
];

/**
 * Main function to add sample journey events
 */
async function addSampleJourneyEvents() {
  try {
    console.log('Starting to add sample journey events...');

    // Validate student exists
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      console.error(`Student with ID ${studentId} not found`);
      return;
    }

    // Validate class exists if classId is provided
    if (classId) {
      const classExists = await prisma.class.findUnique({
        where: { id: classId }
      });

      if (!classExists) {
        console.error(`Class with ID ${classId} not found`);
        return;
      }
    }

    // Delete existing journey events for this student and class (for testing purposes)
    await prisma.journeyEvent.deleteMany({
      where: {
        studentId,
        classId,
      }
    });

    console.log('Deleted existing journey events');

    // Add sample journey events
    for (const event of sampleEvents) {
      await prisma.journeyEvent.create({
        data: {
          id: uuidv4(),
          studentId,
          title: event.title,
          description: event.description,
          date: event.date,
          type: event.type,
          classId,
          status: SystemStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }

    console.log(`Successfully added ${sampleEvents.length} sample journey events`);
  } catch (error) {
    console.error('Error adding sample journey events:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
addSampleJourneyEvents();
