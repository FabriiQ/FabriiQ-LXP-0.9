"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/data-display/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { FeeComponentList, FeeComponent } from "@/components/core/fee/fee-component-list";
import { PaymentMethodSelector, PAYMENT_METHODS } from "@/components/core/payment/payment-method-selector";
import { PaymentStatus } from "@/components/core/payment/payment-status-badge";
import { Separator } from "@/components/ui/separator";

const enrollmentFeeSchema = z.object({
  feeStructureId: z.string().min(1, "Fee structure is required"),
  dueDate: z.date().optional(),
  paymentStatus: z.enum(["PAID", "PENDING", "PARTIAL", "WAIVED"] as const),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
});

export type EnrollmentFeeFormValues = z.infer<typeof enrollmentFeeSchema>;

interface FeeStructure {
  id: string;
  name: string;
  components: FeeComponent[];
  baseAmount: number;
}

interface EnrollmentFeeFormProps {
  enrollmentId: string;
  feeStructures: FeeStructure[];
  initialData?: Partial<EnrollmentFeeFormValues>;
  onSubmit: (values: EnrollmentFeeFormValues) => void;
  isLoading?: boolean;
  className?: string;
}

export function EnrollmentFeeForm({
  enrollmentId,
  feeStructures,
  initialData,
  onSubmit,
  isLoading = false,
  className,
}: EnrollmentFeeFormProps) {
  const [selectedFeeStructure, setSelectedFeeStructure] = useState<FeeStructure | null>(
    initialData?.feeStructureId
      ? feeStructures.find(fs => fs.id === initialData.feeStructureId) || null
      : null
  );

  const form = useForm<EnrollmentFeeFormValues>({
    resolver: zodResolver(enrollmentFeeSchema),
    defaultValues: {
      feeStructureId: initialData?.feeStructureId || "",
      dueDate: initialData?.dueDate,
      paymentStatus: (initialData?.paymentStatus as PaymentStatus) || "PENDING",
      paymentMethod: initialData?.paymentMethod || "",
      notes: initialData?.notes || "",
    },
  });

  const handleSubmit = (values: EnrollmentFeeFormValues) => {
    onSubmit(values);
  };

  const handleFeeStructureChange = (feeStructureId: string) => {
    const feeStructure = feeStructures.find(fs => fs.id === feeStructureId) || null;
    setSelectedFeeStructure(feeStructure);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Enrollment Fee</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="feeStructureId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fee Structure <span className="text-destructive">*</span></FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleFeeStructureChange(value);
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select fee structure" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {feeStructures.map((feeStructure) => (
                        <SelectItem key={feeStructure.id} value={feeStructure.id}>
                          {feeStructure.name} (${feeStructure.baseAmount.toFixed(2)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedFeeStructure && (
              <div className="rounded-md border p-4">
                <h3 className="text-sm font-medium mb-2">Fee Structure Details</h3>
                <FeeComponentList
                  components={selectedFeeStructure.components}
                  showTotal={true}
                  compact={true}
                />
              </div>
            )}

            <Separator />

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <Calendar className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Status <span className="text-destructive">*</span></FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="PARTIAL">Partial</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                      <SelectItem value="WAIVED">Waived</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <PaymentMethodSelector
              form={form}
              name="paymentMethod"
              label="Payment Method"
              placeholder="Select payment method"
              customMethods={PAYMENT_METHODS}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional notes about this fee"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Assign Fee"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
