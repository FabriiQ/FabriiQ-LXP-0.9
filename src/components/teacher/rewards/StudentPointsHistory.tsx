'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Award,
  Calendar,
  Clock,
  Filter,
  ChevronLeft,
  ChevronRight,
  Search
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface PointsHistoryEntry {
  id: string;
  amount: number;
  source: string;
  description: string;
  timestamp: string | Date;
  classId?: string;
  className?: string;
}

export interface StudentPointsHistoryProps {
  studentId: string;
  studentName: string;
  studentImage?: string;
  totalPoints: number;
  pointsHistory: PointsHistoryEntry[];
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function StudentPointsHistory({
  studentId,
  studentName,
  studentImage,
  totalPoints,
  pointsHistory,
  isOpen,
  onOpenChange,
  trigger
}: StudentPointsHistoryProps) {
  const [open, setOpen] = useState(isOpen || false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const itemsPerPage = 10;

  // Handle dialog open state
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  // Filter and search points history
  const filteredHistory = pointsHistory.filter(entry => {
    // Apply source filter
    if (filter !== 'all' && entry.source !== filter) {
      return false;
    }

    // Apply search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        entry.description.toLowerCase().includes(searchLower) ||
        entry.source.toLowerCase().includes(searchLower) ||
        (entry.className && entry.className.toLowerCase().includes(searchLower))
      );
    }

    return true;
  });

  // Sort by timestamp (newest first)
  const sortedHistory = [...filteredHistory].sort((a, b) => {
    const dateA = new Date(a.timestamp);
    const dateB = new Date(b.timestamp);
    return dateB.getTime() - dateA.getTime();
  });

  // Paginate
  const totalPages = Math.ceil(sortedHistory.length / itemsPerPage);
  const paginatedHistory = sortedHistory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get unique sources for filter
  const sources = Array.from(new Set(pointsHistory.map(entry => entry.source)));

  // Group by month for the timeline view
  const groupedByMonth: Record<string, PointsHistoryEntry[]> = {};
  sortedHistory.forEach(entry => {
    const date = new Date(entry.timestamp);
    const monthKey = format(date, 'MMMM yyyy');

    if (!groupedByMonth[monthKey]) {
      groupedByMonth[monthKey] = [];
    }

    groupedByMonth[monthKey].push(entry);
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            View Points History
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={studentImage} alt={studentName} />
              <AvatarFallback>{studentName.charAt(0)}</AvatarFallback>
            </Avatar>
            <span>{studentName}'s Points History</span>
          </DialogTitle>
          <div className="flex items-center justify-between text-sm text-muted-foreground mt-1">
            <span>Review point awards and deductions</span>
            <div className="flex items-center gap-1">
              <Award className="h-4 w-4 text-amber-500" />
              <span className="font-bold text-amber-600">
                {/* Calculate total points from history if available, otherwise use the passed totalPoints */}
                {pointsHistory && pointsHistory.length > 0
                  ? pointsHistory.reduce((sum, entry) => sum + entry.amount, 0)
                  : totalPoints} total points
              </span>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="list" className="flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="list" className="text-xs">List View</TabsTrigger>
              <TabsTrigger value="timeline" className="text-xs">Timeline</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <div className="relative w-[140px]">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 h-8 text-xs"
                />
              </div>

              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="h-8 w-[130px] text-xs">
                  <div className="flex items-center gap-1">
                    <Filter className="h-3 w-3" />
                    <SelectValue placeholder="Filter" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {sources.map(source => (
                    <SelectItem key={source} value={source}>
                      {source.charAt(0).toUpperCase() + source.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value="list" className="flex-1 overflow-hidden flex flex-col mt-0">
            <div className="flex-1 overflow-y-auto">
              {paginatedHistory.length > 0 ? (
                <div className="space-y-3">
                  {paginatedHistory.map(entry => (
                    <PointsHistoryItem key={entry.id} entry={entry} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[200px] text-center">
                  <Award className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No points history found</p>
                  {(searchTerm || filter !== 'all') && (
                    <Button
                      variant="link"
                      onClick={() => {
                        setSearchTerm('');
                        setFilter('all');
                      }}
                      className="mt-2"
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t pt-4 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="h-8 text-xs"
                >
                  <ChevronLeft className="h-3 w-3 mr-1" />
                  Previous
                </Button>

                <span className="text-xs text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="h-8 text-xs"
                >
                  Next
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="timeline" className="flex-1 overflow-y-auto mt-0">
            {Object.keys(groupedByMonth).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(groupedByMonth).map(([month, entries]) => (
                  <div key={month} className="relative">
                    <div className="sticky top-0 bg-white z-10 py-2">
                      <h3 className="text-sm font-medium">{month}</h3>
                    </div>

                    <div className="space-y-3 mt-2 pl-4 border-l-2 border-gray-100">
                      {entries.map(entry => (
                        <PointsHistoryItem key={entry.id} entry={entry} showDate />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] text-center">
                <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No timeline data available</p>
                {(searchTerm || filter !== 'all') && (
                  <Button
                    variant="link"
                    onClick={() => {
                      setSearchTerm('');
                      setFilter('all');
                    }}
                    className="mt-2"
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

interface PointsHistoryItemProps {
  entry: PointsHistoryEntry;
  showDate?: boolean;
}

function PointsHistoryItem({ entry, showDate = false }: PointsHistoryItemProps) {
  const date = typeof entry.timestamp === 'string'
    ? parseISO(entry.timestamp)
    : entry.timestamp;

  // Determine icon based on source
  let icon = <Award className="h-4 w-4" />;
  if (entry.source === 'teacher-bonus') {
    icon = <Award className="h-4 w-4" />;
  } else if (entry.source === 'activity') {
    icon = <Clock className="h-4 w-4" />;
  }

  return (
    <div className="flex items-start gap-3 p-3 rounded-md border bg-white">
      <div className={cn(
        "p-2 rounded-full flex-shrink-0",
        entry.amount > 0 ? "bg-green-50" : "bg-red-50"
      )}>
        {icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="font-medium text-sm truncate max-w-[300px]">
            {entry.description}
          </div>
          <Badge
            variant={entry.amount > 0 ? "default" : "destructive"}
            className={cn(
              "ml-2 flex-shrink-0",
              entry.amount > 0 ? "bg-green-100 text-green-800 hover:bg-green-100" : ""
            )}
          >
            {entry.amount > 0 ? `+${entry.amount}` : entry.amount}
          </Badge>
        </div>

        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs px-1.5 py-0">
              {entry.source.charAt(0).toUpperCase() + entry.source.slice(1)}
            </Badge>

            {entry.className && (
              <span className="text-xs text-muted-foreground">
                {entry.className}
              </span>
            )}
          </div>

          {showDate && (
            <span className="text-xs text-muted-foreground">
              {format(date, 'MMM d, yyyy')}
            </span>
          )}

          {!showDate && (
            <span className="text-xs text-muted-foreground">
              {format(date, 'MMM d, yyyy h:mm a')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
