# Database Seeding Documentation

## Overview

This document explains the database seeding process for the AIVY LXP application. The seeding process populates the database with initial data required for the application to function properly.

## Seed Files

The application uses a single seed file located at:

- `prisma/seed.ts` - The main seed file that is executed when running `npx prisma db seed` or `npm run db:seed`

This file combines functionality that was previously split between:
- `prisma/seed.ts` - The standard Prisma seed file
- `src/server/db/seed.ts` - A custom seed file

## What Gets Seeded

The seed file performs the following operations:

1. **Institutions and Campuses**
   - Seeds institutions from `src/server/db/seed-data/institutions`
   - Seeds campuses from `src/server/db/seed-data/campuses`

2. **Test Data**
   - Creates a test institution with code 'TEST_INST'
   - Creates a test campus with code 'MAIN'
   - Creates test users for all roles with the password 'password123':
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

Both commands will execute the same seed file.

## Extending the Seed

To add more seed data:

1. Add new seed data files in `src/server/db/seed-data/`
2. Import and use them in `prisma/seed.ts`

## Troubleshooting

If you encounter issues with seeding:

1. Make sure your database connection is properly configured in `.env`
2. Check that the Prisma schema is up to date with `npx prisma generate`
3. Ensure you have the necessary permissions to write to the database