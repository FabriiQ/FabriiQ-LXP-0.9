# Database Seeding Documentation

## Overview

This document explains the database seeding process for the AIVY LXP application. The seeding process populates the database with initial data required for the application to function properly.

## Seed Files Structure

The application uses a modular approach to database seeding:

1. **Main Seed File**:
   - `src/server/db/seed.ts` - The centralized seed file that orchestrates the seeding process

2. **Seed Data Files**:
   - `src/server/db/seed-data/institutions.ts` - Institution seed data
   - `src/server/db/seed-data/campuses.ts` - Campus seed data
   - `src/server/db/seed-data/users.ts` - User seed data

This modular approach makes it easier to maintain and extend the seed data.

## What Gets Seeded

The seed process performs the following operations:

1. **Institutions and Campuses**
   - Seeds institutions from `institutions.ts`
   - Seeds campuses from `campuses.ts`

2. **Test Data**
   - Creates a test institution with code 'TEST_INST'
   - Creates a test campus with code 'MAIN'

3. **Users**
   - Seeds users from `users.ts` with the password 'password123':
     - System Admin (sysadmin)
     - System Manager (sysmanager)
     - Campus Admin (campadmin)
     - Campus Coordinator (coordinator)
     - Campus Teacher (teacher)
     - Campus Student (student)
     - Campus Parent (parent)

## How to Run the Seed

You can run the seed process using either of these commands:

```bash
# Using npm script
npm run db:seed

# Using Prisma CLI directly
npx prisma db seed
```

Both commands will execute the same seed file at `src/server/db/seed.ts`.

## Extending the Seed

To add more seed data:

1. Add new seed data files in `src/server/db/seed-data/`
2. Import and use them in `src/server/db/seed.ts`

For example, to add course seed data:

1. Create `src/server/db/seed-data/courses.ts`
2. Import it in `src/server/db/seed.ts`
3. Add the seeding logic to the main function

## Troubleshooting

If you encounter issues with seeding:

1. Make sure your database connection is properly configured in `.env`
2. Check that the Prisma schema is up to date with `npx prisma generate`
3. Ensure you have the necessary permissions to write to the database 