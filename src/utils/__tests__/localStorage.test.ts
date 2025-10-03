/**
 * Tests for safe localStorage utility
 */

import { SafeLocalStorage, MemoryStorage, safeLocalStorage } from '../localStorage';

// Mock localStorage for testing
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0
};

// Mock window.localStorage
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

describe('MemoryStorage', () => {
  let memoryStorage: MemoryStorage;

  beforeEach(() => {
    memoryStorage = new MemoryStorage();
  });

  it('should store and retrieve items', () => {
    memoryStorage.setItem('key1', 'value1');
    expect(memoryStorage.getItem('key1')).toBe('value1');
  });

  it('should return null for non-existent keys', () => {
    expect(memoryStorage.getItem('non-existent')).toBeNull();
  });

  it('should remove items', () => {
    memoryStorage.setItem('key1', 'value1');
    memoryStorage.removeItem('key1');
    expect(memoryStorage.getItem('key1')).toBeNull();
  });

  it('should clear all items', () => {
    memoryStorage.setItem('key1', 'value1');
    memoryStorage.setItem('key2', 'value2');
    memoryStorage.clear();
    expect(memoryStorage.getItem('key1')).toBeNull();
    expect(memoryStorage.getItem('key2')).toBeNull();
    expect(memoryStorage.length).toBe(0);
  });

  it('should track length correctly', () => {
    expect(memoryStorage.length).toBe(0);
    memoryStorage.setItem('key1', 'value1');
    expect(memoryStorage.length).toBe(1);
    memoryStorage.setItem('key2', 'value2');
    expect(memoryStorage.length).toBe(2);
    memoryStorage.removeItem('key1');
    expect(memoryStorage.length).toBe(1);
  });
});

describe('SafeLocalStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle localStorage being available', () => {
    mockLocalStorage.setItem.mockImplementation((key, value) => {});
    mockLocalStorage.getItem.mockImplementation((key) => key === 'test' ? 'value' : null);
    
    const storage = new SafeLocalStorage();
    storage.setItem('test', 'value');
    expect(storage.getItem('test')).toBe('value');
  });

  it('should handle localStorage errors gracefully', () => {
    // Set up mocks to throw errors BEFORE creating the storage instance
    mockLocalStorage.setItem.mockImplementation(() => {
      throw new Error('localStorage full');
    });
    mockLocalStorage.getItem.mockImplementation(() => {
      throw new Error('localStorage error');
    });
    mockLocalStorage.removeItem.mockImplementation(() => {
      throw new Error('localStorage error');
    });

    const storage = new SafeLocalStorage();
    
    // Should not throw and should fallback to memory storage
    storage.setItem('test', 'value');
    // Should work using memory storage fallback
    expect(storage.getItem('test')).toBe('value');
  });

  it('should handle JSON storage', () => {
    const testObject = { name: 'test', value: 123 };
    mockLocalStorage.setItem.mockImplementation((key, value) => {});
    mockLocalStorage.getItem.mockImplementation((key) => 
      key === 'testObject' ? JSON.stringify(testObject) : null
    );

    const storage = new SafeLocalStorage();
    storage.setJSON('testObject', testObject);
    expect(storage.getJSON('testObject')).toEqual(testObject);
  });

  it('should handle invalid JSON gracefully', () => {
    mockLocalStorage.getItem.mockImplementation((key) => 
      key === 'invalidJSON' ? 'invalid json string' : null
    );

    const storage = new SafeLocalStorage();
    expect(storage.getJSON('invalidJSON')).toBeNull();
  });

  it('should indicate storage type correctly', () => {
    const storage = new SafeLocalStorage();
    // In test environment, it should use memory storage or localStorage depending on setup
    expect(['localStorage', 'memory']).toContain(storage.getStorageType());
  });
});

describe('Singleton safeLocalStorage', () => {
  it('should provide working storage methods', () => {
    // These should not throw in test environment
    safeLocalStorage.setItem('test', 'value');
    safeLocalStorage.setJSON('testObj', { test: true });
    
    // Should return null in test environment (memory storage)
    expect(safeLocalStorage.getItem('non-existent')).toBeNull();
    expect(safeLocalStorage.getJSON('non-existent')).toBeNull();
  });

  it('should handle errors gracefully', () => {
    // These operations should complete without throwing
    expect(() => {
      safeLocalStorage.clear();
      safeLocalStorage.removeItem('any-key');
    }).not.toThrow();
  });
});