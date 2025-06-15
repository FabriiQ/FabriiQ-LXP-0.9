'use client';

import React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Institution, SystemStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/forms/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/forms/select";
import { useToast } from "@/components/ui/feedback/toast";
import { api } from "@/trpc/react";

// Form validation schema
const institutionFormSchema = z.object({
  name: z.string().min(1, "Institution name is required").max(200, "Institution name must be less than 200 characters"),
  code: z.string().min(1, "Institution code is required").max(50, "Institution code must be less than 50 characters"),
  description: z.string().optional(),
  address: z.string().optional(),
  contact: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  status: z.nativeEnum(SystemStatus).default(SystemStatus.ACTIVE),
});

type InstitutionFormValues = z.infer<typeof institutionFormSchema>;

// Extended Institution type to match what we expect from the database
interface ExtendedInstitution extends Institution {
  description?: string | null;
  address?: string | null;
  contact?: string | null;
  email?: string | null;
  website?: string | null;
}

interface InstitutionFormProps {
  institution?: ExtendedInstitution;
}

export function InstitutionForm({ institution }: InstitutionFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEditing = !!institution;

  // Set up form with default values
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<InstitutionFormValues>({
    resolver: zodResolver(institutionFormSchema),
    defaultValues: institution
      ? {
          name: institution.name,
          code: institution.code,
          description: institution.description || "",
          address: institution.address || "",
          contact: institution.contact || "",
          email: institution.email || "",
          website: institution.website || "",
          status: institution.status,
        }
      : {
          name: "",
          code: "",
          description: "",
          address: "",
          contact: "",
          email: "",
          website: "",
          status: SystemStatus.ACTIVE,
        },
  });

  // API mutations
  const createInstitution = api.institution.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Institution created successfully",
        variant: "success",
      });
      router.push("/admin/system/institutions");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create institution",
        variant: "destructive",
      });
    },
  });

  const updateInstitution = api.institution.update.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Institution updated successfully",
        variant: "success",
      });
      router.push(`/admin/system/institutions/${institution?.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update institution",
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = async (data: InstitutionFormValues) => {
    // Clean up empty strings for optional fields and ensure proper typing
    const formData = {
      name: data.name,
      code: data.code,
      description: data.description || undefined,
      address: data.address || undefined,
      contact: data.contact || undefined,
      email: data.email || undefined,
      website: data.website || undefined,
      status: data.status
    };

    if (isEditing && institution) {
      updateInstitution.mutate({
        id: institution.id,
        data: formData,
      });
    } else {
      createInstitution.mutate(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            Institution Name <span className="text-destructive">*</span>
          </label>
          <Input
            id="name"
            placeholder="Enter institution name"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="code" className="text-sm font-medium">
            Institution Code <span className="text-destructive">*</span>
          </label>
          <Input
            id="code"
            placeholder="Enter institution code"
            {...register("code")}
          />
          {errors.code && (
            <p className="text-sm text-destructive">{errors.code.message}</p>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="description" className="text-sm font-medium">
            Description
          </label>
          <Textarea
            id="description"
            placeholder="Enter institution description"
            {...register("description")}
            error={errors.description?.message}
          />
          {errors.description && (
            <p className="text-sm text-destructive">{errors.description.message}</p>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="address" className="text-sm font-medium">
            Address
          </label>
          <Textarea
            id="address"
            placeholder="Enter institution address"
            {...register("address")}
            error={errors.address?.message}
          />
          {errors.address && (
            <p className="text-sm text-destructive">{errors.address.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="contact" className="text-sm font-medium">
            Contact Number
          </label>
          <Input
            id="contact"
            placeholder="Enter contact number"
            {...register("contact")}
          />
          {errors.contact && (
            <p className="text-sm text-destructive">{errors.contact.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="Enter institution email"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="website" className="text-sm font-medium">
            Website
          </label>
          <Input
            id="website"
            placeholder="Enter institution website"
            {...register("website")}
          />
          {errors.website && (
            <p className="text-sm text-destructive">{errors.website.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="status" className="text-sm font-medium">
            Status <span className="text-destructive">*</span>
          </label>
          <Select
            defaultValue={institution?.status || SystemStatus.ACTIVE}
            onValueChange={(value) => {
              // This is a workaround for react-hook-form with shadcn/ui Select
              const event = {
                target: {
                  name: "status",
                  value,
                },
              };
              register("status").onChange(event);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SystemStatus.ACTIVE}>Active</SelectItem>
              <SelectItem value={SystemStatus.INACTIVE}>Inactive</SelectItem>
              <SelectItem value={SystemStatus.ARCHIVED}>Archived</SelectItem>
              <SelectItem value={SystemStatus.DELETED}>Deleted</SelectItem>
            </SelectContent>
          </Select>
          {errors.status && (
            <p className="text-sm text-destructive">{errors.status.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (isEditing) {
              router.push(`/admin/system/institutions/${institution?.id}`);
            } else {
              router.push("/admin/system/institutions");
            }
          }}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : isEditing ? "Update Institution" : "Create Institution"}
        </Button>
      </div>
    </form>
  );
}
