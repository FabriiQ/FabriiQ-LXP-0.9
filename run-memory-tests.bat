@echo off
echo Running tests with memory-optimized configuration...
set NODE_OPTIONS=--max-old-space-size=2048
npx jest --config jest.config.memory.js %*
