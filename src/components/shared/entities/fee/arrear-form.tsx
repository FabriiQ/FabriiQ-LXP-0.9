"use client";

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

const arrearFormSchema = z.object({
  amount: z.coerce.number().min(0, "Amount must be a positive number"),
  previousFeeId: z.string().optional(),
  dueDate: z.date().optional(),
  reason: z.string().min(1, "Reason is required"),
});

export type ArrearFormValues = z.infer<typeof arrearFormSchema>;

interface PreviousFee {
  id: string;
  name: string;
  dueDate: Date | string;
  amount: number;
}

interface ArrearFormProps {
  enrollmentFeeId: string;
  previousFees?: PreviousFee[];
  initialData?: Partial<ArrearFormValues>;
  onSubmit: (values: ArrearFormValues) => void;
  isLoading?: boolean;
  className?: string;
}

export function ArrearForm({
  enrollmentFeeId,
  previousFees = [],
  initialData,
  onSubmit,
  isLoading = false,
  className,
}: ArrearFormProps) {
  const form = useForm<ArrearFormValues>({
    resolver: zodResolver(arrearFormSchema),
    defaultValues: {
      amount: initialData?.amount || 0,
      previousFeeId: initialData?.previousFeeId || "",
      dueDate: initialData?.dueDate,
      reason: initialData?.reason || "",
    },
  });

  const handleSubmit = (values: ArrearFormValues) => {
    onSubmit(values);
  };

  const selectedPreviousFeeId = form.watch("previousFeeId");
  const selectedPreviousFee = previousFees.find(fee => fee.id === selectedPreviousFeeId);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Add Arrear</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-4">
            {previousFees.length > 0 && (
              <FormField
                control={form.control}
                name="previousFeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Previous Fee</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        const fee = previousFees.find(f => f.id === value);
                        if (fee) {
                          form.setValue("amount", fee.amount);
                          form.setValue("reason", `Arrear from previous fee: ${fee.name}`);
                        }
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select previous fee (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {previousFees.map((fee) => (
                          <SelectItem key={fee.id} value={fee.id}>
                            {fee.name} - ${fee.amount.toFixed(2)} ({typeof fee.dueDate === 'string' ? fee.dueDate : format(fee.dueDate, "MMM d, yyyy")})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter reason for this arrear"
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
              {isLoading ? "Adding..." : "Add Arrear"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
