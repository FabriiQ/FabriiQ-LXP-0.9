'use client';

import * as React from 'react';
import { useDropzone, FileRejection, DropzoneOptions } from 'react-dropzone';
import { Upload, X, File, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/atoms/button';

// Types
export interface FileUploadProps extends Omit<DropzoneOptions, 'onDrop'> {
  /**
   * Called when files are dropped or selected
   */
  onFilesSelected?: (files: File[]) => void;
  /**
   * Called when files are rejected
   */
  onFilesRejected?: (fileRejections: FileRejection[]) => void;
  /**
   * Called when a file is removed
   */
  onFileRemoved?: (file: File) => void;
  /**
   * Label for the upload area
   */
  label?: React.ReactNode;
  /**
   * Helper text displayed below the upload area
   */
  helperText?: React.ReactNode;
  /**
   * Error message
   */
  error?: string;
  /**
   * Whether to show the file list
   * @default true
   */
  showFileList?: boolean;
  /**
   * Whether to allow multiple files
   * @default false
   */
  multiple?: boolean;
  /**
   * Whether to show the progress bar
   * @default true
   */
  showProgress?: boolean;
  /**
   * Progress value (0-100)
   */
  progress?: number;
  /**
   * Whether the upload is in progress
   * @default false
   */
  isUploading?: boolean;
  /**
   * Whether the upload is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * Custom class for the container
   */
  className?: string;
  /**
   * Custom class for the dropzone
   */
  dropzoneClassName?: string;
  /**
   * Custom class for the file list
   */
  fileListClassName?: string;
  /**
   * Initial files to display
   */
  initialFiles?: File[];
}

export function FileUpload({
  onFilesSelected,
  onFilesRejected,
  onFileRemoved,
  label = 'Drag and drop files here, or click to select files',
  helperText,
  error,
  showFileList = true,
  multiple = false,
  showProgress = true,
  progress = 0,
  isUploading = false,
  disabled = false,
  className,
  dropzoneClassName,
  fileListClassName,
  initialFiles = [],
  ...dropzoneProps
}: FileUploadProps) {
  const [files, setFiles] = React.useState<File[]>(initialFiles);
  
  // Handle file drop
  const onDrop = React.useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (disabled || isUploading) return;
      
      const newFiles = multiple
        ? [...files, ...acceptedFiles]
        : acceptedFiles;
      
      setFiles(newFiles);
      
      if (onFilesSelected) {
        onFilesSelected(newFiles);
      }
      
      if (fileRejections.length > 0 && onFilesRejected) {
        onFilesRejected(fileRejections);
      }
    },
    [files, multiple, onFilesSelected, onFilesRejected, disabled, isUploading]
  );
  
  // Setup dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple,
    disabled: disabled || isUploading,
    ...dropzoneProps,
  });
  
  // Handle file removal
  const handleRemoveFile = (file: File) => {
    if (disabled || isUploading) return;
    
    const newFiles = files.filter((f) => f !== file);
    setFiles(newFiles);
    
    if (onFileRemoved) {
      onFileRemoved(file);
    }
    
    if (onFilesSelected) {
      onFilesSelected(newFiles);
    }
  };
  
  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  return (
    <div className={cn("space-y-4", className)}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer",
          "flex flex-col items-center justify-center text-center",
          isDragActive ? "border-primary bg-primary/5" : "border-border",
          error ? "border-destructive bg-destructive/5" : "",
          disabled ? "opacity-50 cursor-not-allowed" : "",
          dropzoneClassName
        )}
      >
        <input {...getInputProps()} />
        
        <Upload className={cn(
          "h-10 w-10 mb-4",
          isDragActive ? "text-primary" : "text-muted-foreground"
        )} />
        
        <div className="space-y-2">
          <p className="text-sm font-medium">{label}</p>
          {helperText && <p className="text-xs text-muted-foreground">{helperText}</p>}
          {error && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {error}
            </p>
          )}
        </div>
      </div>
      
      {/* Progress bar */}
      {showProgress && isUploading && (
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-300 ease-in-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      
      {/* File list */}
      {showFileList && files.length > 0 && (
        <ul className={cn("space-y-2", fileListClassName)}>
          <AnimatePresence>
            {files.map((file, index) => (
              <motion.li
                key={`${file.name}-${index}`}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-muted rounded-md p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <File className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile(file);
                  }}
                  disabled={disabled || isUploading}
                  className="flex-shrink-0"
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}

export default FileUpload; 