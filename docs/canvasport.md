# Open Canvas Integration for Teacher Worksheet Generation

This document outlines the plan for porting the Open Canvas functionality from `open-canvas-main` into our existing LXP system, specifically for the teacher portal to enable AI-powered worksheet generation.

## Overview

We will integrate the core canvas and agent functionality from Open Canvas while adapting it to work with our existing authentication, database, and API structure. The integration will focus on the canvas interface and AI agents for worksheet generation without the Supabase authentication components.

## Files and Folders to Copy

### 1. Copy these folders from `open-canvas-main`:

```
open-canvas-main/
├── apps/
│   ├── agents/                  → Copy entire folder
│   │   └── src/
│   │       ├── open-canvas/     → Main agent logic
│   │       ├── reflection/      → Memory/reflection system
│   │       ├── web-search/      → Web search capability
│   │       ├── utils.ts         → Utility functions
│   │       └── ...
│   │
│   └── web/                     → Copy entire folder
│       └── src/
│           ├── components/
│           │   ├── canvas/      → Main canvas UI
│           │   ├── artifacts/   → Content rendering
│           │   └── ui/          → UI components
│           ├── contexts/        → React contexts
│           └── ...
│
└── packages/
    └── shared/                  → Copy entire folder
        └── src/
            ├── types/           → Type definitions
            ├── utils/           → Shared utilities
            └── constants/       → Shared constants
```

### 2. Also copy these configuration files:

```
open-canvas-main/
├── langgraph.json               → LangGraph configuration
└── tsconfig.json                → TypeScript configuration (for reference)
```

## Integration Architecture

```
┌─────────────────────────────────────┐
│           Teacher Portal            │
│                                     │
│  ┌─────────────────────────────┐    │
│  │      Worksheet Canvas       │    │
│  │                             │    │
│  │  ┌─────────────┐ ┌────────┐│    │
│  │  │ AI Composer │ │Renderer││    │
│  │  └─────────────┘ └────────┘│    │
│  └─────────────────────────────┘    │
│                │                    │
└────────────────┼────────────────────┘
                 │
┌────────────────┼────────────────────┐
│                │                    │
│    ┌───────────▼──────────┐         │
│    │   LangGraph Agents   │         │
│    └────────────┬─────────┘         │
│                 │                   │
│    ┌────────────▼─────────┐         │
│    │ tRPC API Integration │         │
│    └────────────┬─────────┘         │
│                 │                   │
│    ┌────────────▼─────────┐         │
│    │    Prisma / DB       │         │
│    └──────────────────────┘         │
│                                     │
└─────────────────────────────────────┘
```

## Implementation Steps

### 1. Set Up LangGraph Server

1. Install LangGraph CLI and dependencies:
   ```bash
   npm install @langchain/langgraph-cli @langchain/langgraph @langchain/core langchain
   ```

2. Create a new `langgraph.json` configuration file in the project root:
   ```json
   {
     "node_version": "20",
     "dependencies": [
       "."
     ],
     "graphs": {
       "worksheet": "./src/features/canvas/agents/worksheet/index.ts:graph",
       "reflection": "./src/features/canvas/agents/reflection/index.ts:graph",
       "web_search": "./src/features/canvas/agents/web-search/index.ts:graph"
     },
     "env": ".env"
   }
   ```

3. Add script to package.json:
   ```json
   "canvas:server": "npx @langchain/langgraph-cli dev --port 54367"
   ```

### 2. Directory Structure for Integration

Create the following directory structure in your project to house the ported code:

```
src/
└── features/
    └── canvas/
        ├── agents/              → Place copied agent code here
        │   ├── worksheet/       → Renamed from open-canvas
        │   ├── reflection/
        │   └── web-search/
        ├── components/          → Place copied UI components here
        │   ├── canvas/
        │   ├── artifacts/
        │   └── ui/
        ├── contexts/            → Place copied context providers here
        │   ├── GraphContext.tsx
        │   ├── ThreadProvider.tsx
        │   └── WorksheetContext.tsx
        └── shared/              → Place copied shared code here
            ├── types/
            ├── utils/
            └── constants/
```

### 3. Required Changes to Copied Files

After copying the files, you'll need to make the following changes:

#### Agent Files

1. **Rename and Update Main Agent**:
   - Rename `open-canvas-main/apps/agents/src/open-canvas` to `src/features/canvas/agents/worksheet`
   - Update imports in all files to reflect the new path structure
   - Modify `index.ts` to focus on worksheet generation

