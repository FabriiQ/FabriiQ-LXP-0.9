# Question Banks for Subjects

This directory contains scripts related to the question bank feature, particularly for ensuring that all subjects have associated question banks.

## Background

Question banks are automatically created when new subjects are added to courses. However, for existing subjects that were created before this feature was implemented, we need to run a script to create question banks for them.

## Available Scripts

### `create-question-banks-for-subjects.ts`

This script finds all active subjects that don't have associated question banks and creates a question bank for each one.

#### Usage

Run the script using the following command:

```bash
npm run create-question-banks
```

Or directly with ts-node:

```bash
npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/create-question-banks-for-subjects.ts
```

#### What the Script Does

1. Queries all active subjects in the system
2. For each subject:
   - Checks if a question bank already exists (by looking for questions associated with the subject)
   - If no question bank exists, creates one with appropriate naming and association
   - Uses the institution ID from the course's campus to associate the question bank with the correct institution
3. Logs the results for monitoring

#### Output

The script will output:
- Progress information as it processes each subject
- A summary at the end showing:
  - Total number of subjects processed
  - Number of question banks created
  - Number of subjects skipped (already had question banks)
  - Number of errors encountered

## Implementation Details

The script uses the `QuestionBankService` to create question banks, ensuring consistency with the automatic creation process that happens when new subjects are added.

Each question bank is named using the pattern: `{Course Name} - {Subject Name} Question Bank`

## Troubleshooting

If you encounter any issues:

1. Check that the Prisma client can connect to the database
2. Ensure that subjects have associated courses
3. Verify that courses have campus offerings with valid institution IDs
4. Check the console output for specific error messages

## Related Files

- `src/features/question-bank/services/question-bank.service.ts` - Service used to create question banks
- `src/server/api/services/subject.service.ts` - Service that automatically creates question banks for new subjects
