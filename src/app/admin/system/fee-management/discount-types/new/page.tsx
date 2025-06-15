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

export default function NewDiscountTypePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create discount type mutation
  const createDiscountTypeMutation = api.discountType.create.useMutation({
    onSuccess: (data) => {
      toast({
        title: 'Discount type created',
        description: 'The discount type has been created successfully.',
      });
      router.push(`/admin/system/fee-management/discount-types/${data.id}`);
    },
    onError: (error) => {
      setIsSubmitting(false);
      toast({
        title: 'Error creating discount type',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handle form submission
  const handleSubmit = (values: DiscountTypeFormValues) => {
    setIsSubmitting(true);
    
    // Mock creation for now
    setTimeout(() => {
      toast({
        title: 'Discount type created',
        description: 'The discount type has been created successfully.',
      });
      router.push('/admin/system/fee-management/discount-types');
    }, 1000);
    
    // Uncomment when API is implemented
    // createDiscountTypeMutation.mutate(values);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">New Discount Type</h1>
          <p className="text-muted-foreground">
            Create a new discount type for fee structures
          </p>
        </div>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Discount Type Form</CardTitle>
          <CardDescription>Fill in the discount type details below</CardDescription>
        </CardHeader>
        <CardContent>
          <DiscountTypeForm
            onSubmit={handleSubmit}
            isLoading={isSubmitting}
          />
        </CardContent>
      </Card>
    </div>
  );
}
