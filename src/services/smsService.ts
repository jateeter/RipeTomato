/**
 * SMS Service
 * 
 * Unified SMS service supporting multiple providers (Twilio, Google Voice)
 * with automatic fallback, delivery tracking, retry logic, and client
 * preference management. Provides a single interface for all SMS operations.
 * 
 * @license MIT
 */

import { safeLocalStorage } from '../utils/localStorage';
import { 
  UnifiedSMSManager, 
  UnifiedSMSConfig, 
  UnifiedSMSStats 
} from './sms/UnifiedSMSManager';
import { 
  SMSProviderMessage, 
  SMSSendResult 
} from './sms/SMSProviderInterface';

export interface SMSMessage {
  id: string;
  to: string;
  from: string;
  body: string;
  timestamp: Date;
  status: 'queued' | 'sent' | 'delivered' | 'failed' | 'undelivered';
  providerId?: string; // Provider-specific message ID (Twilio SID, Google Voice ID, etc.)
  providerName?: string; // Which provider sent the message
  errorCode?: string;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
}

export interface SMSTemplate {
  id: string;
  name: string;
  category: 'wakeup' | 'reminder' | 'alert' | 'confirmation' | 'general';
  template: string;
  variables: string[];
  active: boolean;
}

export interface ClientSMSPreferences {
  clientId: string;
  phoneNumber: string;
  optedIn: boolean;
  wakeupEnabled: boolean;
  reminderEnabled: boolean;
  alertEnabled: boolean;
  quietHours?: {
    start: string; // HH:MM format
    end: string;
  };
  timezone: string;
  lastUpdated: Date;
}

class SMSService {
  private smsManager!: UnifiedSMSManager;
  private messageQueue: SMSMessage[] = [];
  private templates: Map<string, SMSTemplate> = new Map();
  private clientPreferences: Map<string, ClientSMSPreferences> = new Map();
  private isProcessingQueue = false;

  constructor() {
    this.initializeUnifiedSMS();
    this.loadTemplates();
    this.loadClientPreferences();
  }

  private initializeUnifiedSMS(): void {
    // Configure SMS providers with environment variables
    const config: UnifiedSMSConfig = {
      providers: [
        {
          name: 'Twilio',
          enabled: true,
          priority: 1, // Primary provider
          credentials: {
            accountSid: process.env.REACT_APP_TWILIO_ACCOUNT_SID || '',
            authToken: process.env.REACT_APP_TWILIO_AUTH_TOKEN || '',
            phoneNumber: process.env.REACT_APP_TWILIO_PHONE_NUMBER || ''
          }
        },
        {
          name: 'Google Voice',
          enabled: true,
          priority: 2, // Fallback provider
          credentials: {
            email: process.env.REACT_APP_GOOGLE_VOICE_EMAIL || '',
            phoneNumber: process.env.REACT_APP_GOOGLE_VOICE_NUMBER || '',
            clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.REACT_APP_GOOGLE_CLIENT_SECRET || ''
          }
        }
      ],
      fallbackEnabled: true,
      maxRetries: 3,
      retryDelay: 2000, // 2 seconds
      healthCheckInterval: 5 * 60 * 1000, // 5 minutes
      loadBalancing: 'priority'
    };

    this.smsManager = new UnifiedSMSManager(config);
    
    // Initialize asynchronously
    this.smsManager.initialize()
      .then(() => {
        console.log('✅ Unified SMS Service initialized successfully');
      })
      .catch(error => {
        console.error('❌ Failed to initialize SMS Service:', error);
        console.log('ℹ️ SMS Service will operate in mock mode');
      });
  }

