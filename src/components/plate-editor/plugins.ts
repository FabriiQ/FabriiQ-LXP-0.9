'use client';

import { createPlugins } from '@udecode/plate-common';
import { createParagraphPlugin } from '@udecode/plate-paragraph';
import { createHeadingPlugin } from '@udecode/plate-heading';
import { 
  createBoldPlugin, 
  createItalicPlugin, 
  createUnderlinePlugin, 
  createStrikethroughPlugin, 
  createCodePlugin,
  createSubscriptPlugin,
  createSuperscriptPlugin
} from '@udecode/plate-basic-marks';
import { createBlockquotePlugin } from '@udecode/plate-block-quote';
import { createListPlugin } from '@udecode/plate-list';
import { createLinkPlugin } from '@udecode/plate-link';
import { createImagePlugin, createMediaPlugin, createFilePlugin, createAudioPlugin, createVideoPlugin } from '@udecode/plate-media';
import { createTablePlugin, createTableRowPlugin, createTableCellPlugin, createTableHeaderPlugin } from '@udecode/plate-table';
import { createAlignPlugin } from '@udecode/plate-alignment';
import { createHighlightPlugin } from '@udecode/plate-highlight';
import { createHorizontalRulePlugin } from '@udecode/plate-horizontal-rule';
import { createKbdPlugin } from '@udecode/plate-kbd';
import { createIndentPlugin } from '@udecode/plate-indent';
import { createFontPlugin, createFontColorPlugin, createFontBackgroundColorPlugin, createFontSizePlugin } from '@udecode/plate-font';
import { createLineHeightPlugin } from '@udecode/plate-line-height';
import { createEmojiPlugin } from '@udecode/plate-emoji';
import { createExcalidrawPlugin } from '@udecode/plate-excalidraw';
import { createMentionPlugin } from '@udecode/plate-mention';
import { createTodoListPlugin } from '@udecode/plate-list/todo-list';
import { createTrailingBlockPlugin } from '@udecode/plate-trailing-block';
import { createSoftBreakPlugin } from '@udecode/plate-break';
import { createExitBreakPlugin } from '@udecode/plate-break';
import { createNodeIdPlugin } from '@udecode/plate-node-id';
import { createResetNodePlugin } from '@udecode/plate-reset-node';
import { createSelectOnBackspacePlugin } from '@udecode/plate-select';
import { createDeletePlugin } from '@udecode/plate-select';
import { createDeserializeDocxPlugin } from '@udecode/plate-serializer-docx';
import { createDeserializeMdPlugin } from '@udecode/plate-serializer-md';
import { createDeserializeCsvPlugin } from '@udecode/plate-serializer-csv';
import { createCommentPlugin } from '@udecode/plate-comments';
import { createAutoformatPlugin } from '@udecode/plate-autoformat';
import { createBlockSelectionPlugin } from '@udecode/plate-selection';
import { createDndPlugin } from '@udecode/plate-dnd';
import { createCodeBlockPlugin } from '@udecode/plate-code-block';
import { createTogglePlugin } from '@udecode/plate-toggle';

export const createEditorPlugins = () => {
  return createPlugins([
    // Core plugins
    createParagraphPlugin(),
    createHeadingPlugin(),
    createBlockquotePlugin(),
    createCodeBlockPlugin(),
    createHorizontalRulePlugin(),
    
    // Mark plugins
    createBoldPlugin(),
    createItalicPlugin(),
    createUnderlinePlugin(),
    createStrikethroughPlugin(),
    createCodePlugin(),
    createSubscriptPlugin(),
    createSuperscriptPlugin(),
    createHighlightPlugin(),
    createKbdPlugin(),
    
    // List plugins
    createListPlugin(),
    createTodoListPlugin(),
    
    // Table plugins
    createTablePlugin(),
    createTableRowPlugin(),
    createTableCellPlugin(),
    createTableHeaderPlugin(),
    
    // Media plugins
    createImagePlugin(),
    createMediaPlugin(),
    createFilePlugin(),
    createAudioPlugin(),
    createVideoPlugin(),
    createExcalidrawPlugin(),
    
    // Link plugins
    createLinkPlugin(),
    
    // Alignment plugins
    createAlignPlugin(),
    
    // Indent plugins
    createIndentPlugin(),
    
    // Font plugins
    createFontPlugin(),
    createFontColorPlugin(),
    createFontBackgroundColorPlugin(),
    createFontSizePlugin(),
    createLineHeightPlugin(),
    
    // Emoji plugins
    createEmojiPlugin(),
    
    // Mention plugins
    createMentionPlugin(),
    
    // Toggle plugins
    createTogglePlugin(),
    
    // Comment plugins
    createCommentPlugin(),
    
    // Utility plugins
    createTrailingBlockPlugin(),
    createSoftBreakPlugin(),
    createExitBreakPlugin(),
    createNodeIdPlugin(),
    createResetNodePlugin(),
    createSelectOnBackspacePlugin(),
    createDeletePlugin(),
    
    // Serializer plugins
    createDeserializeDocxPlugin(),
    createDeserializeMdPlugin(),
    createDeserializeCsvPlugin(),
    
    // Selection plugins
    createBlockSelectionPlugin(),
    
    // Drag and drop plugins
    createDndPlugin(),
    
    // Autoformat plugins
    createAutoformatPlugin(),
  ], {
    components: {}
  });
};