2. **Update Authentication in Utils**:
   - In `utils.ts`, replace all Supabase authentication with Next-Auth
   - Example change:
     ```typescript
     // FROM: const { data } = await supabase.auth.getUser()
     // TO: const session = await getServerSession(authOptions)
     ```

3. **Update State Definitions**:
   - In state files (like `state.ts`), add worksheet-specific fields
   - Example addition:
     ```typescript
     worksheetType: Annotation<'quiz' | 'exercise' | 'notes' | 'assessment'>,
     difficultyLevel: Annotation<'beginner' | 'intermediate' | 'advanced'>,
     subjectId: Annotation<string>,
     topicId: Annotation<string>,
     ```

4. **Modify Artifact Generation**:
   - Update `generate-artifact/index.ts` to focus on educational content
   - Add educational prompts to `prompts.ts`
   - Example new prompt:
     ```typescript
     export const GENERATE_WORKSHEET_PROMPT = `
     Create an educational worksheet for {grade_level} students on the topic of {topic}.
     Include {num_questions} questions of varying difficulty.
     The worksheet should be designed for a {duration} minute session.
     Include answer key and teacher notes.
     `;
     ```

#### Web/UI Files

1. **Update Canvas Component**:
   - In `canvas.tsx`, remove Supabase-specific code
   - Replace with our authentication system
   - Example change:
     ```typescript
     // FROM: const { user } = useSupabaseUser()
     // TO: const { data: session } = useSession()
     ```

2. **Modify Content Composer**:
   - Update `content-composer.tsx` to include educational controls
   - Add fields for subject, topic, difficulty level, etc.

3. **Update Context Providers**:
   - In all context files (GraphContext.tsx, ThreadProvider.tsx), replace Supabase with Next-Auth
   - Update API endpoints to use our tRPC routes

4. **Remove Supabase Middleware**:
   - Delete or completely rewrite `middleware.ts` to use our authentication
   - Remove all imports from `@supabase/ssr`

#### API Integration

1. **Replace API Routes**:
   - Remove all Supabase-specific API routes
   - Create new tRPC procedures for worksheet operations
   - Example change:
     ```typescript
     // FROM: apps/web/src/app/api/store/get/route.ts
     // TO: src/server/api/routers/worksheet.ts with tRPC procedures
     ```

2. **Update LangGraph Integration**:
   - Create new API routes for LangGraph communication
   - Example:
     ```typescript
     // src/app/api/langgraph/route.ts
     export async function POST(req: Request) {
       const { namespace, key } = await req.json();
       const lgClient = new Client({
         apiUrl: process.env.LANGGRAPH_API_URL,
       });
       // Rest of implementation
     }
     ```

### 4. UI Component Integration

1. **Integrate Canvas Component with Teacher Portal**:
   - Add the Canvas component to the teacher worksheet page
   - Ensure it uses our design system and theme
   - Example integration:
     ```typescript
     // src/app/(teacher)/worksheets/create/page.tsx
     import { WorksheetCanvas } from '@/features/canvas/components/canvas/WorksheetCanvas';

     export default function CreateWorksheetPage() {
       return (
         <div className="container py-6">
           <h1 className="text-2xl font-bold mb-6">Create Worksheet</h1>
           <WorksheetCanvas />
         </div>
       );
     }
     ```

2. **Add Educational Controls**:
   - Extend the UI with education-specific controls:
     - Subject and topic selection dropdowns
     - Difficulty level selector
     - Learning objectives input
     - Question type options (multiple choice, short answer, etc.)

3. **Create Export Functionality**:
   - Add buttons to export the worksheet as an activity
   - Implement conversion logic to transform worksheet to activity format
   - Example component:
     ```typescript
     // src/features/canvas/components/ExportControls.tsx
     export function ExportControls({ worksheetId }: { worksheetId: string }) {
       const { mutate, isLoading } = api.worksheet.convertToActivity.useMutation();

       const handleExport = (classId: string, activityType: ActivityPurpose) => {
         mutate({ worksheetId, classId, activityType });
       };

       return (
         <div className="mt-4 space-y-2">
           <h3 className="text-lg font-medium">Export as Activity</h3>
           <ClassSelector onSelect={(classId) => setSelectedClass(classId)} />
           <ActivityTypeSelector onSelect={(type) => setActivityType(type)} />
           <Button
             onClick={() => handleExport(selectedClass, activityType)}
             disabled={isLoading}
           >
             {isLoading ? 'Converting...' : 'Export to Activity'}
           </Button>
         </div>
       );
     }
     ```

### 5. Database Integration

