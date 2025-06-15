'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

// Types
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnClickOutside?: boolean;
  showCloseButton?: boolean;
  className?: string;
  contentClassName?: string;
}

interface ModalContextType {
  open: (props: Omit<ModalProps, 'isOpen' | 'onClose'>) => void;
  close: () => void;
  isOpen: boolean;
}

// Create context
const ModalContext = createContext<ModalContextType | undefined>(undefined);

// Modal Provider Component
export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [modalProps, setModalProps] = useState<Omit<ModalProps, 'isOpen' | 'onClose'> | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Open modal
  const open = (props: Omit<ModalProps, 'isOpen' | 'onClose'>) => {
    setModalProps(props);
    setIsOpen(true);
  };

  // Close modal
  const close = () => {
    setIsOpen(false);
  };

  // Handle client-side rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <ModalContext.Provider value={{ open, close, isOpen }}>
      {children}
      {isMounted && modalProps && createPortal(
        <Modal isOpen={isOpen} onClose={close} {...modalProps} />,
        document.body
      )}
    </ModalContext.Provider>
  );
}

// Hook to use modal
export function useModal() {
  const context = useContext(ModalContext);

  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }

  return context;
}

// Modal Component
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  closeOnClickOutside = true,
  showCloseButton = true,
  className,
  contentClassName,
}: ModalProps) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle ESC key press
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  // Get size class
  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'max-w-sm';
      case 'md':
        return 'max-w-md';
      case 'lg':
        return 'max-w-2xl';
      case 'xl':
        return 'max-w-4xl';
      case 'full':
        return 'max-w-full m-4';
      default:
        return 'max-w-md';
    }
  };

  // Animation variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: -20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 30
      }
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      y: -20,
      transition: { duration: 0.2 }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={backdropVariants}
            onClick={closeOnClickOutside ? onClose : undefined}
          />

          {/* Modal */}
          <motion.div
            className={cn(
              "relative z-50 w-full p-4 mx-auto max-h-[90vh] flex items-center justify-center",
              className
            )}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={modalVariants}
          >
            <div className={cn(
              "bg-background rounded-lg shadow-lg border border-border overflow-hidden w-full",
              getSizeClass(),
              "max-h-[calc(90vh-2rem)] flex flex-col",
              contentClassName
            )}>
              {/* Header */}
              {(title || showCloseButton) && (
                <div className="flex items-center justify-between p-4 border-b border-border">
                  {title && (
                    <div>
                      <h2 className="text-lg font-semibold">{title}</h2>
                      {description && (
                        <p className="text-sm text-muted-foreground mt-1">{description}</p>
                      )}
                    </div>
                  )}

                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      className="p-1 rounded-md text-muted-foreground hover:bg-muted transition-colors"
                      aria-label="Close modal"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="p-4 overflow-y-auto">{children}</div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}