import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/navigation/tabs";
import { RoleAssignment } from "./RoleAssignment";
import { ActivityLog } from "./ActivityLog";
import { UserProfileView } from "./UserProfileView";
import { api } from "@/trpc/react";
import { LoadingSpinner } from "@/components/ui/loading";

type UserProfileProps = {
  userId: string;
};

export const UserProfile = ({ userId }: UserProfileProps) => {
  const [activeTab, setActiveTab] = useState("details");

  // Fetch user data
  const { data: userData, isLoading } = api.user.getById.useQuery(userId, {
    enabled: !!userId,
    refetchOnWindowFocus: false,
  });

  // No need for update mutation in view-only mode

  if (isLoading) return <LoadingSpinner />;
  if (!userData) return <div>User not found</div>;

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">Basic Information</TabsTrigger>
          <TabsTrigger value="roles">Role Assignment</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <UserProfileView userData={userData} />
        </TabsContent>

        <TabsContent value="roles">
          <RoleAssignment userId={userId} />
        </TabsContent>

        <TabsContent value="activity">
          <ActivityLog userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};