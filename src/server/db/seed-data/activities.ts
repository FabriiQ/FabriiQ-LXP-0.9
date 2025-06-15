import { PrismaClient, SystemStatus, SubmissionStatus } from '@prisma/client';
import { ActivityPurpose, AssessmentType, LearningActivityType } from '../../api/constants';

export async function seedActivities(
  prisma: PrismaClient,
  subjects: any[],
  classes: any[],
  students: any[]
) {
  console.log('Seeding activities and assessments...');

  // Find subjects by code
  const mathSubject = subjects.find(s => s.code === 'PYP-CL3-MATH');
  const englishSubject = subjects.find(s => s.code === 'PYP-CL3-ENG');
  const scienceSubject = subjects.find(s => s.code === 'PYP-CL3-SCI');
  const peSubject = subjects.find(s => s.code === 'PYP-CL3-PE');

  if (!mathSubject || !englishSubject || !scienceSubject || !peSubject) {
    console.warn('One or more subjects not found. Skipping activities seeding.');
    return;
  }

  // Get topic IDs for each subject
  const mathTopics = await prisma.subjectTopic.findMany({
    where: { subjectId: mathSubject.id },
  });

  const englishTopics = await prisma.subjectTopic.findMany({
    where: { subjectId: englishSubject.id },
  });

  const scienceTopics = await prisma.subjectTopic.findMany({
    where: { subjectId: scienceSubject.id },
  });

  const peTopics = await prisma.subjectTopic.findMany({
    where: { subjectId: peSubject.id },
  });

  // Get classes
  const boysClass3A = classes.find(c => c.code === 'SIS-BOYS-CL3A');
  const girlsClass3A = classes.find(c => c.code === 'SIS-GIRLS-CL3A');

  if (!boysClass3A || !girlsClass3A) {
    console.warn('Classes not found. Skipping activities seeding.');
    return;
  }

  // Get students for each class
  const boysClass3AStudents = students.filter(s => s.classId === boysClass3A.id);
  const girlsClass3AStudents = students.filter(s => s.classId === girlsClass3A.id);

  // ===== MATHEMATICS ACTIVITIES =====
  await seedMathActivities(
    prisma,
    mathSubject.id,
    mathTopics,
    boysClass3A.id,
    girlsClass3A.id,
    boysClass3AStudents,
    girlsClass3AStudents
  );

  // ===== ENGLISH ACTIVITIES =====
  await seedEnglishActivities(
    prisma,
    englishSubject.id,
    englishTopics,
    boysClass3A.id,
    girlsClass3A.id,
    boysClass3AStudents,
    girlsClass3AStudents
  );

  // ===== SCIENCE ACTIVITIES =====
  await seedScienceActivities(
    prisma,
    scienceSubject.id,
    scienceTopics,
    boysClass3A.id,
    girlsClass3A.id,
    boysClass3AStudents,
    girlsClass3AStudents
  );

  // ===== PHYSICAL EDUCATION ACTIVITIES =====
  await seedPEActivities(
    prisma,
    peSubject.id,
    peTopics,
    boysClass3A.id,
    girlsClass3A.id,
    boysClass3AStudents,
    girlsClass3AStudents
  );

  console.log('Activities and assessments seeding completed');
}

