import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { SystemStatus } from '../constants';

export const gradingRouter = createTRPCRouter({
  // List grading scales
  listScales: protectedProcedure
    .input(z.object({
      status: z.nativeEnum(SystemStatus).optional(),
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(100).default(10),
    }))
    .query(async ({ input, ctx }) => {
      const { page, pageSize, status } = input;
      const where = status ? { status } : {};
      
      const [total, items] = await Promise.all([
        ctx.prisma.gradingScaleModel.count({ where }),
        ctx.prisma.gradingScaleModel.findMany({
          where,
          orderBy: { createdAt: 'desc' },
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