import { PrismaClient } from '@prisma/client';

export async function seedAttendance(
  prisma: PrismaClient,
  classes: any[],
  students: any[]
) {
  console.log('Seeding attendance data...');

  // Find classes
  const boysClass3A = classes.find(c => c.code === 'SIS-BOYS-CL3A');
  const girlsClass3A = classes.find(c => c.code === 'SIS-GIRLS-CL3A');

  if (!boysClass3A || !girlsClass3A) {
    console.warn('Classes not found. Skipping attendance seeding.');
    return;
  }

  // Get students for each class
  const boysClass3AStudents = students.filter(s => s.classId === boysClass3A.id);
  const girlsClass3AStudents = students.filter(s => s.classId === girlsClass3A.id);

  // Seed attendance for one week (September 1-5, 2024)
  const startDate = new Date('2024-09-01');

  // ===== BOYS CLASS ATTENDANCE =====
  await seedClassAttendance(
    prisma,
    boysClass3A.id,
    boysClass3AStudents,
    startDate,
    [
      // Monday (Sept 1) - 1 student absent
      {
        date: new Date('2024-09-01'),
        absentStudentIndices: [9], // Nicholas Garcia
        lateStudentIndices: [],
        excusedStudentIndices: []
      },
      // Tuesday (Sept 2) - All present
      {
        date: new Date('2024-09-02'),
        absentStudentIndices: [],
        lateStudentIndices: [],
        excusedStudentIndices: []
      },
      // Wednesday (Sept 3) - 2 students absent
      {
        date: new Date('2024-09-03'),
        absentStudentIndices: [2, 5], // Thomas Brown, Andrew Taylor
        lateStudentIndices: [],
        excusedStudentIndices: []
      },
      // Thursday (Sept 4) - 1 student absent
      {
        date: new Date('2024-09-04'),
        absentStudentIndices: [7], // Joseph Martinez
        lateStudentIndices: [],
        excusedStudentIndices: []
      },
      // Friday (Sept 5) - All present
      {
        date: new Date('2024-09-05'),
        absentStudentIndices: [],
        lateStudentIndices: [],
        excusedStudentIndices: []
      }
    ]
  );

  // ===== GIRLS CLASS ATTENDANCE =====
  await seedClassAttendance(
    prisma,
    girlsClass3A.id,
    girlsClass3AStudents,
    startDate,
    [
      // Monday (Sept 1) - All present
      {
        date: new Date('2024-09-01'),
        absentStudentIndices: [],
        lateStudentIndices: [],
        excusedStudentIndices: []
      },
      // Tuesday (Sept 2) - 1 student absent
      {
        date: new Date('2024-09-02'),
        absentStudentIndices: [7], // Harper Martinez
        lateStudentIndices: [],
        excusedStudentIndices: []
      },
      // Wednesday (Sept 3) - All present
      {
        date: new Date('2024-09-03'),
        absentStudentIndices: [],
        lateStudentIndices: [],
        excusedStudentIndices: []
      },
      // Thursday (Sept 4) - 2 students absent
      {
        date: new Date('2024-09-04'),
        absentStudentIndices: [0, 9], // Emma Smith, Abigail Garcia
        lateStudentIndices: [],
        excusedStudentIndices: []
      },
      // Friday (Sept 5) - 1 student absent
      {
        date: new Date('2024-09-05'),
        absentStudentIndices: [2], // Sophia Brown
        lateStudentIndices: [],
        excusedStudentIndices: []
      }
    ]
  );

  console.log('Attendance data seeding completed');
}

interface DayAttendance {
  date: Date;
  absentStudentIndices: number[];
  lateStudentIndices: number[];
  excusedStudentIndices: number[];
}

async function seedClassAttendance(
  prisma: PrismaClient,
  classId: string,
  students: any[],
  // startDate parameter not used but kept for interface consistency
  _startDate: Date,
  daysAttendance: DayAttendance[]
) {
  for (const dayAttendance of daysAttendance) {
    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      let status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'LEAVE' = 'PRESENT';
      let remarks = '';

      if (dayAttendance.absentStudentIndices.includes(i)) {
        status = 'ABSENT';
        remarks = 'Absent without notice';
      } else if (dayAttendance.lateStudentIndices.includes(i)) {
        status = 'LATE';
        remarks = 'Arrived 15 minutes late';
      } else if (dayAttendance.excusedStudentIndices.includes(i)) {
        status = 'EXCUSED';
        remarks = 'Excused absence - doctor appointment';
      }

      await prisma.attendance.upsert({
        where: {
          studentId_classId_date: {
            studentId: student.id,
            classId: classId,
            date: dayAttendance.date
          }
        },
        update: {
          status,
          remarks
        },
        create: {
          studentId: student.id,
          classId: classId,
          date: dayAttendance.date,
          status,
          remarks
        }
      });
    }
  }
}
