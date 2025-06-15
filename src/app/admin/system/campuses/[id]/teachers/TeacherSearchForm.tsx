'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface TeacherSearchFormProps {
  campusId: string;
  currentSearch: string;
}

export function TeacherSearchForm({ campusId, currentSearch }: TeacherSearchFormProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState(currentSearch);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Build the URL with search params
    const url = new URL(window.location.href);
    if (searchValue.trim()) {
      url.searchParams.set('search', searchValue);
    } else {
      url.searchParams.delete('search');
    }
    
    // Navigate to the new URL
    router.push(url.toString());
  };

  return (
    <>
      <div className="flex-1">
        <form onSubmit={handleSubmit}>
          <div className="flex">
            <input
              type="text"
              name="search"
              placeholder="Search teachers by name or email..."
              className="flex-1 rounded-l-md border border-input bg-background px-3 py-2 text-sm"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
            <Button type="submit" className="rounded-l-none">Search</Button>
          </div>
        </form>
      </div>
      
      <div className="flex items-end">
        {currentSearch && (
          <Link href={`/admin/system/campuses/${campusId}/teachers`}>
            <Button variant="outline">Clear Search</Button>
          </Link>
        )}
      </div>
    </>
  );
} 