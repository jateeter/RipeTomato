/**
 * Enhanced BotLab Core with Multi-Language Support
 * 
 * Extends the original BotLab Core to support agents written in multiple languages:
 * - JavaScript/TypeScript (original support)
 * - Python (new support via child processes)
 * - Future: Java, Go, Rust, etc.
 * 
 * Features:
 * - Unified agent management across languages
 * - Cross-language communication protocol
 * - Resource monitoring and health checks
 * - Dynamic agent spawning and lifecycle management
 * - Performance optimization per language runtime
 * 
 * @license MIT
 */

import { 
  BaseBotLabBot, 
  BotConfiguration, 
  BotEvent, 
  BotMessage, 
  BotInstance,
  botLabCore as originalBotLabCore 
} from './botlabCore';
import { 
  multiLanguageAgentRuntime,
  MultiLanguageAgent,
  AgentLanguage,
  CrossLanguageMessage,
  AgentExecutionContext
} from './multiLanguageAgentRuntime';
import { safeLocalStorage } from '../utils/localStorage';

// Enhanced configuration for multi-language agents
export interface EnhancedBotConfiguration extends BotConfiguration {
  language: AgentLanguage;
  scriptPath?: string; // Path to agent script/module
  runtime?: {
    executable?: string;
    workingDirectory?: string;
    environmentVariables?: Record<string, string>;
    resourceLimits?: {
      maxMemoryMB?: number;
      maxCpuPercent?: number;
      timeoutMs?: number;
    };
  };
}

// Enhanced instance tracking
export interface EnhancedBotInstance extends BotInstance {
  language: AgentLanguage;
  context?: AgentExecutionContext;
  crossLanguageCapabilities: string[];
}

// Multi-language agent wrapper for legacy compatibility
export class MultiLanguageBotWrapper extends BaseBotLabBot {
  private multiLangAgent: MultiLanguageAgent;
  private enhancedConfig: EnhancedBotConfiguration;
  private messageTranslationQueue: CrossLanguageMessage[] = [];

  constructor(config: EnhancedBotConfiguration, multiLangAgent: MultiLanguageAgent) {
    super(config);
    this.enhancedConfig = config;
    this.multiLangAgent = multiLangAgent;
  }

  async initialize(): Promise<void> {
    console.log(`🔗 Initializing multi-language bot wrapper: ${this.enhancedConfig.name}`);
    await this.multiLangAgent.start();
    console.log(`✅ Multi-language bot wrapper initialized: ${this.enhancedConfig.name}`);
  }

  async processMessage(message: BotMessage): Promise<void> {
    // Convert BotMessage to CrossLanguageMessage
    const crossLangMessage: CrossLanguageMessage = {
      id: message.id,
      timestamp: message.timestamp.toISOString(),
      type: 'command',
      source: {
        agentId: message.source,
        language: AgentLanguage.JAVASCRIPT,
        runtime: 'nodejs'
      },
      destination: {
        agentId: this.multiLangAgent.getAgentId(),
        language: this.multiLangAgent.getLanguage()
      },
      payload: message.payload,
      metadata: {
        priority: message.metadata?.priority || 'normal',
        correlationId: message.metadata?.correlationId,
        retryCount: message.metadata?.retryCount || 0,
        maxRetries: 3,
        timeoutMs: 30000
      }
    };

    await this.multiLangAgent.sendMessage(crossLangMessage);
  }

  async cleanup(): Promise<void> {
    console.log(`🧹 Cleaning up multi-language bot wrapper: ${this.enhancedConfig.name}`);
    await this.multiLangAgent.stop();
    console.log(`✅ Multi-language bot wrapper cleanup completed: ${this.enhancedConfig.name}`);
  }

  protected initializeEventHandlers(): void {
    // Set up event handlers for cross-language communication
    this.registerEventHandler('cross_language_message', async (event: BotEvent) => {
      const crossLangMessage = event.data as CrossLanguageMessage;
      await this.multiLangAgent.handleMessage(crossLangMessage);
    });
  }

  // Enhanced methods
  getEnhancedStatus(): EnhancedBotInstance {
    const baseStatus = this.getStatus();
    const context = this.multiLangAgent.getContext();
    
    return {
      ...baseStatus,
      language: this.enhancedConfig.language,
      context,
      crossLanguageCapabilities: ['message_translation', 'event_forwarding', 'status_monitoring']
    };
  }

