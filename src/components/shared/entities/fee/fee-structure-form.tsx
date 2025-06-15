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
import { Switch } from "@/components/ui/switch";
import { FeeComponent, FeeComponentList, FeeComponentType } from "@/components/core/fee/fee-component-list";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { X, Plus, Edit, Trash } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const feeStructureSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  programCampusId: z.string().min(1, "Program is required"),
  academicCycleId: z.string().optional(),
  termId: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurringInterval: z.string().optional(),
});

const feeComponentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Type is required"),
  amount: z.coerce.number().min(0, "Amount must be a positive number"),
  description: z.string().optional(),
});

export type FeeStructureFormValues = z.infer<typeof feeStructureSchema> & {
  components: FeeComponent[];
};

export type FeeComponentFormValues = z.infer<typeof feeComponentSchema>;

interface ProgramCampus {
  id: string;
  name: string;
}

interface AcademicCycle {
  id: string;
  name: string;
}

interface Term {
  id: string;
  name: string;
}

interface FeeStructureFormProps {
  programCampuses: ProgramCampus[];
  academicCycles: AcademicCycle[];
  terms: Term[];
  initialData?: Partial<FeeStructureFormValues>;
  onSubmit: (values: FeeStructureFormValues) => void;
  isLoading?: boolean;
  className?: string;
}

export function FeeStructureForm({
  programCampuses,
  academicCycles,
  terms,
  initialData,
  onSubmit,
  isLoading = false,
  className,
}: FeeStructureFormProps) {
  const [components, setComponents] = useState<FeeComponent[]>(initialData?.components || []);
  const [isComponentDialogOpen, setIsComponentDialogOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<FeeComponent | null>(null);
  const [componentToDelete, setComponentToDelete] = useState<FeeComponent | null>(null);

  const form = useForm<z.infer<typeof feeStructureSchema>>({
    resolver: zodResolver(feeStructureSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      programCampusId: initialData?.programCampusId || "",
      academicCycleId: initialData?.academicCycleId || "",
      termId: initialData?.termId || "",
      isRecurring: initialData?.isRecurring || false,
      recurringInterval: initialData?.recurringInterval || "",
    },
  });

  const componentForm = useForm<FeeComponentFormValues>({
    resolver: zodResolver(feeComponentSchema),
    defaultValues: {
      name: "",
      type: "",
      amount: 0,
      description: "",
    },
  });

  const handleSubmit = (values: z.infer<typeof feeStructureSchema>) => {
    if (components.length === 0) {
      form.setError("root", {
        type: "manual",
        message: "At least one fee component is required",
      });
      return;
    }

    onSubmit({
      ...values,
      components,
    });
  };

  const openComponentDialog = (component?: FeeComponent) => {
    if (component) {
      setEditingComponent(component);
      componentForm.reset({
        name: component.name,
        type: component.type,
        amount: component.amount,
        description: component.description || "",
      });
    } else {
      setEditingComponent(null);
      componentForm.reset({
        name: "",
        type: "",
        amount: 0,
        description: "",
      });
    }
    setIsComponentDialogOpen(true);
  };

  const handleAddComponent = (values: FeeComponentFormValues) => {
    const newComponent: FeeComponent = {
      id: editingComponent?.id || `temp-${Date.now()}`,
      name: values.name,
      type: values.type as FeeComponentType,
      amount: values.amount,
      description: values.description,
    };

    if (editingComponent) {
      // Update existing component
      setComponents(components.map(c => c.id === editingComponent.id ? newComponent : c));
    } else {
      // Add new component
      setComponents([...components, newComponent]);
    }

    setIsComponentDialogOpen(false);
    setEditingComponent(null);
  };

  const handleDeleteComponent = (component: FeeComponent) => {
    setComponentToDelete(component);
  };

  const confirmDeleteComponent = () => {
    if (componentToDelete) {
      setComponents(components.filter(c => c.id !== componentToDelete.id));
      setComponentToDelete(null);
    }
  };

  const totalAmount = components.reduce((sum, component) => sum + component.amount, 0);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Fee Structure</CardTitle>
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
                    <Input placeholder="Enter fee structure name" {...field} />
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
                name="programCampusId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Program <span className="text-destructive">*</span></FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select program" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {programCampuses.map((program) => (
                          <SelectItem key={program.id} value={program.id}>
                            {program.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="academicCycleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Academic Cycle</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select academic cycle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {academicCycles.map((cycle) => (
                          <SelectItem key={cycle.id} value={cycle.id}>
                            {cycle.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="termId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Term</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select term" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {terms.map((term) => (
                          <SelectItem key={term.id} value={term.id}>
                            {term.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="isRecurring"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Recurring Fee</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Is this a recurring fee structure?
                      </p>
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

              {form.watch("isRecurring") && (
                <FormField
                  control={form.control}
                  name="recurringInterval"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recurring Interval <span className="text-destructive">*</span></FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select interval" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="MONTHLY">Monthly</SelectItem>
                          <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                          <SelectItem value="SEMESTER">Semester</SelectItem>
                          <SelectItem value="ANNUAL">Annual</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <Separator />

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Fee Components</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => openComponentDialog()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Component
                </Button>
              </div>

              {components.length === 0 ? (
                <div className="rounded-md border border-dashed p-6 text-center">
                  <p className="text-sm text-muted-foreground mb-2">No fee components added yet</p>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => openComponentDialog()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Component
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {components.map((component) => (
                    <div
                      key={component.id}
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <div>
                        <p className="font-medium">{component.name}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                            {component.type}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            ${component.amount.toFixed(2)}
                          </span>
                        </div>
                        {component.description && (
                          <p className="text-xs text-muted-foreground mt-1">{component.description}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => openComponentDialog(component)}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteComponent(component)}
                        >
                          <Trash className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-between items-center rounded-md border p-3 mt-4">
                    <p className="font-semibold">Total Amount</p>
                    <p className="font-semibold">${totalAmount.toFixed(2)}</p>
                  </div>
                </div>
              )}

              {form.formState.errors.root && (
                <p className="text-sm text-destructive mt-2">{form.formState.errors.root.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Fee Structure"}
            </Button>
          </CardFooter>
        </form>
      </Form>

      {/* Fee Component Dialog */}
      <Dialog open={isComponentDialogOpen} onOpenChange={setIsComponentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingComponent ? "Edit Component" : "Add Component"}</DialogTitle>
          </DialogHeader>
          <Form {...componentForm}>
            <form onSubmit={componentForm.handleSubmit(handleAddComponent)}>
              <div className="space-y-4 py-4">
                <FormField
                  control={componentForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Enter component name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={componentForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type <span className="text-destructive">*</span></FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select component type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="TUITION">Tuition</SelectItem>
                          <SelectItem value="ADMISSION">Admission</SelectItem>
                          <SelectItem value="REGISTRATION">Registration</SelectItem>
                          <SelectItem value="LIBRARY">Library</SelectItem>
                          <SelectItem value="LABORATORY">Laboratory</SelectItem>
                          <SelectItem value="SPORTS">Sports</SelectItem>
                          <SelectItem value="TRANSPORT">Transport</SelectItem>
                          <SelectItem value="HOSTEL">Hostel</SelectItem>
                          <SelectItem value="EXAMINATION">Examination</SelectItem>
                          <SelectItem value="MISCELLANEOUS">Miscellaneous</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={componentForm.control}
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
                  control={componentForm.control}
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
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsComponentDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingComponent ? "Update" : "Add"} Component
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!componentToDelete} onOpenChange={(open) => !open && setComponentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the component "{componentToDelete?.name}" from the fee structure.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteComponent} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
