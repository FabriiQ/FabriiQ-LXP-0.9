# UX Writing Guidelines for AI Studio

## Overview

This document provides guidelines for UX writing in the AI Studio. It establishes a consistent voice and tone, defines terminology, and provides examples of effective UX writing for various contexts.

## Voice and Tone

### Voice

The AI Studio's voice is:

- **Helpful**: We anticipate user needs and provide guidance without being intrusive.
- **Clear**: We communicate complex concepts in simple, straightforward language.
- **Professional**: We maintain educational credibility while being approachable.
- **Encouraging**: We motivate users to explore and create with confidence.

### Tone

The tone adapts to the context while maintaining our core voice:

- **In instructional content**: Supportive and clear, focusing on step-by-step guidance.
- **In error messages**: Empathetic and solution-oriented, avoiding blame.
- **In success messages**: Celebratory but not overly enthusiastic, acknowledging achievement.
- **In AI conversations**: Collaborative and thoughtful, like a helpful teaching assistant.

## Terminology

### Core Terms

| Term | Definition | Usage Example |
|------|------------|---------------|
| Activity | An interactive online learning experience | "Create a new activity for your students." |
| Assessment | An evaluation tool, typically for offline/printed use | "Generate an assessment to measure understanding." |
| Worksheet | A printable learning material | "Design a worksheet for in-class practice." |
| Lesson Plan | A structured outline of teaching activities | "Develop a lesson plan for next week." |
| AI Studio | The tool for generating educational content | "Use the AI Studio to create engaging materials." |
| Canvas | The system for complex content generation | "The Canvas provides advanced formatting options." |

### Consistent Terminology

- Use "create" (not "make" or "build") for generating new content
- Use "edit" (not "modify" or "change") for altering existing content
- Use "preview" (not "view" or "see") for examining content before saving
- Use "save" (not "store" or "keep") for preserving content
- Use "publish" (not "release" or "deploy") for making content available to students

## Writing Principles

### 1. Be Concise

- Use short, direct sentences
- Eliminate unnecessary words
- Focus on one idea per sentence
- Use bullet points for lists

**Example:**
❌ "In order to create a new activity for your students, you will need to click on the button that says 'Create Activity' which can be found at the top right corner of your screen."
✅ "Click 'Create Activity' in the top right corner."

### 2. Use Active Voice

- Make it clear who is performing the action
- Avoid passive constructions when possible
- Address the user directly with "you"

**Example:**
❌ "The activity will be saved automatically."
✅ "We'll save your activity automatically."

### 3. Be Conversational

