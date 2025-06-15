# Activity Type Bridge System - Testing Framework

## Overview

This document outlines the testing framework for the Activity Type Bridge System, which ensures that AI-generated content correctly maps to specific activity type editors and previews. The framework includes unit tests, integration tests, and end-to-end tests, as well as test cases for all supported activity types.

## Testing Approach

### 1. Unit Testing

Unit tests will focus on testing individual components of the Activity Type Bridge System in isolation.

#### TypeMapper Tests

```typescript
describe('TypeMapper', () => {
  describe('mapActivityTypeToId', () => {
    it('should map SELF_STUDY to multiple-choice for LEARNING purpose', () => {
      const result = mapActivityTypeToId('SELF_STUDY', ActivityPurpose.LEARNING);
      expect(result).toBe('multiple-choice');
    });

    it('should map QUIZ to quiz for LEARNING purpose', () => {
      const result = mapActivityTypeToId('QUIZ', ActivityPurpose.LEARNING);
      expect(result).toBe('quiz');
    });

    it('should map QUIZ to multiple-choice for ASSESSMENT purpose', () => {
      const result = mapActivityTypeToId('QUIZ', ActivityPurpose.ASSESSMENT);
      expect(result).toBe('multiple-choice');
    });

    it('should return the original type if no mapping exists', () => {
      const result = mapActivityTypeToId('custom-type', ActivityPurpose.LEARNING);
      expect(result).toBe('custom-type');
    });
  });

  describe('getActivityTypeDisplayName', () => {
    it('should return the display name for a known activity type', () => {
      const result = getActivityTypeDisplayName('multiple-choice');
      expect(result).toBe('Multiple Choice');
    });

    it('should return the original type if no display name exists', () => {
      const result = getActivityTypeDisplayName('custom-type');
      expect(result).toBe('custom-type');
    });
  });
});
```

#### ComponentLoader Tests

```typescript
describe('ComponentLoader', () => {
  describe('preloadActivityTypeComponents', () => {
    it('should call prefetchActivityType with the correct activity type ID', () => {
      const spy = jest.spyOn(activityRegistry, 'prefetchActivityType');
      preloadActivityTypeComponents('SELF_STUDY', ActivityPurpose.LEARNING);
      expect(spy).toHaveBeenCalledWith('multiple-choice');
    });

    it('should not call prefetchActivityType in a server environment', () => {
      const spy = jest.spyOn(activityRegistry, 'prefetchActivityType');
      // Mock window as undefined to simulate server environment
      const originalWindow = global.window;
      global.window = undefined as any;
      preloadActivityTypeComponents('SELF_STUDY', ActivityPurpose.LEARNING);
      expect(spy).not.toHaveBeenCalled();
      global.window = originalWindow;
    });
  });

  describe('getActivityEditor', () => {
    it('should return the editor component for a known activity type', () => {
      const mockEditor = () => null;
      jest.spyOn(activityRegistry, 'getEditor').mockReturnValue(mockEditor);
      const result = getActivityEditor('multiple-choice');
      expect(result).toBe(mockEditor);
    });

    it('should return null for an unknown activity type', () => {
      jest.spyOn(activityRegistry, 'getEditor').mockReturnValue(null);
      const result = getActivityEditor('unknown-type');
      expect(result).toBe(null);
    });
  });
});
```

#### ContentTransformer Tests

```typescript
describe('ContentTransformer', () => {
  describe('transformContent', () => {
    it('should transform content to match the expected structure', () => {
      const content = { title: 'Test Activity', questions: [] };
      const result = transformContent(content, 'SELF_STUDY', ActivityPurpose.LEARNING);
      expect(result).toEqual({
        ...content,
        activityType: 'multiple-choice',
        purpose: ActivityPurpose.LEARNING,
        config: content,
      });
    });

    it('should use the content as config if no config property exists', () => {
      const content = { title: 'Test Activity', questions: [] };
      const result = transformContent(content, 'SELF_STUDY', ActivityPurpose.LEARNING);
      expect(result.config).toBe(content);
    });

    it('should use existing config if it exists', () => {
      const config = { questions: [] };
      const content = { title: 'Test Activity', config };
      const result = transformContent(content, 'SELF_STUDY', ActivityPurpose.LEARNING);
      expect(result.config).toBe(config);
    });
  });

  describe('validateContent', () => {
    it('should return true for valid content', () => {
      const content = {
        title: 'Test Activity',
        activityType: 'multiple-choice',
        purpose: ActivityPurpose.LEARNING,
        config: { questions: [] },
      };
      const result = validateContent(content, 'multiple-choice');
      expect(result).toBe(true);
    });

    it('should return false for invalid content', () => {
      const content = { title: 'Test Activity' };
      const result = validateContent(content, 'multiple-choice');
      expect(result).toBe(false);
    });
  });
});
```

