/**
 * Auth Files Cleanup Script
 * 
 * This script analyzes the authentication-related files in the codebase
 * and provides recommendations for cleanup.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define the root directory
const rootDir = path.resolve(__dirname, '..');

// Define auth-related file patterns
const authFilePatterns = [
  '**/auth.ts',
  '**/auth.*.ts',
  '**/auth-*.ts',
  '**/auth/*.ts',
  '**/authentication.ts',
  '**/authorization.ts',
  '**/auth.service.ts',
  '**/auth.middleware.ts',
  '**/useAuth.ts',
];

// Files to keep (these are the core files we want to maintain)
const filesToKeep = [
  'src/server/api/services/auth.service.ts',
  'src/server/api/utils/auth.ts',
  'src/server/api/routers/auth.ts',
  'src/hooks/useAuth.ts',
  'src/server/api/middleware/authorization.ts',
];

// Files to potentially remove (these might be duplicates or unused)
const filesToReview = [
  'src/lib/auth.ts',
  'src/server/api/middleware/auth.ts',
  'src/server/api/middleware/auth.middleware.ts',
  'src/server/api/routers/auth-documented.ts',
];

// Function to find auth files
function findAuthFiles() {
  let allFiles = [];
  
  try {
    // Use git to find all files (more reliable than fs.readdir for large projects)
    const gitCommand = `git ls-files -- "*.ts"`;
    const gitFiles = execSync(gitCommand, { cwd: rootDir }).toString().split('\n').filter(Boolean);
    
    // Filter for auth-related files
    allFiles = gitFiles.filter(file => {
      const basename = path.basename(file);
      return basename.includes('auth') || 
             basename.includes('Auth') || 
             basename.includes('session') || 
             basename.includes('Session');
    });
  } catch (error) {
    // Fallback to using glob patterns if git command fails
    console.log('Git command failed, using fallback method');
    authFilePatterns.forEach(pattern => {
      const command = `find ${rootDir} -type f -path "${pattern}"`;
      try {
        const files = execSync(command).toString().split('\n').filter(Boolean);
        allFiles = [...allFiles, ...files];
      } catch (error) {
        // Ignore errors for individual patterns
      }
    });
  }
  
  return [...new Set(allFiles)]; // Remove duplicates
}

// Function to analyze file imports and exports
function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(path.join(rootDir, filePath), 'utf8');
    
    // Check for imports
    const imports = content.match(/import\s+.*\s+from\s+['"](.*)['"];?/g) || [];
    
    // Check for exports
    const exports = content.match(/export\s+(const|function|class|interface|type|enum|default)\s+(\w+)/g) || [];
    
    // Check for usage of auth-related terms
    const authTerms = [
      'session', 'Session', 
      'auth', 'Auth', 
      'login', 'Login', 
      'logout', 'Logout',
      'register', 'Register',
      'password', 'Password',
      'permission', 'Permission',
      'role', 'Role'
    ];
    
    const authUsage = authTerms.filter(term => 
      content.includes(term)
    );
    
    return {
      path: filePath,
      imports: imports.length,
      exports: exports.length,
      size: content.length,
      authUsage: authUsage.length,
      importsList: imports,
      exportsList: exports,
    };
  } catch (error) {
    console.error(`Error analyzing file ${filePath}:`, error);
    return {
      path: filePath,
      imports: 0,
      exports: 0,
      size: 0,
      authUsage: 0,
      importsList: [],
      exportsList: [],
      error: error.message
    };
  }
}

// Function to check for file references
function findReferences(filePath, allFiles) {
  const references = [];
  const baseName = path.basename(filePath, '.ts');
  const dirName = path.dirname(filePath);
  
  allFiles.forEach(file => {
    if (file === filePath) return; // Skip self
    
    try {
      const content = fs.readFileSync(path.join(rootDir, file), 'utf8');
      
      // Check for imports of this file
      const relativePath = path.relative(path.dirname(file), filePath).replace(/\.ts$/, '');
      const importPattern = new RegExp(`import\\s+.*\\s+from\\s+['"].*${baseName}['"];?`, 'g');
      
      if (importPattern.test(content)) {
        references.push(file);
      }
    } catch (error) {
      // Ignore errors for individual files
    }
  });
  
  return references;
}

// Main function
async function main() {
  console.log('🔍 Analyzing authentication files...\n');
  
  // Find all auth-related files
  const authFiles = findAuthFiles();
  console.log(`Found ${authFiles.length} authentication-related files.\n`);
  
  // Analyze each file
  const fileAnalysis = authFiles.map(file => analyzeFile(file));
  
  // Find references for each file
  fileAnalysis.forEach(analysis => {
    analysis.references = findReferences(analysis.path, authFiles);
  });
  
  // Print recommendations
  console.log('📋 Recommendations:\n');
  
  console.log('✅ Files to keep:');
  filesToKeep.forEach(file => {
    const analysis = fileAnalysis.find(a => a.path === file);
    if (analysis) {
      console.log(`  - ${file} (${analysis.references.length} references, ${analysis.exports} exports)`);
    } else {
      console.log(`  - ${file} (not found in analysis)`);
    }
  });
  
  console.log('\n⚠️ Files to review (potential duplicates or unused):');
  filesToReview.forEach(file => {
    const analysis = fileAnalysis.find(a => a.path === file);
    if (analysis) {
      console.log(`  - ${file} (${analysis.references.length} references, ${analysis.exports} exports)`);
      if (analysis.references.length > 0) {
        console.log(`    Referenced by: ${analysis.references.join(', ')}`);
      }
    } else {
      console.log(`  - ${file} (not found in analysis)`);
    }
  });
  
  console.log('\n🔍 Other auth-related files found:');
  fileAnalysis
    .filter(a => !filesToKeep.includes(a.path) && !filesToReview.includes(a.path))
    .forEach(analysis => {
      console.log(`  - ${analysis.path} (${analysis.references.length} references, ${analysis.exports} exports)`);
    });
  
  console.log('\n📝 Cleanup Instructions:');
  console.log('1. Keep the core files listed above');
  console.log('2. Review the potential duplicate files and consider removing them');
  console.log('3. Check if any other auth-related files can be consolidated');
  console.log('4. Update imports in files that reference removed files');
  
  console.log('\n⚠️ Warning: Do not delete files without checking their references first!');
}

// Run the script
main().catch(error => {
  console.error('Error running script:', error);
  process.exit(1);
}); 