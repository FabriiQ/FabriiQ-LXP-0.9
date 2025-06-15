import { PrismaClient, SystemStatus } from '@prisma/client';
import { SubjectNodeType, CompetencyLevel } from '../../api/constants';

export async function seedSubjectTopics(prisma: PrismaClient, subjects: any[]) {
  console.log('Seeding subject topics...');

  // Find subjects by code
  const mathSubject = subjects.find(s => s.code === 'PYP-CL3-MATH');
  const englishSubject = subjects.find(s => s.code === 'PYP-CL3-ENG');
  const scienceSubject = subjects.find(s => s.code === 'PYP-CL3-SCI');
  const peSubject = subjects.find(s => s.code === 'PYP-CL3-PE');

  if (!mathSubject || !englishSubject || !scienceSubject || !peSubject) {
    console.warn('One or more subjects not found. Skipping subject topics seeding.');
    return;
  }

  // ===== MATHEMATICS TOPICS =====
  await seedMathTopics(prisma, mathSubject.id);

  // ===== ENGLISH TOPICS =====
  await seedEnglishTopics(prisma, englishSubject.id);

  // ===== SCIENCE TOPICS =====
  await seedScienceTopics(prisma, scienceSubject.id);

  // ===== PHYSICAL EDUCATION TOPICS =====
  await seedPETopics(prisma, peSubject.id);

  console.log('Subject topics seeding completed');
}

