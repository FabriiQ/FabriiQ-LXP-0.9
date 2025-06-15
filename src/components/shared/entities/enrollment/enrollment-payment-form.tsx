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
import { PaymentMethodSelector, PAYMENT_METHODS } from "@/components/core/payment/payment-method-selector";
import { PaymentStatusBadge, PaymentStatus } from "@/components/core/payment/payment-status-badge";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

const paymentFormSchema = z.object({
  amount: z.coerce.number().positive({ message: "Amount must be greater than 0" }),
  dueDate: z.date().optional(),
  paymentStatus: z.enum(["PAID", "PENDING", "PARTIAL", "WAIVED"] as const),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
});

export type PaymentFormValues = z.infer<typeof paymentFormSchema>;

interface EnrollmentPaymentFormProps {
  enrollmentId: string;
  initialData?: Partial<PaymentFormValues>;
  onSubmit: (values: PaymentFormValues) => void;
  isLoading?: boolean;
  className?: string;
}

export function EnrollmentPaymentForm({
  enrollmentId,
  initialData,
  onSubmit,
  isLoading = false,
  className,
}: EnrollmentPaymentFormProps) {
  const [date, setDate] = useState<Date | undefined>(
    initialData?.dueDate ? new Date(initialData.dueDate) : undefined
  );

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: initialData?.amount || 0,
      dueDate: initialData?.dueDate,
      paymentStatus: (initialData?.paymentStatus as PaymentStatus) || "PENDING",
      paymentMethod: initialData?.paymentMethod || "",
      notes: initialData?.notes || "",
    },
  });

  const handleSubmit = (values: PaymentFormValues) => {
    onSubmit(values);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Payment Details</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="pl-7"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                        onSelect={(date) => {
                          field.onChange(date);
                          setDate(date);
                        }}
                        disabled={(date) => date < new Date("1900-01-01")}
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
                  <div className="flex flex-wrap gap-2">
                    {(["PAID", "PENDING", "PARTIAL", "WAIVED"] as const).map((status) => (
                      <div
                        key={status}
                        className={cn(
                          "flex items-center space-x-2 rounded-md border p-2 cursor-pointer",
                          field.value === status
                            ? "border-primary bg-primary/5"
                            : "border-input"
                        )}
                        onClick={() => field.onChange(status)}
                      >
                        <PaymentStatusBadge status={status} />
                        <span>{status.charAt(0) + status.slice(1).toLowerCase()}</span>
                      </div>
                    ))}
                  </div>
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
                      placeholder="Add any additional notes about this payment"
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
              {isLoading ? "Saving..." : "Save Payment Details"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
