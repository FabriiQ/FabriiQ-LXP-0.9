"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/data-display/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/forms/input";
import { DatePicker } from "@/components/ui/forms/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/forms/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { ArrowUpDown, Calendar, Filter, Search, UserPlus, School, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export interface TransferHistoryEntry {
  id: string;
  action: string;
  details: any;
  createdAt: Date | string;
  createdBy: {
    id: string;
    name: string;
    email: string;
    userType: string;
  };
  enrollment: {
    id: string;
    student: {
      id: string;
      user: {
        id: string;
        name: string;
        email: string;
      };
    };
    class: {
      id: string;
      name: string;
      code: string;
    };
  };
}

interface TransferHistoryListProps {
  transfers: TransferHistoryEntry[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onFilterChange: (filters: any) => void;
  isLoading?: boolean;
  className?: string;
  emptyMessage?: string;
}

export function TransferHistoryList({
  transfers,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onFilterChange,
  isLoading = false,
  className,
  emptyMessage = "No transfer history available",
}: TransferHistoryListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [transferType, setTransferType] = useState<string>("all");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [activeView, setActiveView] = useState<string>("table");

  const handleSearch = () => {
    onFilterChange({
      searchTerm,
      transferType,
      startDate,
      endDate,
    });
  };

  const handleReset = () => {
    setSearchTerm("");
    setTransferType("all");
    setStartDate(undefined);
    setEndDate(undefined);
    onFilterChange({
      searchTerm: "",
      transferType: "all",
      startDate: undefined,
      endDate: undefined,
    });
  };

  const getActionLabel = (action: string): string => {
    switch (action) {
      case "TRANSFERRED_IN":
        return "Class Transfer In";
      case "TRANSFERRED_OUT":
        return "Class Transfer Out";
      case "CAMPUS_TRANSFERRED_IN":
        return "Campus Transfer In";
      case "CAMPUS_TRANSFERRED_OUT":
        return "Campus Transfer Out";
      default:
        return action.replace(/_/g, " ");
    }
  };

  const getActionBadge = (action: string) => {
    let variant: "default" | "secondary" | "outline" | "destructive" = "default";
    
    if (action.includes("TRANSFERRED_IN") || action.includes("CAMPUS_TRANSFERRED_IN")) {
      variant = "default"; // Green for transfers in
    } else if (action.includes("TRANSFERRED_OUT") || action.includes("CAMPUS_TRANSFERRED_OUT")) {
      variant = "destructive"; // Red for transfers out
    }
    
    return <Badge variant={variant}>{getActionLabel(action)}</Badge>;
  };

  const renderTransferDetails = (transfer: TransferHistoryEntry) => {
    const { action, details } = transfer;
    
    if (action === "TRANSFERRED_IN" || action === "TRANSFERRED_OUT") {
      return (
        <div className="mt-1">
          <p className="text-sm">
            From: {details.fromClassName || "Unknown"} 
            <ArrowRight className="inline mx-2 h-4 w-4" /> 
            To: {details.toClassName || "Unknown"}
          </p>
          {details.reason && (
            <p className="text-sm text-muted-foreground mt-1">
              Reason: {details.reason}
            </p>
          )}
        </div>
      );
    }
    
    if (action === "CAMPUS_TRANSFERRED_IN" || action === "CAMPUS_TRANSFERRED_OUT") {
      return (
        <div className="mt-1">
          <p className="text-sm">
            From: {details.fromCampusName || "Unknown"} ({details.fromClassName || ""})
            <ArrowRight className="inline mx-2 h-4 w-4" /> 
            To: {details.toCampusName || "Unknown"} ({details.toClassName || ""})
          </p>
          {details.reason && (
            <p className="text-sm text-muted-foreground mt-1">
              Reason: {details.reason}
            </p>
          )}
        </div>
      );
    }
    
    return null;
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Transfer History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <p>Loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Student Transfer History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by student name or email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex flex-row gap-2">
              <Select value={transferType} onValueChange={setTransferType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Transfer Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Transfers</SelectItem>
                  <SelectItem value="class">Class Transfers</SelectItem>
                  <SelectItem value="campus">Campus Transfers</SelectItem>
                </SelectContent>
              </Select>
              <DatePicker
                placeholder="Start Date"
                date={startDate}
                onDateChange={setStartDate}
              />
              <DatePicker
                placeholder="End Date"
                date={endDate}
                onDateChange={setEndDate}
              />
              <Button onClick={handleSearch}>
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" onClick={handleReset}>
                Reset
              </Button>
            </div>
          </div>

          {/* View Tabs */}
          <Tabs value={activeView} onValueChange={setActiveView}>
            <TabsList>
              <TabsTrigger value="table">Table View</TabsTrigger>
              <TabsTrigger value="timeline">Timeline View</TabsTrigger>
            </TabsList>

            {/* Table View */}
            <TabsContent value="table">
              {transfers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <School className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">{emptyMessage}</p>
                </div>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Student</TableHead>
                          <TableHead>Transfer Type</TableHead>
                          <TableHead>Details</TableHead>
                          <TableHead>Processed By</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transfers.map((transfer) => (
                          <TableRow key={transfer.id}>
                            <TableCell>
                              {typeof transfer.createdAt === "string"
                                ? transfer.createdAt
                                : format(new Date(transfer.createdAt), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell>
                              <Link 
                                href={`/admin/campus/students/${transfer.enrollment.student.id}`}
                                className="font-medium hover:underline"
                              >
                                {transfer.enrollment.student.user.name}
                              </Link>
                              <div className="text-sm text-muted-foreground">
                                {transfer.enrollment.student.user.email}
                              </div>
                            </TableCell>
                            <TableCell>
                              {getActionBadge(transfer.action)}
                            </TableCell>
                            <TableCell>
                              {renderTransferDetails(transfer)}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{transfer.createdBy.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {transfer.createdBy.userType.replace(/_/g, " ")}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-end mt-4">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={onPageChange}
                      />
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            {/* Timeline View */}
            <TabsContent value="timeline">
              {transfers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">{emptyMessage}</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

                  <div className="space-y-6">
                    {transfers.map((transfer) => (
                      <div key={transfer.id} className="relative pl-10">
                        {/* Timeline dot */}
                        <div className="absolute left-0 top-0">
                          <div className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold",
                            transfer.action.includes("IN") ? "bg-green-500" : "bg-red-500"
                          )}>
                            {transfer.action.includes("CAMPUS") ? "C" : "T"}
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <h3 className="font-medium">
                                <Link 
                                  href={`/admin/campus/students/${transfer.enrollment.student.id}`}
                                  className="hover:underline"
                                >
                                  {transfer.enrollment.student.user.name}
                                </Link>
                              </h3>
                              <span className="ml-2">{getActionBadge(transfer.action)}</span>
                            </div>
                            <time className="text-sm text-muted-foreground">
                              {typeof transfer.createdAt === "string"
                                ? transfer.createdAt
                                : format(new Date(transfer.createdAt), "MMM d, yyyy h:mm a")}
                            </time>
                          </div>
                          
                          {renderTransferDetails(transfer)}
                          
                          <p className="mt-1 text-xs text-muted-foreground">
                            Processed by: {transfer.createdBy.name} ({transfer.createdBy.userType.replace(/_/g, " ")})
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pagination for timeline view */}
              {totalPages > 1 && (
                <div className="flex justify-end mt-4">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={onPageChange}
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}