async function seedMathTopics(prisma: PrismaClient, subjectId: string) {
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
      learningOutcomes: 'By the end of this topic, students will be able to:\n- Identify and read Roman numerals up to 20.\n- Recognize the symbols: I, V, and X and how they form numbers.',
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
      learningOutcomes: 'By the end of this topic, students will be able to:\n- Identify and read Roman numerals up to 20.\n- Recognize the symbols: I, V, and X and how they form numbers.',
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

  // Topic 1.2: Writing Roman Numbers up to 20
  await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-MATH-CH-WN-U1-T2'
      }
    },
    update: {
      title: 'Writing Roman Numbers up to 20',
      description: 'Learners will practice writing Roman numerals from 1 to 20 using appropriate rules.',
      context: 'This promotes understanding of number construction and reinforces pattern recognition.',
      learningOutcomes: 'By the end of this topic, students will be able to:\n- Write Roman numerals from 1 to 20 accurately.\n- Apply additive and subtractive rules of Roman numerals.',
      nodeType: SubjectNodeType.SUBTOPIC,
      orderIndex: 1,
      estimatedMinutes: 90,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['Roman numerals', 'write', 'pattern', 'symbols', 'addition', 'subtraction'],
      parentTopicId: romanNumbersUnit.id,
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-MATH-CH-WN-U1-T2',
      title: 'Writing Roman Numbers up to 20',
      description: 'Learners will practice writing Roman numerals from 1 to 20 using appropriate rules.',
      context: 'This promotes understanding of number construction and reinforces pattern recognition.',
      learningOutcomes: 'By the end of this topic, students will be able to:\n- Write Roman numerals from 1 to 20 accurately.\n- Apply additive and subtractive rules of Roman numerals.',
      nodeType: SubjectNodeType.SUBTOPIC,
      orderIndex: 1,
      estimatedMinutes: 90,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['Roman numerals', 'write', 'pattern', 'symbols', 'addition', 'subtraction'],
      subjectId: subjectId,
      parentTopicId: romanNumbersUnit.id,
      status: SystemStatus.ACTIVE,
    },
  });

  // Unit 2: Even and Odd Numbers
  const evenOddUnit = await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-MATH-CH-WN-U2'
      }
    },
    update: {
      title: 'Even and Odd Numbers',
      description: 'Understanding and identifying even and odd numbers',
      nodeType: SubjectNodeType.TOPIC,
      orderIndex: 1,
      estimatedMinutes: 180,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['even', 'odd', 'numbers', 'patterns'],
      parentTopicId: wholeNumbersChapter.id,
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-MATH-CH-WN-U2',
      title: 'Even and Odd Numbers',
      description: 'Understanding and identifying even and odd numbers',
      nodeType: SubjectNodeType.TOPIC,
      orderIndex: 1,
      estimatedMinutes: 180,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['even', 'odd', 'numbers', 'patterns'],
      subjectId: subjectId,
      parentTopicId: wholeNumbersChapter.id,
      status: SystemStatus.ACTIVE,
    },
  });

  // Topic 2.1: Recognizing Even and Odd Numbers up to 99 in a Sequence
  await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-MATH-CH-WN-U2-T1'
      }
    },
    update: {
      title: 'Recognizing Even and Odd Numbers up to 99 in a Sequence',
      description: 'Students will learn to differentiate between even and odd numbers within a sequence.',
      context: 'This supports number sense and prepares learners for division, grouping, and pattern tasks.',
      learningOutcomes: 'By the end of this topic, students will be able to:\n- Identify even and odd numbers within a given number sequence.\n- Understand the characteristic traits of even and odd numbers.',
      nodeType: SubjectNodeType.SUBTOPIC,
      orderIndex: 0,
      estimatedMinutes: 90,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['Even', 'odd', 'number sequence', 'counting', 'pairs', 'patterns'],
      parentTopicId: evenOddUnit.id,
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-MATH-CH-WN-U2-T1',
      title: 'Recognizing Even and Odd Numbers up to 99 in a Sequence',
      description: 'Students will learn to differentiate between even and odd numbers within a sequence.',
      context: 'This supports number sense and prepares learners for division, grouping, and pattern tasks.',
      learningOutcomes: 'By the end of this topic, students will be able to:\n- Identify even and odd numbers within a given number sequence.\n- Understand the characteristic traits of even and odd numbers.',
      nodeType: SubjectNodeType.SUBTOPIC,
      orderIndex: 0,
      estimatedMinutes: 90,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['Even', 'odd', 'number sequence', 'counting', 'pairs', 'patterns'],
      subjectId: subjectId,
      parentTopicId: evenOddUnit.id,
      status: SystemStatus.ACTIVE,
    },
  });

  // Topic 2.2: Differentiating Even and Odd Numbers Within a Given Sequence
  await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-MATH-CH-WN-U2-T2'
      }
    },
    update: {
      title: 'Differentiating Even and Odd Numbers Within a Given Sequence',
      description: 'Learners will engage in sorting and classifying tasks based on the parity of numbers.',
      context: 'Focuses on critical thinking and number categorization.',
      learningOutcomes: 'By the end of this topic, students will be able to:\n- Sort numbers into even and odd categories.\n- Use logic to predict the next even or odd number in a sequence.',
      nodeType: SubjectNodeType.SUBTOPIC,
      orderIndex: 1,
      estimatedMinutes: 90,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['Even numbers', 'odd numbers', 'sort', 'categorize', 'sequence'],
      parentTopicId: evenOddUnit.id,
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-MATH-CH-WN-U2-T2',
      title: 'Differentiating Even and Odd Numbers Within a Given Sequence',
      description: 'Learners will engage in sorting and classifying tasks based on the parity of numbers.',
      context: 'Focuses on critical thinking and number categorization.',
      learningOutcomes: 'By the end of this topic, students will be able to:\n- Sort numbers into even and odd categories.\n- Use logic to predict the next even or odd number in a sequence.',
      nodeType: SubjectNodeType.SUBTOPIC,
      orderIndex: 1,
      estimatedMinutes: 90,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['Even numbers', 'odd numbers', 'sort', 'categorize', 'sequence'],
      subjectId: subjectId,
      parentTopicId: evenOddUnit.id,
      status: SystemStatus.ACTIVE,
    },
  });

  // Unit 3: Place Value and Number Forms
  const placeValueUnit = await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-MATH-CH-WN-U3'
      }
    },
    update: {
      title: 'Place Value and Number Forms',
      description: 'Understanding place value and different forms of representing numbers',
      nodeType: SubjectNodeType.TOPIC,
      orderIndex: 2,
      estimatedMinutes: 180,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['place value', 'digits', 'number forms', 'expanded form'],
      parentTopicId: wholeNumbersChapter.id,
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-MATH-CH-WN-U3',
      title: 'Place Value and Number Forms',
      description: 'Understanding place value and different forms of representing numbers',
      nodeType: SubjectNodeType.TOPIC,
      orderIndex: 2,
      estimatedMinutes: 180,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['place value', 'digits', 'number forms', 'expanded form'],
      subjectId: subjectId,
      parentTopicId: wholeNumbersChapter.id,
      status: SystemStatus.ACTIVE,
    },
  });

  // Topic 3.1: Place Value of Digits in Numbers up to 3-Digit
  await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-MATH-CH-WN-U3-T1'
      }
    },
    update: {
      title: 'Place Value of Digits in Numbers up to 3-Digit',
      description: 'An introduction to hundreds, tens, and units. Learners understand the value of each digit based on its position.',
      context: 'Core mathematical skill needed for all future number operations.',
      learningOutcomes: 'By the end of this topic, students will be able to:\n- Identify place value of digits in 2- and 3-digit numbers.\n- Represent place value using expanded form.',
      nodeType: SubjectNodeType.SUBTOPIC,
      orderIndex: 0,
      estimatedMinutes: 90,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['Place value', 'digits', 'units', 'tens', 'hundreds', 'expanded form'],
      parentTopicId: placeValueUnit.id,
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-MATH-CH-WN-U3-T1',
      title: 'Place Value of Digits in Numbers up to 3-Digit',
      description: 'An introduction to hundreds, tens, and units. Learners understand the value of each digit based on its position.',
      context: 'Core mathematical skill needed for all future number operations.',
      learningOutcomes: 'By the end of this topic, students will be able to:\n- Identify place value of digits in 2- and 3-digit numbers.\n- Represent place value using expanded form.',
      nodeType: SubjectNodeType.SUBTOPIC,
      orderIndex: 0,
      estimatedMinutes: 90,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['Place value', 'digits', 'units', 'tens', 'hundreds', 'expanded form'],
      subjectId: subjectId,
      parentTopicId: placeValueUnit.id,
      status: SystemStatus.ACTIVE,
    },
  });

  // Topic 3.2: Reading and Writing Numbers up to 100 in Numerals and Words
  await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-MATH-CH-WN-U3-T2'
      }
    },
    update: {
      title: 'Reading and Writing Numbers up to 100 in Numerals and Words',
      description: 'Students learn to connect numerical digits with their word representations.',
      context: 'Enhances reading comprehension and numerical literacy.',
      learningOutcomes: 'By the end of this topic, students will be able to:\n- Read numbers up to 100 in numeral and word form.\n- Write numbers in words correctly.',
      nodeType: SubjectNodeType.SUBTOPIC,
      orderIndex: 1,
      estimatedMinutes: 90,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['Numerals', 'words', 'spell numbers', 'reading', 'writing'],
      parentTopicId: placeValueUnit.id,
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-MATH-CH-WN-U3-T2',
      title: 'Reading and Writing Numbers up to 100 in Numerals and Words',
      description: 'Students learn to connect numerical digits with their word representations.',
      context: 'Enhances reading comprehension and numerical literacy.',
      learningOutcomes: 'By the end of this topic, students will be able to:\n- Read numbers up to 100 in numeral and word form.\n- Write numbers in words correctly.',
      nodeType: SubjectNodeType.SUBTOPIC,
      orderIndex: 1,
      estimatedMinutes: 90,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['Numerals', 'words', 'spell numbers', 'reading', 'writing'],
      subjectId: subjectId,
      parentTopicId: placeValueUnit.id,
      status: SystemStatus.ACTIVE,
    },
  });

  // Unit 4: Number Lines and Comparisons
  const numberLinesUnit = await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-MATH-CH-WN-U4'
      }
    },
    update: {
      title: 'Number Lines and Comparisons',
      description: 'Using number lines to represent and compare numbers',
      nodeType: SubjectNodeType.TOPIC,
      orderIndex: 3,
      estimatedMinutes: 270,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['number line', 'comparison', 'greater than', 'less than', 'equal to'],
      parentTopicId: wholeNumbersChapter.id,
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-MATH-CH-WN-U4',
      title: 'Number Lines and Comparisons',
      description: 'Using number lines to represent and compare numbers',
      nodeType: SubjectNodeType.TOPIC,
      orderIndex: 3,
      estimatedMinutes: 270,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['number line', 'comparison', 'greater than', 'less than', 'equal to'],
      subjectId: subjectId,
      parentTopicId: wholeNumbersChapter.id,
      status: SystemStatus.ACTIVE,
    },
  });

  // Topic 4.1: Representing Numbers on a Number Line (Up to 2-digit)
  await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-MATH-CH-WN-U4-T1'
      }
    },
    update: {
      title: 'Representing Numbers on a Number Line (Up to 2-digit)',
      description: 'Students will use number lines to visualize positions and intervals up to 99.',
      context: 'Supports estimation, ordering, and number comparison.',
      learningOutcomes: 'By the end of this topic, students will be able to:\n- Identify and mark numbers on a number line.\n- Understand intervals and spacing on number lines.',
      nodeType: SubjectNodeType.SUBTOPIC,
      orderIndex: 0,
      estimatedMinutes: 90,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['Number line', 'position', 'intervals', 'estimate', 'visualize'],
      parentTopicId: numberLinesUnit.id,
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-MATH-CH-WN-U4-T1',
      title: 'Representing Numbers on a Number Line (Up to 2-digit)',
      description: 'Students will use number lines to visualize positions and intervals up to 99.',
      context: 'Supports estimation, ordering, and number comparison.',
      learningOutcomes: 'By the end of this topic, students will be able to:\n- Identify and mark numbers on a number line.\n- Understand intervals and spacing on number lines.',
      nodeType: SubjectNodeType.SUBTOPIC,
      orderIndex: 0,
      estimatedMinutes: 90,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['Number line', 'position', 'intervals', 'estimate', 'visualize'],
      subjectId: subjectId,
      parentTopicId: numberLinesUnit.id,
      status: SystemStatus.ACTIVE,
    },
  });

  // Topic 4.2: Comparing Numbers Using Number Lines (Up to 2-digit)
  await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-MATH-CH-WN-U4-T2'
      }
    },
    update: {
      title: 'Comparing Numbers Using Number Lines (Up to 2-digit)',
      description: 'Learners will explore how to compare two numbers by referencing their location on a number line.',
      context: 'Facilitates understanding of size and order.',
      learningOutcomes: 'By the end of this topic, students will be able to:\n- Use number lines to compare values.\n- Make comparative statements using <, >, =.',
      nodeType: SubjectNodeType.SUBTOPIC,
      orderIndex: 1,
      estimatedMinutes: 90,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['Compare', 'greater', 'smaller', 'number line', 'symbols'],
      parentTopicId: numberLinesUnit.id,
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-MATH-CH-WN-U4-T2',
      title: 'Comparing Numbers Using Number Lines (Up to 2-digit)',
      description: 'Learners will explore how to compare two numbers by referencing their location on a number line.',
      context: 'Facilitates understanding of size and order.',
      learningOutcomes: 'By the end of this topic, students will be able to:\n- Use number lines to compare values.\n- Make comparative statements using <, >, =.',
      nodeType: SubjectNodeType.SUBTOPIC,
      orderIndex: 1,
      estimatedMinutes: 90,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['Compare', 'greater', 'smaller', 'number line', 'symbols'],
      subjectId: subjectId,
      parentTopicId: numberLinesUnit.id,
      status: SystemStatus.ACTIVE,
    },
  });

  // Topic 4.3: Comparing Numbers Using Symbols (<, >, =)
  await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-MATH-CH-WN-U4-T3'
      }
    },
    update: {
      title: 'Comparing Numbers Using Symbols (<, >, =)',
      description: 'Students will apply mathematical symbols to express comparisons.',
      context: 'Fundamental for arithmetic operations and reasoning.',
      learningOutcomes: 'By the end of this topic, students will be able to:\n- Accurately compare two or more numbers using appropriate symbols.\n- Interpret the meaning of comparison symbols.',
      nodeType: SubjectNodeType.SUBTOPIC,
      orderIndex: 2,
      estimatedMinutes: 90,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['Compare', 'greater than', 'less than', 'equal', 'symbols'],
      parentTopicId: numberLinesUnit.id,
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-MATH-CH-WN-U4-T3',
      title: 'Comparing Numbers Using Symbols (<, >, =)',
      description: 'Students will apply mathematical symbols to express comparisons.',
      context: 'Fundamental for arithmetic operations and reasoning.',
      learningOutcomes: 'By the end of this topic, students will be able to:\n- Accurately compare two or more numbers using appropriate symbols.\n- Interpret the meaning of comparison symbols.',
      nodeType: SubjectNodeType.SUBTOPIC,
      orderIndex: 2,
      estimatedMinutes: 90,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['Compare', 'greater than', 'less than', 'equal', 'symbols'],
      subjectId: subjectId,
      parentTopicId: numberLinesUnit.id,
      status: SystemStatus.ACTIVE,
    },
  });

  // Unit 5: Number Arrangement and Rounding
  const numberArrangementUnit = await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-MATH-CH-WN-U5'
      }
    },
    update: {
      title: 'Number Arrangement and Rounding',
      description: 'Arranging numbers in order and rounding to simplify calculations',
      nodeType: SubjectNodeType.TOPIC,
      orderIndex: 4,
      estimatedMinutes: 180,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['ascending', 'descending', 'order', 'rounding', 'estimation'],
      parentTopicId: wholeNumbersChapter.id,
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-MATH-CH-WN-U5',
      title: 'Number Arrangement and Rounding',
      description: 'Arranging numbers in order and rounding to simplify calculations',
      nodeType: SubjectNodeType.TOPIC,
      orderIndex: 4,
      estimatedMinutes: 180,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['ascending', 'descending', 'order', 'rounding', 'estimation'],
      subjectId: subjectId,
      parentTopicId: wholeNumbersChapter.id,
      status: SystemStatus.ACTIVE,
    },
  });

  // Topic 5.1: Arranging Numbers in Ascending and Descending Order (Up to 3-digit)
  await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-MATH-CH-WN-U5-T1'
      }
    },
    update: {
      title: 'Arranging Numbers in Ascending and Descending Order (Up to 3-digit)',
      description: 'Learners will organize numbers in increasing and decreasing order.',
      context: 'Aids in developing logical reasoning and pattern recognition.',
      learningOutcomes: 'By the end of this topic, students will be able to:\n- Order numbers correctly in ascending and descending sequences.\n- Identify highest and lowest numbers.',
      nodeType: SubjectNodeType.SUBTOPIC,
      orderIndex: 0,
      estimatedMinutes: 90,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['Ascending', 'descending', 'order', 'sequence', 'arrange'],
      parentTopicId: numberArrangementUnit.id,
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-MATH-CH-WN-U5-T1',
      title: 'Arranging Numbers in Ascending and Descending Order (Up to 3-digit)',
      description: 'Learners will organize numbers in increasing and decreasing order.',
      context: 'Aids in developing logical reasoning and pattern recognition.',
      learningOutcomes: 'By the end of this topic, students will be able to:\n- Order numbers correctly in ascending and descending sequences.\n- Identify highest and lowest numbers.',
      nodeType: SubjectNodeType.SUBTOPIC,
      orderIndex: 0,
      estimatedMinutes: 90,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['Ascending', 'descending', 'order', 'sequence', 'arrange'],
      subjectId: subjectId,
      parentTopicId: numberArrangementUnit.id,
      status: SystemStatus.ACTIVE,
    },
  });

  // Topic 5.2: Rounding Off Whole Numbers to Nearest 10 and 100
  await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-MATH-CH-WN-U5-T2'
      }
    },
    update: {
      title: 'Rounding Off Whole Numbers to Nearest 10 and 100',
      description: 'An introduction to approximation and rounding rules to simplify numbers.',
      context: 'Helps in estimation, mental math, and real-life application.',
      learningOutcomes: 'By the end of this topic, students will be able to:\n- Round numbers to the nearest 10 and 100.\n- Use rounding in estimation contexts.',
      nodeType: SubjectNodeType.SUBTOPIC,
      orderIndex: 1,
      estimatedMinutes: 90,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['Rounding', 'nearest ten', 'nearest hundred', 'estimation', 'simplify'],
      parentTopicId: numberArrangementUnit.id,
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-MATH-CH-WN-U5-T2',
      title: 'Rounding Off Whole Numbers to Nearest 10 and 100',
      description: 'An introduction to approximation and rounding rules to simplify numbers.',
      context: 'Helps in estimation, mental math, and real-life application.',
      learningOutcomes: 'By the end of this topic, students will be able to:\n- Round numbers to the nearest 10 and 100.\n- Use rounding in estimation contexts.',
      nodeType: SubjectNodeType.SUBTOPIC,
      orderIndex: 1,
      estimatedMinutes: 90,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['Rounding', 'nearest ten', 'nearest hundred', 'estimation', 'simplify'],
      subjectId: subjectId,
      parentTopicId: numberArrangementUnit.id,
      status: SystemStatus.ACTIVE,
    },
  });

  // Chapter 1: Numbers and Operations
  const numbersChapter = await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-MATH-CH1'
      }
    },
    update: {
      title: 'Numbers and Operations',
      description: 'Understanding numbers and basic mathematical operations',
      nodeType: SubjectNodeType.CHAPTER,
      orderIndex: 1,
      estimatedMinutes: 600,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['numbers', 'operations', 'arithmetic'],
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-MATH-CH1',
      title: 'Numbers and Operations',
      description: 'Understanding numbers and basic mathematical operations',
      nodeType: SubjectNodeType.CHAPTER,
      orderIndex: 1,
      estimatedMinutes: 600,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['numbers', 'operations', 'arithmetic'],
      subjectId: subjectId,
      status: SystemStatus.ACTIVE,
    },
  });

  // Topic 1.1: Addition and Subtraction
  const addSubtractTopic = await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-MATH-CH1-T1'
      }
    },
    update: {
      title: 'Addition and Subtraction',
      description: 'Working with addition and subtraction of multi-digit numbers',
      context: 'Addition and subtraction are fundamental arithmetic operations that form the basis for more advanced mathematical concepts. In Class 3, students build on their previous knowledge to work with larger numbers and develop mental math strategies.',
      learningOutcomes: 'By the end of this topic, students will be able to:\n1. Add three-digit numbers with and without regrouping\n2. Subtract three-digit numbers with and without borrowing\n3. Solve word problems involving addition and subtraction\n4. Use mental math strategies for quick calculations\n5. Estimate sums and differences',
      nodeType: SubjectNodeType.TOPIC,
      orderIndex: 0,
      estimatedMinutes: 300,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['addition', 'subtraction', 'arithmetic', 'regrouping', 'borrowing', 'mental math', 'word problems'],
      parentTopicId: numbersChapter.id,
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-MATH-CH1-T1',
      title: 'Addition and Subtraction',
      description: 'Working with addition and subtraction of multi-digit numbers',
      context: 'Addition and subtraction are fundamental arithmetic operations that form the basis for more advanced mathematical concepts. In Class 3, students build on their previous knowledge to work with larger numbers and develop mental math strategies.',
      learningOutcomes: 'By the end of this topic, students will be able to:\n1. Add three-digit numbers with and without regrouping\n2. Subtract three-digit numbers with and without borrowing\n3. Solve word problems involving addition and subtraction\n4. Use mental math strategies for quick calculations\n5. Estimate sums and differences',
      nodeType: SubjectNodeType.TOPIC,
      orderIndex: 0,
      estimatedMinutes: 300,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['addition', 'subtraction', 'arithmetic', 'regrouping', 'borrowing', 'mental math', 'word problems'],
      subjectId: subjectId,
      parentTopicId: numbersChapter.id,
      status: SystemStatus.ACTIVE,
    },
  });

  // Subtopic 1.1.1: Adding Three-Digit Numbers
  await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-MATH-CH1-T1-S1'
      }
    },
    update: {
      title: 'Adding Three-Digit Numbers',
      description: 'Techniques for adding three-digit numbers with carrying',
      context: 'Adding three-digit numbers builds on students\'s previous knowledge of place value and requires understanding of the regrouping (carrying) process. This skill is essential for everyday math applications and forms the foundation for addition with larger numbers.',
      learningOutcomes: 'By the end of this subtopic, students will be able to:\n1. Add three-digit numbers without regrouping\n2. Add three-digit numbers with regrouping in the ones place\n3. Add three-digit numbers with regrouping in both ones and tens places\n4. Use column addition method correctly\n5. Check addition by using the inverse operation (subtraction)',
      nodeType: SubjectNodeType.SUBTOPIC,
      orderIndex: 0,
      estimatedMinutes: 150,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['addition', 'three-digit', 'carrying', 'regrouping', 'place value', 'column addition'],
      parentTopicId: addSubtractTopic.id,
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-MATH-CH1-T1-S1',
      title: 'Adding Three-Digit Numbers',
      description: 'Techniques for adding three-digit numbers with carrying',
      context: 'Adding three-digit numbers builds on students\'s previous knowledge of place value and requires understanding of the regrouping (carrying) process. This skill is essential for everyday math applications and forms the foundation for addition with larger numbers.',
      learningOutcomes: 'By the end of this subtopic, students will be able to:\n1. Add three-digit numbers without regrouping\n2. Add three-digit numbers with regrouping in the ones place\n3. Add three-digit numbers with regrouping in both ones and tens places\n4. Use column addition method correctly\n5. Check addition by using the inverse operation (subtraction)',
      nodeType: SubjectNodeType.SUBTOPIC,
      orderIndex: 0,
      estimatedMinutes: 150,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['addition', 'three-digit', 'carrying', 'regrouping', 'place value', 'column addition'],
      subjectId: subjectId,
      parentTopicId: addSubtractTopic.id,
      status: SystemStatus.ACTIVE,
    },
  });

  // Subtopic 1.1.2: Subtracting Three-Digit Numbers
  await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-MATH-CH1-T1-S2'
      }
    },
    update: {
      title: 'Subtracting Three-Digit Numbers',
      description: 'Techniques for subtracting three-digit numbers with borrowing',
      nodeType: SubjectNodeType.SUBTOPIC,
      orderIndex: 1,
      estimatedMinutes: 150,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['subtraction', 'three-digit', 'borrowing'],
      parentTopicId: addSubtractTopic.id,
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-MATH-CH1-T1-S2',
      title: 'Subtracting Three-Digit Numbers',
      description: 'Techniques for subtracting three-digit numbers with borrowing',
      nodeType: SubjectNodeType.SUBTOPIC,
      orderIndex: 1,
      estimatedMinutes: 150,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['subtraction', 'three-digit', 'borrowing'],
      subjectId: subjectId,
      parentTopicId: addSubtractTopic.id,
      status: SystemStatus.ACTIVE,
    },
  });

  // Topic 1.2: Multiplication and Division
  const multiplyDivideTopic = await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-MATH-CH1-T2'
      }
    },
    update: {
      title: 'Multiplication and Division',
      description: 'Understanding and applying multiplication and division concepts',
      nodeType: SubjectNodeType.TOPIC,
      orderIndex: 1,
      estimatedMinutes: 300,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['multiplication', 'division', 'arithmetic'],
      parentTopicId: numbersChapter.id,
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-MATH-CH1-T2',
      title: 'Multiplication and Division',
      description: 'Understanding and applying multiplication and division concepts',
      nodeType: SubjectNodeType.TOPIC,
      orderIndex: 1,
      estimatedMinutes: 300,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['multiplication', 'division', 'arithmetic'],
      subjectId: subjectId,
      parentTopicId: numbersChapter.id,
      status: SystemStatus.ACTIVE,
    },
  });

  // Subtopic 1.2.1: Multiplication Tables (1-10)
  await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-MATH-CH1-T2-S1'
      }
    },
    update: {
      title: 'Multiplication Tables (1-10)',
      description: 'Learning and practicing multiplication tables from 1 to 10',
      nodeType: SubjectNodeType.SUBTOPIC,
      orderIndex: 0,
      estimatedMinutes: 150,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['multiplication', 'tables', 'memorization'],
      parentTopicId: multiplyDivideTopic.id,
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-MATH-CH1-T2-S1',
      title: 'Multiplication Tables (1-10)',
      description: 'Learning and practicing multiplication tables from 1 to 10',
      nodeType: SubjectNodeType.SUBTOPIC,
      orderIndex: 0,
      estimatedMinutes: 150,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['multiplication', 'tables', 'memorization'],
      subjectId: subjectId,
      parentTopicId: multiplyDivideTopic.id,
      status: SystemStatus.ACTIVE,
    },
  });

  // Subtopic 1.2.2: Division Basics
  await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-MATH-CH1-T2-S2'
      }
    },
    update: {
      title: 'Division Basics',
      description: 'Introduction to division concepts and simple division problems',
      nodeType: SubjectNodeType.SUBTOPIC,
      orderIndex: 1,
      estimatedMinutes: 150,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['division', 'basics', 'arithmetic'],
      parentTopicId: multiplyDivideTopic.id,
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-MATH-CH1-T2-S2',
      title: 'Division Basics',
      description: 'Introduction to division concepts and simple division problems',
      nodeType: SubjectNodeType.SUBTOPIC,
      orderIndex: 1,
      estimatedMinutes: 150,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['division', 'basics', 'arithmetic'],
      subjectId: subjectId,
      parentTopicId: multiplyDivideTopic.id,
      status: SystemStatus.ACTIVE,
    },
  });

  // Chapter 2: Geometry and Measurement
  const geometryChapter = await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-MATH-CH2'
      }
    },
    update: {
      title: 'Geometry and Measurement',
      description: 'Understanding shapes, sizes, and measurement concepts',
      nodeType: SubjectNodeType.CHAPTER,
      orderIndex: 1,
      estimatedMinutes: 600,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['geometry', 'measurement', 'shapes'],
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-MATH-CH2',
      title: 'Geometry and Measurement',
      description: 'Understanding shapes, sizes, and measurement concepts',
      nodeType: SubjectNodeType.CHAPTER,
      orderIndex: 1,
      estimatedMinutes: 600,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['geometry', 'measurement', 'shapes'],
      subjectId: subjectId,
      status: SystemStatus.ACTIVE,
    },
  });

  // Topic 2.1: 2D Shapes
  const shapesTopc = await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-MATH-CH2-T1'
      }
    },
    update: {
      title: '2D Shapes',
      description: 'Exploring and understanding two-dimensional shapes',
      nodeType: SubjectNodeType.TOPIC,
      orderIndex: 0,
      estimatedMinutes: 300,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['2D shapes', 'geometry', 'polygons'],
      parentTopicId: geometryChapter.id,
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-MATH-CH2-T1',
      title: '2D Shapes',
      description: 'Exploring and understanding two-dimensional shapes',
      nodeType: SubjectNodeType.TOPIC,
      orderIndex: 0,
      estimatedMinutes: 300,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['2D shapes', 'geometry', 'polygons'],
      subjectId: subjectId,
      parentTopicId: geometryChapter.id,
      status: SystemStatus.ACTIVE,
    },
  });

  // Subtopic 2.1.1: Polygons
  await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-MATH-CH2-T1-S1'
      }
    },
    update: {
      title: 'Polygons',
      description: 'Learning about different types of polygons and their properties',
      nodeType: SubjectNodeType.SUBTOPIC,
      orderIndex: 0,
      estimatedMinutes: 150,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['polygons', 'triangles', 'quadrilaterals'],
      parentTopicId: shapesTopc.id,
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-MATH-CH2-T1-S1',
      title: 'Polygons',
      description: 'Learning about different types of polygons and their properties',
      nodeType: SubjectNodeType.SUBTOPIC,
      orderIndex: 0,
      estimatedMinutes: 150,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['polygons', 'triangles', 'quadrilaterals'],
      subjectId: subjectId,
      parentTopicId: shapesTopc.id,
      status: SystemStatus.ACTIVE,
    },
  });

  // Subtopic 2.1.2: Circles
  await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-MATH-CH2-T1-S2'
      }
    },
    update: {
      title: 'Circles',
      description: 'Understanding circles and their properties',
      nodeType: SubjectNodeType.SUBTOPIC,
      orderIndex: 1,
      estimatedMinutes: 150,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['circles', 'radius', 'diameter'],
      parentTopicId: shapesTopc.id,
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-MATH-CH2-T1-S2',
      title: 'Circles',
      description: 'Understanding circles and their properties',
      nodeType: SubjectNodeType.SUBTOPIC,
      orderIndex: 1,
      estimatedMinutes: 150,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['circles', 'radius', 'diameter'],
      subjectId: subjectId,
      parentTopicId: shapesTopc.id,
      status: SystemStatus.ACTIVE,
    },
  });

  // Topic 2.2: Measurement
  const measurementTopic = await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-MATH-CH2-T2'
      }
    },
    update: {
      title: 'Measurement',
      description: 'Understanding and applying measurement concepts',
      nodeType: SubjectNodeType.TOPIC,
      orderIndex: 1,
      estimatedMinutes: 300,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['measurement', 'units', 'conversion'],
      parentTopicId: geometryChapter.id,
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-MATH-CH2-T2',
      title: 'Measurement',
      description: 'Understanding and applying measurement concepts',
      nodeType: SubjectNodeType.TOPIC,
      orderIndex: 1,
      estimatedMinutes: 300,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['measurement', 'units', 'conversion'],
      subjectId: subjectId,
      parentTopicId: geometryChapter.id,
      status: SystemStatus.ACTIVE,
    },
  });

  // Subtopic 2.2.1: Length and Distance
  await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-MATH-CH2-T2-S1'
      }
    },
    update: {
      title: 'Length and Distance',
      description: 'Measuring and comparing lengths and distances',
      nodeType: SubjectNodeType.SUBTOPIC,
      orderIndex: 0,
      estimatedMinutes: 150,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['length', 'distance', 'measurement'],
      parentTopicId: measurementTopic.id,
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-MATH-CH2-T2-S1',
      title: 'Length and Distance',
      description: 'Measuring and comparing lengths and distances',
      nodeType: SubjectNodeType.SUBTOPIC,
      orderIndex: 0,
      estimatedMinutes: 150,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['length', 'distance', 'measurement'],
      subjectId: subjectId,
      parentTopicId: measurementTopic.id,
      status: SystemStatus.ACTIVE,
    },
  });

  // Subtopic 2.2.2: Weight and Volume
  await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-MATH-CH2-T2-S2'
      }
    },
    update: {
      title: 'Weight and Volume',
      description: 'Understanding and measuring weight and volume',
      nodeType: SubjectNodeType.SUBTOPIC,
      orderIndex: 1,
      estimatedMinutes: 150,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['weight', 'volume', 'measurement'],
      parentTopicId: measurementTopic.id,
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-MATH-CH2-T2-S2',
      title: 'Weight and Volume',
      description: 'Understanding and measuring weight and volume',
      nodeType: SubjectNodeType.SUBTOPIC,
      orderIndex: 1,
      estimatedMinutes: 150,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['weight', 'volume', 'measurement'],
      subjectId: subjectId,
      parentTopicId: measurementTopic.id,
      status: SystemStatus.ACTIVE,
    },
  });
}

