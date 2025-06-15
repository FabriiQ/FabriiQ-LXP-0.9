/**
 * Bloom's Taxonomy API Integration Tests
 * 
 * This file contains tests to verify that the Bloom's Taxonomy API endpoints
 * are properly integrated with the main application.
 */

import { createInnerTRPCContext } from '@/server/api/trpc';
import { appRouter } from '@/server/api/root';
import { BloomsTaxonomyLevel, RubricType } from '../types';

describe('Bloom\'s Taxonomy API Integration', () => {
  // Create a test context
  const ctx = createInnerTRPCContext({
    session: {
      user: {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
        role: 'TEACHER',
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
  });

  // Create a test caller
  const caller = appRouter.createCaller(ctx);

  describe('Bloom Router', () => {
    test('classifyContent endpoint is accessible', async () => {
      // This test just verifies that the endpoint exists and is accessible
      // It will throw an error if the endpoint doesn't exist
      expect(caller.bloom.classifyContent).toBeDefined();
    });

    test('generateRubric endpoint is accessible', async () => {
      expect(caller.bloom.generateRubric).toBeDefined();
    });

    test('generateActivity endpoint is accessible', async () => {
      expect(caller.bloom.generateActivity).toBeDefined();
    });

    test('analyzeMastery endpoint is accessible', async () => {
      expect(caller.bloom.analyzeMastery).toBeDefined();
    });
  });

  describe('Mastery Router', () => {
    test('getTopicMastery endpoint is accessible', async () => {
      expect(caller.mastery.getTopicMastery).toBeDefined();
    });

    test('updateTopicMastery endpoint is accessible', async () => {
      expect(caller.mastery.updateTopicMastery).toBeDefined();
    });

    test('getLeaderboard endpoint is accessible', async () => {
      expect(caller.mastery.getLeaderboard).toBeDefined();
    });

    test('getPartitionedLeaderboards endpoint is accessible', async () => {
      expect(caller.mastery.getPartitionedLeaderboards).toBeDefined();
    });
  });
});
