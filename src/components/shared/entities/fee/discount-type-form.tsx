"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/data-display/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { DiscountType } from "@/components/core/fee/discount-badge";

const discountTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  discountValue: z.coerce.number().min(0, "Discount value must be a positive number"),
  isPercentage: z.boolean().default(true),
  maxAmount: z.coerce.number().min(0, "Maximum amount must be a positive number").optional(),
  applicableFor: z.array(z.string()).min(1, "At least one applicable category is required"),
});

export type DiscountTypeFormValues = z.infer<typeof discountTypeSchema>;

const DISCOUNT_APPLICABLE_OPTIONS = [
  { id: "SIBLING", label: "Sibling Discount" },
  { id: "MERIT", label: "Merit-based Discount" },
  { id: "STAFF", label: "Staff Discount" },
  { id: "FINANCIAL_AID", label: "Financial Aid" },
  { id: "SCHOLARSHIP", label: "Scholarship" },
  { id: "EARLY_PAYMENT", label: "Early Payment Discount" },
  { id: "SPECIAL", label: "Special Discount" },
];

interface DiscountTypeFormProps {
  initialData?: Partial<DiscountTypeFormValues>;
  onSubmit: (values: DiscountTypeFormValues) => void;
  isLoading?: boolean;
  className?: string;
}

export function DiscountTypeForm({
  initialData,
  onSubmit,
  isLoading = false,
  className,
}: DiscountTypeFormProps) {
  const form = useForm<DiscountTypeFormValues>({
    resolver: zodResolver(discountTypeSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      discountValue: initialData?.discountValue || 0,
      isPercentage: initialData?.isPercentage !== undefined ? initialData.isPercentage : true,
      maxAmount: initialData?.maxAmount || undefined,
      applicableFor: initialData?.applicableFor || ["SPECIAL"],
    },
  });

  const isPercentage = form.watch("isPercentage");

  const handleSubmit = (values: DiscountTypeFormValues) => {
    onSubmit(values);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Discount Type</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Enter discount type name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter description"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="isPercentage"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Percentage Discount</FormLabel>
                      <FormDescription>
                        Is this a percentage-based discount?
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discountValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {isPercentage ? "Percentage" : "Amount"} <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          {isPercentage ? "%" : "$"}
                        </span>
                        <Input
                          type="number"
                          step={isPercentage ? "0.01" : "0.01"}
                          min={0}
                          max={isPercentage ? 100 : undefined}
                          placeholder={isPercentage ? "0.00" : "0.00"}
                          className="pl-7"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {isPercentage && (
              <FormField
                control={form.control}
                name="maxAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Amount</FormLabel>
                    <FormDescription>
                      Maximum discount amount when using percentage (optional)
                    </FormDescription>
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
                          value={field.value || ""}
                          onChange={(e) => {
                            const value = e.target.value === "" ? undefined : parseFloat(e.target.value);
                            field.onChange(value);
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="applicableFor"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel>Applicable For <span className="text-destructive">*</span></FormLabel>
                    <FormDescription>
                      Select the categories this discount applies to
                    </FormDescription>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {DISCOUNT_APPLICABLE_OPTIONS.map((option) => (
                      <FormField
                        key={option.id}
                        control={form.control}
                        name="applicableFor"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={option.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(option.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, option.id])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== option.id
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {option.label}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Discount Type"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
