import { prisma } from "@/server/db";
import { z } from "zod";

// Input schemas
export const createDiscountTypeSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  discountValue: z.number().positive(),
  isPercentage: z.boolean().default(true),
  maxAmount: z.number().positive().optional(),
  applicableFor: z.array(z.string()),
  createdById: z.string(),
});

export const updateDiscountTypeSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  discountValue: z.number().positive().optional(),
  isPercentage: z.boolean().optional(),
  maxAmount: z.number().positive().optional(),
  applicableFor: z.array(z.string()).optional(),
  updatedById: z.string(),
});

// Types
export type CreateDiscountTypeInput = z.infer<typeof createDiscountTypeSchema>;
export type UpdateDiscountTypeInput = z.infer<typeof updateDiscountTypeSchema>;

export class DiscountService {
  constructor() {
    // Constructor is now empty as we'll use the Prisma client directly
  }

  async createDiscountType(input: CreateDiscountTypeInput) {
    const { createdById, ...restData } = input;

    // Ensure name and discountValue are provided (required fields)
    if (!restData.name) {
      throw new Error('Discount type name is required');
    }

    if (restData.discountValue === undefined) {
      throw new Error('Discount value is required');
    }

    // Extract required fields to ensure they're treated as required
    const { name, discountValue, applicableFor, ...otherData } = restData;

    return prisma.discountType.create({
      data: {
        name,
        discountValue,
        applicableFor,
        ...otherData,
        createdBy: {
          connect: { id: createdById }
        }
      },
    });
  }

  async getDiscountType(id: string) {
    return prisma.discountType.findUnique({
      where: { id },
    });
  }

  async getAllDiscountTypes() {
    return prisma.discountType.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
    });
  }

  async getDiscountTypesByApplicability(applicableFor: string) {
    return prisma.discountType.findMany({
      where: {
        status: "ACTIVE",
        applicableFor: {
          has: applicableFor,
        },
      },
      orderBy: { name: "asc" },
    });
  }

  async updateDiscountType(input: UpdateDiscountTypeInput) {
    const { id, ...data } = input;

    return prisma.discountType.update({
      where: { id },
      data,
    });
  }

  async deleteDiscountType(id: string) {
    return prisma.discountType.update({
      where: { id },
      data: { status: "DELETED" },
    });
  }

  async checkSiblingDiscountEligibility(studentId: string) {
    // This is a placeholder for the actual implementation
    // In a real implementation, you would:
    // 1. Get the student's family information
    // 2. Check if there are other active enrollments from the same family
    // 3. Return eligibility information

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _studentId = studentId; // Mark as used to avoid linting warnings

    // For now, we'll just return a mock response
    return {
      eligible: true,
      siblingCount: 2,
      eligibleDiscounts: [
        {
          id: "discount-type-1",
          name: "Sibling Discount (2 siblings)",
          discountValue: 10,
          isPercentage: true,
        },
      ],
    };
  }

  async checkMeritDiscountEligibility(studentId: string) {
    // This is a placeholder for the actual implementation
    // In a real implementation, you would:
    // 1. Get the student's academic records
    // 2. Check if they meet the criteria for merit discounts
    // 3. Return eligibility information

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _studentId = studentId; // Mark as used to avoid linting warnings

    // For now, we'll just return a mock response
    return {
      eligible: true,
      averageGrade: 90,
      eligibleDiscounts: [
        {
          id: "discount-type-2",
          name: "Merit Scholarship (90%+ average)",
          discountValue: 20,
          isPercentage: true,
        },
      ],
    };
  }

  async checkStaffDiscountEligibility(studentId: string) {
    // This is a placeholder for the actual implementation
    // In a real implementation, you would:
    // 1. Get the student's family information
    // 2. Check if any family member is a staff member
    // 3. Return eligibility information

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _studentId = studentId; // Mark as used to avoid linting warnings

    // For now, we'll just return a mock response
    return {
      eligible: false,
      staffRelation: null,
      eligibleDiscounts: [],
    };
  }
}
