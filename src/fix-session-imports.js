// Fix session imports script
// Run this with 'node fix-session-imports.js'

const fs = require('fs');
const path = require('path');

// Function to recursively find all TypeScript files in a directory
function findTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findTsFiles(filePath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Function to fix session imports in a file
function fixSessionImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Skip the trpc.ts file since it defines getUserSession
    if (filePath.includes('trpc.ts')) {
      return;
    }

    // Replace imports
    content = content.replace(
      /import\s+{\s*(?:.*,\s*)?getUserSession(?:\s*,\s*.*)?}\s+from\s+["']@\/server\/api\/trpc["'];/g,
      (match) => {
        // If the import has other imports from trpc, keep them
        if (match.includes(',')) {
          return match.replace('getUserSession, ', '').replace(', getUserSession', '');
        } else {
          // If it's just importing getUserSession, remove the entire line
          return '';
        }
      }
    );

    // Add import for getSessionCache if it doesn't exist
    if (!content.includes('getSessionCache') && content.includes('getUserSession')) {
      content = `import { getSessionCache } from "@/utils/session-cache";\n${content}`;
    }

    // Replace function calls
    content = content.replace(/getUserSession\(\)/g, 'getSessionCache()');

    // Only write the file if changes were made
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed session imports in ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

// Main function
function main() {
  const rootDir = path.resolve('.');
  const tsFiles = findTsFiles(rootDir);

  console.log(`Found ${tsFiles.length} TypeScript files`);
  let fixedCount = 0;

  tsFiles.forEach(file => {
    const originalContent = fs.readFileSync(file, 'utf8');
    fixSessionImports(file);
    const newContent = fs.readFileSync(file, 'utf8');
    
    if (originalContent !== newContent) {
      fixedCount++;
    }
  });

  console.log(`Fixed session imports in ${fixedCount} files`);
}

// Run the script
main(); 