- Write as you would speak to a colleague
- Use contractions (we'll, you're, it's)
- Avoid jargon and overly technical language
- Include occasional questions to engage users

**Example:**
❌ "Utilization of the AI generation functionality necessitates selection of parameters."
✅ "Choose how you want the AI to create your content. What type of activity works best for your students?"

### 4. Be Inclusive

- Use gender-neutral language
- Consider cultural differences
- Avoid idioms that may not translate well
- Ensure content is accessible to all users

**Example:**
❌ "The teacher can share his work with students."
✅ "Share your work with students."

## Content Types

### Button Labels

- Use verbs for action buttons (Create, Save, Delete)
- Keep labels short (1-3 words)
- Be specific about the action
- Use sentence case (First word capitalized)

**Examples:**
- "Create activity"
- "Save draft"
- "Generate content"
- "Add question"

### Form Labels and Placeholders

- Use nouns for field labels
- Be descriptive but concise
- Use sentence case
- Provide helpful placeholder text

**Examples:**
- Label: "Activity title"
- Placeholder: "Enter a descriptive title"
- Label: "Difficulty level"
- Placeholder: "Select appropriate difficulty"

### Error Messages

- Be clear about what went wrong
- Suggest a solution when possible
- Avoid technical jargon
- Use a supportive tone

**Examples:**
❌ "Error 404: Resource not found."
✅ "We couldn't find this activity. It may have been moved or deleted."

❌ "Invalid input in field 3."
✅ "Please enter a title with fewer than 100 characters."

### Success Messages

- Confirm the action that was completed
- Be positive but not overly enthusiastic
- Keep it brief
- Include next steps when appropriate

**Examples:**
❌ "Success!"
✅ "Your activity has been saved. Would you like to preview it or create another?"

❌ "Operation completed successfully."
✅ "Worksheet published. Your students can now access it."

### Empty States

- Explain what would normally appear
- Provide clear next steps
- Use a friendly, encouraging tone
- Include a call to action

**Examples:**
❌ "No activities found."
✅ "You haven't created any activities yet. Click 'Create Activity' to get started."

❌ "Empty lesson plan list."
✅ "Your lesson plans will appear here. Ready to plan your first lesson?"

### Help Text

- Provide context-sensitive guidance
- Keep it brief and scannable
- Link to more detailed help when needed
- Focus on how to accomplish tasks

**Examples:**
❌ "The activity type determines the structure and format of the activity."
✅ "Choose an activity type that matches your learning objectives. Hover over each type for examples."

❌ "Learning objectives are important for assessment."
✅ "Add learning objectives to help students understand what they'll learn. We'll suggest activities that align with these objectives."

## AI Conversation Guidelines

### Initial Prompts

- Be clear about what the AI can help with
- Provide examples of effective requests
- Set appropriate expectations
- Use a conversational, helpful tone

**Examples:**
❌ "What would you like to generate?"
✅ "I can help you create educational content. For example, try asking for 'a multiple-choice quiz about photosynthesis for 9th grade' or 'a lesson plan on fractions for 3rd grade.'"

### Follow-up Questions

- Ask specific questions to clarify needs
- Offer options when appropriate
- Keep questions focused and relevant
- Use a collaborative tone

**Examples:**
❌ "Do you want to make any changes?"
✅ "Would you like to adjust the difficulty level or add more questions to this quiz?"

### Feedback Requests

- Ask for specific feedback
- Make it easy to provide input
- Explain how feedback improves results
- Thank users for their input

**Examples:**
❌ "Was this helpful?"
✅ "How well did this activity match your teaching style? Your feedback helps me create better content for you next time."

## Micro-interaction Text

### Loading States

- Explain what's happening during loading
- Set expectations about timing
- Add personality without being distracting
- Vary messages for frequent actions

**Examples:**
❌ "Loading..."
✅ "Creating your worksheet... This usually takes about 15 seconds."

❌ "Please wait."
✅ "Generating creative questions based on your topic..."

### Page Transitions

- Use directional language that matches the transition
- Provide context about the destination
- Keep transition messages brief
- Maintain consistency in transition messaging

**Examples:**
❌ "Loading next page..."
✅ "Sliding to activity settings →"

❌ "Changing view."
✅ "← Returning to activity list"

**Transition Types:**

1. **Directional Slides**
   - Forward navigation: Slide left (→)
   - Backward navigation: Slide right (←)
   - Message: "Moving to [destination]" with directional arrow

2. **Cross-Fades**
   - Context changes within the same level
   - Message: "Switching to [new context]"
   - Use when changing between related views

3. **Depth Transitions**
   - Diving deeper: Zoom in/forward
   - Moving up: Zoom out/backward
   - Message: "Exploring [detail]" or "Back to [overview]"

### Tooltips

- Provide brief, helpful explanations
- Focus on benefits, not just features
- Keep under 80 characters when possible
- Use sentence case with proper punctuation

**Examples:**
❌ "Activity type selector."
✅ "Choose the type of activity that best suits your learning objectives."

❌ "Difficulty setting."
✅ "Adjust how challenging this activity will be for your students."

### Confirmation Dialogs

- Clearly state the action and its consequences
- Use specific button labels (not just "OK/Cancel")
- Frame questions positively
- Provide enough information to make a decision

**Examples:**
❌ "Delete? OK/Cancel"
✅ "Delete this worksheet? This cannot be undone. [Delete worksheet] [Keep worksheet]"

❌ "Confirm navigation?"
✅ "Leave without saving? Your changes will be lost. [Save and continue] [Discard changes]"

## Localization Considerations

- Use simple sentence structures that translate well
- Avoid idioms, slang, and culturally specific references
- Allow for text expansion in translations (30-50% longer)
- Use universal icons alongside text when possible
- Consider right-to-left language support in layouts

## Accessibility Guidelines

- Write descriptive alt text for images
- Create meaningful link text (not "click here")
- Use headings and structure to organize content
- Ensure error messages are announced by screen readers
- Avoid directional instructions ("click the button on the right")
- Use color alongside other indicators for state changes

## Page Transitions and Navigation

Page transitions in the AI Studio are not just visual effects—they provide meaningful context about navigation and hierarchy. Well-designed transitions help users understand where they are in the application and how different sections relate to each other.

### Transition Principles

1. **Meaningful Direction**
   - Forward progress (next steps) slides from right to left
   - Backward navigation (previous steps) slides from left to right
   - Deeper exploration zooms in or moves forward
   - Moving up in hierarchy zooms out or moves backward

2. **Consistent Motion**
   - Use the same transition patterns throughout the application
   - Match transition speed to the context (faster for frequent actions, slower for major context changes)
   - Ensure transitions are smooth and don't cause visual discomfort

3. **Contextual Cues**
   - Provide brief text cues during transitions
   - Use visual breadcrumbs to show location in navigation hierarchy
   - Maintain persistent elements across transitions for orientation

4. **Accessibility Considerations**
   - Provide options to reduce motion
   - Ensure transitions don't interfere with screen readers
   - Add appropriate ARIA attributes for navigation changes

### Transition Types and Usage

| Transition Type | When to Use | Visual Effect | Text Cue Example |
|-----------------|-------------|---------------|------------------|
| Horizontal Slide | Moving between steps in a flow | Content slides horizontally | "Step 2 of 4: Select Topics →" |
| Cross-Fade | Switching between related views | Current view fades out as new view fades in | "Switching to assessment view" |
| Zoom In/Out | Moving between hierarchy levels | Content zooms in (deeper) or out (higher level) | "Exploring topic details" |
| Elevation Change | Opening modals or overlays | Content rises above the page | "Quick settings" |
| Card Flip | Showing alternate view of same content | Content flips to reveal back side | "Viewing answer key" |

### Flow-Specific Transitions

1. **Content Type Selection Flow**
   - Initial entry: Fade in
   - Type selection: Horizontal slide right to left
   - Back to dashboard: Horizontal slide left to right

2. **Content Creation Flow**
   - Between wizard steps: Horizontal slide
   - Opening parameter details: Zoom in
   - Preview mode: Elevation change
   - Back to editor: Reverse of previous transition

3. **Content Management Flow**
   - List to detail view: Zoom in
   - Filtering/sorting: Cross-fade
   - Back to list: Zoom out

### Transition Messaging Guidelines

- Keep transition messages under 30 characters
- Include directional indicators (arrows) that match the transition direction
- Use active verbs that match the action (Moving to, Exploring, Returning to)
- For multi-step flows, include step indicators (Step 2 of 4)

### Transition Timing

- Standard transitions: 300ms
- Major context changes: 500ms
- Micro-interactions: 150-200ms
- Allow users to customize transition speed in accessibility settings

## Examples by Context

### Activity Creation Flow

1. **Initial Screen**
   - Heading: "Create a new activity"
   - Subheading: "What would you like your students to learn?"
   - Button: "Select activity type"

2. **Activity Type Selection**
   - Heading: "Choose an activity type"
   - Description: "Select the type that best matches your learning objectives."
   - Empty state: "No recent activity types. Try one of our recommended types below."

3. **Parameter Configuration**
   - Heading: "Customize your activity"
   - Field label: "Difficulty level"
   - Help text: "Choose a level appropriate for your students' current knowledge."
   - Error: "Please select at least one topic before continuing."

4. **AI Generation**
   - Loading: "Creating your activity... This usually takes about 20 seconds."
   - Success: "Your activity is ready! Review and make any needed adjustments."
   - Error: "We couldn't generate this activity. Try adjusting your parameters or try again later."

### Assessment Creation Flow

1. **Initial Screen**
   - Heading: "Create an assessment"
   - Subheading: "Design an assessment to evaluate student understanding"
   - Button: "Get started"

2. **Assessment Type Selection**
   - Heading: "What type of assessment do you need?"
   - Option label: "Quiz - Short assessment with various question types"
   - Option label: "Test - Comprehensive evaluation with multiple sections"

3. **Print Layout Preview**
   - Heading: "Preview print layout"
   - Instruction: "Adjust margins and spacing to fit your printing needs."
   - Button: "Download PDF"
   - Success: "Assessment ready for printing. Remember to check your printer settings."

## Conclusion

These UX writing guidelines ensure a consistent, helpful, and engaging experience throughout the AI Studio. By following these principles, we create an interface that not only functions well but also communicates clearly and builds trust with educators.

The guidelines should evolve based on user feedback and testing. Regular reviews of UX writing will help maintain quality and consistency as the AI Studio grows and changes.
