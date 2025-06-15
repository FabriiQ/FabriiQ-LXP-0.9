'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState } from 'react';

interface SystemTeacherFiltersProps {
  campuses: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
  currentCampusId?: string;
  currentSubjectId?: string;
  currentStatus?: string;
  searchQuery?: string;
}

export function SystemTeacherFilters({
  campuses,
  subjects,
  currentCampusId,
  currentSubjectId,
  currentStatus,
  searchQuery,
}: SystemTeacherFiltersProps) {
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

  const handleSubjectChange = (value: string) => {
    const url = new URL(window.location.href);
    if (value) {
      url.searchParams.set('subjectId', value);
    } else {
      url.searchParams.delete('subjectId');
    }
    router.push(url.toString());
  };

  const handleStatusChange = (value: string) => {
    const url = new URL(window.location.href);
    if (value) {
      url.searchParams.set('status', value);
    } else {
      url.searchParams.delete('status');
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

  const hasFilters = currentCampusId || currentSubjectId || currentStatus || searchQuery;

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
          <label className="text-sm font-medium mb-1 block">Subject Qualification</label>
          <select 
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            onChange={(e) => handleSubjectChange(e.target.value)}
            value={currentSubjectId || ''}
          >
            <option value="">All Subjects</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="text-sm font-medium mb-1 block">Status</label>
          <select 
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            onChange={(e) => handleStatusChange(e.target.value)}
            value={currentStatus || ''}
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
        
        <div>
          <label className="text-sm font-medium mb-1 block">Search</label>
          <form onSubmit={handleSearch}>
            <div className="flex">
              <input
                type="text"
                placeholder="Search teachers..."
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
          <Link href="/admin/system/teachers">
            <Button variant="outline">Clear Filters</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
