"use client";

import { Card, CardContent } from "@/components/ui/data-display/card";
import { PaymentStatusBadge, PaymentStatus } from "./payment-status-badge";
import { format } from "date-fns";
import { Calendar } from "lucide-react";
import { DollarSign } from "@/components/ui/icons/lucide-icons";

export interface PaymentSummaryProps {
  amount: number;
  dueDate?: Date | string | null;
  status: PaymentStatus;
  paymentMethod?: string;
  className?: string;
  compact?: boolean;
}

export function PaymentSummary({
  amount,
  dueDate,
  status,
  paymentMethod,
  className,
  compact = false,
}: PaymentSummaryProps) {
  return (
    <Card className={className}>
      <CardContent className={compact ? "p-3" : "p-6"}>
        <div className="flex justify-between items-center mb-4">
          <h3 className={compact ? "text-sm font-medium" : "text-lg font-semibold"}>Payment Summary</h3>
          <PaymentStatusBadge status={status} />
        </div>

        <div className="space-y-3">
          <div className="flex items-center">
            <DollarSign className="h-5 w-5 text-muted-foreground mr-2" />
            <div>
              <p className="text-sm text-muted-foreground">Amount</p>
              <p className={compact ? "font-medium" : "text-lg font-medium"}>
                ${amount.toFixed(2)}
              </p>
            </div>
          </div>

          {dueDate && (
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-muted-foreground mr-2" />
              <div>
                <p className="text-sm text-muted-foreground">Due Date</p>
                <p className={compact ? "font-medium" : "text-lg font-medium"}>
                  {typeof dueDate === 'string'
                    ? dueDate
                    : format(dueDate, "MMMM d, yyyy")}
                </p>
              </div>
            </div>
          )}

          {paymentMethod && (
            <div className="mt-2">
              <p className="text-sm text-muted-foreground">Payment Method</p>
              <p className="font-medium">{paymentMethod}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
