import { PrismaClient } from "@prisma/client";
import { prisma } from "@/server/db";
import { EnrollmentHistoryService } from "./enrollment-history.service";

// Define PaymentStatusType enum since it's not exported from @prisma/client yet
type PaymentStatusType = "PAID" | "PENDING" | "PARTIAL" | "WAIVED";

// Define FeeComponent type for fee structure components
type FeeComponent = {
  name: string;
  type: string;
  amount: number;
  description?: string;
};

// Create an instance of the EnrollmentHistoryService
const historyService = new EnrollmentHistoryService();
import { z } from "zod";

// Input schemas
export const createFeeStructureSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  programCampusId: z.string(),
  academicCycleId: z.string().optional(),
  termId: z.string().optional(),
  feeComponents: z.array(
    z.object({
      name: z.string(),
      type: z.string(),
      amount: z.number().positive(),
      description: z.string().optional(),
    })
  ),
  isRecurring: z.boolean().default(false),
  recurringInterval: z.string().optional(),
  createdById: z.string(),
});

export const updateFeeStructureSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  programCampusId: z.string().optional(),
  academicCycleId: z.string().optional(),
  termId: z.string().optional(),
  feeComponents: z
    .array(
      z.object({
        name: z.string(),
        type: z.string(),
        amount: z.number().positive(),
        description: z.string().optional(),
      })
    )
    .optional(),
  isRecurring: z.boolean().optional(),
  recurringInterval: z.string().optional(),
  updatedById: z.string(),
});

export const createEnrollmentFeeSchema = z.object({
  enrollmentId: z.string(),
  feeStructureId: z.string(),
  dueDate: z.date().optional(),
  paymentStatus: z.enum(["PAID", "PENDING", "PARTIAL", "WAIVED"]).default("PENDING"),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
  createdById: z.string(),
});

export const updateEnrollmentFeeSchema = z.object({
  id: z.string(),
  feeStructureId: z.string().optional(),
  dueDate: z.date().optional(),
  paymentStatus: z.enum(["PAID", "PENDING", "PARTIAL", "WAIVED"]).optional(),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
  updatedById: z.string(),
});

export const addDiscountSchema = z.object({
  enrollmentFeeId: z.string(),
  discountTypeId: z.string(),
  amount: z.number().positive(),
  reason: z.string().optional(),
  approvedById: z.string().optional(),
  createdById: z.string(),
});

export const addChargeSchema = z.object({
  enrollmentFeeId: z.string(),
  name: z.string(),
  amount: z.number().positive(),
  reason: z.string().optional(),
  dueDate: z.date().optional(),
  createdById: z.string(),
});

export const addArrearSchema = z.object({
  enrollmentFeeId: z.string(),
  previousFeeId: z.string().optional(),
  amount: z.number().positive(),
  dueDate: z.date().optional(),
  reason: z.string(),
  createdById: z.string(),
});

export const addTransactionSchema = z.object({
  enrollmentFeeId: z.string(),
  challanId: z.string().optional(),
  amount: z.number().positive(),
  date: z.date().default(() => new Date()),
  method: z.string(),
  reference: z.string().optional(),
  notes: z.string().optional(),
  createdById: z.string(),
});

// Types
export type CreateFeeStructureInput = z.infer<typeof createFeeStructureSchema>;
export type UpdateFeeStructureInput = z.infer<typeof updateFeeStructureSchema>;
export type CreateEnrollmentFeeInput = z.infer<typeof createEnrollmentFeeSchema>;
export type UpdateEnrollmentFeeInput = z.infer<typeof updateEnrollmentFeeSchema>;
export type AddDiscountInput = z.infer<typeof addDiscountSchema>;
export type AddChargeInput = z.infer<typeof addChargeSchema>;
export type AddArrearInput = z.infer<typeof addArrearSchema>;
export type AddTransactionInput = z.infer<typeof addTransactionSchema>;

export class FeeService {
  constructor() {
    // Constructor is now empty as we'll use the Prisma client directly
  }

