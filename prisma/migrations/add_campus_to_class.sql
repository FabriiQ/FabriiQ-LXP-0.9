-- Add campusId column to classes table
ALTER TABLE classes ADD COLUMN "campusId" TEXT;

-- Update existing classes with campusId from course_campus
UPDATE classes c
SET "campusId" = cc."campusId"
FROM course_campus cc
WHERE c."courseCampusId" = cc.id;

-- Make campusId column required
ALTER TABLE classes ALTER COLUMN "campusId" SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE classes ADD CONSTRAINT "classes_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES campuses(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add index on campusId
CREATE INDEX "classes_campusId_idx" ON classes("campusId"); 