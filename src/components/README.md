# Aivy LXP UI Component Library

This directory contains reusable UI components for the Aivy Learning Experience Platform. These components are designed to be flexible, accessible, and consistent with our design system. All components are built with a mobile-first approach, optimized for performance, and follow shadcn/ui design principles.

## Directory Structure

```
src/components/
├── auth/                 # Authentication-related components
├── campus/               # Campus management components
├── dashboard/            # Dashboard-specific components
├── institution/          # Institution management components
├── layout/               # Layout components (Shell, AppShellWrapper)
├── layouts/              # Page layout templates
├── profile/              # User profile components
├── ui/                   # UI component library
│   ├── atoms/            # Basic building blocks
│   ├── charts/           # Data visualization components
│   ├── data-display/     # Components for displaying data
│   ├── feedback/         # User feedback components
│   ├── forms/            # Form components
│   ├── molecules/        # Composite components
│   ├── navigation/       # Navigation components
│   ├── organisms/        # Complex UI patterns
│   └── tabs/             # Tab components
├── user/                 # User management components
├── providers.tsx         # React context providers
└── test-trpc.tsx         # tRPC testing utilities
```

## Complete Component Inventory

Below is a comprehensive list of all reusable components in the project, organized by directory:

### UI Components (`/ui`)

#### Atoms
- `badge.tsx` - Display small counts, status indicators, or labels
- `button.tsx` - Various button styles with different variants and sizes
- `card.tsx` - Basic card container component
- `custom-card.tsx` - Enhanced card with additional styling options
- `input.tsx` - Text input field with various states
- `label.tsx` - Form label component
- `page-header.tsx` - Page title and description component
- `separator.tsx` - Horizontal or vertical divider
- `spinner.tsx` - Loading spinner animation
- `switch.tsx` - Toggle switch component

#### Forms
- `checkbox.tsx` - Checkbox input with label and description
- `date-picker.tsx` - Date selection component with calendar
- `file-upload.tsx` - File upload component with drag and drop
- `form-field.tsx` - Form field wrapper with label and validation
- `radio.tsx` - Radio button input and radio groups
- `select.tsx` - Dropdown select component
- `textarea.tsx` - Multi-line text input

#### Feedback
- `alert.tsx` - Alert messages with different severity levels
- `modal.tsx` - Modal dialog component
- `toast.tsx` - Toast notification component
- `toast.ts` - Toast notification utilities

#### Data Display
- `accordion.tsx` - Collapsible content sections
- `card.tsx` - Card component for displaying content
- `data-card.tsx` - Card optimized for displaying data records
- `data-table.tsx` - Table component with sorting and pagination

#### Navigation
- `breadcrumbs.tsx` - Breadcrumb navigation component
- `pagination.tsx` - Pagination controls for multi-page content
- `sidebar.tsx` - Sidebar navigation component
- `tabs.tsx` - Tabbed interface component

#### Charts
- `BarChart.tsx` - Bar chart visualization
- `LineChart.tsx` - Line chart visualization
- `PieChart.tsx` - Pie chart visualization

#### Molecules
- `form.tsx` - Form container with validation
- `form-field.tsx` - Enhanced form field component
- `toast.tsx` - Toast notification implementation
- `use-toast.tsx` - Toast notification hook

#### Organisms
- `forgot-password-form.tsx` - Form for password recovery
- `login-form.tsx` - Authentication login form
- `register-form.tsx` - User registration form
- `reset-password-form.tsx` - Password reset form

### Feature-Specific Components

#### Auth Components (`/auth`)
- `AccessControl.tsx` - Role-based access control component
- `PermissionIndicator.tsx` - Visual indicator for permission status
- `ProtectedRoute.tsx` - Route protection based on authentication
- `RoleBasedNavigation.tsx` - Navigation based on user roles

#### Campus Components (`/campus`)
- `CampusDetail.tsx` - Campus details display
- `CampusForm.tsx` - Form for creating/editing campuses
- `CampusList.tsx` - List of campuses with filtering

