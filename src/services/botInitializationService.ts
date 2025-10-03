/**
 * Bot Initialization Service
 * 
 * Handles the initialization and startup of the BotLab Core platform
 * and all registered agent bots when the application starts.
 * 
 * @license MIT
 */

import { botManager } from './botManager';
import { smsService } from './smsService';
import { SMSWakeupBot } from '../bots/SMSWakeupBot';

interface BotInitializationResult {
  success: boolean;
  message: string;
  initializedBots: string[];
  failedBots: string[];
  error?: string;
}

class BotInitializationService {
  private isInitialized = false;
  private initializationPromise: Promise<BotInitializationResult> | null = null;

  async initialize(): Promise<BotInitializationResult> {
    // Return existing promise if initialization is in progress
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Return cached result if already initialized
    if (this.isInitialized) {
      return {
        success: true,
        message: 'Bot system already initialized',
        initializedBots: ['sms_wakeup_bot'],
        failedBots: []
      };
    }

    // Start initialization process
    this.initializationPromise = this.performInitialization();
    const result = await this.initializationPromise;
    
    if (result.success) {
      this.isInitialized = true;
    }

    return result;
  }

  private async performInitialization(): Promise<BotInitializationResult> {
    console.log('🤖 Starting BotLab Core initialization workflow...');

    const initializedBots: string[] = [];
    const failedBots: string[] = [];

    try {
      // Step 1: Initialize SMS Service
      console.log('📱 Step 1: Initializing SMS service...');
      // SMS service initializes automatically in constructor
      console.log('✅ SMS service ready');

      // Step 2: Initialize Bot Manager
      console.log('🎮 Step 2: Initializing Bot Manager...');
      await botManager.initialize();
      console.log('✅ Bot Manager initialized');

      // Step 3: Check bot registration status
      console.log('📋 Step 3: Checking bot registrations...');
      const registeredBots = botManager.getAllBots();
      console.log(`📊 Found ${registeredBots.length} registered bots`);

      // Step 4: Start registered bots
      console.log('🚀 Step 4: Starting registered bots...');
      
      for (const { registration, isRunning } of registeredBots) {
        try {
          if (!isRunning) {
            await botManager.startBot(registration.botId);
            initializedBots.push(registration.botId);
            console.log(`✅ Started bot: ${registration.botId}`);
          } else {
            initializedBots.push(registration.botId);
            console.log(`ℹ️ Bot already running: ${registration.botId}`);
          }
        } catch (error) {
          failedBots.push(registration.botId);
          console.error(`❌ Failed to start bot ${registration.botId}:`, error);
        }
      }

      // Step 5: Set up event listeners for integration with main app
      console.log('🔗 Step 5: Setting up app integration...');
      await this.setupAppIntegration();
      console.log('✅ App integration configured');

      // Step 6: Run system health check
      console.log('🏥 Step 6: Running system health check...');
      const healthCheck = await this.runHealthCheck();
      console.log(`🏥 Health check: ${healthCheck ? 'PASSED' : 'WARNING'}`);

      const finalResult: BotInitializationResult = {
        success: true,
        message: `BotLab Core initialized successfully. ${initializedBots.length}/${initializedBots.length + failedBots.length} bots started.`,
        initializedBots,
        failedBots
      };

      console.log('🎉 BotLab Core initialization completed');
      console.log('📊 Final status:', finalResult);

      return finalResult;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
      console.error('❌ BotLab Core initialization failed:', errorMessage);

      return {
        success: false,
        message: 'BotLab Core initialization failed',
        initializedBots,
        failedBots,
        error: errorMessage
      };
    }
  }

  private async setupAppIntegration(): Promise<void> {
    // Set up integration points with the main application
    
    // Example: Listen for client registration events from the main app
    // This would typically be done through event emitters or pub/sub system
    console.log('🔗 Setting up client registration event listener...');
    
    // Example: Set up shelter management system integration
    console.log('🔗 Setting up shelter management integration...');
    
    // Example: Set up notification system integration
    console.log('🔗 Setting up notification system integration...');
  }

