'use client';

import React, { useRef } from 'react';


import {
  ToolbarButton,
  ToolbarGroup,
  ToolbarSeparator
} from './toolbar-components';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Link,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Highlighter,
  Heading1,
  Heading2,
  Heading3,
  Quote
} from 'lucide-react';

export const BalloonToolbar = () => {
  const toolbarRef = useRef<HTMLDivElement>(null);

  // For simplicity, we'll just show the toolbar all the time in this example
  const isTextSelected = true;

  const handleToggleMark = (format: string) => {
    // This is a placeholder function
    console.log('Toggle mark:', format);
  };

  const markButtons = [
    { format: 'bold', icon: <Bold size={16} />, tooltip: 'Bold' },
    { format: 'italic', icon: <Italic size={16} />, tooltip: 'Italic' },
    { format: 'underline', icon: <Underline size={16} />, tooltip: 'Underline' },
    { format: 'strikethrough', icon: <Strikethrough size={16} />, tooltip: 'Strikethrough' },
    { format: 'code', icon: <Code size={16} />, tooltip: 'Code' },
    { format: 'highlight', icon: <Highlighter size={16} />, tooltip: 'Highlight' },
  ];

  const blockButtons = [
    { format: 'h1', icon: <Heading1 size={16} />, tooltip: 'Heading 1' },
    { format: 'h2', icon: <Heading2 size={16} />, tooltip: 'Heading 2' },
    { format: 'h3', icon: <Heading3 size={16} />, tooltip: 'Heading 3' },
    { format: 'blockquote', icon: <Quote size={16} />, tooltip: 'Quote' },
  ];

  const alignmentButtons = [
    { format: 'left', icon: <AlignLeft size={16} />, tooltip: 'Align Left' },
    { format: 'center', icon: <AlignCenter size={16} />, tooltip: 'Align Center' },
    { format: 'right', icon: <AlignRight size={16} />, tooltip: 'Align Right' },
  ];

  // Don't render if no text is selected
  if (!isTextSelected) return null;

  return (
    <div
      ref={toolbarRef}
      className="absolute z-50 top-0 left-0 transform -translate-y-full flex-wrap rounded-md border border-border bg-background shadow-md"
    >
      <div className="flex flex-wrap gap-2 p-2">
        <ToolbarGroup>
          {markButtons.map((button) => (
            <ToolbarButton
              key={button.format}
              onClick={() => handleToggleMark(button.format)}
              icon={button.icon}
              tooltip={button.tooltip}
            />
          ))}
        </ToolbarGroup>

        <ToolbarSeparator />

        <ToolbarGroup>
          {blockButtons.map((button) => (
            <ToolbarButton
              key={button.format}
              icon={button.icon}
              tooltip={button.tooltip}
            />
          ))}
        </ToolbarGroup>

        <ToolbarSeparator />

        <ToolbarGroup>
          <ToolbarButton
            icon={<Link size={16} />}
            tooltip="Link"
          />
        </ToolbarGroup>

        <ToolbarSeparator />

        <ToolbarGroup>
          {alignmentButtons.map((button) => (
            <ToolbarButton
              key={button.format}
              icon={button.icon}
              tooltip={button.tooltip}
            />
          ))}
        </ToolbarGroup>
      </div>
    </div>
  );
};
