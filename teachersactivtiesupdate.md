# Teacher Activities Update Plan

## Analysis of Current Architecture

### Current Architecture Overview

1. **Features/Activities Architecture**:
   - The new activities architecture in `features/activities` follows a modular, component-based approach
   - Each activity type has its own implementation with:
     - Schema definition (using Zod)
     - Editor component
     - Viewer component
     - Default configuration
     - Registration with the activity registry
   - Two registration methods are supported:
     - Direct registration via `activityRegistry.register()`
     - Lazy loading via `registerLazyActivityType()` for better code splitting

2. **Activity Registry**:
   - Central registry for all activity types
   - Manages registration and retrieval of activity types
   - Supports lazy loading of components for better performance
   - Tracks usage for prefetching common activity types
   - Provides methods to get activities by capability or category

3. **Current Teacher Activities Implementation**:
   - Teacher activities pages are currently using the old architecture
   - Activities are created through specific creator components for each type
   - The current implementation doesn't leverage the new registry system
   - Activity creation is handled through the `api.activity.create` mutation
   - Uses a flag `useComponentSystem: true` to indicate component-based activities

4. **Activity Types**:
   - Multiple activity types are available (reading, video, multiple-choice, etc.)
   - Each type has specific capabilities (gradable, submission, interaction)
   - Activity types are categorized by purpose (LEARNING, ASSESSMENT, PRACTICE)
   - Each activity type has its own schema and validation rules

## Integration Points

1. **Teacher Activities Pages**:
   - `/teacher/classes/[classId]/activities` - List of activities for a class
   - `/teacher/classes/[classId]/activities/create` - Create new activity page
   - `/teacher/classes/[classId]/activities/[activityId]` - View/edit activity page
   - `/teacher/activities` - Teacher's activities dashboard

2. **Activity Creation Flow**:
   - Select activity type
   - Configure activity settings
   - Create activity content
   - Save activity

3. **API Integration**:
   - `api.activity.create` mutation for creating activities
     - Accepts `useComponentSystem: true` flag to use the new architecture
     - Handles different activity types through the `content` field
   - `api.activity.list` query for retrieving activities
     - Supports filtering by purpose, type, subject, etc.
   - `api.activity.getById` query for retrieving a specific activity
     - Detects component-based activities by checking content structure

4. **Database Schema**:
   - Activities are stored in the `Activity` table
   - Common fields include title, purpose, subjectId, classId, content
   - Activity-specific data is stored in the `content` JSON field
   - Grading information (isGradable, maxScore, passingScore) is stored in dedicated fields

## Issues to Address

1. **Architecture Mismatch**:
   - Current teacher pages use old activity creation components
   - Need to integrate with the new activity registry system
   - Need to handle the transition between old and new architecture

2. **Component Reuse**:
   - Need to reuse editor and viewer components from the new architecture
   - Avoid duplicating code for activity creation
   - Ensure proper props are passed to editor and viewer components

3. **Type Safety**:
   - Ensure proper typing for activity configurations
   - Use Zod schemas for validation
   - Handle the different schema structures between activity types

4. **Performance Optimization**:
   - Leverage lazy loading for activity components
   - Implement code splitting for better performance
   - Ensure activities load efficiently in the teacher interface

5. **API Integration**:
   - Update API calls to use the `useComponentSystem: true` flag
   - Ensure proper content structure for each activity type
   - Handle validation of activity-specific data

6. **Database Compatibility**:
   - Ensure new activities are stored correctly in the database
   - Handle the JSON structure in the `content` field
   - Maintain compatibility with existing queries and filters

7. **Grading Integration**:
   - Ensure proper integration with the grading system
   - Support both automatic and manual grading workflows
   - Reuse existing grading components from the features/activities folder
   - Maintain compatibility with the gradebook system

## Update Plan

### Phase 1: Update Activity Type Selection

1. **Update Activity Type Selector**:
   - Replace the current `ActivityTypeSelectorGrid` with a new component that uses the activity registry
   - Group activity types by purpose (LEARNING, ASSESSMENT, PRACTICE)
   - Display activity type information (name, description, icon)
   - Implement filtering and searching for activity types
   - Use `activityRegistry.getAll()` to retrieve all registered activity types
   - Use `activityRegistry.getByCategory()` for filtering by purpose