#### Dashboard Components (`/dashboard`)
- `DashboardGreeting.tsx` - Personalized greeting component
- `DashboardMetrics.tsx` - Key metrics display
- `RoleDashboard.tsx` - Role-specific dashboard content
- `SystemAdminDashboardContent.tsx` - Admin dashboard content

#### Institution Components (`/institution`)
- `InstitutionDetail.tsx` - Institution details display
- `InstitutionForm.tsx` - Form for creating/editing institutions
- `InstitutionList.tsx` - List of institutions with filtering

#### Layout Components (`/layout`)
- `app-shell-wrapper.tsx` - Application shell wrapper
- `shell.tsx` - Main application shell with navigation

#### Layouts Components (`/layouts`)
- `authenticated-layout.tsx` - Layout for authenticated pages
- `main-layout.tsx` - Main application layout

#### Profile Components (`/profile`)
- `PasswordChangeForm.tsx` - Form for changing password
- `ProfileDisplay.tsx` - User profile information display
- `ProfileEditForm.tsx` - Form for editing profile
- `ProfileImageUpload.tsx` - Component for uploading profile images

#### User Components (`/user`)
- `notification-settings.tsx` - User notification preferences
- `password-form.tsx` - Password management form
- `preferences-form.tsx` - User preferences form
- `profile-form.tsx` - User profile form

### Utility Components
- `providers.tsx` - React context providers
- `test-trpc.tsx` - tRPC testing utilities

## Component Categories

### UI Components (`/ui`)

The UI directory follows atomic design principles and contains the following categories:

- **Atoms**: Basic building blocks like buttons, inputs, and icons
  - Purpose: Fundamental UI elements that can't be broken down further
  - Examples: Button, Input, Icon, Typography

- **Molecules**: Combinations of atoms that form simple UI components
  - Purpose: Simple components composed of multiple atoms
  - Examples: Form fields, search bars, card headers

- **Organisms**: Complex UI components composed of molecules and atoms
  - Purpose: Standalone, complex interface components
  - Examples: Navigation bars, forms, card layouts

- **Forms**: Input components for collecting user data
  - Purpose: Components specifically for form interactions
  - Examples: Input fields, checkboxes, radio buttons, select dropdowns

- **Feedback**: Components for providing feedback to users
  - Purpose: Inform users about the results of their actions
  - Examples: Alerts, toasts, progress indicators, loading states

- **Navigation**: Components for navigating between different views
  - Purpose: Help users move through the application
  - Examples: Navbar, sidebar, breadcrumbs, pagination

- **Data Display**: Components for displaying data in various formats
  - Purpose: Present information in structured ways
  - Examples: Tables, lists, cards, statistics

- **Charts**: Data visualization components
  - Purpose: Visualize data in graphical format
  - Examples: Bar charts, line charts, pie charts

### Feature-Specific Components

- **Auth Components** (`/auth`): Components related to authentication
  - Purpose: Handle user authentication flows
  - Examples: Login form, registration form, password reset

- **Campus Components** (`/campus`): Campus management
  - Purpose: Manage campus data and settings
  - Examples: Campus forms, lists, and detail views

- **Dashboard Components** (`/dashboard`): Components specific to dashboards
  - Purpose: Display analytics and summary information
  - Examples: Metric cards, activity feeds, summary charts

- **Institution Components** (`/institution`): Institution management
  - Purpose: Manage institution data and settings
  - Examples: Institution forms, lists, and detail views

- **Layout Components** (`/layout`): Application layout structure
  - Purpose: Define the overall structure of the application
  - Examples: Shell, AppShellWrapper

- **Profile Components** (`/profile`): User profile management
  - Purpose: Display and edit user profile information
  - Examples: Profile forms, avatar components

- **User Components** (`/user`): User management
  - Purpose: Manage user data and permissions
  - Examples: User forms, lists, and detail views

## Client vs. Server Components

