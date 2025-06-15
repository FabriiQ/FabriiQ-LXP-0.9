import { prisma } from "@/server/db";
import { z } from "zod";

// Input schemas
export const createChallanTemplateSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  design: z.object({}).passthrough(), // Allow any JSON structure for the design
  copies: z.number().int().min(1).default(3),
  institutionId: z.string(),
  createdById: z.string(),
});

export const updateChallanTemplateSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  design: z.object({}).passthrough().optional(),
  copies: z.number().int().min(1).optional(),
  updatedById: z.string(),
});

export const generateChallanSchema = z.object({
  enrollmentFeeId: z.string(),
  templateId: z.string(),
  issueDate: z.date().default(() => new Date()),
  dueDate: z.date(),
  bankDetails: z.object({}).passthrough().optional(),
  createdById: z.string(),
});

export const bulkGenerateChallansSchema = z.object({
  filters: z.object({
    campusId: z.string().optional(),
    programId: z.string().optional(),
    classId: z.string().optional(),
    month: z.number().min(1).max(12).optional(),
    year: z.number().optional(),
    hasPendingFees: z.boolean().optional(),
  }),
  templateId: z.string(),
  issueDate: z.date().default(() => new Date()),
  dueDate: z.date(),
  bankDetails: z.object({}).passthrough().optional(),
  createdById: z.string(),
});

// Types
export type CreateChallanTemplateInput = z.infer<typeof createChallanTemplateSchema>;
export type UpdateChallanTemplateInput = z.infer<typeof updateChallanTemplateSchema>;
export type GenerateChallanInput = z.infer<typeof generateChallanSchema>;
export type BulkGenerateChallansInput = z.infer<typeof bulkGenerateChallansSchema>;

export class ChallanService {
  constructor() {
    // Constructor is now empty as we'll use the prisma client directly
  }

  // Challan Template Methods
  async createChallanTemplate(input: CreateChallanTemplateInput) {
    return prisma.challanTemplate.create({
      data: input,
    });
  }

  async getChallanTemplate(id: string) {
    return prisma.challanTemplate.findUnique({
      where: { id },
    });
  }

  async getChallanTemplatesByInstitution(institutionId: string) {
    return prisma.challanTemplate.findMany({
      where: {
        institutionId,
        status: "ACTIVE",
      },
      orderBy: { name: "asc" },
    });
  }

  async updateChallanTemplate(input: UpdateChallanTemplateInput) {
    const { id, ...data } = input;

    return prisma.challanTemplate.update({
      where: { id },
      data,
    });
  }

  async deleteChallanTemplate(id: string) {
    return prisma.challanTemplate.update({
      where: { id },
      data: { status: "DELETED" },
    });
  }

  // Challan Methods
  async generateChallan(input: GenerateChallanInput) {
    const { enrollmentFeeId, templateId, issueDate, dueDate, bankDetails, createdById } = input;

    // Get enrollment fee with related data
    const enrollmentFee = await prisma.enrollmentFee.findUnique({
      where: { id: enrollmentFeeId },
      include: {
        enrollment: {
          include: {
            student: true,
            class: true,
          },
        },
        feeStructure: true,
        discounts: {
          include: {
            discountType: true,
          },
        },
        additionalCharges: true,
        arrears: true,
      },
    }) as any; // Type assertion to avoid TypeScript errors

    if (!enrollmentFee) {
      throw new Error("Enrollment fee not found");
    }

    // Get challan template
    const template = await prisma.challanTemplate.findUnique({
      where: { id: templateId },
    }) as any; // Type assertion to avoid TypeScript errors

    if (!template) {
      throw new Error("Challan template not found");
    }

    // Generate challan number
    const challanNo = `CH-${Date.now().toString().slice(-6)}`;

    // Prepare challan data
    const challanData = {
      student: {
        id: enrollmentFee.enrollment.student.id,
        name: enrollmentFee.enrollment.student.name,
        // Add other student fields as needed
      },
      class: {
        id: enrollmentFee.enrollment.class.id,
        name: enrollmentFee.enrollment.class.name,
        // Add other class fields as needed
      },
      program: {
        id: enrollmentFee.enrollment.program.id,
        name: enrollmentFee.enrollment.program.name,
        // Add other program fields as needed
      },
      campus: {
        id: enrollmentFee.enrollment.program.campus.id,
        name: enrollmentFee.enrollment.program.campus.name,
        // Add other campus fields as needed
      },
      fee: {
        id: enrollmentFee.id,
        baseAmount: enrollmentFee.baseAmount,
        discountedAmount: enrollmentFee.discountedAmount,
        finalAmount: enrollmentFee.finalAmount,
        components: enrollmentFee.feeStructure.feeComponents,
        // Add other fee fields as needed
      },
      discounts: enrollmentFee.discounts.map((discount: any) => ({
        id: discount.id,
        type: discount.discountType.name,
        amount: discount.amount,
        // Add other discount fields as needed
      })),
      additionalCharges: enrollmentFee.additionalCharges.map((charge: any) => ({
        id: charge.id,
        name: charge.name,
        amount: charge.amount,
        // Add other charge fields as needed
      })),
      arrears: enrollmentFee.arrears.map((arrear: any) => ({
        id: arrear.id,
        amount: arrear.amount,
        reason: arrear.reason,
        // Add other arrear fields as needed
      })),
      challan: {
        challanNo,
        issueDate,
        dueDate,
        totalAmount: enrollmentFee.finalAmount,
        // Add other challan fields as needed
      },
      template: {
        id: template.id,
        name: template.name,
        copies: template.copies,
        design: template.design,
        // Add other template fields as needed
      },
      bankDetails: bankDetails || {},
    };

    // Create challan
    const challan = await prisma.feeChallan.create({
      data: {
        enrollmentFeeId,
        challanNo,
        issueDate,
        dueDate,
        totalAmount: enrollmentFee.finalAmount,
        paidAmount: 0,
        paymentStatus: "PENDING",
        templateId,
        challanData: challanData as any,
        bankDetails: bankDetails as any,
        createdById,
      },
    }) as any; // Type assertion to avoid TypeScript errors

    // Create history entry
    await prisma.enrollmentHistory.create({
      data: {
        enrollmentId: enrollmentFee.enrollmentId,
        action: "CHALLAN_GENERATED",
        details: {
          feeId: enrollmentFeeId,
          challanId: challan.id,
          challanNo,
          totalAmount: enrollmentFee.finalAmount,
          dueDate,
        },
        createdById,
      },
    });

    return challan;
  }