2. **Create Activity Type Card Component**:
   - Display activity type information
   - Show capabilities (gradable, submission, interaction)
   - Add selection functionality
   - Include visual indicators for different activity types
   - Show preview of what the activity will look like

### Phase 2: Update Activity Creation Page

1. **Update Create Activity Page**:
   - Replace the current activity creator components with a unified approach
   - Use the activity registry to get the appropriate editor component
   - Implement a common layout for all activity types
   - Handle loading states and error boundaries for dynamic components

2. **Create Unified Activity Creator Component**:
   - Accept activity type as a prop
   - Load the appropriate editor component from the registry using `activityRegistry.get(activityTypeId)`
   - Handle common functionality (title, description, etc.)
   - Implement form validation using Zod schemas
   - Support both direct and lazy-loaded components

3. **Update Activity Form**:
   - Use the activity type's schema for validation
   - Implement common fields (title, purpose, etc.)
   - Add activity-specific configuration section
   - Handle the different data structures required by each activity type
   - Implement proper error handling and validation feedback

### Phase 3: Update Activity View/Edit Page

1. **Update Activity View/Edit Page**:
   - Replace the current activity viewer/editor with components from the registry
   - Implement tabs for different views (preview, edit, analytics)
   - Add activity status management
   - Detect activity type from the stored content structure
   - Handle loading of the appropriate components based on activity type

2. **Create Activity Preview Component**:
   - Use the activity viewer component from the registry
   - Implement preview controls (student view, teacher view)
   - Add feedback and comments section
   - Support different modes for the viewer component
   - Handle interaction events for analytics tracking

3. **Update Activity Edit Component**:
   - Use the activity editor component from the registry
   - Implement save and publish functionality
   - Add version history and rollback options
   - Ensure proper data transformation between form and API
   - Implement auto-save functionality for drafts

### Phase 4: Update Activities List Page

1. **Update Activities List Page**:
   - Enhance the current activities list with more information
   - Add filtering by activity type, purpose, and status
   - Implement sorting and pagination
   - Use the activity registry to get information about activity types
   - Display activity-specific icons and indicators

2. **Create Activity Card Component**:
   - Display activity information (title, type, purpose)
   - Show activity status and completion rate
   - Add quick actions (view, edit, duplicate, delete)
   - Show activity-specific preview or thumbnail
   - Include indicators for gradable activities and submission status

### Phase 5: API Integration

1. **Update Activity Creation Mutation**:
   - Modify the `api.activity.create` mutation to support the new architecture
   - Add support for activity-specific configuration
   - Implement validation using the activity type's schema
   - Set the `useComponentSystem: true` flag for new activities
   - Ensure proper content structure for each activity type

2. **Update Activity Retrieval Queries**:
   - Enhance the `api.activity.list` query with filtering options
   - Update the `api.activity.getById` query to include activity-specific data
   - Add analytics and performance data
   - Handle the different content structures for different activity types
   - Implement proper error handling for missing or invalid data

3. **Update Activity Update Mutation**:
   - Ensure the update mutation preserves the activity type and structure
   - Implement validation for updates
   - Support partial updates for specific fields
   - Handle versioning and conflict resolution

### Phase 6: Grading Integration

1. **Update Grading Interface**:
   - Integrate with the new activity types' grading components
   - Support both automatic and manual grading workflows
   - Implement activity-specific grading forms based on activity type
   - Reuse existing grading components from the features/activities folder

2. **Implement Gradebook Integration**:
   - Connect activity results to the gradebook system
   - Support both automatic and manual grade submission
   - Implement batch grading for multiple students
   - Ensure proper error handling and validation

3. **Create Teacher Grading Dashboard**:
   - Implement a unified grading dashboard for teachers
   - Show activities that require manual grading
   - Provide analytics and insights on student performance
   - Support filtering and sorting of activities by grading status

## Implementation Details

### Activity Type Selection

