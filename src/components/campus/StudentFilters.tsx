'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Program, ProgramCampus } from '@prisma/client';

interface StudentFiltersProps {
  programCampuses: (ProgramCampus & { program: Program })[];
  currentProgramId?: string;
  campusId: string;
  searchQuery?: string;
}

export function StudentFilters({
  programCampuses,
  currentProgramId,
  campusId,
  searchQuery,
}: StudentFiltersProps) {
  const router = useRouter();

  const handleProgramChange = (value: string) => {
    const url = new URL(window.location.href);
    if (value) {
      url.searchParams.set('programId', value);
    } else {
      url.searchParams.delete('programId');
    }
    router.push(url.toString());
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const searchValue = formData.get('search') as string;
    
    const url = new URL(window.location.href);
    if (searchValue) {
      url.searchParams.set('search', searchValue);
    } else {
      url.searchParams.delete('search');
    }
    router.push(url.toString());
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 bg-muted/50 p-4 rounded-lg">
      <div className="flex-1">
        <label className="text-sm font-medium mb-1 block">Program</label>
        <select 
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          onChange={(e) => handleProgramChange(e.target.value)}
          value={currentProgramId || ''}
        >
          <option value="">All Programs</option>
          {programCampuses.map((pc) => (
            <option key={pc.id} value={pc.id}>
              {pc.program.name} ({pc.program.code})
            </option>
          ))}
        </select>
      </div>
      
      <div className="flex-1">
        <label className="text-sm font-medium mb-1 block">Search</label>
        <form onSubmit={handleSearch}>
          <div className="flex">
            <input
              type="text"
              name="search"
              placeholder="Search students..."
              className="flex-1 rounded-l-md border border-input bg-background px-3 py-2 text-sm"
              defaultValue={searchQuery || ''}
            />
            <Button type="submit" className="rounded-l-none">Search</Button>
          </div>
        </form>
      </div>
      
      <div className="flex items-end">
        {(currentProgramId || searchQuery) && (
          <Link href={`/admin/system/campuses/${campusId}/students`}>
            <Button variant="outline">Clear Filters</Button>
          </Link>
        )}
      </div>
    </div>
  );
} 