"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/data-display/card";
import { PaymentStatusBadge, PaymentStatus } from "@/components/core/payment/payment-status-badge";
import { FeeComponentList, FeeComponent } from "@/components/core/fee/fee-component-list";
import { DiscountBadge, DiscountType } from "@/components/core/fee/discount-badge";
import { format } from "date-fns";
import { Calendar, Edit, Plus, FileText } from "lucide-react";
import { DollarSign, AlertTriangle } from "@/components/ui/icons/lucide-icons";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EnrollmentFeeForm, EnrollmentFeeFormValues } from "./enrollment-fee-form";
import { DiscountForm, DiscountFormValues } from "./discount-form";
import { AdditionalChargeForm, AdditionalChargeFormValues } from "./additional-charge-form";
import { ArrearForm, ArrearFormValues } from "./arrear-form";
import { ChallanGenerationForm, ChallanFormValues } from "./challan-generation-form";
import { TransactionForm, TransactionFormValues } from "../enrollment/transaction-form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export interface Discount {
  id: string;
  discountTypeId: string;
  discountTypeName: string;
  discountType: DiscountType;
  amount: number;
  reason?: string;
  createdAt: Date | string;
}

export interface AdditionalCharge {
  id: string;
  name: string;
  amount: number;
  dueDate?: Date | string;
  reason?: string;
  createdAt: Date | string;
}

export interface Arrear {
  id: string;
  amount: number;
  dueDate?: Date | string;
  reason: string;
  createdAt: Date | string;
}

export interface Challan {
  id: string;
  challanNo: string;
  issueDate: Date | string;
  dueDate: Date | string;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  createdAt: Date | string;
}

export interface FeeStructure {
  id: string;
  name: string;
  components: FeeComponent[];
  baseAmount: number;
}

export interface DiscountTypeOption {
  id: string;
  name: string;
  type: DiscountType;
  discountValue: number;
  isPercentage: boolean;
  maxAmount?: number;
}

export interface ChallanTemplate {
  id: string;
  name: string;
  description?: string;
  copies: number;
}

export interface FeeDetailCardProps {
  fee: {
    id: string;
    enrollmentId: string;
    feeStructureId: string;
    feeStructure: FeeStructure;
    baseAmount: number;
    discountedAmount: number;
    finalAmount: number;
    dueDate?: Date | string;
    paymentStatus: PaymentStatus;
    paymentMethod?: string;
    notes?: string;
    createdAt: Date | string;
    updatedAt: Date | string;
  };
  studentName: string;
  studentId: string;
  className: string;
  programName: string;
  discounts: Discount[];
  additionalCharges: AdditionalCharge[];
  arrears: Arrear[];
  challans: Challan[];
  paidAmount: number;
  availableFeeStructures: FeeStructure[];
  availableDiscountTypes: DiscountTypeOption[];
  availableChallanTemplates: ChallanTemplate[];
  institutionName: string;
  institutionLogo?: string;
  onUpdateFee: (values: EnrollmentFeeFormValues) => void;
  onAddDiscount: (values: DiscountFormValues) => void;
  onRemoveDiscount: (discountId: string) => void;
  onAddCharge: (values: AdditionalChargeFormValues) => void;
  onRemoveCharge: (chargeId: string) => void;
  onAddArrear: (values: ArrearFormValues) => void;
  onRemoveArrear: (arrearId: string) => void;
  onGenerateChallan: (values: ChallanFormValues) => void;
  onPrintChallan: (challanId: string) => void;
  onEmailChallan: (challanId: string, email: string) => void;
  onAddTransaction: (values: TransactionFormValues) => void;
  isLoading?: boolean;
  cardClassName?: string;
}

