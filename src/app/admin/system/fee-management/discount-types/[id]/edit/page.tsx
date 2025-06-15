'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Separator } from '@/components/ui/separator';
import { api } from '@/trpc/react';
import { ArrowLeft } from 'lucide-react';
import { DiscountTypeForm, DiscountTypeFormValues } from '@/components/shared/entities/fee';
import { useToast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function EditDiscountTypePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch discount type data
  const { data: discountType, isLoading: discountTypeLoading } = api.discountType.getById.useQuery(
    { id },
    { enabled: false } // Disable until API is implemented
  );

  // Mock data for development
  const mockDiscountType = {
    id,
    name: 'Sibling Discount',
    description: 'Discount for siblings enrolled in the institution',
    discountValue: 10,
    isPercentage: true,
    maxAmount: 1000,
    applicableFor: ['SIBLING'],
    status: 'ACTIVE'
  };

  // Update discount type mutation
  const updateDiscountTypeMutation = api.discountType.update.useMutation({
    onSuccess: () => {
      toast({
        title: 'Discount type updated',
        description: 'The discount type has been updated successfully.',
      });
      router.push(`/admin/system/fee-management/discount-types/${id}`);
    },
    onError: (error) => {
      setIsSubmitting(false);
      toast({
        title: 'Error updating discount type',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handle form submission
  const handleSubmit = (values: DiscountTypeFormValues) => {
    setIsSubmitting(true);
    
    // Mock update for now
    setTimeout(() => {
      toast({
        title: 'Discount type updated',
        description: 'The discount type has been updated successfully.',
      });
      router.push(`/admin/system/fee-management/discount-types/${id}`);
    }, 1000);
    
    // Uncomment when API is implemented
    // updateDiscountTypeMutation.mutate({
    //   id,
    //   ...values,
    // });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Discount Type</h1>
          <p className="text-muted-foreground">
            Update the discount type details
          </p>
        </div>
      </div>

      <Separator />

      {discountTypeLoading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Discount Type Form</CardTitle>
            <CardDescription>Edit the discount type details below</CardDescription>
          </CardHeader>
          <CardContent>
            <DiscountTypeForm
              initialData={{
                name: mockDiscountType.name,
                description: mockDiscountType.description,
                discountValue: mockDiscountType.discountValue,
                isPercentage: mockDiscountType.isPercentage,
                maxAmount: mockDiscountType.maxAmount,
                applicableFor: mockDiscountType.applicableFor,
                status: mockDiscountType.status,
              }}
              onSubmit={handleSubmit}
              isLoading={isSubmitting}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
