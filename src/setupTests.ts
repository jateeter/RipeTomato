// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Polyfill for TextEncoder/TextDecoder required by Solid libraries
import { TextEncoder, TextDecoder } from 'util';

// @ts-ignore
global.TextEncoder = TextEncoder;
// @ts-ignore  
global.TextDecoder = TextDecoder;

// Mock fetch for tests
global.fetch = jest.fn();

// Mock console methods to reduce test noise
const originalError = console.error;
const originalWarn = console.warn;
const originalLog = console.log;

beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
  console.log = jest.fn();
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
  console.log = originalLog;
});

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
  (global.fetch as jest.Mock).mockClear();
});