async function seedMathActivities(
  prisma: PrismaClient,
  subjectId: string,
  topics: any[],
  boysClassId: string,
  girlsClassId: string,
  boysStudents: any[],
  girlsStudents: any[]
) {
  console.log('Seeding Mathematics activities...');

  // Find specific topics
  const addSubtractTopic = topics.find(t => t.code === 'PYP-CL3-MATH-CH1-T1');
  const multiplyDivideTopic = topics.find(t => t.code === 'PYP-CL3-MATH-CH1-T2');
  const shapesTopc = topics.find(t => t.code === 'PYP-CL3-MATH-CH2-T1');

  if (!addSubtractTopic || !multiplyDivideTopic || !shapesTopc) {
    console.warn('Math topics not found. Skipping math activities seeding.');
    return;
  }

  // 1. Addition and Subtraction Quiz (Assessment)
  const boysAddSubtractQuiz = await prisma.activity.create({
    data: {
      title: 'Addition and Subtraction Quiz',
      purpose: ActivityPurpose.ASSESSMENT,
      assessmentType: AssessmentType.QUIZ,
      status: SystemStatus.ACTIVE,
      subjectId: subjectId,
      topicId: addSubtractTopic.id,
      classId: boysClassId,
      content: {
        activityType: 'multiple-choice',
        instructions: 'Complete all questions. Show your work for each problem.',
        questions: [
          {
            id: '1',
            text: 'What is 345 + 267?',
            answer: '612',
            points: 2
          },
          {
            id: '2',
            text: 'What is 523 - 178?',
            answer: '345',
            points: 2
          },
          {
            id: '3',
            text: 'Solve: 624 + 189',
            answer: '813',
            points: 2
          },
          {
            id: '4',
            text: 'Solve: 752 - 486',
            answer: '266',
            points: 2
          },
          {
            id: '5',
            text: 'If you have 325 marbles and give away 167, how many do you have left?',
            answer: '158',
            points: 4
          },
          {
            id: '6',
            text: 'If you have 246 stickers and get 189 more, how many stickers do you have in total?',
            answer: '435',
            points: 4
          },
          {
            id: '7',
            text: 'What is 500 - 267?',
            answer: '233',
            points: 2
          },
          {
            id: '8',
            text: 'What is 621 + 179?',
            answer: '800',
            points: 2
          }
        ]
      },
      isGradable: true,
      maxScore: 20,
      passingScore: 12,
      weightage: 1.0,
    }
  });

  // Create the same quiz for girls class
  const girlsAddSubtractQuiz = await prisma.activity.create({
    data: {
      title: 'Addition and Subtraction Quiz',
      purpose: ActivityPurpose.ASSESSMENT,
      assessmentType: AssessmentType.QUIZ,
      status: SystemStatus.ACTIVE,
      subjectId: subjectId,
      topicId: addSubtractTopic.id,
      classId: girlsClassId,
      content: {
        activityType: 'multiple-choice',
        instructions: 'Complete all questions. Show your work for each problem.',
        questions: [
          {
            id: '1',
            text: 'What is 345 + 267?',
            answer: '612',
            points: 2
          },
          {
            id: '2',
            text: 'What is 523 - 178?',
            answer: '345',
            points: 2
          },
          {
            id: '3',
            text: 'Solve: 624 + 189',
            answer: '813',
            points: 2
          },
          {
            id: '4',
            text: 'Solve: 752 - 486',
            answer: '266',
            points: 2
          },
          {
            id: '5',
            text: 'If you have 325 marbles and give away 167, how many do you have left?',
            answer: '158',
            points: 4
          },
          {
            id: '6',
            text: 'If you have 246 stickers and get 189 more, how many stickers do you have in total?',
            answer: '435',
            points: 4
          },
          {
            id: '7',
            text: 'What is 500 - 267?',
            answer: '233',
            points: 2
          },
          {
            id: '8',
            text: 'What is 621 + 179?',
            answer: '800',
            points: 2
          }
        ]
      },
      isGradable: true,
      maxScore: 20,
      passingScore: 12,
      weightage: 1.0,
    }
  });

  // 2. Multiplication Tables Fill in the Blanks Activity
  await prisma.activity.create({
    data: {
      title: 'Multiplication Tables Fill in the Blanks',
      purpose: ActivityPurpose.ASSESSMENT,
      assessmentType: AssessmentType.QUIZ,
      status: SystemStatus.ACTIVE,
      subjectId: subjectId,
      topicId: multiplyDivideTopic.id,
      classId: boysClassId,
      content: {
        activityType: 'fill-in-the-blanks',
        instructions: 'Fill in the blanks with the correct numbers to complete the multiplication equations.',
        questions: [
          {
            id: '1',
            text: '3 × ___ = 24',
            answer: '8',
            explanation: 'To find the missing number, divide 24 by 3: 24 ÷ 3 = 8',
            points: 1
          },
          {
            id: '2',
            text: '___ × 7 = 42',
            answer: '6',
            explanation: 'To find the missing number, divide 42 by 7: 42 ÷ 7 = 6',
            points: 1
          },
          {
            id: '3',
            text: '5 × ___ = 45',
            answer: '9',
            explanation: 'To find the missing number, divide 45 by 5: 45 ÷ 5 = 9',
            points: 1
          },
          {
            id: '4',
            text: '___ × 4 = 36',
            answer: '9',
            explanation: 'To find the missing number, divide 36 by 4: 36 ÷ 4 = 9',
            points: 1
          },
          {
            id: '5',
            text: '8 × ___ = 64',
            answer: '8',
            explanation: 'To find the missing number, divide 64 by 8: 64 ÷ 8 = 8',
            points: 1
          },
          {
            id: '6',
            text: '___ × 6 = 54',
            answer: '9',
            explanation: 'To find the missing number, divide 54 by 6: 54 ÷ 6 = 9',
            points: 1
          },
          {
            id: '7',
            text: '7 × ___ = 49',
            answer: '7',
            explanation: 'To find the missing number, divide 49 by 7: 49 ÷ 7 = 7',
            points: 1
          },
          {
            id: '8',
            text: '___ × 9 = 81',
            answer: '9',
            explanation: 'To find the missing number, divide 81 by 9: 81 ÷ 9 = 9',
            points: 1
          },
          {
            id: '9',
            text: '10 × ___ = 70',
            answer: '7',
            explanation: 'To find the missing number, divide 70 by 10: 70 ÷ 10 = 7',
            points: 1
          },
          {
            id: '10',
            text: '___ × 8 = 56',
            answer: '7',
            explanation: 'To find the missing number, divide 56 by 8: 56 ÷ 8 = 7',
            points: 1
          }
        ],
        showFeedbackImmediately: true,
        timeLimit: 15, // minutes
        attempts: 2
      },
      isGradable: true,
      maxScore: 10,
      passingScore: 7,
      weightage: 1.0,
    }
  });

  // Create the same fill in the blanks activity for girls class
  await prisma.activity.create({
    data: {
      title: 'Multiplication Tables Fill in the Blanks',
      purpose: ActivityPurpose.ASSESSMENT,
      assessmentType: AssessmentType.QUIZ,
      status: SystemStatus.ACTIVE,
      subjectId: subjectId,
      topicId: multiplyDivideTopic.id,
      classId: girlsClassId,
      content: {
        activityType: 'fill-in-the-blanks',
        instructions: 'Fill in the blanks with the correct numbers to complete the multiplication equations.',
        questions: [
          {
            id: '1',
            text: '3 × ___ = 24',
            answer: '8',
            explanation: 'To find the missing number, divide 24 by 3: 24 ÷ 3 = 8',
            points: 1
          },
          {
            id: '2',
            text: '___ × 7 = 42',
            answer: '6',
            explanation: 'To find the missing number, divide 42 by 7: 42 ÷ 7 = 6',
            points: 1
          },
          {
            id: '3',
            text: '5 × ___ = 45',
            answer: '9',
            explanation: 'To find the missing number, divide 45 by 5: 45 ÷ 5 = 9',
            points: 1
          },
          {
            id: '4',
            text: '___ × 4 = 36',
            answer: '9',
            explanation: 'To find the missing number, divide 36 by 4: 36 ÷ 4 = 9',
            points: 1
          },
          {
            id: '5',
            text: '8 × ___ = 64',
            answer: '8',
            explanation: 'To find the missing number, divide 64 by 8: 64 ÷ 8 = 8',
            points: 1
          },
          {
            id: '6',
            text: '___ × 6 = 54',
            answer: '9',
            explanation: 'To find the missing number, divide 54 by 6: 54 ÷ 6 = 9',
            points: 1
          },
          {
            id: '7',
            text: '7 × ___ = 49',
            answer: '7',
            explanation: 'To find the missing number, divide 49 by 7: 49 ÷ 7 = 7',
            points: 1
          },
          {
            id: '8',
            text: '___ × 9 = 81',
            answer: '9',
            explanation: 'To find the missing number, divide 81 by 9: 81 ÷ 9 = 9',
            points: 1
          },
          {
            id: '9',
            text: '10 × ___ = 70',
            answer: '7',
            explanation: 'To find the missing number, divide 70 by 10: 70 ÷ 10 = 7',
            points: 1
          },
          {
            id: '10',
            text: '___ × 8 = 56',
            answer: '7',
            explanation: 'To find the missing number, divide 56 by 8: 56 ÷ 8 = 7',
            points: 1
          }
        ],
        showFeedbackImmediately: true,
        timeLimit: 15, // minutes
        attempts: 2
      },
      isGradable: true,
      maxScore: 10,
      passingScore: 7,
      weightage: 1.0,
    }
  });

  // 3. Geometry Project (Assessment)
  await prisma.activity.create({
    data: {
      title: 'Geometry Project',
      purpose: ActivityPurpose.ASSESSMENT,
      assessmentType: AssessmentType.PROJECT,
      status: SystemStatus.ACTIVE,
      subjectId: subjectId,
      topicId: shapesTopc.id,
      classId: boysClassId,
      content: {
        activityType: 'project',
        instructions: 'Create a poster showing different 2D shapes and their properties.',
        requirements: [
          'Include at least 5 different shapes',
          'For each shape, list its properties (sides, angles, etc.)',
          'Draw and label each shape clearly',
          'Include at least one real-world example of each shape',
          'Make your poster colorful and neat'
        ],
        rubric: {
          'Content (20 points)': 'Accuracy and completeness of shape information',
          'Presentation (15 points)': 'Neatness, organization, and visual appeal',
          'Creativity (10 points)': 'Unique examples and creative presentation',
          'Effort (5 points)': 'Evidence of time and care taken in creation'
        },
        dueDate: '2024-10-15T00:00:00.000Z'
      },
      isGradable: true,
      maxScore: 50,
      passingScore: 30,
      weightage: 2.0,
    }
  });

  // Create the same project for girls class
  await prisma.activity.create({
    data: {
      title: 'Geometry Project',
      purpose: ActivityPurpose.ASSESSMENT,
      assessmentType: AssessmentType.PROJECT,
      status: SystemStatus.ACTIVE,
      subjectId: subjectId,
      topicId: shapesTopc.id,
      classId: girlsClassId,
      content: {
        activityType: 'project',
        instructions: 'Create a poster showing different 2D shapes and their properties.',
        requirements: [
          'Include at least 5 different shapes',
          'For each shape, list its properties (sides, angles, etc.)',
          'Draw and label each shape clearly',
          'Include at least one real-world example of each shape',
          'Make your poster colorful and neat'
        ],
        rubric: {
          'Content (20 points)': 'Accuracy and completeness of shape information',
          'Presentation (15 points)': 'Neatness, organization, and visual appeal',
          'Creativity (10 points)': 'Unique examples and creative presentation',
          'Effort (5 points)': 'Evidence of time and care taken in creation'
        },
        dueDate: '2024-10-15T00:00:00.000Z'
      },
      isGradable: true,
      maxScore: 50,
      passingScore: 30,
      weightage: 2.0,
    }
  });

  // 4. Geometry Shapes Drag and Drop Activity
  const boysDragAndDropActivity = await prisma.activity.create({
    data: {
      title: 'Geometry Shapes Drag and Drop',
      purpose: ActivityPurpose.ASSESSMENT,
      assessmentType: AssessmentType.QUIZ,
      status: SystemStatus.ACTIVE,
      subjectId: subjectId,
      topicId: shapesTopc.id,
      classId: boysClassId,
      content: {
        activityType: 'drag-and-drop',
        instructions: 'Drag each shape to its correct name and properties.',
        questions: [
          {
            id: '1',
            imageUrl: '/resources/math/geometry-shapes.jpg',
            points: 10,
            explanation: 'Understanding the properties of 2D shapes is essential for geometry.',
            items: [
              {
                id: '1a',
                text: 'Triangle',
                imageUrl: '/resources/math/triangle.jpg',
                feedback: 'A triangle has 3 sides and 3 angles.'
              },
              {
                id: '2a',
                text: 'Square',
                imageUrl: '/resources/math/square.jpg',
                feedback: 'A square has 4 equal sides and 4 right angles.'
              },
              {
                id: '3a',
                text: 'Rectangle',
                imageUrl: '/resources/math/rectangle.jpg',
                feedback: 'A rectangle has 4 sides and 4 right angles, with opposite sides equal.'
              },
              {
                id: '4a',
                text: 'Circle',
                imageUrl: '/resources/math/circle.jpg',
                feedback: 'A circle is a round shape with all points equidistant from the center.'
              },
              {
                id: '5a',
                text: 'Pentagon',
                imageUrl: '/resources/math/pentagon.jpg',
                feedback: 'A pentagon has 5 sides and 5 angles.'
              },
              {
                id: '6a',
                text: 'Hexagon',
                imageUrl: '/resources/math/hexagon.jpg',
                feedback: 'A hexagon has 6 sides and 6 angles.'
              },
              {
                id: '7a',
                text: 'Octagon',
                imageUrl: '/resources/math/octagon.jpg',
                feedback: 'An octagon has 8 sides and 8 angles.'
              },
              {
                id: '8a',
                text: 'Rhombus',
                imageUrl: '/resources/math/rhombus.jpg',
                feedback: 'A rhombus has 4 equal sides with opposite angles equal.'
              },
              {
                id: '9a',
                text: 'Trapezoid',
                imageUrl: '/resources/math/trapezoid.jpg',
                feedback: 'A trapezoid has 4 sides with exactly one pair of parallel sides.'
              },
              {
                id: '10a',
                text: 'Oval',
                imageUrl: '/resources/math/oval.jpg',
                feedback: 'An oval is an elongated circle.'
              }
            ],
            targets: [
              {
                id: 'target1',
                text: '3 sides, 3 angles',
                acceptedItemIds: ['1a']
              },
              {
                id: 'target2',
                text: '4 equal sides, 4 right angles',
                acceptedItemIds: ['2a']
              },
              {
                id: 'target3',
                text: '4 sides, 4 right angles, opposite sides equal',
                acceptedItemIds: ['3a']
              },
              {
                id: 'target4',
                text: 'Round shape, all points equidistant from center',
                acceptedItemIds: ['4a']
              },
              {
                id: 'target5',
                text: '5 sides, 5 angles',
                acceptedItemIds: ['5a']
              },
              {
                id: 'target6',
                text: '6 sides, 6 angles',
                acceptedItemIds: ['6a']
              },
              {
                id: 'target7',
                text: '8 sides, 8 angles',
                acceptedItemIds: ['7a']
              },
              {
                id: 'target8',
                text: '4 equal sides, opposite angles equal',
                acceptedItemIds: ['8a']
              },
              {
                id: 'target9',
                text: '4 sides, exactly one pair of parallel sides',
                acceptedItemIds: ['9a']
              },
              {
                id: 'target10',
                text: 'Elongated circle',
                acceptedItemIds: ['10a']
              }
            ]
          }
        ],
        allowPartialScoring: true,
        showFeedback: true,
        shuffleItems: true,
        timeLimit: 600, // 10 minutes in seconds
        attempts: 2
      },
      isGradable: true,
      maxScore: 10,
      passingScore: 7,
      weightage: 0.1,
    }
  });

  // Create the same drag and drop activity for girls class
  const girlsDragAndDropActivity = await prisma.activity.create({
    data: {
      title: 'Geometry Shapes Drag and Drop',
      purpose: ActivityPurpose.ASSESSMENT,
      assessmentType: AssessmentType.QUIZ,
      status: SystemStatus.ACTIVE,
      subjectId: subjectId,
      topicId: shapesTopc.id,
      classId: girlsClassId,
      content: {
        activityType: 'drag-and-drop',
        instructions: 'Drag each shape to its correct name and properties.',
        questions: [
          {
            id: '1',
            imageUrl: '/resources/math/geometry-shapes.jpg',
            points: 10,
            explanation: 'Understanding the properties of 2D shapes is essential for geometry.',
            items: [
              {
                id: '1a',
                text: 'Triangle',
                imageUrl: '/resources/math/triangle.jpg',
                feedback: 'A triangle has 3 sides and 3 angles.'
              },
              {
                id: '2a',
                text: 'Square',
                imageUrl: '/resources/math/square.jpg',
                feedback: 'A square has 4 equal sides and 4 right angles.'
              },
              {
                id: '3a',
                text: 'Rectangle',
                imageUrl: '/resources/math/rectangle.jpg',
                feedback: 'A rectangle has 4 sides and 4 right angles, with opposite sides equal.'
              },
              {
                id: '4a',
                text: 'Circle',
                imageUrl: '/resources/math/circle.jpg',
                feedback: 'A circle is a round shape with all points equidistant from the center.'
              },
              {
                id: '5a',
                text: 'Pentagon',
                imageUrl: '/resources/math/pentagon.jpg',
                feedback: 'A pentagon has 5 sides and 5 angles.'
              },
              {
                id: '6a',
                text: 'Hexagon',
                imageUrl: '/resources/math/hexagon.jpg',
                feedback: 'A hexagon has 6 sides and 6 angles.'
              },
              {
                id: '7a',
                text: 'Octagon',
                imageUrl: '/resources/math/octagon.jpg',
                feedback: 'An octagon has 8 sides and 8 angles.'
              },
              {
                id: '8a',
                text: 'Rhombus',
                imageUrl: '/resources/math/rhombus.jpg',
                feedback: 'A rhombus has 4 equal sides with opposite angles equal.'
              },
              {
                id: '9a',
                text: 'Trapezoid',
                imageUrl: '/resources/math/trapezoid.jpg',
                feedback: 'A trapezoid has 4 sides with exactly one pair of parallel sides.'
              },
              {
                id: '10a',
                text: 'Oval',
                imageUrl: '/resources/math/oval.jpg',
                feedback: 'An oval is an elongated circle.'
              }
            ],
            targets: [
              {
                id: 'target1',
                text: '3 sides, 3 angles',
                acceptedItemIds: ['1a']
              },
              {
                id: 'target2',
                text: '4 equal sides, 4 right angles',
                acceptedItemIds: ['2a']
              },
              {
                id: 'target3',
                text: '4 sides, 4 right angles, opposite sides equal',
                acceptedItemIds: ['3a']
              },
              {
                id: 'target4',
                text: 'Round shape, all points equidistant from center',
                acceptedItemIds: ['4a']
              },
              {
                id: 'target5',
                text: '5 sides, 5 angles',
                acceptedItemIds: ['5a']
              },
              {
                id: 'target6',
                text: '6 sides, 6 angles',
                acceptedItemIds: ['6a']
              },
              {
                id: 'target7',
                text: '8 sides, 8 angles',
                acceptedItemIds: ['7a']
              },
              {
                id: 'target8',
                text: '4 equal sides, opposite angles equal',
                acceptedItemIds: ['8a']
              },
              {
                id: 'target9',
                text: '4 sides, exactly one pair of parallel sides',
                acceptedItemIds: ['9a']
              },
              {
                id: 'target10',
                text: 'Elongated circle',
                acceptedItemIds: ['10a']
              }
            ]
          }
        ],
        allowPartialScoring: true,
        showFeedback: true,
        shuffleItems: true,
        timeLimit: 600, // 10 minutes in seconds
        attempts: 2
      },
      isGradable: true,
      maxScore: 10,
      passingScore: 7,
      weightage: 0.1,
    }
  });

  // Create some activity grades for the boys' addition and subtraction quiz
  for (const student of boysStudents) {
    // Generate a random score between 12 and 20
    const score = Math.floor(Math.random() * 9) + 12;

    await prisma.activityGrade.create({
      data: {
        activityId: boysAddSubtractQuiz.id,
        studentId: student.id,
        score: score,
        feedback: score >= 18
          ? 'Excellent work! You have a strong understanding of addition and subtraction.'
          : score >= 15
            ? 'Good job! Keep practicing to improve further.'
            : 'You\'ve passed, but need more practice with these concepts.',
        status: SubmissionStatus.GRADED,
        submittedAt: new Date('2024-09-15T10:00:00Z'),
        gradedAt: new Date('2024-09-17T14:00:00Z'),
        content: {
          answers: [
            { questionId: '1', answer: score >= 15 ? '612' : '613' },
            { questionId: '2', answer: score >= 15 ? '345' : '345' },
            { questionId: '3', answer: score >= 15 ? '813' : '813' },
            { questionId: '4', answer: score >= 15 ? '266' : '265' },
            { questionId: '5', answer: score >= 18 ? '158' : '158' },
            { questionId: '6', answer: score >= 18 ? '435' : '435' },
            { questionId: '7', answer: score >= 15 ? '233' : '233' },
            { questionId: '8', answer: score >= 15 ? '800' : '801' },
          ]
        }
      }
    });
  }

  // Create some activity grades for the girls' addition and subtraction quiz
  for (const student of girlsStudents) {
    // Generate a random score between 13 and 20
    const score = Math.floor(Math.random() * 8) + 13;

    await prisma.activityGrade.create({
      data: {
        activityId: girlsAddSubtractQuiz.id,
        studentId: student.id,
        score: score,
        feedback: score >= 18
          ? 'Excellent work! You have a strong understanding of addition and subtraction.'
          : score >= 15
            ? 'Good job! Keep practicing to improve further.'
            : 'You\'ve passed, but need more practice with these concepts.',
        status: SubmissionStatus.GRADED,
        submittedAt: new Date('2024-09-15T10:00:00Z'),
        gradedAt: new Date('2024-09-17T14:00:00Z'),
        content: {
          answers: [
            { questionId: '1', answer: score >= 15 ? '612' : '612' },
            { questionId: '2', answer: score >= 15 ? '345' : '345' },
            { questionId: '3', answer: score >= 15 ? '813' : '813' },
            { questionId: '4', answer: score >= 15 ? '266' : '266' },
            { questionId: '5', answer: score >= 18 ? '158' : '157' },
            { questionId: '6', answer: score >= 18 ? '435' : '435' },
            { questionId: '7', answer: score >= 15 ? '233' : '233' },
            { questionId: '8', answer: score >= 15 ? '800' : '800' },
          ]
        }
      }
    });
  }
}

