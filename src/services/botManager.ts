/**
 * Bot Manager Service
 * 
 * Manages the lifecycle of BotLab Core agent bots, including registration,
 * startup, monitoring, and coordination with the main application.
 * 
 * @license MIT
 */

import { botLabCore, BaseBotLabBot, BotEvent } from './botlabCore';
import { SMSWakeupBot } from '../bots/SMSWakeupBot';
import { safeLocalStorage } from '../utils/localStorage';

export interface BotRegistration {
  botId: string;
  botClass: new () => BaseBotLabBot;
  autoStart: boolean;
  dependencies: string[];
  config?: any;
}

export interface BotManagerStats {
  totalBots: number;
  activeBots: number;
  inactiveBots: number;
  errorBots: number;
  uptimeHours: number;
  totalEventsProcessed: number;
}

class BotManagerService {
  private registeredBots: Map<string, BotRegistration> = new Map();
  private botInstances: Map<string, BaseBotLabBot> = new Map();
  private isInitialized = false;
  private startTime: Date = new Date();
  private eventsProcessed = 0;

  constructor() {
    console.log('🤖 Bot Manager Service initializing...');
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️ Bot Manager already initialized');
      return;
    }

    console.log('🚀 Initializing Bot Manager Service...');
    
    try {
      // Register built-in bots
      await this.registerBuiltInBots();
      
      // Load saved bot configurations
      await this.loadBotConfigurations();
      
      // Start auto-start bots
      await this.startAutoStartBots();
      
      this.isInitialized = true;
      console.log('✅ Bot Manager Service initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize Bot Manager Service:', error);
      throw error;
    }
  }

  private async registerBuiltInBots(): Promise<void> {
    console.log('📝 Registering built-in bots...');
    
    // Register SMS Wake-up Bot
    await this.registerBot({
      botId: 'sms_wakeup_bot',
      botClass: SMSWakeupBot,
      autoStart: true,
      dependencies: ['sms_service', 'shelter_management'],
      config: {
        enabled: true,
        checkInterval: 5, // minutes
        respectQuietHours: true
      }
    });

    console.log(`✅ Registered ${this.registeredBots.size} built-in bots`);
  }

  async registerBot(registration: BotRegistration): Promise<void> {
    if (this.registeredBots.has(registration.botId)) {
      throw new Error(`Bot with ID ${registration.botId} is already registered`);
    }

    this.registeredBots.set(registration.botId, registration);
    console.log(`📝 Registered bot: ${registration.botId}`);

    // Save registration to persistent storage
    await this.saveBotConfigurations();
  }

  async unregisterBot(botId: string): Promise<void> {
    // Stop the bot if it's running
    if (this.botInstances.has(botId)) {
      await this.stopBot(botId);
    }

    this.registeredBots.delete(botId);
    console.log(`📝 Unregistered bot: ${botId}`);

    await this.saveBotConfigurations();
  }

  async startBot(botId: string): Promise<void> {
    const registration = this.registeredBots.get(botId);
    if (!registration) {
      throw new Error(`Bot ${botId} is not registered`);
    }

    if (this.botInstances.has(botId)) {
      console.log(`⚠️ Bot ${botId} is already running`);
      return;
    }

    console.log(`🚀 Starting bot: ${botId}`);

    try {
      // Check dependencies
      await this.checkBotDependencies(registration.dependencies);

      // Create bot instance
      const BotClass = registration.botClass;
      const botInstance = new BotClass() as BaseBotLabBot;
      
      // Register with BotLab Core
      await botLabCore.registerBot(botInstance);
      
      // Start the bot
      await botLabCore.startBot(botId);
      
      // Store instance reference
      this.botInstances.set(botId, botInstance);
      
      console.log(`✅ Bot ${botId} started successfully`);
      
    } catch (error) {
      console.error(`❌ Failed to start bot ${botId}:`, error);
      throw error;
    }
  }

  async stopBot(botId: string): Promise<void> {
    const botInstance = this.botInstances.get(botId);
    if (!botInstance) {
      console.log(`⚠️ Bot ${botId} is not running`);
      return;
    }

    console.log(`🛑 Stopping bot: ${botId}`);

    try {
      await botLabCore.stopBot(botId);
      this.botInstances.delete(botId);
      
      console.log(`✅ Bot ${botId} stopped successfully`);
      
    } catch (error) {
      console.error(`❌ Failed to stop bot ${botId}:`, error);
      throw error;
    }
  }

  async restartBot(botId: string): Promise<void> {
    console.log(`🔄 Restarting bot: ${botId}`);
    await this.stopBot(botId);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Brief pause
    await this.startBot(botId);
  }

  async startAllBots(): Promise<void> {
    console.log('🚀 Starting all registered bots...');
    
    const startPromises = Array.from(this.registeredBots.keys()).map(async (botId) => {
      try {
        await this.startBot(botId);
      } catch (error) {
        console.error(`❌ Failed to start bot ${botId}:`, error);
      }
    });

    try {
      await Promise.allSettled(startPromises);
    } catch (error) {
      // Promise.allSettled should never reject, but adding safety
      console.error('❌ Unexpected error in startAllBots:', error);
    }
    console.log(`✅ Attempted to start ${this.registeredBots.size} bots`);
  }

  async stopAllBots(): Promise<void> {
    console.log('🛑 Stopping all bots...');
    
    const stopPromises = Array.from(this.botInstances.keys()).map(async (botId) => {
      try {
        await this.stopBot(botId);
      } catch (error) {
        console.error(`❌ Failed to stop bot ${botId}:`, error);
      }
    });

    try {
      await Promise.allSettled(stopPromises);
      await botLabCore.stopAllBots();
    } catch (error) {
      // Promise.allSettled should never reject, but adding safety
      console.error('❌ Unexpected error in stopAllBots:', error);
    }
    
    console.log('✅ All bots stopped');
  }

  private async startAutoStartBots(): Promise<void> {
    console.log('🏃 Starting auto-start bots...');
    
    const autoStartBots = Array.from(this.registeredBots.entries())
      .filter(([, registration]) => registration.autoStart)
      .map(([botId]) => botId);

    for (const botId of autoStartBots) {
      try {
        await this.startBot(botId);
      } catch (error) {
        console.error(`❌ Failed to auto-start bot ${botId}:`, error);
      }
    }

    console.log(`✅ Attempted to auto-start ${autoStartBots.length} bots`);
  }

  private async checkBotDependencies(dependencies: string[]): Promise<void> {
    // Basic dependency checking - in a real implementation this would check
    // if required services are available and healthy
    for (const dependency of dependencies) {
      console.log(`🔍 Checking dependency: ${dependency}`);
      // Mock dependency check - always pass for now
    }
  }

  // Event handling
  async publishWakeupEvent(clientId: string, bedNumber: string, facilityName: string, checkoutTime: Date): Promise<void> {
    const event: BotEvent = {
      id: `wakeup_${clientId}_${Date.now()}`,
      type: 'wakeup_event',
      timestamp: new Date(),
      sourceDevice: 'shelter_management',
      location: facilityName,
      data: {
        clientId,
        bedNumber,
        facilityName,
        checkoutTime,
        currentTime: new Date(),
        urgency: this.calculateUrgency(checkoutTime)
      },
      processed: false
    };

    await botLabCore.publishEvent(event);
    this.eventsProcessed++;
    
    console.log(`📡 Published wake-up event for client ${clientId}`);
  }

  async publishClientRegistrationEvent(clientId: string, phoneNumber?: string, preferences?: any): Promise<void> {
    const event: BotEvent = {
      id: `client_reg_${clientId}_${Date.now()}`,
      type: 'client_registration',
      timestamp: new Date(),
      sourceDevice: 'registration_system',
      data: {
        clientId,
        phoneNumber,
        preferences,
        registrationTime: new Date()
      },
      processed: false
    };

    await botLabCore.publishEvent(event);
    this.eventsProcessed++;
    
    console.log(`📡 Published client registration event for ${clientId}`);
  }

  private calculateUrgency(checkoutTime: Date): 'gentle' | 'warning' | 'urgent' | 'overdue' {
    const now = new Date();
    const timeDiff = checkoutTime.getTime() - now.getTime();
    const minutesDiff = timeDiff / (1000 * 60);

    if (minutesDiff < -15) return 'overdue';
    if (minutesDiff < 0) return 'urgent';
    if (minutesDiff < 30) return 'warning';
    return 'gentle';
  }

  // Bot information and monitoring
  getBotStatus(botId: string): any {
    return botLabCore.getBotStatus(botId);
  }

  getAllBots(): Array<{
    registration: BotRegistration;
    status: any;
    isRunning: boolean;
  }> {
    return Array.from(this.registeredBots.entries()).map(([botId, registration]) => ({
      registration,
      status: this.getBotStatus(botId),
      isRunning: this.botInstances.has(botId)
    }));
  }

  async getBotManagerStats(): Promise<BotManagerStats> {
    const totalBots = this.registeredBots.size;
    const activeBots = this.botInstances.size;
    const uptimeHours = (Date.now() - this.startTime.getTime()) / (1000 * 60 * 60);
    
    // Get error count from bot statuses
    const allBotStatuses = botLabCore.getAllBots();
    const errorBots = allBotStatuses.filter(bot => bot.status.status === 'error').length;

    return {
      totalBots,
      activeBots,
      inactiveBots: totalBots - activeBots,
      errorBots,
      uptimeHours: Math.round(uptimeHours * 100) / 100,
      totalEventsProcessed: this.eventsProcessed
    };
  }

  // Configuration persistence
  private async saveBotConfigurations(): Promise<void> {
    const configs = Array.from(this.registeredBots.entries()).map(([botId, registration]) => ({
      botId,
      autoStart: registration.autoStart,
      dependencies: registration.dependencies,
      config: registration.config
    }));

    safeLocalStorage.setJSON('bot_configurations', configs);
  }

  private async loadBotConfigurations(): Promise<void> {
    const configs = safeLocalStorage.getJSON<Array<{
      botId: string;
      autoStart: boolean;
      dependencies: string[];
      config: any;
    }>>('bot_configurations');

    if (configs) {
      // Note: This is a simplified version - in a real implementation you'd need
      // to properly reconstruct the bot class references
      console.log(`📂 Loaded configuration for ${configs.length} bots`);
    }
  }

  // Utility methods
  getInitializationStatus(): boolean {
    return this.isInitialized;
  }

  getActiveBotCount(): number {
    return this.botInstances.size;
  }

  getRegisteredBotCount(): number {
    return this.registeredBots.size;
  }

  // Cleanup
  async shutdown(): Promise<void> {
    console.log('🔌 Shutting down Bot Manager Service...');
    
    await this.stopAllBots();
    await this.saveBotConfigurations();
    
    this.isInitialized = false;
    console.log('✅ Bot Manager Service shutdown complete');
  }
}

export const botManager = new BotManagerService();
export default botManager;