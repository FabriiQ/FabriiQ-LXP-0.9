'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/atoms/button';
import { api } from '@/trpc/react';
import { useToast } from '@/components/ui/feedback/toast';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/atoms/badge';

interface TeacherStatusToggleProps {
  teacherId: string;
  initialStatus: 'ACTIVE' | 'INACTIVE';
  onStatusChange?: (newStatus: 'ACTIVE' | 'INACTIVE') => void;
}

export function TeacherStatusToggle({ 
  teacherId, 
  initialStatus,
  onStatusChange
}: TeacherStatusToggleProps) {
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>(initialStatus);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const updateStatus = api.teacher.updateTeacherStatus.useMutation({
    onSuccess: (data) => {
      setStatus(data.status as 'ACTIVE' | 'INACTIVE');
      toast({
        title: 'Status Updated',
        description: `Teacher is now ${data.status === 'ACTIVE' ? 'active' : 'inactive'}`,
        variant: 'success',
      });
      if (onStatusChange) {
        onStatusChange(data.status as 'ACTIVE' | 'INACTIVE');
      }
      setIsUpdating(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update teacher status',
        variant: 'error',
      });
      setIsUpdating(false);
    },
  });

  const handleToggleStatus = () => {
    setIsUpdating(true);
    const newStatus = status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    updateStatus.mutate({
      teacherId,
      status: newStatus,
    });
  };

  return (
    <div className="flex items-center space-x-2">
      <Badge 
        variant={status === 'ACTIVE' ? 'success' : 'destructive'}
        className="px-2 py-1"
      >
        {status === 'ACTIVE' ? (
          <CheckCircle className="h-3.5 w-3.5 mr-1" />
        ) : (
          <XCircle className="h-3.5 w-3.5 mr-1" />
        )}
        {status === 'ACTIVE' ? 'Active' : 'Inactive'}
      </Badge>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleToggleStatus}
        disabled={isUpdating}
      >
        {isUpdating ? (
          <>
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            Updating...
          </>
        ) : (
          status === 'ACTIVE' ? 'Deactivate' : 'Activate'
        )}
      </Button>
    </div>
  );
}
