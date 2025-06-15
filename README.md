# Aivy LXP (Learning Experience Platform)

A modern learning experience platform built with Next.js 14+, tRPC, and TypeScript.

## Tech Stack

- **Frontend**: Next.js 14+, React 18, Tailwind CSS
- **Backend**: tRPC, Prisma, PostgreSQL
- **Authentication**: NextAuth.js v5
- **State Management**: React Query, Zustand
- **UI Components**: shadcn/ui, Radix UI
- **Testing**: Jest, React Testing Library, Cypress
- **Type Safety**: TypeScript, Zod

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- pnpm (recommended) or npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/aivy-lxp.git
   cd aivy-lxp
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration.

4. Set up the database:
   ```bash
   pnpm prisma generate
   pnpm prisma migrate dev
   ```

5. Start the development server:
   ```bash
   pnpm dev
   ```

Visit `http://localhost:3000` to see the application.

## Project Structure

```
/src
├── app                      # Next.js App Router
│   ├── (auth)              # Authentication Routes
│   ├── (system-admin)      # System Admin Portal
│   ├── (campus-admin)      # Campus Admin Portal
│   ├── (coordinator)       # Coordinator Portal
│   ├── (teacher)           # Teacher Portal
│   ├── (student)           # Student Portal
│   └── api                 # API Routes
├── components              # React Components
├── server                  # Backend Logic
├── lib                     # Shared Utilities
├── types                   # TypeScript Types
└── styles                  # Global Styles
```

## Features

- **Multi-tenant Architecture**: Support for multiple institutions and campuses
- **Role-based Access Control**: Different portals for different user roles
- **Real-time Updates**: WebSocket integration for live updates
- **Analytics System**: Track user interactions and system performance
- **Feedback System**: Comprehensive feedback management
- **Professional Development**: Track teacher training and certifications

## User Preferences

The application now supports user preferences, allowing users to customize their experience. The preferences include:

- Theme selection (light/dark/system)
- Accessibility options
- Notification preferences
- Display preferences

### Accessing User Preferences

Users can access their preferences through:

1. The settings icon in the top-right corner of the application
2. The user dropdown menu > Settings
3. Directly navigating to `/settings/preferences`

### Settings Navigation

The settings section includes the following pages:

- Account Settings
- Preferences
- Notifications
- Security

### Technical Implementation

The user preferences functionality is implemented using:

- Prisma schema with a `UserPreferences` model
- React Context API for state management
- Server-side API endpoints for persistence
- Client-side components for the user interface
- Centralized default preferences and types in `src/server/api/constants.ts`

Default preferences are role-based, with different defaults for different user types (students, teachers, administrators, etc.). The preferences are stored in the user's profile data as JSON and synchronized across devices. When offline, preferences fall back to local storage.

## Development

### Commands

- `pnpm dev`: Start development server
- `pnpm build`: Build for production
- `pnpm start`: Start production server
- `pnpm test`: Run tests
- `pnpm test:e2e`: Run end-to-end tests
- `pnpm lint`: Lint code
- `pnpm prisma:generate`: Generate Prisma client
- `pnpm prisma:migrate`: Run database migrations

### Code Style

- ESLint for code linting
- Prettier for code formatting
- TypeScript for type safety
- Conventional Commits for commit messages

## Testing

- Unit tests with Jest and React Testing Library
- End-to-end tests with Cypress
- API tests with tRPC test clients

## Deployment

The application is designed to be deployed on Vercel with the following considerations:

- PostgreSQL database on a managed service
- Redis for caching (optional)
- S3 or similar for file storage
- CDN for static assets

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Proprietry 

## Database Seeding

The application uses Prisma for database management and includes a seeding mechanism to populate the database with initial data. The seeding process follows this order:

1. Institutions - Basic information about educational institutions
2. Campuses - Physical locations associated with institutions
3. Users - System users including administrators for each institution
4. Academic Cycles - Academic periods (years, semesters, etc.) for each institution

### Seed Files

- `src/server/db/seed-data/institutions.ts` - Contains institution data
- `src/server/db/seed-data/campuses.ts` - Contains campus data linked to institutions
- `src/server/db/seed-data/users.ts` - Contains system users and test users
- `src/server/db/seed-data/academic-cycles.ts` - Contains academic cycle data for each institution

### Running Seeds

To seed the database:

```bash
npm run db:seed
```

### Important Notes

- The seeding order is critical because academic cycles require users as creators/updaters
- Each institution needs at least one administrator user before academic cycles can be created
- The seed process automatically creates admin users for each institution 

## Dashboard Routing System

The application implements a role-based dashboard routing system that directs users to their appropriate dashboards based on their user type:

- **System Admin**: `/admin/system`
- **Campus Admin**: `/admin/campus`
- **Campus Coordinator**: `/admin/coordinator`
- **Teacher**: `/teacher/dashboard`
- **Student**: `/student/dashboard`
- **Parent**: `/parent/dashboard`

### How It Works

1. When a user navigates to `/dashboard`, the dashboard layout component checks their user type.
2. Based on the user type, the layout performs a client-side navigation to the appropriate dashboard.
3. The Shell component provides a consistent navigation experience across all dashboard types.