  // Fee Analytics Methods
  /**
   * Gets fee collection statistics
   * @returns Fee collection statistics
   */
  async getFeeCollectionStats() {
    try {
      // Get total fee collected
      const totalCollected = await prisma.feeTransaction.aggregate({
        _sum: {
          amount: true,
        },
      });

      // Get total pending fees
      const enrollmentFees = await prisma.enrollmentFee.findMany({
        where: {
          paymentStatus: {
            in: ["PENDING", "PARTIAL"],
          },
        },
        select: {
          finalAmount: true,
          transactions: {
            select: {
              amount: true,
            },
          },
        },
      });

      let pendingFees = 0;
      for (const fee of enrollmentFees) {
        const paidAmount = fee.transactions.reduce((sum, t) => sum + t.amount, 0);
        pendingFees += fee.finalAmount - paidAmount;
      }

      // Get student fee statistics
      const totalStudents = await prisma.studentEnrollment.count({
        where: {
          status: "ACTIVE",
        },
      });

      // Count students with fees - using a different approach without distinct
      // First get all enrollment IDs that have fees
      const enrollmentsWithFees = await prisma.enrollmentFee.findMany({
        where: {
          enrollment: {
            status: "ACTIVE",
          },
        },
        select: {
          enrollmentId: true,
        },
      });

      // Count unique enrollment IDs
      const uniqueEnrollmentIds = new Set(enrollmentsWithFees.map(e => e.enrollmentId));
      const studentsWithFees = uniqueEnrollmentIds.size;

      const studentsWithoutFees = totalStudents - studentsWithFees;

      // Get fee structures count
      const feeStructures = await prisma.feeStructure.count({
        where: {
          status: "ACTIVE",
        },
      });

      // Get discount types count
      const discountTypes = await prisma.discountType.count({
        where: {
          status: "ACTIVE",
        },
      });

      // Get recent transactions with error handling
      let recentTransactions: any[] = [];
      try {
        recentTransactions = await prisma.feeTransaction.findMany({
          take: 5,
          orderBy: {
            date: "desc",
          },
          include: {
            enrollmentFee: {
              include: {
                enrollment: {
                  include: {
                    student: {
                      include: {
                        user: {
                          select: {
                            name: true,
                          },
                        },
                      },
                    },
                    class: {
                      include: {
                        courseCampus: {
                          include: {
                            campus: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        });
      } catch (error) {
        console.error('Error fetching recent transactions:', error);
        // Continue with empty transactions array
      }

      // Map transactions with safe access to nested properties
      const mappedTransactions = recentTransactions.map((t: any) => {
        try {
          return {
            id: t.id || 'unknown-id',
            amount: t.amount || 0,
            date: t.date || new Date(),
            studentName: t.enrollmentFee?.enrollment?.student?.user?.name || 'Unknown Student',
            studentId: t.enrollmentFee?.enrollment?.studentId || 'Unknown',
            campusName: t.enrollmentFee?.enrollment?.class?.courseCampus?.campus?.name || 'Unknown Campus',
            campusId: t.enrollmentFee?.enrollment?.class?.courseCampus?.campusId || 'Unknown',
          };
        } catch (error) {
          // If any property access fails, return a fallback object
          return {
            id: typeof t.id === 'string' ? t.id : 'unknown-id',
            amount: typeof t.amount === 'number' ? t.amount : 0,
            date: t.date instanceof Date ? t.date : new Date(),
            studentName: 'Unknown Student',
            studentId: 'Unknown',
            campusName: 'Unknown Campus',
            campusId: 'Unknown',
          };
        }
      });

      return {
        totalCollected: totalCollected._sum.amount || 0,
        pendingFees,
        totalStudents,
        studentsWithFees,
        studentsWithoutFees,
        feeStructures,
        discountTypes,
        recentTransactions: mappedTransactions,
      };
    } catch (error) {
      console.error('Error getting fee collection stats:', error);
      throw new Error(`Failed to get fee collection statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Fee Structure Methods
  /**
   * Creates a new fee structure
   * @param input The fee structure data
   * @returns The created fee structure
   */
  async createFeeStructure(input: CreateFeeStructureInput) {
    const { feeComponents, programCampusId, createdById, ...restData } = input;

    // Ensure name is provided
    if (!restData.name) {
      throw new Error('Fee structure name is required');
    }

    // Extract name to ensure it's treated as a required field
    const { name, ...otherData } = restData;

    return prisma.feeStructure.create({
      data: {
        name, // Explicitly provide name as a required field
        ...otherData,
        feeComponents: feeComponents as any,
        programCampus: {
          connect: { id: programCampusId }
        },
        createdBy: {
          connect: { id: createdById }
        }
      },
    });
  }

  /**
   * Gets a fee structure by ID
   * @param id The fee structure ID
   * @returns The fee structure or null if not found
   */
  async getFeeStructure(id: string) {
    return prisma.feeStructure.findUnique({
      where: { id },
    });
  }

  async getFeeStructuresByProgramCampus(programCampusId: string) {
    return prisma.feeStructure.findMany({
      where: {
        programCampusId,
        status: "ACTIVE",
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateFeeStructure(input: UpdateFeeStructureInput) {
    const { id, feeComponents, ...data } = input;

    return prisma.feeStructure.update({
      where: { id },
      data: {
        ...data,
        ...(feeComponents && { feeComponents: feeComponents as any }),
      },
    });
  }

  async deleteFeeStructure(id: string) {
    return prisma.feeStructure.update({
      where: { id },
      data: { status: "DELETED" },
    });
  }

  // Enrollment Fee Methods
  /**
   * Creates a new enrollment fee record
   * @param input The enrollment fee data
   * @returns The created enrollment fee
   * @throws Error if fee structure is not found or if there's an issue creating the fee
   */
  async createEnrollmentFee(input: CreateEnrollmentFeeInput) {
    const { enrollmentId, feeStructureId, ...data } = input;

    try {
      // Get fee structure
      const feeStructure = await prisma.feeStructure.findUnique({
        where: { id: feeStructureId },
      });

      if (!feeStructure) {
        throw new Error(`Fee structure with ID ${feeStructureId} not found`);
      }

      // Validate enrollment ID
      if (!enrollmentId) {
        throw new Error('Enrollment ID is required');
      }

      // Calculate base amount from fee components
      const components = feeStructure.feeComponents as FeeComponent[];
      if (!components || !Array.isArray(components) || components.length === 0) {
        throw new Error(`Fee structure ${feeStructureId} has no valid fee components`);
      }

      const baseAmount = components.reduce((sum, component) => sum + component.amount, 0);
      if (baseAmount <= 0) {
        throw new Error(`Fee structure ${feeStructureId} has an invalid base amount: ${baseAmount}`);
      }

      // Create enrollment fee
      const { createdById, ...restData } = data;

      // Extract paymentStatus from restData to avoid duplication
      const { paymentStatus: paymentStatusFromRest, ...otherData } = restData;
      const paymentStatus = paymentStatusFromRest || 'PENDING';

      // Create the enrollment fee with proper type handling
      const enrollmentFeeData: any = {
        enrollment: {
          connect: { id: enrollmentId }
        },
        feeStructure: {
          connect: { id: feeStructureId }
        },
        baseAmount,
        discountedAmount: baseAmount, // Initially no discounts
        finalAmount: baseAmount, // Initially no additional charges or arrears
        paymentStatus, // Ensure this required field is always provided
        ...otherData,
      };

      // Only add createdBy if provided
      if (createdById) {
        enrollmentFeeData.createdBy = {
          connect: { id: createdById }
        };
      }

      const enrollmentFee = await prisma.enrollmentFee.create({
        data: enrollmentFeeData,
      });

      // Create history entry
      await historyService.createHistoryEntry({
        enrollmentId,
        action: "FEE_ASSIGNED",
        details: {
          feeId: enrollmentFee.id,
          feeStructureId,
          baseAmount
        },
        createdById: input.createdById || "",
      });

      return enrollmentFee;
    } catch (error) {
      // Enhance error message with context
      if (error instanceof Error) {
        throw new Error(`Failed to create enrollment fee: ${error.message}`);
      }
      throw new Error(`Failed to create enrollment fee: Unknown error`);
    }
  }

  /**
   * Gets enrollment fee by enrollment ID
   * @param enrollmentId The enrollment ID
   * @returns The enrollment fee or null if not found
   */
  async getEnrollmentFeeByEnrollment(enrollmentId: string) {
    return prisma.enrollmentFee.findUnique({
      where: { enrollmentId },
      include: {
        feeStructure: true,
        discounts: {
          include: {
            discountType: true,
          },
        },
        additionalCharges: true,
        arrears: true,
        challans: {
          orderBy: { createdAt: "desc" },
        },
        transactions: {
          orderBy: { date: "desc" },
        },
      },
    });
  }

  async updateEnrollmentFee(input: UpdateEnrollmentFeeInput) {
    const { id, feeStructureId, ...data } = input;

    // Get current enrollment fee
    const currentFee = await prisma.enrollmentFee.findUnique({
      where: { id },
      include: {
        discounts: true,
        additionalCharges: true,
        arrears: true,
      },
    });

    if (!currentFee) {
      throw new Error("Enrollment fee not found");
    }

    let baseAmount = currentFee.baseAmount;
    let discountedAmount = currentFee.discountedAmount;
    let finalAmount = currentFee.finalAmount;

    // If fee structure is changing, recalculate base amount
    if (feeStructureId && feeStructureId !== currentFee.feeStructureId) {
      const feeStructure = await prisma.feeStructure.findUnique({
        where: { id: feeStructureId },
      });

      if (!feeStructure) {
        throw new Error("Fee structure not found");
      }

      // Calculate new base amount
      const components = feeStructure.feeComponents as any[];
      baseAmount = components.reduce((sum, component) => sum + component.amount, 0);

      // Recalculate discounted amount
      const totalDiscounts = currentFee.discounts.reduce((sum: number, d: any) => sum + d.amount, 0);
      discountedAmount = baseAmount - totalDiscounts;

      // Recalculate final amount
      const totalCharges = currentFee.additionalCharges.reduce((sum: number, c: any) => sum + c.amount, 0);
      const totalArrears = currentFee.arrears.reduce((sum: number, a: any) => sum + a.amount, 0);
      finalAmount = discountedAmount + totalCharges + totalArrears;
    }

    // Update enrollment fee
    const enrollmentFee = await prisma.enrollmentFee.update({
      where: { id },
      data: {
        ...(feeStructureId && { feeStructureId }),
        ...(feeStructureId && { baseAmount }),
        ...(feeStructureId && { discountedAmount }),
        ...(feeStructureId && { finalAmount }),
        ...data,
      },
    });

    // Create history entry
    await historyService.createHistoryEntry({
      enrollmentId: currentFee.enrollmentId,
      action: "FEE_UPDATED",
      details: {
        feeId: id,
        ...(feeStructureId && { feeStructureId, oldFeeStructureId: currentFee.feeStructureId }),
        ...(feeStructureId && { baseAmount, oldBaseAmount: currentFee.baseAmount }),
        ...(data.paymentStatus && { paymentStatus: data.paymentStatus, oldPaymentStatus: currentFee.paymentStatus }),
      },
      createdById: input.updatedById || "",
    });

    return enrollmentFee;
  }

  // Discount Methods
  /**
   * Adds a discount to an enrollment fee
   * @param input The discount data
   * @returns The created discount
   * @throws Error if enrollment fee or discount type is not found, or if there's an issue adding the discount
   */
  async addDiscount(input: AddDiscountInput) {
    const { enrollmentFeeId, discountTypeId, amount, ...data } = input;

    try {
      // Validate input
      if (!enrollmentFeeId) {
        throw new Error('Enrollment fee ID is required');
      }

      if (!discountTypeId) {
        throw new Error('Discount type ID is required');
      }

      if (amount <= 0) {
        throw new Error('Discount amount must be greater than zero');
      }

      // Get enrollment fee
      const enrollmentFee = await prisma.enrollmentFee.findUnique({
        where: { id: enrollmentFeeId },
        include: {
          discounts: true,
          additionalCharges: true,
          arrears: true,
        },
      });

      if (!enrollmentFee) {
        throw new Error(`Enrollment fee with ID ${enrollmentFeeId} not found`);
      }

      // Get discount type
      const discountType = await prisma.discountType.findUnique({
        where: { id: discountTypeId },
      });

      if (!discountType) {
        throw new Error(`Discount type with ID ${discountTypeId} not found`);
      }

      // Check if discount amount is valid
      if (amount > enrollmentFee.baseAmount) {
        throw new Error(`Discount amount (${amount}) cannot exceed the base fee amount (${enrollmentFee.baseAmount})`);
      }

      // Create discount with proper type handling
      const { createdById, approvedById, ...restData } = data;

      const discountData: any = {
        enrollmentFee: {
          connect: { id: enrollmentFeeId }
        },
        discountType: {
          connect: { id: discountTypeId }
        },
        amount,
        ...restData,
      };

      // Only add createdBy if provided
      if (createdById) {
        discountData.createdBy = {
          connect: { id: createdById }
        };
      }

      // Only add approvedBy if provided
      if (approvedById) {
        discountData.approvedBy = {
          connect: { id: approvedById }
        };
      }

      const discount = await prisma.feeDiscount.create({
        data: discountData,
      });

      // Recalculate discounted amount
      const totalDiscounts = enrollmentFee.discounts.reduce((sum: number, d: any) => sum + d.amount, 0) + amount;
      const discountedAmount = enrollmentFee.baseAmount - totalDiscounts;

      // Ensure discounted amount is not negative
      if (discountedAmount < 0) {
        // Rollback the discount creation
        await prisma.feeDiscount.delete({
          where: { id: discount.id },
        });
        throw new Error(`Total discounts (${totalDiscounts}) exceed the base amount (${enrollmentFee.baseAmount})`);
      }

      // Recalculate final amount
      const totalCharges = enrollmentFee.additionalCharges.reduce((sum: number, c: any) => sum + c.amount, 0);
      const totalArrears = enrollmentFee.arrears.reduce((sum: number, a: any) => sum + a.amount, 0);
      const finalAmount = discountedAmount + totalCharges + totalArrears;

      // Update enrollment fee
      await prisma.enrollmentFee.update({
        where: { id: enrollmentFeeId },
        data: {
          discountedAmount,
          finalAmount,
        },
      });

      // Create history entry
      await historyService.createHistoryEntry({
        enrollmentId: enrollmentFee.enrollmentId,
        action: "DISCOUNT_ADDED",
        details: {
          feeId: enrollmentFeeId,
          discountId: discount.id,
          discountTypeId,
          amount,
          discountedAmount,
          finalAmount,
        },
        createdById: input.createdById || "",
      });

      return discount;
    } catch (error) {
      // Enhance error message with context
      if (error instanceof Error) {
        throw new Error(`Failed to add discount: ${error.message}`);
      }
      throw new Error(`Failed to add discount: Unknown error`);
    }
  }

  /**
   * Removes a discount from an enrollment fee
   * @param discountId The discount ID to remove
   * @returns The updated enrollment fee
   * @throws Error if discount is not found or if there's an issue removing it
   */
  async removeDiscount(discountId: string) {
    // Get discount
    const discount = await prisma.feeDiscount.findUnique({
      where: { id: discountId },
      include: {
        enrollmentFee: {
          include: {
            discounts: true,
            additionalCharges: true,
            arrears: true,
          },
        },
      },
    });

    if (!discount) {
      throw new Error("Discount not found");
    }

    const enrollmentFee = discount.enrollmentFee;

    // Delete discount
    await prisma.feeDiscount.delete({
      where: { id: discountId },
    });

    // Recalculate discounted amount
    const remainingDiscounts = enrollmentFee.discounts.filter((d: any) => d.id !== discountId);
    const totalDiscounts = remainingDiscounts.reduce((sum: number, d: any) => sum + d.amount, 0);
    const discountedAmount = enrollmentFee.baseAmount - totalDiscounts;

    // Recalculate final amount
    const totalCharges = enrollmentFee.additionalCharges.reduce((sum: number, c: any) => sum + c.amount, 0);
    const totalArrears = enrollmentFee.arrears.reduce((sum: number, a: any) => sum + a.amount, 0);
    const finalAmount = discountedAmount + totalCharges + totalArrears;

    // Update enrollment fee
    await prisma.enrollmentFee.update({
      where: { id: enrollmentFee.id },
      data: {
        discountedAmount,
        finalAmount,
      },
    });

    // Create history entry
    await historyService.createHistoryEntry({
      enrollmentId: enrollmentFee.enrollmentId,
      action: "DISCOUNT_REMOVED",
      details: {
        feeId: enrollmentFee.id,
        discountId,
        amount: discount.amount,
        discountedAmount,
        finalAmount,
      },
      createdById: discount.createdById || "", // Using the original creator for simplicity
    });

    return { success: true };
  }

  // Additional Charge Methods
  /**
   * Adds an additional charge to an enrollment fee
   * @param input The additional charge data
   * @returns The created additional charge
   * @throws Error if enrollment fee is not found or if there's an issue adding the charge
   */
  async addAdditionalCharge(input: AddChargeInput) {
    const { enrollmentFeeId, name, amount, ...data } = input;

    // Get enrollment fee
    const enrollmentFee = await prisma.enrollmentFee.findUnique({
      where: { id: enrollmentFeeId },
      include: {
        additionalCharges: true,
        arrears: true,
      },
    });

    if (!enrollmentFee) {
      throw new Error("Enrollment fee not found");
    }

    // Create additional charge with proper type handling
    const { createdById, ...restData } = data;

    const chargeData: any = {
      enrollmentFee: {
        connect: { id: enrollmentFeeId }
      },
      name,
      amount,
      ...restData,
    };

    // Only add createdBy if provided
    if (createdById) {
      chargeData.createdBy = {
        connect: { id: createdById }
      };
    }

    const charge = await prisma.additionalCharge.create({
      data: chargeData,
    });

    // Recalculate final amount
    const totalCharges = enrollmentFee.additionalCharges.reduce((sum: number, c: any) => sum + c.amount, 0) + amount;
    const totalArrears = enrollmentFee.arrears.reduce((sum: number, a: any) => sum + a.amount, 0);
    const finalAmount = enrollmentFee.discountedAmount + totalCharges + totalArrears;

    // Update enrollment fee
    await prisma.enrollmentFee.update({
      where: { id: enrollmentFeeId },
      data: {
        finalAmount,
      },
    });

    // Create history entry
    await historyService.createHistoryEntry({
      enrollmentId: enrollmentFee.enrollmentId,
      action: "CHARGE_ADDED",
      details: {
        feeId: enrollmentFeeId,
        chargeId: charge.id,
        name,
        amount,
        finalAmount,
      },
      createdById: input.createdById || "",
    });

    return charge;
  }

  async removeAdditionalCharge(chargeId: string) {
    // Get charge
    const charge = await prisma.additionalCharge.findUnique({
      where: { id: chargeId },
      include: {
        enrollmentFee: {
          include: {
            additionalCharges: true,
            arrears: true,
          },
        },
      },
    });

    if (!charge) {
      throw new Error("Additional charge not found");
    }

    const enrollmentFee = charge.enrollmentFee;

    // Delete charge
    await prisma.additionalCharge.delete({
      where: { id: chargeId },
    });

    // Recalculate final amount
    const remainingCharges = enrollmentFee.additionalCharges.filter((c: any) => c.id !== chargeId);
    const totalCharges = remainingCharges.reduce((sum: number, c: any) => sum + c.amount, 0);
    const totalArrears = enrollmentFee.arrears.reduce((sum: number, a: any) => sum + a.amount, 0);
    const finalAmount = enrollmentFee.discountedAmount + totalCharges + totalArrears;

    // Update enrollment fee
    await prisma.enrollmentFee.update({
      where: { id: enrollmentFee.id },
      data: {
        finalAmount,
      },
    });

    // Create history entry
    await historyService.createHistoryEntry({
      enrollmentId: enrollmentFee.enrollmentId,
      action: "CHARGE_REMOVED",
      details: {
        feeId: enrollmentFee.id,
        chargeId,
        name: charge.name,
        amount: charge.amount,
        finalAmount,
      },
      createdById: charge.createdById || "", // Using the original creator for simplicity
    });

    return { success: true };
  }

  // Arrear Methods
  /**
   * Adds an arrear to an enrollment fee
   * @param input The arrear data
   * @returns The created arrear
   * @throws Error if enrollment fee is not found or if there's an issue adding the arrear
   */
  async addArrear(input: AddArrearInput) {
    const { enrollmentFeeId, amount, ...data } = input;

    // Get enrollment fee
    const enrollmentFee = await prisma.enrollmentFee.findUnique({
      where: { id: enrollmentFeeId },
      include: {
        additionalCharges: true,
        arrears: true,
      },
    });

    if (!enrollmentFee) {
      throw new Error("Enrollment fee not found");
    }

    // Create arrear with proper type handling
    const { createdById, ...restData } = data;

    const arrearData: any = {
      enrollmentFee: {
        connect: { id: enrollmentFeeId }
      },
      amount,
      ...restData,
    };

    // Only add createdBy if provided
    if (createdById) {
      arrearData.createdBy = {
        connect: { id: createdById }
      };
    }

    const arrear = await prisma.feeArrear.create({
      data: arrearData,
    });

    // Recalculate final amount
    const totalCharges = enrollmentFee.additionalCharges.reduce((sum: number, c: any) => sum + c.amount, 0);
    const totalArrears = enrollmentFee.arrears.reduce((sum: number, a: any) => sum + a.amount, 0) + amount;
    const finalAmount = enrollmentFee.discountedAmount + totalCharges + totalArrears;

    // Update enrollment fee
    await prisma.enrollmentFee.update({
      where: { id: enrollmentFeeId },
      data: {
        finalAmount,
      },
    });

    // Create history entry
    await historyService.createHistoryEntry({
      enrollmentId: enrollmentFee.enrollmentId,
      action: "ARREAR_ADDED",
      details: {
        feeId: enrollmentFeeId,
        arrearId: arrear.id,
        amount,
        reason: data.reason,
        finalAmount,
      },
      createdById: input.createdById || "",
    });

    return arrear;
  }

  async removeArrear(arrearId: string) {
    // Get arrear
    const arrear = await prisma.feeArrear.findUnique({
      where: { id: arrearId },
      include: {
        enrollmentFee: {
          include: {
            additionalCharges: true,
            arrears: true,
          },
        },
      },
    });

    if (!arrear) {
      throw new Error("Arrear not found");
    }

    const enrollmentFee = arrear.enrollmentFee;

    // Delete arrear
    await prisma.feeArrear.delete({
      where: { id: arrearId },
    });

    // Recalculate final amount
    const totalCharges = enrollmentFee.additionalCharges.reduce((sum: number, c: any) => sum + c.amount, 0);
    const remainingArrears = enrollmentFee.arrears.filter((a: any) => a.id !== arrearId);
    const totalArrears = remainingArrears.reduce((sum: number, a: any) => sum + a.amount, 0);
    const finalAmount = enrollmentFee.discountedAmount + totalCharges + totalArrears;

    // Update enrollment fee
    await prisma.enrollmentFee.update({
      where: { id: enrollmentFee.id },
      data: {
        finalAmount,
      },
    });

    // Create history entry
    await historyService.createHistoryEntry({
      enrollmentId: enrollmentFee.enrollmentId,
      action: "ARREAR_REMOVED",
      details: {
        feeId: enrollmentFee.id,
        arrearId,
        amount: arrear.amount,
        reason: arrear.reason,
        finalAmount,
      },
      createdById: arrear.createdById || "", // Using the original creator for simplicity
    });

    return { success: true };
  }

  // Transaction Methods
  /**
   * Adds a transaction to an enrollment fee
   * @param input The transaction data
   * @returns The created transaction
   * @throws Error if enrollment fee is not found or if there's an issue adding the transaction
   */
  async addTransaction(input: AddTransactionInput) {
    const { enrollmentFeeId, amount, ...data } = input;

    try {
      // Validate input
      if (!enrollmentFeeId) {
        throw new Error('Enrollment fee ID is required');
      }

      if (amount <= 0) {
        throw new Error('Transaction amount must be greater than zero');
      }

      if (!data.method) {
        throw new Error('Payment method is required');
      }

      // Get enrollment fee
      const enrollmentFee = await prisma.enrollmentFee.findUnique({
        where: { id: enrollmentFeeId },
        include: {
          transactions: true,
        },
      });

      if (!enrollmentFee) {
        throw new Error(`Enrollment fee with ID ${enrollmentFeeId} not found`);
      }

      // Check if the fee is already paid
      if (enrollmentFee.paymentStatus === 'PAID') {
        throw new Error(`This fee has already been fully paid`);
      }

      // Create transaction with proper type handling
      const { createdById, challanId, ...restData } = data;

      // Extract date and method from restData to avoid duplication
      const { date: dateFromRest, method: methodFromRest, ...otherData } = restData;

      const transactionData: any = {
        enrollmentFee: {
          connect: { id: enrollmentFeeId }
        },
        amount,
        date: dateFromRest || new Date(), // Ensure date is provided
        method: methodFromRest || 'CASH', // Ensure method is provided
        ...otherData,
      };

      // Only add challan if provided
      if (challanId) {
        transactionData.challan = {
          connect: { id: challanId }
        };
      }

      // Only add createdBy if provided
      if (createdById) {
        transactionData.createdBy = {
          connect: { id: createdById }
        };
      }

      const transaction = await prisma.feeTransaction.create({
        data: transactionData,
      });

      // Calculate total paid amount
      const totalPaid = enrollmentFee.transactions.reduce((sum: number, t: any) => sum + t.amount, 0) + amount;

      // Update payment status
      let newStatus: PaymentStatusType = enrollmentFee.paymentStatus;
      if (totalPaid >= enrollmentFee.finalAmount) {
        newStatus = "PAID";
      } else if (totalPaid > 0) {
        newStatus = "PARTIAL";
      }

      await prisma.enrollmentFee.update({
        where: { id: enrollmentFeeId },
        data: {
          paymentStatus: newStatus,
        },
      });

      // If transaction is for a challan, update challan paid amount and status
      if (data.challanId) {
        const challan = await prisma.feeChallan.findUnique({
          where: { id: data.challanId },
          include: {
            transactions: true,
          },
        });

        if (!challan) {
          throw new Error(`Challan with ID ${data.challanId} not found`);
        }

        const challanPaid = challan.transactions.reduce((sum: number, t: any) => sum + t.amount, 0) + amount;
        let challanStatus: PaymentStatusType = challan.paymentStatus;

        if (challanPaid >= challan.totalAmount) {
          challanStatus = "PAID";
        } else if (challanPaid > 0) {
          challanStatus = "PARTIAL";
        }

        await prisma.feeChallan.update({
          where: { id: data.challanId },
          data: {
            paidAmount: challanPaid,
            paymentStatus: challanStatus,
          },
        });
      }

      // Create history entry
      await historyService.createHistoryEntry({
        enrollmentId: enrollmentFee.enrollmentId,
        action: "TRANSACTION_ADDED",
        details: {
          feeId: enrollmentFeeId,
          transactionId: transaction.id,
          amount,
          method: data.method,
          totalPaid,
          newStatus,
          ...(data.challanId && { challanId: data.challanId }),
        },
        createdById: input.createdById || "",
      });

      return transaction;
    } catch (error) {
      // Enhance error message with context
      if (error instanceof Error) {
        throw new Error(`Failed to add transaction: ${error.message}`);
      }
      throw new Error(`Failed to add transaction: Unknown error`);
    }
  }

  /**
   * Gets all transactions for an enrollment fee
   * @param enrollmentFeeId The enrollment fee ID
   * @returns Array of transactions
   */
  async getTransactions(enrollmentFeeId: string) {
    return prisma.feeTransaction.findMany({
      where: { enrollmentFeeId },
      orderBy: { date: "desc" },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async generateReceipt(transactionId: string) {
    // Get transaction with related data
    const transaction = await prisma.feeTransaction.findUnique({
      where: { id: transactionId },
      include: {
        enrollmentFee: {
          include: {
            enrollment: {
              include: {
                student: true,
                class: true,
              },
            },
            feeStructure: true,
          },
        },
        challan: true,
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    // In a real implementation, generate PDF and update receiptUrl
    // For now, just return the transaction
    return transaction;
  }
}
