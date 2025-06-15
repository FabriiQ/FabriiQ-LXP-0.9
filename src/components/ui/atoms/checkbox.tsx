'use client';

/**
 * @deprecated This file is deprecated and will be removed in a future version.
 * Please use @/components/ui/core/checkbox or @/components/ui/forms/checkbox instead.
 */

import * as React from 'react';
import { Checkbox as CoreCheckbox } from '@/components/ui/checkbox';

export interface CheckboxProps extends React.ComponentPropsWithoutRef<typeof CoreCheckbox> {}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CoreCheckbox>,
  CheckboxProps
>(({ ...props }, ref) => {
  return <CoreCheckbox ref={ref} {...props} />;
});

Checkbox.displayName = 'Checkbox';

export { Checkbox };
