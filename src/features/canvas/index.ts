// State exports
export * from './state/CanvasStateProvider';

// Component exports
export * from './composers/ContentComposer';
export * from './artifacts/ArtifactRenderer';

// Renderer exports
export * from './artifacts/renderers/MarkdownRenderer';
export * from './artifacts/renderers/CodeRenderer';
export * from './artifacts/renderers/TableRenderer';
export * from './artifacts/renderers/QuestionRenderer';
export * from './artifacts/renderers/ImageRenderer';
export * from './artifacts/renderers/VideoRenderer';
export * from './artifacts/renderers/MathRenderer';
export * from './artifacts/renderers/WorksheetRenderer';
export * from './artifacts/renderers/AssessmentRenderer';

// Adapter exports
export * from './adapters';

// Documentation exports
// Note: Documentation files are not directly exported as they are markdown files
// They can be accessed at:
// - src/features/canvas/docs/integration-guide.md
