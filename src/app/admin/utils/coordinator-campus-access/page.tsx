"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading";
import { api } from "@/trpc/react";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function CoordinatorCampusAccessPage() {
  const { toast } = useToast();
  const [campusId, setCampusId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);

  // Get all users with CAMPUS_COORDINATOR type
  const { data: allCoordinators, isLoading: isLoadingCoordinators } = api.user.list.useQuery({
    role: "CAMPUS_COORDINATOR",
  });

  // Get users with campus access
  const { data: campusCoordinators, isLoading: isLoadingCampusCoordinators, refetch: refetchCampusCoordinators } = 
    api.user.getUsersByCampus.useQuery(
      {
        campusId: campusId,
        userType: "CAMPUS_COORDINATOR",
      },
      {
        enabled: !!campusId,
      }
    );

  const handleRunDiagnostic = async () => {
    if (!campusId) {
      toast({
        title: "Error",
        description: "Please enter a campus ID",
        variant: "error",
      });
      return;
    }

    setIsLoading(true);
    try {
      await refetchCampusCoordinators();
      
      // Compare the lists
      const coordinatorsWithProfiles = allCoordinators?.items.filter(
        (user) => user.userType === "CAMPUS_COORDINATOR" && user.coordinatorProfile
      ) || [];
      
      const coordinatorsWithCampusAccess = campusCoordinators || [];
      
      const missingCampusAccess = coordinatorsWithProfiles.filter(
        (coordinator) => 
          !coordinatorsWithCampusAccess.some((campusCoord) => campusCoord.id === coordinator.id)
      );
      
      const results = {
        totalCoordinators: coordinatorsWithProfiles.length,
        coordinatorsWithCampusAccess: coordinatorsWithCampusAccess.length,
        missingCampusAccess: missingCampusAccess.length,
        coordinatorsWithCampusAccessList: coordinatorsWithCampusAccess,
        missingCampusAccessList: missingCampusAccess,
      };
      
      setDiagnosticResults(results);
      
      toast({
        title: "Diagnostic Complete",
        description: `Found ${missingCampusAccess.length} coordinators missing campus access`,
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to run diagnostic",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignCampusAccess = async (userId: string) => {
    if (!campusId) return;
    
    try {
      await api.user.assignToCampus.mutate({
        userId,
        campusId,
        roleType: "CAMPUS_COORDINATOR",
      });
      
      toast({
        title: "Success",
        description: "Assigned campus access to coordinator",
        variant: "success",
      });
      
      // Refresh the data
      await refetchCampusCoordinators();
      handleRunDiagnostic();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign campus access",
        variant: "error",
      });
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coordinator Campus Access</h1>
          <p className="text-muted-foreground">Check and fix campus access for coordinators</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Check Campus Access</CardTitle>
          <CardDescription>
            Enter a campus ID to check which coordinators have access to it
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3">
                <Label htmlFor="campusId">Campus ID</Label>
                <Input
                  id="campusId"
                  value={campusId}
                  onChange={(e) => setCampusId(e.target.value)}
                  placeholder="Enter campus ID"
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleRunDiagnostic} 
                  disabled={isLoading || !campusId}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner className="mr-2 h-4 w-4" />
                      Running...
                    </>
                  ) : (
                    "Run Diagnostic"
                  )}
                </Button>
              </div>
            </div>

            {diagnosticResults && (
              <div className="mt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Total Coordinators</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{diagnosticResults.totalCoordinators}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">With Campus Access</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-green-600">{diagnosticResults.coordinatorsWithCampusAccess}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Missing Access</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-red-600">{diagnosticResults.missingCampusAccess}</p>
                    </CardContent>
                  </Card>
                </div>

                {diagnosticResults.missingCampusAccessList.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Coordinators Missing Campus Access</CardTitle>
                      <CardDescription>
                        These coordinators have profiles but don't have access to this campus
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="border rounded-md overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Name
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Email
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {diagnosticResults.missingCampusAccessList.map((coordinator: any) => (
                              <tr key={coordinator.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {coordinator.name || 'Unknown'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {coordinator.email || 'No email'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  <Badge variant={coordinator.status === "ACTIVE" ? "success" : "destructive"}>
                                    {coordinator.status}
                                  </Badge>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleAssignCampusAccess(coordinator.id)}
                                  >
                                    Assign Access
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {diagnosticResults.coordinatorsWithCampusAccessList.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Coordinators With Campus Access</CardTitle>
                      <CardDescription>
                        These coordinators already have access to this campus
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="border rounded-md overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Name
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Email
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Has Profile
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {diagnosticResults.coordinatorsWithCampusAccessList.map((coordinator: any) => (
                              <tr key={coordinator.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {coordinator.name || 'Unknown'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {coordinator.email || 'No email'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  <Badge variant={coordinator.status === "ACTIVE" ? "success" : "destructive"}>
                                    {coordinator.status}
                                  </Badge>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  <Badge variant={coordinator.coordinatorProfile ? "success" : "destructive"}>
                                    {coordinator.coordinatorProfile ? "Yes" : "No"}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
