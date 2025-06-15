'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/feedback/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { StudentTransferForm } from './StudentTransferForm';

interface Class {
  id: string;
  name: string;
  code: string;
  campusId: string;
  campusName?: string;
}

interface Campus {
  id: string;
  name: string;
  code: string;
}

interface StudentTransferDialogProps {
  studentId: string;
  studentName: string;
  currentClasses: Class[];
  availableClasses: Class[];
  currentCampusId: string;
  availableCampuses: Campus[];
  userId: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function StudentTransferDialog({
  studentId,
  studentName,
  currentClasses,
  availableClasses,
  currentCampusId,
  availableCampuses,
  userId,
  trigger,
  onSuccess,
}: StudentTransferDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Transfer Student</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Transfer {studentName}</DialogTitle>
          <DialogDescription>
            Transfer the student to a different class or campus
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="class">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="class">Class Transfer</TabsTrigger>
            <TabsTrigger value="campus">Campus Transfer</TabsTrigger>
          </TabsList>

          <TabsContent value="class" className="pt-4">
            <StudentTransferForm
              studentId={studentId}
              studentName={studentName}
              transferType="class"
              currentClasses={currentClasses}
              availableClasses={availableClasses}
              userId={userId}
              onSuccess={handleSuccess}
            />
          </TabsContent>

          <TabsContent value="campus" className="pt-4">
            <StudentTransferForm
              studentId={studentId}
              studentName={studentName}
              transferType="campus"
              currentCampusId={currentCampusId}
              availableCampuses={availableCampuses}
              availableClasses={availableClasses}
              userId={userId}
              onSuccess={handleSuccess}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
