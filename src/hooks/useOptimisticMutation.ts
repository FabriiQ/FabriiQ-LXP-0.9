'use client';

import { useState } from 'react';
import { api } from '@/utils/api';
import { useToast } from '@/components/ui/use-toast';

/**
 * Hook for creating optimistic UI updates with tRPC mutations
 *
 * @param mutationFn The tRPC mutation function to call
 * @param options Configuration options
 * @returns Object with mutation function and state
 */
export function useOptimisticMutation<TInput, TOutput, TError = Error>(
  mutationFn: (input: TInput) => Promise<TOutput>,
  options: {
    onMutate?: (input: TInput) => void;
    onSuccess?: (data: TOutput, input: TInput) => void;
    onError?: (error: TError, input: TInput) => void;
    onSettled?: (data: TOutput | undefined, error: TError | null, input: TInput) => void;
    successMessage?: string;
    errorMessage?: string;
    invalidateQueries?: string[];
  } = {}
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<TError | null>(null);
  const [data, setData] = useState<TOutput | undefined>(undefined);
  const { toast } = useToast();
  const utils = api.useUtils();

  const mutate = async (input: TInput) => {
    setIsLoading(true);
    setError(null);

    try {
      // Call onMutate callback if provided
      if (options.onMutate) {
        options.onMutate(input);
      }

      // Execute the mutation
      const result = await mutationFn(input);

      // Update state with result
      setData(result);

      // Show success toast if message provided
      if (options.successMessage) {
        toast({
          title: 'Success',
          description: options.successMessage,
          variant: 'success',
        });
      }

      // Call onSuccess callback if provided
      if (options.onSuccess) {
        options.onSuccess(result, input);
      }

      // Invalidate queries if specified
      if (options.invalidateQueries && options.invalidateQueries.length > 0) {
        for (const queryKey of options.invalidateQueries) {
          await utils.invalidate();
        }
      }

      return result;
    } catch (err) {
      // Cast error to TError
      const typedError = err as TError;

      // Update error state
      setError(typedError);

      // Show error toast if message provided
      if (options.errorMessage) {
        toast({
          title: 'Error',
          description: options.errorMessage,
          variant: 'error',
        });
      }

      // Call onError callback if provided
      if (options.onError) {
        options.onError(typedError, input);
      }

      throw typedError;
    } finally {
      setIsLoading(false);

      // Call onSettled callback if provided
      if (options.onSettled) {
        options.onSettled(data, error, input);
      }
    }
  };

  return {
    mutate,
    isLoading,
    error,
    data,
    reset: () => {
      setError(null);
      setData(undefined);
    }
  };
}
