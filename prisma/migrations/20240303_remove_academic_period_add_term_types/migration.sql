-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "SystemStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DELETED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "UserType" AS ENUM ('STUDENT', 'TEACHER', 'COORDINATOR', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "AccessScope" AS ENUM ('SINGLE_CAMPUS', 'MULTI_CAMPUS', 'INSTITUTION');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "EntityType" AS ENUM ('USER', 'COURSE', 'PROGRAM', 'CAMPUS', 'INSTITUTION');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "TermType" AS ENUM ('SEMESTER', 'TRIMESTER', 'QUARTER', 'THEME_BASED', 'CUSTOM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "TermPeriod" AS ENUM ('FALL', 'SPRING', 'SUMMER', 'WINTER', 'FIRST_QUARTER', 'SECOND_QUARTER', 'THIRD_QUARTER', 'FOURTH_QUARTER', 'FIRST_TRIMESTER', 'SECOND_TRIMESTER', 'THIRD_TRIMESTER', 'THEME_UNIT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create tables if they don't exist
DO $$ BEGIN
    -- Create institutions table
    CREATE TABLE IF NOT EXISTS "institutions" (
        "id" TEXT NOT NULL,
        "code" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "status" "SystemStatus" NOT NULL DEFAULT 'ACTIVE',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "deletedAt" TIMESTAMP(3),
        CONSTRAINT "institutions_pkey" PRIMARY KEY ("id")
    );

    -- Create programs table
    CREATE TABLE IF NOT EXISTS "programs" (
        "id" TEXT NOT NULL,
        "code" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "level" INTEGER NOT NULL DEFAULT 1,
        "duration" INTEGER NOT NULL,
        "settings" JSONB,
        "curriculum" JSONB,
        "institutionId" TEXT NOT NULL,
        "status" "SystemStatus" NOT NULL DEFAULT 'ACTIVE',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "deletedAt" TIMESTAMP(3),
        CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
    );

    -- Create courses table
    CREATE TABLE IF NOT EXISTS "courses" (
        "id" TEXT NOT NULL,
        "code" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "level" INTEGER NOT NULL DEFAULT 1,
        "credits" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
        "programId" TEXT NOT NULL,
        "settings" JSONB,
        "syllabus" JSONB,
        "status" "SystemStatus" NOT NULL DEFAULT 'ACTIVE',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "deletedAt" TIMESTAMP(3),
        CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
    );

    -- Create academic_cycles table
    CREATE TABLE IF NOT EXISTS "academic_cycles" (
        "id" TEXT NOT NULL,
        "code" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "startDate" TIMESTAMP(3) NOT NULL,
        "endDate" TIMESTAMP(3) NOT NULL,
        "institutionId" TEXT NOT NULL,
        "status" "SystemStatus" NOT NULL DEFAULT 'ACTIVE',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "deletedAt" TIMESTAMP(3),
        CONSTRAINT "academic_cycles_pkey" PRIMARY KEY ("id")
    );

    -- Create terms table
    CREATE TABLE IF NOT EXISTS "terms" (
        "id" TEXT NOT NULL,
        "code" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "termType" "TermType" NOT NULL DEFAULT 'SEMESTER',
        "termPeriod" "TermPeriod" NOT NULL DEFAULT 'FALL',
        "startDate" TIMESTAMP(3) NOT NULL,
        "endDate" TIMESTAMP(3) NOT NULL,
        "courseId" TEXT NOT NULL,
        "academicCycleId" TEXT NOT NULL,
        "status" "SystemStatus" NOT NULL DEFAULT 'ACTIVE',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "deletedAt" TIMESTAMP(3),
        CONSTRAINT "terms_pkey" PRIMARY KEY ("id")
    );
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- Create indexes
DO $$ BEGIN
    -- Indexes for institutions
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS "institutions_code_key" ON "institutions"("code")';

    -- Indexes for programs
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS "programs_code_key" ON "programs"("code")';
    EXECUTE 'CREATE INDEX IF NOT EXISTS "programs_institutionId_code_idx" ON "programs"("institutionId", "code")';
    EXECUTE 'CREATE INDEX IF NOT EXISTS "programs_institutionId_status_idx" ON "programs"("institutionId", "status")';

    -- Indexes for courses
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS "courses_code_key" ON "courses"("code")';
    EXECUTE 'CREATE INDEX IF NOT EXISTS "courses_programId_code_idx" ON "courses"("programId", "code")';
    EXECUTE 'CREATE INDEX IF NOT EXISTS "courses_programId_status_idx" ON "courses"("programId", "status")';
    EXECUTE 'CREATE INDEX IF NOT EXISTS "courses_level_status_idx" ON "courses"("level", "status")';

    -- Indexes for academic_cycles
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS "academic_cycles_code_key" ON "academic_cycles"("code")';
    EXECUTE 'CREATE INDEX IF NOT EXISTS "academic_cycles_institutionId_code_idx" ON "academic_cycles"("institutionId", "code")';

    -- Indexes for terms
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS "terms_code_key" ON "terms"("code")';
    EXECUTE 'CREATE INDEX IF NOT EXISTS "terms_courseId_code_idx" ON "terms"("courseId", "code")';
    EXECUTE 'CREATE INDEX IF NOT EXISTS "terms_courseId_status_idx" ON "terms"("courseId", "status")';
    EXECUTE 'CREATE INDEX IF NOT EXISTS "terms_academicCycleId_idx" ON "terms"("academicCycleId")';
    EXECUTE 'CREATE INDEX IF NOT EXISTS "terms_termType_termPeriod_idx" ON "terms"("termType", "termPeriod")';
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- Add foreign key constraints
DO $$ BEGIN
    ALTER TABLE "programs" ADD CONSTRAINT "programs_institutionId_fkey" 
        FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "courses" ADD CONSTRAINT "courses_programId_fkey" 
        FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "academic_cycles" ADD CONSTRAINT "academic_cycles_institutionId_fkey" 
        FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "terms" ADD CONSTRAINT "terms_courseId_fkey" 
        FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "terms" ADD CONSTRAINT "terms_academicCycleId_fkey" 
        FOREIGN KEY ("academicCycleId") REFERENCES "academic_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- DropForeignKey
ALTER TABLE "terms" DROP CONSTRAINT IF EXISTS "terms_academic_period_id_fkey";

-- DropIndex
DROP INDEX IF EXISTS "terms_academic_period_id_idx";

-- AlterTable
ALTER TABLE "terms" DROP COLUMN IF EXISTS "academic_period_id";

-- DropTable
DROP TABLE IF EXISTS "academic_periods";

-- Update Institution Model
ALTER TABLE "institutions" DROP CONSTRAINT IF EXISTS "institutions_academic_periods_fkey"; 