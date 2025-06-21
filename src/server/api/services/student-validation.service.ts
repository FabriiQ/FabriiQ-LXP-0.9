import { TRPCError } from "@trpc/server";
import type { Prisma } from ".prisma/client";
import { generateEnrollmentNumber } from "@/utils/enrollment-number";

export interface StudentValidationResult {
  isValid: boolean;
  errors: {
    email?: string;
    username?: string;
    enrollmentNumber?: string;
    general?: string;
  };
  warnings: string[];
  suggestions: {
    alternativeEmails?: string[];
    alternativeUsernames?: string[];
    generatedEnrollmentNumber?: string;
  };
  existingStudent?: {
    id: string;
    name: string;
    email: string;
    enrollmentNumber?: string;
    status: string;
  };
}

export interface CreateStudentInput {
  name: string;
  email: string;
  username?: string;
  userType: string;
  phoneNumber?: string;
  institutionId?: string;
  campusId?: string;
  classId?: string; // Add class enrollment support
  profileData?: {
    enrollmentNumber?: string;
    dateOfBirth?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    gender?: string;
    currentGrade?: string;
    academicHistory?: any;
    interests?: string[];
    achievements?: any[];
    specialNeeds?: any;
    emergencyContact?: {
      name?: string;
      phone?: string;
      relationship?: string;
    };
    notes?: string;
    sendInvitation?: boolean;
    requirePasswordChange?: boolean;
    createManualAccount?: boolean;
  };
}

export interface CreateStudentResult {
  success: boolean;
  student?: {
    id: string;
    name: string;
    email: string;
    enrollmentNumber: string;
    studentProfileId?: string;
    classEnrollmentId?: string; // Add class enrollment info
  };
  validation: StudentValidationResult;
  message: string;
}

export class StudentValidationService {
  constructor(private prisma: any) {}

  /**
   * Comprehensive validation before creating a student
   */
  async validateStudentCreation(input: CreateStudentInput): Promise<StudentValidationResult> {
    const result: StudentValidationResult = {
      isValid: true,
      errors: {},
      warnings: [],
      suggestions: {}
    };

    // Check for existing user by email
    const existingUserByEmail = await this.prisma.user.findFirst({
      where: {
        email: input.email,
        status: { not: 'DELETED' }
      },
      include: {
        studentProfile: {
          select: {
            id: true,
            enrollmentNumber: true
          }
        }
      }
    });

    if (existingUserByEmail) {
      result.isValid = false;
      result.errors.email = "A user with this email already exists";
      result.existingStudent = {
        id: existingUserByEmail.id,
        name: existingUserByEmail.name || 'Unknown',
        email: existingUserByEmail.email || '',
        enrollmentNumber: existingUserByEmail.studentProfile?.enrollmentNumber,
        status: existingUserByEmail.status
      };

      // Suggest alternative emails
      const baseName = input.email.split('@')[0];
      const domain = input.email.split('@')[1];
      result.suggestions.alternativeEmails = [
        `${baseName}1@${domain}`,
        `${baseName}.student@${domain}`,
        `${baseName}${new Date().getFullYear()}@${domain}`
      ];
    }

    // Check for existing user by username (if provided)
    if (input.username) {
      const existingUserByUsername = await this.prisma.user.findFirst({
        where: {
          username: input.username,
          status: { not: 'DELETED' }
        }
      });

      if (existingUserByUsername) {
        result.isValid = false;
        result.errors.username = "This username is already taken";
        
        // Suggest alternative usernames
        result.suggestions.alternativeUsernames = [
          `${input.username}1`,
          `${input.username}${new Date().getFullYear()}`,
          `${input.username}.student`
        ];
      }
    }

    // Check enrollment number if provided
    if (input.profileData?.enrollmentNumber) {
      const existingEnrollment = await this.prisma.studentProfile.findFirst({
        where: {
          enrollmentNumber: input.profileData.enrollmentNumber
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              status: true
            }
          }
        }
      });

