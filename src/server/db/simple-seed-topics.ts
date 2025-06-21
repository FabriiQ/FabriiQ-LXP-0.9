import { PrismaClient, SystemStatus } from '@prisma/client';
import { SubjectNodeType, CompetencyLevel } from '../api/constants';

const prisma = new PrismaClient();

/**
 * Simple function to seed basic subject topics without learning outcomes
 */
async function seedSimpleTopics() {
  console.log("Starting simple subject topics seeding...");

  try {
    // Fetch all subjects from the database
    console.log("Fetching subjects from database...");
    const subjects = await prisma.subject.findMany({
      where: {
        code: {
          in: ['PYP-CL3-MATH', 'PYP-CL3-ENG', 'PYP-CL3-SCI', 'PYP-CL3-PE']
        }
      }
    });

    if (subjects.length === 0) {
      console.error("No subjects found in the database. Cannot seed subject topics.");
      return;
    }

    console.log(`Found ${subjects.length} subjects in the database.`);
    
    // Find subjects by code
    const mathSubject = subjects.find(s => s.code === 'PYP-CL3-MATH');
    const englishSubject = subjects.find(s => s.code === 'PYP-CL3-ENG');
    const scienceSubject = subjects.find(s => s.code === 'PYP-CL3-SCI');
    const peSubject = subjects.find(s => s.code === 'PYP-CL3-PE');

    if (!mathSubject || !englishSubject || !scienceSubject || !peSubject) {
      console.warn('One or more subjects not found. Continuing with available subjects...');
    }

    // Seed Mathematics topics
    if (mathSubject) {
      await seedMathTopics(mathSubject.id);
    }

    // Seed English topics
    if (englishSubject) {
      await seedEnglishTopics(englishSubject.id);
    }

    // Seed Science topics
    if (scienceSubject) {
      await seedScienceTopics(scienceSubject.id);
    }

    // Seed PE topics
    if (peSubject) {
      await seedPETopics(peSubject.id);
    }
    
    console.log("Simple subject topics seeding completed successfully!");
  } catch (error) {
    console.error("Error during subject topics seeding:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function seedMathTopics(subjectId: string) {
  console.log('Seeding Mathematics topics...');

  // Chapter: Whole Numbers
  const wholeNumbersChapter = await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-MATH-CH-WN'
      }
    },
    update: {
      title: 'Whole Numbers',
      description: 'Understanding whole numbers, their properties, and operations',
      nodeType: SubjectNodeType.CHAPTER,
      orderIndex: 0,
      estimatedMinutes: 900,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['whole numbers', 'roman numerals', 'even', 'odd', 'place value', 'number line', 'comparison', 'ordering'],
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-MATH-CH-WN',
      title: 'Whole Numbers',
      description: 'Understanding whole numbers, their properties, and operations',
      nodeType: SubjectNodeType.CHAPTER,
      orderIndex: 0,
      estimatedMinutes: 900,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['whole numbers', 'roman numerals', 'even', 'odd', 'place value', 'number line', 'comparison', 'ordering'],
      subjectId: subjectId,
      status: SystemStatus.ACTIVE,
    },
  });

  // Unit 1: Roman Numbers
  const romanNumbersUnit = await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-MATH-CH-WN-U1'
      }
    },
    update: {
      title: 'Roman Numbers',
      description: 'Learning to read and write Roman numerals',
      nodeType: SubjectNodeType.TOPIC,
      orderIndex: 0,
      estimatedMinutes: 180,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['Roman numerals', 'symbols', 'I', 'V', 'X'],
      parentTopicId: wholeNumbersChapter.id,
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-MATH-CH-WN-U1',
      title: 'Roman Numbers',
      description: 'Learning to read and write Roman numerals',
      nodeType: SubjectNodeType.TOPIC,
      orderIndex: 0,
      estimatedMinutes: 180,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['Roman numerals', 'symbols', 'I', 'V', 'X'],
      subjectId: subjectId,
      parentTopicId: wholeNumbersChapter.id,
      status: SystemStatus.ACTIVE,
    },
  });

  // Topic 1.1: Reading Roman Numbers up to 20
  await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-MATH-CH-WN-U1-T1'
      }
    },
    update: {
      title: 'Reading Roman Numbers up to 20',
      description: 'Students will be introduced to the Roman numeral system and learn to read and interpret Roman numbers from I to XX.',
      context: 'This foundation builds an understanding of historical numeral systems, supporting cognitive association between number representations.',
      nodeType: SubjectNodeType.SUBTOPIC,
      orderIndex: 0,
      estimatedMinutes: 90,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['Roman numerals', 'I', 'V', 'X', 'counting', 'symbols', 'number recognition'],
      parentTopicId: romanNumbersUnit.id,
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-MATH-CH-WN-U1-T1',
      title: 'Reading Roman Numbers up to 20',
      description: 'Students will be introduced to the Roman numeral system and learn to read and interpret Roman numbers from I to XX.',
      context: 'This foundation builds an understanding of historical numeral systems, supporting cognitive association between number representations.',
      nodeType: SubjectNodeType.SUBTOPIC,
      orderIndex: 0,
      estimatedMinutes: 90,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['Roman numerals', 'I', 'V', 'X', 'counting', 'symbols', 'number recognition'],
      subjectId: subjectId,
      parentTopicId: romanNumbersUnit.id,
      status: SystemStatus.ACTIVE,
    },
  });

  console.log('Mathematics topics seeded successfully');
}

