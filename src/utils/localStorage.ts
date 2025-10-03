/**
 * Safe localStorage utility that handles test environments and storage errors
 * Provides fallback mechanisms for when localStorage is not available
 */

interface SafeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
  length: number;
}

class MemoryStorage implements SafeStorage {
  private storage: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.storage.get(key) || null;
  }

  setItem(key: string, value: string): void {
    this.storage.set(key, value);
  }

  removeItem(key: string): void {
    this.storage.delete(key);
  }

  clear(): void {
    this.storage.clear();
  }

  get length(): number {
    return this.storage.size;
  }
}

class SafeLocalStorage {
  private storage: SafeStorage;
  private isLocalStorageAvailable: boolean = false;

  constructor() {
    this.isLocalStorageAvailable = this.checkLocalStorageAvailability();
    
    if (this.isLocalStorageAvailable) {
      this.storage = window.localStorage;
    } else {
      console.warn('localStorage not available, using memory storage fallback');
      this.storage = new MemoryStorage();
    }
  }

  private checkLocalStorageAvailability(): boolean {
    try {
      // Check if window exists (not in Node.js/SSR)
      if (typeof window === 'undefined') {
        return false;
      }

      // Check if localStorage exists and is accessible
      if (!window.localStorage) {
        return false;
      }

      // Test if localStorage is functional
      const testKey = '__localStorage_test__';
      window.localStorage.setItem(testKey, 'test');
      const testValue = window.localStorage.getItem(testKey);
      window.localStorage.removeItem(testKey);
      
      return testValue === 'test';
    } catch (error) {
      // localStorage may exist but be disabled (private browsing, security settings, etc.)
      console.warn('localStorage access failed:', error);
      return false;
    }
  }

  getItem(key: string): string | null {
    try {
      return this.storage.getItem(key);
    } catch (error) {
      console.error(`Error getting item '${key}' from storage:`, error);
      return null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      this.storage.setItem(key, value);
    } catch (error) {
      console.error(`Error setting item '${key}' in storage:`, error);
      // If localStorage is full or disabled, fail silently
    }
  }

  removeItem(key: string): void {
    try {
      this.storage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item '${key}' from storage:`, error);
    }
  }

  clear(): void {
    try {
      this.storage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }

  get length(): number {
    try {
      return this.storage.length;
    } catch (error) {
      console.error('Error getting storage length:', error);
      return 0;
    }
  }

  // Utility methods for JSON storage
  getJSON<T>(key: string): T | null {
    try {
      const item = this.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error parsing JSON for key '${key}':`, error);
      return null;
    }
  }

  setJSON<T>(key: string, value: T): void {
    try {
      this.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error stringifying JSON for key '${key}':`, error);
    }
  }

  // Check if using memory storage (for testing/degraded functionality)
  isUsingMemoryStorage(): boolean {
    return !this.isLocalStorageAvailable;
  }

  // Get storage type for debugging
  getStorageType(): 'localStorage' | 'memory' {
    return this.isLocalStorageAvailable ? 'localStorage' : 'memory';
  }
}

// Export singleton instance
export const safeLocalStorage = new SafeLocalStorage();

// Export for testing
export { MemoryStorage, SafeLocalStorage };

// Convenience functions that match localStorage API
export const getItem = (key: string) => safeLocalStorage.getItem(key);
export const setItem = (key: string, value: string) => safeLocalStorage.setItem(key, value);
export const removeItem = (key: string) => safeLocalStorage.removeItem(key);
export const clear = () => safeLocalStorage.clear();
export const getJSON = <T>(key: string) => safeLocalStorage.getJSON<T>(key);
export const setJSON = <T>(key: string, value: T) => safeLocalStorage.setJSON<T>(key, value);