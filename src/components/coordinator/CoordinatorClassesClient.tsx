'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/utils/api';
import { CoordinatorClassList } from './CoordinatorClassList';
import { MobileClassList } from './MobileClassList';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useResponsive } from '@/lib/hooks/use-responsive';

interface CoordinatorClassesClientProps {
  initialSearch: string;
  initialProgramId: string;
  initialTermId: string;
  campus: {
    id: string;
    name: string;
    code: string;
    status: string;
  };
  programCampuses: Array<{
    id: string;
    programId: string;
    program: {
      id: string;
      name: string;
    };
  }>;
  terms: Array<{
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
  }>;
  classes: Array<{
    id: string;
    name: string;
    code: string;
    courseName: string;
    campusName: string;
    termName: string;
    studentsCount: number;
    status: string;
  }>;
}

export function CoordinatorClassesClient({
  initialSearch,
  initialProgramId,
  initialTermId,
  campus,
  programCampuses,
  terms,
  classes
}: CoordinatorClassesClientProps) {
  const router = useRouter();
  const { isMobile } = useResponsive();
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedProgramId, setSelectedProgramId] = useState(initialProgramId);
  const [selectedTermId, setSelectedTermId] = useState(initialTermId);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (selectedProgramId) params.set('programId', selectedProgramId);
    if (selectedTermId) params.set('termId', selectedTermId);

    router.push(`/admin/coordinator/classes?${params.toString()}`);
  };

  const handleProgramChange = (value: string) => {
    setSelectedProgramId(value);
    updateUrl(value, selectedTermId, searchQuery);
  };

  const handleTermChange = (value: string) => {
    setSelectedTermId(value);
    updateUrl(selectedProgramId, value, searchQuery);
  };

  const updateUrl = (programId: string, termId: string, search: string) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (programId) params.set('programId', programId);
    if (termId) params.set('termId', termId);

    router.push(`/admin/coordinator/classes?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Class Management</CardTitle>
              <CardDescription>View and manage classes for your coordinated programs</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="w-full sm:w-40">
                <Label htmlFor="program-select" className="sr-only">Filter by Program</Label>
                <Select value={selectedProgramId} onValueChange={handleProgramChange}>
                  <SelectTrigger id="program-select">
                    <SelectValue placeholder="All Programs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Programs</SelectItem>
                    {programCampuses.map((pc) => (
                      <SelectItem key={pc.programId} value={pc.programId}>
                        {pc.program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-40">
                <Label htmlFor="term-select" className="sr-only">Filter by Term</Label>
                <Select value={selectedTermId} onValueChange={handleTermChange}>
                  <SelectTrigger id="term-select">
                    <SelectValue placeholder="All Terms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Terms</SelectItem>
                    {terms.map((term) => (
                      <SelectItem key={term.id} value={term.id}>
                        {term.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isMobile ? (
            <MobileClassList
              classes={classes}
              isLoading={false}
              campusId={campus.id}
            />
          ) : (
            <CoordinatorClassList
              classes={classes}
              isLoading={false}
              campuses={[campus]}
              selectedCampusId={campus.id}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
