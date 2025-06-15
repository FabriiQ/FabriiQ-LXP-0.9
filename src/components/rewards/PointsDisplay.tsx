"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Coins, TrendingUp, Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PointsSummary {
  totalPoints: number;
  dailyPoints: number;
  weeklyPoints: number;
  monthlyPoints: number;
}

export interface PointsDisplayProps {
  summary: PointsSummary;
  previousTotal?: number;
  className?: string;
  showAnimation?: boolean;
}

export function PointsDisplay({
  summary,
  previousTotal,
  className,
  showAnimation = false,
}: PointsDisplayProps) {
  const [prevTotal, setPrevTotal] = useState(previousTotal || summary.totalPoints);
  const [animatePoints, setAnimatePoints] = useState(false);

  // Detect changes in total points to trigger animation
  useEffect(() => {
    if (prevTotal !== summary.totalPoints) {
      setPrevTotal(summary.totalPoints);
      if (showAnimation) {
        setAnimatePoints(true);
        const timer = setTimeout(() => setAnimatePoints(false), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [summary.totalPoints, prevTotal, showAnimation]);

  // Calculate point change
  const pointChange = summary.totalPoints - (previousTotal || summary.totalPoints);
  const hasIncrease = pointChange > 0;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="bg-gradient-to-r from-teal-600 to-teal-700 text-white pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Points Summary
          </CardTitle>
          {hasIncrease && (
            <Badge variant="outline" className="bg-teal-500 text-white border-teal-400">
              +{pointChange} points
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-4 flex flex-col items-center justify-center">
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-1">Total Points</div>
            <div className="relative">
              <motion.div
                key={summary.totalPoints}
                initial={{ opacity: 1, y: 0 }}
                className="text-3xl font-bold text-teal-700"
              >
                {summary.totalPoints}
              </motion.div>
              
              {/* Points animation */}
              <AnimatePresence>
                {animatePoints && hasIncrease && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: -20 }}
                    exit={{ opacity: 0, y: -40 }}
                    transition={{ duration: 1.5 }}
                    className="absolute top-0 right-0 text-sm font-bold text-green-500"
                  >
                    +{pointChange}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <Tabs defaultValue="daily" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="daily" className="text-xs">Daily</TabsTrigger>
            <TabsTrigger value="weekly" className="text-xs">Weekly</TabsTrigger>
            <TabsTrigger value="monthly" className="text-xs">Monthly</TabsTrigger>
          </TabsList>
          
          <TabsContent value="daily" className="p-4 pt-2">
            <PointsCard
              title="Today's Points"
              points={summary.dailyPoints}
              icon={<Clock className="h-4 w-4" />}
            />
          </TabsContent>
          
          <TabsContent value="weekly" className="p-4 pt-2">
            <PointsCard
              title="This Week"
              points={summary.weeklyPoints}
              icon={<Calendar className="h-4 w-4" />}
            />
          </TabsContent>
          
          <TabsContent value="monthly" className="p-4 pt-2">
            <PointsCard
              title="This Month"
              points={summary.monthlyPoints}
              icon={<TrendingUp className="h-4 w-4" />}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface PointsCardProps {
  title: string;
  points: number;
  icon: React.ReactNode;
}

function PointsCard({ title, points, icon }: PointsCardProps) {
  return (
    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
      <div className="flex items-center gap-2">
        <div className="bg-teal-100 text-teal-700 p-2 rounded-full">
          {icon}
        </div>
        <div className="text-sm font-medium">{title}</div>
      </div>
      <div className="text-lg font-bold text-teal-700">{points}</div>
    </div>
  );
}
