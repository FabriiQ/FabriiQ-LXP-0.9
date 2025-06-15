'use client';

import { useEffect } from 'react';
import { Program } from '@prisma/client';

interface ProgramAssignmentDebugProps {
  campusId: string;
  availablePrograms: Program[];
  selectedProgramId?: string;
}

export function ProgramAssignmentDebug({
  campusId,
  availablePrograms,
  selectedProgramId,
}: ProgramAssignmentDebugProps) {
  useEffect(() => {
    console.log('Debug Component - Campus ID:', campusId);
    console.log('Debug Component - Available Programs:', availablePrograms);
    console.log('Debug Component - Available Programs Count:', availablePrograms.length);
    console.log('Debug Component - Selected Program ID:', selectedProgramId);
  }, [campusId, availablePrograms, selectedProgramId]);

  // Only render in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md mb-4">
      <h3 className="text-sm font-semibold text-yellow-800 mb-2">Debug Information</h3>
      <div className="text-xs text-yellow-700 space-y-1">
        <p>Campus ID: {campusId}</p>
        <p>Available Programs: {availablePrograms.length}</p>
        <p>Selected Program ID: {selectedProgramId || 'None'}</p>
        <div className="mt-2">
          <p className="font-semibold">Available Programs:</p>
          <ul className="list-disc pl-4 mt-1">
            {availablePrograms.map(p => (
              <li key={p.id}>{p.name} ({p.code}) - ID: {p.id}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