async function seedEnglishActivities(
  prisma: PrismaClient,
  subjectId: string,
  topics: any[],
  boysClassId: string,
  girlsClassId: string,
  boysStudents: any[],
  girlsStudents: any[]
) {
  console.log('Seeding English activities...');

  // Find specific topics
  const storyElementsTopic = topics.find(t => t.code === 'PYP-CL3-ENG-CH1-T1');

  if (!storyElementsTopic) {
    console.warn('English topics not found. Skipping English activities seeding.');
    return;
  }

  // 1. Reading Comprehension Test
  const boysReadingTest = await prisma.activity.create({
    data: {
      title: 'Reading Comprehension Test',
      purpose: ActivityPurpose.ASSESSMENT,
      assessmentType: AssessmentType.EXAM,
      status: SystemStatus.ACTIVE,
      subjectId: subjectId,
      topicId: storyElementsTopic.id,
      classId: boysClassId,
      content: {
        activityType: 'multiple-choice',
        instructions: 'Read the story carefully and answer the questions that follow.',
        story: `The Lost Puppy\n\nSam was walking home from school when he heard a small whimper coming from the bushes. He looked around and saw a tiny brown puppy with a white spot on its ear. The puppy looked scared and hungry.\n\nSam picked up the puppy and looked for a collar, but there wasn't one. He decided to take the puppy home and ask his parents for help. His mother suggested they put up "Found Puppy" posters around the neighborhood.\n\nThe next day, a girl named Maya called. She had lost her puppy named Spot. She described the puppy, and it matched exactly. Sam was sad to give up the puppy, but he knew it was the right thing to do.\n\nWhen Maya came to pick up Spot, she was so happy that she invited Sam to come visit the puppy anytime. Sam and Maya became good friends, and Sam visited Spot every week.`,
        questions: [
          {
            id: '1',
            text: 'Where did Sam find the puppy?',
            options: [
              'In the park',
              'In the bushes',
              'On the sidewalk',
              'At school'
            ],
            answer: 1,
            points: 2
          },
          {
            id: '2',
            text: 'What was special about the puppy\'s appearance?',
            options: [
              'It had a black tail',
              'It had a white spot on its ear',
              'It had blue eyes',
              'It had a red collar'
            ],
            answer: 1,
            points: 2
          },
          {
            id: '3',
            text: 'What did Sam\'s mother suggest they do?',
            options: [
              'Take the puppy to a shelter',
              'Keep the puppy',
              'Put up "Found Puppy" posters',
              'Call the police'
            ],
            answer: 2,
            points: 2
          },
          {
            id: '4',
            text: 'Who was the owner of the puppy?',
            options: [
              'Sam',
              'Maya',
              'Sam\'s mother',
              'A neighbor'
            ],
            answer: 1,
            points: 2
          },
          {
            id: '5',
            text: 'What was the puppy\'s name?',
            options: [
              'Brownie',
              'Spot',
              'Fluffy',
              'Lucky'
            ],
            answer: 1,
            points: 2
          },
          {
            id: '6',
            text: 'How did Sam feel about giving the puppy back?',
            answer: 'Sam was sad to give up the puppy, but he knew it was the right thing to do.',
            points: 5
          },
          {
            id: '7',
            text: 'What happened after Sam returned the puppy?',
            answer: 'Maya invited Sam to visit the puppy anytime. Sam and Maya became good friends, and Sam visited Spot every week.',
            points: 5
          },
          {
            id: '8',
            text: 'What is the main lesson of this story?',
            answer: 'The main lesson is about doing the right thing even when it\'s difficult, and how good deeds can lead to new friendships.',
            points: 5
          }
        ]
      },
      isGradable: true,
      maxScore: 25,
      passingScore: 15,
      weightage: 1.5,
    }
  });

  // Create the same test for girls class
  const girlsReadingTest = await prisma.activity.create({
    data: {
      title: 'Reading Comprehension Test',
      purpose: ActivityPurpose.ASSESSMENT,
      assessmentType: AssessmentType.EXAM,
      status: SystemStatus.ACTIVE,
      subjectId: subjectId,
      topicId: storyElementsTopic.id,
      classId: girlsClassId,
      content: {
        activityType: 'multiple-choice',
        instructions: 'Read the story carefully and answer the questions that follow.',
        story: `The Lost Puppy\n\nSam was walking home from school when he heard a small whimper coming from the bushes. He looked around and saw a tiny brown puppy with a white spot on its ear. The puppy looked scared and hungry.\n\nSam picked up the puppy and looked for a collar, but there wasn't one. He decided to take the puppy home and ask his parents for help. His mother suggested they put up "Found Puppy" posters around the neighborhood.\n\nThe next day, a girl named Maya called. She had lost her puppy named Spot. She described the puppy, and it matched exactly. Sam was sad to give up the puppy, but he knew it was the right thing to do.\n\nWhen Maya came to pick up Spot, she was so happy that she invited Sam to come visit the puppy anytime. Sam and Maya became good friends, and Sam visited Spot every week.`,
        questions: [
          {
            id: '1',
            text: 'Where did Sam find the puppy?',
            options: [
              'In the park',
              'In the bushes',
              'On the sidewalk',
              'At school'
            ],
            answer: 1,
            points: 2
          },
          {
            id: '2',
            text: 'What was special about the puppy\'s appearance?',
            options: [
              'It had a black tail',
              'It had a white spot on its ear',
              'It had blue eyes',
              'It had a red collar'
            ],
            answer: 1,
            points: 2
          },
          {
            id: '3',
            text: 'What did Sam\'s mother suggest they do?',
            options: [
              'Take the puppy to a shelter',
              'Keep the puppy',
              'Put up "Found Puppy" posters',
              'Call the police'
            ],
            answer: 2,
            points: 2
          },
          {
            id: '4',
            text: 'Who was the owner of the puppy?',
            options: [
              'Sam',
              'Maya',
              'Sam\'s mother',
              'A neighbor'
            ],
            answer: 1,
            points: 2
          },
          {
            id: '5',
            text: 'What was the puppy\'s name?',
            options: [
              'Brownie',
              'Spot',
              'Fluffy',
              'Lucky'
            ],
            answer: 1,
            points: 2
          },
          {
            id: '6',
            text: 'How did Sam feel about giving the puppy back?',
            answer: 'Sam was sad to give up the puppy, but he knew it was the right thing to do.',
            points: 5
          },
          {
            id: '7',
            text: 'What happened after Sam returned the puppy?',
            answer: 'Maya invited Sam to visit the puppy anytime. Sam and Maya became good friends, and Sam visited Spot every week.',
            points: 5
          },
          {
            id: '8',
            text: 'What is the main lesson of this story?',
            answer: 'The main lesson is about doing the right thing even when it\'s difficult, and how good deeds can lead to new friendships.',
            points: 5
          }
        ]
      },
      isGradable: true,
      maxScore: 25,
      passingScore: 15,
      weightage: 1.5,
    }
  });

  // Create some activity grades for the boys' reading test
  for (const student of boysStudents) {
    // Generate a random score between 14 and 25
    const score = Math.floor(Math.random() * 12) + 14;

    await prisma.activityGrade.create({
      data: {
        activityId: boysReadingTest.id,
        studentId: student.id,
        score: score,
        feedback: score >= 22
          ? 'Excellent reading comprehension skills! Your understanding of the story elements is outstanding.'
          : score >= 18
            ? 'Good job! You have a solid understanding of the story, but could improve on analyzing deeper themes.'
            : 'You\'ve demonstrated basic comprehension, but need to work on identifying key details and themes.',
        status: SubmissionStatus.GRADED,
        submittedAt: new Date('2024-09-20T10:00:00Z'),
        gradedAt: new Date('2024-09-22T14:00:00Z'),
      }
    });
  }

  // Create some activity grades for the girls' reading test
  for (const student of girlsStudents) {
    // Generate a random score between 15 and 25
    const score = Math.floor(Math.random() * 11) + 15;

    await prisma.activityGrade.create({
      data: {
        activityId: girlsReadingTest.id,
        studentId: student.id,
        score: score,
        feedback: score >= 22
          ? 'Excellent reading comprehension skills! Your understanding of the story elements is outstanding.'
          : score >= 18
            ? 'Good job! You have a solid understanding of the story, but could improve on analyzing deeper themes.'
            : 'You\'ve demonstrated basic comprehension, but need to work on identifying key details and themes.',
        status: SubmissionStatus.GRADED,
        submittedAt: new Date('2024-09-20T10:00:00Z'),
        gradedAt: new Date('2024-09-22T14:00:00Z'),
      }
    });
  }

  // 2. Grammar True/False Quiz
  const boysTrueFalseQuiz = await prisma.activity.create({
    data: {
      title: 'Grammar True/False Quiz',
      purpose: ActivityPurpose.ASSESSMENT,
      assessmentType: AssessmentType.QUIZ,
      status: SystemStatus.ACTIVE,
      subjectId: subjectId,
      topicId: storyElementsTopic.id,
      classId: boysClassId,
      content: {
        activityType: 'true-false',
        instructions: 'Read each statement carefully and decide whether it is true or false.',
        questions: [
          {
            id: '1',
            text: 'A noun is a word that describes an action.',
            answer: false,
            explanation: 'False. A noun is a word that names a person, place, thing, or idea. Verbs describe actions.',
            points: 1
          },
          {
            id: '2',
            text: 'A sentence must have a subject and a verb.',
            answer: true,
            explanation: 'True. A complete sentence requires at least a subject (who or what the sentence is about) and a verb (the action or state of being).',
            points: 1
          },
          {
            id: '3',
            text: 'Adjectives describe verbs.',
            answer: false,
            explanation: 'False. Adjectives describe nouns or pronouns. Adverbs describe verbs, adjectives, or other adverbs.',
            points: 1
          },
          {
            id: '4',
            text: 'A proper noun always starts with a capital letter.',
            answer: true,
            explanation: 'True. Proper nouns name specific people, places, or things and always begin with capital letters.',
            points: 1
          },
          {
            id: '5',
            text: 'A verb is a word that shows action or state of being.',
            answer: true,
            explanation: 'True. Verbs can show action (run, jump) or state of being (is, are, was).',
            points: 1
          },
          {
            id: '6',
            text: 'A pronoun replaces an adjective in a sentence.',
            answer: false,
            explanation: 'False. A pronoun replaces a noun or noun phrase, not an adjective.',
            points: 1
          },
          {
            id: '7',
            text: 'Every sentence ends with a period.',
            answer: false,
            explanation: 'False. Sentences can end with periods, question marks, or exclamation points depending on the type of sentence.',
            points: 1
          },
          {
            id: '8',
            text: 'A compound sentence contains two independent clauses joined by a conjunction.',
            answer: true,
            explanation: 'True. A compound sentence has two independent clauses (complete thoughts) joined by a coordinating conjunction like "and," "but," or "or."',
            points: 1
          },
          {
            id: '9',
            text: 'Adverbs can modify adjectives.',
            answer: true,
            explanation: 'True. Adverbs can modify verbs, adjectives, or other adverbs. For example, "very happy" - "very" is an adverb modifying the adjective "happy."',
            points: 1
          },
          {
            id: '10',
            text: 'A preposition always comes at the end of a sentence.',
            answer: false,
            explanation: 'False. Prepositions typically come before nouns or pronouns to show relationship, but they can appear in various positions in a sentence.',
            points: 1
          }
        ],
        showFeedbackImmediately: true,
        timeLimit: 10, // minutes
        attempts: 2
      },
      isGradable: true,
      maxScore: 10,
      passingScore: 6,
      weightage: 1.0,
    }
  });

  // Create the same true/false quiz for girls class
  const girlsTrueFalseQuiz = await prisma.activity.create({
    data: {
      title: 'Grammar True/False Quiz',
      purpose: ActivityPurpose.ASSESSMENT,
      assessmentType: AssessmentType.QUIZ,
      status: SystemStatus.ACTIVE,
      subjectId: subjectId,
      topicId: storyElementsTopic.id,
      classId: girlsClassId,
      content: {
        activityType: 'true-false',
        instructions: 'Read each statement carefully and decide whether it is true or false.',
        questions: [
          {
            id: '1',
            text: 'A noun is a word that describes an action.',
            answer: false,
            explanation: 'False. A noun is a word that names a person, place, thing, or idea. Verbs describe actions.',
            points: 1
          },
          {
            id: '2',
            text: 'A sentence must have a subject and a verb.',
            answer: true,
            explanation: 'True. A complete sentence requires at least a subject (who or what the sentence is about) and a verb (the action or state of being).',
            points: 1
          },
          {
            id: '3',
            text: 'Adjectives describe verbs.',
            answer: false,
            explanation: 'False. Adjectives describe nouns or pronouns. Adverbs describe verbs, adjectives, or other adverbs.',
            points: 1
          },
          {
            id: '4',
            text: 'A proper noun always starts with a capital letter.',
            answer: true,
            explanation: 'True. Proper nouns name specific people, places, or things and always begin with capital letters.',
            points: 1
          },
          {
            id: '5',
            text: 'A verb is a word that shows action or state of being.',
            answer: true,
            explanation: 'True. Verbs can show action (run, jump) or state of being (is, are, was).',
            points: 1
          },
          {
            id: '6',
            text: 'A pronoun replaces an adjective in a sentence.',
            answer: false,
            explanation: 'False. A pronoun replaces a noun or noun phrase, not an adjective.',
            points: 1
          },
          {
            id: '7',
            text: 'Every sentence ends with a period.',
            answer: false,
            explanation: 'False. Sentences can end with periods, question marks, or exclamation points depending on the type of sentence.',
            points: 1
          },
          {
            id: '8',
            text: 'A compound sentence contains two independent clauses joined by a conjunction.',
            answer: true,
            explanation: 'True. A compound sentence has two independent clauses (complete thoughts) joined by a coordinating conjunction like "and," "but," or "or."',
            points: 1
          },
          {
            id: '9',
            text: 'Adverbs can modify adjectives.',
            answer: true,
            explanation: 'True. Adverbs can modify verbs, adjectives, or other adverbs. For example, "very happy" - "very" is an adverb modifying the adjective "happy."',
            points: 1
          },
          {
            id: '10',
            text: 'A preposition always comes at the end of a sentence.',
            answer: false,
            explanation: 'False. Prepositions typically come before nouns or pronouns to show relationship, but they can appear in various positions in a sentence.',
            points: 1
          }
        ],
        showFeedbackImmediately: true,
        timeLimit: 10, // minutes
        attempts: 2
      },
      isGradable: true,
      maxScore: 10,
      passingScore: 6,
      weightage: 1.0,
    }
  });

  // 3. Grammar Drag the Words Activity
  const boysDragTheWordsActivity = await prisma.activity.create({
    data: {
      title: 'Grammar Drag the Words Activity',
      purpose: ActivityPurpose.ASSESSMENT,
      assessmentType: AssessmentType.QUIZ,
      status: SystemStatus.ACTIVE,
      subjectId: subjectId,
      topicId: storyElementsTopic.id,
      classId: boysClassId,
      content: {
        activityType: 'drag-the-words',
        instructions: 'Drag the words to fill in the blanks in the sentences.',
        questions: [
          {
            id: '1',
            textWithBlanks: 'The [quick] brown fox [jumps] over the [lazy] dog.',
            words: [
              {
                id: '1a',
                text: 'quick',
                isDistractor: false
              },
              {
                id: '2a',
                text: 'jumps',
                isDistractor: false
              },
              {
                id: '3a',
                text: 'lazy',
                isDistractor: false
              },
              {
                id: '4a',
                text: 'slow',
                isDistractor: true
              },
              {
                id: '5a',
                text: 'runs',
                isDistractor: true
              }
            ],
            points: 3,
            explanation: 'The quick brown fox jumps over the lazy dog is a pangram - a sentence that contains every letter of the alphabet.'
          },
          {
            id: '2',
            textWithBlanks: 'A [noun] is a person, place, thing, or [idea], while a [verb] shows action or state of being.',
            words: [
              {
                id: '1b',
                text: 'noun',
                isDistractor: false
              },
              {
                id: '2b',
                text: 'idea',
                isDistractor: false
              },
              {
                id: '3b',
                text: 'verb',
                isDistractor: false
              },
              {
                id: '4b',
                text: 'adjective',
                isDistractor: true
              },
              {
                id: '5b',
                text: 'adverb',
                isDistractor: true
              }
            ],
            points: 3,
            explanation: 'Understanding parts of speech is essential for grammar.'
          },
          {
            id: '3',
            textWithBlanks: 'An [adjective] describes a noun, while an [adverb] can modify a verb, adjective, or another adverb.',
            words: [
              {
                id: '1c',
                text: 'adjective',
                isDistractor: false
              },
              {
                id: '2c',
                text: 'adverb',
                isDistractor: false
              },
              {
                id: '3c',
                text: 'pronoun',
                isDistractor: true
              },
              {
                id: '4c',
                text: 'preposition',
                isDistractor: true
              }
            ],
            points: 2,
            explanation: 'Adjectives and adverbs are modifiers that add description to sentences.'
          },
          {
            id: '4',
            textWithBlanks: 'A [complete] sentence must have a [subject] and a [predicate].',
            words: [
              {
                id: '1d',
                text: 'complete',
                isDistractor: false
              },
              {
                id: '2d',
                text: 'subject',
                isDistractor: false
              },
              {
                id: '3d',
                text: 'predicate',
                isDistractor: false
              },
              {
                id: '4d',
                text: 'complex',
                isDistractor: true
              },
              {
                id: '5d',
                text: 'object',
                isDistractor: true
              }
            ],
            points: 3,
            explanation: 'A complete sentence requires a subject (who or what the sentence is about) and a predicate (which contains the verb and tells something about the subject).'
          },
          {
            id: '5',
            textWithBlanks: 'A [compound] sentence contains two independent clauses joined by a [conjunction] like "and," "but," or "or."',
            words: [
              {
                id: '1e',
                text: 'compound',
                isDistractor: false
              },
              {
                id: '2e',
                text: 'conjunction',
                isDistractor: false
              },
              {
                id: '3e',
                text: 'complex',
                isDistractor: true
              },
              {
                id: '4e',
                text: 'preposition',
                isDistractor: true
              }
            ],
            points: 2,
            explanation: 'Compound sentences join two complete thoughts with coordinating conjunctions.'
          }
        ],
        allowPartialScoring: true,
        showFeedback: true,
        shuffleWords: true,
        timeLimit: 600, // 10 minutes in seconds
        attempts: 2
      },
      isGradable: true,
      maxScore: 13,
      passingScore: 9,
      weightage: 1.0,
    }
  });

  // Create the same drag the words activity for girls class
  const girlsDragTheWordsActivity = await prisma.activity.create({
    data: {
      title: 'Grammar Drag the Words Activity',
      purpose: ActivityPurpose.ASSESSMENT,
      assessmentType: AssessmentType.QUIZ,
      status: SystemStatus.ACTIVE,
      subjectId: subjectId,
      topicId: storyElementsTopic.id,
      classId: girlsClassId,
      content: {
        activityType: 'drag-the-words',
        instructions: 'Drag the words to fill in the blanks in the sentences.',
        questions: [
          {
            id: '1',
            textWithBlanks: 'The [quick] brown fox [jumps] over the [lazy] dog.',
            words: [
              {
                id: '1a',
                text: 'quick',
                isDistractor: false
              },
              {
                id: '2a',
                text: 'jumps',
                isDistractor: false
              },
              {
                id: '3a',
                text: 'lazy',
                isDistractor: false
              },
              {
                id: '4a',
                text: 'slow',
                isDistractor: true
              },
              {
                id: '5a',
                text: 'runs',
                isDistractor: true
              }
            ],
            points: 3,
            explanation: 'The quick brown fox jumps over the lazy dog is a pangram - a sentence that contains every letter of the alphabet.'
          },
          {
            id: '2',
            textWithBlanks: 'A [noun] is a person, place, thing, or [idea], while a [verb] shows action or state of being.',
            words: [
              {
                id: '1b',
                text: 'noun',
                isDistractor: false
              },
              {
                id: '2b',
                text: 'idea',
                isDistractor: false
              },
              {
                id: '3b',
                text: 'verb',
                isDistractor: false
              },
              {
                id: '4b',
                text: 'adjective',
                isDistractor: true
              },
              {
                id: '5b',
                text: 'adverb',
                isDistractor: true
              }
            ],
            points: 3,
            explanation: 'Understanding parts of speech is essential for grammar.'
          },
          {
            id: '3',
            textWithBlanks: 'An [adjective] describes a noun, while an [adverb] can modify a verb, adjective, or another adverb.',
            words: [
              {
                id: '1c',
                text: 'adjective',
                isDistractor: false
              },
              {
                id: '2c',
                text: 'adverb',
                isDistractor: false
              },
              {
                id: '3c',
                text: 'pronoun',
                isDistractor: true
              },
              {
                id: '4c',
                text: 'preposition',
                isDistractor: true
              }
            ],
            points: 2,
            explanation: 'Adjectives and adverbs are modifiers that add description to sentences.'
          },
          {
            id: '4',
            textWithBlanks: 'A [complete] sentence must have a [subject] and a [predicate].',
            words: [
              {
                id: '1d',
                text: 'complete',
                isDistractor: false
              },
              {
                id: '2d',
                text: 'subject',
                isDistractor: false
              },
              {
                id: '3d',
                text: 'predicate',
                isDistractor: false
              },
              {
                id: '4d',
                text: 'complex',
                isDistractor: true
              },
              {
                id: '5d',
                text: 'object',
                isDistractor: true
              }
            ],
            points: 3,
            explanation: 'A complete sentence requires a subject (who or what the sentence is about) and a predicate (which contains the verb and tells something about the subject).'
          },
          {
            id: '5',
            textWithBlanks: 'A [compound] sentence contains two independent clauses joined by a [conjunction] like "and," "but," or "or."',
            words: [
              {
                id: '1e',
                text: 'compound',
                isDistractor: false
              },
              {
                id: '2e',
                text: 'conjunction',
                isDistractor: false
              },
              {
                id: '3e',
                text: 'complex',
                isDistractor: true
              },
              {
                id: '4e',
                text: 'preposition',
                isDistractor: true
              }
            ],
            points: 2,
            explanation: 'Compound sentences join two complete thoughts with coordinating conjunctions.'
          }
        ],
        allowPartialScoring: true,
        showFeedback: true,
        shuffleWords: true,
        timeLimit: 600, // 10 minutes in seconds
        attempts: 2
      },
      isGradable: true,
      maxScore: 13,
      passingScore: 9,
      weightage: 1.0,
    }
  });
}

