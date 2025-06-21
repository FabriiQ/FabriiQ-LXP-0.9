import { PrismaClient } from '@prisma/client';
import { seedSubjects } from '../src/server/db/seed-data/subjects';
import { seedSubjectTopics } from '../src/server/db/seed-data/subject-topics';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking Class 3 and seeding subjects/topics...');

  try {
    // Step 1: Find Class 3
    const class3 = await prisma.class.findFirst({
      where: {
        OR: [
          { name: { contains: 'Class 3' } },
          { name: { contains: 'Grade 3' } },
          { code: { contains: '3' } },
          { id: '3' }
        ]
      },
      include: {
        course: true,
        campus: true,
        _count: {
          select: {
            students: true,
            activities: true,
            assessments: true
          }
        }
      }
    });

    if (!class3) {
      console.log('❌ Class 3 not found. Let me check all classes...');
      const allClasses = await prisma.class.findMany({
        select: {
          id: true,
          name: true,
          code: true,
          course: {
            select: {
              name: true,
              code: true
            }
          }
        }
      });
      
      console.log('📋 Available classes:');
      allClasses.forEach((cls, index) => {
        console.log(`${index + 1}. ID: ${cls.id}, Name: ${cls.name}, Code: ${cls.code}, Course: ${cls.course?.name}`);
      });
      
      return;
    }

    console.log(`✅ Found Class 3:`);
    console.log(`   - ID: ${class3.id}`);
    console.log(`   - Name: ${class3.name}`);
    console.log(`   - Code: ${class3.code}`);
    console.log(`   - Course: ${class3.course?.name} (${class3.course?.code})`);
    console.log(`   - Campus: ${class3.campus?.name}`);
    console.log(`   - Students: ${class3._count.students}`);
    console.log(`   - Activities: ${class3._count.activities}`);
    console.log(`   - Assessments: ${class3._count.assessments}`);

    // Step 2: Check if course exists for Class 3
    if (!class3.course) {
      console.log('❌ No course associated with Class 3');
      return;
    }

    // Step 3: Check existing subjects for this course
    const existingSubjects = await prisma.subject.findMany({
      where: {
        courseId: class3.course.id
      },
      include: {
        topics: {
          select: {
            id: true,
            title: true,
            nodeType: true
          }
        }
      }
    });

    console.log(`\n📚 Current subjects for course ${class3.course.code}:`);
    if (existingSubjects.length === 0) {
      console.log('   No subjects found. Will seed subjects...');
    } else {
      existingSubjects.forEach((subject, index) => {
        console.log(`${index + 1}. ${subject.name} (${subject.code}) - ${subject.topics.length} topics`);
      });
    }

    // Step 4: Seed subjects if none exist
    if (existingSubjects.length === 0) {
      console.log('\n🌱 Seeding subjects...');
      
      // Get the course for seeding
      const courses = [class3.course];
      const seededSubjects = await seedSubjects(prisma, courses);
      
      console.log(`✅ Seeded ${seededSubjects.length} subjects`);
      
      // Step 5: Seed subject topics
      console.log('\n🌱 Seeding subject topics...');
      await seedSubjectTopics(prisma, seededSubjects);
      console.log('✅ Subject topics seeded successfully');
      
      // Step 6: Verify seeding
      const newSubjects = await prisma.subject.findMany({
        where: {
          courseId: class3.course.id
        },
        include: {
          topics: {
            select: {
              id: true,
              title: true,
              nodeType: true
            }
          }
        }
      });
      
      console.log(`\n✅ Final verification - ${newSubjects.length} subjects with topics:`);
      newSubjects.forEach((subject, index) => {
        console.log(`${index + 1}. ${subject.name} (${subject.code}) - ${subject.topics.length} topics`);
      });
    } else {
      console.log('\n✅ Subjects already exist. Checking if topics need to be seeded...');
      
      const subjectsWithoutTopics = existingSubjects.filter(s => s.topics.length === 0);
      
      if (subjectsWithoutTopics.length > 0) {
        console.log(`🌱 Seeding topics for ${subjectsWithoutTopics.length} subjects without topics...`);
        await seedSubjectTopics(prisma, existingSubjects);
        console.log('✅ Subject topics seeded successfully');
      } else {
        console.log('✅ All subjects already have topics');
      }
    }

    console.log('\n🎉 Class 3 subjects and topics setup completed!');

  } catch (error) {
    console.error('❌ Error:', error);
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
