"use client";

import { useState } from "react";
import { Enrollment } from "@/app/admin/campus/enrollment/page";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/data-display/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/forms/select";
import { TabsContent } from "@/components/ui/navigation/tabs";
import { EnrollmentDataTable } from "./enrollment-data-table";

interface EnrollmentDataTableWrapperProps {
  enrollments: Enrollment[];
}

export function EnrollmentDataTableWrapper({ enrollments }: EnrollmentDataTableWrapperProps) {
  const [programFilter, setProgramFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<string>("all");

  // Extract unique programs and classes for filters
  const uniquePrograms = Array.from(new Set(enrollments.map(e => e.programName)))
    .filter(Boolean)
    .map(name => ({ id: name, name }));

  const uniqueClasses = Array.from(new Set(enrollments.map(e => e.className)))
    .filter(Boolean)
    .map(name => ({ id: name, name }));

  // Apply filters
  const filteredEnrollments = enrollments.filter(enrollment => {
    if (programFilter !== "all" && enrollment.programName !== programFilter) return false;
    if (classFilter !== "all" && enrollment.className !== classFilter) return false;
    return true;
  });

  return (
    <>
      <CardHeader className="pb-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Enrollments</CardTitle>
            <CardDescription>Manage student enrollments</CardDescription>
          </div>
          
          <div className="flex flex-col md:flex-row gap-2">
            <Select value={programFilter} onValueChange={setProgramFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="All Programs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Programs</SelectItem>
                {uniquePrograms.map((program) => (
                  <SelectItem key={program.id} value={program.id}>
                    {program.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {uniqueClasses.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <TabsContent value="all" className="mt-0">
          <EnrollmentDataTable data={filteredEnrollments} />
        </TabsContent>
        <TabsContent value="active" className="mt-0">
          <EnrollmentDataTable data={filteredEnrollments.filter(e => e.status === "ACTIVE")} />
        </TabsContent>
        <TabsContent value="pending" className="mt-0">
          <EnrollmentDataTable data={filteredEnrollments.filter(e => e.status === "PENDING")} />
        </TabsContent>
        <TabsContent value="completed" className="mt-0">
          <EnrollmentDataTable data={filteredEnrollments.filter(e => e.status === "COMPLETED")} />
        </TabsContent>
      </CardContent>
    </>
  );
} 