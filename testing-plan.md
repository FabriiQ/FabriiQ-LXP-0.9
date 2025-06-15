# Activities System Testing Plan

This document outlines a comprehensive testing plan for the activities system, focusing on accessibility, analytics, and performance.

## 1. Accessibility Testing

### Automated Testing

1. **Run AccessibilityTester on all activity components**:
   ```jsx
   import { AccessibilityTester } from '@/features/activities';
   
   // Test Multiple Choice Viewer
   <AccessibilityTester autoRun={true}>
     <MultipleChoiceViewer activity={sampleActivity} />
   </AccessibilityTester>
   
   // Test True/False Viewer
   <AccessibilityTester autoRun={true}>
     <TrueFalseViewer activity={sampleActivity} />
   </AccessibilityTester>
   
   // Test Multiple Response Viewer
   <AccessibilityTester autoRun={true}>
     <MultipleResponseViewer activity={sampleActivity} />
   </AccessibilityTester>
   
   // Test Fill in the Blanks Viewer
   <AccessibilityTester autoRun={true}>
     <FillInTheBlanksViewer activity={sampleActivity} />
   </AccessibilityTester>
   
   // Test Matching Viewer
   <AccessibilityTester autoRun={true}>
     <MatchingViewer activity={sampleActivity} />
   </AccessibilityTester>
   
   // Test Sequence Viewer
   <AccessibilityTester autoRun={true}>
     <SequenceViewer activity={sampleActivity} />
   </AccessibilityTester>
   ```

2. **Run individual accessibility tests**:
   ```jsx
   import {
     testImagesForAltText,
     testHeadingStructure,
     testColorContrast,
     testKeyboardAccessibility
   } from '@/features/activities';
   
   // Test images for alt text
   const altTextIssues = testImagesForAltText(document.getElementById('activity-container'));
   console.log(altTextIssues);
   
   // Test heading structure
   const headingIssues = testHeadingStructure(document.getElementById('activity-container'));
   console.log(headingIssues);
   
   // Test color contrast
   const contrastIssues = testColorContrast(document.getElementById('activity-container'));
   console.log(contrastIssues);
   
   // Test keyboard accessibility
   const keyboardIssues = testKeyboardAccessibility(document.getElementById('activity-container'));
   console.log(keyboardIssues);
   ```

### Manual Testing

1. **Screen Reader Testing**:
   - Test with NVDA on Windows
   - Test with VoiceOver on macOS
   - Test with TalkBack on Android
   - Verify that all content is properly announced
   - Verify that interactive elements are properly labeled
   - Verify that feedback is properly announced

2. **Keyboard Navigation Testing**:
   - Verify that all interactive elements can be accessed using the Tab key
   - Verify that all interactive elements can be activated using the Enter key
   - Verify that all interactive elements can be activated using the Space key
   - Verify that all interactive elements have visible focus indicators
   - Verify that keyboard shortcuts work as expected

3. **Color Blindness Testing**:
   - Test with color blindness simulators
   - Verify that all content is distinguishable without color
   - Verify that all interactive elements have sufficient contrast
   - Verify that all error states are indicated by more than just color

## 2. Analytics Testing

### Event Tracking Testing

1. **Activity Start Testing**:
   ```jsx
   import { useActivityAnalytics } from '@/features/activities';
   
   // Initialize analytics
   const analytics = useActivityAnalytics(activity.id, activity.activityType);
   
   // Track activity start
   analytics.trackEvent('activity_start', {
     activityId: activity.id,
     activityType: activity.activityType
   });
   
   // Verify that the event was tracked
   console.log(analyticsManager.getEvents());
   ```

2. **Activity Submission Testing**:
   ```jsx
   // Track activity submission
   analytics.trackEvent('activity_submit', {
     activityId: activity.id,
     activityType: activity.activityType,
     score: result.percentage,
     passed: result.passed,
     timeSpent: timeSpent
   });
   
   // Verify that the event was tracked
   console.log(analyticsManager.getEvents());
   ```

3. **Activity Reset Testing**:
   ```jsx
   // Track activity reset
   analytics.trackEvent('activity_reset', {
     activityId: activity.id,
     activityType: activity.activityType
   });
   
   // Verify that the event was tracked
   console.log(analyticsManager.getEvents());
   ```

4. **Activity Interaction Testing**:
   ```jsx
   // Track option selection
   analytics.trackEvent('option_select', {
     activityId: activity.id,
     questionId: questionId,
     optionId: optionId,
     isCorrect: isCorrect
   });
   
   // Verify that the event was tracked
   console.log(analyticsManager.getEvents());
   ```

### Integration Testing

