'use client';

import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Import core components
import { Plate, PlateContent, usePlateEditor } from '@udecode/plate/react';
import { withProps } from '@udecode/cn';
import { PlateElement, PlateLeaf } from '@udecode/plate/react';

// Import plugins
import { BoldPlugin, ItalicPlugin, UnderlinePlugin, StrikethroughPlugin, CodePlugin } from '@udecode/plate-basic-marks/react';
import { HeadingPlugin } from '@udecode/plate-heading/react';
import { BlockquotePlugin } from '@udecode/plate-block-quote/react';
import { ListPlugin } from '@udecode/plate-list/react';
import { LinkPlugin } from '@udecode/plate-link/react';
import { AlignPlugin } from '@udecode/plate-alignment/react';
import { ImagePlugin } from '@udecode/plate-media/react';
import { TablePlugin } from '@udecode/plate-table/react';
import { HighlightPlugin } from '@udecode/plate-highlight/react';
import { HorizontalRulePlugin } from '@udecode/plate-horizontal-rule/react';

// Import editor components
import { Toolbar } from './Toolbar';
import { BalloonToolbar } from './FloatingToolbar';
import { PlateEditorProps } from './types';

export const PlateEditor: React.FC<PlateEditorProps> = ({
  initialValue,
  onChange,
  readOnly = false,
  placeholder
}) => {
  const editor = usePlateEditor({
    plugins: [
      HeadingPlugin,
      BlockquotePlugin,
      BoldPlugin,
      ItalicPlugin,
      UnderlinePlugin,
      StrikethroughPlugin,
      CodePlugin,
      ListPlugin,
      LinkPlugin,
      AlignPlugin,
      ImagePlugin,
      TablePlugin,
      HighlightPlugin,
      HorizontalRulePlugin
    ],
    value: initialValue || [{ type: 'p', children: [{ text: '' }] }],
    override: {
      components: {
        // Element components
        blockquote: withProps(PlateElement, {
          as: 'blockquote',
          className: 'border-l-4 border-gray-300 pl-4 my-4 italic',
        }),
        h1: withProps(PlateElement, {
          as: 'h1',
          className: 'text-3xl font-bold my-4',
        }),
        h2: withProps(PlateElement, {
          as: 'h2',
          className: 'text-2xl font-bold my-3',
        }),
        h3: withProps(PlateElement, {
          as: 'h3',
          className: 'text-xl font-bold my-2',
        }),
        p: withProps(PlateElement, {
          as: 'p',
          className: 'my-2',
        }),
        // Leaf components
        bold: withProps(PlateLeaf, { as: 'strong' }),
        italic: withProps(PlateLeaf, { as: 'em' }),
        underline: withProps(PlateLeaf, { as: 'u' }),
        strikethrough: withProps(PlateLeaf, { as: 's' }),
        code: withProps(PlateLeaf, { as: 'code', className: 'bg-gray-200 rounded px-1' }),
      },
    },
  });

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="border rounded-md">
        <Plate
          editor={editor}
          onChange={({ value }) => {
            if (onChange) {
              onChange(value);
            }
          }}
        >
          {!readOnly && (
            <div className="border-b">
              <Toolbar />
            </div>
          )}
          {!readOnly && <BalloonToolbar />}
          <PlateContent
            className="p-4"
            style={{
              minHeight: '150px',
              padding: '15px'
            }}
            readOnly={readOnly}
            placeholder={placeholder}
          />
        </Plate>
      </div>
    </DndProvider>
  );
};
