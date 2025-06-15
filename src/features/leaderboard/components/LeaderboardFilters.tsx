/**
 * Leaderboard Filters Component
 *
 * This component provides UI for filtering leaderboards,
 * including demographic and custom group partitioning.
 */

'use client';

import React, { useState } from 'react';
import {
  LeaderboardFilterOptions
} from '../types/standard-leaderboard';
import {
  DemographicFilterOptions,
  CustomGroupFilterOptions
} from '../utils/partition-helpers';

// Assuming we have UI components from a design system
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Filter,
  Users,
  UserPlus,
  Search,
  SlidersHorizontal,
  X,
  Award,
  GraduationCap,
  Calendar
} from 'lucide-react';
import { Star } from '@/components/ui/icons/reward-icons';

export interface LeaderboardFiltersProps {
  filters: LeaderboardFilterOptions;
  updateFilters: (filters: Partial<LeaderboardFilterOptions>) => void;
  demographicOptions?: DemographicFilterOptions;
  customGroups?: CustomGroupFilterOptions[];
  selectedDemographicFilter?: DemographicFilterOptions;
  selectedCustomGroup?: CustomGroupFilterOptions;
  selectDemographicFilter: (filter: DemographicFilterOptions | undefined) => void;
  selectCustomGroup: (group: CustomGroupFilterOptions | undefined) => void;
  resetFilters: () => void;
  className?: string;
}