  async getChallan(id: string) {
    return prisma.feeChallan.findUnique({
      where: { id },
      include: {
        enrollmentFee: {
          include: {
            enrollment: {
              include: {
                student: true,
                class: true,
              },
            },
          },
        },
        template: true,
        transactions: {
          orderBy: { date: "desc" },
        },
      },
    });
  }

  async getChallansByEnrollmentFee(enrollmentFeeId: string) {
    return prisma.feeChallan.findMany({
      where: { enrollmentFeeId },
      orderBy: { createdAt: "desc" },
      include: {
        template: true,
        transactions: {
          orderBy: { date: "desc" },
        },
      },
    });
  }

  async printChallan(id: string) {
    // Get challan with related data
    const challan = await prisma.feeChallan.findUnique({
      where: { id },
      include: {
        enrollmentFee: {
          include: {
            enrollment: {
              include: {
                student: true,
                class: true,
              },
            },
          },
        },
        template: true,
      },
    }) as any; // Type assertion to avoid TypeScript errors

    if (!challan) {
      throw new Error("Challan not found");
    }

    // In a real implementation, generate PDF for printing
    // For now, just return the challan data
    return {
      challan,
      printUrl: `/api/challan/print/${id}`, // This would be a real URL in production
    };
  }

  async emailChallan(id: string, email: string) {
    // Get challan with related data
    const challan = await prisma.feeChallan.findUnique({
      where: { id },
      include: {
        enrollmentFee: {
          include: {
            enrollment: {
              include: {
                student: true,
                class: true,
              },
            },
          },
        },
        template: true,
      },
    }) as any; // Type assertion to avoid TypeScript errors

    if (!challan) {
      throw new Error("Challan not found");
    }

    // In a real implementation, generate PDF and send email
    // For now, just return success
    return {
      success: true,
      message: `Challan ${challan.challanNo} emailed to ${email}`,
    };
  }

