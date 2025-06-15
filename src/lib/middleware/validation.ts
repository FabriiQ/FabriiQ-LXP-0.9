import { TRPCError } from '@trpc/server';
import { z } from 'zod';

export const validateInput = <T extends z.ZodType>(schema: T) => {
  return async (input: unknown) => {
    try {
      return await schema.parseAsync(input);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error.errors.map(e => e.message).join(', '),
        });
      }
      throw error;
    }
  };
};

export const validateOutput = <T extends z.ZodType>(schema: T) => {
  return async (output: unknown) => {
    try {
      return await schema.parseAsync(output);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Invalid response format',
          cause: error,
        });
      }
      throw error;
    }
  };
}; 