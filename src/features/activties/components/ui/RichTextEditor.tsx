'use client';

import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent, Editor, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  label?: string;
  id?: string;
  disabled?: boolean;
  simple?: boolean; // Simple mode with fewer options
}

/**
 * Rich Text Editor Component
 *
 * A reusable rich text editor component that can be used across activity editors.
 * Supports formatting, links, images, and more.
 */
export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = 'Start typing...',
  className,
  minHeight = '150px',
  label,
  id,
  disabled = false,
  simple = false
}) => {
  const [isMounted, setIsMounted] = useState(false);

  // Initialize the editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer hover:text-blue-800',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full rounded',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Handle content changes from outside
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Handle client-side rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Add a link
  const addLink = () => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  // Add an image
  const addImage = () => {
    if (!editor) return;

    const url = window.prompt('Image URL');

    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  if (!isMounted) {
    return (
      <div className={cn("border rounded-md p-3 bg-gray-50 dark:bg-gray-800", className)}>
        <div className="animate-pulse h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  return (
    <div className={cn("rich-text-editor", className)}>
      {label && (
        <label htmlFor={id} className="block mb-1 font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      <div
        className={cn(
          "border rounded-md overflow-hidden",
          disabled ? "bg-gray-100 dark:bg-gray-800" : "bg-white dark:bg-gray-900",
          "focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500"
        )}
      >
        {!disabled && (
          <div className="flex flex-wrap gap-1 p-1 border-b bg-gray-50 dark:bg-gray-800">
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className={cn(
                "p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700",
                editor?.isActive('bold') && "bg-gray-200 dark:bg-gray-700"
              )}
              title="Bold"
              aria-label="Bold"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-5 h-5 fill-current">
                <path d="M8 11h4.5a2.5 2.5 0 1 0 0-5H8v5Zm10 4.5a4.5 4.5 0 0 1-4.5 4.5H6V4h6.5a4.5 4.5 0 0 1 3.256 7.613A4.5 4.5 0 0 1 18 15.5ZM8 13v5h5.5a2.5 2.5 0 1 0 0-5H8Z"></path>
              </svg>
            </button>

            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className={cn(
                "p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700",
                editor?.isActive('italic') && "bg-gray-200 dark:bg-gray-700"
              )}
              title="Italic"
              aria-label="Italic"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-5 h-5 fill-current">
                <path d="M15 20H7v-2h2.927l2.116-12H9V4h8v2h-2.927l-2.116 12H15v2Z"></path>
              </svg>
            </button>

            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
              className={cn(
                "p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700",
                editor?.isActive('underline') && "bg-gray-200 dark:bg-gray-700"
              )}
              title="Underline"
              aria-label="Underline"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-5 h-5 fill-current">
                <path d="M8 3v9a4 4 0 1 0 8 0V3h2v9a6 6 0 1 1-12 0V3h2ZM4 20h16v2H4v-2Z"></path>
              </svg>
            </button>

            <div className="w-px h-6 mx-1 bg-gray-300 dark:bg-gray-600"></div>

            {!simple && (
              <>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                  className={cn(
                    "p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700",
                    editor?.isActive('heading', { level: 2 }) && "bg-gray-200 dark:bg-gray-700"
                  )}
                  title="Heading"
                  aria-label="Heading"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-5 h-5 fill-current">
                    <path d="M13.414 3a1 1 0 0 1 .707.293l.707.707L16.586 5a1 1 0 0 1 0 1.414l-9.879 9.879a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 0-1.414l9.879-9.879A1 1 0 0 1 13.414 3ZM15 15v4h2v2H7v-2h2V7H7V5h6v10h2Z"></path>
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleBulletList().run()}
                  className={cn(
                    "p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700",
                    editor?.isActive('bulletList') && "bg-gray-200 dark:bg-gray-700"
                  )}
                  title="Bullet List"
                  aria-label="Bullet List"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-5 h-5 fill-current">
                    <path d="M8 4h13v2H8V4ZM4.5 6.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm0 7a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm0 6.9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3ZM8 11h13v2H8v-2Zm0 7h13v2H8v-2Z"></path>
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                  className={cn(
                    "p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700",
                    editor?.isActive('orderedList') && "bg-gray-200 dark:bg-gray-700"
                  )}
                  title="Numbered List"
                  aria-label="Numbered List"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-5 h-5 fill-current">
                    <path d="M8 4h13v2H8V4ZM5 3v3h1v1H3V6h1V4H3V3h2Zm-2 7h3.25v1.5H5v1h1.25V14H3v-1h1v-1H3v-2h2Zm0 7h3v1H3v-1Zm2-2v.5H3v1h2V18H3v-3h2v1ZM8 11h13v2H8v-2Zm0 7h13v2H8v-2Z"></path>
                  </svg>
                </button>

                <div className="w-px h-6 mx-1 bg-gray-300 dark:bg-gray-600"></div>
              </>
            )}

            <button
              type="button"
              onClick={addLink}
              className={cn(
                "p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700",
                editor?.isActive('link') && "bg-gray-200 dark:bg-gray-700"
              )}
              title="Link"
              aria-label="Link"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-5 h-5 fill-current">
                <path d="M18.364 15.536 16.95 14.12l1.414-1.414a5 5 0 1 0-7.071-7.071L9.879 7.05 8.464 5.636 9.88 4.222a7 7 0 0 1 9.9 9.9l-1.415 1.414Zm-2.828 2.828-1.415 1.414a7 7 0 0 1-9.9-9.9l1.415-1.414L7.05 9.88l-1.414 1.414a5 5 0 1 0 7.071 7.071l1.414-1.414 1.415 1.414Zm-.708-10.607 1.415 1.415-7.071 7.07-1.415-1.414 7.071-7.07Z"></path>
              </svg>
            </button>

            {!simple && (
              <button
                type="button"
                onClick={addImage}
                className={cn(
                  "p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                )}
                title="Image"
                aria-label="Image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-5 h-5 fill-current">
                  <path d="M2.9918 21C2.44405 21 2 20.5551 2 20.0066V3.9934C2 3.44476 2.45531 3 2.9918 3H21.0082C21.556 3 22 3.44495 22 3.9934V20.0066C22 20.5552 21.5447 21 21.0082 21H2.9918ZM20 15V5H4V19L14 9L20 15ZM20 17.8284L14 11.8284L6.82843 19H20V17.8284ZM8 11C6.89543 11 6 10.1046 6 9C6 7.89543 6.89543 7 8 7C9.10457 7 10 7.89543 10 9C10 10.1046 9.10457 11 8 11Z"></path>
                </svg>
              </button>
            )}
          </div>
        )}

        <EditorContent
          editor={editor}
          className={cn(
            "prose dark:prose-invert max-w-none p-3",
            "focus:outline-none",
            "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100",
            disabled ? "opacity-75 cursor-not-allowed" : "cursor-text"
          )}
          style={{ minHeight }}
        />

        {editor && (
          <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
            <div className="flex bg-white dark:bg-gray-800 shadow-lg rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={cn(
                  "p-1 hover:bg-gray-100 dark:hover:bg-gray-700",
                  editor.isActive('bold') && "bg-gray-100 dark:bg-gray-700"
                )}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-5 h-5 fill-current">
                  <path d="M8 11h4.5a2.5 2.5 0 1 0 0-5H8v5Zm10 4.5a4.5 4.5 0 0 1-4.5 4.5H6V4h6.5a4.5 4.5 0 0 1 3.256 7.613A4.5 4.5 0 0 1 18 15.5ZM8 13v5h5.5a2.5 2.5 0 1 0 0-5H8Z"></path>
                </svg>
              </button>
              <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={cn(
                  "p-1 hover:bg-gray-100 dark:hover:bg-gray-700",
                  editor.isActive('italic') && "bg-gray-100 dark:bg-gray-700"
                )}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-5 h-5 fill-current">
                  <path d="M15 20H7v-2h2.927l2.116-12H9V4h8v2h-2.927l-2.116 12H15v2Z"></path>
                </svg>
              </button>
              <button
                onClick={addLink}
                className={cn(
                  "p-1 hover:bg-gray-100 dark:hover:bg-gray-700",
                  editor.isActive('link') && "bg-gray-100 dark:bg-gray-700"
                )}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-5 h-5 fill-current">
                  <path d="M18.364 15.536 16.95 14.12l1.414-1.414a5 5 0 1 0-7.071-7.071L9.879 7.05 8.464 5.636 9.88 4.222a7 7 0 0 1 9.9 9.9l-1.415 1.414Zm-2.828 2.828-1.415 1.414a7 7 0 0 1-9.9-9.9l1.415-1.414L7.05 9.88l-1.414 1.414a5 5 0 1 0 7.071 7.071l1.414-1.414 1.415 1.414Zm-.708-10.607 1.415 1.415-7.071 7.07-1.415-1.414 7.071-7.07Z"></path>
                </svg>
              </button>
            </div>
          </BubbleMenu>
        )}
      </div>
    </div>
  );
};

export default RichTextEditor;