### Implementation Details

- The dashboard redirection happens in `src/app/dashboard/layout.tsx`
- Role-specific dashboard content is implemented in each dashboard page
- The navigation sidebar adapts to show relevant links based on the user's role

## Layout System

The application uses a multi-layered layout system to provide consistent UI across different user roles:

### Admin Layout

- Located at `src/app/admin/layout.tsx`
- Provides a sidebar with role-specific navigation items for admin users
- Handles responsive behavior for mobile and desktop views
- Used for system admin, campus admin, and coordinator routes

### Shell Component

- Located at `src/components/layout/shell.tsx`
- Provides a consistent layout for non-admin routes
- Conditionally renders its sidebar based on the current route
- For admin routes, it only renders the main content without a sidebar to avoid duplicate sidebars

### AppShellWrapper

- Located at `src/components/layout/app-shell-wrapper.tsx`
- Manages authentication state and conditionally wraps content with the Shell component
- Used as a higher-order component to provide consistent layout across the application

## TRPC Router System

The application uses tRPC for type-safe API calls with the following structure:

- Root router (`src/server/api/root.ts`) combines all sub-routers
- Each domain has its own router file (e.g., `academic-cycle.router.ts`, `term.ts`)
- Services handle business logic and database operations
- Routers define endpoints and handle request validation

### Important Routers

- `academicCycle`: Manages academic cycles (years, semesters, etc.)
- `term`: Manages terms within academic cycles
- `auth`: Handles authentication and user sessions
- `user`: Manages user profiles and preferences

### Using Toast Notifications

The application uses a custom toast notification system:

- Import the `useToast` hook from `@/components/ui/feedback/toast`
- Use the `addToast` method to show notifications
- Specify `title`, `description`, and `variant` ('success', 'error', 'warning', 'default') 

# Campus Management System

A comprehensive system for managing educational campuses, including facilities, programs, classes, teachers, and students.

## Overview

The Campus Management System is designed to provide educational institutions with a robust platform for managing all aspects of their campuses. The system allows administrators to:

- Manage multiple campuses with detailed information
- Track facilities and their usage
- Manage academic programs and their offerings
- Organize classes and schedules
- Assign teachers to campuses and classes
- Enroll students in programs and classes
- Monitor campus activities and performance

## Features

### Campus Management

- Create, view, update, and delete campuses
- Track campus details including location, contact information, and status
- Associate programs with campuses
- Manage campus-specific settings and features

### Facility Management

- Create, view, update, and delete facilities
- Categorize facilities by type (classroom, laboratory, etc.)
- Track facility capacity and resources
- Monitor facility usage and availability
- Schedule classes in appropriate facilities

### Program Management

- Offer academic programs at specific campuses
- Track program details including curriculum and requirements
- Associate courses and subjects with programs
- Monitor program enrollment and performance

### Class Management

- Create and manage classes for specific programs and terms
- Assign teachers to classes
- Schedule classes in appropriate facilities
- Track class enrollment and attendance

### Teacher Management

- Assign teachers to campuses
- Track teacher qualifications and specializations
- Manage teacher schedules and assignments
- Monitor teacher performance and feedback

### Student Management

- Enroll students in campus programs
- Track student academic progress
- Manage student class enrollments
- Monitor student attendance and performance

## Technical Architecture

The Campus Management System is built using a modern tech stack:

- **Frontend**: Next.js with React and TypeScript
- **Backend**: tRPC API with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **UI Components**: Shadcn UI with Tailwind CSS

### Key Components

#### API Services

- **Campus Service**: Manages campus-related operations
- **Facility Service**: Handles facility management
- **User Service**: Manages user accounts and campus assignments
- **Student Service**: Handles student enrollments and academic records

#### UI Components

- **Campus Management UI**: Pages for managing campuses
- **Facility Management UI**: Pages for managing facilities
- **Teacher Management UI**: Pages for managing teacher assignments
- **Student Management UI**: Pages for managing student enrollments
- **Class Management UI**: Pages for managing classes and schedules

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- PostgreSQL (v13 or later)
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-organization/campus-management-system.git
   cd campus-management-system
   ```

2. Install dependencies:
   ```
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   ```
   cp .env.example .env
   # Edit .env with your database credentials and other settings
   ```

4. Run database migrations:
   ```
   npx prisma migrate dev
   ```

5. Start the development server:
   ```
   npm run dev
   # or
   yarn dev
   ```

6. Open your browser and navigate to `http://localhost:3000`

## Usage

### System Administration

1. Create campuses with detailed information
2. Set up facilities for each campus
3. Configure academic programs and their offerings
4. Create terms and academic calendars

### Campus Management

1. Assign teachers to campuses
2. Enroll students in campus programs
3. Create classes for specific programs and terms
4. Schedule classes in appropriate facilities

### Reporting and Analytics

1. Monitor campus performance metrics
2. Track facility usage and availability
3. Analyze student enrollment and academic progress
4. Evaluate teacher performance and workload

## Contributing

We welcome contributions to the Campus Management System! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Thanks to all contributors who have helped build this system
- Special thanks to the educational institutions that provided valuable feedback during development 