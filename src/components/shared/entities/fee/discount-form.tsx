"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/data-display/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DiscountBadge, DiscountType } from "@/components/core/fee/discount-badge";

const discountFormSchema = z.object({
  discountTypeId: z.string().min(1, "Discount type is required"),
  amount: z.coerce.number().min(0, "Amount must be a positive number"),
  reason: z.string().optional(),
});

export type DiscountFormValues = z.infer<typeof discountFormSchema>;

interface DiscountTypeOption {
  id: string;
  name: string;
  type: DiscountType;
  discountValue: number;
  isPercentage: boolean;
  maxAmount?: number;
}

interface DiscountFormProps {
  enrollmentFeeId: string;
  discountTypes: DiscountTypeOption[];
  initialData?: Partial<DiscountFormValues>;
  onSubmit: (values: DiscountFormValues) => void;
  isLoading?: boolean;
  className?: string;
}

export function DiscountForm({
  enrollmentFeeId,
  discountTypes,
  initialData,
  onSubmit,
  isLoading = false,
  className,
}: DiscountFormProps) {
  const form = useForm<DiscountFormValues>({
    resolver: zodResolver(discountFormSchema),
    defaultValues: {
      discountTypeId: initialData?.discountTypeId || "",
      amount: initialData?.amount || 0,
      reason: initialData?.reason || "",
    },
  });

  const selectedDiscountTypeId = form.watch("discountTypeId");
  const selectedDiscountType = discountTypes.find(dt => dt.id === selectedDiscountTypeId);

  const handleSubmit = (values: DiscountFormValues) => {
    onSubmit(values);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Add Discount</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="discountTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discount Type <span className="text-destructive">*</span></FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      const discountType = discountTypes.find(dt => dt.id === value);
                      if (discountType) {
                        // Auto-calculate amount based on discount type
                        if (discountType.isPercentage) {
                          // For percentage discounts, leave the amount field for user input
                          form.setValue("amount", 0);
                        } else {
                          // For fixed amount discounts, set the amount from the discount type
                          form.setValue("amount", discountType.discountValue);
                        }
                      }
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select discount type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {discountTypes.map((discountType) => (
                        <SelectItem key={discountType.id} value={discountType.id}>
                          <div className="flex items-center">
                            <span className="mr-2">{discountType.name}</span>
                            <DiscountBadge
                              type={discountType.type}
                              value={discountType.discountValue}
                              isPercentage={discountType.isPercentage}
                            />
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedDiscountType && (
              <div className="rounded-md border p-3 bg-muted/50">
                <h3 className="text-sm font-medium mb-1">Discount Details</h3>
                <p className="text-sm">
                  {selectedDiscountType.isPercentage
                    ? `${selectedDiscountType.discountValue}% discount`
                    : `$${selectedDiscountType.discountValue.toFixed(2)} fixed discount`}
                  {selectedDiscountType.maxAmount && selectedDiscountType.isPercentage
                    ? ` (Maximum: $${selectedDiscountType.maxAmount.toFixed(2)})`
                    : ""}
                </p>
              </div>
            )}

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount <span className="text-destructive">*</span></FormLabel>
                  {selectedDiscountType?.isPercentage && (
                    <FormDescription>
                      Enter the calculated discount amount based on the percentage
                    </FormDescription>
                  )}
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
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
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter reason for applying this discount"
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
              {isLoading ? "Adding..." : "Add Discount"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