1. **Create a new worksheet model in Prisma schema**:
   ```prisma
   model Worksheet {
     id             String       @id @default(cuid())
     title          String
     content        Json
     teacherId      String
     subjectId      String?
     topicId        String?
     status         SystemStatus @default(DRAFT)
     createdAt      DateTime     @default(now())
     updatedAt      DateTime     @updatedAt
     teacher        TeacherProfile @relation(fields: [teacherId], references: [id])
     subject        Subject?     @relation(fields: [subjectId], references: [id])
     topic          SubjectTopic? @relation(fields: [topicId], references: [id])

     @@index([teacherId])
     @@index([subjectId])
     @@index([topicId])
     @@map("worksheets")
   }
   ```

2. **Create a Worksheet Service**:
   ```typescript
   // src/server/api/services/worksheet.service.ts
   export class WorksheetService {
     constructor(private readonly config: { prisma: PrismaClient }) {}

     async createWorksheet(input: CreateWorksheetInput) {
       return this.config.prisma.worksheet.create({
         data: {
           title: input.title,
           content: input.content,
           teacherId: input.teacherId,
           subjectId: input.subjectId,
           topicId: input.topicId,
           status: 'DRAFT',
         },
       });
     }

     async convertToActivity(input: {
       worksheetId: string;
       classId: string;
       activityType: ActivityPurpose;
     }) {
       // Get the worksheet
       const worksheet = await this.config.prisma.worksheet.findUnique({
         where: { id: input.worksheetId },
         include: { subject: true, topic: true },
       });

       if (!worksheet) {
         throw new Error('Worksheet not found');
       }

       // Convert worksheet content to activity content
       const activityContent = this.transformContent(worksheet.content);

       // Create the activity
       return this.config.prisma.activity.create({
         data: {
           title: worksheet.title,
           purpose: input.activityType,
           subjectId: worksheet.subjectId!,
           topicId: worksheet.topicId,
           classId: input.classId,
           content: activityContent,
           isGradable: input.activityType === 'ASSESSMENT',
           status: 'ACTIVE',
         },
       });
     }

     private transformContent(worksheetContent: any) {
       // Transform worksheet content to activity content format
       // This will depend on your specific content structures
       return {
         ...worksheetContent,
         version: 1,
         activityType: 'worksheet',
       };
     }
   }
   ```

### 6. API Integration

1. **Create a new tRPC router for worksheets**:
   ```typescript
   // src/server/api/routers/worksheet.ts
   export const worksheetRouter = createTRPCRouter({
     create: protectedProcedure
       .input(createWorksheetSchema)
       .mutation(async ({ ctx, input }) => {
         const service = new WorksheetService({ prisma: ctx.prisma });
         return service.createWorksheet(input);
       }),

     getById: protectedProcedure
       .input(z.object({ id: z.string() }))
       .query(async ({ ctx, input }) => {
         const service = new WorksheetService({ prisma: ctx.prisma });
         return service.getWorksheet(input.id);
       }),

     listByTeacher: protectedProcedure
       .input(z.object({
         teacherId: z.string(),
         status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
       }))
       .query(async ({ ctx, input }) => {
         const service = new WorksheetService({ prisma: ctx.prisma });
         return service.getWorksheetsByTeacher(input.teacherId, input.status);
       }),

     convertToActivity: protectedProcedure
       .input(z.object({
         worksheetId: z.string(),
         classId: z.string(),
         activityType: z.enum(['LEARNING', 'ASSESSMENT', 'PRACTICE']),
       }))
       .mutation(async ({ ctx, input }) => {
         const service = new WorksheetService({ prisma: ctx.prisma });
         return service.convertToActivity(input);
       }),
   });
   ```

2. **Add the worksheet router to the API root**:
   ```typescript
   // src/server/api/root.ts
   export const appRouter = createTRPCRouter({
     // Existing routers
     auth: authRouter,
     user: userRouter,
     // ... other routers
     worksheet: worksheetRouter,
   });
   ```

3. **Create API endpoints for LangGraph communication**:
   ```typescript
   // src/app/api/langgraph/route.ts
   import { NextRequest, NextResponse } from 'next/server';
   import { Client } from '@langchain/langgraph-sdk';
   import { getServerSession } from 'next-auth';
   import { authOptions } from '@/server/auth';

   export async function POST(req: NextRequest) {
     // Verify authentication
     const session = await getServerSession(authOptions);
     if (!session?.user) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
     }

     try {
       const { namespace, key, value } = await req.json();

       const lgClient = new Client({
         apiUrl: process.env.LANGGRAPH_API_URL,
       });

       // If value is provided, it's a PUT operation
       if (value !== undefined) {
         await lgClient.store.put(namespace, key, value);
         return NextResponse.json({ success: true });
       }
       // Otherwise it's a GET operation
       else {
         const result = await lgClient.store.get(namespace, key);
         return NextResponse.json(result);
       }
     } catch (error) {
       console.error('LangGraph API error:', error);
       return NextResponse.json(
         { error: 'Failed to communicate with LangGraph' },
         { status: 500 }
       );
     }
   }
   ```