#### FallbackProvider Tests

```typescript
describe('FallbackProvider', () => {
  describe('getFallbackComponent', () => {
    it('should return the fallback component for a known activity type', () => {
      const mockComponent = () => null;
      jest.spyOn(fallbackRegistry, 'get').mockReturnValue(mockComponent);
      const result = getFallbackComponent('multiple-choice', 'editor');
      expect(result).toBe(mockComponent);
    });

    it('should return the default fallback component for an unknown activity type', () => {
      const mockComponent = () => null;
      jest.spyOn(fallbackRegistry, 'getDefault').mockReturnValue(mockComponent);
      const result = getFallbackComponent('unknown-type', 'editor');
      expect(result).toBe(mockComponent);
    });
  });

  describe('registerFallbackComponent', () => {
    it('should register a fallback component', () => {
      const mockComponent = () => null;
      const spy = jest.spyOn(fallbackRegistry, 'register');
      registerFallbackComponent('multiple-choice', 'editor', mockComponent);
      expect(spy).toHaveBeenCalledWith('multiple-choice', 'editor', mockComponent);
    });
  });
});
```

### 2. Integration Testing

Integration tests will focus on testing the interaction between components of the Activity Type Bridge System.

#### AIStudioDialog Integration Tests

```typescript
describe('AIStudioDialog with Activity Type Bridge', () => {
  it('should preload components when activity type is selected', () => {
    const spy = jest.spyOn(activityTypeBridge, 'preloadActivityTypeComponents');
    render(<AIStudioDialog />);
    fireEvent.click(screen.getByText('Activity Type'));
    fireEvent.click(screen.getByText('Multiple Choice'));
    expect(spy).toHaveBeenCalledWith('SELF_STUDY', ActivityPurpose.LEARNING);
  });

  it('should transform content when generating content', async () => {
    const spy = jest.spyOn(activityTypeBridge, 'transformContent');
    render(<AIStudioDialog />);
    fireEvent.click(screen.getByText('Generate'));
    await waitFor(() => {
      expect(spy).toHaveBeenCalled();
    });
  });
});
```

#### ActivityPreview Integration Tests

```typescript
describe('ActivityPreview with Activity Type Bridge', () => {
  it('should use the correct viewer component for the activity type', () => {
    const mockViewer = jest.fn(() => null);
    jest.spyOn(activityTypeBridge, 'getActivityViewer').mockReturnValue(mockViewer);
    render(<ActivityPreview content={{ activityType: 'multiple-choice' }} />);
    expect(mockViewer).toHaveBeenCalled();
  });

  it('should use a fallback component when the viewer is not available', () => {
    const mockFallback = jest.fn(() => null);
    jest.spyOn(activityTypeBridge, 'getActivityViewer').mockReturnValue(null);
    jest.spyOn(activityTypeBridge, 'getFallbackComponent').mockReturnValue(mockFallback);
    render(<ActivityPreview content={{ activityType: 'unknown-type' }} />);
    expect(mockFallback).toHaveBeenCalled();
  });
});
```

### 3. End-to-End Testing

End-to-end tests will focus on testing the complete flow from activity type selection to content generation and preview.

