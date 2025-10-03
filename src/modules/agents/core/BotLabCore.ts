/**
 * BotLab Core Integration Service
 *
 * Integrates with PeoplePower BotLab Core platform to create and manage
 * AI agent bots that can respond to various events and coordinate actions
 * across different services and microservices.
 *
 * Based on PeoplePower BotLab architecture:
 * - Microservices framework for creating AI agents
 * - 24/7 background processing of device and event data
 * - Event coordination and message handling
 * - Real-time and historical data analytics
 *
 * @license MIT
 */

import { safeLocalStorage } from '../../../utils/localStorage';

// Core BotLab interfaces based on PeoplePower architecture
export interface BotMessage {
  id: string;
  timestamp: Date;
  type: 'event' | 'command' | 'notification' | 'data';
  source: string;
  destination: string;
  payload: any;
  metadata?: {
    priority: 'low' | 'normal' | 'high' | 'critical';
    retryCount?: number;
    correlationId?: string;
  };
}

export interface BotEvent {
  id: string;
  type: string;
  timestamp: Date;
  sourceDevice?: string;
  location?: string;
  data: any;
  processed: boolean;
}

export interface BotConfiguration {
  botId: string;
  name: string;
  description: string;
  version: string;
  author: string;
  microservices: string[];
  eventTypes: string[];
  schedule?: string; // cron expression
  enabled: boolean;
  settings: Record<string, any>;
}

export interface BotInstance {
  config: BotConfiguration;
  status: 'starting' | 'running' | 'paused' | 'stopping' | 'stopped' | 'error';
  startTime: Date;
  lastActivity: Date;
  processedMessages: number;
  errorCount: number;
  scheduledTimer?: NodeJS.Timeout;
}

// Abstract base bot class following BotLab patterns
export abstract class BaseBotLabBot {
  protected config: BotConfiguration;
  protected instance: BotInstance;
  protected messageQueue: BotMessage[] = [];
  protected eventHandlers: Map<string, (event: BotEvent) => Promise<void>> = new Map();

  constructor(config: BotConfiguration) {
    this.config = config;
    this.instance = {
      config,
      status: 'stopped',
      startTime: new Date(),
      lastActivity: new Date(),
      processedMessages: 0,
      errorCount: 0
    };

    this.initializeEventHandlers();
  }

  // Abstract methods that concrete bots must implement
  abstract initialize(): Promise<void>;
  abstract processMessage(message: BotMessage): Promise<void>;
  abstract cleanup(): Promise<void>;

  // Core bot lifecycle methods
  async start(): Promise<void> {
    try {
      this.instance.status = 'starting';
      this.instance.startTime = new Date();

      console.log(`🤖 Starting BotLab bot: ${this.config.name}`);

      await this.initialize();

      // Set up scheduled tasks if configured (using simple timer instead of cron)
      if (this.config.schedule) {
        // Parse simple schedule format like "*/5 * * * *" (every 5 minutes)
        const intervalMs = this.parseScheduleToInterval(this.config.schedule);
        if (intervalMs > 0) {
          this.instance.scheduledTimer = setInterval(async () => {
            try {
              await this.executeScheduledTask();
            } catch (error) {
              console.error(`❌ Scheduled task error for bot ${this.config.name}:`, error);
              this.instance.errorCount++;
            }
          }, intervalMs);
        }
      }

      this.instance.status = 'running';
      console.log(`✅ Bot ${this.config.name} started successfully`);
    } catch (error) {
      this.instance.status = 'error';
      this.instance.errorCount++;
      console.error(`❌ Failed to start bot ${this.config.name}:`, error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      this.instance.status = 'stopping';

      if (this.instance.scheduledTimer) {
        clearInterval(this.instance.scheduledTimer);
        this.instance.scheduledTimer = undefined;
      }

      await this.cleanup();

      this.instance.status = 'stopped';
      console.log(`🛑 Bot ${this.config.name} stopped`);
    } catch (error) {
      this.instance.status = 'error';
      console.error(`❌ Error stopping bot ${this.config.name}:`, error);
      throw error;
    }
  }

  async pause(): Promise<void> {
    this.instance.status = 'paused';
    if (this.instance.scheduledTimer) {
      clearInterval(this.instance.scheduledTimer);
      this.instance.scheduledTimer = undefined;
    }
    console.log(`⏸️ Bot ${this.config.name} paused`);
  }

  async resume(): Promise<void> {
    this.instance.status = 'running';
    if (this.config.schedule) {
      const intervalMs = this.parseScheduleToInterval(this.config.schedule);
      if (intervalMs > 0) {
        this.instance.scheduledTimer = setInterval(async () => {
          try {
            await this.executeScheduledTask();
          } catch (error) {
            console.error(`❌ Scheduled task error for bot ${this.config.name}:`, error);
            this.instance.errorCount++;
          }
        }, intervalMs);
      }
    }
    console.log(`▶️ Bot ${this.config.name} resumed`);
  }

  // Event handling system
  protected registerEventHandler(eventType: string, handler: (event: BotEvent) => Promise<void>): void {
    this.eventHandlers.set(eventType, handler);
  }

  async handleEvent(event: BotEvent): Promise<void> {
    try {
      this.instance.lastActivity = new Date();

      const handler = this.eventHandlers.get(event.type);
      if (handler) {
        await handler(event);
        event.processed = true;
        this.instance.processedMessages++;
      } else {
        console.warn(`⚠️ No handler found for event type: ${event.type}`);
      }
    } catch (error) {
      this.instance.errorCount++;
      console.error(`❌ Error handling event ${event.id}:`, error);
      throw error;
    }
  }

  // Message processing system
  async sendMessage(message: BotMessage): Promise<void> {
    this.messageQueue.push(message);
    console.log(`📤 Bot ${this.config.name} queued message: ${message.type}`);
  }

  protected async executeScheduledTask(): Promise<void> {
    // Override in subclasses for scheduled operations
    console.log(`⏰ Executing scheduled task for bot ${this.config.name}`);
  }

  // State management
  getStatus(): BotInstance {
    return { ...this.instance };
  }

  getConfiguration(): BotConfiguration {
    return { ...this.config };
  }

  // Persistent state storage
  protected async saveState(key: string, data: any): Promise<void> {
    const stateKey = `botlab_${this.config.botId}_${key}`;
    safeLocalStorage.setJSON(stateKey, {
      timestamp: new Date().toISOString(),
      data
    });
  }

  protected async loadState<T>(key: string): Promise<T | null> {
    const stateKey = `botlab_${this.config.botId}_${key}`;
    const stored = safeLocalStorage.getJSON<{ timestamp: string; data: T }>(stateKey);
    return stored ? stored.data : null;
  }

  protected async clearState(key: string): Promise<void> {
    const stateKey = `botlab_${this.config.botId}_${key}`;
    safeLocalStorage.removeItem(stateKey);
  }

  // Simple schedule parser (supports basic cron-like expressions)
  private parseScheduleToInterval(schedule: string): number {
    // Convert basic cron expressions to millisecond intervals
    // For example: "*/5 * * * *" = every 5 minutes = 300000ms
    if (schedule === '*/5 * * * *') return 5 * 60 * 1000; // 5 minutes
    if (schedule === '*/10 * * * *') return 10 * 60 * 1000; // 10 minutes
    if (schedule === '*/15 * * * *') return 15 * 60 * 1000; // 15 minutes
    if (schedule === '*/30 * * * *') return 30 * 60 * 1000; // 30 minutes
    if (schedule === '0 * * * *') return 60 * 60 * 1000; // every hour

    // Default fallback to 5 minutes if schedule not recognized
    console.warn(`Unknown schedule format: ${schedule}, defaulting to 5 minutes`);
    return 5 * 60 * 1000;
  }

  // Abstract initialization method for event handlers
  protected abstract initializeEventHandlers(): void;
}

// BotLab Core service for managing multiple bots
class BotLabCoreService {
  private bots: Map<string, BaseBotLabBot> = new Map();
  private eventStream: BotEvent[] = [];
  private isProcessingEvents = false;

