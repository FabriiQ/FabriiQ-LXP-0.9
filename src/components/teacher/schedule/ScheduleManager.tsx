"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/utils/api";
import { useToast } from "@/components/ui/feedback/toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/forms/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/forms/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/atoms/skeleton";
import { Clock, Edit, Trash } from "lucide-react";
import { format, parseISO } from "date-fns";
import { DayOfWeek, PeriodType, SystemStatus } from "@prisma/client";

interface ScheduleManagerProps {
  teacherId: string;
}

interface FieldProps {
  field: {
    value: any;
    onChange: (value: any) => void;
  };
}

interface Class {
  id: string;
  name: string;
  subject: {
    id: string;
    name: string;
  };
}

interface ScheduleEntry {
  id: string;
  classId: string;
  teacherId: string;
  facilityId: string;
  dayOfWeek: DayOfWeek;
  periodType: PeriodType;
  startTime: string;
  endTime: string;
  notes?: string;
  status: SystemStatus;
  class: {
    name: string;
    subject: {
      name: string;
    };
  };
}

const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Form schema
const scheduleFormSchema = z.object({
  classId: z.string().min(1, "Class is required"),
  dayOfWeek: z.nativeEnum(DayOfWeek),
  periodType: z.nativeEnum(PeriodType).default(PeriodType.LECTURE),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format. Use HH:mm"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format. Use HH:mm"),
  facilityId: z.string().min(1, "Location is required"),
  notes: z.string().optional(),
});

type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;

