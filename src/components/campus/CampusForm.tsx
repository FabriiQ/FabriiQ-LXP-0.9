'use client';

import React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Campus, Institution } from "@prisma/client";
import { SystemStatus } from "@/server/api/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/forms/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/forms/select";
import { useToast } from "@/components/ui/feedback/toast";
import { api } from "@/trpc/react";

// Form validation schema
const campusFormSchema = z.object({
  name: z.string().min(1, "Campus name is required").max(200, "Campus name must be less than 200 characters"),
  code: z.string().min(1, "Campus code is required").max(50, "Campus code must be less than 50 characters"),
  institutionId: z.string().min(1, "Institution is required"),
  address: z.object({
    street: z.string().optional(),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State/Province is required"),
    postalCode: z.string().min(1, "Postal code is required"),
    country: z.string().min(1, "Country is required"),
    zipCode: z.string().min(1, "Zip/Postal code is required"),
  }),
  contact: z.object({
    phone: z.string().min(1, "Phone number is required"),
    email: z.string().email("Invalid email address"),
    website: z.string().url("Invalid website URL").optional(),
  }),
  status: z.nativeEnum(SystemStatus).default(SystemStatus.ACTIVE),
});

type CampusFormValues = z.infer<typeof campusFormSchema>;

// Extended Campus type to match what we expect from the database
interface ExtendedCampus extends Omit<Campus, 'address' | 'contact'> {
  address: {
    street?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    zipCode: string;
  };
  contact: {
    phone: string;
    email: string;
    website?: string;
  };
}

interface CampusFormProps {
  campus?: Campus;
  institutions: {
    id: string;
    name: string;
    code: string;
  }[];
}

