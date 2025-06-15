'use client';

import { useState } from 'react';
import { useForm, FormProvider, Control, FieldValues } from 'react-hook-form';
import { FormField } from '@/components/ui/forms/form-field';
import { Select, SelectOption } from '@/components/ui/forms/select';
import { useToast } from '@/components/ui/feedback/toast';
import { useModal } from '@/components/ui/feedback/modal';
import { Tabs } from '@/components/ui/navigation/tabs';
import { Accordion } from '@/components/ui/data-display/accordion';

export default function ExamplesPage() {
  const methods = useForm();
  const { addToast } = useToast();
  const { open: openModal, close: closeModal } = useModal();
  
  // Select options
  const selectOptions: SelectOption[] = [
    { value: 'react', label: 'React' },
    { value: 'vue', label: 'Vue' },
    { value: 'angular', label: 'Angular' },
    { value: 'svelte', label: 'Svelte' },
    { value: 'nextjs', label: 'Next.js' },
  ];
  
  // Tab items
  const tabItems = [
    {
      id: 'forms',
      label: 'Form Components',
      content: (
        <div className="space-y-6 p-4">
          <h3 className="text-lg font-medium">Form Components</h3>
          <FormProvider {...methods}>
            <div className="space-y-4">
              <FormField
                name="email"
                label="Email Address"
                placeholder="Enter your email"
                helperText="We'll never share your email with anyone else."
                type="email"
                required
              />
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Framework</label>
                <Select
                  options={selectOptions}
                  placeholder="Select a framework"
                  onChange={(option) => console.log(option)}
                />
              </div>
            </div>
          </FormProvider>
        </div>
      ),
    },
    {
      id: 'feedback',
      label: 'Feedback Components',
      content: (
        <div className="space-y-6 p-4">
          <h3 className="text-lg font-medium">Feedback Components</h3>
          <div className="flex flex-wrap gap-4">
            <button
              className="px-4 py-2 bg-green-500 text-white rounded-md"
              onClick={() => addToast({
                title: 'Success!',
                description: 'Your action was completed successfully.',
                type: 'success',
              })}
            >
              Success Toast
            </button>
            
            <button
              className="px-4 py-2 bg-red-500 text-white rounded-md"
              onClick={() => addToast({
                title: 'Error!',
                description: 'An error occurred while processing your request.',
                type: 'error',
              })}
            >
              Error Toast
            </button>
            
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded-md"
              onClick={() => addToast({
                title: 'Info',
                description: 'Here is some information you might find useful.',
                type: 'info',
              })}
            >
              Info Toast
            </button>
            
            <button
              className="px-4 py-2 bg-orange-500 text-white rounded-md"
              onClick={() => addToast({
                title: 'Warning',
                description: 'Please be careful with this action.',
                type: 'warning',
              })}
            >
              Warning Toast
            </button>
            
            <button
              className="px-4 py-2 bg-purple-500 text-white rounded-md"
              onClick={() => openModal({
                title: 'Confirmation',
                description: 'Please confirm your action',
                children: (
                  <div>
                    <p>Are you sure you want to proceed?</p>
                    <div className="flex justify-end gap-2 mt-4">
                      <button 
                        className="px-4 py-2 bg-gray-200 rounded-md"
                        onClick={() => closeModal()}
                      >
                        Cancel
                      </button>
                      <button 
                        className="px-4 py-2 bg-blue-500 text-white rounded-md"
                        onClick={() => {
                          addToast({
                            title: 'Confirmed',
                            description: 'Your action has been confirmed.',
                            type: 'success',
                          });
                          closeModal();
                        }}
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                ),
              })}
            >
              Open Modal
            </button>
          </div>
        </div>
      ),
    },
    {
      id: 'data',
      label: 'Data Display',
      content: (
        <div className="space-y-6 p-4">
          <h3 className="text-lg font-medium">Data Display Components</h3>
          
          <Accordion
            items={[
              {
                id: 'accordion1',
                title: 'What is Aivy LXP?',
                content: (
                  <p>Aivy LXP is a Learning Experience Platform designed to provide a modern and engaging learning experience for users.</p>
                ),
              },
              {
                id: 'accordion2',
                title: 'How do I get started?',
                content: (
                  <p>To get started, simply create an account and explore the available courses and learning paths.</p>
                ),
              },
              {
                id: 'accordion3',
                title: 'Is there a mobile app?',
                content: (
                  <p>Yes, Aivy LXP is available on iOS and Android devices. You can download the app from the respective app stores.</p>
                ),
              },
            ]}
            defaultExpandedIds={['accordion1']}
            variant="bordered"
          />
        </div>
      ),
    },
  ];
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">UI Component Examples</h1>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <Tabs
          items={tabItems}
          defaultTabId="forms"
          variant="underline"
        />
      </div>
    </div>
  );
} 