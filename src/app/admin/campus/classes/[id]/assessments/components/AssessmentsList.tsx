'use client';

import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  FileTextIcon,
  MoreHorizontalIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CheckIcon,
  XIcon
} from 'lucide-react';
import { Assessment } from '@/types';

// Make sure the Assessment type includes isPublished
declare module '@/types' {
  interface Assessment {
    isPublished?: boolean;
  }
}

interface AssessmentsListProps {
  assessments: Assessment[];
  classId: string;
}

export function AssessmentsList({ assessments, classId }: AssessmentsListProps) {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Max Score</TableHead>
            <TableHead>Submissions</TableHead>
            <TableHead>Published</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assessments.map((assessment) => (
            <TableRow key={assessment.id}>
              <TableCell>
                <Link
                  href={`/admin/campus/classes/${classId}/assessments/${assessment.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {assessment.title}
                </Link>
                {assessment.description && (
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {assessment.description}
                  </p>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{assessment.category}</Badge>
              </TableCell>
              <TableCell>
                {assessment.dueDate
                  ? format(new Date(assessment.dueDate), 'MMM dd, yyyy')
                  : 'No due date'
                }
              </TableCell>
              <TableCell>{assessment.maxScore}</TableCell>
              <TableCell>
                {assessment._count?.submissions || 0}
              </TableCell>
              <TableCell>
                {assessment.isPublished ? (
                  <Badge variant="success" className="flex gap-1 items-center">
                    <CheckIcon className="h-3 w-3" />
                    Published
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="flex gap-1 items-center">
                    <XIcon className="h-3 w-3" />
                    Draft
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontalIcon className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/campus/classes/${classId}/assessments/${assessment.id}`}>
                        <EyeIcon className="h-4 w-4 mr-2" />
                        View
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/campus/classes/${classId}/assessments/${assessment.id}/edit`}>
                        <PencilIcon className="h-4 w-4 mr-2" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/campus/classes/${classId}/assessments/${assessment.id}/submissions`}>
                        <FileTextIcon className="h-4 w-4 mr-2" />
                        Submissions
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <TrashIcon className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}

          {assessments.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-6">
                No assessments found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}