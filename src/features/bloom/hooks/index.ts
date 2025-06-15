/**
 * Bloom's Taxonomy Hooks Index
 *
 * This file exports all hooks related to Bloom's Taxonomy integration.
 */

// Performance optimization hooks
export * from './useBloomsCache';

// Client-side hooks
export * from './useBloomsTaxonomy';
export * from './useRubric';
export * from './useTopicMastery';
export * from './useActivityTemplates';

// tRPC hooks
export * from './useTrpcBloom';
export * from './useTrpcMastery';