async function seedEnglishTopics(prisma: PrismaClient, subjectId: string) {
  console.log('Seeding English topics...');

  // Chapter: All Are Welcome
  const allAreWelcomeChapter = await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-ENG-CH-AAW'
      }
    },
    update: {
      title: 'All Are Welcome',
      description: 'Developing language skills through inclusive themes and activities',
      nodeType: SubjectNodeType.CHAPTER,
      orderIndex: 0,
      estimatedMinutes: 900,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['welcome', 'inclusion', 'language', 'communication', 'reading', 'writing'],
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-ENG-CH-AAW',
      title: 'All Are Welcome',
      description: 'Developing language skills through inclusive themes and activities',
      nodeType: SubjectNodeType.CHAPTER,
      orderIndex: 0,
      estimatedMinutes: 900,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['welcome', 'inclusion', 'language', 'communication', 'reading', 'writing'],
      subjectId: subjectId,
      status: SystemStatus.ACTIVE,
    },
  });

  // Unit 1: Exploring Texts through Pre-reading and Prediction
  const preReadingUnit = await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-ENG-CH-AAW-U1'
      }
    },
    update: {
      title: 'Exploring Texts through Pre-reading and Prediction',
      description: 'Developing skills to anticipate and predict text content',
      nodeType: SubjectNodeType.TOPIC,
      orderIndex: 0,
      estimatedMinutes: 120,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['pre-reading', 'prediction', 'comprehension'],
      parentTopicId: allAreWelcomeChapter.id,
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-ENG-CH-AAW-U1',
      title: 'Exploring Texts through Pre-reading and Prediction',
      description: 'Developing skills to anticipate and predict text content',
      nodeType: SubjectNodeType.TOPIC,
      orderIndex: 0,
      estimatedMinutes: 120,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['pre-reading', 'prediction', 'comprehension'],
      subjectId: subjectId,
      parentTopicId: allAreWelcomeChapter.id,
      status: SystemStatus.ACTIVE,
    },
  });

  // Topic 1.1: Predicting Text from Title and Pictures
  await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-ENG-CH-AAW-U1-T1'
      }
    },
    update: {
      title: 'Predicting Text from Title and Pictures',
      description: 'Students will develop the ability to use titles and visuals to anticipate the content of a text before reading.',
      context: 'Activating prior knowledge and using context clues helps develop comprehension and prepares students for engaged reading.',
      learningOutcomes: 'By the end of this topic, students will be able to:\n- Use pre-reading strategies to make predictions based on the title and illustrations.\n- Develop expectations and curiosity about the text content.',
      nodeType: SubjectNodeType.SUBTOPIC,
      orderIndex: 0,
      estimatedMinutes: 60,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['Pre-reading', 'prediction', 'visuals', 'title', 'pictures', 'comprehension'],
      parentTopicId: preReadingUnit.id,
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-ENG-CH-AAW-U1-T1',
      title: 'Predicting Text from Title and Pictures',
      description: 'Students will develop the ability to use titles and visuals to anticipate the content of a text before reading.',
      context: 'Activating prior knowledge and using context clues helps develop comprehension and prepares students for engaged reading.',
      learningOutcomes: 'By the end of this topic, students will be able to:\n- Use pre-reading strategies to make predictions based on the title and illustrations.\n- Develop expectations and curiosity about the text content.',
      nodeType: SubjectNodeType.SUBTOPIC,
      orderIndex: 0,
      estimatedMinutes: 60,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['Pre-reading', 'prediction', 'visuals', 'title', 'pictures', 'comprehension'],
      subjectId: subjectId,
      parentTopicId: preReadingUnit.id,
      status: SystemStatus.ACTIVE,
    },
  });

  // Unit 2: Oral Communication and Expression
  const oralCommunicationUnit = await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-ENG-CH-AAW-U2'
      }
    },
    update: {
      title: 'Oral Communication and Expression',
      description: 'Developing speaking and listening skills for effective communication',
      nodeType: SubjectNodeType.TOPIC,
      orderIndex: 1,
      estimatedMinutes: 180,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['speaking', 'listening', 'communication', 'expression'],
      parentTopicId: allAreWelcomeChapter.id,
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-ENG-CH-AAW-U2',
      title: 'Oral Communication and Expression',
      description: 'Developing speaking and listening skills for effective communication',
      nodeType: SubjectNodeType.TOPIC,
      orderIndex: 1,
      estimatedMinutes: 180,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['speaking', 'listening', 'communication', 'expression'],
      subjectId: subjectId,
      parentTopicId: allAreWelcomeChapter.id,
      status: SystemStatus.ACTIVE,
    },
  });

  // Topic 2.1: Practising Class Talk and Formulaic Expressions
  await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-ENG-CH-AAW-U2-T1'
      }
    },
    update: {
      title: 'Practising Class Talk and Formulaic Expressions',
      description: 'Learners will engage in structured classroom conversations using common expressions for everyday communication.',
      context: 'Improves fluency and confidence in using English through repetition and familiar phrases.',
      learningOutcomes: 'By the end of this topic, students will be able to:\n- Practice classroom talk using common sentence starters and greetings.\n- Use polite expressions in structured group settings.',
      nodeType: SubjectNodeType.SUBTOPIC,
      orderIndex: 0,
      estimatedMinutes: 60,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['Class talk', 'greetings', 'expressions', 'polite language', 'fluency'],
      parentTopicId: oralCommunicationUnit.id,
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-ENG-CH-AAW-U2-T1',
      title: 'Practising Class Talk and Formulaic Expressions',
      description: 'Learners will engage in structured classroom conversations using common expressions for everyday communication.',
      context: 'Improves fluency and confidence in using English through repetition and familiar phrases.',
      learningOutcomes: 'By the end of this topic, students will be able to:\n- Practice classroom talk using common sentence starters and greetings.\n- Use polite expressions in structured group settings.',
      nodeType: SubjectNodeType.SUBTOPIC,
      orderIndex: 0,
      estimatedMinutes: 60,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['Class talk', 'greetings', 'expressions', 'polite language', 'fluency'],
      subjectId: subjectId,
      parentTopicId: oralCommunicationUnit.id,
      status: SystemStatus.ACTIVE,
    },
  });

  // Topic 2.2: Demonstrating Courtesy in Group Interactions
  await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-ENG-CH-AAW-U2-T2'
      }
    },
    update: {
      title: 'Demonstrating Courtesy in Group Interactions',
      description: 'Students will participate in oral interactions that promote respect and collaboration.',
      context: 'Supports social skills and respectful communication within group tasks.',
      learningOutcomes: 'By the end of this topic, students will be able to:\n- Use courteous language to show respect during group work.\n- Apply turn-taking and listening skills in discussions.',
      nodeType: SubjectNodeType.SUBTOPIC,
      orderIndex: 1,
      estimatedMinutes: 60,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['Oral interaction', 'group work', 'courtesy', 'respect', 'cooperation'],
      parentTopicId: oralCommunicationUnit.id,
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-ENG-CH-AAW-U2-T2',
      title: 'Demonstrating Courtesy in Group Interactions',
      description: 'Students will participate in oral interactions that promote respect and collaboration.',
      context: 'Supports social skills and respectful communication within group tasks.',
      learningOutcomes: 'By the end of this topic, students will be able to:\n- Use courteous language to show respect during group work.\n- Apply turn-taking and listening skills in discussions.',
      nodeType: SubjectNodeType.SUBTOPIC,
      orderIndex: 1,
      estimatedMinutes: 60,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['Oral interaction', 'group work', 'courtesy', 'respect', 'cooperation'],
      subjectId: subjectId,
      parentTopicId: oralCommunicationUnit.id,
      status: SystemStatus.ACTIVE,
    },
  });

  // Unit 3: Phonemic Awareness and Pronunciation
  const phonemicAwarenessUnit = await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-ENG-CH-AAW-U3'
      }
    },
    update: {
      title: 'Phonemic Awareness and Pronunciation',
      description: 'Developing phonemic awareness and pronunciation skills',
      nodeType: SubjectNodeType.TOPIC,
      orderIndex: 2,
      estimatedMinutes: 180,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['phonics', 'pronunciation', 'sounds', 'phonemic awareness'],
      parentTopicId: allAreWelcomeChapter.id,
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-ENG-CH-AAW-U3',
      title: 'Phonemic Awareness and Pronunciation',
      description: 'Developing phonemic awareness and pronunciation skills',
      nodeType: SubjectNodeType.TOPIC,
      orderIndex: 2,
      estimatedMinutes: 180,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['phonics', 'pronunciation', 'sounds', 'phonemic awareness'],
      subjectId: subjectId,
      parentTopicId: allAreWelcomeChapter.id,
      status: SystemStatus.ACTIVE,
    },
  });

  // Topic 3.1: Recognizing and Articulating Soft Sounds (c and g)
  await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-ENG-CH-AAW-U3-T1'
      }
    },
    update: {
      title: 'Recognizing and Articulating Soft Sounds (c and g)',
      description: 'Learners will identify and practice soft sounds of the letters "c" (as in city) and "g" (as in giant).',
      context: 'Helps in decoding unfamiliar words and improving reading fluency.',
      learningOutcomes: 'By the end of this topic, students will be able to:\n- Recognize soft "c" and "g" sounds in words.\n- Pronounce words with soft consonants accurately.',
      nodeType: SubjectNodeType.SUBTOPIC,
      orderIndex: 0,
      estimatedMinutes: 60,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['Soft c', 'soft g', 'phonics', 'pronunciation', 'decode'],
      parentTopicId: phonemicAwarenessUnit.id,
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-ENG-CH-AAW-U3-T1',
      title: 'Recognizing and Articulating Soft Sounds (c and g)',
      description: 'Learners will identify and practice soft sounds of the letters "c" (as in city) and "g" (as in giant).',
      context: 'Helps in decoding unfamiliar words and improving reading fluency.',
      learningOutcomes: 'By the end of this topic, students will be able to:\n- Recognize soft "c" and "g" sounds in words.\n- Pronounce words with soft consonants accurately.',
      nodeType: SubjectNodeType.SUBTOPIC,
      orderIndex: 0,
      estimatedMinutes: 60,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['Soft c', 'soft g', 'phonics', 'pronunciation', 'decode'],
      subjectId: subjectId,
      parentTopicId: phonemicAwarenessUnit.id,
      status: SystemStatus.ACTIVE,
    },
  });

  // Topic 3.2: Pronouncing Common Consonant Clusters (sh, st)
  await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-ENG-CH-AAW-U3-T2'
      }
    },
    update: {
      title: 'Pronouncing Common Consonant Clusters (sh, st)',
      description: 'Students will practice pronouncing two-consonant clusters at the start and end of words.',
      context: 'Essential for improving clarity in speech and supporting accurate spelling.',
      learningOutcomes: 'By the end of this topic, students will be able to:\n- Identify and pronounce clusters "sh" and "st" in initial and final positions.\n- Differentiate similar sounding clusters through repetition.',
      nodeType: SubjectNodeType.SUBTOPIC,
      orderIndex: 1,
      estimatedMinutes: 60,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['Consonant clusters', 'sh', 'st', 'pronunciation', 'spelling support'],
      parentTopicId: phonemicAwarenessUnit.id,
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-ENG-CH-AAW-U3-T2',
      title: 'Pronouncing Common Consonant Clusters (sh, st)',
      description: 'Students will practice pronouncing two-consonant clusters at the start and end of words.',
      context: 'Essential for improving clarity in speech and supporting accurate spelling.',
      learningOutcomes: 'By the end of this topic, students will be able to:\n- Identify and pronounce clusters "sh" and "st" in initial and final positions.\n- Differentiate similar sounding clusters through repetition.',
      nodeType: SubjectNodeType.SUBTOPIC,
      orderIndex: 1,
      estimatedMinutes: 60,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['Consonant clusters', 'sh', 'st', 'pronunciation', 'spelling support'],
      subjectId: subjectId,
      parentTopicId: phonemicAwarenessUnit.id,
      status: SystemStatus.ACTIVE,
    },
  });

  // Chapter 1: Reading Comprehension (moved to index 1)
  const readingChapter = await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-ENG-CH1'
      }
    },
    update: {
      title: 'Reading Comprehension',
      description: 'Developing reading comprehension skills',
      nodeType: SubjectNodeType.CHAPTER,
      orderIndex: 1, // Changed from 0 to 1
      estimatedMinutes: 600,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['reading', 'comprehension', 'literacy'],
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-ENG-CH1',
      title: 'Reading Comprehension',
      description: 'Developing reading comprehension skills',
      nodeType: SubjectNodeType.CHAPTER,
      orderIndex: 1, // Changed from 0 to 1
      estimatedMinutes: 600,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['reading', 'comprehension', 'literacy'],
      subjectId: subjectId,
      status: SystemStatus.ACTIVE,
    },
  });

  // Topic 1.1: Story Elements
  const storyElementsTopic = await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-ENG-CH1-T1'
      }
    },
    update: {
      title: 'Story Elements',
      description: 'Understanding the key elements of stories',
      nodeType: SubjectNodeType.TOPIC,
      orderIndex: 0,
      estimatedMinutes: 300,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['story elements', 'characters', 'plot'],
      parentTopicId: readingChapter.id,
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-ENG-CH1-T1',
      title: 'Story Elements',
      description: 'Understanding the key elements of stories',
      nodeType: SubjectNodeType.TOPIC,
      orderIndex: 0,
      estimatedMinutes: 300,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['story elements', 'characters', 'plot'],
      subjectId: subjectId,
      parentTopicId: readingChapter.id,
      status: SystemStatus.ACTIVE,
    },
  });

  // Subtopic 1.1.1: Characters and Setting
  await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-ENG-CH1-T1-S1'
      }
    },
    update: {
      title: 'Characters and Setting',
      description: 'Identifying and analyzing characters and settings in stories',
      nodeType: SubjectNodeType.SUBTOPIC,
      orderIndex: 0,
      estimatedMinutes: 150,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['characters', 'setting', 'story elements'],
      parentTopicId: storyElementsTopic.id,
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-ENG-CH1-T1-S1',
      title: 'Characters and Setting',
      description: 'Identifying and analyzing characters and settings in stories',
      nodeType: SubjectNodeType.SUBTOPIC,
      orderIndex: 0,
      estimatedMinutes: 150,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['characters', 'setting', 'story elements'],
      subjectId: subjectId,
      parentTopicId: storyElementsTopic.id,
      status: SystemStatus.ACTIVE,
    },
  });

  // Subtopic 1.1.2: Plot and Theme
  await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-ENG-CH1-T1-S2'
      }
    },
    update: {
      title: 'Plot and Theme',
      description: 'Understanding plot development and identifying themes in stories',
      nodeType: SubjectNodeType.SUBTOPIC,
      orderIndex: 1,
      estimatedMinutes: 150,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['plot', 'theme', 'story elements'],
      parentTopicId: storyElementsTopic.id,
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-ENG-CH1-T1-S2',
      title: 'Plot and Theme',
      description: 'Understanding plot development and identifying themes in stories',
      nodeType: SubjectNodeType.SUBTOPIC,
      orderIndex: 1,
      estimatedMinutes: 150,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['plot', 'theme', 'story elements'],
      subjectId: subjectId,
      parentTopicId: storyElementsTopic.id,
      status: SystemStatus.ACTIVE,
    },
  });

  // Chapter 2: Writing Skills
  const writingChapter = await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-ENG-CH2'
      }
    },
    update: {
      title: 'Writing Skills',
      description: 'Developing effective writing skills',
      nodeType: SubjectNodeType.CHAPTER,
      orderIndex: 1,
      estimatedMinutes: 600,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['writing', 'composition', 'grammar'],
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-ENG-CH2',
      title: 'Writing Skills',
      description: 'Developing effective writing skills',
      nodeType: SubjectNodeType.CHAPTER,
      orderIndex: 1,
      estimatedMinutes: 600,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['writing', 'composition', 'grammar'],
      subjectId: subjectId,
      status: SystemStatus.ACTIVE,
    },
  });

  // Add more English topics as needed...
}

