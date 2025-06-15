/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom', // Changed from 'node' to 'jsdom' for React components
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      jsx: 'react',
    }],
  },
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  // Jest CLI options
  maxWorkers: 1, // Limit the number of workers to 1
  testTimeout: 30000, // Increase the test timeout
  // Reduce memory usage
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
  // Clear mocks between tests
  clearMocks: true,
  // Reduce memory usage by not collecting coverage
  collectCoverage: false,
  setupFilesAfterEnv: [
    '<rootDir>/src/server/api/__tests__/setup.ts',
    '<rootDir>/src/features/contnet-studio/__tests__/setup.ts'
  ],
};

module.exports = config;