In Next.js App Router, components are either client or server components:

### Client Components
- Must include `'use client';` directive at the top of the file
- Can use React hooks (useState, useEffect, useRouter, etc.)
- Can handle browser events
- Cannot directly access server-only resources

### Server Components
- Default in Next.js App Router (no directive needed)
- Can access server-only resources (direct DB access, file system)
- Cannot use React hooks or browser APIs
- Cannot include event handlers

## Component Guidelines

### Naming Conventions

- Use PascalCase for component names (e.g., `Button.tsx`, `InstitutionForm.tsx`)
- Use kebab-case for utility files (e.g., `form-utils.ts`)
- Group related components in directories named with kebab-case

### File Structure

Each component should follow this structure:
1. Imports
2. Type definitions
3. Component definition
4. Exports

### Component Creation Rules

1. **Single Responsibility**: Each component should do one thing well
2. **Reusability**: Design components to be reusable when possible
3. **Props Interface**: Always define a props interface for your components
4. **Default Props**: Provide sensible defaults for optional props
5. **Documentation**: Include JSDoc comments for complex components
6. **Accessibility**: Ensure components meet WCAG 2.1 AA standards
7. **Client/Server Separation**: Clearly separate client and server components

### When to Create New Components

Create a new component when:
1. The UI element is used in multiple places
2. The UI element is complex enough to warrant its own file
3. The UI element has its own state or behavior

### When to Use Existing Components

Use existing components when:
1. The UI element matches an existing component's purpose
2. The existing component can be customized via props to meet your needs

## Best Practices

### Client Components

1. Add `'use client';` directive at the very top of the file
2. Keep client components focused on UI interactions
3. Minimize the size of client components for better performance
4. Use hooks for state management and side effects

### Server Components

1. Use server components for data fetching and processing
2. Keep database queries and heavy computations in server components
3. Pass only necessary data to client components

### Performance Considerations

1. Lazy load components when possible
2. Use memoization for expensive computations
3. Optimize images and assets
4. Minimize client-side JavaScript

### Accessibility

1. Use semantic HTML elements
2. Provide appropriate ARIA attributes
3. Ensure keyboard navigation works
4. Maintain sufficient color contrast

## Troubleshooting Common Issues

### Client/Server Component Errors

If you see errors about hooks being used in server components:
1. Add `'use client';` directive at the top of the file
2. Or move the hook usage to a separate client component

### Component Rendering Issues

If components aren't rendering as expected:
1. Check for missing key props in lists
2. Verify that conditional rendering logic is correct
3. Check for CSS conflicts

### TypeScript Errors

For TypeScript errors:
1. Ensure proper typing for props and state
2. Use correct type imports from libraries
3. Add type assertions only when necessary

## Contributing New Components

When adding new components:
1. Follow the existing directory structure
2. Create appropriate tests
3. Document the component's purpose and usage
4. Update this README if adding a new category

By following these guidelines, we can maintain a clean, efficient, and scalable component library for the Aivy LXP platform.

## Design Principles

### Mobile-First Approach

All components are designed with a mobile-first approach, ensuring they work well on devices of all sizes. This means:

- Responsive layouts that adapt to different screen sizes
- Touch-friendly interaction targets
- Optimized for both portrait and landscape orientations
- Appropriate use of space on different devices

### Performance Optimization

Our components are optimized for performance to ensure a smooth user experience:

- Lazy loading of complex components
- Efficient re-rendering with React's memo and useMemo
- Code splitting to reduce initial bundle size
- Optimized animations using CSS transitions and Framer Motion
- Virtualization for long lists and large data sets

### Accessibility

All components follow WCAG 2.1 AA standards:

- Proper semantic HTML
- ARIA attributes where necessary
- Keyboard navigation support
- Color contrast compliance
- Screen reader friendly

## Atom Components

### Button

A flexible button component with different variants and sizes.

