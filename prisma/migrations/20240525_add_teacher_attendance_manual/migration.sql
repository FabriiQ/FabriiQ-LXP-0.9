-- Create TeacherAttendance table
CREATE TABLE IF NOT EXISTS "teacher_attendance" (
  "id" TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "campusId" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL,
  "checkInTime" TIMESTAMP(3),
  "checkOutTime" TIMESTAMP(3),
  "remarks" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "teacher_attendance_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS "teacher_attendance_teacherId_date_key" ON "teacher_attendance"("teacherId", "date");

-- Create indexes
CREATE INDEX IF NOT EXISTS "teacher_attendance_date_status_idx" ON "teacher_attendance"("date", "status");
CREATE INDEX IF NOT EXISTS "teacher_attendance_teacherId_status_idx" ON "teacher_attendance"("teacherId", "status");
CREATE INDEX IF NOT EXISTS "teacher_attendance_campusId_date_idx" ON "teacher_attendance"("campusId", "date");

-- Add foreign key constraints
ALTER TABLE "teacher_attendance" ADD CONSTRAINT "teacher_attendance_teacherId_fkey"
FOREIGN KEY ("teacherId") REFERENCES "teacher_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "teacher_attendance" ADD CONSTRAINT "teacher_attendance_campusId_fkey"
FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