async function seedScienceTopics(prisma: PrismaClient, subjectId: string) {
  console.log('Seeding Science topics...');

  // Chapter 1: Living Things
  const livingThingsChapter = await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-SCI-CH1'
      }
    },
    update: {
      title: 'Living Things',
      description: 'Understanding plants, animals, and their characteristics',
      nodeType: SubjectNodeType.CHAPTER,
      orderIndex: 0,
      estimatedMinutes: 600,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['living things', 'plants', 'animals'],
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-SCI-CH1',
      title: 'Living Things',
      description: 'Understanding plants, animals, and their characteristics',
      nodeType: SubjectNodeType.CHAPTER,
      orderIndex: 0,
      estimatedMinutes: 600,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['living things', 'plants', 'animals'],
      subjectId: subjectId,
      status: SystemStatus.ACTIVE,
    },
  });

  // Topic 1.1: Plants
  const plantsTopic = await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-SCI-CH1-T1'
      }
    },
    update: {
      title: 'Plants',
      description: 'Learning about plant parts, growth, and life cycles',
      context: 'Plants are essential living organisms that provide food, oxygen, and habitats for animals. Understanding plant structures and functions helps students appreciate the importance of plants in ecosystems and develop environmental awareness. This topic introduces students to the basic concepts of botany through hands-on observations and experiments.',
      learningOutcomes: 'By the end of this topic, students will be able to:\n1. Identify and describe the main parts of a plant (roots, stem, leaves, flowers, fruits, seeds)\n2. Explain the function of each plant part\n3. Describe the life cycle of flowering plants\n4. Understand how plants make their own food through photosynthesis\n5. Recognize the importance of plants in our daily lives and ecosystems\n6. Conduct simple experiments to demonstrate plant growth requirements',
      nodeType: SubjectNodeType.TOPIC,
      orderIndex: 0,
      estimatedMinutes: 300,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['plants', 'botany', 'life cycle', 'photosynthesis', 'roots', 'stems', 'leaves', 'flowers', 'seeds', 'plant growth'],
      parentTopicId: livingThingsChapter.id,
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-SCI-CH1-T1',
      title: 'Plants',
      description: 'Learning about plant parts, growth, and life cycles',
      context: 'Plants are essential living organisms that provide food, oxygen, and habitats for animals. Understanding plant structures and functions helps students appreciate the importance of plants in ecosystems and develop environmental awareness. This topic introduces students to the basic concepts of botany through hands-on observations and experiments.',
      learningOutcomes: 'By the end of this topic, students will be able to:\n1. Identify and describe the main parts of a plant (roots, stem, leaves, flowers, fruits, seeds)\n2. Explain the function of each plant part\n3. Describe the life cycle of flowering plants\n4. Understand how plants make their own food through photosynthesis\n5. Recognize the importance of plants in our daily lives and ecosystems\n6. Conduct simple experiments to demonstrate plant growth requirements',
      nodeType: SubjectNodeType.TOPIC,
      orderIndex: 0,
      estimatedMinutes: 300,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['plants', 'botany', 'life cycle', 'photosynthesis', 'roots', 'stems', 'leaves', 'flowers', 'seeds', 'plant growth'],
      subjectId: subjectId,
      parentTopicId: livingThingsChapter.id,
      status: SystemStatus.ACTIVE,
    },
  });

  // Subtopic 1.1.1: Plant Parts
  await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-SCI-CH1-T1-S1'
      }
    },
    update: {
      title: 'Plant Parts',
      description: 'Identifying and understanding the functions of different plant parts',
      nodeType: SubjectNodeType.SUBTOPIC,
      orderIndex: 0,
      estimatedMinutes: 150,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['roots', 'stems', 'leaves', 'flowers'],
      parentTopicId: plantsTopic.id,
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-SCI-CH1-T1-S1',
      title: 'Plant Parts',
      description: 'Identifying and understanding the functions of different plant parts',
      nodeType: SubjectNodeType.SUBTOPIC,
      orderIndex: 0,
      estimatedMinutes: 150,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['roots', 'stems', 'leaves', 'flowers'],
      subjectId: subjectId,
      parentTopicId: plantsTopic.id,
      status: SystemStatus.ACTIVE,
    },
  });

  // Topic 1.2: Animals
  const animalsTopic = await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-SCI-CH1-T2'
      }
    },
    update: {
      title: 'Animals',
      description: 'Learning about different types of animals and their characteristics',
      nodeType: SubjectNodeType.TOPIC,
      orderIndex: 1,
      estimatedMinutes: 300,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['animals', 'habitats', 'classification'],
      parentTopicId: livingThingsChapter.id,
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-SCI-CH1-T2',
      title: 'Animals',
      description: 'Learning about different types of animals and their characteristics',
      nodeType: SubjectNodeType.TOPIC,
      orderIndex: 1,
      estimatedMinutes: 300,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['animals', 'habitats', 'classification'],
      subjectId: subjectId,
      parentTopicId: livingThingsChapter.id,
      status: SystemStatus.ACTIVE,
    },
  });

  // Chapter 2: Earth and Space
  const earthSpaceChapter = await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-SCI-CH2'
      }
    },
    update: {
      title: 'Earth and Space',
      description: 'Exploring the Earth, solar system, and space',
      nodeType: SubjectNodeType.CHAPTER,
      orderIndex: 1,
      estimatedMinutes: 600,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['earth', 'space', 'solar system'],
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-SCI-CH2',
      title: 'Earth and Space',
      description: 'Exploring the Earth, solar system, and space',
      nodeType: SubjectNodeType.CHAPTER,
      orderIndex: 1,
      estimatedMinutes: 600,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['earth', 'space', 'solar system'],
      subjectId: subjectId,
      status: SystemStatus.ACTIVE,
    },
  });

  // Topic 2.1: The Solar System
  const solarSystemTopic = await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-SCI-CH2-T1'
      }
    },
    update: {
      title: 'The Solar System',
      description: 'Learning about the sun, planets, and other objects in our solar system',
      nodeType: SubjectNodeType.TOPIC,
      orderIndex: 0,
      estimatedMinutes: 300,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['planets', 'sun', 'solar system'],
      parentTopicId: earthSpaceChapter.id,
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-SCI-CH2-T1',
      title: 'The Solar System',
      description: 'Learning about the sun, planets, and other objects in our solar system',
      nodeType: SubjectNodeType.TOPIC,
      orderIndex: 0,
      estimatedMinutes: 300,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['planets', 'sun', 'solar system'],
      subjectId: subjectId,
      parentTopicId: earthSpaceChapter.id,
      status: SystemStatus.ACTIVE,
    },
  });
}

