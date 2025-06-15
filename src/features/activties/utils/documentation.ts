'use client';

/**
 * Documentation Utilities
 * 
 * This file provides utilities for handling documentation in the codebase.
 * It helps to avoid issues with importing Markdown files directly.
 */

/**
 * Safely imports documentation from a module
 * 
 * This function is used to safely import documentation from a module,
 * handling any errors that might occur during the import.
 * 
 * @param importFn - A function that returns a Promise from a dynamic import
 * @returns A Promise that resolves to the documentation or null if an error occurs
 */
export async function safelyImportDocumentation(
  importFn: () => Promise<any>
): Promise<string | null> {
  try {
    const module = await importFn();
    return module.default || null;
  } catch (error) {
    console.warn('Failed to import documentation:', error);
    return null;
  }
}

/**
 * Creates a documentation object from a string
 * 
 * This function is used to create a documentation object from a string,
 * which can be used to display documentation in the UI.
 * 
 * @param content - The documentation content as a string
 * @returns An object with the documentation content and metadata
 */
export function createDocumentation(content: string) {
  // Extract title from the first line of the content
  const lines = content.split('\n');
  const title = lines[0].replace(/^#\s+/, '');
  
  // Extract description from the second paragraph
  const description = lines.length > 2 ? lines[2] : '';
  
  return {
    title,
    description,
    content,
  };
}

/**
 * Converts a Markdown file path to a TypeScript file path
 * 
 * This function is used to convert a Markdown file path to a TypeScript file path,
 * which can be used to import documentation from TypeScript files instead of Markdown files.
 * 
 * @param path - The Markdown file path
 * @returns The TypeScript file path
 */
export function markdownToTypeScript(path: string): string {
  return path.replace(/\.md$/, '.ts');
}

/**
 * Checks if a file path is a Markdown file
 * 
 * @param path - The file path to check
 * @returns True if the file path is a Markdown file, false otherwise
 */
export function isMarkdownFile(path: string): boolean {
  return path.endsWith('.md');
}

/**
 * Safely imports all documentation from a list of modules
 * 
 * This function is used to safely import documentation from a list of modules,
 * handling any errors that might occur during the imports.
 * 
 * @param importFns - An array of functions that return Promises from dynamic imports
 * @returns A Promise that resolves to an array of documentation objects
 */
export async function importAllDocumentation(
  importFns: Array<() => Promise<any>>
): Promise<Array<{ title: string; description: string; content: string }>> {
  const documentationPromises = importFns.map(async (importFn) => {
    const content = await safelyImportDocumentation(importFn);
    return content ? createDocumentation(content) : null;
  });
  
  const documentationResults = await Promise.all(documentationPromises);
  return documentationResults.filter(Boolean) as Array<{ title: string; description: string; content: string }>;
}
