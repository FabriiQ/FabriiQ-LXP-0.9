'use client';

/**
 * TeachingMethodsSelector
 * 
 * A reusable component for selecting teaching methods.
 * Used primarily in lesson plan creation.
 */

import React, { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Plus, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

// Define the teaching method interface
export interface TeachingMethod {
  id: string;
  name: string;
  description: string;
}

// Define common teaching methods
export const commonTeachingMethods: TeachingMethod[] = [
  {
    id: 'lecture',
    name: 'Lecture',
    description: 'Teacher-centered instruction where information is presented verbally to a group of students.',
  },
  {
    id: 'discussion',
    name: 'Discussion',
    description: 'Interactive exchange of ideas, opinions, and information between teacher and students or among students.',
  },
  {
    id: 'group_work',
    name: 'Group Work',
    description: 'Students work together in small groups to complete tasks or solve problems collaboratively.',
  },
  {
    id: 'demonstration',
    name: 'Demonstration',
    description: 'Teacher shows students how to perform a task or procedure before they attempt it themselves.',
  },
  {
    id: 'project_based',
    name: 'Project-Based Learning',
    description: 'Students gain knowledge and skills by working on a project over an extended period of time.',
  },
  {
    id: 'inquiry_based',
    name: 'Inquiry-Based Learning',
    description: 'Students explore and investigate questions, scenarios, or problems to develop their understanding.',
  },
  {
    id: 'flipped_classroom',
    name: 'Flipped Classroom',
    description: 'Students learn content at home through videos or readings, then practice and apply concepts in class.',
  },
  {
    id: 'game_based',
    name: 'Game-Based Learning',
    description: 'Using games or gamification elements to engage students and facilitate learning.',
  },
  {
    id: 'role_play',
    name: 'Role Play',
    description: 'Students act out scenarios to explore different perspectives and practice skills in a simulated environment.',
  },
  {
    id: 'peer_teaching',
    name: 'Peer Teaching',
    description: 'Students teach concepts or skills to their peers, reinforcing their own understanding.',
  },
  {
    id: 'problem_based',
    name: 'Problem-Based Learning',
    description: 'Students learn through the process of solving open-ended problems.',
  },
  {
    id: 'direct_instruction',
    name: 'Direct Instruction',
    description: 'Structured, sequential teaching method with clear objectives, demonstrations, and guided practice.',
  },
];

export interface TeachingMethodsSelectorProps {
  selectedMethods: string[];
  onMethodsChange: (methods: string[]) => void;
  customMethods?: TeachingMethod[];
  allowCustomMethods?: boolean;
  className?: string;
  label?: string;
  description?: string;
  required?: boolean;
}

export function TeachingMethodsSelector({
  selectedMethods,
  onMethodsChange,
  customMethods = [],
  allowCustomMethods = true,
  className,
  label = 'Teaching Methods',
  description = 'Select the teaching methods you plan to use.',
  required = false,
}: TeachingMethodsSelectorProps) {
  const [isAddingCustomMethod, setIsAddingCustomMethod] = useState(false);
  const [customMethodName, setCustomMethodName] = useState('');
  const [customMethodDescription, setCustomMethodDescription] = useState('');
  
  // Combine common and custom methods
  const allMethods = [...commonTeachingMethods, ...customMethods];
  
  // Handle method selection
  const handleMethodChange = (methodId: string, isChecked: boolean) => {
    if (isChecked) {
      onMethodsChange([...selectedMethods, methodId]);
    } else {
      onMethodsChange(selectedMethods.filter(id => id !== methodId));
    }
  };
  
  // Handle adding a custom method
  const handleAddCustomMethod = () => {
    if (!customMethodName.trim()) return;
    
    const newMethod: TeachingMethod = {
      id: `custom_${Date.now()}`,
      name: customMethodName.trim(),
      description: customMethodDescription.trim() || 'Custom teaching method',
    };
    
    customMethods.push(newMethod);
    onMethodsChange([...selectedMethods, newMethod.id]);
    
    // Reset form
    setCustomMethodName('');
    setCustomMethodDescription('');
    setIsAddingCustomMethod(false);
  };
  
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex justify-between items-center">
        <div>
          <Label className={required ? 'after:content-["*"] after:ml-0.5 after:text-red-500' : ''}>
            {label}
          </Label>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        
        {allowCustomMethods && (
          <Dialog open={isAddingCustomMethod} onOpenChange={setIsAddingCustomMethod}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Custom
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Custom Teaching Method</DialogTitle>
                <DialogDescription>
                  Create a custom teaching method that's not in the predefined list.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="method-name">Method Name</Label>
                  <Input
                    id="method-name"
                    value={customMethodName}
                    onChange={(e) => setCustomMethodName(e.target.value)}
                    placeholder="Enter method name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="method-description">Description (Optional)</Label>
                  <Input
                    id="method-description"
                    value={customMethodDescription}
                    onChange={(e) => setCustomMethodDescription(e.target.value)}
                    placeholder="Enter a brief description"
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddingCustomMethod(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddCustomMethod} disabled={!customMethodName.trim()}>
                  Add Method
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {allMethods.map((method) => (
          <div key={method.id} className="flex items-center space-x-2">
            <Checkbox
              id={`method-${method.id}`}
              checked={selectedMethods.includes(method.id)}
              onCheckedChange={(checked) => handleMethodChange(method.id, checked === true)}
            />
            <div className="flex items-center">
              <label
                htmlFor={`method-${method.id}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {method.name}
              </label>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-1">
                      <Info className="h-3 w-3" />
                      <span className="sr-only">Info</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{method.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        ))}
      </div>
      
      {required && selectedMethods.length === 0 && (
        <p className="text-sm text-red-500">At least one teaching method is required.</p>
      )}
    </div>
  );
}
