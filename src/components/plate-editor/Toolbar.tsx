'use client';

import React from 'react';
import { useEditorRef } from '@udecode/plate/react';

import {
  ToolbarButton,
  ToolbarGroup,
  ToolbarSeparator
} from './toolbar-components';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Image,
  Italic,
  Link,
  List,
  ListOrdered,
  Quote,
  Redo,
  Strikethrough,
  Table,
  Underline,
  Undo
} from 'lucide-react';

export const Toolbar = () => {
  const editor = useEditorRef();

  const handleToggleMark = (format: string) => {
    // This is a placeholder function
    console.log('Toggle mark:', format);
  };

  const markButtons = [
    { format: 'bold', icon: <Bold size={18} />, tooltip: 'Bold' },
    { format: 'italic', icon: <Italic size={18} />, tooltip: 'Italic' },
    { format: 'underline', icon: <Underline size={18} />, tooltip: 'Underline' },
    { format: 'strikethrough', icon: <Strikethrough size={18} />, tooltip: 'Strikethrough' },
    { format: 'code', icon: <Code size={18} />, tooltip: 'Code' },
  ];

  const blockButtons = [
    { format: 'h1', icon: <Heading1 size={18} />, tooltip: 'Heading 1' },
    { format: 'h2', icon: <Heading2 size={18} />, tooltip: 'Heading 2' },
    { format: 'h3', icon: <Heading3 size={18} />, tooltip: 'Heading 3' },
    { format: 'blockquote', icon: <Quote size={18} />, tooltip: 'Quote' },
    { format: 'ul', icon: <List size={18} />, tooltip: 'Bullet List' },
    { format: 'ol', icon: <ListOrdered size={18} />, tooltip: 'Numbered List' },
  ];

  return (
    <div className="border-b p-2 bg-gray-50 flex flex-wrap gap-2">
      <ToolbarGroup>
        <ToolbarButton
          onClick={() => editor?.undo()}
          icon={<Undo size={18} />}
          tooltip="Undo"
        />
        <ToolbarButton
          onClick={() => editor?.redo()}
          icon={<Redo size={18} />}
          tooltip="Redo"
        />
      </ToolbarGroup>

      <ToolbarSeparator />

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
          icon={<Link size={18} />}
          tooltip="Link"
        />
        <ToolbarButton
          icon={<Image size={18} />}
          tooltip="Image"
        />
        <ToolbarButton
          icon={<Table size={18} />}
          tooltip="Table"
        />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <ToolbarButton
          icon={<AlignLeft size={18} />}
          tooltip="Align Left"
        />
        <ToolbarButton
          icon={<AlignCenter size={18} />}
          tooltip="Align Center"
        />
        <ToolbarButton
          icon={<AlignRight size={18} />}
          tooltip="Align Right"
        />
      </ToolbarGroup>
    </div>
  );
};