### 7. Teacher Portal Integration

1. **Create Teacher Portal Routes**:

   Add the following files to create the worksheet section in the teacher portal:

   ```typescript
   // src/app/(teacher)/worksheets/page.tsx
   import { WorksheetList } from '@/features/canvas/components/WorksheetList';
   import { Button } from '@/components/ui/button';
   import Link from 'next/link';

   export default function WorksheetsPage() {
     return (
       <div className="container py-6">
         <div className="flex justify-between items-center mb-6">
           <h1 className="text-2xl font-bold">My Worksheets</h1>
           <Button asChild>
             <Link href="/worksheets/create">Create New Worksheet</Link>
           </Button>
         </div>
         <WorksheetList />
       </div>
     );
   }
   ```

2. **Implement Worksheet Creation Page**:
   ```typescript
   // src/app/(teacher)/worksheets/create/page.tsx
   import { WorksheetCanvas } from '@/features/canvas/components/canvas/WorksheetCanvas';
   import { SubjectTopicSelector } from '@/components/subject/SubjectTopicSelector';

   export default function CreateWorksheetPage() {
     return (
       <div className="container py-6">
         <h1 className="text-2xl font-bold mb-6">Create Worksheet</h1>
         <div className="mb-6">
           <SubjectTopicSelector
             onSubjectChange={(id) => setSubjectId(id)}
             onTopicChange={(id) => setTopicId(id)}
           />
         </div>
         <WorksheetCanvas
           subjectId={subjectId}
           topicId={topicId}
         />
       </div>
     );
   }
   ```

3. **Create Worksheet Detail Page**:
   ```typescript
   // src/app/(teacher)/worksheets/[id]/page.tsx
   import { WorksheetDetail } from '@/features/canvas/components/WorksheetDetail';
   import { api } from '@/utils/api';

   export default function WorksheetDetailPage({ params }: { params: { id: string } }) {
     const { data: worksheet, isLoading } = api.worksheet.getById.useQuery({ id: params.id });

     if (isLoading) return <div className="container py-6">Loading worksheet...</div>;
     if (!worksheet) return <div className="container py-6">Worksheet not found</div>;

     return (
       <div className="container py-6">
         <h1 className="text-2xl font-bold mb-6">{worksheet.title}</h1>
         <WorksheetDetail worksheet={worksheet} />
         <div className="mt-6">
           <h2 className="text-xl font-semibold mb-4">Export Options</h2>
           <ExportControls worksheetId={params.id} />
         </div>
       </div>
     );
   }
   ```

4. **Add Navigation Links**:
   Update the teacher navigation to include the worksheets section:

   ```typescript
   // src/components/layout/TeacherNavigation.tsx
   // Add this to your existing navigation items
   const navItems = [
     // ... existing items
     {
       title: 'Worksheets',
       href: '/worksheets',
       icon: <FileText className="h-5 w-5" />,
     },
   ];
   ```

## Environment Configuration

Add the following environment variables to `.env`:

```
# LangGraph Configuration
LANGGRAPH_API_URL=http://localhost:54367
LANGGRAPH_API_KEY=your_api_key

# LLM API Keys
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_API_KEY=your_google_key

# Web Search (optional)
EXA_API_KEY=your_exa_key
```

## Differences from Original Open Canvas

1. **Authentication**: Using our existing Next-Auth system instead of Supabase
2. **Database**: Using our Prisma schema instead of Supabase tables
3. **API**: Using tRPC instead of direct Supabase queries
4. **UI Integration**: Adapting to our existing UI components and design system
5. **Educational Focus**: Specializing the agents for worksheet generation
6. **Activity Integration**: Adding conversion to our activity system

## Limitations and Considerations

1. **Performance**: LangGraph server needs to be running for the canvas to function
2. **API Keys**: Requires API keys for the LLM providers
3. **Storage**: Worksheets will be stored in our database, not in Supabase
4. **User Experience**: May need to optimize for teacher workflow
5. **Security**: Ensure proper authentication for all API endpoints

## Future Enhancements

