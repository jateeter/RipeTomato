export interface EncryptionConfig {
  algorithm: string;
  keyDerivation: string;
  keyLength?: number;
  iterations?: number;
}

export interface EncryptedData {
  data: string;
  iv: string;
  salt: string;
  tag?: string;
}

export class EncryptionService {
  private config: EncryptionConfig;

  constructor(config: EncryptionConfig) {
    this.config = {
      ...config,
      keyLength: config.keyLength || 32,
      iterations: config.iterations || 100000
    };
  }

  async initialize(): Promise<void> {
    // Verify Web Crypto API is available
    if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
      throw new Error('Web Crypto API not available');
    }
  }

  async encryptObject(data: any): Promise<EncryptedData> {
    const jsonString = JSON.stringify(data);
    return await this.encrypt(jsonString);
  }

  async decryptObject(encrypted: EncryptedData): Promise<any> {
    const jsonString = await this.decrypt(encrypted);
    return JSON.parse(jsonString);
  }

  async encryptField(fieldName: string, value: string): Promise<EncryptedData> {
    return await this.encrypt(value);
  }

  async decryptField(fieldName: string, encrypted: EncryptedData): Promise<string> {
    return await this.decrypt(encrypted);
  }

  private async encrypt(plaintext: string): Promise<EncryptedData> {
    try {
      // Generate random salt and IV
      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const iv = window.crypto.getRandomValues(new Uint8Array(12));

      // Derive key from password (in production, use a proper key management system)
      const key = await this.deriveKey(salt);

      // Encode plaintext
      const encoder = new TextEncoder();
      const data = encoder.encode(plaintext);

      // Encrypt
      const encryptedData = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        data
      );

      // Convert to base64
      const encryptedArray = new Uint8Array(encryptedData);

      return {
        data: this.arrayBufferToBase64(encryptedArray),
        iv: this.arrayBufferToBase64(iv),
        salt: this.arrayBufferToBase64(salt)
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw error;
    }
  }

  private async decrypt(encrypted: EncryptedData): Promise<string> {
    try {
      // Convert from base64
      const encryptedData = this.base64ToArrayBuffer(encrypted.data);
      const iv = this.base64ToArrayBuffer(encrypted.iv);
      const salt = this.base64ToArrayBuffer(encrypted.salt);

      // Derive key
      const key = await this.deriveKey(new Uint8Array(salt));

      // Decrypt
      const decryptedData = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: new Uint8Array(iv)
        },
        key,
        encryptedData
      );

      // Decode
      const decoder = new TextDecoder();
      return decoder.decode(decryptedData);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw error;
    }
  }

  private async deriveKey(salt: Uint8Array): Promise<CryptoKey> {
    // In production, use a proper password/key from secure storage
    const password = 'idaho-events-encryption-key'; // TODO: Use secure key management

    const encoder = new TextEncoder();
    const passwordKey = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    return await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: this.config.iterations!,
        hash: 'SHA-256'
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  private arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
