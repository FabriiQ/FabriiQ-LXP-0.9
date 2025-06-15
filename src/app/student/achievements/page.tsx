import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { LazyAchievementGrid } from "@/components/rewards/LazyAchievementGrid";
import { PointsDisplay } from "@/components/rewards/PointsDisplay";
import { LevelProgress } from "@/components/rewards/LevelProgress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { unstable_cache } from "next/cache";
import { AchievementIcons } from "@/components/ui/icons/achievement-icons";

// Define types for our achievements
interface Achievement {
  id: string;
  title: string;
  description: string;
  type: string;
  progress: number;
  total: number;
  unlocked: boolean;
  unlockedAt?: Date;
  icon?: string;
}

// Cache the student achievements fetch
const getCachedStudentAchievements = unstable_cache(
  async (userId: string): Promise<Achievement[]> => {
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId },
      select: {
        achievements: true,
      },
    });

    if (!studentProfile) {
      return [];
    }

    // Convert the JSON achievements to our Achievement interface
    return (studentProfile.achievements as any[]).map((achievement: any) => ({
      id: achievement.id || `achievement-${Math.random().toString(36).substring(2, 9)}`,
      title: achievement.title || "Achievement",
      description: achievement.description || "",
      type: achievement.type || "general",
      progress: achievement.progress || 0,
      total: achievement.total || 1,
      unlocked: achievement.unlocked || false,
      unlockedAt: achievement.unlockedAt ? new Date(achievement.unlockedAt) : undefined,
      icon: achievement.icon,
    }));
  },
  ['student-achievements'],
  { revalidate: 60 } // Revalidate every 60 seconds
);

// Cache the student level fetch
const getCachedStudentLevel = unstable_cache(
  async (userId: string) => {
    // In the current schema, we don't have student levels, so we'll return a default
    return {
      level: 1,
      currentExp: 0,
      nextLevelExp: 100,
    };
  },
  ['student-level'],
  { revalidate: 60 } // Revalidate every 60 seconds
);

// Cache the student points fetch
const getCachedStudentPoints = unstable_cache(
  async (studentId: string) => {
    // In the current schema, we don't have student points, so we'll return defaults
    return {
      totalPoints: 0,
      dailyPoints: 0,
      weeklyPoints: 0,
      monthlyPoints: 0,
    };
  },
  ['student-points'],
  { revalidate: 60 } // Revalidate every 60 seconds
);

export default async function StudentAchievementsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // Get student profile
  const studentProfile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!studentProfile) {
    redirect("/auth/signin");
  }

  // Get student achievements, level, and points
  const achievements = await getCachedStudentAchievements(session.user.id);
  const levelInfo = await getCachedStudentLevel("");
  const pointsInfo = await getCachedStudentPoints("");

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6">
      <h1 className="text-2xl font-bold mb-6">My Achievements</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <PointsDisplay summary={pointsInfo} />
        <LevelProgress
          level={levelInfo.level}
          currentExp={levelInfo.currentExp}
          nextLevelExp={levelInfo.nextLevelExp}
        />
        <div className="bg-white rounded-lg shadow p-4 border">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            {AchievementIcons.default}
            Achievement Stats
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              title="Total"
              value={achievements?.length || 0}
              icon={AchievementIcons.default}
            />
            <StatCard
              title="Unlocked"
              value={achievements?.filter(a => a.unlocked).length || 0}
              icon={AchievementIcons.milestone}
            />
            <StatCard
              title="In Progress"
              value={achievements?.filter(a => !a.unlocked).length || 0}
              icon={AchievementIcons.target || AchievementIcons.default}
            />
            <StatCard
              title="Completion"
              value={`${achievements?.length ? Math.round((achievements.filter(a => a.unlocked).length / achievements.length) * 100) : 0}%`}
              icon={AchievementIcons.special}
            />
          </div>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Achievements</TabsTrigger>
          <TabsTrigger value="unlocked">Unlocked</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Suspense fallback={<div className="py-8 text-center">Loading achievements...</div>}>
            {achievements.length === 0 ? (
              <EmptyState />
            ) : (
              <LazyAchievementGrid
                achievements={achievements.map(a => ({
                  id: a.id,
                  title: a.title,
                  description: a.description,
                  type: a.type,
                  progress: a.progress,
                  total: a.total,
                  unlocked: a.unlocked,
                  unlockedAt: a.unlockedAt,
                  icon: a.icon,
                }))}
              />
            )}
          </Suspense>
        </TabsContent>

        <TabsContent value="unlocked">
          <Suspense fallback={<div className="py-8 text-center">Loading achievements...</div>}>
            {achievements.filter(a => a.unlocked).length === 0 ? (
              <EmptyState message="You haven't unlocked any achievements yet. Complete activities to earn achievements!" />
            ) : (
              <LazyAchievementGrid
                achievements={achievements.filter(a => a.unlocked).map(a => ({
                  id: a.id,
                  title: a.title,
                  description: a.description,
                  type: a.type,
                  progress: a.progress,
                  total: a.total,
                  unlocked: a.unlocked,
                  unlockedAt: a.unlockedAt,
                  icon: a.icon,
                }))}
              />
            )}
          </Suspense>
        </TabsContent>

        <TabsContent value="in-progress">
          <Suspense fallback={<div className="py-8 text-center">Loading achievements...</div>}>
            {achievements.filter(a => !a.unlocked).length === 0 ? (
              <EmptyState message="No achievements in progress. All achievements are either locked or completed!" />
            ) : (
              <LazyAchievementGrid
                achievements={achievements.filter(a => !a.unlocked).map(a => ({
                  id: a.id,
                  title: a.title,
                  description: a.description,
                  type: a.type,
                  progress: a.progress,
                  total: a.total,
                  unlocked: a.unlocked,
                  unlockedAt: a.unlockedAt,
                  icon: a.icon,
                }))}
              />
            )}
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
}

function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between hover:bg-gray-100 transition-colors duration-200">
      <div className="flex items-center gap-2">
        <div className="bg-teal-100 text-teal-700 p-2 rounded-full">
          {icon}
        </div>
        <span className="text-sm font-medium">{title}</span>
      </div>
      <span className="text-lg font-bold text-teal-700">{value}</span>
    </div>
  );
}

function EmptyState({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-gray-300 mb-4">
        {AchievementIcons.empty}
      </div>
      <h3 className="text-xl font-semibold text-gray-700 mb-2">No Achievements Found</h3>
      <p className="text-gray-500 max-w-md">
        {message || "You don't have any achievements yet. Complete activities and challenges to earn achievements!"}
      </p>
    </div>
  );
}