  private loadTemplates(): void {
    // Load default SMS templates
    const defaultTemplates: SMSTemplate[] = [
      {
        id: 'wakeup_gentle',
        name: 'Gentle Wake-up',
        category: 'wakeup',
        template: 'Good morning {{clientName}}! Time to start your day. Your bed at {{facilityName}} needs to be vacated by {{checkoutTime}}. Have a great day!',
        variables: ['clientName', 'facilityName', 'checkoutTime'],
        active: true
      },
      {
        id: 'wakeup_urgent',
        name: 'Urgent Wake-up',
        category: 'wakeup',
        template: 'URGENT: {{clientName}}, you must check out of bed {{bedNumber}} at {{facilityName}} immediately. Checkout time was {{checkoutTime}}.',
        variables: ['clientName', 'bedNumber', 'facilityName', 'checkoutTime'],
        active: true
      },
      {
        id: 'wakeup_15min',
        name: '15 Minute Warning',
        category: 'wakeup',
        template: 'Hi {{clientName}}, you have 15 minutes before checkout time ({{checkoutTime}}) at {{facilityName}}. Please prepare to leave.',
        variables: ['clientName', 'checkoutTime', 'facilityName'],
        active: true
      },
      {
        id: 'meal_reminder',
        name: 'Meal Service Reminder',
        category: 'reminder',
        template: 'Hi {{clientName}}! {{mealType}} service starts in 30 minutes at {{location}}. Don\'t miss it!',
        variables: ['clientName', 'mealType', 'location'],
        active: true
      },
      {
        id: 'appointment_reminder',
        name: 'Appointment Reminder',
        category: 'reminder',
        template: 'Reminder: {{clientName}}, you have an appointment for {{serviceType}} at {{time}} today at {{location}}.',
        variables: ['clientName', 'serviceType', 'time', 'location'],
        active: true
      }
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });

