'use client';

import React from 'react';
import { useEditorRef } from '@udecode/plate/react';
import { toggleMark } from '@udecode/plate-common';

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
  Undo,
  Highlighter,
  Subscript,
  Superscript,
  CheckSquare,
  Minus,
  WandSparkles,
  Palette,
  Type,
  AlignJustify,
  Smile,
  FileText,
  Video,
  Music,
  File,
  Indent,
  Outdent,
  MoreHorizontal
} from 'lucide-react';

export const Toolbar = () => {
  const editor = useEditorRef();

  const handleToggleMark = (format: string) => {
    if (editor) {
      toggleMark(editor, { key: format });
    }
  };

  const markButtons = [
    { format: 'bold', icon: <Bold size={18} />, tooltip: 'Bold (⌘+B)' },
    { format: 'italic', icon: <Italic size={18} />, tooltip: 'Italic (⌘+I)' },
    { format: 'underline', icon: <Underline size={18} />, tooltip: 'Underline (⌘+U)' },
    { format: 'strikethrough', icon: <Strikethrough size={18} />, tooltip: 'Strikethrough (⌘+⇧+M)' },
    { format: 'code', icon: <Code size={18} />, tooltip: 'Code (⌘+E)' },
    { format: 'subscript', icon: <Subscript size={18} />, tooltip: 'Subscript' },
    { format: 'superscript', icon: <Superscript size={18} />, tooltip: 'Superscript' },
    { format: 'highlight', icon: <Highlighter size={18} />, tooltip: 'Highlight' },
  ];

  const blockButtons = [
    { format: 'h1', icon: <Heading1 size={18} />, tooltip: 'Heading 1' },
    { format: 'h2', icon: <Heading2 size={18} />, tooltip: 'Heading 2' },
    { format: 'h3', icon: <Heading3 size={18} />, tooltip: 'Heading 3' },
    { format: 'blockquote', icon: <Quote size={18} />, tooltip: 'Quote' },
    { format: 'ul', icon: <List size={18} />, tooltip: 'Bullet List' },
    { format: 'ol', icon: <ListOrdered size={18} />, tooltip: 'Numbered List' },
    { format: 'todo_li', icon: <CheckSquare size={18} />, tooltip: 'Todo List' },
    { format: 'hr', icon: <Minus size={18} />, tooltip: 'Horizontal Rule' },
  ];

  const insertButtons = [
    { format: 'link', icon: <Link size={18} />, tooltip: 'Link' },
    { format: 'image', icon: <Image size={18} />, tooltip: 'Image' },
    { format: 'table', icon: <Table size={18} />, tooltip: 'Table' },
    { format: 'code_block', icon: <Code size={18} />, tooltip: 'Code Block' },
  ];

  const mediaButtons = [
    { format: 'image', icon: <Image size={18} />, tooltip: 'Image' },
    { format: 'video', icon: <Video size={18} />, tooltip: 'Video' },
    { format: 'audio', icon: <Music size={18} />, tooltip: 'Audio' },
    { format: 'file', icon: <File size={18} />, tooltip: 'File' },
  ];

  const alignmentButtons = [
    { format: 'left', icon: <AlignLeft size={18} />, tooltip: 'Align Left' },
    { format: 'center', icon: <AlignCenter size={18} />, tooltip: 'Align Center' },
    { format: 'right', icon: <AlignRight size={18} />, tooltip: 'Align Right' },
    { format: 'justify', icon: <AlignJustify size={18} />, tooltip: 'Align Justify' },
  ];

  return (
    <div className="border-b p-2 bg-gray-50 flex flex-wrap gap-2">
      <ToolbarGroup>
        <ToolbarButton
          onClick={() => editor?.undo()}
          icon={<Undo size={18} />}
          tooltip="Undo (⌘+Z)"
        />
        <ToolbarButton
          onClick={() => editor?.redo()}
          icon={<Redo size={18} />}
          tooltip="Redo (⌘+⇧+Z)"
        />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <ToolbarButton
          icon={<WandSparkles size={18} />}
          tooltip="AI Commands"
        />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <ToolbarButton
          icon={<Type size={18} />}
          tooltip="Text Style"
        />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        {markButtons.slice(0, 5).map((button) => (
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
        <ToolbarButton
          icon={<Palette size={18} />}
          tooltip="Text Color"
        />
        <ToolbarButton
          icon={<Palette size={18} />}
          tooltip="Background Color"
        />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        {blockButtons.slice(0, 3).map((button) => (
          <ToolbarButton
            key={button.format}
            format={button.format}
            icon={button.icon}
            tooltip={button.tooltip}
          />
        ))}
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        {alignmentButtons.map((button) => (
          <ToolbarButton
            key={button.format}
            format={button.format}
            icon={button.icon}
            tooltip={button.tooltip}
          />
        ))}
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        {blockButtons.slice(3, 7).map((button) => (
          <ToolbarButton
            key={button.format}
            format={button.format}
            icon={button.icon}
            tooltip={button.tooltip}
          />
        ))}
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        {insertButtons.map((button) => (
          <ToolbarButton
            key={button.format}
            format={button.format}
            icon={button.icon}
            tooltip={button.tooltip}
          />
        ))}
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <ToolbarButton
          icon={<Smile size={18} />}
          tooltip="Emoji"
        />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <ToolbarButton
          icon={<Indent size={18} />}
          tooltip="Indent"
        />
        <ToolbarButton
          icon={<Outdent size={18} />}
          tooltip="Outdent"
        />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <ToolbarButton
          icon={<MoreHorizontal size={18} />}
          tooltip="More Options"
        />
      </ToolbarGroup>
    </div>
  );
};
