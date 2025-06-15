import { PrismaClient, SystemStatus, PaymentStatusType } from '@prisma/client';

// Fee Structures
export const feeStructuresSeedData = [
  {
    name: 'Primary Program Annual Fee 2024-2025',
    description: 'Annual fee structure for Primary Years Program',
    programCampusCode: 'PYP-SIS-BOYS-2024', // Will be mapped to programCampusId
    academicCycleCode: 'AY-2024-2025', // Will be mapped to academicCycleId
    feeComponents: [
      { name: 'Tuition Fee', amount: 5000, type: 'TUITION' },
      { name: 'Admission Fee', amount: 500, type: 'ADMISSION' },
      { name: 'Library Fee', amount: 200, type: 'LIBRARY' },
      { name: 'Laboratory Fee', amount: 300, type: 'LABORATORY' },
      { name: 'Sports Fee', amount: 200, type: 'SPORTS' },
      { name: 'Examination Fee', amount: 300, type: 'EXAMINATION' },
    ],
    isRecurring: false,
    status: SystemStatus.ACTIVE,
  },
  {
    name: 'Primary Program Monthly Fee 2024-2025',
    description: 'Monthly fee structure for Primary Years Program',
    programCampusCode: 'PYP-SIS-GIRLS-2024', // Will be mapped to programCampusId
    academicCycleCode: 'AY-2024-2025', // Will be mapped to academicCycleId
    feeComponents: [
      { name: 'Tuition Fee', amount: 500, type: 'TUITION' },
      { name: 'Library Fee', amount: 20, type: 'LIBRARY' },
      { name: 'Laboratory Fee', amount: 30, type: 'LABORATORY' },
      { name: 'Sports Fee', amount: 20, type: 'SPORTS' },
    ],
    isRecurring: true,
    recurringInterval: 'MONTHLY',
    status: SystemStatus.ACTIVE,
  },
];

// Discount Types
export const discountTypesSeedData = [
  {
    name: 'Sibling Discount',
    description: 'Discount for families with multiple children enrolled',
    discountValue: 10, // 10%
    isPercentage: true,
    maxAmount: 1000,
    applicableFor: ['SIBLING'],
    status: SystemStatus.ACTIVE,
  },
  {
    name: 'Merit Scholarship',
    description: 'Scholarship for academically outstanding students',
    discountValue: 25, // 25%
    isPercentage: true,
    maxAmount: 2000,
    applicableFor: ['MERIT'],
    status: SystemStatus.ACTIVE,
  },
  {
    name: 'Staff Children Discount',
    description: 'Discount for children of staff members',
    discountValue: 50, // 50%
    isPercentage: true,
    maxAmount: 3000,
    applicableFor: ['STAFF'],
    status: SystemStatus.ACTIVE,
  },
  {
    name: 'Early Payment Discount',
    description: 'Discount for fees paid before due date',
    discountValue: 5, // 5%
    isPercentage: true,
    maxAmount: 500,
    applicableFor: ['EARLY_PAYMENT'],
    status: SystemStatus.ACTIVE,
  },
];

// This function will be called by the main seed function
export async function seedFeeManagement(
  prisma: PrismaClient,
  institutions: any[],
  programCampuses: any[],
  academicCycles: any[],
  users: any[],
  studentEnrollments: any[]
) {
  console.log('Seeding fee management data...');

  // Find the admin user to use as creator
  let adminUser = users.find(u => u.userType === 'ADMINISTRATOR');

  if (!adminUser) {
    console.warn('No admin user found. Creating a default admin user for fee management.');

    // Find an institution
    const institution = institutions[0] || await prisma.institution.findFirst({
      where: { status: SystemStatus.ACTIVE }
    });

    if (!institution) {
      console.warn('No institution found. Cannot create admin user.');
      return;
    }

    // Create a default admin user
    adminUser = await prisma.user.create({
      data: {
        name: 'Fee Management Administrator',
        email: `fee.admin.${Date.now()}@example.com`,
        username: `fee_admin_${Date.now()}`,
        userType: 'ADMINISTRATOR',
        accessScope: 'SYSTEM',
        status: SystemStatus.ACTIVE,
        password: '$2a$12$K8GpYeWkVQB.UY3QJnwGEuV0yCXDv.d/cTFp.LBKZGW0MYwY9ZYhq', // hashed 'Password123!'
        institution: { connect: { id: institution.id } },
      },
    });

    console.log('Created default admin user for fee management');
  }

  // 1. Seed Fee Structures
  const feeStructures = await seedFeeStructures(
    prisma,
    feeStructuresSeedData,
    programCampuses,
    academicCycles,
    adminUser
  );

  // 2. Seed Discount Types
  const discountTypes = await seedDiscountTypes(
    prisma,
    discountTypesSeedData,
    adminUser
  );

  // 3. Seed Enrollment Fees, Discounts, Challans, and Transactions
  if (studentEnrollments.length > 0) {
    await seedEnrollmentFees(
      prisma,
      studentEnrollments,
      feeStructures,
      discountTypes,
      adminUser
    );
  } else {
    console.warn('No student enrollments found. Skipping enrollment fee seeding.');
  }

  console.log('Fee management data seeding completed.');
}

