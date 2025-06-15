'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Calendar as CalendarIcon,
  Clock,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

interface TeacherAttendanceRecord {
  id: string;
  teacherId: string;
  teacherName: string;
  date: Date;
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED';
  checkInTime?: string;
  checkOutTime?: string;
  duration?: number;
  reason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface TeacherAttendanceManagementProps {
  campusId?: string;
  programId?: string;
  isLoading?: boolean;
  attendanceRecords?: TeacherAttendanceRecord[];
  onRecordCreate?: (record: Omit<TeacherAttendanceRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onRecordUpdate?: (id: string, record: Partial<TeacherAttendanceRecord>) => Promise<void>;
  onRecordDelete?: (id: string) => Promise<void>;
  onExport?: () => void;
  onImport?: (file: File) => Promise<void>;
  onSearch?: (query: string) => void;
  onFilter?: (filters: any) => void;
}

export function TeacherAttendanceManagement({
  campusId,
  programId,
  isLoading = false,
  attendanceRecords = [],
  onRecordCreate,
  onRecordUpdate,
  onRecordDelete,
  onExport,
  onImport,
  onSearch,
  onFilter
}: TeacherAttendanceManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<TeacherAttendanceRecord | null>(null);

  const [newRecord, setNewRecord] = useState({
    teacherId: '',
    teacherName: '',
    date: new Date(),
    status: 'PRESENT' as const,
    checkInTime: '',
    checkOutTime: '',
    reason: '',
    notes: ''
  });

  const { toast } = useToast();

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  // Handle filter change
  const handleFilterChange = () => {
    if (onFilter) {
      onFilter({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        date: dateFilter
      });
    }
  };

  // Handle create record
  const handleCreateRecord = async () => {
    if (!newRecord.teacherId || !newRecord.date) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "error",
      });
      return;
    }

    try {
      if (onRecordCreate) {
        await onRecordCreate(newRecord);
        toast({
          title: "Record Created",
          description: "Attendance record has been created successfully.",
        });
        setIsCreateDialogOpen(false);
        setNewRecord({
          teacherId: '',
          teacherName: '',
          date: new Date(),
          status: 'PRESENT',
          checkInTime: '',
          checkOutTime: '',
          reason: '',
          notes: ''
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create attendance record.",
        variant: "error",
      });
    }
  };

  // Handle update record
  const handleUpdateRecord = async () => {
    if (!selectedRecord) return;

    try {
      if (onRecordUpdate) {
        await onRecordUpdate(selectedRecord.id, selectedRecord);
        toast({
          title: "Record Updated",
          description: "Attendance record has been updated successfully.",
        });
        setIsEditDialogOpen(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update attendance record.",
        variant: "error",
      });
    }
  };

  // Handle delete record
  const handleDeleteRecord = async () => {
    if (!selectedRecord) return;

    try {
      if (onRecordDelete) {
        await onRecordDelete(selectedRecord.id);
        toast({
          title: "Record Deleted",
          description: "Attendance record has been deleted successfully.",
        });
        setIsDeleteDialogOpen(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete attendance record.",
        variant: "error",
      });
    }
  };

  // Handle export
  const handleExport = () => {
    if (onExport) {
      onExport();
      toast({
        title: "Export Started",
        description: "Your attendance data is being exported.",
      });
    }
  };