```tsx
import { Button } from '@/components/ui/atoms/button';

function MyComponent() {
  return (
    <div className="space-x-2">
      <Button>Default Button</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
      
      <Button size="sm">Small</Button>
      <Button size="lg">Large</Button>
      
      <Button isLoading>Loading</Button>
      <Button leftIcon={<Icon />}>With Icon</Button>
    </div>
  );
}
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `variant` | `'default' \| 'destructive' \| 'outline' \| 'secondary' \| 'ghost' \| 'link'` | Button style variant |
| `size` | `'default' \| 'sm' \| 'lg' \| 'icon'` | Button size |
| `isLoading` | `boolean` | Show loading spinner |
| `leftIcon` | `ReactNode` | Icon to display before text |
| `rightIcon` | `ReactNode` | Icon to display after text |
| `asChild` | `boolean` | Merge props onto child element |

### Input

A customizable input component.

```tsx
import { Input } from '@/components/ui/atoms/input';
import { Search } from 'lucide-react';

function MyComponent() {
  return (
    <div className="space-y-2">
      <Input placeholder="Default input" />
      <Input placeholder="With error" error={true} />
      <Input placeholder="Search..." leftIcon={<Search className="h-4 w-4" />} />
    </div>
  );
}
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `error` | `boolean` | Apply error styling |
| `leftIcon` | `ReactNode` | Icon to display at the left |
| `rightIcon` | `ReactNode` | Icon to display at the right |
| `wrapperClassName` | `string` | Class for the wrapper div |

## Form Components

### FormField

A flexible form field component that integrates with react-hook-form for validation.

```tsx
import { FormField } from '@/components/ui/forms/form-field';
import { useForm, FormProvider } from 'react-hook-form';

function MyForm() {
  const methods = useForm();
  
  return (
    <FormProvider {...methods}>
      <FormField
        name="email"
        label="Email Address"
        placeholder="Enter your email"
        helperText="We'll never share your email with anyone else."
        type="email"
        required
      />
    </FormProvider>
  );
}
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `name` | `string` | Field name |
| `label` | `string` | Field label |
| `placeholder` | `string` | Input placeholder |
| `helperText` | `string` | Helper text displayed below the input |
| `type` | `string` | Input type (text, email, password, etc.) |
| `required` | `boolean` | Whether the field is required |
| `disabled` | `boolean` | Whether the field is disabled |
| `className` | `string` | Additional CSS classes |

### Select

A custom select component with support for single or multiple selection, search, and custom rendering.

```tsx
import { Select } from '@/components/ui/forms/select';

function MyComponent() {
  const options = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];
  
  return (
    <Select
      options={options}
      placeholder="Select an option"
      onChange={(option) => console.log(option)}
      multiple={true}
      searchable={true}
    />
  );
}
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `options` | `SelectOption[]` | Array of options |
| `value` | `string \| string[]` | Selected value(s) |
| `onChange` | `(value: string \| string[]) => void` | Change handler |
| `placeholder` | `string` | Placeholder text |
| `multiple` | `boolean` | Enable multiple selection |
| `searchable` | `boolean` | Enable search functionality |
| `clearable` | `boolean` | Show clear button |
| `disabled` | `boolean` | Disable the select |
| `className` | `string` | Additional CSS classes |

### Checkbox

A customizable checkbox component with support for indeterminate state.

```tsx
import { Checkbox } from '@/components/ui/forms/checkbox';

function MyComponent() {
  const [checked, setChecked] = React.useState(false);
  
  return (
    <div className="space-y-4">
      <Checkbox 
        label="Accept terms and conditions" 
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
      />
      
      <Checkbox 
        label="Receive newsletter" 
        description="We'll send you weekly updates and offers"
        indeterminate={true}
      />
      
      <Checkbox 
        label="Disabled checkbox" 
        disabled={true}
      />
    </div>
  );
}
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `label` | `ReactNode` | Label for the checkbox |
| `description` | `ReactNode` | Description text displayed below the label |
| `indeterminate` | `boolean` | Whether the checkbox is in an indeterminate state |
| `error` | `string` | Error message |
| `containerClassName` | `string` | Custom class for the container |
| `checkboxClassName` | `string` | Custom class for the checkbox |
| `labelClassName` | `string` | Custom class for the label |
| `descriptionClassName` | `string` | Custom class for the description |

### Radio

A customizable radio button component with support for groups.

```tsx
import { Radio, RadioGroup } from '@/components/ui/forms/radio';

