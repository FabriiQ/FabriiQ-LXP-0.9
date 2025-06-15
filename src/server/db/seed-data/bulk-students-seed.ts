import { PrismaClient, SystemStatus, UserType, AccessScope } from '@prisma/client';
import { hash } from 'bcryptjs';

/**
 * Seed file for generating 500 Pakistani students for each class
 */

// Default password for all students
const DEFAULT_STUDENT_PASSWORD = 'Password123!';

// Common Pakistani male first names
const pakistaniMaleFirstNames = [
  'Muhammad', 'Ahmed', 'Ali', 'Hassan', 'Hussain', 'Usman', 'Imran', 'Faisal', 'Bilal', 'Asad',
  'Tariq', 'Shahid', 'Khalid', 'Naveed', 'Rashid', 'Sajid', 'Waqar', 'Amir', 'Nasir', 'Saeed',
  'Javed', 'Arif', 'Shoaib', 'Kamran', 'Rizwan', 'Adnan', 'Farhan', 'Salman', 'Zubair', 'Yasir',
  'Babar', 'Fahad', 'Junaid', 'Kashif', 'Shahzad', 'Waseem', 'Zafar', 'Aamir', 'Hamza', 'Saad',
  'Talha', 'Zain', 'Abdullah', 'Ibrahim', 'Umar', 'Farooq', 'Raheel', 'Sohail', 'Taimoor', 'Waheed',
  'Asif', 'Fawad', 'Haroon', 'Irfan', 'Jahangir', 'Khurram', 'Liaquat', 'Maqsood', 'Nadeem', 'Omer',
  'Qasim', 'Rehan', 'Shahbaz', 'Tahir', 'Umair', 'Waqas', 'Yousaf', 'Zahid', 'Abid', 'Danish',
  'Ehsan', 'Faizan', 'Ghulam', 'Haider', 'Ijaz', 'Jawad', 'Kaleem', 'Luqman', 'Mehmood', 'Nabeel',
  'Owais', 'Pervaiz', 'Qamar', 'Rafiq', 'Shakeel', 'Tanveer', 'Usama', 'Wahid', 'Younus', 'Zeeshan'
];

// Common Pakistani female first names
const pakistaniFemaleFirstNames = [
  'Fatima', 'Ayesha', 'Zainab', 'Khadija', 'Maryam', 'Amina', 'Sana', 'Saima', 'Nadia', 'Asma',
  'Sadia', 'Rabia', 'Hina', 'Samina', 'Fariha', 'Mehwish', 'Uzma', 'Iram', 'Saba', 'Madiha',
  'Faiza', 'Nazia', 'Shazia', 'Bushra', 'Shaista', 'Rubina', 'Tahira', 'Nasreen', 'Rukhsana', 'Yasmeen',
  'Shabana', 'Tehmina', 'Farhat', 'Shamim', 'Saira', 'Najma', 'Zahida', 'Shakeela', 'Nusrat', 'Parveen',
  'Abida', 'Khalida', 'Razia', 'Sajida', 'Naheed', 'Mumtaz', 'Samia', 'Naila', 'Shagufta', 'Rehana',
  'Aisha', 'Aliya', 'Amber', 'Anum', 'Areeba', 'Arfa', 'Arooj', 'Bisma', 'Fareeha', 'Fizza',
  'Hafsa', 'Hira', 'Iqra', 'Javeria', 'Kainat', 'Kanwal', 'Laiba', 'Maham', 'Maheen', 'Malaika',
  'Mehak', 'Momina', 'Muniba', 'Nimra', 'Ramsha', 'Rimsha', 'Sadia', 'Sana', 'Sidra', 'Tania',
  'Tooba', 'Wajiha', 'Warda', 'Yusra', 'Zahra', 'Zara', 'Zunaira', 'Dua', 'Emaan', 'Fiza'
];

// Common Pakistani last names
const pakistaniLastNames = [
  'Khan', 'Ahmed', 'Ali', 'Malik', 'Qureshi', 'Syed', 'Shah', 'Akhtar', 'Baig', 'Chaudhry',
  'Rana', 'Raza', 'Hussain', 'Sheikh', 'Javed', 'Iqbal', 'Aslam', 'Akram', 'Butt', 'Bhatti',
  'Cheema', 'Dar', 'Farooq', 'Gul', 'Hamid', 'Iftikhar', 'Janjua', 'Kamal', 'Lodhi', 'Mirza',
  'Nasir', 'Paracha', 'Qazi', 'Rasheed', 'Siddiqi', 'Toor', 'Usmani', 'Virk', 'Warraich', 'Younas',
  'Zafar', 'Abbasi', 'Bajwa', 'Choudhary', 'Durrani', 'Elahi', 'Farooqui', 'Gillani', 'Hashmi', 'Ismail',
  'Jafri', 'Khattak', 'Lakhani', 'Mahmood', 'Naqvi', 'Orakzai', 'Pasha', 'Qasmi', 'Rizvi', 'Saeed',
  'Tarar', 'Umar', 'Vance', 'Wattoo', 'Yaqoob', 'Zahoor', 'Afridi', 'Baloch', 'Chishti', 'Dogar',
  'Farooqi', 'Ghouri', 'Hafeez', 'Imtiaz', 'Jilani', 'Kashmiri', 'Lone', 'Memon', 'Niazi', 'Osmani',
  'Pirzada', 'Quraishi', 'Rabbani', 'Sulemani', 'Tanoli', 'Utmanzai', 'Wazir', 'Yousafzai', 'Zuberi'
];