async function seedScienceActivities(
  prisma: PrismaClient,
  subjectId: string,
  topics: any[],
  boysClassId: string,
  girlsClassId: string,
  boysStudents: any[],
  girlsStudents: any[]
) {
  console.log('Seeding Science activities...');

  // Find specific topics
  const plantsTopic = topics.find(t => t.code === 'PYP-CL3-SCI-CH1-T1');
  const animalsTopic = topics.find(t => t.code === 'PYP-CL3-SCI-CH1-T2');
  const solarSystemTopic = topics.find(t => t.code === 'PYP-CL3-SCI-CH2-T1');

  if (!plantsTopic || !animalsTopic || !solarSystemTopic) {
    console.warn('Science topics not found. Skipping science activities seeding.');
    return;
  }

  // 1. Plant Life Cycle Project
  const boysPlantProject = await prisma.activity.create({
    data: {
      title: 'Plant Life Cycle Project',
      purpose: ActivityPurpose.ASSESSMENT,
      assessmentType: AssessmentType.PROJECT,
      status: SystemStatus.ACTIVE,
      subjectId: subjectId,
      topicId: plantsTopic.id,
      classId: boysClassId,
      content: {
        instructions: 'Grow a bean plant and document its growth over two weeks.',
        requirements: [
          'Plant a bean seed in a clear cup with soil',
          'Water it regularly and place it in sunlight',
          'Take photos every 2-3 days',
          'Create a journal documenting the changes you observe',
          'Draw and label the parts of your plant',
          'Explain the life cycle of your plant'
        ],
        rubric: {
          'Documentation (15 points)': 'Regular and detailed observations',
          'Understanding (15 points)': 'Correct identification of plant parts and life cycle stages',
          'Presentation (10 points)': 'Neatness, organization, and visual appeal',
          'Plant Care (10 points)': 'Evidence of proper care and successful growth'
        },
        dueDate: '2024-10-20T00:00:00.000Z'
      },
      isGradable: true,
      maxScore: 50,
      passingScore: 30,
      weightage: 2.0,
    }
  });

  // Create the same project for girls class
  const girlsPlantProject = await prisma.activity.create({
    data: {
      title: 'Plant Life Cycle Project',
      purpose: ActivityPurpose.ASSESSMENT,
      assessmentType: AssessmentType.PROJECT,
      status: SystemStatus.ACTIVE,
      subjectId: subjectId,
      topicId: plantsTopic.id,
      classId: girlsClassId,
      content: {
        instructions: 'Grow a bean plant and document its growth over two weeks.',
        requirements: [
          'Plant a bean seed in a clear cup with soil',
          'Water it regularly and place it in sunlight',
          'Take photos every 2-3 days',
          'Create a journal documenting the changes you observe',
          'Draw and label the parts of your plant',
          'Explain the life cycle of your plant'
        ],
        rubric: {
          'Documentation (15 points)': 'Regular and detailed observations',
          'Understanding (15 points)': 'Correct identification of plant parts and life cycle stages',
          'Presentation (10 points)': 'Neatness, organization, and visual appeal',
          'Plant Care (10 points)': 'Evidence of proper care and successful growth'
        },
        dueDate: '2024-10-20T00:00:00.000Z'
      },
      isGradable: true,
      maxScore: 50,
      passingScore: 30,
      weightage: 2.0,
    }
  });

  // 2. Animal Classification Quiz
  const boysAnimalQuiz = await prisma.activity.create({
    data: {
      title: 'Animal Classification Quiz',
      purpose: ActivityPurpose.ASSESSMENT,
      assessmentType: AssessmentType.QUIZ,
      status: SystemStatus.ACTIVE,
      subjectId: subjectId,
      topicId: animalsTopic.id,
      classId: boysClassId,
      content: {
        instructions: 'Answer all questions about animal classification.',
        questions: [
          {
            id: '1',
            text: 'Which of these animals is a mammal?',
            options: [
              'Fish',
              'Frog',
              'Dolphin',
              'Snake'
            ],
            answer: 2,
            points: 2
          },
          {
            id: '2',
            text: 'Which of these animals is a bird?',
            options: [
              'Bat',
              'Penguin',
              'Butterfly',
              'Flying squirrel'
            ],
            answer: 1,
            points: 2
          },
          {
            id: '3',
            text: 'Which of these animals is a reptile?',
            options: [
              'Frog',
              'Salamander',
              'Turtle',
              'Fish'
            ],
            answer: 2,
            points: 2
          },
          {
            id: '4',
            text: 'Which of these animals is an amphibian?',
            options: [
              'Lizard',
              'Toad',
              'Snake',
              'Crocodile'
            ],
            answer: 1,
            points: 2
          },
          {
            id: '5',
            text: 'List three characteristics of mammals.',
            answer: 'Mammals have hair/fur, produce milk for their young, and are warm-blooded.',
            points: 4
          },
          {
            id: '6',
            text: 'Explain the difference between cold-blooded and warm-blooded animals.',
            answer: 'Cold-blooded animals cannot regulate their body temperature internally and depend on the environment to warm up or cool down. Warm-blooded animals can maintain a constant body temperature regardless of the environment.',
            points: 4
          },
          {
            id: '7',
            text: 'Name three animals that lay eggs but are not birds.',
            answer: 'Examples include: reptiles (snakes, turtles, lizards), amphibians (frogs, toads), fish, insects, and some mammals (platypus, echidna).',
            points: 4
          }
        ]
      },
      isGradable: true,
      maxScore: 20,
      passingScore: 12,
      weightage: 1.0,
    }
  });

  // Create the same quiz for girls class
  const girlsAnimalQuiz = await prisma.activity.create({
    data: {
      title: 'Animal Classification Quiz',
      purpose: ActivityPurpose.ASSESSMENT,
      assessmentType: AssessmentType.QUIZ,
      status: SystemStatus.ACTIVE,
      subjectId: subjectId,
      topicId: animalsTopic.id,
      classId: girlsClassId,
      content: {
        instructions: 'Answer all questions about animal classification.',
        questions: [
          {
            id: '1',
            text: 'Which of these animals is a mammal?',
            options: [
              'Fish',
              'Frog',
              'Dolphin',
              'Snake'
            ],
            answer: 2,
            points: 2
          },
          {
            id: '2',
            text: 'Which of these animals is a bird?',
            options: [
              'Bat',
              'Penguin',
              'Butterfly',
              'Flying squirrel'
            ],
            answer: 1,
            points: 2
          },
          {
            id: '3',
            text: 'Which of these animals is a reptile?',
            options: [
              'Frog',
              'Salamander',
              'Turtle',
              'Fish'
            ],
            answer: 2,
            points: 2
          },
          {
            id: '4',
            text: 'Which of these animals is an amphibian?',
            options: [
              'Lizard',
              'Toad',
              'Snake',
              'Crocodile'
            ],
            answer: 1,
            points: 2
          },
          {
            id: '5',
            text: 'List three characteristics of mammals.',
            answer: 'Mammals have hair/fur, produce milk for their young, and are warm-blooded.',
            points: 4
          },
          {
            id: '6',
            text: 'Explain the difference between cold-blooded and warm-blooded animals.',
            answer: 'Cold-blooded animals cannot regulate their body temperature internally and depend on the environment to warm up or cool down. Warm-blooded animals can maintain a constant body temperature regardless of the environment.',
            points: 4
          },
          {
            id: '7',
            text: 'Name three animals that lay eggs but are not birds.',
            answer: 'Examples include: reptiles (snakes, turtles, lizards), amphibians (frogs, toads), fish, insects, and some mammals (platypus, echidna).',
            points: 4
          }
        ]
      },
      isGradable: true,
      maxScore: 20,
      passingScore: 12,
      weightage: 1.0,
    }
  });

  // 2. Solar System Document Activity
  await prisma.activity.create({
    data: {
      title: 'Solar System Document Activity',
      purpose: ActivityPurpose.LEARNING,
      learningType: LearningActivityType.SELF_STUDY,
      status: SystemStatus.ACTIVE,
      subjectId: subjectId,
      topicId: solarSystemTopic.id,
      classId: boysClassId,
      content: {
        activityType: 'document',
        instructions: 'Read the following document about our solar system and complete the activities.',
        document: {
          title: 'Our Amazing Solar System',
          content: `# Our Amazing Solar System

## Introduction
The solar system consists of the Sun and everything that orbits around it, including planets, dwarf planets, moons, asteroids, comets, and meteoroids. The Sun is at the center of our solar system and provides the light and heat that makes life possible on Earth.

## The Sun
The Sun is a medium-sized star that contains 99.8% of all the mass in our solar system. It's about 109 times wider than Earth and could fit about 1.3 million Earths inside it! The Sun is made mostly of hydrogen and helium gas.

## The Planets

### Inner Planets (Terrestrial Planets)

1. **Mercury**
   - Smallest planet in our solar system
   - Closest to the Sun
   - Has no atmosphere to protect it
   - Temperature ranges from extremely hot to extremely cold

2. **Venus**
   - Similar in size to Earth
   - Hottest planet due to its thick atmosphere
   - Rotates in the opposite direction compared to most planets
   - Often called Earth's "sister planet"

3. **Earth**
   - Our home planet
   - Only planet known to have life
   - Has one natural satellite (the Moon)
   - Has liquid water on its surface

4. **Mars**
   - Known as the "Red Planet"
   - Has polar ice caps
   - Has the largest volcano in the solar system (Olympus Mons)
   - Scientists are studying if it could support human life in the future

### Outer Planets (Gas Giants and Ice Giants)

5. **Jupiter**
   - Largest planet in our solar system
   - Has a Great Red Spot (a giant storm)
   - Has at least 79 moons
   - Made mostly of hydrogen and helium

6. **Saturn**
   - Known for its beautiful rings
   - Second-largest planet
   - Has at least 82 moons
   - Would float in water (if there was a bathtub big enough!)

7. **Uranus**
   - Rotates on its side
   - Appears blue-green due to methane in its atmosphere
   - Has 27 known moons
   - Coldest planetary atmosphere in the solar system

8. **Neptune**
   - Windiest planet with storms reaching 1,200 mph
   - Has 14 known moons
   - Appears blue due to methane in its atmosphere
   - Takes 165 Earth years to orbit the Sun

## Beyond the Planets

### Dwarf Planets
Pluto, Ceres, Eris, Haumea, and Makemake are classified as dwarf planets. Pluto was once considered the ninth planet but was reclassified in 2006.

### Asteroids and Comets
Asteroids are rocky objects that orbit the Sun, mostly found in the asteroid belt between Mars and Jupiter. Comets are icy bodies that release gas and dust when they get close to the Sun, creating a visible tail.

## Space Exploration
Humans have sent spacecraft to study all the planets in our solar system. Some notable missions include:
- The Voyager missions, which have now left our solar system
- The Mars rovers exploring the surface of Mars
- The New Horizons mission to Pluto
- The Juno mission studying Jupiter

## Conclusion
Our solar system is an amazing place with diverse worlds to explore. Scientists continue to make new discoveries about our cosmic neighborhood every day!`,
          attachments: [
            {
              type: 'image',
              title: 'Solar System Diagram',
              url: '/resources/science/solar-system-diagram.jpg'
            },
            {
              type: 'video',
              title: 'Our Solar System',
              url: 'https://example.com/videos/our-solar-system'
            }
          ]
        },
        activities: [
          {
            title: 'Create a planet fact card',
            description: 'Choose one planet and create a fact card with at least 5 interesting facts from the document.'
          },
          {
            title: 'Order the planets',
            description: 'Arrange the planets in order from closest to farthest from the sun.'
          },
          {
            title: 'Compare and contrast',
            description: 'Create a Venn diagram comparing the inner planets and outer planets.'
          },
          {
            title: 'Research project',
            description: 'Choose one space mission mentioned in the document and research more details about its discoveries.'
          }
        ],
        checkpoints: [
          {
            title: 'Reading Checkpoint 1',
            question: 'What percentage of the solar system\'s mass is contained in the Sun?',
            answer: '99.8%',
            hint: 'Look in the section about the Sun.'
          },
          {
            title: 'Reading Checkpoint 2',
            question: 'Which planet is known as Earth\'s "sister planet"?',
            answer: 'Venus',
            hint: 'Check the information about the inner planets.'
          },
          {
            title: 'Reading Checkpoint 3',
            question: 'How many moons does Jupiter have?',
            answer: 'at least 79',
            hint: 'Look in the section about Jupiter.'
          }
        ]
      },
      isGradable: false,
    }
  });

  // 3. Solar System Matching Activity
  await prisma.activity.create({
    data: {
      title: 'Solar System Matching Activity',
      purpose: ActivityPurpose.ASSESSMENT,
      assessmentType: AssessmentType.QUIZ,
      status: SystemStatus.ACTIVE,
      subjectId: subjectId,
      topicId: solarSystemTopic.id,
      classId: boysClassId,
      content: {
        activityType: 'matching',
        instructions: 'Match each planet with its correct description or characteristic.',
        pairs: [
          {
            id: '1',
            left: 'Mercury',
            right: 'The smallest planet and closest to the Sun',
            explanation: 'Mercury is the smallest planet in our solar system and the closest to the Sun.'
          },
          {
            id: '2',
            left: 'Venus',
            right: 'The hottest planet with thick clouds of sulfuric acid',
            explanation: 'Venus has a thick atmosphere that traps heat, making it the hottest planet in our solar system.'
          },
          {
            id: '3',
            left: 'Earth',
            right: 'The only planet known to support life',
            explanation: 'Earth is the only planet in our solar system known to have liquid water and support life.'
          },
          {
            id: '4',
            left: 'Mars',
            right: 'The "Red Planet" with polar ice caps',
            explanation: 'Mars appears red due to iron oxide (rust) on its surface and has polar ice caps made of water and carbon dioxide ice.'
          },
          {
            id: '5',
            left: 'Jupiter',
            right: 'The largest planet with a Great Red Spot',
            explanation: 'Jupiter is the largest planet in our solar system and has a giant storm called the Great Red Spot.'
          },
          {
            id: '6',
            left: 'Saturn',
            right: 'Known for its spectacular ring system',
            explanation: 'Saturn has the most visible and extensive ring system made up of ice particles, rocky debris, and dust.'
          },
          {
            id: '7',
            left: 'Uranus',
            right: 'The planet that rotates on its side',
            explanation: 'Uranus is unique because it rotates on its side, likely due to a collision with an Earth-sized object long ago.'
          },
          {
            id: '8',
            left: 'Neptune',
            right: 'The windiest planet with the strongest storms',
            explanation: 'Neptune has the strongest winds in the solar system, reaching speeds of over 1,200 miles per hour.'
          },
          {
            id: '9',
            left: 'Pluto',
            right: 'A dwarf planet beyond Neptune',
            explanation: 'Pluto was reclassified as a dwarf planet in 2006. It\'s smaller than Earth\'s moon and has a highly elliptical orbit.'
          },
          {
            id: '10',
            left: 'The Sun',
            right: 'The star at the center of our solar system',
            explanation: 'The Sun is a medium-sized star that contains 99.8% of the mass in our solar system.'
          }
        ],
        shuffleOptions: true,
        showFeedbackImmediately: true,
        timeLimit: 10, // minutes
        attempts: 2
      },
      isGradable: true,
      maxScore: 10,
      passingScore: 7,
      weightage: 1.0,
    }
  });

  // Create the same document activity for girls class
  await prisma.activity.create({
    data: {
      title: 'Solar System Document Activity',
      purpose: ActivityPurpose.LEARNING,
      learningType: LearningActivityType.SELF_STUDY,
      status: SystemStatus.ACTIVE,
      subjectId: subjectId,
      topicId: solarSystemTopic.id,
      classId: girlsClassId,
      content: {
        activityType: 'document',
        instructions: 'Read the following document about our solar system and complete the activities.',
        document: {
          title: 'Our Amazing Solar System',
          content: `# Our Amazing Solar System

## Introduction
The solar system consists of the Sun and everything that orbits around it, including planets, dwarf planets, moons, asteroids, comets, and meteoroids. The Sun is at the center of our solar system and provides the light and heat that makes life possible on Earth.

## The Sun
The Sun is a medium-sized star that contains 99.8% of all the mass in our solar system. It's about 109 times wider than Earth and could fit about 1.3 million Earths inside it! The Sun is made mostly of hydrogen and helium gas.

## The Planets

### Inner Planets (Terrestrial Planets)

1. **Mercury**
   - Smallest planet in our solar system
   - Closest to the Sun
   - Has no atmosphere to protect it
   - Temperature ranges from extremely hot to extremely cold

2. **Venus**
   - Similar in size to Earth
   - Hottest planet due to its thick atmosphere
   - Rotates in the opposite direction compared to most planets
   - Often called Earth's "sister planet"

3. **Earth**
   - Our home planet
   - Only planet known to have life
   - Has one natural satellite (the Moon)
   - Has liquid water on its surface

4. **Mars**
   - Known as the "Red Planet"
   - Has polar ice caps
   - Has the largest volcano in the solar system (Olympus Mons)
   - Scientists are studying if it could support human life in the future

### Outer Planets (Gas Giants and Ice Giants)

5. **Jupiter**
   - Largest planet in our solar system
   - Has a Great Red Spot (a giant storm)
   - Has at least 79 moons
   - Made mostly of hydrogen and helium

6. **Saturn**
   - Known for its beautiful rings
   - Second-largest planet
   - Has at least 82 moons
   - Would float in water (if there was a bathtub big enough!)

7. **Uranus**
   - Rotates on its side
   - Appears blue-green due to methane in its atmosphere
   - Has 27 known moons
   - Coldest planetary atmosphere in the solar system

8. **Neptune**
   - Windiest planet with storms reaching 1,200 mph
   - Has 14 known moons
   - Appears blue due to methane in its atmosphere
   - Takes 165 Earth years to orbit the Sun

## Beyond the Planets

### Dwarf Planets
Pluto, Ceres, Eris, Haumea, and Makemake are classified as dwarf planets. Pluto was once considered the ninth planet but was reclassified in 2006.

### Asteroids and Comets
Asteroids are rocky objects that orbit the Sun, mostly found in the asteroid belt between Mars and Jupiter. Comets are icy bodies that release gas and dust when they get close to the Sun, creating a visible tail.

## Space Exploration
Humans have sent spacecraft to study all the planets in our solar system. Some notable missions include:
- The Voyager missions, which have now left our solar system
- The Mars rovers exploring the surface of Mars
- The New Horizons mission to Pluto
- The Juno mission studying Jupiter

## Conclusion
Our solar system is an amazing place with diverse worlds to explore. Scientists continue to make new discoveries about our cosmic neighborhood every day!`,
          attachments: [
            {
              type: 'image',
              title: 'Solar System Diagram',
              url: '/resources/science/solar-system-diagram.jpg'
            },
            {
              type: 'video',
              title: 'Our Solar System',
              url: 'https://example.com/videos/our-solar-system'
            }
          ]
        },
        activities: [
          {
            title: 'Create a planet fact card',
            description: 'Choose one planet and create a fact card with at least 5 interesting facts from the document.'
          },
          {
            title: 'Order the planets',
            description: 'Arrange the planets in order from closest to farthest from the sun.'
          },
          {
            title: 'Compare and contrast',
            description: 'Create a Venn diagram comparing the inner planets and outer planets.'
          },
          {
            title: 'Research project',
            description: 'Choose one space mission mentioned in the document and research more details about its discoveries.'
          }
        ],
        checkpoints: [
          {
            title: 'Reading Checkpoint 1',
            question: 'What percentage of the solar system\'s mass is contained in the Sun?',
            answer: '99.8%',
            hint: 'Look in the section about the Sun.'
          },
          {
            title: 'Reading Checkpoint 2',
            question: 'Which planet is known as Earth\'s "sister planet"?',
            answer: 'Venus',
            hint: 'Check the information about the inner planets.'
          },
          {
            title: 'Reading Checkpoint 3',
            question: 'How many moons does Jupiter have?',
            answer: 'at least 79',
            hint: 'Look in the section about Jupiter.'
          }
        ]
      },
      isGradable: false,
    }
  });

  // Create the same matching activity for girls class
  await prisma.activity.create({
    data: {
      title: 'Solar System Matching Activity',
      purpose: ActivityPurpose.ASSESSMENT,
      assessmentType: AssessmentType.QUIZ,
      status: SystemStatus.ACTIVE,
      subjectId: subjectId,
      topicId: solarSystemTopic.id,
      classId: girlsClassId,
      content: {
        activityType: 'matching',
        instructions: 'Match each planet with its correct description or characteristic.',
        pairs: [
          {
            id: '1',
            left: 'Mercury',
            right: 'The smallest planet and closest to the Sun',
            explanation: 'Mercury is the smallest planet in our solar system and the closest to the Sun.'
          },
          {
            id: '2',
            left: 'Venus',
            right: 'The hottest planet with thick clouds of sulfuric acid',
            explanation: 'Venus has a thick atmosphere that traps heat, making it the hottest planet in our solar system.'
          },
          {
            id: '3',
            left: 'Earth',
            right: 'The only planet known to support life',
            explanation: 'Earth is the only planet in our solar system known to have liquid water and support life.'
          },
          {
            id: '4',
            left: 'Mars',
            right: 'The "Red Planet" with polar ice caps',
            explanation: 'Mars appears red due to iron oxide (rust) on its surface and has polar ice caps made of water and carbon dioxide ice.'
          },
          {
            id: '5',
            left: 'Jupiter',
            right: 'The largest planet with a Great Red Spot',
            explanation: 'Jupiter is the largest planet in our solar system and has a giant storm called the Great Red Spot.'
          },
          {
            id: '6',
            left: 'Saturn',
            right: 'Known for its spectacular ring system',
            explanation: 'Saturn has the most visible and extensive ring system made up of ice particles, rocky debris, and dust.'
          },
          {
            id: '7',
            left: 'Uranus',
            right: 'The planet that rotates on its side',
            explanation: 'Uranus is unique because it rotates on its side, likely due to a collision with an Earth-sized object long ago.'
          },
          {
            id: '8',
            left: 'Neptune',
            right: 'The windiest planet with the strongest storms',
            explanation: 'Neptune has the strongest winds in the solar system, reaching speeds of over 1,200 miles per hour.'
          },
          {
            id: '9',
            left: 'Pluto',
            right: 'A dwarf planet beyond Neptune',
            explanation: 'Pluto was reclassified as a dwarf planet in 2006. It\'s smaller than Earth\'s moon and has a highly elliptical orbit.'
          },
          {
            id: '10',
            left: 'The Sun',
            right: 'The star at the center of our solar system',
            explanation: 'The Sun is a medium-sized star that contains 99.8% of the mass in our solar system.'
          }
        ],
        shuffleOptions: true,
        showFeedbackImmediately: true,
        timeLimit: 10, // minutes
        attempts: 2
      },
      isGradable: true,
      maxScore: 10,
      passingScore: 7,
      weightage: 1.0,
    }
  });

  // 4. Plant Life Cycle Sequence Activity
  const boysSequenceActivity = await prisma.activity.create({
    data: {
      title: 'Plant Life Cycle Sequence Activity',
      purpose: ActivityPurpose.ASSESSMENT,
      assessmentType: AssessmentType.QUIZ,
      status: SystemStatus.ACTIVE,
      subjectId: subjectId,
      topicId: plantsTopic.id,
      classId: boysClassId,
      content: {
        activityType: 'sequence',
        instructions: 'Arrange the stages of a plant\'s life cycle in the correct order.',
        sequences: [
          {
            id: '1',
            title: 'Bean Plant Life Cycle',
            description: 'Arrange the stages of a bean plant\'s life cycle in the correct order, from seed to mature plant.',
            items: [
              {
                id: '1a',
                text: 'Seed',
                imageUrl: '/resources/science/bean-seed.jpg',
                correctPosition: 0,
                explanation: 'The life cycle begins with a seed, which contains the embryo of a new plant.'
              },
              {
                id: '2a',
                text: 'Germination',
                imageUrl: '/resources/science/bean-germination.jpg',
                correctPosition: 1,
                explanation: 'Germination occurs when the seed absorbs water and begins to sprout.'
              },
              {
                id: '3a',
                text: 'Seedling',
                imageUrl: '/resources/science/bean-seedling.jpg',
                correctPosition: 2,
                explanation: 'The seedling emerges from the soil with its first leaves (cotyledons).'
              },
              {
                id: '4a',
                text: 'Young Plant',
                imageUrl: '/resources/science/bean-young-plant.jpg',
                correctPosition: 3,
                explanation: 'The young plant develops true leaves and begins photosynthesis.'
              },
              {
                id: '5a',
                text: 'Mature Plant with Flowers',
                imageUrl: '/resources/science/bean-flowering.jpg',
                correctPosition: 4,
                explanation: 'The mature plant produces flowers for reproduction.'
              },
              {
                id: '6a',
                text: 'Pollination',
                imageUrl: '/resources/science/bean-pollination.jpg',
                correctPosition: 5,
                explanation: 'Pollination occurs when pollen is transferred from the stamen to the pistil.'
              },
              {
                id: '7a',
                text: 'Fruit/Pod Development',
                imageUrl: '/resources/science/bean-pod.jpg',
                correctPosition: 6,
                explanation: 'After pollination, the plant develops fruits or pods containing seeds.'
              },
              {
                id: '8a',
                text: 'Seed Dispersal',
                imageUrl: '/resources/science/bean-seed-dispersal.jpg',
                correctPosition: 7,
                explanation: 'Seeds are dispersed to start the cycle again.'
              }
            ],
            points: 8
          },
          {
            id: '2',
            title: 'Photosynthesis Process',
            description: 'Arrange the steps of photosynthesis in the correct order.',
            items: [
              {
                id: '1b',
                text: 'Plants absorb sunlight through chlorophyll in their leaves',
                correctPosition: 0,
                explanation: 'Chlorophyll captures light energy from the sun.'
              },
              {
                id: '2b',
                text: 'Plants take in carbon dioxide through tiny holes in their leaves called stomata',
                correctPosition: 1,
                explanation: 'Carbon dioxide enters through stomata and is used as a raw material.'
              },
              {
                id: '3b',
                text: 'Plants absorb water through their roots',
                correctPosition: 2,
                explanation: 'Water is absorbed from the soil and transported to the leaves.'
              },
              {
                id: '4b',
                text: 'Light energy is used to convert water and carbon dioxide into glucose and oxygen',
                correctPosition: 3,
                explanation: 'The chemical reaction uses light energy to create glucose.'
              },
              {
                id: '5b',
                text: 'Oxygen is released through the stomata',
                correctPosition: 4,
                explanation: 'Oxygen is a byproduct of photosynthesis and is released into the air.'
              },
              {
                id: '6b',
                text: 'Glucose is used for energy or stored as starch',
                correctPosition: 5,
                explanation: 'The plant uses glucose for energy or stores it for later use.'
              }
            ],
            points: 6
          }
        ],
        allowPartialScoring: true,
        showFeedback: true,
        shuffleItems: true,
        timeLimit: 600, // 10 minutes in seconds
        attempts: 2
      },
      isGradable: true,
      maxScore: 14,
      passingScore: 10,
      weightage: 1.0,
    }
  });

  // Create the same sequence activity for girls class
  const girlsSequenceActivity = await prisma.activity.create({
    data: {
      title: 'Plant Life Cycle Sequence Activity',
      purpose: ActivityPurpose.ASSESSMENT,
      assessmentType: AssessmentType.QUIZ,
      status: SystemStatus.ACTIVE,
      subjectId: subjectId,
      topicId: plantsTopic.id,
      classId: girlsClassId,
      content: {
        activityType: 'sequence',
        instructions: 'Arrange the stages of a plant\'s life cycle in the correct order.',
        sequences: [
          {
            id: '1',
            title: 'Bean Plant Life Cycle',
            description: 'Arrange the stages of a bean plant\'s life cycle in the correct order, from seed to mature plant.',
            items: [
              {
                id: '1a',
                text: 'Seed',
                imageUrl: '/resources/science/bean-seed.jpg',
                correctPosition: 0,
                explanation: 'The life cycle begins with a seed, which contains the embryo of a new plant.'
              },
              {
                id: '2a',
                text: 'Germination',
                imageUrl: '/resources/science/bean-germination.jpg',
                correctPosition: 1,
                explanation: 'Germination occurs when the seed absorbs water and begins to sprout.'
              },
              {
                id: '3a',
                text: 'Seedling',
                imageUrl: '/resources/science/bean-seedling.jpg',
                correctPosition: 2,
                explanation: 'The seedling emerges from the soil with its first leaves (cotyledons).'
              },
              {
                id: '4a',
                text: 'Young Plant',
                imageUrl: '/resources/science/bean-young-plant.jpg',
                correctPosition: 3,
                explanation: 'The young plant develops true leaves and begins photosynthesis.'
              },
              {
                id: '5a',
                text: 'Mature Plant with Flowers',
                imageUrl: '/resources/science/bean-flowering.jpg',
                correctPosition: 4,
                explanation: 'The mature plant produces flowers for reproduction.'
              },
              {
                id: '6a',
                text: 'Pollination',
                imageUrl: '/resources/science/bean-pollination.jpg',
                correctPosition: 5,
                explanation: 'Pollination occurs when pollen is transferred from the stamen to the pistil.'
              },
              {
                id: '7a',
                text: 'Fruit/Pod Development',
                imageUrl: '/resources/science/bean-pod.jpg',
                correctPosition: 6,
                explanation: 'After pollination, the plant develops fruits or pods containing seeds.'
              },
              {
                id: '8a',
                text: 'Seed Dispersal',
                imageUrl: '/resources/science/bean-seed-dispersal.jpg',
                correctPosition: 7,
                explanation: 'Seeds are dispersed to start the cycle again.'
              }
            ],
            points: 8
          },
          {
            id: '2',
            title: 'Photosynthesis Process',
            description: 'Arrange the steps of photosynthesis in the correct order.',
            items: [
              {
                id: '1b',
                text: 'Plants absorb sunlight through chlorophyll in their leaves',
                correctPosition: 0,
                explanation: 'Chlorophyll captures light energy from the sun.'
              },
              {
                id: '2b',
                text: 'Plants take in carbon dioxide through tiny holes in their leaves called stomata',
                correctPosition: 1,
                explanation: 'Carbon dioxide enters through stomata and is used as a raw material.'
              },
              {
                id: '3b',
                text: 'Plants absorb water through their roots',
                correctPosition: 2,
                explanation: 'Water is absorbed from the soil and transported to the leaves.'
              },
              {
                id: '4b',
                text: 'Light energy is used to convert water and carbon dioxide into glucose and oxygen',
                correctPosition: 3,
                explanation: 'The chemical reaction uses light energy to create glucose.'
              },
              {
                id: '5b',
                text: 'Oxygen is released through the stomata',
                correctPosition: 4,
                explanation: 'Oxygen is a byproduct of photosynthesis and is released into the air.'
              },
              {
                id: '6b',
                text: 'Glucose is used for energy or stored as starch',
                correctPosition: 5,
                explanation: 'The plant uses glucose for energy or stores it for later use.'
              }
            ],
            points: 6
          }
        ],
        allowPartialScoring: true,
        showFeedback: true,
        shuffleItems: true,
        timeLimit: 600, // 10 minutes in seconds
        attempts: 2
      },
      isGradable: true,
      maxScore: 14,
      passingScore: 10,
      weightage: 1.0,
    }
  });
}

