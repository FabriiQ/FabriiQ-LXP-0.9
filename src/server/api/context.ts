import { AcademicCycleService } from './services/academic-cycle.service';
import { prisma } from '../db';
import type { CustomSession } from './trpc';

interface ContextOptions {
  session: CustomSession | null;
}

export const createContext = async (opts: ContextOptions) => {
  return {
    session: opts.session,
    prisma,
    academicCycle: new AcademicCycleService({ prisma }),
  };
}; 