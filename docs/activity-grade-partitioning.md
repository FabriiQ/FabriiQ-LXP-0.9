# ActivityGrade Table Partitioning Strategy

## Overview

The ActivityGrade table is expected to grow rapidly as students complete activities. With thousands of students completing multiple activities daily, this table could quickly reach millions of records. To maintain performance at scale, we need a partitioning strategy.

## Partitioning Approach

We'll implement a multi-level partitioning strategy:

1. **Class-based Partitioning**: Primary partitioning by class
2. **Time-based Partitioning**: Secondary partitioning by academic term
3. **Archiving Strategy**: Moving old data to archive tables

## Implementation Details

### 1. Class-based Partitioning

We'll create separate tables for each class using PostgreSQL table inheritance:

```sql
-- Create parent table
CREATE TABLE activity_grades (
  id TEXT PRIMARY KEY,
  activity_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  score DOUBLE PRECISION,
  points INTEGER,
  feedback TEXT,
  status TEXT NOT NULL,
  submitted_at TIMESTAMP(3) NOT NULL,
  graded_at TIMESTAMP(3),
  graded_by_id TEXT,
  content JSONB,
  attachments JSONB,
  created_at TIMESTAMP(3) NOT NULL,
  updated_at TIMESTAMP(3) NOT NULL,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  is_committed BOOLEAN NOT NULL DEFAULT false,
  commitment_id TEXT,
  commitment_deadline TIMESTAMP(3),
  commitment_met BOOLEAN
);

-- Create child table for a specific class
CREATE TABLE activity_grades_class_123 (
  CHECK (activity_id IN (SELECT id FROM activities WHERE class_id = '123'))
) INHERITS (activity_grades);

-- Create indexes on the child table
CREATE INDEX idx_activity_grades_class_123_activity_id ON activity_grades_class_123(activity_id);
CREATE INDEX idx_activity_grades_class_123_student_id ON activity_grades_class_123(student_id);
CREATE UNIQUE INDEX idx_activity_grades_class_123_activity_student ON activity_grades_class_123(activity_id, student_id);
```

### 2. Time-based Partitioning

Within each class partition, we'll further partition by academic term:

```sql
-- Create child table for a specific class and term
CREATE TABLE activity_grades_class_123_term_2023_fall (
  CHECK (
    activity_id IN (SELECT id FROM activities WHERE class_id = '123') AND
    created_at BETWEEN '2023-08-01' AND '2023-12-31'
  )
) INHERITS (activity_grades);

-- Create indexes on the child table
CREATE INDEX idx_activity_grades_class_123_term_2023_fall_activity_id ON activity_grades_class_123_term_2023_fall(activity_id);
CREATE INDEX idx_activity_grades_class_123_term_2023_fall_student_id ON activity_grades_class_123_term_2023_fall(student_id);
CREATE UNIQUE INDEX idx_activity_grades_class_123_term_2023_fall_activity_student ON activity_grades_class_123_term_2023_fall(activity_id, student_id);
```

### 3. Routing Queries to Partitions

We'll use a trigger function to route inserts to the appropriate partition:

```sql
CREATE OR REPLACE FUNCTION activity_grade_insert_trigger()
RETURNS TRIGGER AS $$
DECLARE
  class_id TEXT;
  term_id TEXT;
  partition_name TEXT;
BEGIN
  -- Get class_id from activity
  SELECT class_id INTO class_id FROM activities WHERE id = NEW.activity_id;
  
  -- Get term_id based on current date
  SELECT id INTO term_id FROM terms 
  WHERE start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE
  LIMIT 1;
  
  -- Construct partition name
  partition_name := 'activity_grades_class_' || class_id || '_term_' || term_id;
  
  -- Insert into the appropriate partition
  EXECUTE 'INSERT INTO ' || partition_name || ' VALUES ($1.*)' USING NEW;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER insert_activity_grade_trigger
  BEFORE INSERT ON activity_grades
  FOR EACH ROW EXECUTE FUNCTION activity_grade_insert_trigger();
```

### 4. Archiving Strategy

For data older than the current academic year:

1. Move data to archive tables
2. Compress archived data
3. Implement a data retention policy

```sql
-- Create archive table
CREATE TABLE archived_activity_grades (
  id TEXT PRIMARY KEY,
  activity_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  score DOUBLE PRECISION,
  points INTEGER,
  status TEXT NOT NULL,
  submitted_at TIMESTAMP(3) NOT NULL,
  graded_at TIMESTAMP(3),
  content JSONB,
  archived_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  academic_year TEXT,
  term_id TEXT
);

-- Archive function
CREATE OR REPLACE FUNCTION archive_activity_grades(p_term_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  -- Insert into archive table
  INSERT INTO archived_activity_grades (
    id, activity_id, student_id, score, points, status, 
    submitted_at, graded_at, content, academic_year, term_id
  )
  SELECT 
    ag.id, ag.activity_id, ag.student_id, ag.score, ag.points, ag.status,
    ag.submitted_at, ag.graded_at, ag.content, t.academic_year, t.id
  FROM activity_grades ag
  JOIN activities a ON ag.activity_id = a.id
  JOIN terms t ON t.id = p_term_id
  WHERE t.id = p_term_id;
  
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  
  -- Delete from original tables
  EXECUTE 'DROP TABLE IF EXISTS activity_grades_term_' || p_term_id;
  
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql;
```

## Implementation Plan

1. Create a migration script to set up the partitioning structure
2. Update the ActivityGradeService to work with partitioned tables
3. Implement a background job for archiving old data
4. Add monitoring for partition sizes and query performance

## Performance Considerations

- Each partition will be smaller and more manageable
- Queries that filter by class and date range will be much faster
- Indexes will be smaller and more efficient
- Maintenance operations can be performed on individual partitions

## Scaling Strategy

As the system grows:

1. Add more granular partitioning (e.g., by month instead of term)
2. Implement read replicas for reporting queries
3. Consider sharding across multiple database servers for very large deployments