async function seedPEActivities(
  prisma: PrismaClient,
  subjectId: string,
  topics: any[],
  boysClassId: string,
  girlsClassId: string,
  boysStudents: any[],
  girlsStudents: any[]
) {
  console.log('Seeding Physical Education activities...');

  // Find specific topics
  const locomotorTopic = topics.find(t => t.code === 'PYP-CL3-PE-CH1-T1');
  const ballSkillsTopic = topics.find(t => t.code === 'PYP-CL3-PE-CH1-T2');
  const teamGamesTopic = topics.find(t => t.code === 'PYP-CL3-PE-CH2-T1');

  if (!locomotorTopic || !ballSkillsTopic || !teamGamesTopic) {
    console.warn('PE topics not found. Skipping PE activities seeding.');
    return;
  }

  // 1. Locomotor Skills Assessment
  const boysLocomotorAssessment = await prisma.activity.create({
    data: {
      title: 'Locomotor Skills Assessment',
      purpose: ActivityPurpose.ASSESSMENT,
      assessmentType: AssessmentType.PRACTICAL_TEST,
      status: SystemStatus.ACTIVE,
      subjectId: subjectId,
      topicId: locomotorTopic.id,
      classId: boysClassId,
      content: {
        instructions: 'Students will be assessed on their ability to perform various locomotor skills.',
        skills: [
          {
            name: 'Running',
            criteria: 'Proper arm movement, knee lift, and landing on balls of feet',
            maxPoints: 5
          },
          {
            name: 'Jumping',
            criteria: 'Proper takeoff, height/distance, and balanced landing',
            maxPoints: 5
          },
          {
            name: 'Hopping',
            criteria: 'Balance on one foot, controlled movement, and consistent rhythm',
            maxPoints: 5
          },
          {
            name: 'Skipping',
            criteria: 'Alternating step-hop pattern, arm coordination, and rhythm',
            maxPoints: 5
          },
          {
            name: 'Galloping',
            criteria: 'Lead foot consistent, trailing foot behind, and smooth rhythm',
            maxPoints: 5
          }
        ],
        rubric: {
          '5 points': 'Excellent form and technique, consistent performance',
          '4 points': 'Good form with minor inconsistencies',
          '3 points': 'Adequate form with some errors',
          '2 points': 'Developing skill with multiple errors',
          '1 point': 'Beginning skill level with significant difficulty'
        }
      },
      isGradable: true,
      maxScore: 25,
      passingScore: 15,
      weightage: 1.0,
    }
  });

  // Create the same assessment for girls class
  const girlsLocomotorAssessment = await prisma.activity.create({
    data: {
      title: 'Locomotor Skills Assessment',
      purpose: ActivityPurpose.ASSESSMENT,
      assessmentType: AssessmentType.PRACTICAL_TEST,
      status: SystemStatus.ACTIVE,
      subjectId: subjectId,
      topicId: locomotorTopic.id,
      classId: girlsClassId,
      content: {
        instructions: 'Students will be assessed on their ability to perform various locomotor skills.',
        skills: [
          {
            name: 'Running',
            criteria: 'Proper arm movement, knee lift, and landing on balls of feet',
            maxPoints: 5
          },
          {
            name: 'Jumping',
            criteria: 'Proper takeoff, height/distance, and balanced landing',
            maxPoints: 5
          },
          {
            name: 'Hopping',
            criteria: 'Balance on one foot, controlled movement, and consistent rhythm',
            maxPoints: 5
          },
          {
            name: 'Skipping',
            criteria: 'Alternating step-hop pattern, arm coordination, and rhythm',
            maxPoints: 5
          },
          {
            name: 'Galloping',
            criteria: 'Lead foot consistent, trailing foot behind, and smooth rhythm',
            maxPoints: 5
          }
        ],
        rubric: {
          '5 points': 'Excellent form and technique, consistent performance',
          '4 points': 'Good form with minor inconsistencies',
          '3 points': 'Adequate form with some errors',
          '2 points': 'Developing skill with multiple errors',
          '1 point': 'Beginning skill level with significant difficulty'
        }
      },
      isGradable: true,
      maxScore: 25,
      passingScore: 15,
      weightage: 1.0,
    }
  });

  // 2. Ball Skills Practice
  await prisma.activity.create({
    data: {
      title: 'Ball Skills Practice',
      purpose: ActivityPurpose.LEARNING,
      learningType: LearningActivityType.SELF_STUDY,
      status: SystemStatus.ACTIVE,
      subjectId: subjectId,
      topicId: ballSkillsTopic.id,
      classId: boysClassId,
      content: {
        instructions: 'Practice the following ball skills in pairs or small groups.',
        stations: [
          {
            name: 'Throwing and Catching',
            equipment: 'Tennis balls',
            description: 'Practice overhand and underhand throws with a partner at various distances.'
          },
          {
            name: 'Dribbling',
            equipment: 'Basketballs',
            description: 'Practice dribbling while stationary, walking, and running.'
          },
          {
            name: 'Kicking',
            equipment: 'Soccer balls',
            description: 'Practice kicking for accuracy at targets and passing with a partner.'
          },
          {
            name: 'Ball Control',
            equipment: 'Various balls',
            description: 'Practice controlling balls of different sizes with hands and feet.'
          }
        ],
        rotationTime: '10 minutes per station'
      },
      isGradable: false,
    }
  });

  // Create the same practice for girls class
  await prisma.activity.create({
    data: {
      title: 'Ball Skills Practice',
      purpose: ActivityPurpose.LEARNING,
      learningType: LearningActivityType.SELF_STUDY,
      status: SystemStatus.ACTIVE,
      subjectId: subjectId,
      topicId: ballSkillsTopic.id,
      classId: girlsClassId,
      content: {
        instructions: 'Practice the following ball skills in pairs or small groups.',
        stations: [
          {
            name: 'Throwing and Catching',
            equipment: 'Tennis balls',
            description: 'Practice overhand and underhand throws with a partner at various distances.'
          },
          {
            name: 'Dribbling',
            equipment: 'Basketballs',
            description: 'Practice dribbling while stationary, walking, and running.'
          },
          {
            name: 'Kicking',
            equipment: 'Soccer balls',
            description: 'Practice kicking for accuracy at targets and passing with a partner.'
          },
          {
            name: 'Ball Control',
            equipment: 'Various balls',
            description: 'Practice controlling balls of different sizes with hands and feet.'
          }
        ],
        rotationTime: '10 minutes per station'
      },
      isGradable: false,
    }
  });

  // 3. Team Games Introduction
  await prisma.activity.create({
    data: {
      title: 'Team Games Introduction',
      purpose: ActivityPurpose.LEARNING,
      learningType: LearningActivityType.GROUP_WORK,
      status: SystemStatus.ACTIVE,
      subjectId: subjectId,
      topicId: teamGamesTopic.id,
      classId: boysClassId,
      content: {
        instructions: 'Learn and play simple team games that emphasize cooperation and fair play.',
        games: [
          {
            name: 'Capture the Flag',
            equipment: 'Flags or pinnies, cones',
            description: 'Divide into two teams. Each team tries to capture the other team\'s flag and bring it back to their side without being tagged.',
            rules: [
              'Players tagged in the opposing team\'s territory go to a designated area until freed by a teammate',
              'The flag must be visible at all times',
              'The game ends when one team captures the flag or time expires'
            ],
            teamwork: 'Requires strategy, communication, and role assignment'
          },
          {
            name: 'Cooperative Relay',
            equipment: 'Various objects for relay',
            description: 'Teams complete a relay course while working together to transport objects in creative ways.',
            rules: [
              'All team members must participate',
              'Objects must be transported according to the specified method',
              'If an object is dropped, the team must start that leg again'
            ],
            teamwork: 'Emphasizes coordination, communication, and problem-solving'
          }
        ],
        discussionPoints: [
          'What makes a good team player?',
          'How can we communicate effectively during games?',
          'Why is fair play important?'
        ]
      },
      isGradable: false,
    }
  });

  // Create the same introduction for girls class
  await prisma.activity.create({
    data: {
      title: 'Team Games Introduction',
      purpose: ActivityPurpose.LEARNING,
      learningType: LearningActivityType.GROUP_WORK,
      status: SystemStatus.ACTIVE,
      subjectId: subjectId,
      topicId: teamGamesTopic.id,
      classId: girlsClassId,
      content: {
        instructions: 'Learn and play simple team games that emphasize cooperation and fair play.',
        games: [
          {
            name: 'Capture the Flag',
            equipment: 'Flags or pinnies, cones',
            description: 'Divide into two teams. Each team tries to capture the other team\'s flag and bring it back to their side without being tagged.',
            rules: [
              'Players tagged in the opposing team\'s territory go to a designated area until freed by a teammate',
              'The flag must be visible at all times',
              'The game ends when one team captures the flag or time expires'
            ],
            teamwork: 'Requires strategy, communication, and role assignment'
          },
          {
            name: 'Cooperative Relay',
            equipment: 'Various objects for relay',
            description: 'Teams complete a relay course while working together to transport objects in creative ways.',
            rules: [
              'All team members must participate',
              'Objects must be transported according to the specified method',
              'If an object is dropped, the team must start that leg again'
            ],
            teamwork: 'Emphasizes coordination, communication, and problem-solving'
          }
        ],
        discussionPoints: [
          'What makes a good team player?',
          'How can we communicate effectively during games?',
          'Why is fair play important?'
        ]
      },
      isGradable: false,
    }
  });
}