```typescript
describe('Activity Type Bridge E2E', () => {
  it('should generate and preview content for multiple-choice activity', async () => {
    // Navigate to AI Studio
    cy.visit('/ai-studio');

    // Select activity type
    cy.get('[data-testid="activity-type-selector"]').click();
    cy.get('[data-testid="activity-type-multiple-choice"]').click();

    // Generate content
    cy.get('[data-testid="generate-button"]').click();

    // Wait for content generation
    cy.get('[data-testid="generating-indicator"]').should('be.visible');
    cy.get('[data-testid="generating-indicator"]', { timeout: 10000 }).should('not.exist');

    // Verify preview
    cy.get('[data-testid="activity-preview"]').should('be.visible');
    cy.get('[data-testid="multiple-choice-viewer"]').should('be.visible');
  });

  it('should generate and preview content for reading activity', async () => {
    // Navigate to AI Studio
    cy.visit('/ai-studio');

    // Select activity type
    cy.get('[data-testid="activity-type-selector"]').click();
    cy.get('[data-testid="activity-type-reading"]').click();

    // Generate content
    cy.get('[data-testid="generate-button"]').click();

    // Wait for content generation
    cy.get('[data-testid="generating-indicator"]').should('be.visible');
    cy.get('[data-testid="generating-indicator"]', { timeout: 10000 }).should('not.exist');

    // Verify preview
    cy.get('[data-testid="activity-preview"]').should('be.visible');
    cy.get('[data-testid="reading-viewer"]').should('be.visible');
  });
});
```

## Test Cases for Supported Activity Types

### Learning Activities

| Activity Type | Test Case | Expected Result |
|---------------|-----------|-----------------|
| Multiple Choice | Map SELF_STUDY to multiple-choice | Correct mapping |
| Multiple Choice | Generate and preview multiple-choice activity | Correct preview |
| Multiple Choice | Edit multiple-choice activity | Correct editor |
| Fill in the Blanks | Map INTERACTIVE to fill-in-the-blanks | Correct mapping |
| Fill in the Blanks | Generate and preview fill-in-the-blanks activity | Correct preview |
| Fill in the Blanks | Edit fill-in-the-blanks activity | Correct editor |
| Reading | Map READING to reading | Correct mapping |
| Reading | Generate and preview reading activity | Correct preview |
| Reading | Edit reading activity | Correct editor |
| Video | Map VIDEO to video | Correct mapping |
| Video | Generate and preview video activity | Correct preview |
| Video | Edit video activity | Correct editor |
| Discussion | Map DISCUSSION to discussion | Correct mapping |
| Discussion | Generate and preview discussion activity | Correct preview |
| Discussion | Edit discussion activity | Correct editor |

### Assessment Activities

| Activity Type | Test Case | Expected Result |
|---------------|-----------|-----------------|
| Quiz | Map QUIZ to multiple-choice for ASSESSMENT | Correct mapping |
| Quiz | Generate and preview quiz activity | Correct preview |
| Quiz | Edit quiz activity | Correct editor |
| Test | Map TEST to multiple-choice for ASSESSMENT | Correct mapping |
| Test | Generate and preview test activity | Correct preview |
| Test | Edit test activity | Correct editor |
| Exam | Map EXAM to multiple-choice for ASSESSMENT | Correct mapping |
| Exam | Generate and preview exam activity | Correct preview |
| Exam | Edit exam activity | Correct editor |

## Edge Cases and Error Scenarios

| Scenario | Test Case | Expected Result |
|----------|-----------|-----------------|
| Unknown Activity Type | Map unknown type | Return original type |
| Unknown Activity Type | Generate and preview unknown type | Use fallback component |
| Server-Side Rendering | Preload components in SSR | No error, no preloading |
| Missing Activity Type | Preview content without activity type | Extract type or use fallback |
| Invalid Content | Validate invalid content | Return false |
| Component Loading Error | Handle component loading error | Use fallback component |
| Multiple Mappings | Map type that exists in both learning and assessment | Use correct mapping based on purpose |

## Test Environment

The testing framework will use the following tools and libraries:

- **Unit Testing**: Jest with React Testing Library
- **Integration Testing**: Jest with React Testing Library
- **End-to-End Testing**: Cypress
- **Mocking**: Jest mocks and spies
- **Test Data**: Mock data for all supported activity types

## Test Execution

Tests will be executed in the following environments:

- **Local Development**: Developers run tests locally before committing code
- **Continuous Integration**: Tests run automatically on pull requests
- **Staging Environment**: End-to-end tests run in staging environment before deployment
- **Production Verification**: Smoke tests run in production after deployment

## Test Reporting

Test results will be reported in the following formats:

- **Console Output**: For local development
- **HTML Reports**: For CI/CD pipelines
- **Dashboard**: For monitoring test coverage and results
- **Alerts**: For test failures in CI/CD pipelines

## Conclusion

This testing framework provides a comprehensive approach to testing the Activity Type Bridge System. By implementing this framework, we can ensure that the system correctly maps AI-generated content to specific activity type editors and previews, and that it handles edge cases and error scenarios gracefully.