  // Handle import
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (onImport) {
      onImport(file)
        .then(() => {
          toast({
            title: "Import Successful",
            description: "Attendance data has been imported successfully.",
          });
        })
        .catch(() => {
          toast({
            title: "Import Failed",
            description: "Failed to import attendance data. Please check the file format.",
            variant: "error",
          });
        });
    }
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return 'success';
      case 'LATE':
        return 'warning';
      case 'ABSENT':
        return 'destructive';
      case 'EXCUSED':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <CheckCircle className="h-4 w-4" />;
      case 'LATE':
        return <Clock className="h-4 w-4" />;
      case 'ABSENT':
        return <XCircle className="h-4 w-4" />;
      case 'EXCUSED':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Teacher Attendance Management</h2>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          <div className="relative">
            <Input
              type="file"
              id="import-file"
              className="hidden"
              accept=".csv,.xlsx"
              onChange={handleImport}
            />
            <Button variant="outline" size="sm" asChild>
              <label htmlFor="import-file" className="cursor-pointer">
                <Download className="h-4 w-4 mr-2 rotate-180" />
                Import
              </label>
            </Button>
          </div>

          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Record
          </Button>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search teachers..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" type="submit">
            Search
          </Button>
        </form>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1"
          >
            <Filter className="h-4 w-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  handleFilterChange();
                }}
              >
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PRESENT">Present</SelectItem>
                  <SelectItem value="LATE">Late</SelectItem>
                  <SelectItem value="ABSENT">Absent</SelectItem>
                  <SelectItem value="EXCUSED">Excused</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date-filter">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date-filter"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFilter ? format(dateFilter, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateFilter}
                    onSelect={(date) => {
                      setDateFilter(date);
                      handleFilterChange();
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setStatusFilter('all');
                  setDateFilter(undefined);
                  handleFilterChange();
                }}
              >
                Reset Filters
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Attendance Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
          <CardDescription>
            Manage teacher attendance records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teacher</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Check-out</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceRecords.length > 0 ? (
                attendanceRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.teacherName}</TableCell>
                    <TableCell>{format(new Date(record.date), "PP")}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(record.status)} className="flex w-24 justify-center items-center gap-1">
                        {getStatusIcon(record.status)}
                        {record.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{record.checkInTime || '-'}</TableCell>
                    <TableCell>{record.checkOutTime || '-'}</TableCell>
                    <TableCell>
                      {record.duration
                        ? `${Math.floor(record.duration)}h ${Math.round((record.duration % 1) * 60)}m`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedRecord(record);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedRecord(record);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">
                    No attendance records found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Record Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Attendance Record</DialogTitle>
            <DialogDescription>
              Add a new attendance record for a teacher.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="teacher-id" className="text-right">
                Teacher ID
              </Label>
              <Input
                id="teacher-id"
                value={newRecord.teacherId}
                onChange={(e) => setNewRecord({...newRecord, teacherId: e.target.value})}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="teacher-name" className="text-right">
                Teacher Name
              </Label>
              <Input
                id="teacher-name"
                value={newRecord.teacherName}
                onChange={(e) => setNewRecord({...newRecord, teacherName: e.target.value})}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="col-span-3 justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newRecord.date ? format(newRecord.date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newRecord.date}
                    onSelect={(date) => date && setNewRecord({...newRecord, date})}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select
                value={newRecord.status}
                onValueChange={(value) =>
                  setNewRecord({...newRecord, status: value as 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED'})
                }
              >
                <SelectTrigger id="status" className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRESENT">Present</SelectItem>
                  <SelectItem value="LATE">Late</SelectItem>
                  <SelectItem value="ABSENT">Absent</SelectItem>
                  <SelectItem value="EXCUSED">Excused</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="check-in" className="text-right">
                Check-in Time
              </Label>
              <Input
                id="check-in"
                type="time"
                value={newRecord.checkInTime}
                onChange={(e) => setNewRecord({...newRecord, checkInTime: e.target.value})}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="check-out" className="text-right">
                Check-out Time
              </Label>
              <Input
                id="check-out"
                type="time"
                value={newRecord.checkOutTime}
                onChange={(e) => setNewRecord({...newRecord, checkOutTime: e.target.value})}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reason" className="text-right">
                Reason
              </Label>
              <Input
                id="reason"
                value={newRecord.reason}
                onChange={(e) => setNewRecord({...newRecord, reason: e.target.value})}
                className="col-span-3"
                placeholder="Required for Absent/Excused"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={newRecord.notes}
                onChange={(e) => setNewRecord({...newRecord, notes: e.target.value})}
                className="col-span-3"
                placeholder="Additional notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRecord}>Create Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Record Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Attendance Record</DialogTitle>
            <DialogDescription>
              Update the attendance record details.
            </DialogDescription>
          </DialogHeader>

          {selectedRecord && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-status" className="text-right">
                  Status
                </Label>
                <Select
                  value={selectedRecord.status}
                  onValueChange={(value: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED') =>
                    setSelectedRecord({...selectedRecord, status: value})
                  }
                >
                  <SelectTrigger id="edit-status" className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRESENT">Present</SelectItem>
                    <SelectItem value="LATE">Late</SelectItem>
                    <SelectItem value="ABSENT">Absent</SelectItem>
                    <SelectItem value="EXCUSED">Excused</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-check-in" className="text-right">
                  Check-in Time
                </Label>
                <Input
                  id="edit-check-in"
                  type="time"
                  value={selectedRecord.checkInTime || ''}
                  onChange={(e) => setSelectedRecord({...selectedRecord, checkInTime: e.target.value})}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-check-out" className="text-right">
                  Check-out Time
                </Label>
                <Input
                  id="edit-check-out"
                  type="time"
                  value={selectedRecord.checkOutTime || ''}
                  onChange={(e) => setSelectedRecord({...selectedRecord, checkOutTime: e.target.value})}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-reason" className="text-right">
                  Reason
                </Label>
                <Input
                  id="edit-reason"
                  value={selectedRecord.reason || ''}
                  onChange={(e) => setSelectedRecord({...selectedRecord, reason: e.target.value})}
                  className="col-span-3"
                  placeholder="Required for Absent/Excused"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-notes" className="text-right">
                  Notes
                </Label>
                <Textarea
                  id="edit-notes"
                  value={selectedRecord.notes || ''}
                  onChange={(e) => setSelectedRecord({...selectedRecord, notes: e.target.value})}
                  className="col-span-3"
                  placeholder="Additional notes"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRecord}>Update Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this attendance record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {selectedRecord && (
            <div className="py-4">
              <p><strong>Teacher:</strong> {selectedRecord.teacherName}</p>
              <p><strong>Date:</strong> {format(new Date(selectedRecord.date), "PPP")}</p>
              <p><strong>Status:</strong> {selectedRecord.status}</p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteRecord}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