// Helper function to generate a random Pakistani name
function generatePakistaniName(gender: 'male' | 'female'): string {
  const firstNames = gender === 'male' ? pakistaniMaleFirstNames : pakistaniFemaleFirstNames;
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = pakistaniLastNames[Math.floor(Math.random() * pakistaniLastNames.length)];
  return `${firstName} ${lastName}`;
}

// Helper function to generate a username from a name
function generateUsername(name: string): string {
  const nameParts = name.trim().split(' ');
  let username = '';

  if (nameParts.length > 1) {
    // First letter of first name + last name
    username = (nameParts[0][0] + nameParts[nameParts.length - 1]).toLowerCase();
  } else {
    // Just use the single name
    username = name.toLowerCase().replace(/\s+/g, '');
  }

  // Add random numbers to make it unique
  username += Math.floor(1000 + Math.random() * 9000);
  return username;
}

// Helper function to generate an email from a username
function generateEmail(username: string): string {
  return `${username}@example.com`;
}

// Helper function to generate an enrollment number
function generateEnrollmentNumber(prefix: string = 'SIS'): string {
  const year = new Date().getFullYear().toString().slice(-2);
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `${prefix}-${year}${random}`;
}

// Main function to seed bulk students
export async function seedBulkStudents(prisma: PrismaClient, studentsPerClass: number = 500) {
  console.log(`Starting to seed ${studentsPerClass} students per class...`);

  try {
    // Find all active classes
    const classes = await prisma.class.findMany({
      where: { status: SystemStatus.ACTIVE },
      include: {
        courseCampus: {
          include: {
            campus: true,
            programCampus: {
              include: {
                program: true
              }
            }
          }
        }
      }
    });

    if (classes.length === 0) {
      console.warn('No active classes found. Skipping bulk student seeding.');
      return;
    }

    console.log(`Found ${classes.length} active classes.`);

    // Find an institution
    const institution = await prisma.institution.findFirst({
      where: { status: SystemStatus.ACTIVE }
    });

    if (!institution) {
      console.warn('No active institution found. Skipping bulk student seeding.');
      return;
    }

    // Find or create an admin user for creating enrollments
    let adminUser = await prisma.user.findFirst({
      where: {
        userType: 'ADMINISTRATOR',
        status: SystemStatus.ACTIVE
      }
    });

    if (!adminUser) {
      console.warn('No admin user found. Creating a default admin user for student enrollments.');

      // Create a default admin user
      adminUser = await prisma.user.create({
        data: {
          name: 'Bulk Enrollment Administrator',
          email: `bulk.admin.${Date.now()}@example.com`,
          username: `bulk_admin_${Date.now()}`,
          userType: 'ADMINISTRATOR',
          accessScope: 'SYSTEM',
          status: SystemStatus.ACTIVE,
          password: '$2a$12$K8GpYeWkVQB.UY3QJnwGEuV0yCXDv.d/cTFp.LBKZGW0MYwY9ZYhq', // hashed 'Password123!'
          institution: { connect: { id: institution.id } },
        },
      });

      console.log('Created default admin user for bulk student enrollments');
    }

    // Hash the default password once
    const hashedPassword = await hash(DEFAULT_STUDENT_PASSWORD, 12);

    // Track total students created
    let totalStudentsCreated = 0;

    // Process each class
    for (const classObj of classes) {
      console.log(`Creating students for class: ${classObj.name} (${classObj.code})`);

      // Determine if this is a boys or girls class based on the class name or code
      const isBoys = classObj.name?.includes('Boys') || classObj.code?.includes('BOYS') || false;
      const gender = isBoys ? 'male' : 'female';

      // Get campus ID
      const campusId = classObj.courseCampus?.campus?.id;
      if (!campusId) {
        console.warn(`No campus found for class ${classObj.name}. Skipping.`);
        continue;
      }

      // Create students for this class in batches
      const BATCH_SIZE = 50; // Process 50 students at a time
      const batches = Math.ceil(studentsPerClass / BATCH_SIZE);

      console.log(`Processing ${batches} batches of ${BATCH_SIZE} students each`);

      for (let batch = 0; batch < batches; batch++) {
        console.log(`Processing batch ${batch + 1} of ${batches}`);

        const batchStart = batch * BATCH_SIZE;
        const batchEnd = Math.min((batch + 1) * BATCH_SIZE, studentsPerClass);
        const batchSize = batchEnd - batchStart;

        // Create batch of students
        const studentPromises = [];

        for (let i = 0; i < batchSize; i++) {
          // Generate student data
          const name = generatePakistaniName(gender);
          const username = generateUsername(name);
          const email = generateEmail(username);
          const enrollmentNumber = generateEnrollmentNumber();

          const studentPromise = (async () => {
            try {
              // Create user
              const user = await prisma.user.create({
                data: {
                  name,
                  email,
                  username,
                  password: hashedPassword,
                  userType: UserType.STUDENT,
                  accessScope: AccessScope.SINGLE_CAMPUS,
                  status: SystemStatus.ACTIVE,
                  institutionId: institution.id,
                  primaryCampusId: campusId
                },
              });

              // Create student profile
              const studentProfile = await prisma.studentProfile.create({
                data: {
                  userId: user.id,
                  enrollmentNumber,
                  currentGrade: 'Grade 3',
                  academicHistory: {
                    previousSchool: 'Previous Elementary School',
                    previousGrade: 'Grade 2',
                    joiningDate: new Date('2023-08-01').toISOString(),
                  },
                  interests: ['Reading', 'Sports', 'Art'],
                  achievements: [
                    {
                      title: 'Reading Champion',
                      date: new Date('2023-05-15').toISOString(),
                      description: 'Read the most books in class',
                    },
                  ],
                  guardianInfo: {
                    primaryGuardian: {
                      name: `${name.split(' ')[0]}'s Parent`,
                      relationship: 'Parent',
                      contact: `03${Math.floor(Math.random() * 10)}${Math.floor(1000000 + Math.random() * 9000000)}`, // Pakistani mobile format
                      email: `parent.${username}@example.com`,
                    },
                  },
                },
              });

              // Create campus access for student
              await prisma.userCampusAccess.create({
                data: {
                  userId: user.id,
                  campusId,
                  status: SystemStatus.ACTIVE,
                  roleType: UserType.STUDENT,
                },
              });

              // Create enrollment
              const enrollment = await prisma.studentEnrollment.create({
                data: {
                  studentId: studentProfile.id,
                  classId: classObj.id,
                  status: SystemStatus.ACTIVE,
                  startDate: new Date('2024-08-01'),
                  createdById: adminUser.id,
                },
              });

              // Create enrollment history
              await prisma.enrollmentHistory.create({
                data: {
                  enrollmentId: enrollment.id,
                  action: 'CREATED',
                  details: {
                    studentName: name,
                    className: classObj.name || classObj.code,
                    startDate: new Date('2024-08-01').toISOString(),
                  },
                  createdById: adminUser.id,
                },
              });

              // Create student level for reward system
              await prisma.studentLevel.create({
                data: {
                  studentId: studentProfile.id,
                  level: 1,
                  currentExp: Math.floor(Math.random() * 50),
                  nextLevelExp: 100,
                  classId: classObj.id,
                  status: SystemStatus.ACTIVE
                }
              });

              // Create initial points for reward system
              await prisma.studentPoints.create({
                data: {
                  studentId: studentProfile.id,
                  points: Math.floor(Math.random() * 100),
                  reason: 'Initial enrollment bonus',
                  source: 'SYSTEM',
                  status: SystemStatus.ACTIVE
                }
              });

              return true; // Success
            } catch (error) {
              console.error(`Error creating student ${name}:`, error);
              return false; // Failed
            }
          })();

          studentPromises.push(studentPromise);
        }

        // Wait for all students in this batch to be created
        const results = await Promise.all(studentPromises);
        const successCount = results.filter(result => result).length;

        totalStudentsCreated += successCount;
        console.log(`Batch ${batch + 1} complete: Created ${successCount} of ${batchSize} students`);
        console.log(`Total students created so far: ${totalStudentsCreated}`);
      }

      console.log(`Completed creating ${studentsPerClass} students for class: ${classObj.name}`);
    }

    console.log(`Successfully created ${totalStudentsCreated} students across ${classes.length} classes.`);
    return totalStudentsCreated;
  } catch (error) {
    console.error('Error seeding bulk students:', error);
    throw error;
  }
}
