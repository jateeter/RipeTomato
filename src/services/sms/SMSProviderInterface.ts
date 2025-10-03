/**
 * Unified SMS Provider Interface
 * 
 * Common interface for different SMS providers (Twilio, Google Voice, etc.)
 * Allows seamless switching between providers and fallback capabilities.
 * 
 * @license MIT
 */

export interface SMSProviderMessage {
  id: string;
  to: string;
  from: string;
  body: string;
  timestamp: Date;
  status: 'queued' | 'sent' | 'delivered' | 'failed' | 'undelivered';
  providerId?: string; // Provider-specific message ID
  errorCode?: string;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  metadata?: Record<string, any>; // Provider-specific metadata
}

export interface SMSProviderCredentials {
  [key: string]: string | undefined;
}

export interface SMSProviderConfig {
  name: string;
  enabled: boolean;
  priority: number; // Lower number = higher priority for fallback
  credentials: SMSProviderCredentials;
  settings?: Record<string, any>;
}

export interface SMSSendResult {
  success: boolean;
  messageId?: string;
  providerId?: string;
  timestamp: Date;
  errorCode?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface SMSProviderStats {
  providerName: string;
  totalSent: number;
  totalFailed: number;
  successRate: number;
  lastActivity?: Date;
  isHealthy: boolean;
  errorCount: number;
}

export interface SMSProviderCapabilities {
  supportsMMS: boolean;
  supportsDeliveryReceipts: boolean;
  supportsIncoming: boolean;
  maxMessageLength: number;
  rateLimits?: {
    messagesPerSecond?: number;
    messagesPerMinute?: number;
    messagesPerDay?: number;
  };
}

/**
 * Abstract base class for SMS providers
 */
export abstract class SMSProvider {
  protected config: SMSProviderConfig;
  protected stats: SMSProviderStats;

  constructor(config: SMSProviderConfig) {
    this.config = config;
    this.stats = {
      providerName: config.name,
      totalSent: 0,
      totalFailed: 0,
      successRate: 100,
      isHealthy: true,
      errorCount: 0
    };
  }

  abstract initialize(): Promise<void>;
  abstract sendMessage(message: SMSProviderMessage): Promise<SMSSendResult>;
  abstract getCapabilities(): SMSProviderCapabilities;
  abstract healthCheck(): Promise<boolean>;
  abstract cleanup(): Promise<void>;

  getName(): string {
    return this.config.name;
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  getPriority(): number {
    return this.config.priority;
  }

  getStats(): SMSProviderStats {
    return { ...this.stats };
  }

  updateConfig(config: Partial<SMSProviderConfig>): void {
    this.config = { ...this.config, ...config };
  }

  protected updateStats(success: boolean, errorCode?: string): void {
    if (success) {
      this.stats.totalSent++;
    } else {
      this.stats.totalFailed++;
      this.stats.errorCount++;
    }
    
    this.stats.successRate = (this.stats.totalSent / (this.stats.totalSent + this.stats.totalFailed)) * 100;
    this.stats.lastActivity = new Date();
    this.stats.isHealthy = this.stats.successRate > 80; // Consider healthy if >80% success rate
  }

  protected validatePhoneNumber(phoneNumber: string): string {
    // Clean and validate phone number
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    if (cleaned.length === 10) {
      return `+1${cleaned}`; // US/Canada format
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    } else {
      throw new Error(`Invalid phone number format: ${phoneNumber}`);
    }
  }

  protected generateMessageId(): string {
    return `sms_${this.config.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}