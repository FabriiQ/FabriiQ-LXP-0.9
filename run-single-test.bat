@echo off
echo Running single test with memory-optimized configuration...
set NODE_OPTIONS=--max-old-space-size=2048
npm test -- --config jest.config.memory.js %*