function MyComponent() {
  const [value, setValue] = React.useState('option1');
  
  return (
    <div className="space-y-6">
      {/* Individual radio button */}
      <Radio 
        name="example" 
        label="Individual radio" 
        value="example"
        checked={true}
      />
      
      {/* Radio group */}
      <RadioGroup
        name="options"
        label="Select an option"
        description="Choose the option that best fits your needs"
        value={value}
        onChange={setValue}
        options={[
          { value: 'option1', label: 'Option 1', description: 'Description for option 1' },
          { value: 'option2', label: 'Option 2', description: 'Description for option 2' },
          { value: 'option3', label: 'Option 3', disabled: true }
        ]}
        direction="horizontal"
      />
    </div>
  );
}
```

#### Radio Props

| Prop | Type | Description |
|------|------|-------------|
| `label` | `ReactNode` | Label for the radio button |
| `description` | `ReactNode` | Description text displayed below the label |
| `error` | `string` | Error message |
| `containerClassName` | `string` | Custom class for the container |
| `radioClassName` | `string` | Custom class for the radio button |
| `labelClassName` | `string` | Custom class for the label |
| `descriptionClassName` | `string` | Custom class for the description |

#### RadioGroup Props

| Prop | Type | Description |
|------|------|-------------|
| `name` | `string` | Name for the radio group |
| `label` | `ReactNode` | Label for the radio group |
| `description` | `ReactNode` | Description text displayed below the label |
| `error` | `string` | Error message |
| `options` | `Array` | Array of radio options |
| `value` | `string` | Selected value |
| `onChange` | `(value: string) => void` | Called when selection changes |
| `disabled` | `boolean` | Whether the radio group is disabled |
| `required` | `boolean` | Whether the radio group is required |
| `direction` | `'horizontal' \| 'vertical'` | Layout direction |

### DatePicker

A flexible date picker component with support for single date and date range selection.

```tsx
import { DatePicker } from '@/components/ui/forms/date-picker';

function MyComponent() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [dateRange, setDateRange] = React.useState<{ from?: Date; to?: Date }>({});
  
  return (
    <div className="space-y-6">
      {/* Single date picker */}
      <DatePicker
        label="Select a date"
        selected={date}
        onSelect={setDate}
        helperText="Choose a date for your appointment"
      />
      
      {/* Date range picker */}
      <DatePicker
        type="range"
        label="Select a date range"
        selected={dateRange}
        onSelect={setDateRange}
        helperText="Choose start and end dates"
      />
    </div>
  );
}
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `type` | `'single' \| 'range'` | Type of date picker |
| `label` | `string` | Label for the date picker |
| `helperText` | `string` | Helper text displayed below the input |
| `error` | `string` | Error message |
| `selected` | `Date \| { from?: Date; to?: Date }` | Selected date(s) |
| `onSelect` | `(date?: Date) \| (range?: { from?: Date; to?: Date }) => void` | Called when date changes |
| `disabled` | `boolean` | Whether the date picker is disabled |
| `required` | `boolean` | Whether the date picker is required |
| `minDate` | `Date` | Minimum selectable date |
| `maxDate` | `Date` | Maximum selectable date |
| `dateFormat` | `string` | Date format string |

### FileUpload

A file upload component with drag and drop support and progress indicators.

