'use client';

import { useState } from 'react';
import { useTeacherAssistant } from '../hooks/use-teacher-assistant';
import { Button } from '@/components/ui/core/button';
import { Input } from '@/components/ui/core/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/core/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import { SearchFilters, SearchResult } from '../types';
import { Search, Loader2, SlidersHorizontal, ChevronDown, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchResultCardProps {
  result: SearchResult;
}

/**
 * Component to display a single search result
 */
function SearchResultCard({ result }: SearchResultCardProps) {
  return (
    <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
      <div className="flex justify-between items-start">
        <h3 className="font-medium text-sm">{result.title}</h3>
        <span className="text-xs text-muted-foreground">{result.source}</span>
      </div>
      <p className="text-sm mt-1 text-muted-foreground line-clamp-2">{result.snippet}</p>
      <div className="mt-2 flex justify-between items-center">
        <span className="text-xs text-muted-foreground">
          Relevance: {Math.round(result.relevanceScore * 100)}%
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          asChild
        >
          <a href={result.url} target="_blank" rel="noopener noreferrer">
            Open <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </Button>
      </div>
    </div>
  );
}

/**
 * Search interface component for the teacher assistant
 *
 * Features:
 * - Search input with filters
 * - Search results display
 * - Mobile-first responsive design
 */
export function SearchInterface() {
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    executeSearch
  } = useTeacherAssistant();

  const [filters, setFilters] = useState<SearchFilters>({
    contentType: 'all',
    subject: '',
    gradeLevel: '',
    dateRange: null,
    limit: 5
  });

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    executeSearch(searchQuery, filters);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center space-x-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Search for teaching resources..."
            className="flex-1"
          />
          <Button
            onClick={handleSearch}
            disabled={!searchQuery.trim() || isSearching}
            size="icon"
          >
            {isSearching ?
              <Loader2 className="h-4 w-4 animate-spin" /> :
              <Search className="h-4 w-4" />
            }
          </Button>
        </div>

        <Collapsible className="mt-2">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Select
                value={filters.contentType}
                onValueChange={(value) => setFilters({...filters, contentType: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Content Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="lesson_plan">Lesson Plans</SelectItem>
                  <SelectItem value="activity">Activities</SelectItem>
                  <SelectItem value="assessment">Assessments</SelectItem>
                  <SelectItem value="research">Research Papers</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.subject}
                onValueChange={(value) => setFilters({...filters, subject: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Subjects</SelectItem>
                  <SelectItem value="math">Mathematics</SelectItem>
                  <SelectItem value="science">Science</SelectItem>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="history">History</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isSearching ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : searchResults.length > 0 ? (
          <div className="space-y-4">
            {searchResults.map((result) => (
              <SearchResultCard key={result.id} result={result} />
            ))}
          </div>
        ) : searchQuery ? (
          <div className="text-center text-muted-foreground py-8">
            No results found. Try adjusting your search terms or filters.
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            Enter a search query to find teaching resources and information.
          </div>
        )}
      </div>
    </div>
  );
}