```tsx
// New ActivityTypeSelectorGrid component
const ActivityTypeSelectorGrid = ({
  onSelect,
  filter = 'all',
  searchTerm = ''
}: ActivityTypeSelectorGridProps) => {
  // State for loading status
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ensure the registry is initialized
  useEffect(() => {
    const initRegistry = async () => {
      try {
        // This will ensure all activity types are registered
        await import('@/components/shared/entities/activities/register-activities');
        setIsLoading(false);
      } catch (err) {
        setError('Failed to load activity types');
        setIsLoading(false);
      }
    };

    initRegistry();
  }, []);

  // Get all activity types from the registry
  const activityTypes = useMemo(() => {
    if (filter === 'all') {
      return activityRegistry.getAll();
    }
    return activityRegistry.getByCategory(filter);
  }, [filter]);

  // Filter activity types based on search term
  const filteredTypes = useMemo(() => {
    if (!searchTerm) return activityTypes;

    return activityTypes.filter(type =>
      type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      type.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [activityTypes, searchTerm]);

  // Handle loading and error states
  if (isLoading) {
    return <ActivityTypesSkeleton />;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  // Group activities by purpose for better organization
  const groupedActivities = filteredTypes.reduce((acc, type) => {
    const purpose = type.category || 'OTHER';
    if (!acc[purpose]) {
      acc[purpose] = [];
    }
    acc[purpose].push(type);
    return acc;
  }, {} as Record<string, typeof filteredTypes>);

  return (
    <div className="space-y-8">
      {Object.entries(groupedActivities).map(([purpose, types]) => (
        <div key={purpose} className="space-y-4">
          <h3 className="text-lg font-medium">{purpose}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {types.map(type => (
              <ActivityTypeCard
                key={type.id}
                activityType={type}
                onSelect={() => onSelect(type.id)}
              />
            ))}
          </div>
        </div>
      ))}

      {filteredTypes.length === 0 && (
        <div className="text-center p-8 text-gray-500">
          No activity types found matching your criteria.
        </div>
      )}
    </div>
  );
};
```

### Unified Activity Creator

```tsx
// Unified ActivityCreator component
const ActivityCreator = ({
  activityTypeId,
  classId,
  subjectId,
  topicId,
  onSuccess,
  onCancel
}: ActivityCreatorProps) => {
  // State for loading status
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get activity type from registry
  const activityType = useMemo(() => {
    try {
      const type = activityRegistry.get(activityTypeId);
      setIsLoading(false);
      return type;
    } catch (err) {
      setError('Failed to load activity type');
      setIsLoading(false);
      return null;
    }
  }, [activityTypeId]);

  // Create activity mutation
  const createActivity = api.activity.create.useMutation({
    onSuccess: () => {
      toast({
        title: 'Activity created',
        description: 'The activity has been created successfully.',
      });
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create activity',
        variant: 'error',
      });
    },
  });

  // Handle loading and error states
  if (isLoading) {
    return <ActivityCreatorSkeleton />;
  }

  if (error || !activityType) {
    return (
      <div className="p-4 border rounded-md bg-red-50 text-red-500">
        {error || 'Activity type not found'}
        <Button className="mt-4" onClick={onCancel}>Go Back</Button>
      </div>
    );
  }

  // Get editor component and default config
  const EditorComponent = activityType.components.editor;
  const defaultConfig = activityType.defaultConfig;

  // State for activity configuration
  const [config, setConfig] = useState(defaultConfig);

  // Determine if activity is gradable based on capabilities
  const isGradable = activityType.capabilities?.isGradable || false;
  const requiresTeacherReview = activityType.capabilities?.requiresTeacherReview || false;

  // Form for common fields
  const form = useForm({
    resolver: zodResolver(activityCommonFieldsSchema),
    defaultValues: {
      title: '',
      description: '',
      purpose: activityType.category as ActivityPurpose,
      isGradable,
      requiresTeacherReview,
      maxScore: isGradable ? 100 : undefined,
      passingScore: isGradable ? 60 : undefined,
      startDate: undefined,
      endDate: undefined,
      duration: 30, // Default duration in minutes
    }
  });

  // Watch form values for conditional rendering
  const watchIsGradable = form.watch('isGradable');

  // Handle form submission
  const onSubmit = async (data: ActivityFormValues) => {
    try {
      setIsLoading(true);

      // Create activity with common fields and type-specific config
      await createActivity.mutateAsync({
        title: data.title,
        purpose: data.purpose,
        subjectId,
        topicId,
        classId,
        content: {
          activityType: activityTypeId,
          requiresTeacherReview,
          ...config
        },
        isGradable: data.isGradable,
        maxScore: data.maxScore,
        passingScore: data.passingScore,
        startDate: data.startDate,
        endDate: data.endDate,
        duration: data.duration,
        useComponentSystem: true, // Flag to use the new component system
      });
    } catch (error) {
      console.error('Error creating activity:', error);
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Common fields */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Enter the basic details for this activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter activity title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter activity description"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <DatePicker
                        date={field.value}
                        setDate={(date) => field.onChange(date)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <DatePicker
                        date={field.value}
                        setDate={(date) => field.onChange(date)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (minutes)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Grading options */}
        <Card>
          <CardHeader>
            <CardTitle>Grading Options</CardTitle>
            <CardDescription>Configure how this activity will be graded</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="isGradable"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Gradable Activity</FormLabel>
                    <FormDescription>
                      Enable grading for this activity
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {watchIsGradable && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <FormField
                    control={form.control}
                    name="maxScore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Score</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="passingScore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Passing Score</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {requiresTeacherReview && (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 mt-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Manual Grading Required</FormLabel>
                      <FormDescription>
                        This activity type requires teacher review and manual grading
                      </FormDescription>
                    </div>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      Teacher Review Required
                    </Badge>
                  </FormItem>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Activity-specific editor */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Configuration</CardTitle>
            <CardDescription>Configure the specific settings for this {activityType.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="p-4 text-center">Loading editor...</div>}>
              <ErrorBoundary fallback={<div className="p-4 text-red-500">Failed to load editor component</div>}>
                <EditorComponent
                  config={config}
                  onChange={setConfig}
                />
              </ErrorBoundary>
            </Suspense>
          </CardContent>
        </Card>

        {/* Form actions */}
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Creating...
              </>
            ) : (
              'Create Activity'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};
```