  async sendCrossLanguageMessage(message: CrossLanguageMessage): Promise<void> {
    await this.multiLangAgent.sendMessage(message);
  }

  getMultiLanguageAgent(): MultiLanguageAgent {
    return this.multiLangAgent;
  }
}

// Enhanced BotLab Core Service
class EnhancedBotLabCoreService {
  private originalCore = originalBotLabCore;
  private multiLanguageBots: Map<string, MultiLanguageBotWrapper> = new Map();
  private crossLanguageMessageQueue: CrossLanguageMessage[] = new Map();
  private isProcessingCrossLanguageMessages = false;

  constructor() {
    this.initializeCrossLanguageSupport();
  }

  private initializeCrossLanguageSupport(): void {
    console.log('🌐 Initializing cross-language agent support...');
    // Set up cross-language message routing
    this.setupCrossLanguageMessageRouting();
    console.log('✅ Cross-language agent support initialized');
  }

  private setupCrossLanguageMessageRouting(): void {
    // Set up periodic processing of cross-language messages
    setInterval(async () => {
      await this.processCrossLanguageMessages();
    }, 1000); // Process every second
  }

  // Enhanced bot registration for multi-language agents
  async registerMultiLanguageBot(config: EnhancedBotConfiguration): Promise<string> {
    console.log(`🤖 Registering multi-language bot: ${config.name} (${config.language})`);

    try {
      // Create multi-language agent
      const multiLangAgent = await multiLanguageAgentRuntime.createAgent(
        config.botId,
        config.language,
        config.scriptPath || '',
        config.runtime
      );

      // Create wrapper for legacy compatibility
      const wrapper = new MultiLanguageBotWrapper(config, multiLangAgent);

      // Register with original core (for legacy compatibility)
      await this.originalCore.registerBot(wrapper);

      // Track in enhanced registry
      this.multiLanguageBots.set(config.botId, wrapper);

      console.log(`✅ Successfully registered multi-language bot: ${config.name}`);
      return config.botId;

    } catch (error) {
      console.error(`❌ Failed to register multi-language bot ${config.name}:`, error);
      throw error;
    }
  }

  // Simplified registration for JavaScript/TypeScript bots (backward compatibility)
  async registerBot(bot: BaseBotLabBot): Promise<void> {
    await this.originalCore.registerBot(bot);
  }

  // Start multi-language bot
  async startMultiLanguageBot(botId: string): Promise<void> {
    const wrapper = this.multiLanguageBots.get(botId);
    if (!wrapper) {
      throw new Error(`Multi-language bot not found: ${botId}`);
    }

    await multiLanguageAgentRuntime.startAgent(botId);
    await this.originalCore.startBot(botId);
  }

  // Stop multi-language bot
  async stopMultiLanguageBot(botId: string): Promise<void> {
    const wrapper = this.multiLanguageBots.get(botId);
    if (!wrapper) {
      throw new Error(`Multi-language bot not found: ${botId}`);
    }

    await this.originalCore.stopBot(botId);
    await multiLanguageAgentRuntime.stopAgent(botId);
    this.multiLanguageBots.delete(botId);
  }

  // Start all bots (enhanced)
  async startAllBots(): Promise<void> {
    console.log(`🚀 Starting all bots (including multi-language bots)`);

    // Start original bots
    await this.originalCore.startAllBots();

    // Start multi-language bots
    const startPromises = Array.from(this.multiLanguageBots.keys()).map(async (botId) => {
      try {
        await multiLanguageAgentRuntime.startAgent(botId);
        console.log(`✅ Started multi-language bot: ${botId}`);
      } catch (error) {
        console.error(`❌ Failed to start multi-language bot ${botId}:`, error);
      }
    });

    await Promise.all(startPromises);
  }

  // Stop all bots (enhanced)
  async stopAllBots(): Promise<void> {
    console.log(`🛑 Stopping all bots (including multi-language bots)`);

    // Stop multi-language bots first
    await multiLanguageAgentRuntime.stopAllAgents();
    this.multiLanguageBots.clear();

    // Stop original bots
    await this.originalCore.stopAllBots();
  }