// Helper function to seed fee structures
async function seedFeeStructures(
  prisma: PrismaClient,
  feeStructureData: any[],
  programCampuses: any[],
  academicCycles: any[],
  adminUser: any
) {
  console.log('Seeding fee structures...');

  const createdFeeStructures = [];

  for (const feeStructure of feeStructureData) {
    // Find the program campus by code
    const programCampus = programCampuses.find(pc => pc.code === feeStructure.programCampusCode);

    if (!programCampus) {
      console.warn(`Program campus with code ${feeStructure.programCampusCode} not found. Skipping fee structure ${feeStructure.name}`);
      continue;
    }

    // Find the academic cycle by code
    const academicCycle = academicCycles.find(ac => ac.code === feeStructure.academicCycleCode);

    if (!academicCycle) {
      console.warn(`Academic cycle with code ${feeStructure.academicCycleCode} not found. Skipping fee structure ${feeStructure.name}`);
      continue;
    }

    // Create the fee structure
    const createdFeeStructure = await prisma.feeStructure.create({
      data: {
        name: feeStructure.name,
        description: feeStructure.description,
        programCampusId: programCampus.id,
        academicCycleId: academicCycle.id,
        feeComponents: feeStructure.feeComponents,
        isRecurring: feeStructure.isRecurring,
        recurringInterval: feeStructure.recurringInterval,
        status: feeStructure.status,
        createdById: adminUser.id,
      },
    });

    createdFeeStructures.push(createdFeeStructure);
  }

  console.log(`Seeded ${createdFeeStructures.length} fee structures`);
  return createdFeeStructures;
}

// Helper function to seed discount types
async function seedDiscountTypes(
  prisma: PrismaClient,
  discountTypeData: any[],
  adminUser: any
) {
  console.log('Seeding discount types...');

  const createdDiscountTypes = [];

  for (const discountType of discountTypeData) {
    // Create the discount type
    const createdDiscountType = await prisma.discountType.create({
      data: {
        name: discountType.name,
        description: discountType.description,
        discountValue: discountType.discountValue,
        isPercentage: discountType.isPercentage,
        maxAmount: discountType.maxAmount,
        applicableFor: discountType.applicableFor,
        status: discountType.status,
        createdById: adminUser.id,
      },
    });

    createdDiscountTypes.push(createdDiscountType);
  }

  console.log(`Seeded ${createdDiscountTypes.length} discount types`);
  return createdDiscountTypes;
}