export default function ScheduleManager({ teacherId }: ScheduleManagerProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<"list" | "calendar">("list");

  // Get current academic term
  const { data: currentTerm } = api.term.getCurrent.useQuery();
  const termId = currentTerm?.id || "";

  // Get teacher's classes
  const { data: classes, isLoading: isLoadingClasses } = api.teacher.getTeacherClasses.useQuery(
    { teacherId },
    { enabled: !!teacherId }
  );

  // Get facilities
  const { data: facilities, isLoading: isLoadingFacilities } = api.facility.getFacilitiesByCampus.useQuery(
    {
      campusId: currentTerm?.campusId || "",
      type: "CLASSROOM",
      status: SystemStatus.ACTIVE,
    },
    {
      enabled: !!currentTerm?.campusId,
    }
  );

  // Get teacher's schedule
  const { data: scheduleData, isLoading: isLoadingSchedule } = api.schedule.list.useQuery(
    {
      teacherId,
      termId: currentTerm?.id,
      status: SystemStatus.ACTIVE,
      page: 1,
      pageSize: 100,
    },
    {
      enabled: !!teacherId && !!currentTerm?.id,
    }
  );

  const schedule = scheduleData?.items || [];

  // Mutations
  const utils = api.useContext();

  const createScheduleMutation = api.schedule.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Schedule created successfully",
      });
      setIsDialogOpen(false);
      utils.schedule.list.invalidate();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateScheduleMutation = api.schedule.update.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Schedule updated successfully",
      });
      setIsDialogOpen(false);
      utils.schedule.list.invalidate();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteScheduleMutation = api.schedule.delete.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Schedule deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      utils.schedule.list.invalidate();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form for creating/editing schedule
  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      classId: "",
      dayOfWeek: DayOfWeek.MONDAY,
      periodType: PeriodType.LECTURE,
      startTime: "09:00",
      endTime: "10:00",
      facilityId: "",
      notes: "",
    },
  });

  // Handle form submission
  const onSubmit = (values: ScheduleFormValues) => {
    if (selectedScheduleId) {
      updateScheduleMutation.mutate({
        id: selectedScheduleId,
        data: {
          dayOfWeek: values.dayOfWeek,
          periodType: values.periodType,
          startTime: values.startTime,
          endTime: values.endTime,
          facilityId: values.facilityId,
          notes: values.notes,
        },
      });
    } else {
      createScheduleMutation.mutate({
        classId: values.classId,
        teacherId,
        facilityId: values.facilityId,
        dayOfWeek: values.dayOfWeek,
        periodType: values.periodType,
        startTime: values.startTime,
        endTime: values.endTime,
        notes: values.notes,
        status: SystemStatus.ACTIVE,
      });
    }
  };

  // Handle edit schedule
  const handleEditSchedule = (scheduleId: string) => {
    const scheduleToEdit = schedule.find((s) => s.id === scheduleId);
    if (scheduleToEdit) {
      form.reset({
        classId: scheduleToEdit.classId,
        dayOfWeek: scheduleToEdit.dayOfWeek,
        periodType: scheduleToEdit.periodType,
        startTime: scheduleToEdit.startTime,
        endTime: scheduleToEdit.endTime,
        facilityId: scheduleToEdit.facilityId,
        notes: scheduleToEdit.notes || "",
      });
      setSelectedScheduleId(scheduleId);
      setIsDialogOpen(true);
    }
  };

  // Handle delete schedule
  const handleDeleteSchedule = (scheduleId: string) => {
    setSelectedScheduleId(scheduleId);
    setIsDeleteDialogOpen(true);
  };

  // Handle add schedule
  const handleAddSchedule = () => {
    setSelectedScheduleId(null);
    form.reset({
      classId: "",
      dayOfWeek: DayOfWeek.MONDAY,
      periodType: PeriodType.LECTURE,
      startTime: "09:00",
      endTime: "10:00",
      facilityId: "",
      notes: "",
    });
    setIsDialogOpen(true);
  };

  // Group schedule by day of week
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  // Map day of week string to number
  const dayOfWeekMap: Record<string, number> = {
    "MONDAY": 0,
    "TUESDAY": 1,
    "WEDNESDAY": 2,
    "THURSDAY": 3,
    "FRIDAY": 4,
    "SATURDAY": 5,
    "SUNDAY": 6
  };

  const scheduleByDay = days.map((day, index) => {
    return {
      day,
      entries: schedule.filter((entry: any) => dayOfWeekMap[entry.dayOfWeek] === index) || [],
    };
  });

  // Loading state
  if (isLoadingClasses || isLoadingSchedule || isLoadingFacilities) {
    return <ScheduleManagerSkeleton />;
  }

  // Get facility name by ID
  const getFacilityName = (facilityId: string) => {
    const facility = facilities?.facilities.find((f) => f.id === facilityId);
    return facility ? facility.name : facilityId;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Schedule Manager</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentView("list")}>
                List View
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentView("calendar")}>
                Calendar View
              </Button>
              <Button size="sm" onClick={handleAddSchedule}>
                Add Schedule
              </Button>
            </div>
          </div>
          <CardDescription>
            Manage your teaching schedule
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentView === "list" ? (
            <div className="space-y-6">
              {scheduleByDay.map((daySchedule, index) => (
                <div key={index}>
                  <h3 className="font-medium mb-3">{daySchedule.day}</h3>
                  {daySchedule.entries.length === 0 ? (
                    <p className="text-gray-500 text-sm">No classes scheduled</p>
                  ) : (
                    <div className="space-y-3">
                      {daySchedule.entries
                        .sort((a: any, b: any) => a.startTime.localeCompare(b.startTime))
                        .map((entry: any) => (
                          <div key={entry.id} className="p-3 border rounded-md">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{entry.class.name}</h4>
                                <p className="text-sm text-gray-500">
                                  {entry.class.subject.name}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditSchedule(entry.id)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteSchedule(entry.id)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <div className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                <span>
                                  {format(parseISO(`2000-01-01T${entry.startTime}`), "h:mm a")} -
                                  {format(parseISO(`2000-01-01T${entry.endTime}`), "h:mm a")}
                                </span>
                              </div>
                              {entry.facilityId && (
                                <div>
                                  <span>Location: {getFacilityName(entry.facilityId)}</span>
                                </div>
                              )}
                            </div>

                            {entry.notes && (
                              <div className="mt-2 text-sm">
                                <p className="text-gray-500">{entry.notes}</p>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-4">
              {scheduleByDay.map((daySchedule, index) => (
                <div key={index} className="border rounded-md p-2">
                  <h3 className="font-medium text-center p-2 bg-gray-50 rounded-md mb-2">
                    {daySchedule.day}
                  </h3>

                  {daySchedule.entries.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center p-4">No classes</p>
                  ) : (
                    <div className="space-y-3">
                      {daySchedule.entries
                        .sort((a: any, b: any) => a.startTime.localeCompare(b.startTime))
                        .map((entry: any) => (
                          <Card key={entry.id}>
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <h4 className="font-medium text-sm">{entry.class.name}</h4>
                                <div className="flex">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => handleEditSchedule(entry.id)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>

                              <div className="text-xs text-gray-500 mt-1">
                                <div className="flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  <span>
                                    {format(parseISO(`2000-01-01T${entry.startTime}`), "h:mm a")} -
                                    {format(parseISO(`2000-01-01T${entry.endTime}`), "h:mm a")}
                                  </span>
                                </div>

                                {entry.facilityId && (
                                  <div className="mt-1">
                                    <span>Location: {getFacilityName(entry.facilityId)}</span>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog for adding/editing schedule */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedScheduleId ? "Edit Schedule" : "Add Schedule"}
            </DialogTitle>
            <DialogDescription>
              {selectedScheduleId
                ? "Update the details of this schedule entry"
                : "Add a new entry to your teaching schedule"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {!selectedScheduleId && (
                <FormField
                  control={form.control}
                  name="classId"
                  render={({ field }: FieldProps) => (
                    <FormItem>
                      <FormLabel>Class</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a class" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {classes?.items?.map((cls: any) => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name} - {cls.subject.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {!selectedScheduleId && (
                <FormField
                  control={form.control}
                  name="dayOfWeek"
                  render={({ field }: FieldProps) => (
                    <FormItem>
                      <FormLabel>Day of Week</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select day" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={DayOfWeek.MONDAY}>Monday</SelectItem>
                          <SelectItem value={DayOfWeek.TUESDAY}>Tuesday</SelectItem>
                          <SelectItem value={DayOfWeek.WEDNESDAY}>Wednesday</SelectItem>
                          <SelectItem value={DayOfWeek.THURSDAY}>Thursday</SelectItem>
                          <SelectItem value={DayOfWeek.FRIDAY}>Friday</SelectItem>
                          <SelectItem value={DayOfWeek.SATURDAY}>Saturday</SelectItem>
                          <SelectItem value={DayOfWeek.SUNDAY}>Sunday</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="periodType"
                render={({ field }: FieldProps) => (
                  <FormItem>
                    <FormLabel>Period Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select period type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={PeriodType.LECTURE}>Lecture</SelectItem>
                        <SelectItem value={PeriodType.LAB}>Lab</SelectItem>
                        <SelectItem value={PeriodType.TUTORIAL}>Tutorial</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }: FieldProps) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }: FieldProps) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="facilityId"
                render={({ field }: FieldProps) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a facility" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {facilities?.facilities.map((facility) => (
                          <SelectItem key={facility.id} value={facility.id}>
                            {facility.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }: FieldProps) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any additional notes"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit">
                  {selectedScheduleId ? "Update Schedule" : "Add Schedule"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog for confirming deletion */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this schedule entry. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedScheduleId && deleteScheduleMutation.mutate({ id: selectedScheduleId })}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ScheduleManagerSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-64 mb-6" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="bg-muted/50 p-4">
                  <Skeleton className="h-5 w-24" />
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {Array.from({ length: 2 }).map((_, j) => (
                      <Skeleton key={j} className="h-24 w-full rounded-md" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}