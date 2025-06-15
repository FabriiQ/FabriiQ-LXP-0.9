'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { 
  Search, 
  ArrowRight, 
  Users, 
  UserPlus, 
  Loader2, 
  Filter, 
  CheckCircle, 
  XCircle,
  AlertCircle
} from 'lucide-react';
import { api } from '@/utils/api';

interface ClassTransferManagerProps {
  initialClassId?: string;
}

/**
 * ClassTransferManager Component
 * 
 * Manages class transfers for students and teacher assignments.
 * Allows coordinators to move students between classes and reassign teachers.
 */
export function ClassTransferManager({ initialClassId }: ClassTransferManagerProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('individual');
  const [fromClassId, setFromClassId] = useState(initialClassId || '');
  const [toClassId, setToClassId] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch available classes
  const classesQuery = api.class.getClasses.useQuery({
    status: 'ACTIVE',
    limit: 100
  });
  
  // Fetch students from the selected class
  const studentsQuery = api.class.getClassStudents.useQuery({
    classId: fromClassId
  }, {
    enabled: !!fromClassId
  });
  
  // Create transfer mutation
  const createTransferMutation = api.classTransfer.createTransfer.useMutation({
    onSuccess: () => {
      toast({
        title: "Transfer request created",
        description: "The transfer request has been submitted successfully.",
        variant: "success",
      });
      setSelectedStudents([]);
      setReason('');
      setIsSubmitting(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create transfer request",
        variant: "error",
      });
      setIsSubmitting(false);
    }
  });
  
  // Create batch transfer mutation
  const createBatchTransferMutation = api.classTransfer.createBatchTransfer.useMutation({
    onSuccess: () => {
      toast({
        title: "Batch transfer request created",
        description: "The batch transfer request has been submitted successfully.",
        variant: "success",
      });
      setSelectedStudents([]);
      setReason('');
      setIsSubmitting(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create batch transfer request",
        variant: "error",
      });
      setIsSubmitting(false);
    }
  });
  
  // Filter students based on search query
  const filteredStudents = studentsQuery.data?.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];
  
  // Handle student selection
  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };
  
  // Handle select all students
  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(student => student.id));
    }
  };
  
  // Handle individual transfer submission
  const handleIndividualTransfer = async () => {
    if (!fromClassId || !toClassId || selectedStudents.length === 0) {
      toast({
        title: "Missing information",
        description: "Please select source class, destination class, and at least one student.",
        variant: "warning",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await Promise.all(
        selectedStudents.map(studentId => 
          createTransferMutation.mutateAsync({
            studentId,
            fromClassId,
            toClassId,
            reason: reason || undefined
          })
        )
      );
    } catch (error) {
      console.error("Error creating transfers:", error);
    }
  };
  
  // Handle batch transfer submission
  const handleBatchTransfer = async () => {
    if (!fromClassId || !toClassId || selectedStudents.length === 0) {
      toast({
        title: "Missing information",
        description: "Please select source class, destination class, and at least one student.",
        variant: "warning",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await createBatchTransferMutation.mutateAsync({
        fromClassId,
        toClassId,
        studentIds: selectedStudents,
        reason: reason || undefined
      });
    } catch (error) {
      console.error("Error creating batch transfer:", error);
    }
  };
  
  // Handle transfer submission based on active tab
  const handleSubmit = () => {
    if (activeTab === 'individual') {
      handleIndividualTransfer();
    } else {
      handleBatchTransfer();
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h2 className="text-xl font-semibold">Class Transfer Manager</h2>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="individual">Individual Transfers</TabsTrigger>
          <TabsTrigger value="batch">Batch Transfers</TabsTrigger>
          <TabsTrigger value="pending">Pending Transfers</TabsTrigger>
        </TabsList>
        
        <TabsContent value="individual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transfer Students</CardTitle>
              <CardDescription>Move individual students between classes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fromClass">From Class</Label>
                  <Select value={fromClassId} onValueChange={setFromClassId}>
                    <SelectTrigger id="fromClass">
                      <SelectValue placeholder="Select source class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classesQuery.data?.map(cls => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="toClass">To Class</Label>
                  <Select value={toClassId} onValueChange={setToClassId}>
                    <SelectTrigger id="toClass">
                      <SelectValue placeholder="Select destination class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classesQuery.data?.filter(cls => cls.id !== fromClassId).map(cls => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="reason">Reason for Transfer</Label>
                <Textarea 
                  id="reason" 
                  placeholder="Enter reason for transfer (optional)" 
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="selectAll" 
                      checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                    <Label htmlFor="selectAll">Select All</Label>
                  </div>
                  
                  <div className="relative w-full max-w-sm ml-auto">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search students..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="border rounded-md">
                  {studentsQuery.isLoading ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      <span className="ml-2">Loading students...</span>
                    </div>
                  ) : filteredStudents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8">
                      <Users className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">No students found</h3>
                      <p className="text-sm text-muted-foreground">
                        {fromClassId ? "No students match your search criteria" : "Please select a class"}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredStudents.map(student => (
                        <div 
                          key={student.id} 
                          className="flex items-center p-3 hover:bg-muted/50 cursor-pointer"
                          onClick={() => toggleStudentSelection(student.id)}
                        >
                          <Checkbox 
                            checked={selectedStudents.includes(student.id)}
                            className="mr-3"
                            onCheckedChange={() => toggleStudentSelection(student.id)}
                          />
                          <Avatar className="h-8 w-8 mr-3">
                            <AvatarImage src={student.avatar || undefined} alt={student.name} />
                            <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{student.name}</div>
                            <div className="text-xs text-muted-foreground">{student.email}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => {
                setSelectedStudents([]);
                setReason('');
              }}>
                Reset
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting || !fromClassId || !toClassId || selectedStudents.length === 0}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Transfer Request
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="batch" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Batch Transfer</CardTitle>
              <CardDescription>Move multiple students between classes at once</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Batch transfer content will be implemented here</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Transfers</CardTitle>
              <CardDescription>View and manage pending transfer requests</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Pending transfers content will be implemented here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