async function seedEnglishTopics(subjectId: string) {
  console.log('Seeding English topics...');

  // Chapter: Reading Comprehension
  const readingChapter = await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-ENG-CH-RC'
      }
    },
    update: {
      title: 'Reading Comprehension',
      description: 'Developing reading skills and comprehension abilities',
      nodeType: SubjectNodeType.CHAPTER,
      orderIndex: 0,
      estimatedMinutes: 600,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['reading', 'comprehension', 'vocabulary', 'fluency'],
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-ENG-CH-RC',
      title: 'Reading Comprehension',
      description: 'Developing reading skills and comprehension abilities',
      nodeType: SubjectNodeType.CHAPTER,
      orderIndex: 0,
      estimatedMinutes: 600,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['reading', 'comprehension', 'vocabulary', 'fluency'],
      subjectId: subjectId,
      status: SystemStatus.ACTIVE,
    },
  });

  console.log('English topics seeded successfully');
}

async function seedScienceTopics(subjectId: string) {
  console.log('Seeding Science topics...');

  // Chapter: Plants and Animals
  const plantsAnimalsChapter = await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-SCI-CH-PA'
      }
    },
    update: {
      title: 'Plants and Animals',
      description: 'Understanding living organisms and their characteristics',
      nodeType: SubjectNodeType.CHAPTER,
      orderIndex: 0,
      estimatedMinutes: 720,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['plants', 'animals', 'life cycles', 'habitats', 'classification'],
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-SCI-CH-PA',
      title: 'Plants and Animals',
      description: 'Understanding living organisms and their characteristics',
      nodeType: SubjectNodeType.CHAPTER,
      orderIndex: 0,
      estimatedMinutes: 720,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['plants', 'animals', 'life cycles', 'habitats', 'classification'],
      subjectId: subjectId,
      status: SystemStatus.ACTIVE,
    },
  });

  console.log('Science topics seeded successfully');
}

async function seedPETopics(subjectId: string) {
  console.log('Seeding Physical Education topics...');

  // Chapter: Basic Movement Skills
  const movementChapter = await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-PE-CH-BMS'
      }
    },
    update: {
      title: 'Basic Movement Skills',
      description: 'Developing fundamental movement and coordination skills',
      nodeType: SubjectNodeType.CHAPTER,
      orderIndex: 0,
      estimatedMinutes: 480,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['movement', 'coordination', 'balance', 'agility', 'teamwork'],
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-PE-CH-BMS',
      title: 'Basic Movement Skills',
      description: 'Developing fundamental movement and coordination skills',
      nodeType: SubjectNodeType.CHAPTER,
      orderIndex: 0,
      estimatedMinutes: 480,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['movement', 'coordination', 'balance', 'agility', 'teamwork'],
      subjectId: subjectId,
      status: SystemStatus.ACTIVE,
    },
  });

  console.log('Physical Education topics seeded successfully');
}

// Run the seed function
seedSimpleTopics()
  .catch((e) => {
    console.error("Error during simple topics seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
