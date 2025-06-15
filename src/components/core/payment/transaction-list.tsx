"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/data-display/card";
import { format } from "date-fns";
import { Calendar, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export interface Transaction {
  id: string;
  amount: number;
  date: Date | string;
  method: string;
  reference?: string | null;
  receiptUrl?: string | null;
}

interface TransactionListProps {
  transactions: Transaction[];
  onDownloadReceipt?: (transactionId: string) => void;
  className?: string;
  emptyMessage?: string;
}

export function TransactionList({
  transactions,
  onDownloadReceipt,
  className,
  emptyMessage = "No transactions recorded",
}: TransactionListProps) {
  if (!transactions || transactions.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {transactions.map((transaction, index) => (
          <div key={transaction.id}>
            {index > 0 && <Separator className="my-4" />}
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">
                    {typeof transaction.date === 'string'
                      ? transaction.date
                      : format(transaction.date, "MMMM d, yyyy")}
                  </p>
                  <p className="text-sm text-muted-foreground">{transaction.method}</p>
                  {transaction.reference && (
                    <p className="text-sm text-muted-foreground">Ref: {transaction.reference}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end">
                <p className="font-medium">${transaction.amount.toFixed(2)}</p>
                {transaction.receiptUrl && onDownloadReceipt && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-1"
                    onClick={() => onDownloadReceipt(transaction.id)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Receipt
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
