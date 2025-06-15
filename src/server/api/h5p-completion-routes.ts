import express from 'express';
import { prisma } from '../db/client';

const router = express.Router();

// Endpoint to track H5P content completion
router.post('/completion', async (req, res) => {
  try {
    const { userId, contentId, score, maxScore, completed, progress } = req.body;
    
    const completion = await prisma.h5PContentCompletion.upsert({
      where: {
        userId_contentId: {
          userId,
          contentId
        }
      },
      update: {
        score,
        maxScore,
        completed,
        progress,
        updatedAt: new Date()
      },
      create: {
        userId,
        contentId,
        score,
        maxScore,
        completed,
        progress
      }
    });
    
    res.json(completion);
  } catch (error) {
    console.error('Error tracking H5P completion:', error);
    res.status(500).json({ error: 'Error tracking H5P completion' });
  }
});

// Endpoint to get H5P content completion for a user
router.get('/completion/:userId/:contentId', async (req, res) => {
  try {
    const { userId, contentId } = req.params;
    
    const completion = await prisma.h5PContentCompletion.findUnique({
      where: {
        userId_contentId: {
          userId,
          contentId
        }
      }
    });
    
    res.json(completion || { completed: false, progress: 0 });
  } catch (error) {
    console.error('Error getting H5P completion:', error);
    res.status(500).json({ error: 'Error getting H5P completion' });
  }
});

export default router;