  // Cross-language event publishing
  async publishCrossLanguageEvent(event: BotEvent, targetLanguages?: AgentLanguage[]): Promise<void> {
    console.log(`📡 Publishing cross-language event: ${event.type} (${event.id})`);

    // Convert to cross-language message
    const message: CrossLanguageMessage = {
      id: `evt_${event.id}`,
      timestamp: event.timestamp.toISOString(),
      type: 'event',
      source: {
        agentId: 'enhanced_botlab_core',
        language: AgentLanguage.JAVASCRIPT,
        runtime: 'nodejs'
      },
      destination: {
        broadcast: true
      },
      payload: {
        eventType: event.type,
        eventData: event.data,
        sourceDevice: event.sourceDevice,
        location: event.location
      },
      metadata: {
        priority: 'normal',
        retryCount: 0,
        maxRetries: 3,
        timeoutMs: 10000
      }
    };

    // Send to specific languages or broadcast to all
    if (targetLanguages && targetLanguages.length > 0) {
      for (const language of targetLanguages) {
        const agents = multiLanguageAgentRuntime.getAgentsByLanguage(language);
        for (const agent of agents) {
          try {
            await agent.sendMessage({
              ...message,
              destination: {
                agentId: agent.getAgentId(),
                language
              }
            });
          } catch (error) {
            console.error(`❌ Error sending event to ${language} agent ${agent.getAgentId()}:`, error);
          }
        }
      }
    } else {
      // Broadcast to all multi-language agents
      await multiLanguageAgentRuntime.broadcastMessage(message);
    }

    // Also publish to original core for JavaScript/TypeScript bots
    await this.originalCore.publishEvent(event);
  }

  // Cross-language message handling
  private async processCrossLanguageMessages(): Promise<void> {
    if (this.isProcessingCrossLanguageMessages || this.crossLanguageMessageQueue.length === 0) {
      return;
    }

    this.isProcessingCrossLanguageMessages = true;

    try {
      while (this.crossLanguageMessageQueue.length > 0) {
        const message = this.crossLanguageMessageQueue.shift()!;
        await this.routeCrossLanguageMessage(message);
      }
    } finally {
      this.isProcessingCrossLanguageMessages = false;
    }
  }

  private async routeCrossLanguageMessage(message: CrossLanguageMessage): Promise<void> {
    try {
      if (message.destination.broadcast) {
        // Broadcast to all agents
        await multiLanguageAgentRuntime.broadcastMessage(message);
      } else if (message.destination.agentId) {
        // Send to specific agent
        const agent = multiLanguageAgentRuntime.getAgent(message.destination.agentId);
        if (agent) {
          await agent.sendMessage(message);
        } else {
          console.warn(`⚠️ Agent not found for cross-language message: ${message.destination.agentId}`);
        }
      } else if (message.destination.language) {
        // Send to all agents of specific language
        const agents = multiLanguageAgentRuntime.getAgentsByLanguage(message.destination.language);
        for (const agent of agents) {
          await agent.sendMessage(message);
        }
      }
    } catch (error) {
      console.error(`❌ Error routing cross-language message ${message.id}:`, error);
    }
  }

  // Enhanced monitoring and status
  getEnhancedSystemStatus(): {
    originalCore: any;
    multiLanguageRuntime: any;
    totalBots: number;
    botsByLanguage: Record<string, number>;
  } {
    const originalStatus = {
      activeBots: this.originalCore.getActiveBotsCount(),
      allBots: this.originalCore.getAllBots().length
    };

    const multiLangStatus = multiLanguageAgentRuntime.getSystemStatus();

    return {
      originalCore: originalStatus,
      multiLanguageRuntime: multiLangStatus,
      totalBots: originalStatus.allBots + multiLangStatus.totalAgents,
      botsByLanguage: {
        javascript: originalStatus.allBots,
        ...multiLangStatus.agentsByLanguage
      }
    };
  }

  // Get all multi-language bots
  getAllMultiLanguageBots(): Array<{
    config: EnhancedBotConfiguration;
    status: EnhancedBotInstance;
    context: AgentExecutionContext;
  }> {
    return Array.from(this.multiLanguageBots.values()).map(wrapper => {
      const agent = wrapper.getMultiLanguageAgent();
      return {
        config: wrapper.getConfiguration() as EnhancedBotConfiguration,
        status: wrapper.getEnhancedStatus(),
        context: agent.getContext()
      };
    });
  }