1. **Analytics Provider Integration**:
   ```jsx
   import { analyticsManager } from '@/features/activities';
   
   // Create a custom analytics provider
   const customProvider = {
     trackEvent: (eventType, eventData) => {
       console.log(`Custom provider tracked: ${eventType}`, eventData);
     }
   };
   
   // Add the provider to the analytics manager
   analyticsManager.addProvider(customProvider);
   
   // Verify that events are tracked by the custom provider
   analyticsManager.trackEvent('test_event', { test: true });
   ```

## 3. Performance Testing

### Component Rendering Performance

1. **Measure Initial Render Time**:
   ```jsx
   // Measure time to render a component
   const startTime = performance.now();
   ReactDOM.render(<MultipleChoiceViewer activity={sampleActivity} />, container);
   const endTime = performance.now();
   console.log(`Render time: ${endTime - startTime}ms`);
   ```

2. **Measure Re-render Time**:
   ```jsx
   // Measure time to re-render a component
   const startTime = performance.now();
   setActivity({ ...activity, title: 'New Title' });
   const endTime = performance.now();
   console.log(`Re-render time: ${endTime - startTime}ms`);
   ```

### Memory Usage Testing

1. **Measure Memory Usage**:
   ```jsx
   // Measure memory usage before rendering
   const memoryBefore = performance.memory.usedJSHeapSize;
   
   // Render the component
   ReactDOM.render(<MultipleChoiceViewer activity={sampleActivity} />, container);
   
   // Measure memory usage after rendering
   const memoryAfter = performance.memory.usedJSHeapSize;
   console.log(`Memory usage: ${memoryAfter - memoryBefore} bytes`);
   ```

2. **Check for Memory Leaks**:
   ```jsx
   // Render and unmount the component multiple times
   for (let i = 0; i < 100; i++) {
     ReactDOM.render(<MultipleChoiceViewer activity={sampleActivity} />, container);
     ReactDOM.unmountComponentAtNode(container);
   }
   
   // Measure memory usage
   console.log(`Memory usage: ${performance.memory.usedJSHeapSize} bytes`);
   ```

### Network Performance Testing

1. **Measure Network Requests**:
   ```jsx
   // Measure network requests
   const requests = performance.getEntriesByType('resource');
   console.log(`Number of requests: ${requests.length}`);
   console.log(`Total size: ${requests.reduce((total, req) => total + req.transferSize, 0)} bytes`);
   ```

2. **Measure Image Loading Time**:
   ```jsx
   // Measure image loading time
   const imageLoadTime = performance.getEntriesByType('resource')
     .filter(req => req.initiatorType === 'img')
     .reduce((total, req) => total + req.duration, 0);
   console.log(`Image load time: ${imageLoadTime}ms`);
   ```

## 4. Device Testing

### Desktop Testing

1. **Windows Testing**:
   - Test on Chrome, Firefox, Edge, and Safari
   - Test with different screen sizes
   - Test with different DPI settings
   - Test with different color schemes (light/dark mode)

2. **macOS Testing**:
   - Test on Chrome, Firefox, and Safari
   - Test with different screen sizes
   - Test with different DPI settings
   - Test with different color schemes (light/dark mode)

### Mobile Testing

1. **iOS Testing**:
   - Test on Safari and Chrome
   - Test on different device sizes (iPhone SE, iPhone 12, iPhone 12 Pro Max)
   - Test with different orientations (portrait/landscape)
   - Test with different color schemes (light/dark mode)

2. **Android Testing**:
   - Test on Chrome and Firefox
   - Test on different device sizes (small, medium, large)
   - Test with different orientations (portrait/landscape)
   - Test with different color schemes (light/dark mode)

## 5. Integration Testing

### AI Studio Integration Testing

1. **Test AI Content Conversion**:
   ```jsx
   import {
     convertAIContentToActivity,
     convertAIContentToTrueFalse,
     convertAIContentToMultipleResponse,
     convertAIContentToFillInTheBlanks,
     convertAIContentToMatching,
     convertAIContentToSequence
   } from '@/features/activities';
   
   // Test multiple choice conversion
   const multipleChoiceActivity = convertAIContentToActivity(aiContent);
   console.log(multipleChoiceActivity);
   
   // Test true/false conversion
   const trueFalseActivity = convertAIContentToTrueFalse(aiContent);
   console.log(trueFalseActivity);
   
   // Test multiple response conversion
   const multipleResponseActivity = convertAIContentToMultipleResponse(aiContent);
   console.log(multipleResponseActivity);
   
   // Test fill in the blanks conversion
   const fillInTheBlanksActivity = convertAIContentToFillInTheBlanks(aiContent);
   console.log(fillInTheBlanksActivity);
   
   // Test matching conversion
   const matchingActivity = convertAIContentToMatching(aiContent);
   console.log(matchingActivity);
   
   // Test sequence conversion
   const sequenceActivity = convertAIContentToSequence(aiContent);
   console.log(sequenceActivity);
   ```

