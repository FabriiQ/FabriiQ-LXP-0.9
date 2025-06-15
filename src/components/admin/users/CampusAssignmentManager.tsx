'use client';

import { useState } from 'react';
import { api } from '@/trpc/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui';
import { Loader2, Plus, Star, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// Define the type for campus assignments
interface CampusAssignment {
  id: string;
  campusId: string;
  campus: {
    id: string;
    name: string;
    code: string;
  };
  roleType: string;
  status: string;
};

interface CampusAssignmentManagerProps {
  userId: string;
  primaryCampusId: string | null;
  onPrimaryCampusChange?: (campusId: string) => void;
}

export function CampusAssignmentManager({
  userId,
  primaryCampusId,
  onPrimaryCampusChange
}: CampusAssignmentManagerProps) {
  const [selectedCampusId, setSelectedCampusId] = useState<string>('');
  const [selectedRoleType, setSelectedRoleType] = useState<string>('CAMPUS_TEACHER');
  const [isAddingCampus, setIsAddingCampus] = useState(false);

  // Fetch user's campus assignments
  const {
    data: userWithCampuses,
    isLoading: isLoadingUser,
    refetch: refetchUser
  } = api.user.getById.useQuery(userId, {
    enabled: !!userId,
    refetchOnWindowFocus: false,
  });

  // Fetch available campuses for assignment
  const { data: campusesData } = api.campus.getAllCampuses.useQuery(undefined, {
    enabled: true,
    refetchOnWindowFocus: false,
  });

  // Mutations
  const assignToCampus = api.user.assignToCampus.useMutation({
    onSuccess: () => {
      toast({
        description: 'User assigned to campus successfully',
        variant: 'success'
      });
      setIsAddingCampus(false);
      setSelectedCampusId('');
      void refetchUser();
    },
    onError: (error) => {
      toast({
        description: error.message || 'Failed to assign user to campus',
        variant: 'error'
      });
      setIsAddingCampus(false);
    },
  });

  const removeCampusAccess = api.user.removeCampusAccess.useMutation({
    onSuccess: () => {
      toast({
        description: 'Campus access removed successfully',
        variant: 'success'
      });
      void refetchUser();
    },
    onError: (error) => {
      toast({
        description: error.message || 'Failed to remove campus access',
        variant: 'error'
      });
    },
  });

  const updateUser = api.user.update.useMutation({
    onSuccess: () => {
      toast({
        description: 'Primary campus updated successfully',
        variant: 'success'
      });
      void refetchUser();
      if (onPrimaryCampusChange) {
        onPrimaryCampusChange(selectedCampusId);
      }
    },
    onError: (error) => {
      toast({
        description: error.message || 'Failed to update primary campus',
        variant: 'error'
      });
    },
  });

  // Get available campuses (excluding already assigned ones)
  const getAvailableCampuses = () => {
    if (!campusesData || !userWithCampuses?.activeCampuses) return [];

    const assignedCampusIds = userWithCampuses.activeCampuses
      .filter(access => access.status === 'ACTIVE')
      .map(access => access.campusId);

    return campusesData.filter(campus => !assignedCampusIds.includes(campus.id));
  };

  // Handle assigning user to campus
  const handleAssignToCampus = () => {
    if (!selectedCampusId) {
      toast({
        description: 'Please select a campus',
        variant: 'error'
      });
      return;
    }

    setIsAddingCampus(true);
    assignToCampus.mutate({
      userId,
      campusId: selectedCampusId,
      roleType: selectedRoleType as any,
    });
  };

  // Handle removing campus access
  const handleRemoveCampusAccess = (accessId: string) => {
    removeCampusAccess.mutate({ accessId });
  };

  // Handle setting primary campus
  const handleSetPrimaryCampus = (campusId: string) => {
    updateUser.mutate({
      id: userId,
      data: {
        primaryCampusId: campusId,
      },
    });
  };

  // Get role type display name
  const getRoleTypeDisplay = (roleType: string) => {
    const roleMap: Record<string, string> = {
      'CAMPUS_ADMIN': 'Admin',
      'CAMPUS_TEACHER': 'Teacher',
      'CAMPUS_STUDENT': 'Student',
      'CAMPUS_COORDINATOR': 'Coordinator',
      'SYSTEM_ADMIN': 'System Admin',
    };
    return roleMap[roleType] || roleType;
  };

  if (isLoadingUser) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeCampuses = userWithCampuses?.activeCampuses?.filter(
    access => access.status === 'ACTIVE' && access.campus
  ) || [];

  const availableCampuses = getAvailableCampuses();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Campus Assignments</CardTitle>
          <CardDescription>
            Manage which campuses this user has access to
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeCampuses.length === 0 ? (
            <div className="text-center p-4 border rounded-md bg-muted/20">
              <p>No campus assignments found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeCampuses.map((access) => (
                <div key={access.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="font-medium">{access.campus?.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{getRoleTypeDisplay(access.roleType)}</Badge>
                        {primaryCampusId === access.campusId && (
                          <Badge variant="default" className="bg-primary">Primary</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {primaryCampusId !== access.campusId && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetPrimaryCampus(access.campusId)}
                        title="Set as primary campus"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive border-destructive hover:bg-destructive/10"
                          title="Remove campus access"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Campus Access</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove access to {access.campus?.name}? This will revoke all permissions for this campus.
                            {primaryCampusId === access.campusId && (
                              <p className="mt-2 text-destructive font-semibold">
                                Warning: This is the user's primary campus. Removing it will affect their primary access.
                              </p>
                            )}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemoveCampusAccess(access.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <div className="flex items-center gap-2 w-full">
            <Select
              value={selectedCampusId}
              onValueChange={setSelectedCampusId}
              disabled={isAddingCampus || availableCampuses.length === 0}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select campus" />
              </SelectTrigger>
              <SelectContent>
                {availableCampuses.length === 0 ? (
                  <SelectItem value="none" disabled>No available campuses</SelectItem>
                ) : (
                  availableCampuses.map((campus) => (
                    <SelectItem key={campus.id} value={campus.id}>
                      {campus.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            <Select
              value={selectedRoleType}
              onValueChange={setSelectedRoleType}
              disabled={isAddingCampus}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CAMPUS_ADMIN">Admin</SelectItem>
                <SelectItem value="CAMPUS_TEACHER">Teacher</SelectItem>
                <SelectItem value="CAMPUS_STUDENT">Student</SelectItem>
                <SelectItem value="CAMPUS_COORDINATOR">Coordinator</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={handleAssignToCampus}
              disabled={isAddingCampus || !selectedCampusId || availableCampuses.length === 0}
              className="ml-auto"
            >
              {isAddingCampus ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Campus
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
