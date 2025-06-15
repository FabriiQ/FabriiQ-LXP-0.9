import { PrismaClient } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';

const prisma = new PrismaClient();

interface ExistingAcademicPeriod {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: 'ACTIVE' | 'INACTIVE' | 'DELETED';
  terms: {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    status: 'ACTIVE' | 'INACTIVE' | 'DELETED';
  }[];
}

async function checkTableExists(tableName: string): Promise<boolean> {
  const result = await prisma.$queryRaw<any[]>`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name = ${tableName}
    );
  `;
  return result[0].exists;
}

async function backupExistingData() {
  console.log('Checking if academic_periods table exists...');
  const tableExists = await checkTableExists('academic_periods');
  
  if (!tableExists) {
    console.log('academic_periods table does not exist, skipping backup...');
    return [];
  }
  
  console.log('Backing up existing data...');
  
  // Use raw query to get data from academic_periods table before it's dropped
  const academicPeriods = await prisma.$queryRaw<ExistingAcademicPeriod[]>`
    SELECT 
      ap.*,
      json_agg(t.*) as terms
    FROM academic_periods ap
    LEFT JOIN terms t ON t.academic_period_id = ap.id
    GROUP BY ap.id
  `;
  
  const backupDir = path.join(__dirname, '../../../backup');
  await fs.mkdir(backupDir, { recursive: true });
  
  await fs.writeFile(
    path.join(backupDir, `academic_periods_${Date.now()}.json`),
    JSON.stringify(academicPeriods, null, 2)
  );
  
  console.log('Backup completed successfully');
  return academicPeriods;
}

async function validateExistingData() {
  console.log('Validating existing data...');
  
  const tableExists = await checkTableExists('academic_periods');
  if (!tableExists) {
    console.log('academic_periods table does not exist, skipping validation...');
    return;
  }
  
  const invalidPeriods = await prisma.$queryRaw<any[]>`
    SELECT * FROM academic_periods
    WHERE start_date IS NULL
    OR end_date IS NULL
    OR status IS NULL
  `;
  
  if (invalidPeriods.length > 0) {
    console.error('Invalid periods found:', invalidPeriods);
    throw new Error('Invalid periods found in the database');
  }
  
  console.log('Data validation completed successfully');
}

function determineTermTypeAndPeriod(period: ExistingAcademicPeriod): {
  termType: 'SEMESTER' | 'TRIMESTER' | 'QUARTER' | 'THEME_BASED' | 'CUSTOM';
  termPeriod: 'FALL' | 'SPRING' | 'SUMMER' | 'WINTER' | 'FIRST_QUARTER' | 'SECOND_QUARTER' | 'THIRD_QUARTER' | 'FOURTH_QUARTER' | 'FIRST_TRIMESTER' | 'SECOND_TRIMESTER' | 'THIRD_TRIMESTER' | 'THEME_UNIT';
} {
  const nameLower = period.name.toLowerCase();
  const monthStart = new Date(period.startDate).getMonth();
  
  // Handle semester-based terms
  if (nameLower.includes('semester')) {
    return {
      termType: 'SEMESTER',
      termPeriod: monthStart < 6 ? 'SPRING' : 'FALL'
    };
  }
  
  // Handle quarter-based terms
  if (nameLower.includes('quarter')) {
    const quarterNumber = Math.floor(monthStart / 3) + 1;
    const quarterPeriods = {
      1: 'FIRST_QUARTER',
      2: 'SECOND_QUARTER',
      3: 'THIRD_QUARTER',
      4: 'FOURTH_QUARTER'
    };
    
    return {
      termType: 'QUARTER',
      termPeriod: quarterPeriods[quarterNumber as 1 | 2 | 3 | 4] as 'FIRST_QUARTER' | 'SECOND_QUARTER' | 'THIRD_QUARTER' | 'FOURTH_QUARTER'
    };
  }
  
  // Handle trimester-based terms
  if (nameLower.includes('trimester')) {
    const trimesterNumber = Math.floor(monthStart / 4) + 1;
    const trimesterPeriods = {
      1: 'FIRST_TRIMESTER',
      2: 'SECOND_TRIMESTER',
      3: 'THIRD_TRIMESTER'
    };
    
    return {
      termType: 'TRIMESTER',
      termPeriod: trimesterPeriods[trimesterNumber as 1 | 2 | 3] as 'FIRST_TRIMESTER' | 'SECOND_TRIMESTER' | 'THIRD_TRIMESTER'
    };
  }
  
  // Handle theme-based terms
  if (nameLower.includes('theme') || nameLower.includes('unit')) {
    return {
      termType: 'THEME_BASED',
      termPeriod: 'THEME_UNIT'
    };
  }
  
  // Default fallback
  return {
    termType: 'SEMESTER',
    termPeriod: monthStart < 6 ? 'SPRING' : 'FALL'
  };
}

async function migrateTermStructure() {
  try {
    console.log('Starting term structure migration...');
    
    // 1. Backup existing data
    const academicPeriods = await backupExistingData();
    
    // 2. Validate existing data
    await validateExistingData();
    
    // 3. Migrate data if academic_periods table exists
    if (academicPeriods.length > 0) {
      console.log('Migrating data from academic_periods to terms...');
      for (const period of academicPeriods) {
        const { termType, termPeriod } = determineTermTypeAndPeriod(period);
        
        for (const term of period.terms) {
          await prisma.term.update({
            where: { id: term.id },
            data: {
              termType,
              termPeriod,
              startDate: new Date(period.startDate),
              endDate: new Date(period.endDate),
              status: period.status
            }
          });
        }
      }
    }
    
    // 4. Validate migration
    console.log('Validating migration...');
    const termsWithoutType = await prisma.term.findMany({
      where: {
        OR: [
          { termType: undefined },
          { termPeriod: undefined }
        ]
      }
    });
    
    if (termsWithoutType.length > 0) {
      throw new Error('Migration validation failed: Some terms are missing type or period');
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

async function validateMigration() {
  console.log('Running post-migration validation...');
  
  // 1. Check all terms have type and period
  const invalidTerms = await prisma.term.findMany({
    where: {
      OR: [
        { termType: undefined },
        { termPeriod: undefined }
      ]
    }
  });
  
  if (invalidTerms.length > 0) {
    throw new Error('Post-migration validation failed: Invalid terms found');
  }
  
  // 2. Verify data consistency
  const terms = await prisma.term.findMany({
    include: {
      classes: true,
      assessments: true
    }
  });
  
  for (const term of terms) {
    if (!term.termType || !term.termPeriod) {
      throw new Error(`Term ${term.id} is missing type or period`);
    }
    
    if (new Date(term.startDate) >= new Date(term.endDate)) {
      throw new Error(`Term ${term.id} has invalid dates`);
    }
  }
  
  console.log('Post-migration validation completed successfully');
}

async function main() {
  try {
    await migrateTermStructure();
    await validateMigration();
    console.log('Migration process completed successfully');
  } catch (error) {
    console.error('Migration process failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
} 