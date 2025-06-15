/**
 * tRPC Batch Filter
 *
 * This utility provides a custom tRPC link that filters out invalid procedures
 * from batch requests before they're sent to the server.
 */

import { TRPCLink } from '@trpc/client';
import { AnyRouter } from '@trpc/server';
import { observable } from '@trpc/server/observable';

/**
 * Creates a tRPC link that filters out invalid procedures from batch requests
 * and handles individual requests separately to avoid batch issues
 *
 * @returns A tRPC link that handles batch requests safely
 */
export function batchFilterLink<TRouter extends AnyRouter>(): TRPCLink<TRouter> {
  return () => {
    return ({ next, op }) => {
      try {
        // For regular operations, just pass through
        if (op.type === 'query' || op.type === 'mutation' || op.type === 'subscription') {
          return next(op);
        }

        // For batch-like operations
        // We need to use 'any' here because the tRPC types don't properly expose batch operations
        const batchOp = op as any;

        if (Array.isArray(batchOp.operations)) {
          // Log the original operations for debugging
          console.log('Original batch operations:', batchOp.operations.length);

          // Filter out operations with empty paths
          const filteredOperations = batchOp.operations.filter((operation: any) => {
            const path = operation?.path || '';
            const isValid = path && path.trim() !== '';

            // Log invalid operations for debugging
            if (!isValid) {
              console.warn('Filtering out invalid batch operation:', operation);
            }

            return isValid;
          });

          // Log the filtered operations count
          console.log('Filtered batch operations:', filteredOperations.length);

          // If all operations were filtered out, return an empty array instead of making a batch request
          if (filteredOperations.length === 0) {
            console.warn('All batch operations were filtered out, returning empty result');
            // Return an empty successful result instead of making a batch request with empty paths
            return observable((observer) => {
              observer.next({ result: { type: 'data', data: [] } });
              observer.complete();
              return () => {};
            });
          }

          // If we have only one operation, handle it as a regular operation instead of a batch
          // This avoids issues with batch requests that have only one operation
          if (filteredOperations.length === 1) {
            console.log('Converting single operation batch to regular operation');
            const singleOp = filteredOperations[0];
            return next({
              ...singleOp,
              type: singleOp.type || 'query'
            });
          }

          // Create a new batch operation with filtered operations
          const newOp = {
            ...batchOp,
            operations: filteredOperations
          };

          // Pass the filtered batch to the next link
          return next(newOp);
        }
      } catch (e) {
        console.error('Error in batch filter link:', e);
      }

      // For all other cases, just pass through
      return next(op);
    };
  };
}

/**
 * Creates a tRPC link that logs all requests and responses
 *
 * @returns A tRPC link that logs requests and responses
 */
export function loggingLink<TRouter extends AnyRouter>(): TRPCLink<TRouter> {
  return () => {
    return ({ next, op }) => {
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[tRPC] ${op.type} request to ${op.path || 'unknown'}`);
      }

      return observable((observer) => {
        const subscription = next(op).subscribe({
          next(value) {
            // Only log in development
            if (process.env.NODE_ENV === 'development') {
              console.log(`[tRPC] ${op.type} response from ${op.path || 'unknown'}`);
            }
            observer.next(value);
          },
          error(err) {
            console.error(`[tRPC] ${op.type} error from ${op.path || 'unknown'}:`, err.message);
            observer.error(err);
          },
          complete() {
            observer.complete();
          }
        });

        return subscription;
      });
    };
  };
}
