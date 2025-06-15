'use client';

import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/core/card';
import { Button } from '@/components/ui/core/button';
import { Input } from '@/components/ui/core/input';
import { Label } from '@/components/ui/core/label';
import { Textarea } from '@/components/ui/core/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/core/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/core/popover';
import { Calendar } from '@/components/ui/core/calendar';
import { Checkbox } from '@/components/ui/core/checkbox';
import { Skeleton } from '@/components/ui/core/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/core/alert';
import { 
  AlertCircle, 
  Calendar as CalendarIcon, 
  Save, 
  X, 
  Loader2 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { 
  StudentFormData, 
  StudentStatus, 
  UserRole 
} from './types';

export interface StudentFormProps {
  /**
   * User role for role-specific rendering
   */
  userRole: UserRole;
  
  /**
   * Initial form data
   */
  initialData?: Partial<StudentFormData>;
  
  /**
   * Whether this is a new student form
   * @default false
   */
  isNew?: boolean;
  
  /**
   * Available programs for selection
   */
  availablePrograms?: { id: string; name: string }[];
  
  /**
   * Available campuses for selection
   */
  availableCampuses?: { id: string; name: string }[];
  
  /**
   * Available classes for selection
   */
  availableClasses?: { id: string; name: string }[];
  
  /**
   * Submit callback
   */
  onSubmit: (data: StudentFormData) => void;
  
  /**
   * Cancel callback
   */
  onCancel?: () => void;
  
  /**
   * Loading state
   * @default false
   */
  isLoading?: boolean;
  
  /**
   * Error message
   */
  error?: string;
  
  /**
   * Optional className for custom styling
   */
  className?: string;
}

/**
 * StudentForm component with mobile-first design
 * 
 * Features:
 * - Role-based field visibility
 * - Validation
 * - Date picker
 * - Multi-select for classes
 * 
 * @example
 * ```tsx
 * <StudentForm 
 *   userRole={UserRole.CAMPUS_ADMIN}
 *   initialData={{ name: 'John Doe', email: 'john@example.com' }}
 *   onSubmit={handleSubmit}
 *   onCancel={handleCancel}
 * />
 * ```
 */
export const StudentForm: React.FC<StudentFormProps> = ({
  userRole,
  initialData = {},
  isNew = false,
  availablePrograms = [],
  availableCampuses = [],
  availableClasses = [],
  onSubmit,
  onCancel,
  isLoading = false,
  error,
  className,
}) => {
  // Form state
  const [formData, setFormData] = useState<Partial<StudentFormData>>({
    status: StudentStatus.ACTIVE,
    ...initialData,
  });
  
  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Date picker state
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Handle select change
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Handle date change
  const handleDateChange = (date: Date | undefined) => {
    setFormData(prev => ({ ...prev, dateOfBirth: date }));
    setIsDatePickerOpen(false);
    
    // Clear error for this field
    if (errors.dateOfBirth) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.dateOfBirth;
        return newErrors;
      });
    }
  };
  
  // Handle class selection
  const handleClassChange = (classId: string, checked: boolean) => {
    const currentClasses = formData.classIds || [];
    
    if (checked) {
      setFormData(prev => ({
        ...prev,
        classIds: [...currentClasses, classId],
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        classIds: currentClasses.filter(id => id !== classId),
      }));
    }
    
    // Clear error for this field
    if (errors.classIds) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.classIds;
        return newErrors;
      });
    }
  };
  
  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Required fields
    if (!formData.name) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.status) {
      newErrors.status = 'Status is required';
    }
    
    // Password is required for new students
    if (isNew && !formData.password) {
      newErrors.password = 'Password is required for new students';
    }
    
    // Enrollment number is required
    if (!formData.enrollmentNumber) {
      newErrors.enrollmentNumber = 'Enrollment number is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData as StudentFormData);
    }
  };
  
  // Determine which fields to show based on user role
  const canEditStatus = userRole === UserRole.SYSTEM_ADMIN || userRole === UserRole.CAMPUS_ADMIN;
  const canEditCampus = userRole === UserRole.SYSTEM_ADMIN;
  const canEditProgram = userRole === UserRole.SYSTEM_ADMIN || userRole === UserRole.CAMPUS_ADMIN;
  const canEditClasses = userRole !== UserRole.STUDENT;
  
  // Render loading skeleton
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex justify-between w-full">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </CardFooter>
      </Card>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  return (
    <Card className={className}>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>{isNew ? 'Add New Student' : 'Edit Student'}</CardTitle>
          <CardDescription>
            {isNew 
              ? 'Create a new student account' 
              : 'Update student information'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name || ''}
                    onChange={handleInputChange}
                    placeholder="Enter full name"
                    className={errors.name ? 'border-destructive' : ''}
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive">{errors.name}</p>
                  )}
                </div>
                
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email}</p>
                  )}
                </div>
                
                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                  />
                </div>
                
                {/* Enrollment Number */}
                <div className="space-y-2">
                  <Label htmlFor="enrollmentNumber">
                    Enrollment Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="enrollmentNumber"
                    name="enrollmentNumber"
                    value={formData.enrollmentNumber || ''}
                    onChange={handleInputChange}
                    placeholder="Enter enrollment number"
                    className={errors.enrollmentNumber ? 'border-destructive' : ''}
                  />
                  {errors.enrollmentNumber && (
                    <p className="text-xs text-destructive">{errors.enrollmentNumber}</p>
                  )}
                </div>
                
                {/* Date of Birth */}
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        id="dateOfBirth"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.dateOfBirth && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.dateOfBirth ? (
                          format(formData.dateOfBirth, 'PPP')
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        selected={formData.dateOfBirth}
                        onSelect={handleDateChange}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                {/* Gender */}
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={formData.gender || ''}
                    onValueChange={(value) => handleSelectChange('gender', value)}
                  >
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  name="address"
                  value={formData.address || ''}
                  onChange={handleInputChange}
                  placeholder="Enter address"
                  rows={3}
                />
              </div>
            </div>
            
            {/* Academic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Academic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Campus */}
                {canEditCampus && (
                  <div className="space-y-2">
                    <Label htmlFor="campusId">Campus</Label>
                    <Select
                      value={formData.campusId || ''}
                      onValueChange={(value) => handleSelectChange('campusId', value)}
                    >
                      <SelectTrigger id="campusId">
                        <SelectValue placeholder="Select campus" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {availableCampuses.map(campus => (
                          <SelectItem key={campus.id} value={campus.id}>
                            {campus.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {/* Program */}
                {canEditProgram && (
                  <div className="space-y-2">
                    <Label htmlFor="programId">Program</Label>
                    <Select
                      value={formData.programId || ''}
                      onValueChange={(value) => handleSelectChange('programId', value)}
                    >
                      <SelectTrigger id="programId">
                        <SelectValue placeholder="Select program" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {availablePrograms.map(program => (
                          <SelectItem key={program.id} value={program.id}>
                            {program.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {/* Status */}
                {canEditStatus && (
                  <div className="space-y-2">
                    <Label htmlFor="status">
                      Status <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.status || StudentStatus.ACTIVE}
                      onValueChange={(value) => handleSelectChange('status', value)}
                    >
                      <SelectTrigger id="status" className={errors.status ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(StudentStatus).map(status => (
                          <SelectItem key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.status && (
                      <p className="text-xs text-destructive">{errors.status}</p>
                    )}
                  </div>
                )}
              </div>
              
              {/* Classes */}
              {canEditClasses && availableClasses.length > 0 && (
                <div className="space-y-2">
                  <Label>Classes</Label>
                  <div className="border rounded-md p-4 space-y-2 max-h-40 overflow-y-auto">
                    {availableClasses.map(cls => (
                      <div key={cls.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`class-${cls.id}`}
                          checked={(formData.classIds || []).includes(cls.id)}
                          onCheckedChange={(checked) => 
                            handleClassChange(cls.id, checked as boolean)
                          }
                        />
                        <Label 
                          htmlFor={`class-${cls.id}`}
                          className="text-sm cursor-pointer"
                        >
                          {cls.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Account Information */}
            {isNew && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Account Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="password">
                    Password {isNew && <span className="text-destructive">*</span>}
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password || ''}
                    onChange={handleInputChange}
                    placeholder="Enter password"
                    className={errors.password ? 'border-destructive' : ''}
                  />
                  {errors.password && (
                    <p className="text-xs text-destructive">{errors.password}</p>
                  )}
                  {isNew && (
                    <p className="text-xs text-muted-foreground">
                      Password will be sent to the student's email address.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}
          
          <Button
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isNew ? 'Create Student' : 'Save Changes'}
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default StudentForm;
