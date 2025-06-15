import { createDefaultEssayActivity } from './essay';
import { EssayActivity } from './essay'; // Ensure EssayActivity is exported if not already

describe('EssayActivity Model', () => {
  describe('createDefaultEssayActivity', () => {
    let defaultActivity: EssayActivity;

    beforeEach(() => {
      defaultActivity = createDefaultEssayActivity();
    });

    it('should return an object with a valid id', () => {
      expect(defaultActivity.id).toBeDefined();
      expect(typeof defaultActivity.id).toBe('string');
      // A simple check for non-empty string can also be useful
      expect(defaultActivity.id.length).toBeGreaterThan(0);
    });

    it('should set activityType to "essay"', () => {
      expect(defaultActivity.activityType).toBe('essay');
    });

    it('should have a non-empty title', () => {
      expect(defaultActivity.title).toBeDefined();
      expect(typeof defaultActivity.title).toBe('string');
      expect(defaultActivity.title.length).toBeGreaterThan(0);
    });

    it('should have a default prompt', () => {
      expect(defaultActivity.prompt).toBeDefined();
      expect(typeof defaultActivity.prompt).toBe('string');
      expect(defaultActivity.prompt.length).toBeGreaterThan(0);
    });

    it('should be gradable by default', () => {
      expect(defaultActivity.isGradable).toBe(true);
    });

    it('should have a default rubric with criteria and levels', () => {
      expect(defaultActivity.rubric).toBeDefined();
      expect(defaultActivity.rubric).not.toBeNull(); // Ensure it's not null
      // Using type assertion because we've checked it's defined
      const rubric = defaultActivity.rubric!;

      expect(rubric.criteria).toBeInstanceOf(Array);
      expect(rubric.criteria.length).toBeGreaterThan(0);

      rubric.criteria.forEach(criterion => {
        expect(criterion.id).toBeDefined();
        expect(typeof criterion.id).toBe('string');
        expect(criterion.name).toBeDefined();
        expect(typeof criterion.name).toBe('string');
        expect(criterion.description).toBeDefined();
        expect(typeof criterion.description).toBe('string');
        expect(criterion.points).toBeDefined();
        expect(typeof criterion.points).toBe('number');
        expect(criterion.points).toBeGreaterThanOrEqual(0);

        expect(criterion.levels).toBeInstanceOf(Array);
        expect(criterion.levels.length).toBeGreaterThan(0);
        criterion.levels.forEach(level => {
          expect(level.id).toBeDefined();
          expect(typeof level.id).toBe('string');
          expect(level.name).toBeDefined();
          expect(typeof level.name).toBe('string');
          expect(level.description).toBeDefined();
          expect(typeof level.description).toBe('string');
          expect(level.points).toBeDefined();
          expect(typeof level.points).toBe('number');
          // Level points should not be negative, and typically less than or equal to criterion points
          expect(level.points).toBeGreaterThanOrEqual(0);
        });
      });

      expect(rubric.totalPoints).toBeDefined();
      expect(typeof rubric.totalPoints).toBe('number');
      expect(rubric.totalPoints).toBeGreaterThanOrEqual(0);

      // Optional: check if totalPoints matches sum of criteria points (if that's the logic)
      // const sumOfCriteriaPoints = rubric.criteria.reduce((sum, crit) => sum + crit.points, 0);
      // expect(rubric.totalPoints).toBe(sumOfCriteriaPoints);
    });

    it('should have default metadata', () => {
      expect(defaultActivity.metadata).toBeDefined();
      const metadata = defaultActivity.metadata!;
      expect(metadata.difficulty).toBe('medium');
      expect(metadata.estimatedTime).toBe(60);
      expect(metadata.learningObjectives).toBeInstanceOf(Array);
      expect(metadata.aiGenerated).toBe(false);
    });

    it('should have createdAt and updatedAt dates', () => {
        expect(defaultActivity.createdAt).toBeDefined();
        expect(defaultActivity.createdAt).toBeInstanceOf(Date);
        expect(defaultActivity.updatedAt).toBeDefined();
        expect(defaultActivity.updatedAt).toBeInstanceOf(Date);
    });
  });
});
