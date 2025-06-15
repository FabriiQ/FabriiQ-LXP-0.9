'use client';

import { Button } from "@/components/ui/core/button";
import { Card } from "@/components/ui/data-display/card";
import { Badge } from "@/components/ui/atoms/badge";
import { api } from "@/trpc/react";
import { Edit } from "lucide-react";
import Link from "next/link";

type UserProfileViewProps = {
  userData: any;
};

// Map user types to display names
const userTypeDisplayNames: Record<string, string> = {
  SYSTEM_ADMIN: 'System Administrator',
  SYSTEM_MANAGER: 'System Manager',
  CAMPUS_ADMIN: 'Campus Administrator',
  CAMPUS_COORDINATOR: 'Campus Coordinator',
  CAMPUS_TEACHER: 'Teacher',
  CAMPUS_STUDENT: 'Student',
  CAMPUS_PARENT: 'Parent',
};

// Map status to display names and badge variants
const statusDisplayConfig: Record<string, { label: string, variant: string }> = {
  ACTIVE: { label: 'Active', variant: 'success' },
  INACTIVE: { label: 'Inactive', variant: 'warning' },
  PENDING: { label: 'Pending', variant: 'secondary' },
  DELETED: { label: 'Deleted', variant: 'destructive' },
};

export function UserProfileView({ userData }: UserProfileViewProps) {
  // Fetch campuses for the user
  const { data: campuses } = api.campus.getAllCampuses.useQuery(undefined, {
    enabled: true,
    refetchOnWindowFocus: false,
  });

  // Find primary campus name
  const primaryCampus = userData.primaryCampusId && campuses 
    ? campuses.find(campus => campus.id === userData.primaryCampusId) 
    : null;

  // Get user's active campuses
  const activeCampusNames = userData.activeCampuses?.length > 0 && campuses
    ? userData.activeCampuses
        .map((access: any) => {
          const campus = campuses.find(c => c.id === access.campusId);
          return campus?.name || 'Unknown Campus';
        })
        .join(', ')
    : 'None';

  return (
    <Card className="p-6">
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-xl font-semibold">User Information</h3>
        <Link href={`/admin/system/users/${userData.id}/edit`}>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit User
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Full Name</h4>
            <p className="text-base">{userData.name || 'Not specified'}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Username</h4>
            <p className="text-base">{userData.username || 'Not specified'}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Email</h4>
            <p className="text-base">{userData.email || 'Not specified'}</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">User Type</h4>
            <p className="text-base">{userTypeDisplayNames[userData.userType] || userData.userType}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Status</h4>
            <Badge variant={statusDisplayConfig[userData.status]?.variant || 'default'}>
              {statusDisplayConfig[userData.status]?.label || userData.status}
            </Badge>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Primary Campus</h4>
            <p className="text-base">{primaryCampus?.name || 'Not assigned'}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Active Campuses</h4>
            <p className="text-base">{activeCampusNames}</p>
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <h4 className="text-sm font-medium text-muted-foreground mb-1">Last Login</h4>
        <p className="text-base">
          {userData.lastLoginAt 
            ? new Date(userData.lastLoginAt).toLocaleString() 
            : 'Never logged in'}
        </p>
      </div>
    </Card>
  );
}
