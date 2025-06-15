'use client';

import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { useToast } from '@/components/ui/use-toast';

/**
 * Hook for creating optimistic UI updates with React Query
 * 
 * @param queryKey The query key to update
 * @returns Object with update function
 */
export function useOptimisticUpdate<TData = any>(queryKey: string[]) {
  const queryClient = useQueryClient();
  const utils = api.useUtils();
  const { toast } = useToast();

  /**
   * Update data optimistically
   * 
   * @param updateFn Function that updates the data
   * @param mutationFn Function that performs the actual mutation
   * @param options Additional options
   */
  const update = async <TInput>(
    updateFn: (oldData: TData) => TData,
    mutationFn: (input: TInput) => Promise<any>,
    input: TInput,
    options: {
      onSuccess?: (data: any) => void;
      onError?: (error: Error) => void;
      successMessage?: string;
      errorMessage?: string;
    } = {}
  ) => {
    // Get the current query data
    const oldData = queryClient.getQueryData<TData>(queryKey);
    
    if (!oldData) {
      console.warn(`No data found for query key: ${queryKey.join('.')}`);
      return;
    }

    // Optimistically update the UI
    queryClient.setQueryData(queryKey, updateFn(oldData));

    try {
      // Perform the actual mutation
      const result = await mutationFn(input);
      
      // Show success message if provided
      if (options.successMessage) {
        toast({
          title: 'Success',
          description: options.successMessage,
          variant: 'success',
        });
      }
      
      // Call onSuccess callback if provided
      if (options.onSuccess) {
        options.onSuccess(result);
      }
      
      // Invalidate the query to refetch fresh data
      await utils.invalidate(queryKey);
      
      return result;
    } catch (error) {
      // Revert to the old data on error
      queryClient.setQueryData(queryKey, oldData);
      
      // Show error message if provided
      if (options.errorMessage) {
        toast({
          title: 'Error',
          description: options.errorMessage,
          variant: 'destructive',
        });
      }
      
      // Call onError callback if provided
      if (options.onError) {
        options.onError(error as Error);
      }
      
      throw error;
    }
  };

  return { update };
}
