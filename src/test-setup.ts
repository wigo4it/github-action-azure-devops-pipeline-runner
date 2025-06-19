// Test setup file for Jest
// Global test configuration and utilities

// Set longer timeout for async operations
jest.setTimeout(10000);

// Mock node-fetch to avoid ESM issues
jest.mock('node-fetch');