// Helper function to seed enrollment fees and related data
async function seedEnrollmentFees(
  prisma: PrismaClient,
  studentEnrollments: any[],
  feeStructures: any[],
  discountTypes: any[],
  adminUser: any
) {
  console.log('Seeding enrollment fees...');

  // Get the first few student enrollments to create sample fees for
  const sampleEnrollments = studentEnrollments.slice(0, 4);

  if (sampleEnrollments.length === 0) {
    console.warn('No sample enrollments found. Skipping enrollment fee seeding.');
    return;
  }

  // Get the fee structures
  const annualFeeStructure = feeStructures.find(fs => fs.name === 'Primary Program Annual Fee 2024-2025');
  const monthlyFeeStructure = feeStructures.find(fs => fs.name === 'Primary Program Monthly Fee 2024-2025');

  if (!annualFeeStructure || !monthlyFeeStructure) {
    console.warn('Fee structures not found. Skipping enrollment fee seeding.');
    return;
  }

  // Get the discount types
  const earlyPaymentDiscount = discountTypes.find(dt => dt.name === 'Early Payment Discount');
  const siblingDiscount = discountTypes.find(dt => dt.name === 'Sibling Discount');
  const meritScholarship = discountTypes.find(dt => dt.name === 'Merit Scholarship');

  if (!earlyPaymentDiscount || !siblingDiscount || !meritScholarship) {
    console.warn('Discount types not found. Skipping enrollment fee seeding.');
    return;
  }

  // Create enrollment fees for the sample enrollments
  const enrollmentFees = [];

  // 1. John Smith - Annual Fee with Early Payment Discount
  const johnSmithEnrollment = sampleEnrollments[0];
  if (johnSmithEnrollment) {
    const baseAmount = 6500; // Sum of all fee components
    const discountAmount = baseAmount * (earlyPaymentDiscount.discountValue / 100);
    const finalAmount = baseAmount - discountAmount;

    const johnSmithFee = await prisma.enrollmentFee.create({
      data: {
        enrollmentId: johnSmithEnrollment.id,
        feeStructureId: annualFeeStructure.id,
        baseAmount,
        discountedAmount: finalAmount,
        finalAmount,
        dueDate: new Date('2024-08-15'),
        paymentStatus: PaymentStatusType.PAID,
        paymentMethod: 'BANK_TRANSFER',
        createdById: adminUser.id,
      },
    });

    // Create discount
    await prisma.feeDiscount.create({
      data: {
        enrollmentFeeId: johnSmithFee.id,
        discountTypeId: earlyPaymentDiscount.id,
        amount: discountAmount,
        reason: 'Payment received before August 10',
        approvedById: adminUser.id,
        createdById: adminUser.id,
      },
    });

    // Create challan
    const johnSmithChallan = await prisma.feeChallan.create({
      data: {
        enrollmentFeeId: johnSmithFee.id,
        challanNo: 'SIS-BOYS-2024-001',
        issueDate: new Date('2024-08-01'),
        dueDate: new Date('2024-08-15'),
        totalAmount: finalAmount,
        paidAmount: finalAmount,
        paymentStatus: PaymentStatusType.PAID,
        challanData: {
          studentName: 'John Smith',
          class: 'Class 3A Boys',
          feeDetails: [
            { name: 'Tuition Fee', amount: 5000 },
            { name: 'Admission Fee', amount: 500 },
            { name: 'Library Fee', amount: 200 },
            { name: 'Laboratory Fee', amount: 300 },
            { name: 'Sports Fee', amount: 200 },
            { name: 'Examination Fee', amount: 300 },
            { name: 'Early Payment Discount', amount: -discountAmount },
          ],
        },
        bankDetails: {
          bankName: 'Education Bank',
          accountNo: '1234567890',
          branchCode: 'EB001',
        },
        createdById: adminUser.id,
      },
    });

    // Create transaction
    await prisma.feeTransaction.create({
      data: {
        enrollmentFeeId: johnSmithFee.id,
        challanId: johnSmithChallan.id,
        amount: finalAmount,
        date: new Date('2024-08-10'),
        method: 'BANK_TRANSFER',
        reference: 'TRX123456789',
        notes: 'Full payment for annual fees',
        createdById: adminUser.id,
      },
    });

    enrollmentFees.push(johnSmithFee);
  }

  // 2. William Johnson - Annual Fee with Sibling Discount
  const williamJohnsonEnrollment = sampleEnrollments[1];
  if (williamJohnsonEnrollment) {
    const baseAmount = 6500; // Sum of all fee components
    const discountAmount = baseAmount * (siblingDiscount.discountValue / 100);
    const finalAmount = baseAmount - discountAmount;

    const williamJohnsonFee = await prisma.enrollmentFee.create({
      data: {
        enrollmentId: williamJohnsonEnrollment.id,
        feeStructureId: annualFeeStructure.id,
        baseAmount,
        discountedAmount: finalAmount,
        finalAmount,
        dueDate: new Date('2024-08-15'),
        paymentStatus: PaymentStatusType.PAID,
        paymentMethod: 'CREDIT_CARD',
        createdById: adminUser.id,
      },
    });

    // Create discount
    await prisma.feeDiscount.create({
      data: {
        enrollmentFeeId: williamJohnsonFee.id,
        discountTypeId: siblingDiscount.id,
        amount: discountAmount,
        reason: 'Brother Thomas Johnson in Class 5B',
        approvedById: adminUser.id,
        createdById: adminUser.id,
      },
    });

    // Create challan
    const williamJohnsonChallan = await prisma.feeChallan.create({
      data: {
        enrollmentFeeId: williamJohnsonFee.id,
        challanNo: 'SIS-BOYS-2024-002',
        issueDate: new Date('2024-08-01'),
        dueDate: new Date('2024-08-15'),
        totalAmount: finalAmount,
        paidAmount: finalAmount,
        paymentStatus: PaymentStatusType.PAID,
        challanData: {
          studentName: 'William Johnson',
          class: 'Class 3A Boys',
          feeDetails: [
            { name: 'Tuition Fee', amount: 5000 },
            { name: 'Admission Fee', amount: 500 },
            { name: 'Library Fee', amount: 200 },
            { name: 'Laboratory Fee', amount: 300 },
            { name: 'Sports Fee', amount: 200 },
            { name: 'Examination Fee', amount: 300 },
            { name: 'Sibling Discount', amount: -discountAmount },
          ],
        },
        bankDetails: {
          bankName: 'Education Bank',
          accountNo: '1234567890',
          branchCode: 'EB001',
        },
        createdById: adminUser.id,
      },
    });

    // Create transaction
    await prisma.feeTransaction.create({
      data: {
        enrollmentFeeId: williamJohnsonFee.id,
        challanId: williamJohnsonChallan.id,
        amount: finalAmount,
        date: new Date('2024-08-12'),
        method: 'CREDIT_CARD',
        reference: 'CC987654321',
        notes: 'Full payment with sibling discount',
        createdById: adminUser.id,
      },
    });

    enrollmentFees.push(williamJohnsonFee);
  }

  // 3. Emma Smith - Monthly Fee (No Discount)
  const emmaSmithEnrollment = sampleEnrollments[2];
  if (emmaSmithEnrollment) {
    const baseAmount = 570; // Sum of all fee components
    const finalAmount = baseAmount;

    const emmaSmithFee = await prisma.enrollmentFee.create({
      data: {
        enrollmentId: emmaSmithEnrollment.id,
        feeStructureId: monthlyFeeStructure.id,
        baseAmount,
        discountedAmount: finalAmount,
        finalAmount,
        dueDate: new Date('2024-09-05'),
        paymentStatus: PaymentStatusType.PAID,
        paymentMethod: 'CASH',
        createdById: adminUser.id,
      },
    });

    // Create challan
    const emmaSmithChallan = await prisma.feeChallan.create({
      data: {
        enrollmentFeeId: emmaSmithFee.id,
        challanNo: 'SIS-GIRLS-2024-001',
        issueDate: new Date('2024-09-01'),
        dueDate: new Date('2024-09-05'),
        totalAmount: finalAmount,
        paidAmount: finalAmount,
        paymentStatus: PaymentStatusType.PAID,
        challanData: {
          studentName: 'Emma Smith',
          class: 'Class 3A Girls',
          feeDetails: [
            { name: 'Tuition Fee', amount: 500 },
            { name: 'Library Fee', amount: 20 },
            { name: 'Laboratory Fee', amount: 30 },
            { name: 'Sports Fee', amount: 20 },
          ],
        },
        bankDetails: {
          bankName: 'Education Bank',
          accountNo: '0987654321',
          branchCode: 'EB002',
        },
        createdById: adminUser.id,
      },
    });

    // Create transaction
    await prisma.feeTransaction.create({
      data: {
        enrollmentFeeId: emmaSmithFee.id,
        challanId: emmaSmithChallan.id,
        amount: finalAmount,
        date: new Date('2024-09-03'),
        method: 'CASH',
        reference: 'CASH001',
        notes: 'Cash payment received by Sarah Williams',
        createdById: adminUser.id,
      },
    });

    enrollmentFees.push(emmaSmithFee);
  }

  // 4. Sophia Brown - Monthly Fee with Merit Scholarship
  const sophiaBrownEnrollment = sampleEnrollments[3];
  if (sophiaBrownEnrollment) {
    const baseAmount = 570; // Sum of all fee components
    const discountAmount = baseAmount * (meritScholarship.discountValue / 100);
    const finalAmount = baseAmount - discountAmount;

    const sophiaBrownFee = await prisma.enrollmentFee.create({
      data: {
        enrollmentId: sophiaBrownEnrollment.id,
        feeStructureId: monthlyFeeStructure.id,
        baseAmount,
        discountedAmount: finalAmount,
        finalAmount,
        dueDate: new Date('2024-09-05'),
        paymentStatus: PaymentStatusType.PENDING,
        createdById: adminUser.id,
      },
    });

    // Create discount
    await prisma.feeDiscount.create({
      data: {
        enrollmentFeeId: sophiaBrownFee.id,
        discountTypeId: meritScholarship.id,
        amount: discountAmount,
        reason: 'Top performer in previous academic year',
        approvedById: adminUser.id,
        createdById: adminUser.id,
      },
    });

    // Create challan
    await prisma.feeChallan.create({
      data: {
        enrollmentFeeId: sophiaBrownFee.id,
        challanNo: 'SIS-GIRLS-2024-002',
        issueDate: new Date('2024-09-01'),
        dueDate: new Date('2024-09-05'),
        totalAmount: finalAmount,
        paidAmount: 0,
        paymentStatus: PaymentStatusType.PENDING,
        challanData: {
          studentName: 'Sophia Brown',
          class: 'Class 3A Girls',
          feeDetails: [
            { name: 'Tuition Fee', amount: 500 },
            { name: 'Library Fee', amount: 20 },
            { name: 'Laboratory Fee', amount: 30 },
            { name: 'Sports Fee', amount: 20 },
            { name: 'Merit Scholarship', amount: -discountAmount },
          ],
        },
        bankDetails: {
          bankName: 'Education Bank',
          accountNo: '0987654321',
          branchCode: 'EB002',
        },
        createdById: adminUser.id,
      },
    });

    enrollmentFees.push(sophiaBrownFee);
  }

  console.log(`Seeded ${enrollmentFees.length} enrollment fees with discounts, challans, and transactions`);
  return enrollmentFees;
}
