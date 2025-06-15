'use client';

import React from 'react';
import { ActivityTypeIconsDemo } from '@/components/shared/entities/students/ActivityTypeIconsDemo';
import { ActivityCardExamples } from '@/components/shared/entities/students/ActivityCardExample';

export default function ActivityIconsPage() {
  return (
    <div className="container py-8 space-y-12">
      <div>
        <h1 className="text-3xl font-bold mb-2">Custom Activity Type Icons</h1>
        <p className="text-muted-foreground">
          Modern, visually distinct icons for different activity types with unique visual distinction.
        </p>
      </div>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Icon Showcase</h2>
        <ActivityTypeIconsDemo />
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Activity Card Examples</h2>
        <p className="text-muted-foreground mb-6">
          Examples of how the custom icons look in activity cards with different statuses and types.
        </p>
        <ActivityCardExamples />
      </section>
    </div>
  );
}
