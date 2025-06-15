# Composite UI Components

This directory contains composite components that combine multiple core or extended components to create more complex UI elements.

## Overview

Composite components follow these principles:

- Follow consistent patterns
- Are composable and flexible
- Handle common use cases efficiently
- Reduce boilerplate code
- Are responsive and mobile-friendly

## Components

### FormField

The `FormField` component integrates with react-hook-form to provide a complete form field with validation:

```tsx
import { FormField } from '@/components/ui';
import { useForm, FormProvider } from 'react-hook-form';

function MyForm() {
  const methods = useForm();
  
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <FormField 
          name="email" 
          label="Email Address" 
          type="email" 
          required 
          rules={{ 
            pattern: { 
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, 
              message: "Invalid email address" 
            } 
          }}
        />
        
        <FormField 
          name="password" 
          label="Password" 
          type="password" 
          required 
          helperText="Must be at least 8 characters"
        />
        
        <button type="submit">Submit</button>
      </form>
    </FormProvider>
  );
}
```

### DataCard

The `DataCard` component displays data items with various layouts:

```tsx
import { DataCard, DataCardGrid } from '@/components/ui';

// Single data card
<DataCard 
  data={{
    id: '1',
    title: 'Item Title',
    description: 'Item description',
    status: 'Active',
    statusVariant: 'primary',
    metadata: [
      { label: 'Created', value: '2023-01-01' },
      { label: 'Author', value: 'John Doe' }
    ],
    actions: <Button>View</Button>
  }}
  layout="horizontal"
  role="teacher"
/>

// Grid of data cards
<DataCardGrid
  items={[
    {
      id: '1',
      title: 'Item 1',
      description: 'Description 1',
    },
    {
      id: '2',
      title: 'Item 2',
      description: 'Description 2',
    }
  ]}
  columns={3}
  gap={4}
  role="teacher"
/>
```

### SearchBar

The `SearchBar` component provides a complete search experience:

```tsx
import { SearchBar } from '@/components/ui';

// Basic search bar
<SearchBar 
  placeholder="Search..." 
  onSearch={(value) => console.log(value)}
/>

// Search bar with debounce and voice search
<SearchBar 
  placeholder="Search..." 
  onSearch={(value) => console.log(value)}
  showVoiceSearch
  debounceMs={500}
  role="teacher"
/>

// Expanded search bar
<SearchBar 
  placeholder="Search..." 
  onSearch={(value) => console.log(value)}
  variant="expanded"
  showVoiceSearch
/>

// Minimal search bar
<SearchBar 
  placeholder="Search..." 
  onSearch={(value) => console.log(value)}
  variant="minimal"
/>
```

### Pagination

The `Pagination` component provides navigation through pages:

```tsx
import { Pagination } from '@/components/ui';

// Basic pagination
<Pagination 
  currentPage={1} 
  totalPages={10} 
  onPageChange={(page) => setPage(page)}
/>

// Pagination with page size selector and items count
<Pagination 
  currentPage={1} 
  totalPages={10} 
  onPageChange={(page) => setPage(page)}
  pageSize={10}
  onPageSizeChange={(size) => setPageSize(size)}
  totalItems={100}
  showPageSizeSelector
  showItemsCount
  role="teacher"
/>

// Simple pagination
<Pagination 
  currentPage={1} 
  totalPages={10} 
  onPageChange={(page) => setPage(page)}
  variant="simple"
/>

// Compact pagination
<Pagination 
  currentPage={1} 
  totalPages={10} 
  onPageChange={(page) => setPage(page)}
  variant="compact"
/>
```

### MobileNav

The `MobileNav` component provides a bottom navigation bar for mobile devices:

```tsx
import { MobileNav } from '@/components/ui';
import { Home, Search, User, Bell } from 'lucide-react';

<MobileNav 
  items={[
    { id: 'home', label: 'Home', icon: <Home size={20} /> },
    { id: 'search', label: 'Search', icon: <Search size={20} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={20} />, badge: 3 },
    { id: 'profile', label: 'Profile', icon: <User size={20} /> }
  ]}
  activeItemId="home"
  role="teacher"
/>

// Floating mobile navigation
<MobileNav 
  items={[
    { id: 'home', label: 'Home', icon: <Home size={20} /> },
    { id: 'search', label: 'Search', icon: <Search size={20} /> },
    { id: 'profile', label: 'Profile', icon: <User size={20} /> }
  ]}
  activeItemId="home"
  variant="floating"
/>

// Expandable mobile navigation
<MobileNav 
  items={[
    { id: 'home', label: 'Home', icon: <Home size={20} /> },
    { 
      id: 'search', 
      label: 'Search', 
      icon: <Search size={20} />,
      children: [
        { id: 'search-courses', label: 'Courses', icon: <BookOpen size={16} /> },
        { id: 'search-teachers', label: 'Teachers', icon: <Users size={16} /> },
        { id: 'search-students', label: 'Students', icon: <GraduationCap size={16} /> }
      ]
    },
    { id: 'profile', label: 'Profile', icon: <User size={20} /> }
  ]}
  activeItemId="home"
  expandable
/>
```

## Mobile-First Design

All composite components follow a mobile-first design approach:

- Start with mobile layouts and progressively enhance for larger screens
- Use the `useResponsive` hook for conditional rendering
- Implement touch-friendly interactions (minimum 44x44px touch targets)
- Optimize performance for mobile devices
- Provide mobile-specific variants where needed

## Role-Based Theming

All composite components support role-based theming through the `role` prop:

- `systemAdmin` - Green theme
- `campusAdmin` - Blue theme
- `teacher` - Teal theme
- `student` - Light blue theme
- `parent` - Purple theme

```tsx
import { DataCard, SearchBar, Pagination, MobileNav } from '@/components/ui';

// Teacher theme
<DataCard role="teacher" data={...} />
<SearchBar role="teacher" placeholder="Search..." />
<Pagination role="teacher" currentPage={1} totalPages={10} />
<MobileNav role="teacher" items={...} />

// Student theme
<DataCard role="student" data={...} />
<SearchBar role="student" placeholder="Search..." />
<Pagination role="student" currentPage={1} totalPages={10} />
<MobileNav role="student" items={...} />
```
