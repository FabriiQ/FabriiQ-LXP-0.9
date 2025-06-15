/**
 * Auth Files Consolidation Script
 * 
 * This script consolidates authentication-related files in the codebase
 * to reduce duplication and conflicts.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define the root directory
const rootDir = path.resolve(__dirname, '..');

// Files to keep (core auth files)
const filesToKeep = [
  'src/server/api/services/auth.service.ts',
  'src/server/api/utils/auth.ts',
  'src/server/api/routers/auth.ts',
  'src/hooks/useAuth.ts',
  'src/server/api/middleware/authorization.ts',
];

// Files to remove (duplicates or unused)
const filesToRemove = [
  'src/lib/auth.ts',
  'src/server/api/middleware/auth.ts',
  'src/server/api/middleware/auth.middleware.ts',
  'src/server/api/routers/auth-documented.ts',
];

// Function to backup a file
function backupFile(filePath) {
  const backupDir = path.join(rootDir, 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  const backupPath = path.join(backupDir, filePath.replace(/\//g, '_'));
  fs.copyFileSync(path.join(rootDir, filePath), backupPath);
  console.log(`Backed up ${filePath} to ${backupPath}`);
  
  return backupPath;
}

// Function to find references to a file
function findReferences(filePath) {
  const references = [];
  const baseName = path.basename(filePath, '.ts');
  
  try {
    // Use grep to find references
    const grepCommand = `grep -r --include="*.ts" --include="*.tsx" "${baseName}" ${rootDir}/src`;
    const grepResult = execSync(grepCommand).toString().split('\n').filter(Boolean);
    
    // Parse grep results
    grepResult.forEach(line => {
      const [file, ...rest] = line.split(':');
      if (!file.includes(filePath)) {
        references.push(file);
      }
    });
  } catch (error) {
    // grep returns non-zero exit code if no matches found
    if (error.status !== 1) {
      console.error(`Error finding references for ${filePath}:`, error);
    }
  }
  
  return [...new Set(references)]; // Remove duplicates
}

// Function to check if a file is imported in another file
function isImportedIn(sourceFile, targetFile) {
  try {
    const content = fs.readFileSync(targetFile, 'utf8');
    const baseName = path.basename(sourceFile, '.ts');
    
    // Check for import statements
    const importRegex = new RegExp(`import\\s+.*\\s+from\\s+['"].*${baseName}['"]`, 'g');
    return importRegex.test(content);
  } catch (error) {
    console.error(`Error checking imports in ${targetFile}:`, error);
    return false;
  }
}

// Function to update imports in a file
function updateImports(filePath, oldImport, newImport) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace import statements
    const oldBaseName = path.basename(oldImport, '.ts');
    const newBaseName = path.basename(newImport, '.ts');
    
    // Handle different import patterns
    const importPatterns = [
      // import X from 'path/oldBaseName'
      { 
        regex: new RegExp(`import\\s+(\\w+)\\s+from\\s+['"].*${oldBaseName}['"]`, 'g'),
        replacement: (match, importName) => `import ${importName} from '${newImport}'`
      },
      // import { X } from 'path/oldBaseName'
      {
        regex: new RegExp(`import\\s+\\{([^}]+)\\}\\s+from\\s+['"].*${oldBaseName}['"]`, 'g'),
        replacement: (match, importNames) => `import { ${importNames} } from '${newImport}'`
      },
      // import * as X from 'path/oldBaseName'
      {
        regex: new RegExp(`import\\s+\\*\\s+as\\s+(\\w+)\\s+from\\s+['"].*${oldBaseName}['"]`, 'g'),
        replacement: (match, importName) => `import * as ${importName} from '${newImport}'`
      }
    ];
    
    // Apply each pattern
    importPatterns.forEach(pattern => {
      content = content.replace(pattern.regex, pattern.replacement);
    });
    
    fs.writeFileSync(filePath, content);
    console.log(`Updated imports in ${filePath}`);
  } catch (error) {
    console.error(`Error updating imports in ${filePath}:`, error);
  }
}

// Main function
async function main() {
  console.log('🔄 Starting auth files consolidation...\n');
  
  // Create backups directory
  const backupDir = path.join(rootDir, 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  // Process files to remove
  for (const filePath of filesToRemove) {
    const fullPath = path.join(rootDir, filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️ File ${filePath} does not exist, skipping.`);
      continue;
    }
    
    console.log(`Processing ${filePath}...`);
    
    // Find references
    const references = findReferences(filePath);
    console.log(`Found ${references.length} references to ${filePath}`);
    
    if (references.length > 0) {
      // Backup the file
      const backupPath = backupFile(filePath);
      
      // Determine replacement file
      let replacementFile = null;
      
      // Simple mapping based on file type
      if (filePath.includes('middleware')) {
        replacementFile = 'src/server/api/middleware/authorization.ts';
      } else if (filePath.includes('router')) {
        replacementFile = 'src/server/api/routers/auth.ts';
      } else if (filePath.includes('utils')) {
        replacementFile = 'src/server/api/utils/auth.ts';
      } else {
        replacementFile = 'src/server/api/services/auth.service.ts';
      }
      
      console.log(`Suggesting replacement: ${replacementFile}`);
      
      // Update imports in referencing files
      for (const refFile of references) {
        if (isImportedIn(filePath, refFile)) {
          updateImports(refFile, filePath, replacementFile);
        }
      }
      
      // Create a .deprecated file instead of deleting
      fs.renameSync(fullPath, `${fullPath}.deprecated`);
      console.log(`Renamed ${filePath} to ${filePath}.deprecated`);
    } else {
      // No references, safe to backup and remove
      backupFile(filePath);
      fs.renameSync(fullPath, `${fullPath}.deprecated`);
      console.log(`Renamed ${filePath} to ${filePath}.deprecated (no references found)`);
    }
  }
  
  console.log('\n✅ Auth files consolidation completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Check that your application still works correctly');
  console.log('2. If everything works, you can safely delete the .deprecated files');
  console.log('3. If there are issues, restore the files from the backups directory');
}

// Run the script
main().catch(error => {
  console.error('Error running script:', error);
  process.exit(1);
}); 