  async batchPrintChallans(ids: string[]) {
    // Get challans with related data
    const challans = await prisma.feeChallan.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      include: {
        enrollmentFee: {
          include: {
            enrollment: {
              include: {
                student: true,
                class: true,
              },
            },
          },
        },
        template: true,
      },
    }) as any[]; // Type assertion to avoid TypeScript errors

    if (challans.length === 0) {
      throw new Error("No challans found");
    }

    // In a real implementation, generate PDF for printing
    // For now, just return the challans data
    return {
      challans,
      printUrl: `/api/challan/batch-print?ids=${ids.join(",")}`, // This would be a real URL in production
    };
  }

  /**
   * Bulk generate challans for students based on filters
   * @param input Bulk generate challans input
   * @returns Generated challans information
   */
  async bulkGenerateChallans(input: BulkGenerateChallansInput) {
    const { filters, templateId, issueDate, dueDate, bankDetails, createdById } = input;
    const { campusId, programId, classId, month, year, hasPendingFees } = filters;

    // Get challan template
    const template = await prisma.challanTemplate.findUnique({
      where: { id: templateId },
    }) as any; // Type assertion to avoid TypeScript errors

    if (!template) {
      throw new Error("Challan template not found");
    }

    // Build query to find enrollment fees based on filters
    const currentDate = new Date();
    const currentMonth = month || currentDate.getMonth() + 1; // JavaScript months are 0-indexed
    const currentYear = year || currentDate.getFullYear();

    // Find enrollment fees that match the criteria
    const enrollmentFees = await prisma.enrollmentFee.findMany({
      where: {
        // Filter by payment status if hasPendingFees is true
        ...(hasPendingFees && {
          paymentStatus: {
            in: ["PENDING", "PARTIAL"],
          },
        }),
        // Only include fees that don't already have a challan for the current month/year
        NOT: {
          challans: {
            some: {
              issueDate: {
                gte: new Date(currentYear, currentMonth - 1, 1),
                lt: new Date(currentYear, currentMonth, 0),
              },
            },
          },
        },
        enrollment: {
          status: "ACTIVE",
          // Filter by campus if provided
          ...(campusId && {
            class: {
              courseCampus: {
                campusId,
              },
            },
          }),
          // Filter by program if provided
          ...(programId && {
            programId,
          }),
          // Filter by class if provided
          ...(classId && {
            classId,
          }),
        },
      },
      include: {
        enrollment: {
          include: {
            student: true,
            class: true,
          },
        },
        feeStructure: true,
        discounts: {
          include: {
            discountType: true,
          },
        },
        additionalCharges: true,
        arrears: true,
      },
    }) as any[]; // Type assertion to avoid TypeScript errors

    if (enrollmentFees.length === 0) {
      return {
        success: false,
        message: "No eligible enrollment fees found for challan generation",
        totalGenerated: 0,
        challans: [],
      };
    }

    // Generate challans for each enrollment fee
    const generatedChallans: Array<{
      id: string;
      challanNo: string;
      studentName: string;
      className: string;
      amount: number;
    }> = [];
    const failedChallans: Array<{
      enrollmentFeeId: string;
      studentName: string;
      error: string;
    }> = [];

    for (const enrollmentFee of enrollmentFees) {
      try {
        // Generate challan number with prefix based on campus and month/year
        const campusPrefix = enrollmentFee.enrollment.program.campus.code || 'CH';
        const monthYearSuffix = `${currentMonth.toString().padStart(2, '0')}${currentYear.toString().slice(-2)}`;
        const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const challanNo = `${campusPrefix}-${monthYearSuffix}-${randomSuffix}`;

        // Prepare challan data
        const challanData = {
          student: {
            id: enrollmentFee.enrollment.student.id,
            name: enrollmentFee.enrollment.student.name,
          },
          class: {
            id: enrollmentFee.enrollment.class.id,
            name: enrollmentFee.enrollment.class.name,
          },
          program: {
            id: enrollmentFee.enrollment.program.id,
            name: enrollmentFee.enrollment.program.name,
          },
          campus: {
            id: enrollmentFee.enrollment.program.campus.id,
            name: enrollmentFee.enrollment.program.campus.name,
          },
          fee: {
            id: enrollmentFee.id,
            baseAmount: enrollmentFee.baseAmount,
            discountedAmount: enrollmentFee.discountedAmount,
            finalAmount: enrollmentFee.finalAmount,
            components: enrollmentFee.feeStructure.feeComponents,
          },
          discounts: enrollmentFee.discounts.map((discount: any) => ({
            id: discount.id,
            type: discount.discountType.name,
            amount: discount.amount,
          })),
          additionalCharges: enrollmentFee.additionalCharges.map((charge: any) => ({
            id: charge.id,
            name: charge.name,
            amount: charge.amount,
          })),
          arrears: enrollmentFee.arrears.map((arrear: any) => ({
            id: arrear.id,
            amount: arrear.amount,
            reason: arrear.reason,
          })),
          challan: {
            challanNo,
            issueDate,
            dueDate,
            totalAmount: enrollmentFee.finalAmount,
            month: currentMonth,
            year: currentYear,
          },
          template: {
            id: template.id,
            name: template.name,
            copies: template.copies,
            design: template.design,
          },
          bankDetails: bankDetails || {},
        };

        // Create challan
        const challan = await prisma.feeChallan.create({
          data: {
            enrollmentFeeId: enrollmentFee.id,
            challanNo,
            issueDate,
            dueDate,
            totalAmount: enrollmentFee.finalAmount,
            paidAmount: 0,
            paymentStatus: "PENDING",
            templateId,
            challanData: challanData as any,
            bankDetails: bankDetails as any,
            createdById,
          },
        }) as any;

        // Create history entry
        await prisma.enrollmentHistory.create({
          data: {
            enrollmentId: enrollmentFee.enrollmentId,
            action: "CHALLAN_GENERATED",
            details: {
              feeId: enrollmentFee.id,
              challanId: challan.id,
              challanNo,
              totalAmount: enrollmentFee.finalAmount,
              dueDate,
              bulkGenerated: true,
            },
            createdById,
          },
        });

        generatedChallans.push({
          id: challan.id,
          challanNo: challan.challanNo,
          studentName: enrollmentFee.enrollment.student.name,
          className: enrollmentFee.enrollment.class.name,
          amount: challan.totalAmount,
        });
      } catch (error) {
        console.error(`Failed to generate challan for enrollment fee ${enrollmentFee.id}:`, error);
        failedChallans.push({
          enrollmentFeeId: enrollmentFee.id,
          studentName: enrollmentFee.enrollment.student.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      success: true,
      message: `Generated ${generatedChallans.length} challans successfully${failedChallans.length > 0 ? `, ${failedChallans.length} failed` : ''}`,
      totalGenerated: generatedChallans.length,
      totalFailed: failedChallans.length,
      challans: generatedChallans,
      failed: failedChallans,
    };
  }
}
