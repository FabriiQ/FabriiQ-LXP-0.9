'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from './button';
import { X, Upload, File as FileIcon } from 'lucide-react';

interface FileUploaderProps {
  onFilesAdded: (files: File[]) => void;
  onFileRemove?: (index: number) => void;
  files?: File[];
  maxFiles?: number;
  maxSize?: number; // in MB
  acceptedFileTypes?: string[];
  className?: string;
}

export function FileUploader({
  onFilesAdded,
  onFileRemove,
  files = [],
  maxFiles = 5,
  maxSize = 10, // 10MB default
  acceptedFileTypes,
  className = '',
}: FileUploaderProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setError(null);
      
      // Check if adding these files would exceed the max files limit
      if (maxFiles && acceptedFiles.length + files.length > maxFiles) {
        setError(`You can only upload a maximum of ${maxFiles} files`);
        return;
      }
      
      // Check file sizes
      const maxSizeBytes = maxSize * 1024 * 1024; // Convert MB to bytes
      const oversizedFiles = acceptedFiles.filter(file => file.size > maxSizeBytes);
      
      if (oversizedFiles.length > 0) {
        setError(`Some files exceed the maximum size of ${maxSize}MB`);
        return;
      }
      
      onFilesAdded(acceptedFiles);
    },
    [files.length, maxFiles, maxSize, onFilesAdded]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: maxFiles - files.length,
    maxSize: maxSize * 1024 * 1024,
    accept: acceptedFileTypes ? 
      acceptedFileTypes.reduce((acc, type) => {
        acc[type] = [];
        return acc;
      }, {} as Record<string, string[]>) : 
      undefined,
  });

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-2">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">
            {isDragActive ? 'Drop the files here' : 'Drag & drop files here, or click to select files'}
          </p>
          <p className="text-xs text-muted-foreground">
            {maxFiles && `Up to ${maxFiles} files, `}
            {maxSize && `max ${maxSize}MB each`}
            {acceptedFileTypes && `, Accepted types: ${acceptedFileTypes.join(', ')}`}
          </p>
        </div>
      </div>

      {error && (
        <div className="text-sm text-destructive">
          {error}
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Uploaded Files ({files.length})</p>
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li key={`${file.name}-${index}`} className="flex items-center justify-between p-2 border rounded-md">
                <div className="flex items-center space-x-2">
                  <FileIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                  <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                </div>
                {onFileRemove && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onFileRemove(index)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
