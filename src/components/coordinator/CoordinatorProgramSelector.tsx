'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CoordinatorAnalyticsNavigation } from '@/components/coordinator/CoordinatorAnalyticsNavigation';

interface Campus {
  id: string;
  name: string;
  code: string;
}

interface Program {
  id: string;
  name: string;
  code: string;
  campuses: Campus[];
}

interface CoordinatorProgramSelectorProps {
  programs: Program[];
}

export function CoordinatorProgramSelector({ programs }: CoordinatorProgramSelectorProps) {
  const [selectedProgram, setSelectedProgram] = useState<string | null>(
    programs.length > 0 ? programs[0].id : null
  );

  // Get the selected program
  const program = selectedProgram
    ? programs.find((p) => p.id === selectedProgram)
    : null;

  // Create coordinator assignments for the selected program
  const coordinatorAssignments = program
    ? program.campuses.map((campus) => ({
        programId: program.id,
        programName: program.name,
        programCode: program.code,
        campusId: campus.id,
        campusName: campus.name,
        campusCode: campus.code,
        role: 'Coordinator',
        responsibilities: ['Program Oversight', 'Teacher Support', 'Student Support'],
        assignedAt: new Date(),
      }))
    : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Select Program</CardTitle>
          <CardDescription>Choose a program to view course analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedProgram || ''}
            onValueChange={(value) => setSelectedProgram(value)}
          >
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder="Select a program" />
            </SelectTrigger>
            <SelectContent>
              {programs.map((program) => (
                <SelectItem key={program.id} value={program.id}>
                  {program.name} ({program.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {program && (
        <CoordinatorAnalyticsNavigation
          programId={program.id}
          programName={program.name}
          programCode={program.code}
          campuses={program.campuses}
          coordinatorAssignments={coordinatorAssignments}
        />
      )}
    </div>
  );
}