  async registerBot(bot: BaseBotLabBot): Promise<void> {
    const botId = bot.getConfiguration().botId;

    if (this.bots.has(botId)) {
      throw new Error(`Bot with ID ${botId} is already registered`);
    }

    this.bots.set(botId, bot);
    console.log(`📝 Registered bot: ${bot.getConfiguration().name}`);
  }

  async startBot(botId: string): Promise<void> {
    const bot = this.bots.get(botId);
    if (!bot) {
      throw new Error(`Bot with ID ${botId} not found`);
    }

    await bot.start();
  }

  async stopBot(botId: string): Promise<void> {
    const bot = this.bots.get(botId);
    if (!bot) {
      throw new Error(`Bot with ID ${botId} not found`);
    }

    await bot.stop();
  }

  async startAllBots(): Promise<void> {
    console.log(`🚀 Starting all registered bots (${this.bots.size})`);

    for (const [botId, bot] of this.bots) {
      try {
        if (bot.getConfiguration().enabled) {
          await bot.start();
        } else {
          console.log(`⏭️ Skipping disabled bot: ${bot.getConfiguration().name}`);
        }
      } catch (error) {
        console.error(`❌ Failed to start bot ${botId}:`, error);
      }
    }
  }

  async stopAllBots(): Promise<void> {
    console.log(`🛑 Stopping all bots`);

    for (const [botId, bot] of this.bots) {
      try {
        await bot.stop();
      } catch (error) {
        console.error(`❌ Error stopping bot ${botId}:`, error);
      }
    }
  }

  // Event distribution system
  async publishEvent(event: BotEvent): Promise<void> {
    this.eventStream.push(event);
    console.log(`📡 Published event: ${event.type} (${event.id})`);

    // Process event asynchronously
    if (!this.isProcessingEvents) {
      this.processEventStream();
    }
  }

  private async processEventStream(): Promise<void> {
    if (this.isProcessingEvents) return;

    this.isProcessingEvents = true;

    try {
      while (this.eventStream.length > 0) {
        const event = this.eventStream.shift()!;

        // Distribute event to interested bots
        for (const [botId, bot] of this.bots) {
          const config = bot.getConfiguration();
          const status = bot.getStatus();

          if (status.status === 'running' && config.eventTypes.includes(event.type)) {
            try {
              await bot.handleEvent({ ...event });
            } catch (error) {
              console.error(`❌ Bot ${botId} failed to handle event ${event.id}:`, error);
            }
          }
        }
      }
    } finally {
      this.isProcessingEvents = false;
    }
  }

  // Bot management and monitoring
  getBotStatus(botId: string): BotInstance | null {
    const bot = this.bots.get(botId);
    return bot ? bot.getStatus() : null;
  }

  getAllBots(): Array<{ config: BotConfiguration; status: BotInstance }> {
    return Array.from(this.bots.values()).map(bot => ({
      config: bot.getConfiguration(),
      status: bot.getStatus()
    }));
  }

  getActiveBotsCount(): number {
    return Array.from(this.bots.values())
      .filter(bot => bot.getStatus().status === 'running').length;
  }
}

// Export singleton service
export const botLabCore = new BotLabCoreService();
export default botLabCore;
