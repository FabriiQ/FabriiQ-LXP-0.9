"use client";

import { useState } from "react";
import { Enrollment } from "@/app/admin/campus/enrollment/page";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface EnrollmentDataTableProps {
  data: Enrollment[];
}

export function EnrollmentDataTable({ data }: EnrollmentDataTableProps) {
  const [sortColumn, setSortColumn] = useState<keyof Enrollment>("startDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const sortedData = [...data].sort((a, b) => {
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];

    if (aValue === null || aValue === undefined) return sortDirection === "asc" ? -1 : 1;
    if (bValue === null || bValue === undefined) return sortDirection === "asc" ? 1 : -1;

    if (sortColumn === "startDate" || sortColumn === "endDate") {
      const aDate = aValue as Date;
      const bDate = bValue as Date;
      return sortDirection === "asc" 
        ? aDate.getTime() - bDate.getTime() 
        : bDate.getTime() - aDate.getTime();
    }

    const aStr = String(aValue).toLowerCase();
    const bStr = String(bValue).toLowerCase();
    return sortDirection === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
  });

  const handleSort = (column: keyof Enrollment) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortIndicator = (column: keyof Enrollment) => {
    if (sortColumn !== column) return null;
    return sortDirection === "asc" ? " ↑" : " ↓";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      case "COMPLETED":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Completed</Badge>;
      case "WITHDRAWN":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Withdrawn</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      case "PARTIAL":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Partial</Badge>;
      case "OVERDUE":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Overdue</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">{status}</Badge>;
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort("studentName")}
            >
              Student{getSortIndicator("studentName")}
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort("className")}
            >
              Class{getSortIndicator("className")}
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort("programName")}
            >
              Program{getSortIndicator("programName")}
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort("startDate")}
            >
              Start Date{getSortIndicator("startDate")}
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort("status")}
            >
              Status{getSortIndicator("status")}
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort("paymentStatus")}
            >
              Payment{getSortIndicator("paymentStatus")}
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No enrollments found.
              </TableCell>
            </TableRow>
          ) : (
            sortedData.map((enrollment) => (
              <TableRow key={enrollment.id}>
                <TableCell className="font-medium">
                  <div>{enrollment.studentName}</div>
                  <div className="text-sm text-muted-foreground">{enrollment.studentEmail}</div>
                </TableCell>
                <TableCell>{enrollment.className}</TableCell>
                <TableCell>{enrollment.programName}</TableCell>
                <TableCell>
                  {format(new Date(enrollment.startDate), "MMM d, yyyy")}
                  {enrollment.endDate && (
                    <div className="text-sm text-muted-foreground">
                      End: {format(new Date(enrollment.endDate), "MMM d, yyyy")}
                    </div>
                  )}
                </TableCell>
                <TableCell>{getStatusBadge(enrollment.status)}</TableCell>
                <TableCell>{getPaymentStatusBadge(enrollment.paymentStatus)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/campus/enrollment/${enrollment.id}`}>
                      View
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/campus/enrollment/${enrollment.id}/edit`}>
                      Edit
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
} 