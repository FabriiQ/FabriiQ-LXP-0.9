"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/data-display/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { FeeDetailCard } from "@/components/shared/entities/fee/fee-detail-card";
import { EnrollmentFeeForm } from "@/components/shared/entities/fee/enrollment-fee-form";
import { api } from "@/trpc/react";
import { useToast } from "@/components/ui/use-toast";
import { LoadingSpinner } from "@/components/ui/loading";

export default function EnrollmentFeePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("details");

  // Fetch enrollment data
  const { data: enrollment, isLoading: enrollmentLoading } = api.enrollment.getById.useQuery(
    { id },
    { enabled: !!id }
  );

  // Fetch fee data
  const { data: fee, isLoading: feeLoading, refetch: refetchFee } = api.enrollmentFee.getByEnrollment.useQuery(
    { enrollmentId: id },
    { enabled: !!id }
  );

  // Fetch fee structures
  const { data: feeStructures, isLoading: feeStructuresLoading } = api.feeStructure.getByProgramCampus.useQuery(
    { programCampusId: enrollment?.programCampusId || "" },
    { enabled: !!enrollment?.programCampusId }
  );

  // Fetch discount types
  const { data: discountTypes, isLoading: discountTypesLoading } = api.discountType.getAll.useQuery();

  // Fetch challan templates
  const { data: challanTemplates, isLoading: challanTemplatesLoading } = api.challan.getTemplatesByInstitution.useQuery(
    { institutionId: enrollment?.institutionId || "" },
    { enabled: !!enrollment?.institutionId }
  );

  // Mutations
  const createEnrollmentFeeMutation = api.enrollmentFee.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Fee assigned successfully",
        description: "The fee has been assigned to the enrollment.",
      });
      refetchFee();
      setActiveTab("details");
    },
    onError: (error) => {
      toast({
        title: "Error assigning fee",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateEnrollmentFeeMutation = api.enrollmentFee.update.useMutation({
    onSuccess: () => {
      toast({
        title: "Fee updated successfully",
        description: "The fee has been updated.",
      });
      refetchFee();
    },
    onError: (error) => {
      toast({
        title: "Error updating fee",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addDiscountMutation = api.enrollmentFee.addDiscount.useMutation({
    onSuccess: () => {
      toast({
        title: "Discount added successfully",
        description: "The discount has been added to the fee.",
      });
      refetchFee();
    },
    onError: (error) => {
      toast({
        title: "Error adding discount",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeDiscountMutation = api.enrollmentFee.removeDiscount.useMutation({
    onSuccess: () => {
      toast({
        title: "Discount removed successfully",
        description: "The discount has been removed from the fee.",
      });
      refetchFee();
    },
    onError: (error) => {
      toast({
        title: "Error removing discount",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addChargeMutation = api.enrollmentFee.addCharge.useMutation({
    onSuccess: () => {
      toast({
        title: "Charge added successfully",
        description: "The additional charge has been added to the fee.",
      });
      refetchFee();
    },
    onError: (error) => {
      toast({
        title: "Error adding charge",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeChargeMutation = api.enrollmentFee.removeCharge.useMutation({
    onSuccess: () => {
      toast({
        title: "Charge removed successfully",
        description: "The additional charge has been removed from the fee.",
      });
      refetchFee();
    },
    onError: (error) => {
      toast({
        title: "Error removing charge",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addArrearMutation = api.enrollmentFee.addArrear.useMutation({
    onSuccess: () => {
      toast({
        title: "Arrear added successfully",
        description: "The arrear has been added to the fee.",
      });
      refetchFee();
    },
    onError: (error) => {
      toast({
        title: "Error adding arrear",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeArrearMutation = api.enrollmentFee.removeArrear.useMutation({
    onSuccess: () => {
      toast({
        title: "Arrear removed successfully",
        description: "The arrear has been removed from the fee.",
      });
      refetchFee();
    },
    onError: (error) => {
      toast({
        title: "Error removing arrear",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generateChallanMutation = api.challan.generate.useMutation({
    onSuccess: () => {
      toast({
        title: "Challan generated successfully",
        description: "The fee challan has been generated.",
      });
      refetchFee();
    },
    onError: (error) => {
      toast({
        title: "Error generating challan",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const printChallanMutation = api.challan.print.useMutation({
    onSuccess: (data) => {
      // In a real implementation, this would open the print URL
      window.open(data.printUrl, "_blank");
    },
    onError: (error) => {
      toast({
        title: "Error printing challan",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const emailChallanMutation = api.challan.email.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Challan emailed successfully",
        description: data.message,
      });
    },
    onError: (error) => {
      toast({
        title: "Error emailing challan",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addTransactionMutation = api.enrollmentFee.addTransaction.useMutation({
    onSuccess: () => {
      toast({
        title: "Payment recorded successfully",
        description: "The payment transaction has been recorded.",
      });
      refetchFee();
    },
    onError: (error) => {
      toast({
        title: "Error recording payment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handlers
  const handleCreateFee = (values: any) => {
    createEnrollmentFeeMutation.mutate({
      enrollmentId: id,
      ...values,
    });
  };

  const handleUpdateFee = (values: any) => {
    if (!fee) return;
    updateEnrollmentFeeMutation.mutate({
      id: fee.id,
      ...values,
    });
  };

  const handleAddDiscount = (values: any) => {
    if (!fee) return;
    addDiscountMutation.mutate({
      enrollmentFeeId: fee.id,
      ...values,
    });
  };

  const handleRemoveDiscount = (discountId: string) => {
    removeDiscountMutation.mutate({ discountId });
  };

  const handleAddCharge = (values: any) => {
    if (!fee) return;
    addChargeMutation.mutate({
      enrollmentFeeId: fee.id,
      ...values,
    });
  };

  const handleRemoveCharge = (chargeId: string) => {
    removeChargeMutation.mutate({ chargeId });
  };

  const handleAddArrear = (values: any) => {
    if (!fee) return;
    addArrearMutation.mutate({
      enrollmentFeeId: fee.id,
      ...values,
    });
  };

  const handleRemoveArrear = (arrearId: string) => {
    removeArrearMutation.mutate({ arrearId });
  };

  const handleGenerateChallan = (values: any) => {
    if (!fee) return;
    generateChallanMutation.mutate({
      enrollmentFeeId: fee.id,
      ...values,
    });
  };

  const handlePrintChallan = (challanId: string) => {
    printChallanMutation.mutate({ id: challanId });
  };

  const handleEmailChallan = (challanId: string, email: string) => {
    emailChallanMutation.mutate({ id: challanId, email });
  };

  const handleAddTransaction = (values: any) => {
    if (!fee) return;
    addTransactionMutation.mutate({
      enrollmentFeeId: fee.id,
      ...values,
    });
  };

  // Loading state
  const isLoading = enrollmentLoading || feeLoading || feeStructuresLoading || discountTypesLoading || challanTemplatesLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <LoadingSpinner />
      </div>
    );
  }

  // Error state
  if (!enrollment) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Enrollment not found. Please go back and try again.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Enrollment Fee</h1>
          <p className="text-muted-foreground">
            Manage fee for {enrollment.student?.name || "Student"}
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Enrollment
        </Button>
      </div>

      <Separator />

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">Fee Details</TabsTrigger>
          <TabsTrigger value="assign" disabled={!!fee}>Assign Fee</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="mt-6">
          {fee ? (
            <FeeDetailCard
              fee={fee}
              studentName={enrollment.student?.name || "Student"}
              studentId={enrollment.student?.id || ""}
              className={enrollment.class?.name || ""}
              programName={enrollment.program?.name || ""}
              discounts={fee.discounts || []}
              additionalCharges={fee.additionalCharges || []}
              arrears={fee.arrears || []}
              challans={fee.challans || []}
              paidAmount={fee.transactions?.reduce((sum, t) => sum + t.amount, 0) || 0}
              availableFeeStructures={feeStructures || []}
              availableDiscountTypes={discountTypes || []}
              availableChallanTemplates={challanTemplates || []}
              institutionName={enrollment.institution?.name || "Institution"}
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
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Fee Assigned</CardTitle>
                <CardDescription>
                  This enrollment does not have a fee assigned yet.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setActiveTab("assign")}>
                  Assign Fee
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="assign" className="mt-6">
          {!fee && feeStructures && (
            <EnrollmentFeeForm
              enrollmentId={id}
              feeStructures={feeStructures}
              onSubmit={handleCreateFee}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
