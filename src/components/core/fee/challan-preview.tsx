"use client";

import { Card, CardContent } from "@/components/ui/data-display/card";
import { format } from "date-fns";
import { PaymentStatusBadge, PaymentStatus } from "../payment/payment-status-badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Download, Printer, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChallanData {
  id: string;
  challanNo: string;
  issueDate: Date | string;
  dueDate: Date | string;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  studentName: string;
  studentId: string;
  className: string;
  programName: string;
  feeComponents: Array<{
    name: string;
    amount: number;
  }>;
  discounts: Array<{
    name: string;
    amount: number;
  }>;
  additionalCharges: Array<{
    name: string;
    amount: number;
  }>;
  arrears: Array<{
    description: string;
    amount: number;
  }>;
  bankDetails?: {
    name: string;
    accountNo: string;
    branch: string;
  };
  institutionName: string;
  institutionLogo?: string;
  copyType?: "STUDENT" | "BANK" | "INSTITUTION";
}

interface ChallanPreviewProps {
  challan: ChallanData;
  onPrint?: () => void;
  onDownload?: () => void;
  onEmail?: () => void;
  showActions?: boolean;
  className?: string;
}

export function ChallanPreview({
  challan,
  onPrint,
  onDownload,
  onEmail,
  showActions = true,
  className,
}: ChallanPreviewProps) {
  const formatDate = (date: Date | string) => {
    return typeof date === 'string' ? date : format(date, "MMMM d, yyyy");
  };

  const remainingAmount = Math.max(0, challan.totalAmount - challan.paidAmount);

  return (
    <Card className={cn("print:shadow-none", className)}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            {challan.institutionLogo && (
              <img 
                src={challan.institutionLogo} 
                alt={challan.institutionName} 
                className="h-12 w-auto"
              />
            )}
            <div>
              <h2 className="text-xl font-bold">{challan.institutionName}</h2>
              <p className="text-sm text-muted-foreground">Fee Challan</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Challan No</p>
            <p className="font-bold">{challan.challanNo}</p>
            {challan.copyType && (
              <div className="mt-2">
                <span className="px-2 py-1 text-xs font-semibold rounded bg-muted">
                  {challan.copyType} COPY
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Student Info */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-muted-foreground">Student Name</p>
            <p className="font-medium">{challan.studentName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Student ID</p>
            <p className="font-medium">{challan.studentId}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Class</p>
            <p className="font-medium">{challan.className}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Program</p>
            <p className="font-medium">{challan.programName}</p>
          </div>
        </div>

        {/* Dates and Status */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <p className="text-sm text-muted-foreground">Issue Date</p>
            <p className="font-medium">{formatDate(challan.issueDate)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Due Date</p>
            <p className="font-medium">{formatDate(challan.dueDate)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <PaymentStatusBadge status={challan.paymentStatus} />
          </div>
        </div>

        <Separator className="my-4" />

        {/* Fee Components */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Fee Details</h3>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Description</th>
                <th className="text-right py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {challan.feeComponents.map((component, index) => (
                <tr key={index} className="border-b border-dashed">
                  <td className="py-2">{component.name}</td>
                  <td className="text-right py-2">${component.amount.toFixed(2)}</td>
                </tr>
              ))}

              {challan.discounts.length > 0 && (
                <>
                  <tr>
                    <td colSpan={2} className="pt-2 pb-1 font-medium">Discounts</td>
                  </tr>
                  {challan.discounts.map((discount, index) => (
                    <tr key={`discount-${index}`} className="border-b border-dashed">
                      <td className="py-1 pl-4">{discount.name}</td>
                      <td className="text-right py-1 text-green-600">-${discount.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </>
              )}

              {challan.additionalCharges.length > 0 && (
                <>
                  <tr>
                    <td colSpan={2} className="pt-2 pb-1 font-medium">Additional Charges</td>
                  </tr>
                  {challan.additionalCharges.map((charge, index) => (
                    <tr key={`charge-${index}`} className="border-b border-dashed">
                      <td className="py-1 pl-4">{charge.name}</td>
                      <td className="text-right py-1">${charge.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </>
              )}

              {challan.arrears.length > 0 && (
                <>
                  <tr>
                    <td colSpan={2} className="pt-2 pb-1 font-medium">Arrears</td>
                  </tr>
                  {challan.arrears.map((arrear, index) => (
                    <tr key={`arrear-${index}`} className="border-b border-dashed">
                      <td className="py-1 pl-4">{arrear.description}</td>
                      <td className="text-right py-1 text-amber-600">${arrear.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2">
                <th className="text-left py-2">Total Amount</th>
                <th className="text-right py-2">${challan.totalAmount.toFixed(2)}</th>
              </tr>
              {challan.paidAmount > 0 && (
                <>
                  <tr>
                    <td className="text-left py-1">Paid Amount</td>
                    <td className="text-right py-1 text-green-600">${challan.paidAmount.toFixed(2)}</td>
                  </tr>
                  <tr className="border-t">
                    <td className="text-left py-1 font-semibold">Remaining Amount</td>
                    <td className="text-right py-1 font-semibold">${remainingAmount.toFixed(2)}</td>
                  </tr>
                </>
              )}
            </tfoot>
          </table>
        </div>

        {/* Bank Details */}
        {challan.bankDetails && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Bank Details</h3>
            <div className="bg-muted p-3 rounded-md">
              <p><span className="font-medium">Bank:</span> {challan.bankDetails.name}</p>
              <p><span className="font-medium">Account No:</span> {challan.bankDetails.accountNo}</p>
              <p><span className="font-medium">Branch:</span> {challan.bankDetails.branch}</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-xs text-muted-foreground mt-6">
          <p>Please pay the fee before the due date to avoid late payment charges.</p>
          <p>This is a computer-generated challan and does not require a signature.</p>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex justify-end space-x-2 mt-6 print:hidden">
            {onPrint && (
              <Button variant="outline" size="sm" onClick={onPrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            )}
            {onDownload && (
              <Button variant="outline" size="sm" onClick={onDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
            {onEmail && (
              <Button variant="outline" size="sm" onClick={onEmail}>
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
