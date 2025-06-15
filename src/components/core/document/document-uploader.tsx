"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/data-display/card";
import { X } from "lucide-react";
import { FileUp, File as FileIcon } from "@/components/ui/icons/lucide-icons";
import { cn } from "@/lib/utils";

export interface DocumentFile {
  id?: string;
  file?: File;
  name: string;
  type: string;
  url?: string;
  size?: number;
  mimeType?: string;
  isUploading?: boolean;
  isNew?: boolean;
}

interface DocumentUploaderProps {
  documents: DocumentFile[];
  onAddDocument: (file: File, type: string) => void;
  onRemoveDocument: (document: DocumentFile) => void;
  documentTypes?: Array<{ value: string; label: string }>;
  className?: string;
  maxFiles?: number;
  acceptedFileTypes?: string;
}

export const DEFAULT_DOCUMENT_TYPES = [
  { value: "RECEIPT", label: "Receipt" },
  { value: "INVOICE", label: "Invoice" },
  { value: "CONTRACT", label: "Contract" },
  { value: "ID", label: "Identification" },
  { value: "OTHER", label: "Other" },
];

export function DocumentUploader({
  documents,
  onAddDocument,
  onRemoveDocument,
  documentTypes = DEFAULT_DOCUMENT_TYPES,
  className,
  maxFiles = 10,
  acceptedFileTypes = ".pdf,.jpg,.jpeg,.png,.doc,.docx",
}: DocumentUploaderProps) {
  const [selectedType, setSelectedType] = useState(documentTypes[0]?.value || "");
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        onAddDocument(file, selectedType);
      }
    },
    [onAddDocument, selectedType]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        onAddDocument(file, selectedType);
        e.target.value = ""; // Reset input
      }
    },
    [onAddDocument, selectedType]
  );

  const isMaxFilesReached = documents.length >= maxFiles;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Documents</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isMaxFilesReached && (
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-6 transition-colors",
              dragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center space-y-3 text-center">
              <FileUp className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="font-medium">Drag and drop a file here or click to browse</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Accepted file types: {acceptedFileTypes.replace(/\./g, "")}
                </p>
              </div>

              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="document-type">Document Type</Label>
                <select
                  id="document-type"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  {documentTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-center">
                <Label
                  htmlFor="file-upload"
                  className="cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Browse Files
                </Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept={acceptedFileTypes}
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          </div>
        )}

        {documents.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Uploaded Documents</h3>
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id || doc.name}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="flex items-center space-x-3">
                    <FileIcon className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.type} • {doc.size ? `${Math.round(doc.size / 1024)} KB` : "Unknown size"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {doc.isUploading ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    ) : (
                      <>
                        {doc.url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="h-8 w-8 p-0"
                          >
                            <a href={doc.url} target="_blank" rel="noopener noreferrer">
                              <FileIcon className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => onRemoveDocument(doc)}
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
