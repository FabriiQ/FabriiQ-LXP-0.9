# Sample Implementation of Unified Components

This document provides a sample implementation of the unified component approach for the `TeacherCard` component, which would be used across different portals.

## Core Components

### 1. RoleBasedComponent.tsx

```tsx
import { useSession } from "next-auth/react";
import { UserType } from "@/server/api/constants";

interface RoleBasedComponentProps {
  children: React.ReactNode;
  allowedRoles: UserType[];
  fallback?: React.ReactNode;
}

export function RoleBasedComponent({ 
  children, 
  allowedRoles, 
  fallback = null 
}: RoleBasedComponentProps) {
  const { data: session } = useSession();
  const userRole = session?.user?.userType as UserType;
  
  if (!userRole || allowedRoles.includes(userRole)) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
}
```

### 2. EntityCard.tsx

```tsx
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { RoleBasedComponent } from "./RoleBasedComponent";
import { UserType } from "@/server/api/constants";

export interface Action {
  id: string;
  label: string;
  icon?: React.ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export interface EntityCardProps<T> {
  data: T;
  title: string | React.ReactNode;
  description?: string | React.ReactNode;
  userRole: UserType;
  viewMode?: "full" | "compact" | "mobile";
  actions?: Action[];
  onAction?: (actionId: string, data: T) => void;
  renderContent: (data: T, viewMode: "full" | "compact" | "mobile") => React.ReactNode;
  renderFooter?: (data: T, viewMode: "full" | "compact" | "mobile") => React.ReactNode;
}

export function EntityCard<T>({
  data,
  title,
  description,
  userRole,
  viewMode = "full",
  actions = [],
  onAction,
  renderContent,
  renderFooter
}: EntityCardProps<T>) {
  const handleAction = (actionId: string) => {
    if (onAction) {
      onAction(actionId, data);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className={viewMode === "compact" ? "p-4" : undefined}>
        <div className="flex items-start justify-between">
          <div>
            <div className="font-medium">{title}</div>
            {description && (
              <div className="text-sm text-muted-foreground">{description}</div>
            )}
          </div>
          {actions.length > 0 && (
            <div className="flex space-x-1">
              {actions.map((action) => (
                <Button
                  key={action.id}
                  variant={action.variant || "ghost"}
                  size="sm"
                  onClick={() => handleAction(action.id)}
                >
                  {action.icon}
                  {viewMode === "full" && action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className={viewMode === "compact" ? "px-4 pb-4 pt-0" : undefined}>
        {renderContent(data, viewMode)}
      </CardContent>
      {renderFooter && (
        <CardFooter className={viewMode === "compact" ? "px-4 pb-4 pt-0" : undefined}>
          {renderFooter(data, viewMode)}
        </CardFooter>
      )}
    </Card>
  );
}
```

## Teacher Components

### 1. TeacherCard.tsx

```tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EntityCard, Action } from "../core/EntityCard";
import { RoleBasedComponent } from "../core/RoleBasedComponent";
import { UserType } from "@/server/api/constants";
import { Edit, Mail, Phone, BookOpen, Users } from "lucide-react";
import Link from "next/link";

export interface Teacher {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  specialization?: string;
  classCount?: number;
  subjectCount?: number;
  joinDate?: Date;
}

export interface TeacherCardProps {
  teacher: Teacher;
  userRole: UserType;
  viewMode?: "full" | "compact" | "mobile";
  actions?: Action[];
  onAction?: (actionId: string, teacher: Teacher) => void;
  basePath?: string;
}

export function TeacherCard({
  teacher,
  userRole,
  viewMode = "full",
  actions = [],
  onAction,
  basePath = ""
}: TeacherCardProps) {
  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Get role-specific actions
  const getActionsForRole = (role: UserType): Action[] => {
    const baseActions = [...actions];
    
    // Add default actions based on role
    switch (role) {
      case "SYSTEM_ADMIN":
        baseActions.push(
          { id: "edit", label: "Edit", icon: <Edit className="h-4 w-4" /> },
          { id: "delete", label: "Delete", icon: <Trash className="h-4 w-4" />, variant: "destructive" }
        );
        break;
      case "CAMPUS_ADMIN":
        baseActions.push(
          { id: "edit", label: "Edit", icon: <Edit className="h-4 w-4" /> },
          { id: "assign", label: "Assign", icon: <Users className="h-4 w-4" /> }
        );
        break;
      case "COORDINATOR":
        baseActions.push(
          { id: "feedback", label: "Feedback", icon: <MessageSquare className="h-4 w-4" /> }
        );
        break;
    }
    
    return baseActions;
  };

  // Get path prefix based on role
  const getPathPrefix = (role: UserType): string => {
    if (basePath) return basePath;
    
    switch (role) {
      case "SYSTEM_ADMIN":
        return "/admin/system/teachers";
      case "CAMPUS_ADMIN":
        return "/admin/campus/teachers";
      case "COORDINATOR":
        return "/admin/coordinator/teachers";
      default:
        return "/teachers";
    }
  };

  const roleSpecificActions = getActionsForRole(userRole);
  const pathPrefix = getPathPrefix(userRole);

  return (
    <EntityCard
      data={teacher}
      title={
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={`https://avatar.vercel.sh/${teacher.name}`} alt={teacher.name} />
            <AvatarFallback>{getInitials(teacher.name)}</AvatarFallback>
          </Avatar>
          <div>
            <Link href={`${pathPrefix}/${teacher.id}`} className="font-medium hover:underline">
              {teacher.name}
            </Link>
            <Badge className="ml-2" variant={teacher.status === "ACTIVE" ? "success" : "secondary"}>
              {teacher.status}
            </Badge>
          </div>
        </div>
      }
      description={teacher.specialization || "Teacher"}
      userRole={userRole}
      viewMode={viewMode}
      actions={roleSpecificActions}
      onAction={onAction}
      renderContent={(teacher, viewMode) => (
        <div className="space-y-3">
          <div className="flex items-center text-sm">
            <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{teacher.email}</span>
          </div>
          
          {teacher.phone && (
            <div className="flex items-center text-sm">
              <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>{teacher.phone}</span>
            </div>
          )}
          
          <RoleBasedComponent allowedRoles={["SYSTEM_ADMIN", "CAMPUS_ADMIN", "COORDINATOR"]}>
            <div className="flex flex-wrap gap-4 mt-4">
              {teacher.classCount !== undefined && (
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">{teacher.classCount} Classes</span>
                </div>
              )}
              
              {teacher.subjectCount !== undefined && (
                <div className="flex items-center">
                  <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">{teacher.subjectCount} Subjects</span>
                </div>
              )}
            </div>
          </RoleBasedComponent>
          
          <RoleBasedComponent allowedRoles={["SYSTEM_ADMIN"]}>
            {teacher.joinDate && (
              <div className="flex items-center text-sm mt-2">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Joined: {new Date(teacher.joinDate).toLocaleDateString()}</span>
              </div>
            )}
          </RoleBasedComponent>
        </div>
      )}
      renderFooter={viewMode === "full" ? (teacher) => (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" asChild>
            <Link href={`${pathPrefix}/${teacher.id}`}>
              View Profile
            </Link>
          </Button>
        </div>
      ) : undefined}
    />
  );
}
```

### 2. TeacherList.tsx

```tsx
import { useState } from "react";
import { TeacherCard, Teacher } from "./TeacherCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "lucide-react";
import { UserType } from "@/server/api/constants";

export interface TeacherListProps {
  teachers: Teacher[];
  userRole: UserType;
  viewMode?: "grid" | "list" | "mobile";
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  onSearch?: (e: React.FormEvent) => void;
  onAction?: (actionId: string, teacher: Teacher) => void;
  basePath?: string;
}

