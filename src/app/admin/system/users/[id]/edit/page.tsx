'use client';

import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/atoms/page-header';
import { EditUserForm } from '@/components/admin/users/EditUserForm';
import { api } from '@/trpc/react';
import { LoadingSpinner } from '@/components/ui/loading';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon } from 'lucide-react';



export default function EditUserPage() {
  const params = useParams() || {};
  const userId = params.id as string;
  const router = useRouter();

  // Fetch user data
  const { data: userData, isLoading } = api.user.getById.useQuery(userId, {
    enabled: !!userId,
    refetchOnWindowFocus: false,
  });

  // Update user mutation
  const updateUser = api.user.update.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'User updated successfully',
      });
      router.push('/admin/system/users');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user',
      });
    },
  });

  const handleSubmit = async (data: any) => {
    updateUser.mutate({
      id: userId,
      data
    });
    return Promise.resolve();
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!userData) {
    return (
      <div className="container mx-auto py-6">
        <PageHeader
          title="Edit User"
          description="User not found"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/admin/system/users">
          <Button variant="outline" size="icon">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader
          title="Edit User"
          description={`Edit user information for ${userData.name || 'User'}`}
        />
      </div>

      <Card className="p-6">
        <EditUserForm
          initialData={userData}
          onSubmit={handleSubmit}
          isLoading={updateUser.isLoading}
        />
      </Card>
    </div>
  );
}