1. **Template Library**: Create a library of worksheet templates
2. **Collaborative Editing**: Allow multiple teachers to collaborate on worksheets
3. **Student Feedback Integration**: Incorporate student feedback into worksheet improvement
4. **Analytics**: Track worksheet effectiveness and student performance
5. **Export Options**: Add more export formats (PDF, Word, etc.)

## Implementation Timeline

1. **Week 1**: Set up LangGraph server and port agent code
2. **Week 2**: Create canvas UI components and worksheet editor
3. **Week 3**: Implement database integration and API endpoints
4. **Week 4**: Integrate with teacher portal and test end-to-end workflow
5. **Week 5**: Refine UI/UX and add export functionality
6. **Week 6**: Testing, bug fixes, and documentation

## Step-by-Step Implementation Guide

### Phase 1: Initial Setup and File Copying

1. **Copy Required Files**:
   ```bash
   # Create the target directories
   mkdir -p src/features/canvas/agents
   mkdir -p src/features/canvas/components
   mkdir -p src/features/canvas/contexts
   mkdir -p src/features/canvas/shared

   # Copy the agent files
   cp -r open-canvas-main/apps/agents/src/* src/features/canvas/agents/

   # Copy the web files
   cp -r open-canvas-main/apps/web/src/components/* src/features/canvas/components/
   cp -r open-canvas-main/apps/web/src/contexts/* src/features/canvas/contexts/

   # Copy the shared files
   cp -r open-canvas-main/packages/shared/src/* src/features/canvas/shared/

   # Copy configuration files
   cp open-canvas-main/langgraph.json ./
   ```

2. **Install Required Dependencies**:
   ```bash
   npm install @langchain/langgraph-cli @langchain/langgraph @langchain/core langchain
   npm install @langchain/anthropic @langchain/openai @langchain/google-genai
   npm install @langchain/community
   ```

3. **Update Package.json**:
   ```bash
   # Add the LangGraph server script
   npm pkg set scripts.canvas:server="npx @langchain/langgraph-cli dev --port 54367"
   ```

### Phase 2: Code Adaptation

1. **Rename and Update Files**:
   ```bash
   # Rename the open-canvas folder to worksheet
   mv src/features/canvas/agents/open-canvas src/features/canvas/agents/worksheet

   # Update imports in the main index.ts file
   # This will need manual editing to fix import paths
   ```

2. **Update LangGraph Configuration**:
   ```bash
   # Edit langgraph.json to point to the new file locations
   ```

3. **Remove Supabase Dependencies**:
   ```bash
   # Find and remove all Supabase imports and references
   find src/features/canvas -type f -name "*.ts" -o -name "*.tsx" | xargs grep -l "supabase"
   # Then manually edit these files
   ```

### Phase 3: Database and API Integration

1. **Add Prisma Schema**:
   ```bash
   # Add the Worksheet model to your schema.prisma file
   ```

2. **Create Service and Router**:
   ```bash
   # Create the worksheet service
   touch src/server/api/services/worksheet.service.ts

   # Create the worksheet router
   touch src/server/api/routers/worksheet.ts

   # Update the API root to include the new router
   ```

3. **Create API Routes**:
   ```bash
   # Create the LangGraph API route
   mkdir -p src/app/api/langgraph
   touch src/app/api/langgraph/route.ts
   ```

### Phase 4: Teacher Portal Integration

1. **Create UI Pages**:
   ```bash
   # Create the worksheet pages
   mkdir -p src/app/(teacher)/worksheets
   mkdir -p src/app/(teacher)/worksheets/create
   mkdir -p src/app/(teacher)/worksheets/[id]

   touch src/app/(teacher)/worksheets/page.tsx
   touch src/app/(teacher)/worksheets/create/page.tsx
   touch src/app/(teacher)/worksheets/[id]/page.tsx
   ```

2. **Create UI Components**:
   ```bash
   # Create the worksheet list component
   touch src/features/canvas/components/WorksheetList.tsx

   # Create the worksheet detail component
   touch src/features/canvas/components/WorksheetDetail.tsx

   # Create the export controls component
   touch src/features/canvas/components/ExportControls.tsx
   ```

3. **Update Navigation**:
   ```bash
   # Update the teacher navigation component to include worksheets
   ```

## Conclusion

This integration will provide teachers with a powerful AI-assisted worksheet generation tool that leverages the capabilities of Open Canvas while integrating seamlessly with our existing LXP system. The focus on educational content and the ability to convert worksheets into activities will streamline the content creation process for teachers.

By copying the core components from Open Canvas and adapting them to our system, we can implement this functionality relatively quickly while ensuring it works well with our existing authentication, database, and UI patterns. The step-by-step implementation guide provides a clear path to follow for successfully porting this functionality.
