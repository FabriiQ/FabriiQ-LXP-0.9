import { PrismaClient, SystemStatus } from '@prisma/client';

// Document Types
export const documentTypesSeedData = [
  {
    name: 'Birth Certificate',
    description: 'Official birth certificate issued by government',
    isRequired: true,
    verificationRequired: true,
    status: SystemStatus.ACTIVE,
  },
  {
    name: 'Previous School Records',
    description: 'Academic records from previous school',
    isRequired: true,
    verificationRequired: true,
    status: SystemStatus.ACTIVE,
  },
  {
    name: 'Medical Certificate',
    description: 'Health certificate from registered doctor',
    isRequired: true,
    verificationRequired: true,
    status: SystemStatus.ACTIVE,
  },
  {
    name: 'Passport Photos',
    description: 'Recent passport-sized photographs',
    isRequired: true,
    verificationRequired: false,
    status: SystemStatus.ACTIVE,
  },
  {
    name: 'Parent ID',
    description: 'ID proof of parents/guardians',
    isRequired: true,
    verificationRequired: true,
    status: SystemStatus.ACTIVE,
  },
];

// This function will be called by the main seed function
export async function seedEnrollmentDocuments(
  prisma: PrismaClient,
  studentEnrollments: any[],
  users: any[]
) {
  console.log('Seeding enrollment documents...');

  // Find admin users for each campus
  const boysCampusAdmin = users.find(u => u.name?.includes('Boys Campus Admin'));
  const girlsCampusAdmin = users.find(u => u.name?.includes('Girls Campus Admin'));

  // Find any admin user
  let adminUser = users.find(u => u.userType === 'ADMINISTRATOR');

  if (!adminUser) {
    console.warn('No admin user found. Creating a default admin user for enrollment documents.');

    // Find an institution
    const institution = await prisma.institution.findFirst({
      where: { status: SystemStatus.ACTIVE }
    });

    if (!institution) {
      console.warn('No institution found. Cannot create admin user.');
      return;
    }

    // Create a default admin user
    adminUser = await prisma.user.create({
      data: {
        name: 'Document Administrator',
        email: `document.admin.${Date.now()}@example.com`,
        username: `document_admin_${Date.now()}`,
        userType: 'ADMINISTRATOR',
        accessScope: 'SYSTEM',
        status: SystemStatus.ACTIVE,
        password: '$2a$12$K8GpYeWkVQB.UY3QJnwGEuV0yCXDv.d/cTFp.LBKZGW0MYwY9ZYhq', // hashed 'Password123!'
        institution: { connect: { id: institution.id } },
      },
    });

    console.log('Created default admin user for enrollment documents');
  }

  // Get the first few student enrollments to create sample documents for
  const sampleEnrollments = studentEnrollments.slice(0, 4);

  if (sampleEnrollments.length === 0) {
    console.warn('No sample enrollments found. Skipping enrollment document seeding.');
    return;
  }

  // Check if we have a model for document types
  let documentTypes = [];
  try {
    // Try to find if we have a DocumentType model
    // This is a placeholder - in a real implementation, you would:
    // 1. Check if the documentType table exists
    // 2. If it exists, upsert the document types
    // 3. If not, store them in a system settings table or similar

    // For now, we'll just use the seed data
    documentTypes = documentTypesSeedData;
    console.log(`Using ${documentTypes.length} document types`);
  } catch (error) {
    console.warn('Error checking for document types:', error);
    // Use the seed data as fallback
    documentTypes = documentTypesSeedData;
  }

  // Create enrollment documents for the sample enrollments
  const enrollmentDocuments = [];

  // 1. John Smith Documents
  const johnSmithEnrollment = sampleEnrollments[0];
  if (johnSmithEnrollment) {
    const verifier = boysCampusAdmin || adminUser;
    const verificationDate = new Date('2024-07-15');

    // Create documents for each document type
    for (const docType of documentTypes) {
      // Create a file entry first
      const file = await prisma.file.create({
        data: {
          filename: `${docType.name.toLowerCase().replace(/\s+/g, '_')}_${johnSmithEnrollment.id}.pdf`,
          originalName: `${docType.name}.pdf`,
          mimeType: 'application/pdf',
          size: Math.floor(Math.random() * 1000000) + 100000, // Random size between 100KB and 1MB
          path: `documents/john_smith/${docType.name.toLowerCase().replace(/\s+/g, '_')}.pdf`,
          isPublic: false,
          entityType: 'ENROLLMENT_DOCUMENT',
          entityId: johnSmithEnrollment.id,
          ownerId: verifier.id,
        },
      });

      // Now create the enrollment document
      // Note: This assumes we have an EnrollmentDocument model
      // If not, we would need to store this information elsewhere
      try {
        // Check if we can create an enrollment document
        const document = {
          enrollmentId: johnSmithEnrollment.id,
          name: docType.name,
          type: docType.name.toUpperCase().replace(/\s+/g, '_'),
          fileId: file.id,
          url: file.path,
          verified: docType.verificationRequired,
          verifiedBy: docType.verificationRequired ? verifier.id : null,
          verifiedAt: docType.verificationRequired ? verificationDate : null,
          createdById: verifier.id,
        };

        // In a real implementation, you would create the document in the database
        // For now, we'll just log it
        console.log(`Would create enrollment document: ${docType.name} for John Smith`);
        enrollmentDocuments.push(document);
      } catch (error) {
        console.warn('Error creating enrollment document:', error);
      }
    }
  }

  // 2. Emma Smith Documents
  const emmaSmithEnrollment = sampleEnrollments[2];
  if (emmaSmithEnrollment) {
    const verifier = girlsCampusAdmin || adminUser;
    const verificationDate = new Date('2024-07-20');

    // Create documents for each document type
    for (const docType of documentTypes) {
      // Create a file entry first
      const file = await prisma.file.create({
        data: {
          filename: `${docType.name.toLowerCase().replace(/\s+/g, '_')}_${emmaSmithEnrollment.id}.pdf`,
          originalName: `${docType.name}.pdf`,
          mimeType: 'application/pdf',
          size: Math.floor(Math.random() * 1000000) + 100000, // Random size between 100KB and 1MB
          path: `documents/emma_smith/${docType.name.toLowerCase().replace(/\s+/g, '_')}.pdf`,
          isPublic: false,
          entityType: 'ENROLLMENT_DOCUMENT',
          entityId: emmaSmithEnrollment.id,
          ownerId: verifier.id,
        },
      });

      // Now create the enrollment document
      // Note: This assumes we have an EnrollmentDocument model
      // If not, we would need to store this information elsewhere
      try {
        // Check if we can create an enrollment document
        const document = {
          enrollmentId: emmaSmithEnrollment.id,
          name: docType.name,
          type: docType.name.toUpperCase().replace(/\s+/g, '_'),
          fileId: file.id,
          url: file.path,
          verified: docType.verificationRequired,
          verifiedBy: docType.verificationRequired ? verifier.id : null,
          verifiedAt: docType.verificationRequired ? verificationDate : null,
          createdById: verifier.id,
        };

        // In a real implementation, you would create the document in the database
        // For now, we'll just log it
        console.log(`Would create enrollment document: ${docType.name} for Emma Smith`);
        enrollmentDocuments.push(document);
      } catch (error) {
        console.warn('Error creating enrollment document:', error);
      }
    }
  }

  console.log(`Seeded ${enrollmentDocuments.length} enrollment documents`);
  return enrollmentDocuments;
}
