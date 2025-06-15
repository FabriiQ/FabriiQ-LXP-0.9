"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/data-display/card";
import { PaymentStatusBadge, PaymentStatus } from "@/components/core/payment/payment-status-badge";
import { TransactionList, Transaction } from "@/components/core/payment/transaction-list";
import { format } from "date-fns";
import { Calendar, DollarSign, Edit, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { TransactionForm, TransactionFormValues } from "./transaction-form";
import { EnrollmentPaymentForm, PaymentFormValues } from "./enrollment-payment-form";
import { Separator } from "@/components/ui/separator";

export interface PaymentDetail {
  id: string;
  enrollmentId: string;
  amount: number;
  dueDate?: Date | string | null;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  notes?: string;
  transactions: Transaction[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface PaymentDetailCardProps {
  payment: PaymentDetail;
  onUpdatePayment: (values: PaymentFormValues) => void;
  onAddTransaction: (values: TransactionFormValues) => void;
  onDownloadReceipt?: (transactionId: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function PaymentDetailCard({
  payment,
  onUpdatePayment,
  onAddTransaction,
  onDownloadReceipt,
  isLoading = false,
  className,
}: PaymentDetailCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);

  const handleUpdatePayment = (values: PaymentFormValues) => {
    onUpdatePayment(values);
    setIsEditDialogOpen(false);
  };

  const handleAddTransaction = (values: TransactionFormValues) => {
    onAddTransaction(values);
    setIsTransactionDialogOpen(false);
  };

  const totalPaid = payment.transactions.reduce((sum, t) => sum + t.amount, 0);
  const remainingAmount = Math.max(0, payment.amount - totalPaid);

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Payment Details</CardTitle>
        </div>
        <PaymentStatusBadge status={payment.paymentStatus} />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 text-muted-foreground mr-2" />
              <h3 className="text-sm font-medium text-muted-foreground">Total Amount</h3>
            </div>
            <p className="text-lg font-medium">${payment.amount.toFixed(2)}</p>
          </div>
          
          {payment.dueDate && (
            <div className="space-y-1">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-muted-foreground mr-2" />
                <h3 className="text-sm font-medium text-muted-foreground">Due Date</h3>
              </div>
              <p className="text-lg font-medium">
                {typeof payment.dueDate === 'string'
                  ? payment.dueDate
                  : format(payment.dueDate, "MMMM d, yyyy")}
              </p>
            </div>
          )}
          
          {payment.paymentMethod && (
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">Payment Method</h3>
              <p className="text-lg font-medium">{payment.paymentMethod}</p>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-muted-foreground">Amount Paid</h3>
            <p className="text-lg font-medium text-green-600">${totalPaid.toFixed(2)}</p>
          </div>
          
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-muted-foreground">Remaining Balance</h3>
            <p className="text-lg font-medium text-amber-600">${remainingAmount.toFixed(2)}</p>
          </div>
        </div>
        
        {payment.notes && (
          <>
            <Separator />
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Notes</h3>
              <p className="text-sm">{payment.notes}</p>
            </div>
          </>
        )}
        
        <Separator />
        
        <TransactionList
          transactions={payment.transactions}
          onDownloadReceipt={onDownloadReceipt}
          emptyMessage="No payment transactions recorded yet"
        />
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <EnrollmentPaymentForm
              enrollmentId={payment.enrollmentId}
              initialData={{
                amount: payment.amount,
                dueDate: payment.dueDate ? new Date(payment.dueDate) : undefined,
                paymentStatus: payment.paymentStatus,
                paymentMethod: payment.paymentMethod,
                notes: payment.notes,
              }}
              onSubmit={handleUpdatePayment}
              isLoading={isLoading}
            />
          </DialogContent>
        </Dialog>
        
        <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <TransactionForm
              paymentId={payment.id}
              onSubmit={handleAddTransaction}
              isLoading={isLoading}
            />
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