## Conclusion

The plan outlined above provides a comprehensive approach to updating the teacher activities pages to use the new architecture from the features/activities folder. By leveraging the activity registry and reusing the editor and viewer components, we can ensure a consistent and maintainable implementation.

### Key Benefits

- **Component Reuse**: Leveraging existing components from the features/activities folder rather than creating new ones
- **Consistent UX**: Providing a uniform user experience across different activity types
- **Type Safety**: Ensuring proper validation using Zod schemas specific to each activity type
- **Performance Optimization**: Implementing lazy loading and code splitting for better performance
- **Extensibility**: Creating a system that makes it easy to add new activity types in the future
- **Maintainability**: Centralizing activity type definitions and reducing code duplication

### Implementation Strategy

The implementation will follow a phased approach:

1. **Phase 1**: Update the activity type selection to use the registry
2. **Phase 2**: Create a unified activity creator component
3. **Phase 3**: Update the activity view/edit page
4. **Phase 4**: Enhance the activities list page
5. **Phase 5**: Update the API integration

This phased approach allows for incremental updates and testing at each stage, reducing the risk of introducing bugs and ensuring a smooth transition to the new architecture.

### Potential Challenges

- **Data Migration**: Ensuring compatibility between old and new activity formats
- **Component Compatibility**: Making sure the editor and viewer components work correctly with the teacher interface
- **Performance**: Managing the loading of multiple dynamic components efficiently
- **Error Handling**: Implementing robust error boundaries and fallbacks for dynamic components
- **Manual Grading Workflow**: Implementing a clear workflow for activities that require teacher review and manual grading
- **Grading Configuration**: Ensuring proper configuration options for different grading methods (automatic, manual, partial credit)
- **Gradebook Integration**: Ensuring proper integration with the gradebook system for both automatic and manual grading
- **Activity-Specific Grading**: Supporting different grading mechanisms for different activity types

By addressing these challenges proactively and following the detailed plan, we can successfully update the teacher activities pages to use the new architecture, providing a better experience for teachers and students alike.