```tsx
import { FileUpload } from '@/components/ui/forms/file-upload';

function MyComponent() {
  const [files, setFiles] = React.useState<File[]>([]);
  const [progress, setProgress] = React.useState(0);
  const [isUploading, setIsUploading] = React.useState(false);
  
  const handleUpload = (files: File[]) => {
    setFiles(files);
    setIsUploading(true);
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };
  
  return (
    <FileUpload
      label="Upload files"
      helperText="Drag and drop files here, or click to select files"
      onFilesSelected={handleUpload}
      multiple={true}
      accept={{
        'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
        'application/pdf': ['.pdf'],
      }}
      maxSize={5 * 1024 * 1024} // 5MB
      progress={progress}
      isUploading={isUploading}
    />
  );
}
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `onFilesSelected` | `(files: File[]) => void` | Called when files are dropped or selected |
| `onFilesRejected` | `(fileRejections: FileRejection[]) => void` | Called when files are rejected |
| `onFileRemoved` | `(file: File) => void` | Called when a file is removed |
| `label` | `ReactNode` | Label for the upload area |
| `helperText` | `ReactNode` | Helper text displayed below the upload area |
| `error` | `string` | Error message |
| `showFileList` | `boolean` | Whether to show the file list |
| `multiple` | `boolean` | Whether to allow multiple files |
| `showProgress` | `boolean` | Whether to show the progress bar |
| `progress` | `number` | Progress value (0-100) |
| `isUploading` | `boolean` | Whether the upload is in progress |
| `disabled` | `boolean` | Whether the upload is disabled |
| `accept` | `Record<string, string[]>` | Accepted file types |
| `maxSize` | `number` | Maximum file size in bytes |

## Feedback Components

### Toast

A toast notification system for displaying temporary messages.

```tsx
import { useToast } from '@/components/ui/feedback/toast';

function MyComponent() {
  const { addToast } = useToast();
  
  const showSuccessToast = () => {
    addToast({
      title: 'Success!',
      description: 'Your action was completed successfully.',
      type: 'success',
      duration: 5000,
    });
  };
  
  return (
    <button onClick={showSuccessToast}>
      Show Success Toast
    </button>
  );
}
```

#### Setup

Wrap your application with the `ToastProvider`:

```tsx
import { ToastProvider } from '@/components/ui/feedback/toast';

function App() {
  return (
    <ToastProvider>
      {/* Your app content */}
    </ToastProvider>
  );
}
```

#### Toast API

| Method | Parameters | Description |
|--------|------------|-------------|
| `addToast` | `{ title, description?, type?, duration?, onClose? }` | Add a new toast |
| `removeToast` | `id: string` | Remove a specific toast |
| `removeAllToasts` | none | Remove all toasts |

### Modal

A modal dialog component for displaying content that requires user attention.

```tsx
import { useModal } from '@/components/ui/feedback/modal';

function MyComponent() {
  const { open } = useModal();
  
  const showModal = () => {
    open({
      title: 'Confirmation',
      description: 'Please confirm your action',
      children: (
        <div>
          <p>Are you sure you want to proceed?</p>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => close()}>Cancel</button>
            <button onClick={() => {
              // Handle confirmation
              close();
            }}>Confirm</button>
          </div>
        </div>
      ),
    });
  };
  
  return (
    <button onClick={showModal}>
      Open Modal
    </button>
  );
}
```

#### Setup

Wrap your application with the `ModalProvider`:

```tsx
import { ModalProvider } from '@/components/ui/feedback/modal';

function App() {
  return (
    <ModalProvider>
      {/* Your app content */}
    </ModalProvider>
  );
}
```

#### Modal API

| Method | Parameters | Description |
|--------|------------|-------------|
| `open` | `{ title?, description?, children, size?, closeOnClickOutside?, showCloseButton?, className?, contentClassName? }` | Open a modal |
| `close` | none | Close the modal |

#### Direct Usage

You can also use the Modal component directly:

```tsx
import { Modal } from '@/components/ui/feedback/modal';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Modal</button>
      
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="My Modal"
      >
        <p>Modal content goes here</p>
      </Modal>
    </>
  );
}
```

## Navigation Components

### Tabs

A tabs component for organizing content into different sections.

```tsx
import { Tabs } from '@/components/ui/navigation/tabs';

