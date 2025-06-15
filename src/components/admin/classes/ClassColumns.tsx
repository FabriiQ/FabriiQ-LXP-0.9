'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, BookOpen, CheckSquare } from "lucide-react";

export const createClassColumns = (isCoordinator = false) => [
  {
    accessorKey: "name",
    header: "Class Name",
    cell: ({ row }: any) => (
      <div>
        <div className="font-medium">{row.original.name}</div>
        <div className="text-sm text-muted-foreground">{row.original.code}</div>
      </div>
    ),
  },
  {
    accessorKey: "course",
    header: "Course",
  },
  {
    accessorKey: "program",
    header: "Program",
  },
  {
    accessorKey: "term",
    header: "Term",
  },
  {
    accessorKey: "studentCount",
    header: "Students",
    cell: ({ row }: any) => (
      <div className="flex items-center">
        <Users className="h-4 w-4 mr-2 text-muted-foreground" />
        <span>{row.original.studentCount}</span>
      </div>
    ),
  },
  {
    accessorKey: "teacherCount",
    header: "Teachers",
    cell: ({ row }: any) => (
      <div className="flex items-center">
        <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
        <span>{row.original.teacherCount}</span>
      </div>
    ),
  },
  {
    accessorKey: "assessmentCount",
    header: "Assessments",
    cell: ({ row }: any) => (
      <div className="flex items-center">
        <CheckSquare className="h-4 w-4 mr-2 text-muted-foreground" />
        <span>{row.original.assessmentCount}</span>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }: any) => (
      <Badge variant={row.original.status === "ACTIVE" ? "success" : "secondary"}>
        {row.original.status}
      </Badge>
    ),
  },
  {
    id: "actions",
    cell: ({ row }: any) => {
      const basePath = isCoordinator ? '/admin/coordinator' : '/admin/campus';

      return (
        <Button variant="ghost" size="sm" asChild>
          <Link href={`${basePath}/classes/${row.original.id}`}>
            View
          </Link>
        </Button>
      );
    },
  },
];
