'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Program, ProgramCampus, Term } from '@prisma/client';

interface ClassFiltersProps {
  programCampuses: (ProgramCampus & { program: Program })[];
  terms: Term[];
  currentProgramId?: string;
  currentTermId?: string;
  campusId: string;
}

export function ClassFilters({
  programCampuses,
  terms,
  currentProgramId,
  currentTermId,
  campusId,
}: ClassFiltersProps) {
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

  const handleTermChange = (value: string) => {
    const url = new URL(window.location.href);
    if (value) {
      url.searchParams.set('termId', value);
    } else {
      url.searchParams.delete('termId');
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
      
      <div className="flex items-end">
        {(currentProgramId || currentTermId) && (
          <Link href={`/admin/system/campuses/${campusId}/classes`}>
            <Button variant="outline">Clear Filters</Button>
          </Link>
        )}
      </div>
    </div>
  );
} 