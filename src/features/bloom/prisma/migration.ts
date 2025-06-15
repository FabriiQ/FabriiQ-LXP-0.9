/**
 * Bloom's Taxonomy Migration Script
 * 
 * This script applies the schema changes for Bloom's Taxonomy, rubrics, and topic mastery.
 * It preserves existing data and adds new tables and columns.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting Bloom\'s Taxonomy migration...');

  try {
    // Step 1: Create enums
    console.log('Creating enums...');
    // Note: Enums are created automatically by Prisma when running migrations

    // Step 2: Add new columns to existing tables
    console.log('Adding new columns to existing tables...');
    
    // Add bloomsDistribution to Subject
    await prisma.$executeRaw`
      ALTER TABLE subjects
      ADD COLUMN IF NOT EXISTS blooms_distribution JSONB;
    `;
    
    // Add bloomsDistribution to SubjectTopic
    await prisma.$executeRaw`
      ALTER TABLE subject_topics
      ADD COLUMN IF NOT EXISTS blooms_distribution JSONB;
    `;
    
    // Add bloomsDistribution to LessonPlan
    await prisma.$executeRaw`
      ALTER TABLE lesson_plans
      ADD COLUMN IF NOT EXISTS blooms_distribution JSONB;
    `;
    
    // Add bloomsDistribution and rubricId to Assessment
    await prisma.$executeRaw`
      ALTER TABLE assessments
      ADD COLUMN IF NOT EXISTS blooms_distribution JSONB,
      ADD COLUMN IF NOT EXISTS rubric_id TEXT;
    `;
    
    // Add bloomsLevel and learningOutcomeIds to Question
    await prisma.$executeRaw`
      ALTER TABLE questions
      ADD COLUMN IF NOT EXISTS blooms_level TEXT,
      ADD COLUMN IF NOT EXISTS learning_outcome_ids TEXT[] DEFAULT '{}';
    `;
    
    // Add bloomsLevelScores to AssessmentResult
    await prisma.$executeRaw`
      ALTER TABLE assessment_results
      ADD COLUMN IF NOT EXISTS blooms_level_scores JSONB,
      ADD COLUMN IF NOT EXISTS topic_mastery_id TEXT;
    `;

    // Step 3: Create new tables
    console.log('Creating new tables...');
    
    // Create LearningOutcome table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS learning_outcomes (
        id TEXT PRIMARY KEY,
        statement TEXT NOT NULL,
        description TEXT,
        blooms_level TEXT NOT NULL,
        action_verbs TEXT[] DEFAULT '{}',
        subject_id TEXT NOT NULL,
        topic_id TEXT,
        created_by_id TEXT NOT NULL,
        created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (subject_id) REFERENCES subjects(id),
        FOREIGN KEY (topic_id) REFERENCES subject_topics(id),
        FOREIGN KEY (created_by_id) REFERENCES users(id)
      );
    `;
    
    // Create Rubric table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS rubrics (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        max_score FLOAT NOT NULL,
        blooms_distribution JSONB,
        created_by_id TEXT NOT NULL,
        created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by_id) REFERENCES users(id)
      );
    `;
    
    // Create RubricCriteria table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS rubric_criteria (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        blooms_level TEXT NOT NULL,
        weight FLOAT NOT NULL,
        rubric_id TEXT NOT NULL,
        created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (rubric_id) REFERENCES rubrics(id) ON DELETE CASCADE
      );
    `;
    
    // Create PerformanceLevel table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS performance_levels (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        min_score FLOAT NOT NULL,
        max_score FLOAT NOT NULL,
        color TEXT,
        rubric_id TEXT NOT NULL,
        created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (rubric_id) REFERENCES rubrics(id) ON DELETE CASCADE
      );
    `;
    
    // Create CriteriaLevel table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS criteria_levels (
        id TEXT PRIMARY KEY,
        description TEXT NOT NULL,
        score FLOAT NOT NULL,
        criteria_id TEXT NOT NULL,
        performance_level_id TEXT NOT NULL,
        created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (criteria_id) REFERENCES rubric_criteria(id) ON DELETE CASCADE,
        FOREIGN KEY (performance_level_id) REFERENCES performance_levels(id) ON DELETE CASCADE,
        UNIQUE(criteria_id, performance_level_id)
      );
    `;
    
    // Create RubricOutcome junction table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS rubric_outcomes (
        rubric_id TEXT NOT NULL,
        learning_outcome_id TEXT NOT NULL,
        created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (rubric_id, learning_outcome_id),
        FOREIGN KEY (rubric_id) REFERENCES rubrics(id) ON DELETE CASCADE,
        FOREIGN KEY (learning_outcome_id) REFERENCES learning_outcomes(id) ON DELETE CASCADE
      );
    `;
    
    // Create TopicMastery table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS topic_masteries (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        topic_id TEXT NOT NULL,
        subject_id TEXT NOT NULL,
        remember_level FLOAT NOT NULL DEFAULT 0,
        understand_level FLOAT NOT NULL DEFAULT 0,
        apply_level FLOAT NOT NULL DEFAULT 0,
        analyze_level FLOAT NOT NULL DEFAULT 0,
        evaluate_level FLOAT NOT NULL DEFAULT 0,
        create_level FLOAT NOT NULL DEFAULT 0,
        overall_mastery FLOAT NOT NULL DEFAULT 0,
        last_assessment_date TIMESTAMP(3) NOT NULL,
        created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES users(id),
        FOREIGN KEY (topic_id) REFERENCES subject_topics(id),
        FOREIGN KEY (subject_id) REFERENCES subjects(id),
        UNIQUE(student_id, topic_id)
      );
    `;
    
    // Create ActivityTemplate table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS activity_templates (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        type TEXT NOT NULL,
        setting TEXT NOT NULL,
        blooms_level TEXT NOT NULL,
        estimated_duration INTEGER NOT NULL,
        group_size INTEGER,
        materials TEXT[] DEFAULT '{}',
        instructions TEXT NOT NULL,
        assessment_strategy TEXT,
        differentiation_advanced TEXT,
        differentiation_struggling TEXT,
        tags TEXT[] DEFAULT '{}',
        subject TEXT,
        grade_levels TEXT[] DEFAULT '{}',
        created_by_id TEXT NOT NULL,
        created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by_id) REFERENCES users(id)
      );
    `;
    
    // Create Activity table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS activities (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        type TEXT NOT NULL,
        setting TEXT NOT NULL,
        blooms_level TEXT NOT NULL,
        duration INTEGER NOT NULL,
        group_size INTEGER,
        materials TEXT[] DEFAULT '{}',
        instructions TEXT NOT NULL,
        template_id TEXT,
        rubric_id TEXT,
        lesson_plan_id TEXT,
        subject_id TEXT NOT NULL,
        topic_id TEXT,
        class_id TEXT NOT NULL,
        created_by_id TEXT NOT NULL,
        created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (template_id) REFERENCES activity_templates(id),
        FOREIGN KEY (rubric_id) REFERENCES rubrics(id),
        FOREIGN KEY (lesson_plan_id) REFERENCES lesson_plans(id),
        FOREIGN KEY (subject_id) REFERENCES subjects(id),
        FOREIGN KEY (topic_id) REFERENCES subject_topics(id),
        FOREIGN KEY (class_id) REFERENCES classes(id),
        FOREIGN KEY (created_by_id) REFERENCES users(id)
      );
    `;
    
    // Create ActivityOutcome junction table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS activity_outcomes (
        activity_id TEXT NOT NULL,
        learning_outcome_id TEXT NOT NULL,
        created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (activity_id, learning_outcome_id),
        FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
        FOREIGN KEY (learning_outcome_id) REFERENCES learning_outcomes(id) ON DELETE CASCADE
      );
    `;
    
    // Create LessonPlanOutcome junction table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS lesson_plan_outcomes (
        lesson_plan_id TEXT NOT NULL,
        learning_outcome_id TEXT NOT NULL,
        created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (lesson_plan_id, learning_outcome_id),
        FOREIGN KEY (lesson_plan_id) REFERENCES lesson_plans(id) ON DELETE CASCADE,
        FOREIGN KEY (learning_outcome_id) REFERENCES learning_outcomes(id) ON DELETE CASCADE
      );
    `;
    
    // Create AssessmentOutcome junction table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS assessment_outcomes (
        assessment_id TEXT NOT NULL,
        learning_outcome_id TEXT NOT NULL,
        created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (assessment_id, learning_outcome_id),
        FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
        FOREIGN KEY (learning_outcome_id) REFERENCES learning_outcomes(id) ON DELETE CASCADE
      );
    `;

    // Step 4: Add foreign key constraints
    console.log('Adding foreign key constraints...');
    
    // Add foreign key from Assessment to Rubric
    await prisma.$executeRaw`
      ALTER TABLE assessments
      ADD CONSTRAINT fk_assessment_rubric
      FOREIGN KEY (rubric_id) REFERENCES rubrics(id);
    `;
    
    // Add foreign key from AssessmentResult to TopicMastery
    await prisma.$executeRaw`
      ALTER TABLE assessment_results
      ADD CONSTRAINT fk_assessment_result_topic_mastery
      FOREIGN KEY (topic_mastery_id) REFERENCES topic_masteries(id);
    `;

    // Step 5: Create indexes for performance
    console.log('Creating indexes...');
    
    // Create index on LearningOutcome.subjectId
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_learning_outcome_subject_id
      ON learning_outcomes(subject_id);
    `;
    
    // Create index on LearningOutcome.topicId
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_learning_outcome_topic_id
      ON learning_outcomes(topic_id);
    `;
    
    // Create index on TopicMastery.studentId
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_topic_mastery_student_id
      ON topic_masteries(student_id);
    `;
    
    // Create index on TopicMastery.topicId
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_topic_mastery_topic_id
      ON topic_masteries(topic_id);
    `;
    
    // Create index on TopicMastery.subjectId
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_topic_mastery_subject_id
      ON topic_masteries(subject_id);
    `;
    
    // Create index on Activity.subjectId
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_activity_subject_id
      ON activities(subject_id);
    `;
    
    // Create index on Activity.classId
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_activity_class_id
      ON activities(class_id);
    `;

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
