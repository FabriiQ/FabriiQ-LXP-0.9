// Fix session access script
// Run this with 'node fix-session-access.js'

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

// Function to fix session access in a file
function fixSessionAccess(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Replace session?.userId with session?.user?.id
    content = content.replace(/session\?\.userId/g, 'session?.user?.id');
    content = content.replace(/ctx\.session\?\.userId/g, 'ctx.session?.user?.id');

    // Only write the file if changes were made
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed session access in ${filePath}`);
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
    fixSessionAccess(file);
    const newContent = fs.readFileSync(file, 'utf8');
    
    if (originalContent !== newContent) {
      fixedCount++;
    }
  });

  console.log(`Fixed session access in ${fixedCount} files`);
}

// Run the script
main(); 