    console.log(`📝 Loaded ${this.templates.size} SMS templates`);
  }

  private loadClientPreferences(): void {
    // Load client preferences from storage
    const stored = safeLocalStorage.getJSON<Array<[string, ClientSMSPreferences]>>('sms_client_preferences');
    if (stored) {
      this.clientPreferences = new Map(stored);
      console.log(`👥 Loaded SMS preferences for ${this.clientPreferences.size} clients`);
    }
  }

  private saveClientPreferences(): void {
    const preferencesArray = Array.from(this.clientPreferences.entries());
    safeLocalStorage.setJSON('sms_client_preferences', preferencesArray);
  }

  // Client preference management
  async setClientPreferences(preferences: ClientSMSPreferences): Promise<void> {
    this.clientPreferences.set(preferences.clientId, {
      ...preferences,
      lastUpdated: new Date()
    });
    
    this.saveClientPreferences();
    console.log(`✅ Updated SMS preferences for client ${preferences.clientId}`);
  }

  getClientPreferences(clientId: string): ClientSMSPreferences | null {
    return this.clientPreferences.get(clientId) || null;
  }

  async optInClient(clientId: string, phoneNumber: string): Promise<void> {
    const existing = this.clientPreferences.get(clientId);
    const preferences: ClientSMSPreferences = {
      clientId,
      phoneNumber,
      optedIn: true,
      wakeupEnabled: true,
      reminderEnabled: true,
      alertEnabled: true,
      timezone: 'America/Los_Angeles', // Default to Pacific Time for Idaho
      lastUpdated: new Date(),
      ...existing
    };

    await this.setClientPreferences(preferences);
  }

  async optOutClient(clientId: string): Promise<void> {
    const existing = this.clientPreferences.get(clientId);
    if (existing) {
      await this.setClientPreferences({
        ...existing,
        optedIn: false,
        wakeupEnabled: false,
        reminderEnabled: false,
        alertEnabled: false
      });
    }
  }

  // Template management
  getTemplate(templateId: string): SMSTemplate | null {
    return this.templates.get(templateId) || null;
  }

  private renderTemplate(templateId: string, variables: Record<string, string>): string {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`SMS template not found: ${templateId}`);
    }

    let rendered = template.template;
    for (const [key, value] of Object.entries(variables)) {
      rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    return rendered;
  }

  // Message sending
  async sendSMS(to: string, body: string, options?: {
    templateId?: string;
    variables?: Record<string, string>;
    priority?: 'low' | 'normal' | 'high';
    maxRetries?: number;
  }): Promise<SMSMessage> {
    const messageId = `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Use template if provided
    let messageBody = body;
    if (options?.templateId && options?.variables) {
      messageBody = this.renderTemplate(options.templateId, options.variables);
    }

    const message: SMSMessage = {
      id: messageId,
      to: to.replace(/\D/g, ''), // Remove non-digits
      from: process.env.REACT_APP_TWILIO_PHONE_NUMBER || '+1234567890',
      body: messageBody,
      timestamp: new Date(),
      status: 'queued',
      retryCount: 0,
      maxRetries: options?.maxRetries || 3
    };

    this.messageQueue.push(message);
    console.log(`📤 Queued SMS message to ${message.to}`);

    // Process queue if not already processing
    if (!this.isProcessingQueue) {
      this.processMessageQueue();
    }

    return message;
  }

  async sendWakeupSMS(clientId: string, options: {
    templateId?: string;
    urgency?: 'gentle' | 'normal' | 'urgent';
    bedNumber?: string;
    facilityName?: string;
    checkoutTime?: string;
  }): Promise<SMSMessage | null> {
    const preferences = this.getClientPreferences(clientId);
    
    if (!preferences || !preferences.optedIn || !preferences.wakeupEnabled) {
      console.log(`⏭️ SMS wake-up skipped for client ${clientId} (not opted in or disabled)`);
      return null;
    }

    // Check quiet hours
    if (this.isInQuietHours(preferences)) {
      console.log(`🔇 SMS wake-up skipped for client ${clientId} (quiet hours)`);
      return null;
    }

    // Select appropriate template
    let templateId = options.templateId;
    if (!templateId) {
      switch (options.urgency) {
        case 'gentle':
          templateId = 'wakeup_gentle';
          break;
        case 'urgent':
          templateId = 'wakeup_urgent';
          break;
        default:
          templateId = 'wakeup_15min';
      }
    }

    const variables = {
      clientName: 'Client', // TODO: Get actual client name
      bedNumber: options.bedNumber || 'N/A',
      facilityName: options.facilityName || 'Community Shelter',
      checkoutTime: options.checkoutTime || '7:00 AM'
    };

    return await this.sendSMS(preferences.phoneNumber, '', {
      templateId,
      variables,
      priority: options.urgency === 'urgent' ? 'high' : 'normal',
      maxRetries: options.urgency === 'urgent' ? 5 : 3
    });
  }

  private isInQuietHours(preferences: ClientSMSPreferences): boolean {
    if (!preferences.quietHours) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    return currentTime >= preferences.quietHours.start && currentTime <= preferences.quietHours.end;
  }

  private async processMessageQueue(): Promise<void> {
    if (this.isProcessingQueue || this.messageQueue.length === 0) return;

    this.isProcessingQueue = true;

    try {
      while (this.messageQueue.length > 0) {
        const message = this.messageQueue.shift()!;
        await this.sendMessage(message);
        
        // Small delay between messages to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  private async sendMessage(message: SMSMessage): Promise<void> {
    try {
      // Convert to provider message format
      const providerMessage: SMSProviderMessage = {
        id: message.id,
        to: message.to,
        from: message.from,
        body: message.body,
        timestamp: message.timestamp,
        status: message.status,
        retryCount: message.retryCount,
        maxRetries: message.maxRetries
      };

      // Send via unified SMS manager
      const result: SMSSendResult = await this.smsManager.sendMessage(providerMessage);

      if (result.success) {
        message.status = 'sent';
        message.providerId = result.providerId;
        message.providerName = result.metadata?.providerName;
        console.log(`✅ SMS sent successfully: ${message.id} via ${message.providerName}`);
      } else {
        message.status = 'failed';
        message.errorCode = result.errorCode;
        message.errorMessage = result.errorMessage;
        message.retryCount++;

        console.error(`❌ Failed to send SMS ${message.id}:`, result.errorMessage);

        // Retry if under max retry limit
        if (message.retryCount < message.maxRetries) {
          console.log(`🔄 Retrying SMS ${message.id} (attempt ${message.retryCount + 1}/${message.maxRetries})`);
          
          // Re-queue with exponential backoff delay
          setTimeout(() => {
            this.messageQueue.unshift(message);
            if (!this.isProcessingQueue) {
              this.processMessageQueue();
            }
          }, Math.pow(2, message.retryCount) * 1000);
        }
      }
    } catch (error) {
      message.status = 'failed';
      message.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      message.retryCount++;

      console.error(`❌ Exception while sending SMS ${message.id}:`, error);

      // Retry if under max retry limit
      if (message.retryCount < message.maxRetries) {
        console.log(`🔄 Retrying SMS ${message.id} after exception (attempt ${message.retryCount + 1}/${message.maxRetries})`);
        
        setTimeout(() => {
          this.messageQueue.unshift(message);
          if (!this.isProcessingQueue) {
            this.processMessageQueue();
          }
        }, Math.pow(2, message.retryCount) * 1000);
      }
    }
  }

  // Status and monitoring
  getQueueSize(): number {
    return this.messageQueue.length;
  }

  getTemplates(): SMSTemplate[] {
    return Array.from(this.templates.values());
  }

  getAllClientPreferences(): ClientSMSPreferences[] {
    return Array.from(this.clientPreferences.values());
  }

  // Statistics
  async getMessageStats(): Promise<{
    totalSent: number;
    totalFailed: number;
    queueSize: number;
    optedInClients: number;
    providers?: any[];
    successRate?: number;
  }> {
    let unifiedStats: UnifiedSMSStats | undefined;
    
    try {
      unifiedStats = this.smsManager.getStats();
    } catch (error) {
      console.warn('Failed to get unified SMS stats:', error);
    }

    const fallbackStats = safeLocalStorage.getJSON<any>('sms_stats') || {
      totalSent: 0,
      totalFailed: 0
    };

    return {
      totalSent: unifiedStats?.totalSent || fallbackStats.totalSent || 0,
      totalFailed: unifiedStats?.totalFailed || fallbackStats.totalFailed || 0,
      queueSize: this.messageQueue.length,
      optedInClients: Array.from(this.clientPreferences.values())
        .filter(p => p.optedIn).length,
      providers: unifiedStats?.providers,
      successRate: unifiedStats?.successRate
    };
  }

  // New methods for unified SMS management
  
  getSMSProviderStats(): UnifiedSMSStats | null {
    try {
      return this.smsManager.getStats();
    } catch (error) {
      console.warn('Failed to get SMS provider stats:', error);
      return null;
    }
  }

  getAvailableProviders(): string[] {
    try {
      return this.smsManager.getAvailableProviderNames();
    } catch (error) {
      console.warn('Failed to get available providers:', error);
      return [];
    }
  }

  getHealthyProviders(): string[] {
    try {
      return this.smsManager.getHealthyProviderNames();
    } catch (error) {
      console.warn('Failed to get healthy providers:', error);
      return [];
    }
  }

  async enableProvider(providerName: string): Promise<boolean> {
    try {
      return await this.smsManager.enableProvider(providerName);
    } catch (error) {
      console.error(`Failed to enable provider ${providerName}:`, error);
      return false;
    }
  }

  disableProvider(providerName: string): boolean {
    try {
      return this.smsManager.disableProvider(providerName);
    } catch (error) {
      console.error(`Failed to disable provider ${providerName}:`, error);
      return false;
    }
  }

  async testProvider(providerName: string, testPhoneNumber: string): Promise<boolean> {
    try {
      const result = await this.smsManager.testProvider(providerName, testPhoneNumber);
      return result.success;
    } catch (error) {
      console.error(`Failed to test provider ${providerName}:`, error);
      return false;
    }
  }
}

export const smsService = new SMSService();
export default smsService;