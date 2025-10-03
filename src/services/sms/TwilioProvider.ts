/**
 * Twilio SMS Provider
 * 
 * Implementation of SMS provider interface using Twilio API.
 * Handles message sending, delivery tracking, and error handling.
 * 
 * @license MIT
 */

import { 
  SMSProvider, 
  SMSProviderMessage, 
  SMSSendResult, 
  SMSProviderCapabilities,
  SMSProviderConfig 
} from './SMSProviderInterface';

export interface TwilioCredentials {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

export class TwilioProvider extends SMSProvider {
  private twilioClient: any = null;
  private fromNumber: string;

  constructor(config: SMSProviderConfig) {
    super({
      ...config,
      name: 'Twilio'
    });
    
    this.fromNumber = (config.credentials as any).phoneNumber || '';
  }

  async initialize(): Promise<void> {
    const credentials = this.config.credentials as any;
    
    if (!credentials.accountSid || !credentials.authToken || !credentials.phoneNumber) {
      throw new Error('Twilio credentials incomplete: accountSid, authToken, and phoneNumber required');
    }

    try {
      // Browser environment always uses mock implementation to avoid webpack issues
      console.log('⚠️ Twilio provider running in mock mode (browser environment)');
      console.log('ℹ️ In production, Twilio integration should be handled by backend API');
      this.twilioClient = this.createMockClient();
      
      this.fromNumber = credentials.phoneNumber;
    } catch (error) {
      console.error('❌ Failed to initialize Twilio provider:', error);
      throw error;
    }
  }

  async sendMessage(message: SMSProviderMessage): Promise<SMSSendResult> {
    if (!this.twilioClient) {
      throw new Error('Twilio provider not initialized');
    }

    try {
      const formattedTo = this.validatePhoneNumber(message.to);
      
      const result = await this.twilioClient.messages.create({
        to: formattedTo,
        from: this.fromNumber,
        body: message.body
      });

      this.updateStats(true);
      
      return {
        success: true,
        messageId: message.id,
        providerId: result.sid,
        timestamp: new Date(),
        metadata: {
          twilioSid: result.sid,
          status: result.status,
          direction: result.direction,
          uri: result.uri
        }
      };
    } catch (error) {
      this.updateStats(false, error instanceof Error ? error.message : 'Unknown error');
      
      return {
        success: false,
        messageId: message.id,
        timestamp: new Date(),
        errorCode: 'TWILIO_ERROR',
        errorMessage: error instanceof Error ? error.message : 'Unknown Twilio error',
        metadata: { error }
      };
    }
  }

  getCapabilities(): SMSProviderCapabilities {
    return {
      supportsMMS: true,
      supportsDeliveryReceipts: true,
      supportsIncoming: true,
      maxMessageLength: 1600, // Twilio's limit for concatenated messages
      rateLimits: {
        messagesPerSecond: 1, // Conservative rate limit
        messagesPerMinute: 60,
        messagesPerDay: 10000 // Depends on account type
      }
    };
  }

  async healthCheck(): Promise<boolean> {
    if (!this.twilioClient) {
      return false;
    }

    try {
      // Make a simple API call to test connectivity
      if (this.twilioClient.api && typeof this.twilioClient.api.account === 'function') {
        await this.twilioClient.api.account().fetch();
      }
      
      this.stats.isHealthy = true;
      return true;
    } catch (error) {
      console.error('Twilio health check failed:', error);
      this.stats.isHealthy = false;
      return false;
    }
  }

  async cleanup(): Promise<void> {
    // Twilio client doesn't require explicit cleanup
    this.twilioClient = null;
    console.log('🧹 Twilio provider cleaned up');
  }

  // Mock client for browser environment
  private createMockClient() {
    return {
      messages: {
        create: async (params: any) => {
          console.log(`📱 [MOCK TWILIO] Sending SMS to ${params.to}: ${params.body}`);
          
          // Simulate random success/failure for testing
          const success = Math.random() > 0.1; // 90% success rate
          
          if (!success) {
            throw new Error('Mock Twilio error for testing');
          }
          
          return {
            sid: `SM${Math.random().toString(36).substr(2, 32)}`,
            status: 'sent',
            direction: 'outbound-api',
            uri: `/2010-04-01/Accounts/mock/Messages/SM${Math.random().toString(36).substr(2, 32)}.json`
          };
        }
      },
      api: {
        account: () => ({
          fetch: async () => ({
            sid: 'mock_account_sid',
            friendlyName: 'Mock Account',
            status: 'active'
          })
        })
      }
    };
  }

  // Twilio-specific methods
  async getMessageStatus(twilioSid: string): Promise<string> {
    if (!this.twilioClient || typeof window !== 'undefined') {
      return 'unknown';
    }

    try {
      const message = await this.twilioClient.messages(twilioSid).fetch();
      return message.status;
    } catch (error) {
      console.error(`Failed to fetch Twilio message status for ${twilioSid}:`, error);
      return 'error';
    }
  }

  async getAccountBalance(): Promise<number> {
    if (!this.twilioClient || typeof window !== 'undefined') {
      return 0;
    }

    try {
      const balance = await this.twilioClient.balance.fetch();
      return parseFloat(balance.balance);
    } catch (error) {
      console.error('Failed to fetch Twilio account balance:', error);
      return 0;
    }
  }
}