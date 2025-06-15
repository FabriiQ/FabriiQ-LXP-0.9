'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState } from 'react';

interface SystemClassFiltersProps {
  campuses: { id: string; name: string }[];
  programs: { id: string; name: string }[];
  terms: { id: string; name: string }[];
  currentCampusId?: string;
  currentProgramId?: string;
  currentTermId?: string;
  searchQuery?: string;
}

export function SystemClassFilters({
  campuses,
  programs,
  terms,
  currentCampusId,
  currentProgramId,
  currentTermId,
  searchQuery,
}: SystemClassFiltersProps) {
  const router = useRouter();
  const [search, setSearch] = useState(searchQuery || '');

  const handleCampusChange = (value: string) => {
    const url = new URL(window.location.href);
    if (value) {
      url.searchParams.set('campusId', value);
    } else {
      url.searchParams.delete('campusId');
    }
    router.push(url.toString());
  };

  const handleProgramChange = (value: string) => {
    const url = new URL(window.location.href);
    if (value) {
      url.searchParams.set('programId', value);
    } else {
      url.searchParams.delete('programId');
    }
    router.push(url.toString());
  };

  const handleTermChange = (value: string) => {
    const url = new URL(window.location.href);
    if (value) {
      url.searchParams.set('termId', value);
    } else {
      url.searchParams.delete('termId');
    }
    router.push(url.toString());
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const url = new URL(window.location.href);
    if (search) {
      url.searchParams.set('search', search);
    } else {
      url.searchParams.delete('search');
    }
    router.push(url.toString());
  };

  const hasFilters = currentCampusId || currentProgramId || currentTermId || searchQuery;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Campus</label>
          <select 
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            onChange={(e) => handleCampusChange(e.target.value)}
            value={currentCampusId || ''}
          >
            <option value="">All Campuses</option>
            {campuses.map((campus) => (
              <option key={campus.id} value={campus.id}>
                {campus.name}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="text-sm font-medium mb-1 block">Program</label>
          <select 
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            onChange={(e) => handleProgramChange(e.target.value)}
            value={currentProgramId || ''}
          >
            <option value="">All Programs</option>
            {programs.map((program) => (
              <option key={program.id} value={program.id}>
                {program.name}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="text-sm font-medium mb-1 block">Term</label>
          <select 
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            onChange={(e) => handleTermChange(e.target.value)}
            value={currentTermId || ''}
          >
            <option value="">All Terms</option>
            {terms.map((term) => (
              <option key={term.id} value={term.id}>
                {term.name}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="text-sm font-medium mb-1 block">Search</label>
          <form onSubmit={handleSearch}>
            <div className="flex">
              <input
                type="text"
                placeholder="Search classes..."
                className="flex-1 rounded-l-md border border-input bg-background px-3 py-2 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Button type="submit" className="rounded-l-none">Search</Button>
            </div>
          </form>
        </div>
      </div>
      
      {hasFilters && (
        <div className="flex justify-end">
          <Link href="/admin/system/classes">
            <Button variant="outline">Clear Filters</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