2. **Test SimpleActivityPreview**:
   ```jsx
   import { SimpleActivityPreview } from '@/features/activities';
   
   // Test SimpleActivityPreview
   <SimpleActivityPreview
     activityData={aiContent}
     activityType="multiple-choice"
     onSave={handleSave}
     showAccessibilityTester={true}
     enableAnalytics={true}
   />
   ```

### Gradebook Integration Testing

1. **Test Activity Grading**:
   ```jsx
   import {
     gradeMultipleChoiceActivity,
     gradeTrueFalseActivity,
     gradeMultipleResponseActivity,
     gradeFillInTheBlanksActivity,
     gradeMatchingActivity,
     gradeSequenceActivity
   } from '@/features/activities';
   
   // Test multiple choice grading
   const multipleChoiceResult = gradeMultipleChoiceActivity(activity, answers);
   console.log(multipleChoiceResult);
   
   // Test true/false grading
   const trueFalseResult = gradeTrueFalseActivity(activity, answers);
   console.log(trueFalseResult);
   
   // Test multiple response grading
   const multipleResponseResult = gradeMultipleResponseActivity(activity, answers);
   console.log(multipleResponseResult);
   
   // Test fill in the blanks grading
   const fillInTheBlanksResult = gradeFillInTheBlanksActivity(activity, answers);
   console.log(fillInTheBlanksResult);
   
   // Test matching grading
   const matchingResult = gradeMatchingActivity(activity, answers);
   console.log(matchingResult);
   
   // Test sequence grading
   const sequenceResult = gradeSequenceActivity(activity, answers);
   console.log(sequenceResult);
   ```

## 6. Regression Testing

### Functionality Testing

1. **Test All Activity Types**:
   - Test Multiple Choice activities
   - Test True/False activities
   - Test Multiple Response activities
   - Test Fill in the Blanks activities
   - Test Matching activities
   - Test Sequence activities

2. **Test All Activity Features**:
   - Test question shuffling
   - Test option shuffling
   - Test multiple attempts
   - Test feedback display
   - Test explanation display
   - Test hint display
   - Test media display
   - Test rich text display

### UI Testing

1. **Test All UI Components**:
   - Test ActivityButton
   - Test SelectableOption
   - Test ProgressIndicator
   - Test QuestionHint
   - Test RichTextEditor
   - Test RichTextDisplay
   - Test MediaUploader
   - Test MediaDisplay
   - Test JinaImageSearch
   - Test MediaSelector
   - Test AccessibilityTester

2. **Test All UI States**:
   - Test loading state
   - Test error state
   - Test empty state
   - Test submitted state
   - Test passed state
   - Test failed state

## 7. Documentation Testing

1. **Test README.md**:
   - Verify that all instructions are clear and accurate
   - Verify that all examples work as expected
   - Verify that all links work as expected

2. **Test ARCHITECTURE.md**:
   - Verify that the architecture diagram is accurate
   - Verify that all component descriptions are accurate
   - Verify that all data flow descriptions are accurate

3. **Test ACCESSIBILITY.md**:
   - Verify that all accessibility features are accurately described
   - Verify that all accessibility testing procedures are accurate
   - Verify that all accessibility issues are properly documented

4. **Test VISUAL_ACCESSIBILITY_GUIDE.md**:
   - Verify that all visual accessibility guidelines are accurate
   - Verify that all visual accessibility examples work as expected
   - Verify that all visual accessibility testing procedures are accurate

## 8. Cleanup Testing

1. **Test After File Removal**:
   - Verify that the application still works after removing old files
   - Verify that there are no console errors
   - Verify that all features still work as expected
   - Verify that all tests still pass

2. **Test After Core Structure Update**:
   - Verify that all exports work as expected
   - Verify that all imports work as expected
   - Verify that there are no console errors
   - Verify that all features still work as expected
   - Verify that all tests still pass

## Test Execution Plan

1. **Phase 1: Automated Testing**
   - Run all automated accessibility tests
   - Run all automated analytics tests
   - Run all automated performance tests

2. **Phase 2: Manual Testing**
   - Perform all manual accessibility tests
   - Perform all manual device tests
   - Perform all manual integration tests

3. **Phase 3: Regression Testing**
   - Perform all functionality tests
   - Perform all UI tests
   - Perform all documentation tests

4. **Phase 4: Cleanup Testing**
   - Perform all tests after file removal
   - Perform all tests after core structure update

## Test Reporting

1. **Create Test Reports**:
   - Document all test results
   - Document all issues found
   - Document all fixes applied

2. **Create Test Summary**:
   - Summarize all test results
   - Summarize all issues found
   - Summarize all fixes applied

3. **Create Test Recommendations**:
   - Recommend improvements based on test results
   - Recommend fixes for any remaining issues
   - Recommend future testing procedures
