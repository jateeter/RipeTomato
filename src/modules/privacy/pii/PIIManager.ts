import { EncryptionService } from './EncryptionService';
import { SecureStorage } from './SecureStorage';

export interface PIIManagerConfig {
  encryptionService: EncryptionService;
  storageProvider: 'solid' | 'hat' | 'local';
}

export interface ClientPIIData {
  ssn?: string;
  dateOfBirth?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  phoneNumber?: string;
  email?: string;
  medicalRecords?: any[];
}

export class PIIManager {
  private encryption: EncryptionService;
  private secureStorage: SecureStorage;
  private storageProvider: string;

  constructor(config: PIIManagerConfig) {
    this.encryption = config.encryptionService;
    this.secureStorage = new SecureStorage(this.encryption);
    this.storageProvider = config.storageProvider;
  }

  async storeClientData(clientId: string, data: ClientPIIData): Promise<void> {
    try {
      const encrypted = await this.encryption.encryptObject(data);

      const storageKey = `client-pii-${clientId}`;

      if (this.storageProvider === 'local') {
        await this.secureStorage.setItem(storageKey, JSON.stringify(encrypted));
      } else {
        // For Solid/HAT, you would use their respective data services
        throw new Error('Solid/HAT storage not yet implemented in PIIManager');
      }
    } catch (error) {
      console.error('Failed to store client PII:', error);
      throw error;
    }
  }

  async retrieveClientData(clientId: string): Promise<ClientPIIData | null> {
    try {
      const storageKey = `client-pii-${clientId}`;

      let encryptedString: string | null = null;

      if (this.storageProvider === 'local') {
        encryptedString = await this.secureStorage.getItem(storageKey);
      } else {
        throw new Error('Solid/HAT storage not yet implemented in PIIManager');
      }

      if (!encryptedString) {
        return null;
      }

      const encrypted = JSON.parse(encryptedString);
      return await this.encryption.decryptObject(encrypted);
    } catch (error) {
      console.error('Failed to retrieve client PII:', error);
      return null;
    }
  }

  async updateClientData(clientId: string, updates: Partial<ClientPIIData>): Promise<void> {
    try {
      const existing = await this.retrieveClientData(clientId);

      const merged = {
        ...existing,
        ...updates
      };

      await this.storeClientData(clientId, merged);
    } catch (error) {
      console.error('Failed to update client PII:', error);
      throw error;
    }
  }

  async deleteClientData(clientId: string): Promise<void> {
    try {
      const storageKey = `client-pii-${clientId}`;

      if (this.storageProvider === 'local') {
        await this.secureStorage.removeItem(storageKey);
      } else {
        throw new Error('Solid/HAT storage not yet implemented in PIIManager');
      }
    } catch (error) {
      console.error('Failed to delete client PII:', error);
      throw error;
    }
  }

  async exportClientData(clientId: string, format: 'json' | 'encrypted' = 'json'): Promise<string> {
    try {
      const data = await this.retrieveClientData(clientId);

      if (!data) {
        throw new Error('No data found for client');
      }

      if (format === 'json') {
        return JSON.stringify(data, null, 2);
      } else {
        const encrypted = await this.encryption.encryptObject(data);
        return JSON.stringify(encrypted, null, 2);
      }
    } catch (error) {
      console.error('Failed to export client PII:', error);
      throw error;
    }
  }
}
