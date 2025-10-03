import { EncryptionService, EncryptedData } from './EncryptionService';

export class SecureStorage {
  private encryption: EncryptionService;
  private storageKey = 'secure-storage';

  constructor(encryption: EncryptionService) {
    this.encryption = encryption;
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      const encrypted = await this.encryption.encryptField(key, value);

      const storage = await this.getStorage();
      storage[key] = encrypted;

      await this.saveStorage(storage);
    } catch (error) {
      console.error('Failed to store secure item:', error);
      throw error;
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      const storage = await this.getStorage();
      const encrypted = storage[key];

      if (!encrypted) {
        return null;
      }

      return await this.encryption.decryptField(key, encrypted);
    } catch (error) {
      console.error('Failed to retrieve secure item:', error);
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      const storage = await this.getStorage();
      delete storage[key];
      await this.saveStorage(storage);
    } catch (error) {
      console.error('Failed to remove secure item:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Failed to clear secure storage:', error);
      throw error;
    }
  }

  private async getStorage(): Promise<Record<string, EncryptedData>> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) {
        return {};
      }
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to parse secure storage:', error);
      return {};
    }
  }

  private async saveStorage(storage: Record<string, EncryptedData>): Promise<void> {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(storage));
    } catch (error) {
      console.error('Failed to save secure storage:', error);
      throw error;
    }
  }
}
