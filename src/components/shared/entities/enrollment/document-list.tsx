"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/data-display/card";
import { FileText, Download, Trash, Plus } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { DocumentUploader, DocumentFile } from "@/components/core/document/document-uploader";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  fileSize?: number;
  mimeType?: string;
  createdAt: Date | string;
}

interface DocumentListProps {
  enrollmentId: string;
  documents: Document[];
  onUploadDocument: (file: File, type: string) => void;
  onDeleteDocument: (documentId: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function DocumentList({
  enrollmentId,
  documents,
  onUploadDocument,
  onDeleteDocument,
  isLoading = false,
  className,
}: DocumentListProps) {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [uploadingDocuments, setUploadingDocuments] = useState<DocumentFile[]>([]);

  const handleAddDocument = (file: File, type: string) => {
    const newDoc: DocumentFile = {
      name: file.name,
      type,
      size: file.size,
      mimeType: file.type,
      isUploading: true,
      isNew: true,
      file,
    };
    
    setUploadingDocuments([...uploadingDocuments, newDoc]);
    
    // Call the upload function
    onUploadDocument(file, type);
  };

  const handleRemoveDocument = (doc: DocumentFile) => {
    if (doc.isNew) {
      // Remove from local state if it's a new upload
      setUploadingDocuments(uploadingDocuments.filter(d => d !== doc));
    } else if (doc.id) {
      // Set the document to delete if it's an existing one
      setDocumentToDelete(doc.id);
    }
  };

  const confirmDeleteDocument = () => {
    if (documentToDelete) {
      onDeleteDocument(documentToDelete);
      setDocumentToDelete(null);
    }
  };

  // Convert API documents to the format expected by DocumentUploader
  const allDocuments: DocumentFile[] = [
    ...documents.map(doc => ({
      id: doc.id,
      name: doc.name,
      type: doc.type,
      url: doc.url,
      size: doc.fileSize,
      mimeType: doc.mimeType,
    })),
    ...uploadingDocuments,
  ];

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.type} • {doc.fileSize ? `${Math.round(doc.fileSize / 1024)} KB` : "Unknown size"} • 
                        {typeof doc.createdAt === 'string'
                          ? doc.createdAt
                          : format(doc.createdAt, "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-8 w-8 p-0"
                    >
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" download>
                        <Download className="h-4 w-4" />
                        <span className="sr-only">Download</span>
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => setDocumentToDelete(doc.id)}
                    >
                      <Trash className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DocumentUploader
                documents={allDocuments}
                onAddDocument={handleAddDocument}
                onRemoveDocument={handleRemoveDocument}
              />
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>

      <AlertDialog open={!!documentToDelete} onOpenChange={(open) => !open && setDocumentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the document. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteDocument} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