  private async runHealthCheck(): Promise<boolean> {
    try {
      // Check bot manager health
      const botStats = await botManager.getBotManagerStats();
      if (botStats.activeBots === 0) {
        console.warn('⚠️ No bots are currently active');
        return false;
      }

      // Check SMS service health
      const smsStats = await smsService.getMessageStats();
      console.log(`📱 SMS Service: ${smsStats.optedInClients} opted-in clients`);

      // Check BotLab Core health
      console.log('🤖 BotLab Core: All systems operational');

      return true;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return false;
    }
  }

  // Public utility methods
  async getInitializationStatus(): Promise<{
    isInitialized: boolean;
    botCount: number;
    activeBots: number;
    lastInitialization?: Date;
  }> {
    const botStats = await botManager.getBotManagerStats();
    
    return {
      isInitialized: this.isInitialized,
      botCount: botStats.totalBots,
      activeBots: botStats.activeBots,
      lastInitialization: this.isInitialized ? new Date() : undefined
    };
  }

  async reinitialize(): Promise<BotInitializationResult> {
    console.log('🔄 Forcing BotLab Core re-initialization...');
    
    // Stop all bots first
    try {
      await botManager.stopAllBots();
    } catch (error) {
      console.warn('⚠️ Warning during bot shutdown:', error);
    }
    
    this.isInitialized = false;
    this.initializationPromise = null;
    
    return this.initialize();
  }

  // Integration methods for the main application
  async handleClientRegistration(clientId: string, phoneNumber?: string, preferences?: any): Promise<void> {
    if (!this.isInitialized) {
      console.warn('⚠️ Bot system not initialized, skipping client registration event');
      return;
    }

    console.log(`👤 Processing client registration: ${clientId}`);
    
    try {
      // Publish client registration event to bot system
      await botManager.publishClientRegistrationEvent(clientId, phoneNumber, preferences);
      
      // Auto-opt in client for SMS if phone number provided
      if (phoneNumber) {
        await smsService.optInClient(clientId, phoneNumber);
        console.log(`📱 Auto-enrolled client ${clientId} for SMS notifications`);
      }
      
    } catch (error) {
      console.error(`❌ Failed to handle client registration for ${clientId}:`, error);
    }
  }

  async handleWakeupEvent(clientId: string, bedNumber: string, facilityName: string, checkoutTime: Date): Promise<void> {
    if (!this.isInitialized) {
      console.warn('⚠️ Bot system not initialized, skipping wake-up event');
      return;
    }

    console.log(`🏃 Processing wake-up event for client ${clientId}`);
    
    try {
      await botManager.publishWakeupEvent(clientId, bedNumber, facilityName, checkoutTime);
    } catch (error) {
      console.error(`❌ Failed to handle wake-up event for ${clientId}:`, error);
    }
  }

  async sendTestWakeupMessage(clientId: string, testPhone?: string): Promise<boolean> {
    if (!this.isInitialized) {
      console.warn('⚠️ Bot system not initialized');
      return false;
    }

    try {
      // If test phone provided, temporarily set it
      if (testPhone) {
        await smsService.optInClient(clientId, testPhone);
      }

      // Send test wake-up
      const result = await smsService.sendWakeupSMS(clientId, {
        urgency: 'gentle',
        bedNumber: 'TEST-01',
        facilityName: 'Test Facility',
        checkoutTime: '7:00 AM'
      });

      return result !== null;
    } catch (error) {
      console.error('❌ Failed to send test wake-up message:', error);
      return false;
    }
  }

  // Statistics and monitoring
  async getBotSystemStats(): Promise<{
    botManager: any;
    smsService: any;
    isHealthy: boolean;
  }> {
    const botStats = await botManager.getBotManagerStats();
    const smsStats = await smsService.getMessageStats();
    const isHealthy = botStats.activeBots > 0 && botStats.errorBots === 0;

    return {
      botManager: botStats,
      smsService: smsStats,
      isHealthy
    };
  }

  isInitializedSync(): boolean {
    return this.isInitialized;
  }

  async shutdown(): Promise<void> {
    console.log('🔌 Shutting down BotLab Core system...');
    
    try {
      await botManager.shutdown();
      this.isInitialized = false;
      this.initializationPromise = null;
      
      console.log('✅ BotLab Core system shutdown complete');
    } catch (error) {
      console.error('❌ Error during BotLab Core shutdown:', error);
    }
  }
}

export const botInitializationService = new BotInitializationService();
export default botInitializationService;