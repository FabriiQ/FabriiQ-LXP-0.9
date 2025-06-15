"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/data-display/card";
import {
  PaymentDetailCard,
  PaymentFormValues,
  TransactionFormValues,
  DocumentList,
  PaymentHistoryTimeline,
  Transaction,
  Document,
  HistoryEvent,
  PaymentStatus
} from "@/components/shared/entities/enrollment";

export default function PaymentExamplePage() {
  // Mock data for demonstration
  const [payment, setPayment] = useState({
    id: "payment-1",
    enrollmentId: "enrollment-1",
    amount: 1200.00,
    dueDate: new Date(),
    paymentStatus: "PARTIAL" as PaymentStatus,
    paymentMethod: "Credit Card",
    notes: "Payment pending verification",
    transactions: [
      {
        id: "transaction-1",
        amount: 500.00,
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        method: "Credit Card",
        reference: "REF123456",
      }
    ] as Transaction[],
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
  });

  const [documents, setDocuments] = useState<Document[]>([
    {
      id: "doc-1",
      name: "Enrollment Form.pdf",
      type: "CONTRACT",
      url: "#",
      fileSize: 1024 * 500, // 500 KB
      mimeType: "application/pdf",
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
    }
  ]);

  const [history, setHistory] = useState<HistoryEvent[]>([
    {
      id: "history-1",
      action: "ENROLLMENT_CREATED",
      details: {},
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
      createdBy: {
        id: "user-1",
        name: "Admin User",
      }
    },
    {
      id: "history-2",
      action: "PAYMENT_CREATED",
      details: {
        amount: 1200.00,
        paymentStatus: "PENDING",
      },
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
      createdBy: {
        id: "user-1",
        name: "Admin User",
      }
    },
    {
      id: "history-3",
      action: "TRANSACTION_ADDED",
      details: {
        amount: 500.00,
        method: "Credit Card",
        newStatus: "PARTIAL",
      },
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      createdBy: {
        id: "user-1",
        name: "Admin User",
      }
    },
    {
      id: "history-4",
      action: "DOCUMENT_UPLOADED",
      details: {
        name: "Enrollment Form.pdf",
        type: "CONTRACT",
      },
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
      createdBy: {
        id: "user-1",
        name: "Admin User",
      }
    }
  ]);

  // Mock handlers
  const handleUpdatePayment = (values: PaymentFormValues) => {
    console.log("Update payment:", values);
    setPayment({
      ...payment,
      amount: values.amount,
      dueDate: values.dueDate,
      paymentStatus: values.paymentStatus,
      paymentMethod: values.paymentMethod,
      notes: values.notes,
      updatedAt: new Date(),
    });

    // Add to history
    setHistory([
      {
        id: `history-${history.length + 1}`,
        action: "PAYMENT_UPDATED",
        details: {
          amount: values.amount,
          paymentStatus: values.paymentStatus,
        },
        createdAt: new Date(),
        createdBy: {
          id: "user-1",
          name: "Admin User",
        }
      },
      ...history,
    ]);
  };

  const handleAddTransaction = (values: TransactionFormValues) => {
    console.log("Add transaction:", values);

    // Create new transaction
    const newTransaction: Transaction = {
      id: `transaction-${payment.transactions.length + 1}`,
      amount: values.amount,
      date: values.date,
      method: values.method,
      reference: values.reference,
    };

    // Calculate new payment status
    const totalPaid = payment.transactions.reduce((sum, t) => sum + t.amount, 0) + values.amount;
    let newStatus = payment.paymentStatus;
    if (totalPaid >= payment.amount) {
      newStatus = "PAID" as PaymentStatus;
    } else if (totalPaid > 0) {
      newStatus = "PARTIAL" as PaymentStatus;
    }

    // Update payment
    setPayment({
      ...payment,
      paymentStatus: newStatus,
      transactions: [newTransaction, ...payment.transactions],
      updatedAt: new Date(),
    });

    // Add to history
    setHistory([
      {
        id: `history-${history.length + 1}`,
        action: "TRANSACTION_ADDED",
        details: {
          amount: values.amount,
          method: values.method,
          newStatus,
        },
        createdAt: new Date(),
        createdBy: {
          id: "user-1",
          name: "Admin User",
        }
      },
      ...history,
    ]);
  };

  const handleUploadDocument = (file: File, type: string) => {
    console.log("Upload document:", file, type);

    // Create new document
    const newDocument: Document = {
      id: `doc-${documents.length + 1}`,
      name: file.name,
      type,
      url: "#", // In a real app, this would be the URL from the server
      fileSize: file.size,
      mimeType: file.type,
      createdAt: new Date(),
    };

    // Update documents
    setDocuments([newDocument, ...documents]);

    // Add to history
    setHistory([
      {
        id: `history-${history.length + 1}`,
        action: "DOCUMENT_UPLOADED",
        details: {
          name: file.name,
          type,
        },
        createdAt: new Date(),
        createdBy: {
          id: "user-1",
          name: "Admin User",
        }
      },
      ...history,
    ]);
  };

  const handleDeleteDocument = (documentId: string) => {
    console.log("Delete document:", documentId);

    // Find document
    const documentToDelete = documents.find(d => d.id === documentId);

    if (!documentToDelete) return;

    // Update documents
    setDocuments(documents.filter(d => d.id !== documentId));

    // Add to history
    setHistory([
      {
        id: `history-${history.length + 1}`,
        action: "DOCUMENT_DELETED",
        details: {
          name: documentToDelete.name,
          type: documentToDelete.type,
        },
        createdAt: new Date(),
        createdBy: {
          id: "user-1",
          name: "Admin User",
        }
      },
      ...history,
    ]);
  };

  const handleDownloadReceipt = (transactionId: string) => {
    console.log("Download receipt:", transactionId);
    // In a real app, this would download the receipt
    alert(`Downloading receipt for transaction ${transactionId}`);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Enrollment Payment Example</h1>
          <p className="text-muted-foreground">
            This page demonstrates the enrollment payment components
          </p>
        </div>
        <Button asChild>
          <a href="/admin/campus/enrollment">Back to Enrollments</a>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PaymentDetailCard
            payment={payment}
            onUpdatePayment={handleUpdatePayment}
            onAddTransaction={handleAddTransaction}
            onDownloadReceipt={handleDownloadReceipt}
          />
        </div>

        <div>
          <DocumentList
            enrollmentId="enrollment-1"
            documents={documents}
            onUploadDocument={handleUploadDocument}
            onDeleteDocument={handleDeleteDocument}
          />
        </div>
      </div>

      <div>
        <PaymentHistoryTimeline events={history} />
      </div>
    </div>
  );
}