export function CampusForm({ campus, institutions }: CampusFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEditing = !!campus;

  // Parse JSON data if editing
  const parsedAddress = isEditing && typeof campus.address === 'object' && campus.address !== null 
    ? campus.address as unknown as { street?: string; city: string; state: string; postalCode: string; country: string; zipCode?: string; }
    : { street: "", city: "", state: "", postalCode: "", country: "", zipCode: "" };
  
  const parsedContact = isEditing && typeof campus.contact === 'object' && campus.contact !== null 
    ? campus.contact as unknown as { phone: string; email: string; website?: string; }
    : { phone: "", email: "", website: "" };

  // Set up form with default values
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CampusFormValues>({
    resolver: zodResolver(campusFormSchema),
    defaultValues: isEditing
      ? {
          name: campus.name,
          code: campus.code,
          institutionId: campus.institutionId,
          address: {
            ...parsedAddress,
            zipCode: parsedAddress.zipCode || parsedAddress.postalCode || "",
          },
          contact: parsedContact,
          status: campus.status as unknown as SystemStatus,
        }
      : {
          status: SystemStatus.ACTIVE,
          address: {
            street: "",
            city: "",
            state: "",
            postalCode: "",
            country: "",
            zipCode: "",
          },
          contact: {
            phone: "",
            email: "",
            website: "",
          },
        },
  });

  // API mutations
  const createCampus = api.campus.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Campus created",
        description: "The campus has been created successfully",
        variant: "success",
      });
      router.push("/admin/system/campuses");
      router.refresh();
    },
    onError: (error) => {
      toast({
        title: "Error creating campus",
        description: error.message || "Failed to create campus",
        variant: "error",
      });
    },
  });

  const updateCampus = api.campus.update.useMutation({
    onSuccess: () => {
      toast({
        title: "Campus updated",
        description: "The campus has been updated successfully",
        variant: "success",
      });
      router.push(`/admin/system/campuses/${campus?.id}`);
      router.refresh();
    },
    onError: (error) => {
      toast({
        title: "Error updating campus",
        description: error.message || "Failed to update campus",
        variant: "error",
      });
    },
  });

  // Form submission handler
  const onSubmit = async (data: CampusFormValues) => {
    // Prepare the data for the API
    const formattedData = {
      name: data.name,
      code: data.code,
      institutionId: data.institutionId,
      address: {
        street: data.address.street || "",
        city: data.address.city,
        state: data.address.state,
        country: data.address.country,
        zipCode: data.address.zipCode || data.address.postalCode,
      },
      contact: {
        phone: data.contact.phone,
        email: data.contact.email,
        website: data.contact.website || undefined,
      },
      status: data.status as SystemStatus,
    };

    if (isEditing && campus) {
      updateCampus.mutate({
        id: campus.id,
        data: formattedData,
      });
    } else {
      createCampus.mutate(formattedData);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            Campus Name <span className="text-destructive">*</span>
          </label>
          <Input
            id="name"
            placeholder="Enter campus name"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="code" className="text-sm font-medium">
            Campus Code <span className="text-destructive">*</span>
          </label>
          <Input
            id="code"
            placeholder="Enter campus code"
            {...register("code")}
          />
          {errors.code && (
            <p className="text-sm text-destructive">{errors.code.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="institutionId" className="text-sm font-medium">
            Institution <span className="text-destructive">*</span>
          </label>
          <Select
            defaultValue={campus?.institutionId}
            onValueChange={(value) => setValue("institutionId", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select institution" />
            </SelectTrigger>
            <SelectContent>
              {institutions.map((institution) => (
                <SelectItem key={institution.id} value={institution.id}>
                  {institution.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.institutionId && (
            <p className="text-sm text-destructive">{errors.institutionId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="status" className="text-sm font-medium">
            Status
          </label>
          <Select
            defaultValue={campus?.status || SystemStatus.ACTIVE}
            onValueChange={(value) => setValue("status", value as SystemStatus)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SystemStatus.ACTIVE}>Active</SelectItem>
              <SelectItem value={SystemStatus.INACTIVE}>Inactive</SelectItem>
              <SelectItem value={SystemStatus.ARCHIVED}>Archived</SelectItem>
            </SelectContent>
          </Select>
          {errors.status && (
            <p className="text-sm text-destructive">{errors.status.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Address Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="address.street" className="text-sm font-medium">
              Street Address
            </label>
            <Input
              id="address.street"
              placeholder="Enter street address"
              {...register("address.street")}
            />
            {errors.address?.street && (
              <p className="text-sm text-destructive">{errors.address.street.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="address.city" className="text-sm font-medium">
              City <span className="text-destructive">*</span>
            </label>
            <Input
              id="address.city"
              placeholder="Enter city"
              {...register("address.city")}
            />
            {errors.address?.city && (
              <p className="text-sm text-destructive">{errors.address.city.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="address.state" className="text-sm font-medium">
              State/Province <span className="text-destructive">*</span>
            </label>
            <Input
              id="address.state"
              placeholder="Enter state or province"
              {...register("address.state")}
            />
            {errors.address?.state && (
              <p className="text-sm text-destructive">{errors.address.state.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="address.zipCode" className="text-sm font-medium">
              Zip/Postal Code <span className="text-destructive">*</span>
            </label>
            <Input
              id="address.zipCode"
              placeholder="Enter zip/postal code"
              {...register("address.zipCode")}
            />
            {errors.address?.zipCode && (
              <p className="text-sm text-destructive">{errors.address.zipCode.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="address.country" className="text-sm font-medium">
              Country <span className="text-destructive">*</span>
            </label>
            <Input
              id="address.country"
              placeholder="Enter country"
              {...register("address.country")}
            />
            {errors.address?.country && (
              <p className="text-sm text-destructive">{errors.address.country.message}</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="contact.phone" className="text-sm font-medium">
              Phone Number <span className="text-destructive">*</span>
            </label>
            <Input
              id="contact.phone"
              placeholder="Enter phone number"
              {...register("contact.phone")}
            />
            {errors.contact?.phone && (
              <p className="text-sm text-destructive">{errors.contact.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="contact.email" className="text-sm font-medium">
              Email <span className="text-destructive">*</span>
            </label>
            <Input
              id="contact.email"
              placeholder="Enter email address"
              {...register("contact.email")}
            />
            {errors.contact?.email && (
              <p className="text-sm text-destructive">{errors.contact.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="contact.website" className="text-sm font-medium">
              Website
            </label>
            <Input
              id="contact.website"
              placeholder="Enter website URL"
              {...register("contact.website")}
            />
            {errors.contact?.website && (
              <p className="text-sm text-destructive">{errors.contact.website.message}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={createCampus.isLoading || updateCampus.isLoading}
        >
          {isEditing ? (
            updateCampus.isLoading ? "Updating..." : "Update Campus"
          ) : (
            createCampus.isLoading ? "Creating..." : "Create Campus"
          )}
        </Button>
      </div>
    </form>
  );
} 