function MyComponent() {
  const tabItems = [
    {
      id: 'tab1',
      label: 'Tab 1',
      content: <div>Content for Tab 1</div>,
    },
    {
      id: 'tab2',
      label: 'Tab 2',
      content: <div>Content for Tab 2</div>,
    },
    {
      id: 'tab3',
      label: 'Tab 3',
      content: <div>Content for Tab 3</div>,
      disabled: true,
    },
  ];
  
  return (
    <Tabs
      items={tabItems}
      defaultTabId="tab1"
      onChange={(tabId) => console.log(`Tab changed to ${tabId}`)}
      variant="pills"
    />
  );
}
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `items` | `TabItem[]` | Array of tab items |
| `defaultTabId` | `string` | ID of the default active tab |
| `onChange` | `(tabId: string) => void` | Called when the active tab changes |
| `variant` | `'default' \| 'pills' \| 'underline'` | Visual style of the tabs |
| `orientation` | `'horizontal' \| 'vertical'` | Layout orientation |
| `className` | `string` | Additional CSS classes for the container |
| `tabsClassName` | `string` | Additional CSS classes for the tab list |
| `contentClassName` | `string` | Additional CSS classes for the content area |

#### TabItem Interface

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique identifier for the tab |
| `label` | `React.ReactNode` | Content for the tab button |
| `content` | `React.ReactNode` | Content to display when tab is active |
| `disabled` | `boolean` | Whether the tab is disabled |

#### Advanced Usage

For more complex scenarios, you can use the individual components:

```tsx
import { TabList, TabContent } from '@/components/ui/navigation/tabs';

// Custom implementation...
```

### Breadcrumbs

A breadcrumb navigation component for showing the current location within a hierarchy.

```tsx
import { Breadcrumbs } from '@/components/ui/navigation/breadcrumbs';
import { Home, FileText } from 'lucide-react';

function MyComponent() {
  const breadcrumbItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: <Home className="h-4 w-4" />,
    },
    {
      label: 'Courses',
      href: '/dashboard/courses',
    },
    {
      label: 'Introduction to React',
      href: '/dashboard/courses/react-intro',
      icon: <FileText className="h-4 w-4" />,
    },
    {
      label: 'Module 1',
      isCurrent: true,
    },
  ];
  
  return (
    <Breadcrumbs
      items={breadcrumbItems}
      showHomeIcon={true}
      homeHref="/"
    />
  );
}
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `items` | `BreadcrumbItem[]` | Array of breadcrumb items |
| `showHomeIcon` | `boolean` | Show home icon at the beginning |
| `homeHref` | `string` | URL for the home icon |
| `separator` | `ReactNode` | Custom separator between items |
| `className` | `string` | Custom class for the breadcrumbs container |
| `itemClassName` | `string` | Custom class for each breadcrumb item |
| `currentItemClassName` | `string` | Custom class for the current breadcrumb item |
| `separatorClassName` | `string` | Custom class for the separator |

### Pagination

A pagination component for navigating through multi-page content.

```tsx
import { Pagination } from '@/components/ui/navigation/pagination';

function MyComponent() {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);
  const totalItems = 100;
  
  return (
    <Pagination
      totalItems={totalItems}
      itemsPerPage={itemsPerPage}
      currentPage={currentPage}
      onPageChange={setCurrentPage}
      onPageSizeChange={setItemsPerPage}
      showPageSizeSelector={true}
      showTotalItems={true}
      showFirstLastButtons={true}
    />
  );
}
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `totalItems` | `number` | Total number of items |
| `itemsPerPage` | `number` | Number of items per page |
| `currentPage` | `number` | Current page number (1-indexed) |
| `onPageChange` | `(page: number) => void` | Called when page changes |
| `maxPageButtons` | `number` | Maximum number of page buttons to show |
| `showFirstLastButtons`