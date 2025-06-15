import { getSessionCache } from "@/utils/session-cache";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { UserType } from "@prisma/client";
import { logger } from "@/server/api/utils/logger";
import { SettingsForm } from "@/components/teacher/settings/SettingsForm";
import { NotificationSettings } from "@/components/teacher/settings/NotificationSettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your account settings and preferences",
};

export default async function TeacherSettingsPage() {
  try {
    const session = await getSessionCache();

    if (!session?.user?.id) {
      return redirect("/login");
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        userType: true,
        teacherProfile: {
          select: {
            id: true,
            bio: true,
            language: true,
            timezone: true,
            showEmail: true,
            showBio: true,
          }
        }
      }
    });

    if (!user) {
      logger.error("User not found", { userId: session.user.id });
      return redirect("/login");
    }

    if (user.userType !== UserType.CAMPUS_TEACHER && user.userType !== 'TEACHER') {
      logger.error("Unauthorized user type", { userType: user.userType });
      return redirect("/unauthorized");
    }

    if (!user.teacherProfile) {
      logger.error("Teacher profile not found", { userId: user.id });
      return redirect("/unauthorized");
    }

    // Prepare initial form data
    const initialData = {
      displayName: user.name || '',
      email: user.email || '',
      bio: user.teacherProfile.bio || '',
      language: user.teacherProfile.language || 'en',
      timezone: user.teacherProfile.timezone || 'UTC',
      showEmail: user.teacherProfile.showEmail || false,
      showBio: user.teacherProfile.showBio || true,
    };

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>
        
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-6">
            <SettingsForm 
              teacherId={user.teacherProfile.id} 
              initialData={initialData} 
            />
          </TabsContent>
          
          <TabsContent value="notifications" className="space-y-6">
            <NotificationSettings teacherId={user.teacherProfile.id} />
          </TabsContent>
          
          <TabsContent value="appearance" className="space-y-6">
            <div className="flex items-center justify-center p-12 text-muted-foreground">
              Appearance settings will be implemented in a future update.
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  } catch (error) {
    logger.error("Error in TeacherSettingsPage", { error });
    return redirect("/error");
  }
}