export function FeeDetailCard({
  fee,
  studentName,
  studentId,
  className: classNameProp,
  programName,
  discounts,
  additionalCharges,
  arrears,
  challans,
  paidAmount,
  availableFeeStructures,
  availableDiscountTypes,
  availableChallanTemplates,
  institutionName,
  institutionLogo,
  onUpdateFee,
  onAddDiscount,
  onRemoveDiscount,
  onAddCharge,
  onRemoveCharge,
  onAddArrear,
  onRemoveArrear,
  onGenerateChallan,
  onPrintChallan,
  onEmailChallan,
  onAddTransaction,
  isLoading = false,
  cardClassName,
}: FeeDetailCardProps) {
  const [activeTab, setActiveTab] = useState("details");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false);
  const [isChargeDialogOpen, setIsChargeDialogOpen] = useState(false);
  const [isArrearDialogOpen, setIsArrearDialogOpen] = useState(false);
  const [isChallanDialogOpen, setIsChallanDialogOpen] = useState(false);
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'discount' | 'charge' | 'arrear', id: string } | null>(null);

  const handleUpdateFee = (values: EnrollmentFeeFormValues) => {
    onUpdateFee(values);
    setIsEditDialogOpen(false);
  };

  const handleAddDiscount = (values: DiscountFormValues) => {
    onAddDiscount(values);
    setIsDiscountDialogOpen(false);
  };

  const handleAddCharge = (values: AdditionalChargeFormValues) => {
    onAddCharge(values);
    setIsChargeDialogOpen(false);
  };

  const handleAddArrear = (values: ArrearFormValues) => {
    onAddArrear(values);
    setIsArrearDialogOpen(false);
  };

  const handleGenerateChallan = (values: ChallanFormValues) => {
    onGenerateChallan(values);
    setIsChallanDialogOpen(false);
  };

  const handleAddTransaction = (values: TransactionFormValues) => {
    onAddTransaction(values);
    setIsTransactionDialogOpen(false);
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;

    switch (itemToDelete.type) {
      case 'discount':
        onRemoveDiscount(itemToDelete.id);
        break;
      case 'charge':
        onRemoveCharge(itemToDelete.id);
        break;
      case 'arrear':
        onRemoveArrear(itemToDelete.id);
        break;
    }

    setItemToDelete(null);
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "Not specified";
    return typeof date === 'string' ? date : format(date, "MMMM d, yyyy");
  };

  const remainingAmount = Math.max(0, fee.finalAmount - paidAmount);

  // Calculate totals
  const totalDiscounts = discounts.reduce((sum, d) => sum + d.amount, 0);
  const totalAdditionalCharges = additionalCharges.reduce((sum, c) => sum + c.amount, 0);
  const totalArrears = arrears.reduce((sum, a) => sum + a.amount, 0);

  return (
    <>
      <Card className={cardClassName}>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Fee Details</CardTitle>
          </div>
          <PaymentStatusBadge status={fee.paymentStatus} />
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="discounts">Discounts</TabsTrigger>
              <TabsTrigger value="charges">Charges & Arrears</TabsTrigger>
              <TabsTrigger value="challans">Challans</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-muted-foreground mr-2" />
                    <h3 className="text-sm font-medium text-muted-foreground">Base Amount</h3>
                  </div>
                  <p className="text-lg font-medium">${fee.baseAmount.toFixed(2)}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-muted-foreground mr-2" />
                    <h3 className="text-sm font-medium text-muted-foreground">Final Amount</h3>
                  </div>
                  <p className="text-lg font-medium">${fee.finalAmount.toFixed(2)}</p>
                </div>

                {fee.dueDate && (
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-muted-foreground mr-2" />
                      <h3 className="text-sm font-medium text-muted-foreground">Due Date</h3>
                    </div>
                    <p className="text-lg font-medium">{formatDate(fee.dueDate)}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-muted-foreground">Amount Paid</h3>
                  <p className="text-lg font-medium text-green-600">${paidAmount.toFixed(2)}</p>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-muted-foreground">Remaining Balance</h3>
                  <p className="text-lg font-medium text-amber-600">${remainingAmount.toFixed(2)}</p>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-medium mb-2">Fee Structure: {fee.feeStructure.name}</h3>
                <FeeComponentList
                  components={fee.feeStructure.components}
                  showTotal={true}
                />
              </div>

              {fee.notes && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Notes</h3>
                    <p className="text-sm">{fee.notes}</p>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="discounts" className="space-y-4 pt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Discounts</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDiscountDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Discount
                </Button>
              </div>

              {discounts.length === 0 ? (
                <div className="rounded-md border border-dashed p-6 text-center">
                  <p className="text-sm text-muted-foreground mb-2">No discounts applied</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsDiscountDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Discount
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {discounts.map((discount) => (
                    <div
                      key={discount.id}
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">{discount.discountTypeName}</p>
                          <DiscountBadge
                            type={discount.discountType}
                            value={discount.amount}
                            isPercentage={false}
                          />
                        </div>
                        {discount.reason && (
                          <p className="text-sm text-muted-foreground mt-1">{discount.reason}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Added on {formatDate(discount.createdAt)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setItemToDelete({ type: 'discount', id: discount.id })}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}

                  <div className="flex justify-between items-center rounded-md border p-3 mt-4">
                    <p className="font-semibold">Total Discounts</p>
                    <p className="font-semibold text-green-600">-${totalDiscounts.toFixed(2)}</p>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="charges" className="space-y-4 pt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Additional Charges</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsChargeDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Charge
                </Button>
              </div>

              {additionalCharges.length === 0 ? (
                <div className="rounded-md border border-dashed p-6 text-center">
                  <p className="text-sm text-muted-foreground mb-2">No additional charges</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsChargeDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Charge
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {additionalCharges.map((charge) => (
                    <div
                      key={charge.id}
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <div>
                        <p className="font-medium">{charge.name}</p>
                        <p className="text-sm font-medium">${charge.amount.toFixed(2)}</p>
                        {charge.dueDate && (
                          <p className="text-sm text-muted-foreground">Due: {formatDate(charge.dueDate)}</p>
                        )}
                        {charge.reason && (
                          <p className="text-sm text-muted-foreground">{charge.reason}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Added on {formatDate(charge.createdAt)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setItemToDelete({ type: 'charge', id: charge.id })}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}

                  <div className="flex justify-between items-center rounded-md border p-3 mt-4">
                    <p className="font-semibold">Total Additional Charges</p>
                    <p className="font-semibold">${totalAdditionalCharges.toFixed(2)}</p>
                  </div>
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Arrears</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsArrearDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Arrear
                </Button>
              </div>

              {arrears.length === 0 ? (
                <div className="rounded-md border border-dashed p-6 text-center">
                  <p className="text-sm text-muted-foreground mb-2">No arrears</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsArrearDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Arrear
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {arrears.map((arrear) => (
                    <div
                      key={arrear.id}
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">${arrear.amount.toFixed(2)}</p>
                          <span className="px-2 py-1 text-xs font-semibold rounded bg-amber-100 text-amber-800">
                            Arrear
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{arrear.reason}</p>
                        {arrear.dueDate && (
                          <p className="text-sm text-muted-foreground">Due: {formatDate(arrear.dueDate)}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Added on {formatDate(arrear.createdAt)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setItemToDelete({ type: 'arrear', id: arrear.id })}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}

                  <div className="flex justify-between items-center rounded-md border p-3 mt-4">
                    <p className="font-semibold">Total Arrears</p>
                    <p className="font-semibold text-amber-600">${totalArrears.toFixed(2)}</p>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="challans" className="space-y-4 pt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Fee Challans</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsChallanDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Challan
                </Button>
              </div>

              {challans.length === 0 ? (
                <div className="rounded-md border border-dashed p-6 text-center">
                  <p className="text-sm text-muted-foreground mb-2">No challans generated</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsChallanDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Generate Challan
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {challans.map((challan) => (
                    <div
                      key={challan.id}
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">Challan #{challan.challanNo}</p>
                          <PaymentStatusBadge status={challan.paymentStatus} />
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Amount: ${challan.totalAmount.toFixed(2)} • Paid: ${challan.paidAmount.toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Issue Date: {formatDate(challan.issueDate)} • Due Date: {formatDate(challan.dueDate)}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onPrintChallan(challan.id)}
                        >
                          Print
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEmailChallan(challan.id, "")}
                        >
                          Email
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Fee
            </Button>
          </div>
          <div className="flex space-x-2">
            <Button onClick={() => setIsTransactionDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Payment
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Edit Fee Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <EnrollmentFeeForm
            enrollmentId={fee.enrollmentId}
            feeStructures={availableFeeStructures}
            initialData={{
              feeStructureId: fee.feeStructureId,
              dueDate: fee.dueDate ? new Date(fee.dueDate) : undefined,
              paymentStatus: fee.paymentStatus,
              paymentMethod: fee.paymentMethod,
              notes: fee.notes,
            }}
            onSubmit={handleUpdateFee}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>

      {/* Add Discount Dialog */}
      <Dialog open={isDiscountDialogOpen} onOpenChange={setIsDiscountDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DiscountForm
            enrollmentFeeId={fee.id}
            discountTypes={availableDiscountTypes}
            onSubmit={handleAddDiscount}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>

      {/* Add Charge Dialog */}
      <Dialog open={isChargeDialogOpen} onOpenChange={setIsChargeDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <AdditionalChargeForm
            enrollmentFeeId={fee.id}
            onSubmit={handleAddCharge}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>

      {/* Add Arrear Dialog */}
      <Dialog open={isArrearDialogOpen} onOpenChange={setIsArrearDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <ArrearForm
            enrollmentFeeId={fee.id}
            onSubmit={handleAddArrear}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>

      {/* Generate Challan Dialog */}
      <Dialog open={isChallanDialogOpen} onOpenChange={setIsChallanDialogOpen}>
        <DialogContent className="sm:max-w-[900px]">
          <ChallanGenerationForm
            enrollmentFeeId={fee.id}
            enrollmentFeeData={{
              studentName,
              studentId,
              className: classNameProp,
              programName,
              totalAmount: fee.finalAmount,
              paidAmount,
              feeComponents: fee.feeStructure.components,
              discounts: discounts.map(d => ({ name: d.discountTypeName, amount: d.amount })),
              additionalCharges: additionalCharges.map(c => ({ name: c.name, amount: c.amount })),
              arrears: arrears.map(a => ({ description: a.reason, amount: a.amount })),
            }}
            templates={availableChallanTemplates}
            institutionName={institutionName}
            institutionLogo={institutionLogo}
            onSubmit={handleGenerateChallan}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>

      {/* Add Transaction Dialog */}
      <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <TransactionForm
            paymentId={fee.id}
            onSubmit={handleAddTransaction}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the {itemToDelete?.type} from this fee.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