async function seedPETopics(prisma: PrismaClient, subjectId: string) {
  console.log('Seeding Physical Education topics...');

  // Chapter 1: Movement Skills
  const movementSkillsChapter = await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-PE-CH1'
      }
    },
    update: {
      title: 'Movement Skills',
      description: 'Developing fundamental movement skills',
      nodeType: SubjectNodeType.CHAPTER,
      orderIndex: 0,
      estimatedMinutes: 600,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['movement', 'skills', 'physical education'],
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-PE-CH1',
      title: 'Movement Skills',
      description: 'Developing fundamental movement skills',
      nodeType: SubjectNodeType.CHAPTER,
      orderIndex: 0,
      estimatedMinutes: 600,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['movement', 'skills', 'physical education'],
      subjectId: subjectId,
      status: SystemStatus.ACTIVE,
    },
  });

  // Topic 1.1: Locomotor Skills
  const locomotorTopic = await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-PE-CH1-T1'
      }
    },
    update: {
      title: 'Locomotor Skills',
      description: 'Developing skills for moving the body from one place to another',
      nodeType: SubjectNodeType.TOPIC,
      orderIndex: 0,
      estimatedMinutes: 300,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['running', 'jumping', 'hopping', 'skipping'],
      parentTopicId: movementSkillsChapter.id,
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-PE-CH1-T1',
      title: 'Locomotor Skills',
      description: 'Developing skills for moving the body from one place to another',
      nodeType: SubjectNodeType.TOPIC,
      orderIndex: 0,
      estimatedMinutes: 300,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['running', 'jumping', 'hopping', 'skipping'],
      subjectId: subjectId,
      parentTopicId: movementSkillsChapter.id,
      status: SystemStatus.ACTIVE,
    },
  });

  // Topic 1.2: Ball Skills
  const ballSkillsTopic = await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-PE-CH1-T2'
      }
    },
    update: {
      title: 'Ball Skills',
      description: 'Developing skills for controlling and manipulating balls',
      nodeType: SubjectNodeType.TOPIC,
      orderIndex: 1,
      estimatedMinutes: 300,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['throwing', 'catching', 'kicking', 'dribbling'],
      parentTopicId: movementSkillsChapter.id,
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-PE-CH1-T2',
      title: 'Ball Skills',
      description: 'Developing skills for controlling and manipulating balls',
      nodeType: SubjectNodeType.TOPIC,
      orderIndex: 1,
      estimatedMinutes: 300,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['throwing', 'catching', 'kicking', 'dribbling'],
      subjectId: subjectId,
      parentTopicId: movementSkillsChapter.id,
      status: SystemStatus.ACTIVE,
    },
  });

  // Chapter 2: Games and Sports
  const gamesSportsChapter = await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-PE-CH2'
      }
    },
    update: {
      title: 'Games and Sports',
      description: 'Learning and participating in various games and sports',
      nodeType: SubjectNodeType.CHAPTER,
      orderIndex: 1,
      estimatedMinutes: 600,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['games', 'sports', 'teamwork'],
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-PE-CH2',
      title: 'Games and Sports',
      description: 'Learning and participating in various games and sports',
      nodeType: SubjectNodeType.CHAPTER,
      orderIndex: 1,
      estimatedMinutes: 600,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['games', 'sports', 'teamwork'],
      subjectId: subjectId,
      status: SystemStatus.ACTIVE,
    },
  });

  // Topic 2.1: Team Games
  const teamGamesTopic = await prisma.subjectTopic.upsert({
    where: {
      subjectId_code: {
        subjectId: subjectId,
        code: 'PYP-CL3-PE-CH2-T1'
      }
    },
    update: {
      title: 'Team Games',
      description: 'Participating in games that require teamwork and cooperation',
      nodeType: SubjectNodeType.TOPIC,
      orderIndex: 0,
      estimatedMinutes: 300,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['teamwork', 'cooperation', 'games'],
      parentTopicId: gamesSportsChapter.id,
      status: SystemStatus.ACTIVE,
    },
    create: {
      code: 'PYP-CL3-PE-CH2-T1',
      title: 'Team Games',
      description: 'Participating in games that require teamwork and cooperation',
      nodeType: SubjectNodeType.TOPIC,
      orderIndex: 0,
      estimatedMinutes: 300,
      competencyLevel: CompetencyLevel.BASIC,
      keywords: ['teamwork', 'cooperation', 'games'],
      subjectId: subjectId,
      parentTopicId: gamesSportsChapter.id,
      status: SystemStatus.ACTIVE,
    },
  });
}
