"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/data-display/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FeeStructureForm,
  FeeStructureFormValues,
  DiscountTypeForm,
  DiscountTypeFormValues,
  EnrollmentFeeForm,
  EnrollmentFeeFormValues,
  FeeDetailCard,
  Discount,
  AdditionalCharge,
  Arrear,
  Challan,
  DiscountFormValues,
  AdditionalChargeFormValues,
  ArrearFormValues,
  ChallanFormValues,
  TransactionFormValues,
  FeeComponent,
  PaymentStatus
} from "@/components/shared/entities/fee";

export default function FeeExamplePage() {
  // Mock data for demonstration
  const [activeTab, setActiveTab] = useState("fee-detail");

  // Mock fee structures
  const [feeStructures, setFeeStructures] = useState<Array<{
    id: string;
    name: string;
    components: FeeComponent[];
    baseAmount: number;
  }>>([
    {
      id: "fs-1",
      name: "Standard Fee Structure",
      components: [
        {
          id: "comp-1",
          name: "Tuition Fee",
          type: "TUITION",
          amount: 5000,
          description: "Basic tuition fee"
        },
        {
          id: "comp-2",
          name: "Library Fee",
          type: "LIBRARY",
          amount: 500,
          description: "Access to library resources"
        },
        {
          id: "comp-3",
          name: "Laboratory Fee",
          type: "LABORATORY",
          amount: 1000,
          description: "Access to laboratory facilities"
        }
      ],
      baseAmount: 6500
    }
  ]);

  // Mock discount types
  const [discountTypes, setDiscountTypes] = useState<Array<{
    id: string;
    name: string;
    type: "SIBLING" | "MERIT" | "STAFF" | "FINANCIAL_AID" | "SCHOLARSHIP" | "EARLY_PAYMENT" | "SPECIAL";
    discountValue: number;
    isPercentage: boolean;
    maxAmount?: number;
  }>>([
    {
      id: "dt-1",
      name: "Sibling Discount",
      type: "SIBLING",
      discountValue: 10,
      isPercentage: true,
      maxAmount: 1000
    },
    {
      id: "dt-2",
      name: "Merit Scholarship",
      type: "MERIT",
      discountValue: 20,
      isPercentage: true
    },
    {
      id: "dt-3",
      name: "Staff Discount",
      type: "STAFF",
      discountValue: 1500,
      isPercentage: false
    }
  ]);

  // Mock enrollment fee
  const [enrollmentFee, setEnrollmentFee] = useState({
    id: "ef-1",
    enrollmentId: "enrollment-1",
    feeStructureId: "fs-1",
    feeStructure: feeStructures[0],
    baseAmount: 6500,
    discountedAmount: 5500,
    finalAmount: 6000,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    paymentStatus: "PENDING" as PaymentStatus,
    paymentMethod: "BANK_TRANSFER",
    notes: "Standard fee for the academic year 2023-2024",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
  });

  // Mock discounts
  const [discounts, setDiscounts] = useState<Discount[]>([
    {
      id: "disc-1",
      discountTypeId: "dt-1",
      discountTypeName: "Sibling Discount",
      discountType: "SIBLING",
      amount: 1000,
      reason: "Student has a sibling in grade 10",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    }
  ]);

  // Mock additional charges
  const [additionalCharges, setAdditionalCharges] = useState<AdditionalCharge[]>([
    {
      id: "charge-1",
      name: "Late Registration Fee",
      amount: 500,
      reason: "Registration after deadline",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    }
  ]);

  // Mock arrears
  const [arrears, setArrears] = useState<Arrear[]>([]);

  // Mock challans
  const [challans, setChallans] = useState<Challan[]>([]);

  // Mock paid amount
  const [paidAmount, setPaidAmount] = useState(0);

  // Mock challan templates
  const [challanTemplates, setChallanTemplates] = useState([
    {
      id: "template-1",
      name: "Standard Challan Template",
      description: "Default template for fee challans",
      copies: 3
    }
  ]);

  // Handlers
  const handleCreateFeeStructure = (values: FeeStructureFormValues) => {
    console.log("Create fee structure:", values);
    const newFeeStructure = {
      id: `fs-${feeStructures.length + 1}`,
      name: values.name,
      components: values.components,
      baseAmount: values.components.reduce((sum, comp) => sum + comp.amount, 0)
    };
    setFeeStructures([...feeStructures, newFeeStructure]);
  };

  const handleCreateDiscountType = (values: DiscountTypeFormValues) => {
    console.log("Create discount type:", values);
    const newDiscountType = {
      id: `dt-${discountTypes.length + 1}`,
      name: values.name,
      type: values.applicableFor[0] as any,
      discountValue: values.discountValue,
      isPercentage: values.isPercentage,
      maxAmount: values.maxAmount
    };
    setDiscountTypes([...discountTypes, newDiscountType]);
  };

  const handleUpdateFee = (values: EnrollmentFeeFormValues) => {
    console.log("Update fee:", values);
    const feeStructure = feeStructures.find(fs => fs.id === values.feeStructureId);
    if (!feeStructure) return;

    setEnrollmentFee({
      ...enrollmentFee,
      feeStructureId: values.feeStructureId,
      feeStructure,
      baseAmount: feeStructure.baseAmount,
      dueDate: values.dueDate || enrollmentFee.dueDate,
      paymentStatus: values.paymentStatus,
      paymentMethod: values.paymentMethod,
      notes: values.notes,
      updatedAt: new Date()
    });

    // Recalculate final amount
    const totalDiscounts = discounts.reduce((sum, d) => sum + d.amount, 0);
    const totalAdditionalCharges = additionalCharges.reduce((sum, c) => sum + c.amount, 0);
    const totalArrears = arrears.reduce((sum, a) => sum + a.amount, 0);

    const discountedAmount = feeStructure.baseAmount - totalDiscounts;
    const finalAmount = discountedAmount + totalAdditionalCharges + totalArrears;

    setEnrollmentFee(prev => ({
      ...prev,
      discountedAmount,
      finalAmount
    }));
  };

  const handleAddDiscount = (values: DiscountFormValues) => {
    console.log("Add discount:", values);
    const discountType = discountTypes.find(dt => dt.id === values.discountTypeId);
    if (!discountType) return;

    const newDiscount: Discount = {
      id: `disc-${discounts.length + 1}`,
      discountTypeId: values.discountTypeId,
      discountTypeName: discountType.name,
      discountType: discountType.type,
      amount: values.amount,
      reason: values.reason,
      createdAt: new Date()
    };

    setDiscounts([...discounts, newDiscount]);

    // Recalculate final amount
    const totalDiscounts = [...discounts, newDiscount].reduce((sum, d) => sum + d.amount, 0);
    const discountedAmount = enrollmentFee.baseAmount - totalDiscounts;
    const finalAmount = discountedAmount +
      additionalCharges.reduce((sum, c) => sum + c.amount, 0) +
      arrears.reduce((sum, a) => sum + a.amount, 0);

    setEnrollmentFee(prev => ({
      ...prev,
      discountedAmount,
      finalAmount
    }));
  };

  const handleRemoveDiscount = (discountId: string) => {
    console.log("Remove discount:", discountId);
    const updatedDiscounts = discounts.filter(d => d.id !== discountId);
    setDiscounts(updatedDiscounts);

    // Recalculate final amount
    const totalDiscounts = updatedDiscounts.reduce((sum, d) => sum + d.amount, 0);
    const discountedAmount = enrollmentFee.baseAmount - totalDiscounts;
    const finalAmount = discountedAmount +
      additionalCharges.reduce((sum, c) => sum + c.amount, 0) +
      arrears.reduce((sum, a) => sum + a.amount, 0);

    setEnrollmentFee(prev => ({
      ...prev,
      discountedAmount,
      finalAmount
    }));
  };

  const handleAddCharge = (values: AdditionalChargeFormValues) => {
    console.log("Add charge:", values);
    const newCharge: AdditionalCharge = {
      id: `charge-${additionalCharges.length + 1}`,
      name: values.name,
      amount: values.amount,
      dueDate: values.dueDate,
      reason: values.reason,
      createdAt: new Date()
    };

    setAdditionalCharges([...additionalCharges, newCharge]);

    // Recalculate final amount
    const finalAmount = enrollmentFee.discountedAmount +
      [...additionalCharges, newCharge].reduce((sum, c) => sum + c.amount, 0) +
      arrears.reduce((sum, a) => sum + a.amount, 0);

    setEnrollmentFee(prev => ({
      ...prev,
      finalAmount
    }));
  };

  const handleRemoveCharge = (chargeId: string) => {
    console.log("Remove charge:", chargeId);
    const updatedCharges = additionalCharges.filter(c => c.id !== chargeId);
    setAdditionalCharges(updatedCharges);

    // Recalculate final amount
    const finalAmount = enrollmentFee.discountedAmount +
      updatedCharges.reduce((sum, c) => sum + c.amount, 0) +
      arrears.reduce((sum, a) => sum + a.amount, 0);

    setEnrollmentFee(prev => ({
      ...prev,
      finalAmount
    }));
  };

  const handleAddArrear = (values: ArrearFormValues) => {
    console.log("Add arrear:", values);
    const newArrear: Arrear = {
      id: `arrear-${arrears.length + 1}`,
      amount: values.amount,
      dueDate: values.dueDate,
      reason: values.reason,
      createdAt: new Date()
    };

    setArrears([...arrears, newArrear]);

    // Recalculate final amount
    const finalAmount = enrollmentFee.discountedAmount +
      additionalCharges.reduce((sum, c) => sum + c.amount, 0) +
      [...arrears, newArrear].reduce((sum, a) => sum + a.amount, 0);

    setEnrollmentFee(prev => ({
      ...prev,
      finalAmount
    }));
  };

  const handleRemoveArrear = (arrearId: string) => {
    console.log("Remove arrear:", arrearId);
    const updatedArrears = arrears.filter(a => a.id !== arrearId);
    setArrears(updatedArrears);

    // Recalculate final amount
    const finalAmount = enrollmentFee.discountedAmount +
      additionalCharges.reduce((sum, c) => sum + c.amount, 0) +
      updatedArrears.reduce((sum, a) => sum + a.amount, 0);

    setEnrollmentFee(prev => ({
      ...prev,
      finalAmount
    }));
  };

  const handleGenerateChallan = (values: ChallanFormValues) => {
    console.log("Generate challan:", values);
    const newChallan: Challan = {
      id: `challan-${challans.length + 1}`,
      challanNo: `CH-${Date.now().toString().slice(-6)}`,
      issueDate: values.issueDate,
      dueDate: values.dueDate,
      totalAmount: enrollmentFee.finalAmount,
      paidAmount: 0,
      paymentStatus: "PENDING" as PaymentStatus,
      createdAt: new Date()
    };

    setChallans([...challans, newChallan]);
  };

  const handlePrintChallan = (challanId: string) => {
    console.log("Print challan:", challanId);
    alert(`Printing challan ${challanId}`);
  };

  const handleEmailChallan = (challanId: string) => {
    console.log("Email challan:", challanId);
    const email = prompt("Enter email address:");
    if (email) {
      alert(`Challan ${challanId} emailed to ${email}`);
    }
  };

  const handleAddTransaction = (values: TransactionFormValues) => {
    console.log("Add transaction:", values);

    // Update paid amount
    const newPaidAmount = paidAmount + values.amount;
    setPaidAmount(newPaidAmount);

    // Update payment status
    let newStatus = enrollmentFee.paymentStatus;
    if (newPaidAmount >= enrollmentFee.finalAmount) {
      newStatus = "PAID" as PaymentStatus;
    } else if (newPaidAmount > 0) {
      newStatus = "PARTIAL" as PaymentStatus;
    }

    setEnrollmentFee(prev => ({
      ...prev,
      paymentStatus: newStatus
    }));

    // Update challan if payment is for a challan
    if (challans.length > 0) {
      const latestChallan = challans[challans.length - 1];
      const updatedChallans = challans.map(c =>
        c.id === latestChallan.id
          ? { ...c, paidAmount: c.paidAmount + values.amount, paymentStatus: newStatus }
          : c
      );
      setChallans(updatedChallans);
    }

    alert(`Payment of $${values.amount.toFixed(2)} recorded successfully!`);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fee Management Example</h1>
          <p className="text-muted-foreground">
            This page demonstrates the fee management components
          </p>
        </div>
        <Button asChild>
          <a href="/admin/campus/enrollment">Back to Enrollments</a>
        </Button>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="fee-detail">Fee Details</TabsTrigger>
          <TabsTrigger value="fee-structure">Fee Structure</TabsTrigger>
          <TabsTrigger value="discount-type">Discount Types</TabsTrigger>
          <TabsTrigger value="enrollment-fee">Assign Fee</TabsTrigger>
        </TabsList>

        <TabsContent value="fee-detail" className="mt-6">
          <FeeDetailCard
            fee={enrollmentFee}
            studentName="John Doe"
            studentId="STD-12345"
            className="Grade 10-A"
            programName="High School Program"
            discounts={discounts}
            additionalCharges={additionalCharges}
            arrears={arrears}
            challans={challans}
            paidAmount={paidAmount}
            availableFeeStructures={feeStructures}
            availableDiscountTypes={discountTypes}
            availableChallanTemplates={challanTemplates}
            institutionName="Example School"
            onUpdateFee={handleUpdateFee}
            onAddDiscount={handleAddDiscount}
            onRemoveDiscount={handleRemoveDiscount}
            onAddCharge={handleAddCharge}
            onRemoveCharge={handleRemoveCharge}
            onAddArrear={handleAddArrear}
            onRemoveArrear={handleRemoveArrear}
            onGenerateChallan={handleGenerateChallan}
            onPrintChallan={handlePrintChallan}
            onEmailChallan={handleEmailChallan}
            onAddTransaction={handleAddTransaction}
          />
        </TabsContent>

        <TabsContent value="fee-structure" className="mt-6">
          <FeeStructureForm
            programCampuses={[
              { id: "pc-1", name: "Main Campus - High School" },
              { id: "pc-2", name: "Main Campus - Middle School" },
              { id: "pc-3", name: "Branch Campus - Primary" }
            ]}
            academicCycles={[
              { id: "ac-1", name: "2023-2024" },
              { id: "ac-2", name: "2024-2025" }
            ]}
            terms={[
              { id: "term-1", name: "Term 1" },
              { id: "term-2", name: "Term 2" },
              { id: "term-3", name: "Term 3" }
            ]}
            onSubmit={handleCreateFeeStructure}
          />
        </TabsContent>

        <TabsContent value="discount-type" className="mt-6">
          <DiscountTypeForm
            onSubmit={handleCreateDiscountType}
          />
        </TabsContent>

        <TabsContent value="enrollment-fee" className="mt-6">
          <EnrollmentFeeForm
            enrollmentId="enrollment-1"
            feeStructures={feeStructures}
            onSubmit={handleUpdateFee}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
