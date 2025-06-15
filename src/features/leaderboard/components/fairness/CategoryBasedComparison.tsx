'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  BarChart,
  Filter,
  GraduationCap,
  LayoutGrid,
  ArrowRight,
  Search,
  Users
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { StandardLeaderboardEntry } from '../../types/standard-leaderboard';

export interface CategoryDefinition {
  id: string;
  name: string;
  description: string;
  type: 'grade_level' | 'subject_focus' | 'learning_style' | 'custom';
  color?: string;
}

export interface StudentCategory {
  studentId: string;
  categoryIds: string[];
}

export interface CategoryBasedComparisonProps {
  leaderboard: StandardLeaderboardEntry[];
  categories: CategoryDefinition[];
  studentCategories: StudentCategory[];
  currentStudentId?: string;
  isLoading?: boolean;
  onCategorySelect?: (categoryId: string) => void;
  onRefresh?: () => void;
  className?: string;
}

export function CategoryBasedComparison({
  leaderboard,
  categories,
  studentCategories,
  currentStudentId,
  isLoading = false,
  onCategorySelect,
  onRefresh,
  className
}: CategoryBasedComparisonProps) {
  const [activeTab, setActiveTab] = useState<string>('categories');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filter leaderboard by category and search query
  const filteredLeaderboard = leaderboard.filter(entry => {
    // Filter by category
    if (selectedCategory !== 'all') {
      const studentCategory = studentCategories.find(sc => sc.studentId === entry.studentId);
      if (!studentCategory || !studentCategory.categoryIds.includes(selectedCategory)) {
        return false;
      }
    }

    // Filter by search query
    if (searchQuery) {
      return entry.studentName.toLowerCase().includes(searchQuery.toLowerCase());
    }

    return true;
  });

  // Get category for a student
  const getStudentCategories = (studentId: string): CategoryDefinition[] => {
    const studentCategory = studentCategories.find(sc => sc.studentId === studentId);
    if (!studentCategory) return [];

    return categories.filter(cat => studentCategory.categoryIds.includes(cat.id));
  };

  // Handle category selection
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);

    if (onCategorySelect) {
      onCategorySelect(categoryId);
    }
  };

  // Get category color
  const getCategoryColor = (categoryId: string): string => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.color || '#6b7280';
  };

  // Get category badge
  const getCategoryBadge = (category: CategoryDefinition) => {
    return (
      <Badge
        key={category.id}
        className={`mr-1 mb-1 ${
          category.color
            ? `bg-opacity-20 text-${category.color} border-${category.color} border-opacity-40`
            : ''
        }`}
      >
        {category.name}
      </Badge>
    );
  };

  // Get category icon
  const getCategoryIcon = (type: CategoryDefinition['type']) => {
    switch (type) {
      case 'grade_level':
        return <GraduationCap className="h-4 w-4" />;
      case 'subject_focus':
        return <BarChart className="h-4 w-4" />;
      case 'learning_style':
        return <LayoutGrid className="h-4 w-4" />;
      case 'custom':
        return <Users className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  // Calculate category statistics
  const getCategoryStats = (categoryId: string) => {
    // Get students in this category
    const studentIds = studentCategories
      .filter(sc => sc.categoryIds.includes(categoryId))
      .map(sc => sc.studentId);

    // Get leaderboard entries for these students
    const categoryEntries = leaderboard.filter(entry => studentIds.includes(entry.studentId));

    // Calculate average points
    const avgPoints = categoryEntries.length > 0
      ? categoryEntries.reduce((sum, entry) => sum + entry.rewardPoints, 0) / categoryEntries.length
      : 0;

    // Calculate average academic score
    const avgAcademicScore = categoryEntries.length > 0
      ? categoryEntries.reduce((sum, entry) => sum + entry.academicScore, 0) / categoryEntries.length
      : 0;

    return {
      studentCount: categoryEntries.length,
      averagePoints: Math.round(avgPoints),
      averageAcademicScore: Math.round(avgAcademicScore)
    };
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Category-Based Comparison</CardTitle>
            <CardDescription>
              Compare performance within similar student groups
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <ArrowRight className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Select value={selectedCategory} onValueChange={handleCategorySelect}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <TabsContent value="categories" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((category) => {
                const stats = getCategoryStats(category.id);

                return (
                  <Card
                    key={category.id}
                    className={cn(
                      "cursor-pointer transition-all",
                      selectedCategory === category.id ? "ring-2 ring-primary" : ""
                    )}
                    onClick={() => handleCategorySelect(category.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="p-2 rounded-full"
                            style={{ backgroundColor: `${category.color || '#6b7280'}20` }}
                          >
                            {getCategoryIcon(category.type)}
                          </div>
                          <CardTitle className="text-base">{category.name}</CardTitle>
                        </div>
                        <Badge variant="outline">
                          {stats.studentCount} students
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">
                        {category.description}
                      </p>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 bg-muted rounded-md text-center">
                          <div className="text-sm text-muted-foreground">Avg. Points</div>
                          <div className="font-medium">{stats.averagePoints.toLocaleString()}</div>
                        </div>
                        <div className="p-2 bg-muted rounded-md text-center">
                          <div className="text-sm text-muted-foreground">Avg. Score</div>
                          <div className="font-medium">{stats.averageAcademicScore}%</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="leaderboard">
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Rank</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Categories</TableHead>
                    <TableHead className="text-right">Academic Score</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredLeaderboard.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                        No students found in this category
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLeaderboard.map((entry) => {
                      const studentCats = getStudentCategories(entry.studentId);

                      return (
                        <TableRow
                          key={entry.studentId}
                          className={entry.studentId === currentStudentId ? "bg-primary/10" : undefined}
                        >
                          <TableCell className="font-medium">
                            {entry.rank}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar>
                                <AvatarImage src={entry.studentAvatar} />
                                <AvatarFallback>
                                  {entry.studentName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                {entry.isAnonymous ? "Anonymous Student" : entry.studentName}
                                {entry.studentId === currentStudentId && (
                                  <Badge variant="outline" className="ml-2">You</Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap">
                              {studentCats.map(cat => getCategoryBadge(cat))}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {entry.academicScore}%
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {entry.rewardPoints.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="flex justify-between border-t pt-4">
        <div className="flex items-center text-xs text-muted-foreground">
          <Filter className="h-3.5 w-3.5 mr-1" />
          Showing {filteredLeaderboard.length} of {leaderboard.length} students
        </div>

        {selectedCategory !== 'all' && (
          <Button variant="outline" size="sm" onClick={() => handleCategorySelect('all')}>
            Show All Categories
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
