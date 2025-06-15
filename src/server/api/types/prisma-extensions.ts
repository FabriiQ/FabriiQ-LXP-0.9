/**
 * Prisma Type Extensions
 * 
 * This file contains type extensions for Prisma models to handle cases where
 * the schema has been updated but the Prisma client hasn't been regenerated.
 */

import { Prisma } from '@prisma/client';

/**
 * Extended ActivityGradeInclude type that includes learningTimeRecords
 */
export type ExtendedActivityGradeInclude = Prisma.ActivityGradeInclude & {
  learningTimeRecords?: boolean;
};

/**
 * Extended ActivityGradeArgs type that uses the extended include type
 */
export type ExtendedActivityGradeArgs = Omit<Prisma.ActivityGradeArgs, 'include'> & {
  include?: ExtendedActivityGradeInclude;
};

/**
 * Extended PrismaClient type with modified ActivityGrade methods
 */
export type ExtendedPrismaClient = Prisma.PrismaClient & {
  activityGrade: Prisma.ActivityGradeDelegate<Prisma.RejectOnNotFound | Prisma.RejectPerOperation | undefined> & {
    findMany<T extends ExtendedActivityGradeArgs>(
      args?: Prisma.SelectSubset<T, ExtendedActivityGradeArgs>
    ): Promise<any[]>;
  };
};