  // Get bot by language
  getBotsByLanguage(language: AgentLanguage): MultiLanguageBotWrapper[] {
    return Array.from(this.multiLanguageBots.values()).filter(wrapper =>
      (wrapper.getConfiguration() as EnhancedBotConfiguration).language === language
    );
  }

  // Queue cross-language message
  queueCrossLanguageMessage(message: CrossLanguageMessage): void {
    this.crossLanguageMessageQueue.push(message);
  }

  // Language-specific operations
  async executeCommandOnLanguageAgents(
    language: AgentLanguage,
    command: string,
    payload: any
  ): Promise<any[]> {
    const agents = multiLanguageAgentRuntime.getAgentsByLanguage(language);
    const results = [];

    for (const agent of agents) {
      try {
        const message: CrossLanguageMessage = {
          id: `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          type: 'command',
          source: {
            agentId: 'enhanced_botlab_core',
            language: AgentLanguage.JAVASCRIPT,
            runtime: 'nodejs'
          },
          destination: {
            agentId: agent.getAgentId(),
            language
          },
          payload: {
            command,
            data: payload
          },
          metadata: {
            priority: 'normal',
            retryCount: 0,
            maxRetries: 3,
            timeoutMs: 15000
          }
        };

        await agent.sendMessage(message);
        results.push({ agentId: agent.getAgentId(), status: 'sent' });
      } catch (error) {
        results.push({ 
          agentId: agent.getAgentId(), 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  // Resource monitoring
  async getResourceUsage(): Promise<{
    javascript: any;
    python: any;
    total: any;
  }> {
    const jsAgents = this.originalCore.getAllBots();
    const pythonAgents = multiLanguageAgentRuntime.getAgentsByLanguage(AgentLanguage.PYTHON);

    return {
      javascript: {
        count: jsAgents.length,
        memory: 'N/A', // Would require process monitoring
        cpu: 'N/A'
      },
      python: {
        count: pythonAgents.length,
        memory: pythonAgents.reduce((total, agent) => {
          const context = agent.getContext();
          return total + context.resourceUsage.memoryMB;
        }, 0),
        cpu: pythonAgents.reduce((total, agent) => {
          const context = agent.getContext();
          return total + context.resourceUsage.cpuPercent;
        }, 0)
      },
      total: {
        agents: jsAgents.length + pythonAgents.length,
        languages: ['javascript', 'python'].filter(lang => 
          lang === 'javascript' ? jsAgents.length > 0 : pythonAgents.length > 0
        )
      }
    };
  }

  // Legacy compatibility methods
  async registerBotLegacy(bot: BaseBotLabBot): Promise<void> {
    return this.registerBot(bot);
  }

  async startBot(botId: string): Promise<void> {
    // Try multi-language first, then fall back to original
    if (this.multiLanguageBots.has(botId)) {
      return this.startMultiLanguageBot(botId);
    } else {
      return this.originalCore.startBot(botId);
    }
  }

  async stopBot(botId: string): Promise<void> {
    // Try multi-language first, then fall back to original
    if (this.multiLanguageBots.has(botId)) {
      return this.stopMultiLanguageBot(botId);
    } else {
      return this.originalCore.stopBot(botId);
    }
  }

  async publishEvent(event: BotEvent): Promise<void> {
    return this.publishCrossLanguageEvent(event);
  }

  getBotStatus(botId: string): BotInstance | EnhancedBotInstance | null {
    const multiLangBot = this.multiLanguageBots.get(botId);
    if (multiLangBot) {
      return multiLangBot.getEnhancedStatus();
    }
    return this.originalCore.getBotStatus(botId);
  }

  getAllBots(): Array<{ config: BotConfiguration | EnhancedBotConfiguration; status: BotInstance | EnhancedBotInstance }> {
    const originalBots = this.originalCore.getAllBots();
    const multiLangBots = this.getAllMultiLanguageBots().map(bot => ({
      config: bot.config,
      status: bot.status
    }));
    
    return [...originalBots, ...multiLangBots];
  }

  getActiveBotsCount(): number {
    const originalCount = this.originalCore.getActiveBotsCount();
    const multiLangCount = multiLanguageAgentRuntime.getSystemStatus().healthyAgents;
    return originalCount + multiLangCount;
  }
}

// Export enhanced singleton service
export const enhancedBotLabCore = new EnhancedBotLabCoreService();
export default enhancedBotLabCore;