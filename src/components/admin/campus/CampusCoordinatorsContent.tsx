'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/trpc/react';
import { useToast } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/empty-state';
import { CoordinatorAssignmentManager } from './CoordinatorAssignmentManager';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Users,
  BookOpen,
  School,
  Building,
  GraduationCap
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface CampusCoordinatorsContentProps {
  campus: {
    id: string;
    name: string;
    code: string;
  };
}

export function CampusCoordinatorsContent({ campus }: CampusCoordinatorsContentProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCoordinatorId, setSelectedCoordinatorId] = useState<string | null>(null);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);

  // Fetch coordinators for this campus
  const { data: campusCoordinators, isLoading: isLoadingCampusCoordinators, refetch: refetchCampusCoordinators } =
    api.user.getUsersByCampus.useQuery({
      campusId: campus.id,
      userType: 'CAMPUS_COORDINATOR',
      search: searchQuery,
    }, {
      enabled: !!campus.id
    });

  // Also fetch regular coordinators for this campus
  const { data: regularCoordinators, isLoading: isLoadingRegularCoordinators, refetch: refetchRegularCoordinators } =
    api.user.getUsersByCampus.useQuery({
      campusId: campus.id,
      userType: 'COORDINATOR',
      search: searchQuery,
    }, {
      enabled: !!campus.id
    });

  // Combine both types of coordinators
  const coordinators = [
    ...(campusCoordinators || []),
    ...(regularCoordinators || [])
  ];

  const isLoadingCoordinators = isLoadingCampusCoordinators || isLoadingRegularCoordinators;

  const refetchCoordinators = async () => {
    await refetchCampusCoordinators();
    await refetchRegularCoordinators();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // The search is handled by the query with the searchQuery state
  };

  const handleOpenAssignmentDialog = (coordinatorId: string) => {
    setSelectedCoordinatorId(coordinatorId);
    setIsAssignmentDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coordinator Management</h1>
          <p className="text-muted-foreground">Manage coordinators at {campus.name}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href={`/admin/campus/coordinators/new?campusId=${campus.id}`}>
              <Plus className="mr-2 h-4 w-4" /> Add Coordinator
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coordinators</CardTitle>
          <CardDescription>View and manage coordinators for your campus</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search coordinators..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" type="submit">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </form>

          {isLoadingCoordinators ? (
            <div className="flex justify-center p-8">
              <LoadingSpinner />
            </div>
          ) : !coordinators || coordinators.length === 0 ? (
            <EmptyState
              title="No Coordinators Found"
              description={
                searchQuery
                  ? "No coordinators match your search criteria"
                  : "No coordinators have been assigned to this campus yet"
              }
              icon={<Users className="h-10 w-10" />}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {coordinators.map((coordinator) => (
                <Card key={coordinator.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={(coordinator as any).image || undefined} alt={coordinator.name || 'Coordinator'} />
                          <AvatarFallback>
                            {coordinator.name?.substring(0, 2).toUpperCase() || 'CO'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{coordinator.name}</CardTitle>
                          <CardDescription>{coordinator.email}</CardDescription>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleOpenAssignmentDialog(coordinator.id)}>
                            <BookOpen className="h-4 w-4 mr-2" />
                            Manage Assignments
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/campus/coordinators/${coordinator.id}`}>
                              <Users className="h-4 w-4 mr-2" />
                              View Profile
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/campus/coordinators/${coordinator.id}/edit`}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                              </svg>
                              Edit Profile
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm">
                        <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>
                          {coordinator.coordinatorProfile?.department || 'No department assigned'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {coordinator.coordinatorProfile?.managedPrograms &&
                          (coordinator.coordinatorProfile.managedPrograms as any[]).length > 0 ? (
                          (coordinator.coordinatorProfile.managedPrograms as any[])
                            .filter(p => p.campusId === campus.id)
                            .map((program, index) => (
                              <Badge key={index} variant="outline" className="flex items-center">
                                <GraduationCap className="h-3 w-3 mr-1" />
                                {program.programName}
                              </Badge>
                            ))
                        ) : (
                          <span className="text-sm text-muted-foreground">No programs assigned</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assignment Dialog */}
      <Dialog open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
        <DialogContent className="max-w-4xl w-[95vw] h-[90vh] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Coordinator Assignments</DialogTitle>
            <DialogDescription>
              Assign programs, courses and classes to this coordinator
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 pb-10">
            {selectedCoordinatorId && (
              <CoordinatorAssignmentManager
                coordinatorId={selectedCoordinatorId}
                campusId={campus.id}
                onAssignmentComplete={() => {
                  setIsAssignmentDialogOpen(false);
                  void refetchCoordinators();
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