export function LeaderboardFilters({
  filters,
  updateFilters,
  demographicOptions,
  customGroups = [],
  selectedDemographicFilter,
  selectedCustomGroup,
  selectDemographicFilter,
  selectCustomGroup,
  resetFilters,
  className,
}: LeaderboardFiltersProps) {
  const [searchQuery, setSearchQuery] = useState(filters.searchQuery || '');
  const [levelRange, setLevelRange] = useState<[number, number]>([
    filters.minLevel || 1,
    filters.maxLevel || 10
  ]);

  // Count active filters
  const activeFilterCount = [
    filters.searchQuery,
    filters.minLevel !== undefined || filters.maxLevel !== undefined,
    filters.achievementFilter && filters.achievementFilter.length > 0,
    selectedDemographicFilter && Object.keys(selectedDemographicFilter).length > 0,
    selectedCustomGroup
  ].filter(Boolean).length;

  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ searchQuery });
  };

  // Handle level range change
  const handleLevelRangeChange = (value: number[]) => {
    setLevelRange([value[0], value[1]]);
    updateFilters({
      minLevel: value[0],
      maxLevel: value[1]
    });
  };

  return (
    <div className={className}>
      {/* Mobile filter button with sheet */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="h-[80vh]">
            <SheetHeader>
              <SheetTitle>Leaderboard Filters</SheetTitle>
              <SheetDescription>
                Filter the leaderboard by various criteria
              </SheetDescription>
            </SheetHeader>

            <Tabs defaultValue="basic" className="mt-4">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="demographic">Demographics</TabsTrigger>
                <TabsTrigger value="groups">Groups</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                {/* Search */}
                <form onSubmit={handleSearchSubmit} className="flex space-x-2">
                  <Input
                    placeholder="Search by name or ID"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                </form>

                {/* Level range */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Level Range</Label>
                    <div className="text-sm text-muted-foreground">
                      {levelRange[0]} - {levelRange[1]}
                    </div>
                  </div>
                  <Slider
                    defaultValue={levelRange}
                    min={1}
                    max={10}
                    step={1}
                    onValueChange={handleLevelRangeChange}
                  />
                </div>

                {/* Sort options */}
                <div className="space-y-2">
                  <Label>Sort By</Label>
                  <Select
                    value={filters.sortBy || 'rank'}
                    onValueChange={(value) => updateFilters({ sortBy: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rank">Rank</SelectItem>
                      <SelectItem value="academicScore">Academic Score</SelectItem>
                      <SelectItem value="rewardPoints">Reward Points</SelectItem>
                      <SelectItem value="completionRate">Completion Rate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Sort Direction</Label>
                  <Select
                    value={filters.sortDirection || 'asc'}
                    onValueChange={(value) => updateFilters({ sortDirection: value as 'asc' | 'desc' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sort direction" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Ascending</SelectItem>
                      <SelectItem value="desc">Descending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="demographic" className="space-y-4">
                {demographicOptions ? (
                  <>
                    {/* Age groups */}
                    {demographicOptions.ageGroups && demographicOptions.ageGroups.length > 0 && (
                      <div className="space-y-2">
                        <Label>Age Groups</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {demographicOptions.ageGroups.map((group) => (
                            <Button
                              key={`${group.min}-${group.max}`}
                              variant={
                                selectedDemographicFilter?.ageGroups?.some(
                                  g => g.min === group.min && g.max === group.max
                                )
                                  ? 'default'
                                  : 'outline'
                              }
                              size="sm"
                              onClick={() => selectDemographicFilter({
                                ageGroups: [group]
                              })}
                              className="justify-start"
                            >
                              <Calendar className="h-4 w-4 mr-2" />
                              {group.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Grade levels */}
                    {demographicOptions.gradeLevel && (
                      <div className="space-y-2">
                        <Label>Grade Level</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {(Array.isArray(demographicOptions.gradeLevel)
                            ? demographicOptions.gradeLevel
                            : [demographicOptions.gradeLevel]
                          ).map((grade) => (
                            <Button
                              key={grade}
                              variant={
                                selectedDemographicFilter?.gradeLevel === grade ||
                                (Array.isArray(selectedDemographicFilter?.gradeLevel) &&
                                  selectedDemographicFilter?.gradeLevel.includes(grade))
                                  ? 'default'
                                  : 'outline'
                              }
                              size="sm"
                              onClick={() => selectDemographicFilter({
                                gradeLevel: grade
                              })}
                              className="justify-start"
                            >
                              <GraduationCap className="h-4 w-4 mr-2" />
                              Grade {grade}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Gender */}
                    {demographicOptions.gender && (
                      <div className="space-y-2">
                        <Label>Gender</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {(Array.isArray(demographicOptions.gender)
                            ? demographicOptions.gender
                            : [demographicOptions.gender]
                          ).map((gender) => (
                            <Button
                              key={gender}
                              variant={
                                selectedDemographicFilter?.gender === gender ||
                                (Array.isArray(selectedDemographicFilter?.gender) &&
                                  selectedDemographicFilter?.gender.includes(gender))
                                  ? 'default'
                                  : 'outline'
                              }
                              size="sm"
                              onClick={() => selectDemographicFilter({
                                gender
                              })}
                              className="justify-start"
                            >
                              <Users className="h-4 w-4 mr-2" />
                              {gender}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No demographic filters available
                  </div>
                )}
              </TabsContent>

              <TabsContent value="groups" className="space-y-4">
                {customGroups.length > 0 ? (
                  <div className="space-y-2">
                    <Label>Custom Groups</Label>
                    <div className="grid grid-cols-1 gap-2">
                      {customGroups.map((group) => (
                        <Button
                          key={group.groupId}
                          variant={
                            selectedCustomGroup?.groupId === group.groupId
                              ? 'default'
                              : 'outline'
                          }
                          size="sm"
                          onClick={() => selectCustomGroup(group)}
                          className="justify-start"
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          {group.groupName}
                          <Badge variant="secondary" className="ml-auto">
                            {group.memberIds.length}
                          </Badge>
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No custom groups available
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <SheetFooter className="mt-4 flex-row gap-2 sm:justify-between">
              <Button
                variant="outline"
                onClick={resetFilters}
                className="flex-1"
              >
                Reset
              </Button>
              <SheetClose asChild>
                <Button className="flex-1">Apply Filters</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop filters */}
      <div className="hidden md:block">
        <div className="space-y-4">
          {/* Search and sort */}
          <div className="flex space-x-2">
            <form onSubmit={handleSearchSubmit} className="flex space-x-2 flex-1">
              <Input
                placeholder="Search by name or ID"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </form>

            <Select
              value={filters.sortBy || 'rank'}
              onValueChange={(value) => updateFilters({ sortBy: value as any })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rank">Rank</SelectItem>
                <SelectItem value="academicScore">Academic Score</SelectItem>
                <SelectItem value="rewardPoints">Reward Points</SelectItem>
                <SelectItem value="completionRate">Completion Rate</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.sortDirection || 'asc'}
              onValueChange={(value) => updateFilters({ sortDirection: value as 'asc' | 'desc' })}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sort direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active filters */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2">
              {filters.searchQuery && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Search className="h-3 w-3" />
                  {filters.searchQuery}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 ml-1 p-0"
                    onClick={() => updateFilters({ searchQuery: undefined })}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}

              {(filters.minLevel !== undefined || filters.maxLevel !== undefined) && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  Level: {filters.minLevel || 1} - {filters.maxLevel || 10}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 ml-1 p-0"
                    onClick={() => updateFilters({ minLevel: undefined, maxLevel: undefined })}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}

              {selectedDemographicFilter && Object.keys(selectedDemographicFilter).length > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {selectedDemographicFilter.ageGroups ? 'Age Group' :
                   selectedDemographicFilter.gradeLevel ? 'Grade Level' :
                   selectedDemographicFilter.gender ? 'Gender' : 'Demographic'}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 ml-1 p-0"
                    onClick={() => selectDemographicFilter(undefined)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}

              {selectedCustomGroup && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <UserPlus className="h-3 w-3" />
                  {selectedCustomGroup.groupName}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 ml-1 p-0"
                    onClick={() => selectCustomGroup(undefined)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="ml-auto"
              >
                Reset All
              </Button>
            </div>
          )}

          {/* Advanced filters */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="advanced-filters">
              <AccordionTrigger className="text-sm">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Advanced Filters
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  {/* Level range */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Level Range</Label>
                      <div className="text-sm text-muted-foreground">
                        {levelRange[0]} - {levelRange[1]}
                      </div>
                    </div>
                    <Slider
                      defaultValue={levelRange}
                      min={1}
                      max={10}
                      step={1}
                      onValueChange={handleLevelRangeChange}
                    />
                  </div>

                  {/* Demographics */}
                  {demographicOptions && (
                    <div className="space-y-2">
                      <Label>Demographics</Label>
                      <Select
                        value={
                          selectedDemographicFilter?.ageGroups ? 'age' :
                          selectedDemographicFilter?.gradeLevel ? 'grade' :
                          selectedDemographicFilter?.gender ? 'gender' :
                          ''
                        }
                        onValueChange={(value) => {
                          if (value === '') {
                            selectDemographicFilter(undefined);
                            return;
                          }

                          if (value === 'age' && demographicOptions.ageGroups) {
                            selectDemographicFilter({
                              ageGroups: demographicOptions.ageGroups
                            });
                          } else if (value === 'grade' && demographicOptions.gradeLevel) {
                            selectDemographicFilter({
                              gradeLevel: demographicOptions.gradeLevel
                            });
                          } else if (value === 'gender' && demographicOptions.gender) {
                            selectDemographicFilter({
                              gender: demographicOptions.gender
                            });
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select demographic" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {demographicOptions.ageGroups && (
                            <SelectItem value="age">Age Group</SelectItem>
                          )}
                          {demographicOptions.gradeLevel && (
                            <SelectItem value="grade">Grade Level</SelectItem>
                          )}
                          {demographicOptions.gender && (
                            <SelectItem value="gender">Gender</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Custom groups */}
                  {customGroups.length > 0 && (
                    <div className="space-y-2">
                      <Label>Custom Groups</Label>
                      <Select
                        value={selectedCustomGroup?.groupId || ''}
                        onValueChange={(value) => {
                          if (value === '') {
                            selectCustomGroup(undefined);
                            return;
                          }

                          const group = customGroups.find(g => g.groupId === value);
                          if (group) {
                            selectCustomGroup(group);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select group" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {customGroups.map((group) => (
                            <SelectItem key={group.groupId} value={group.groupId}>
                              {group.groupName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
}
