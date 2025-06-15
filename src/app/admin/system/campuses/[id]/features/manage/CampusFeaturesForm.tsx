'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/forms/switch';
import { Card } from '@/components/ui/card';

interface CampusFeatures {
  enableAttendance: boolean;
  enableGrading: boolean;
  enableAssignments: boolean;
  enableCourseRegistration: boolean;
  enableStudentPortal: boolean;
  enableTeacherPortal: boolean;
  enableParentPortal: boolean;
  enableLibrary: boolean;
  enableEvents: boolean;
}

interface CampusFeaturesFormProps {
  campusId: string;
  features: CampusFeatures;
}

export function CampusFeaturesForm({ campusId, features }: CampusFeaturesFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [featureState, setFeatureState] = useState<CampusFeatures>(features);

  const handleToggle = (feature: keyof CampusFeatures) => {
    setFeatureState(prev => ({
      ...prev,
      [feature]: !prev[feature]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Here you would typically call your API to save the features
      // For now, we'll just simulate a successful update
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Show success message (using browser alert for simplicity)
      alert("Campus features have been updated successfully.");

      router.refresh();
    } catch (error) {
      // Show error message
      alert("Failed to update campus features. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const featureItems = [
    { key: 'enableAttendance', label: 'Attendance Tracking' },
    { key: 'enableGrading', label: 'Grading System' },
    { key: 'enableAssignments', label: 'Assignments' },
    { key: 'enableCourseRegistration', label: 'Course Registration' },
    { key: 'enableStudentPortal', label: 'Student Portal' },
    { key: 'enableTeacherPortal', label: 'Teacher Portal' },
    { key: 'enableParentPortal', label: 'Parent Portal' },
    { key: 'enableLibrary', label: 'Library Management' },
    { key: 'enableEvents', label: 'Events Calendar' },
  ];

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        {featureItems.map(item => (
          <div key={item.key} className="flex items-center justify-between py-3 border-b">
            <div>
              <div className="text-base font-medium">
                {item.label}
              </div>
              <p className="text-sm text-muted-foreground">
                {`Enable ${item.label.toLowerCase()} functionality for this campus`}
              </p>
            </div>
            <Switch
              id={item.key}
              checked={featureState[item.key as keyof CampusFeatures]}
              onCheckedChange={() => handleToggle(item.key as keyof CampusFeatures)}
              disabled={isSubmitting}
            />
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
} 