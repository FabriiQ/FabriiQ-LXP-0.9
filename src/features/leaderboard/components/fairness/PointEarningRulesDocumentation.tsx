'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertCircle,
  BookOpen,
  Calendar,
  CheckCircle,
  Download,
  FileText,
  HelpCircle,
  Search,
  Sun,
  BarChart,
  Users
} from 'lucide-react';
import { Award } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface PointRule {
  id: string;
  category: string;
  title: string;
  description: string;
  pointsRange: [number, number];
  frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'unlimited';
  examples: string[];
}

export interface PointEarningRulesDocumentationProps {
  rules: PointRule[];
  className?: string;
}

export function PointEarningRulesDocumentation({
  rules,
  className
}: PointEarningRulesDocumentationProps) {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filter rules by search query
  const filteredRules = rules.filter(rule =>
    rule.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rule.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rule.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group rules by category
  const rulesByCategory = filteredRules.reduce<Record<string, PointRule[]>>((acc, rule) => {
    if (!acc[rule.category]) {
      acc[rule.category] = [];
    }
    acc[rule.category].push(rule);
    return acc;
  }, {});

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'academic':
        return <BookOpen className="h-4 w-4" />;
      case 'attendance':
        return <Calendar className="h-4 w-4" />;
      case 'participation':
        return <Users className="h-4 w-4" />;
      case 'achievement':
        return <Award className="h-4 w-4" />;
      case 'activity':
        return <BarChart className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  // Get frequency badge
  const getFrequencyBadge = (frequency: PointRule['frequency']) => {
    switch (frequency) {
      case 'once':
        return <Badge variant="outline">Once</Badge>;
      case 'daily':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Daily</Badge>;
      case 'weekly':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Weekly</Badge>;
      case 'monthly':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">Monthly</Badge>;
      case 'unlimited':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">Unlimited</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Point Earning Rules</CardTitle>
            <CardDescription>
              Clear documentation of how points are earned
            </CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" align="center" className="max-w-xs">
                <p className="text-sm">
                  This documentation explains the rules for earning points on the leaderboard,
                  including point values, frequency limits, and examples.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="categories">By Category</TabsTrigger>
            <TabsTrigger value="table">Table View</TabsTrigger>
          </TabsList>

          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search rules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
          </div>

          <TabsContent value="overview" className="space-y-4">
            <Alert>
              <HelpCircle className="h-4 w-4" />
              <AlertTitle>Fair and Transparent</AlertTitle>
              <AlertDescription>
                Our point earning rules are designed to reward positive learning behaviors and ensure fair competition.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">General Principles</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-full bg-blue-100">
                        <CheckCircle className="h-4 w-4 text-blue-700" />
                      </div>
                      <CardTitle className="text-base">Balanced Scoring</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      Points are balanced across different types of activities to ensure
                      that students can succeed through various paths, not just one.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-full bg-green-100">
                        <Calendar className="h-4 w-4 text-green-700" />
                      </div>
                      <CardTitle className="text-base">Frequency Limits</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      Most point-earning activities have frequency limits to prevent
                      gaming the system and ensure fair competition.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-full bg-purple-100">
                        <BarChart className="h-4 w-4 text-purple-700" />
                      </div>
                      <CardTitle className="text-base">Effort-Based</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      Points are awarded based on effort and improvement, not just
                      absolute performance, to encourage growth mindset.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-full bg-yellow-100">
                        <Award className="h-4 w-4 text-yellow-700" />
                      </div>
                      <CardTitle className="text-base">Achievements</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      Special achievements and milestones provide bonus points to
                      recognize significant accomplishments.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="p-4 bg-muted/50 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <Sun className="h-5 w-5 text-yellow-500" />
                <h3 className="font-medium">Tips for Maximizing Points</h3>
              </div>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Focus on consistent daily participation rather than sporadic bursts</li>
                <li>Balance your efforts across different categories</li>
                <li>Complete activities fully rather than partially</li>
                <li>Work towards achievements for bonus points</li>
                <li>Help others to earn participation points</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              {Object.entries(rulesByCategory).map(([category, categoryRules]) => (
                <AccordionItem key={category} value={category}>
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-full bg-muted">
                        {getCategoryIcon(category)}
                      </div>
                      <span>{category} Points</span>
                      <Badge variant="outline" className="ml-2">
                        {categoryRules.length} rules
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-2">
                      {categoryRules.map((rule) => (
                        <Card key={rule.id}>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-base">{rule.title}</CardTitle>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">
                                  {rule.pointsRange[0] === rule.pointsRange[1]
                                    ? `${rule.pointsRange[0]} points`
                                    : `${rule.pointsRange[0]}-${rule.pointsRange[1]} points`}
                                </Badge>
                                {getFrequencyBadge(rule.frequency)}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm mb-3">{rule.description}</p>

                            {rule.examples.length > 0 && (
                              <div className="bg-muted p-3 rounded-md">
                                <div className="text-sm font-medium mb-1">Examples:</div>
                                <ul className="list-disc list-inside text-sm space-y-1">
                                  {rule.examples.map((example, index) => (
                                    <li key={index}>{example}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {Object.keys(rulesByCategory).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No rules found matching your search</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="table">
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                        No rules found matching your search
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell className="font-medium">{rule.title}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {getCategoryIcon(rule.category)}
                            <span>{rule.category}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {rule.pointsRange[0] === rule.pointsRange[1]
                              ? rule.pointsRange[0]
                              : `${rule.pointsRange[0]}-${rule.pointsRange[1]}`}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getFrequencyBadge(rule.frequency)}
                        </TableCell>
                        <TableCell className="max-w-md">
                          <div className="text-sm truncate" title={rule.description}>
                            {rule.description}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="flex justify-between border-t pt-4">
        <div className="flex items-center text-xs text-muted-foreground">
          <BookOpen className="h-3.5 w-3.5 mr-1" />
          Last updated: {new Date().toLocaleDateString()}
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Download Rules PDF
        </Button>
      </CardFooter>
    </Card>
  );
}
