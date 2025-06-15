import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { TRPCError } from '@trpc/server';
import { SystemStatus, UserType } from '../constants';

// Input validation schemas
const policyRuleSchema = z.object({
  name: z.string(),
  description: z.string(),
  isRequired: z.boolean(),
  validationRule: z.string().optional(),
  errorMessage: z.string().optional(),
});

const policySettingsSchema = z.object({
  allowRetake: z.boolean().default(false),
  maxRetakes: z.number().min(0).optional(),
  requireApproval: z.boolean().default(false),
  autoGrade: z.boolean().default(true),
  showResults: z.boolean().default(true),
  passingScore: z.number().min(0).max(100).optional(),
});

const createPolicySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1),
  status: z.nativeEnum(SystemStatus).default(SystemStatus.ACTIVE),
  rules: z.array(policyRuleSchema).min(1),
  settings: policySettingsSchema,
});

const updatePolicySchema = createPolicySchema.partial();

export const policyRouter = createTRPCRouter({
  // Create policy
  createPolicy: protectedProcedure
    .input(createPolicySchema)
    .mutation(async ({ input, ctx }) => {
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.CAMPUS_ADMIN,
        ].includes(ctx.session.userType as UserType)
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      return ctx.prisma.assessmentPolicy.create({
        data: {
          name: input.name,
          description: input.description,
          status: input.status,
          rules: input.rules,
          settings: input.settings,
          createdById: ctx.session.userId,
        },
      });
    }),

  // Update policy
  updatePolicy: protectedProcedure
    .input(z.object({
      id: z.string(),
      ...updatePolicySchema.shape
    }))
    .mutation(async ({ input, ctx }) => {
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.CAMPUS_ADMIN,
        ].includes(ctx.session.userType as UserType)
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const { id, ...data } = input;
      return ctx.prisma.assessmentPolicy.update({
        where: { id },
        data: {
          ...data,
          updatedById: ctx.session.userId,
        },
      });
    }),

  // Delete policy
  deletePolicy: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
        ].includes(ctx.session.userType as UserType)
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      return ctx.prisma.assessmentPolicy.delete({
        where: { id: input.id },
      });
    }),

  // Get policy by ID
  getPolicyById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.prisma.assessmentPolicy.findUnique({
        where: { id: input.id },
      });
    }),

  // List policies
  listPolicies: protectedProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(100).default(10),
      sortBy: z.string().optional(),
      sortOrder: z.enum(["asc", "desc"]).optional(),
      status: z.nativeEnum(SystemStatus).optional(),
      search: z.string().optional(),
    }).optional())
    .query(async ({ input = {}, ctx }) => {
      const {
        page = 1,
        pageSize = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        status,
        search,
      } = input;

      const where = {
        ...(status && { status }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }),
      };

      const [total, items] = await Promise.all([
        ctx.prisma.assessmentPolicy.count({ where }),
        ctx.prisma.assessmentPolicy.findMany({
          where,
          orderBy: { [sortBy]: sortOrder },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ]);

      return {
        items,
        total,
        page,
        pageSize,
        hasMore: total > page * pageSize,
      };
    }),
});

export default policyRouter; 