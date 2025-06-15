'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Separator } from '@/components/ui/separator';
// import { api } from '@/trpc/react'; // Will be used when API is implemented
import { ArrowLeft } from '@/components/ui/icons/custom-icons';
import { FeeStructureForm, FeeStructureFormValues } from '@/components/shared/entities/fee';
import { useToast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/components/ui/loading';

export default function NewFeeStructurePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // These API calls are mocked for now
  // Will be implemented when the API endpoints are available
  const programCampusesLoading = false;
  const academicCyclesLoading = false;
  const termsLoading = false;

  // Mock program campuses
  const mockProgramCampuses = [
    { id: 'pc-1', name: 'Main Campus - Primary Years Program' },
    { id: 'pc-2', name: 'Main Campus - Middle School Program' },
    { id: 'pc-3', name: 'Branch Campus - Primary Years Program' }
  ];

  // Mock academic cycles
  const mockAcademicCycles = [
    { id: 'ac-1', name: '2023-2024' },
    { id: 'ac-2', name: '2024-2025' },
    { id: 'ac-3', name: '2025-2026' }
  ];

  // Mock terms
  const mockTerms = [
    { id: 'term-1', name: 'Term 1' },
    { id: 'term-2', name: 'Term 2' },
    { id: 'term-3', name: 'Term 3' }
  ];

  // This mutation will be implemented when the API is available
  // const createFeeStructureMutation = api.feeStructure.create.useMutation({
  //   onSuccess: (data) => {
  //     toast({
  //       title: 'Fee structure created',
  //       description: 'The fee structure has been created successfully.',
  //     });
  //     router.push(`/admin/system/fee-management/structures/${data.id}`);
  //   },
  //   onError: (error) => {
  //     setIsSubmitting(false);
  //     toast({
  //       title: 'Error creating fee structure',
  //       description: error.message,
  //       variant: 'error',
  //     });
  //   },
  // });

  // Handle form submission
  const handleSubmit = (_values: FeeStructureFormValues) => {
    setIsSubmitting(true);

    // Mock creation for now
    setTimeout(() => {
      toast({
        title: 'Fee structure created',
        description: 'The fee structure has been created successfully.',
      });
      router.push('/admin/system/fee-management/structures');
    }, 1000);

    // Uncomment when API is implemented
    // createFeeStructureMutation.mutate(values);
  };

  // Loading state
  const isLoading = programCampusesLoading || academicCyclesLoading || termsLoading;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">New Fee Structure</h1>
          <p className="text-muted-foreground">
            Create a new fee structure for a program campus
          </p>
        </div>
      </div>

      <Separator />

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Fee Structure Form</CardTitle>
            <CardDescription>Fill in the fee structure details below</CardDescription>
          </CardHeader>
          <CardContent>
            <FeeStructureForm
              programCampuses={mockProgramCampuses}
              academicCycles={mockAcademicCycles}
              terms={mockTerms}
              onSubmit={handleSubmit}
              isLoading={isSubmitting}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
