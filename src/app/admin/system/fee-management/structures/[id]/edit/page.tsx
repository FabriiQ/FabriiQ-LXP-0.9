'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Separator } from '@/components/ui/separator';
// import { api } from '@/trpc/react'; // Will be used when API is implemented
import { ArrowLeft } from '@/components/ui/icons/custom-icons';
import { FeeStructureForm, FeeStructureFormValues, FeeComponent } from '@/components/shared/entities/fee';
import { useToast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/components/ui/loading';

export default function EditFeeStructurePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // This API call will be implemented when the API is available
  // const { data: feeStructure, isLoading: feeStructureLoading } = api.feeStructure.getById.useQuery(
  //   { id },
  //   { enabled: false } // Disable until API is implemented
  // );
  const feeStructureLoading = false;

  // These API calls are mocked for now
  // Will be implemented when the API endpoints are available
  const programCampusesLoading = false;
  const academicCyclesLoading = false;
  const termsLoading = false;

  // Mock data for development
  const mockFeeStructure = {
    id,
    name: 'Primary Program Annual Fee 2024-2025',
    description: 'Annual fee structure for Primary Years Program',
    programCampusId: 'pc-1',
    academicCycleId: 'ac-1',
    termId: 'term-1',
    components: [
      {
        id: 'comp-1',
        name: 'Tuition Fee',
        type: 'TUITION',
        amount: 5000,
        description: 'Basic tuition fee'
      },
      {
        id: 'comp-2',
        name: 'Library Fee',
        type: 'LIBRARY',
        amount: 500,
        description: 'Access to library resources'
      },
      {
        id: 'comp-3',
        name: 'Laboratory Fee',
        type: 'LABORATORY',
        amount: 1000,
        description: 'Access to laboratory facilities'
      },
      {
        id: 'comp-4',
        name: 'Sports Fee',
        type: 'SPORTS',
        amount: 200,
        description: 'Access to sports facilities'
      },
      {
        id: 'comp-5',
        name: 'Examination Fee',
        type: 'EXAMINATION',
        amount: 300,
        description: 'Examination and assessment costs'
      }
    ],
    isRecurring: false,
    recurringInterval: null,
    status: 'ACTIVE'
  };

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
  // const updateFeeStructureMutation = api.feeStructure.update.useMutation({
  //   onSuccess: () => {
  //     toast({
  //       title: 'Fee structure updated',
  //       description: 'The fee structure has been updated successfully.',
  //     });
  //     router.push(`/admin/system/fee-management/structures/${id}`);
  //   },
  //   onError: (error) => {
  //     setIsSubmitting(false);
  //     toast({
  //       title: 'Error updating fee structure',
  //       description: error.message,
  //       variant: 'error',
  //     });
  //   },
  // });

  // Handle form submission
  const handleSubmit = (_values: FeeStructureFormValues) => {
    setIsSubmitting(true);

    // Mock update for now
    setTimeout(() => {
      toast({
        title: 'Fee structure updated',
        description: 'The fee structure has been updated successfully.',
      });
      router.push(`/admin/system/fee-management/structures/${id}`);
    }, 1000);

    // Uncomment when API is implemented
    // updateFeeStructureMutation.mutate({
    //   id,
    //   ...values,
    // });
  };

  // Loading state
  const isLoading = feeStructureLoading || programCampusesLoading || academicCyclesLoading || termsLoading;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Fee Structure</h1>
          <p className="text-muted-foreground">
            Update the fee structure details and components
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
            <CardDescription>Edit the fee structure details below</CardDescription>
          </CardHeader>
          <CardContent>
            <FeeStructureForm
              programCampuses={mockProgramCampuses}
              academicCycles={mockAcademicCycles}
              terms={mockTerms}
              initialData={{
                name: mockFeeStructure.name,
                description: mockFeeStructure.description,
                programCampusId: mockFeeStructure.programCampusId,
                academicCycleId: mockFeeStructure.academicCycleId,
                termId: mockFeeStructure.termId,
                components: mockFeeStructure.components as FeeComponent[],
                isRecurring: mockFeeStructure.isRecurring,
                recurringInterval: mockFeeStructure.recurringInterval || undefined,
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