export function TeacherList({
  teachers,
  userRole,
  viewMode = "grid",
  searchQuery = "",
  onSearchChange,
  onSearch,
  onAction,
  basePath
}: TeacherListProps) {
  const [activeTab, setActiveTab] = useState("all");
  
  // Filter teachers based on active tab
  const filteredTeachers = teachers.filter(teacher => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return teacher.status === "ACTIVE";
    if (activeTab === "inactive") return teacher.status === "INACTIVE";
    return true;
  });

  return (
    <div className="space-y-6">
      {onSearchChange && onSearch && (
        <form onSubmit={onSearch} className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search teachers..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <Button variant="outline" type="submit">
            Search
          </Button>
        </form>
      )}

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Teachers</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {filteredTeachers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No teachers found</p>
            </div>
          ) : (
            <div className={`grid grid-cols-1 ${viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : ""} gap-6`}>
              {filteredTeachers.map((teacher) => (
                <TeacherCard
                  key={teacher.id}
                  teacher={teacher}
                  userRole={userRole}
                  viewMode={viewMode === "list" ? "full" : "compact"}
                  onAction={onAction}
                  basePath={basePath}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

## Usage Examples

### 1. System Admin Portal

```tsx
'use client';

import { useState } from 'react';
import { TeacherList } from '@/components/shared/entities/teachers/TeacherList';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { api } from '@/trpc/react';
import { useRouter } from 'next/navigation';
import { UserType } from '@/server/api/constants';
import { toast } from '@/components/ui/toast';

export default function SystemTeachersPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: teachers, isLoading, refetch } = api.teacher.list.useQuery({
    search: searchQuery,
  });
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    refetch();
  };
  
  const handleAction = (actionId: string, teacher: any) => {
    switch (actionId) {
      case 'edit':
        router.push(`/admin/system/teachers/${teacher.id}/edit`);
        break;
      case 'delete':
        // Show confirmation dialog
        if (confirm(`Are you sure you want to delete ${teacher.name}?`)) {
          // Call delete API
          toast({
            title: 'Teacher deleted',
            description: `${teacher.name} has been deleted.`,
          });
        }
        break;
      default:
        console.log(`Action ${actionId} not implemented`);
    }
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Teacher Management</CardTitle>
          <CardDescription>Manage all teachers in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <TeacherList
            teachers={teachers || []}
            userRole={UserType.SYSTEM_ADMIN}
            viewMode="grid"
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearch={handleSearch}
            onAction={handleAction}
          />
        </CardContent>
      </Card>
    </div>
  );
}
```

### 2. Campus Admin Portal

```tsx
'use client';

import { useState } from 'react';
import { TeacherList } from '@/components/shared/entities/teachers/TeacherList';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { api } from '@/trpc/react';
import { useRouter } from 'next/navigation';
import { UserType } from '@/server/api/constants';
import Link from 'next/link';

export function CampusTeachersContent({
  campus,
  searchParams,
}: {
  campus: {
    id: string;
    name: string;
  };
  searchParams: {
    search?: string;
  };
}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(searchParams.search || '');
  
  const { data: teachers, isLoading, refetch } = api.teacher.listByCampus.useQuery({
    campusId: campus.id,
    search: searchQuery,
  });
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    refetch();
  };
  
  const handleAction = (actionId: string, teacher: any) => {
    switch (actionId) {
      case 'edit':
        router.push(`/admin/campus/teachers/${teacher.id}/edit`);
        break;
      case 'assign':
        router.push(`/admin/campus/teachers/${teacher.id}/assign`);
        break;
      default:
        console.log(`Action ${actionId} not implemented`);
    }
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teacher Management</h1>
          <p className="text-muted-foreground">Manage teachers at {campus.name}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/admin/campus/teachers/new">
              <Plus className="mr-2 h-4 w-4" /> Add Teacher
            </Link>
          </Button>
        </div>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <TeacherList
            teachers={teachers || []}
            userRole={UserType.CAMPUS_ADMIN}
            viewMode="grid"
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearch={handleSearch}
            onAction={handleAction}
            basePath="/admin/campus/teachers"
          />
        </CardContent>
      </Card>
    </div>
  );
}
```

### 3. Coordinator Portal

```tsx
'use client';

import { useState } from 'react';
import { TeacherList } from '@/components/shared/entities/teachers/TeacherList';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { api } from '@/trpc/react';
import { useRouter } from 'next/navigation';
import { UserType } from '@/server/api/constants';

export function CoordinatorTeachersClient({
  initialSearch,
  campus,
}: {
  initialSearch: string;
  campus: {
    id: string;
    name: string;
  };
}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  
  const { data: teachers, isLoading } = api.coordinator.getTeachers.useQuery({
    campusId: campus.id,
    search: searchQuery,
  });
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    router.push(`/admin/coordinator/teachers?${params.toString()}`);
  };
  
  const handleAction = (actionId: string, teacher: any) => {
    switch (actionId) {
      case 'feedback':
        router.push(`/admin/coordinator/teachers/${teacher.id}/feedback`);
        break;
      default:
        console.log(`Action ${actionId} not implemented`);
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Teacher Management</CardTitle>
          <CardDescription>View and manage teachers for your coordinated programs</CardDescription>
        </CardHeader>
        <CardContent>
          <TeacherList
            teachers={teachers || []}
            userRole={UserType.COORDINATOR}
            viewMode="grid"
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearch={handleSearch}
            onAction={handleAction}
            basePath="/admin/coordinator/teachers"
          />
        </CardContent>
      </Card>
    </div>
  );
}
```

## Benefits of This Approach

1. **Code Reuse**: The same core components are used across all portals
2. **Role-Based Rendering**: Content adapts based on user role
3. **Consistent UI**: Same visual design and interaction patterns
4. **Maintainability**: Changes to the core components propagate to all portals
5. **Flexibility**: Portal-specific behavior can be added through props and callbacks

## Implementation Notes

1. **Imports**: Ensure all imports are correctly set up for your project structure
2. **Types**: Adjust types to match your actual data models
3. **Styling**: Adapt the styling to match your design system
4. **API Integration**: Update API calls to match your actual API endpoints
5. **Role Handling**: Adjust role handling to match your authentication system