      if (existingEnrollment) {
        result.isValid = false;
        result.errors.enrollmentNumber = "This enrollment number is already in use";
        result.existingStudent = {
          id: existingEnrollment.user.id,
          name: existingEnrollment.user.name || 'Unknown',
          email: existingEnrollment.user.email || '',
          enrollmentNumber: existingEnrollment.enrollmentNumber,
          status: existingEnrollment.user.status
        };
      }
    }

    // Generate a unique enrollment number as suggestion
    result.suggestions.generatedEnrollmentNumber = await this.generateUniqueEnrollmentNumber(input.institutionId, input.campusId);

    // Add warnings for potential issues
    if (input.email.includes('+')) {
      result.warnings.push("Email contains '+' character which may cause delivery issues");
    }

    if (input.name.length < 3) {
      result.warnings.push("Student name is very short, please verify it's correct");
    }

    return result;
  }

  /**
   * Generate a unique enrollment number with database verification
   */
  async generateUniqueEnrollmentNumber(institutionId?: string, campusId?: string, maxAttempts: number = 10): Promise<string> {
    // Get institution and campus codes for readable enrollment numbers
    let institutionCode = 'INST';
    let campusCode = 'MAIN';

    if (institutionId) {
      const institution = await this.prisma.institution.findUnique({
        where: { id: institutionId },
        select: { code: true, name: true }
      });
      if (institution?.code) {
        institutionCode = institution.code.toUpperCase().slice(0, 4);
      } else if (institution?.name) {
        // Generate code from name if no code exists
        institutionCode = institution.name.replace(/[^A-Z]/g, '').slice(0, 4) || 'INST';
      }
    }

    if (campusId) {
      const campus = await this.prisma.campus.findUnique({
        where: { id: campusId },
        select: { code: true, name: true }
      });
      if (campus?.code) {
        campusCode = campus.code.toUpperCase().slice(0, 4);
      } else if (campus?.name) {
        // Generate code from name if no code exists
        campusCode = campus.name.replace(/[^A-Z]/g, '').slice(0, 4) || 'MAIN';
      }
    }

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const enrollmentNumber = generateEnrollmentNumber(institutionCode, campusCode);

      const existing = await this.prisma.studentProfile.findFirst({
        where: { enrollmentNumber }
      });

      if (!existing) {
        return enrollmentNumber;
      }
    }

    throw new Error("Failed to generate unique enrollment number after multiple attempts");
  }

  /**
   * Create student with graceful error handling
   */
  async createStudentSafely(input: CreateStudentInput): Promise<CreateStudentResult> {
    // First validate
    const validation = await this.validateStudentCreation(input);

    if (!validation.isValid) {
      return {
        success: false,
        validation,
        message: "Validation failed. Please check the errors and try again."
      };
    }

    try {
      // Ensure we have a unique enrollment number
      const enrollmentNumber = input.profileData?.enrollmentNumber || 
                              validation.suggestions.generatedEnrollmentNumber!;

      // Create the user and student profile in a transaction
      const result = await this.prisma.$transaction(async (tx: any) => {
        // Create user
        const user = await tx.user.create({
          data: {
            name: input.name,
            email: input.email,
            username: input.username || input.email,
            userType: input.userType,
            phoneNumber: input.phoneNumber,
            institutionId: input.institutionId,
            status: 'ACTIVE',
            profileData: input.profileData as Prisma.InputJsonValue,
            accessScope: 'SINGLE_CAMPUS',
            primaryCampusId: input.campusId
          }
        });

        // Create student profile
        const studentProfile = await tx.studentProfile.create({
          data: {
            userId: user.id,
            enrollmentNumber,
            currentGrade: input.profileData?.currentGrade,
            academicHistory: input.profileData?.academicHistory as Prisma.InputJsonValue,
            interests: input.profileData?.interests || [],
            achievements: (input.profileData?.achievements || []) as Prisma.InputJsonValue[],
            specialNeeds: input.profileData?.specialNeeds as Prisma.InputJsonValue
          }
        });

        // Create campus access if campusId provided
        if (input.campusId) {
          await tx.userCampusAccess.create({
            data: {
              userId: user.id,
              campusId: input.campusId,
              roleType: input.userType,
              status: 'ACTIVE',
              startDate: new Date()
            }
          });
        }

        // Enroll in class if classId provided
        let classEnrollment = null;
        if (input.classId) {
          classEnrollment = await tx.classEnrollment.create({
            data: {
              studentId: studentProfile.id,
              classId: input.classId,
              enrollmentDate: new Date(),
              status: 'ACTIVE'
            }
          });
        }

        return { user, studentProfile, classEnrollment };
      });

      const successMessage = result.classEnrollment
        ? "Student created and enrolled in class successfully!"
        : "Student created successfully!";

      return {
        success: true,
        student: {
          id: result.user.id,
          name: result.user.name || '',
          email: result.user.email || '',
          enrollmentNumber: result.studentProfile.enrollmentNumber,
          studentProfileId: result.studentProfile.id,
          classEnrollmentId: result.classEnrollment?.id
        },
        validation,
        message: successMessage
      };

    } catch (error: any) {
      // Handle any unexpected errors gracefully
      return {
        success: false,
        validation: {
          ...validation,
          isValid: false,
          errors: {
            ...validation.errors,
            general: error.message || "An unexpected error occurred"
          }
        },
        message: "Failed to create student due to an unexpected error"
      };
    }
  }
}
