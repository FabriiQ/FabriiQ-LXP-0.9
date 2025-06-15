'use client';

import { toast as sonnerToast, Toaster as ToastProvider, type ExternalToast } from 'sonner';

export type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions extends Partial<ExternalToast> {
  title?: string;
  description?: string; // Made optional
  variant?: ToastVariant;
  duration?: number;
}

export const toast = ({
  title,
  description,
  variant = 'default',
  duration = 5000,
  ...options
}: ToastOptions) => {
  if (variant === 'default') {
    sonnerToast(description || title || '', {
      duration,
      ...options,
    });
  } else {
    sonnerToast[variant](description || title || '', {
      duration,
      ...options,
    });
  }
};

export const useToast = () => {
  return {
    toast,
    dismiss: sonnerToast.dismiss,
    error: (message: string) => toast({ 
      description: message, 
      variant: 'error' 
    }),
    success: (message: string) => toast({ 
      description: message, 
      variant: 'success' 
    }),
    warning: (message: string) => toast({ 
      description: message, 
      variant: 'warning' 
    }),
    info: (message: string) => toast({ 
      description: message, 
      variant: 'info' 
    }),
  };
};

export { ToastProvider };
