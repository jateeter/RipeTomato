/**
 * ChatGPT Bot Integration
 *
 * Integrates ChatGPT agents with BotLab Core system.
 * Allows ChatGPT-powered agents to work alongside Python and other agents.
 */

import { chatGPTAgentService, ChatGPTAgentConfig } from '../../../services/chatGPTAgentService';

export interface ChatGPTBot {
  botId: string;
  name: string;
  type: 'chatgpt';
  agentId: string;
  conversationId: string | null;
  status: 'idle' | 'active' | 'error';
  lastResponse: string | null;
  createdAt: Date;
}

export interface ChatGPTBotMessage {
  botId: string;
  message: string;
  timestamp: Date;
  response?: string;
}

class ChatGPTBotIntegration {
  private activeBots: Map<string, ChatGPTBot> = new Map();
  private initialized: boolean = false;

  /**
   * Initialize ChatGPT bot integration
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('ChatGPT bot integration already initialized');
      return;
    }

    // Initialize ChatGPT service
    await chatGPTAgentService.initialize();

    console.log('✅ ChatGPT bot integration initialized');
    this.initialized = true;
  }

  /**
   * Create a ChatGPT-powered bot
   */
  async createBot(
    name: string,
    agentId: 'client-intake' | 'service-recommender' | 'crisis-support' | 'resource-navigator' | 'case-advisor'
  ): Promise<ChatGPTBot> {
    if (!this.initialized) {
      await this.initialize();
    }

    const botId = this.generateBotId();
    const conversationId = await chatGPTAgentService.startConversation(agentId);

    const bot: ChatGPTBot = {
      botId,
      name,
      type: 'chatgpt',
      agentId,
      conversationId,
      status: 'idle',
      lastResponse: null,
      createdAt: new Date()
    };

    this.activeBots.set(botId, bot);

    console.log(`✅ Created ChatGPT bot: ${name} (${agentId})`);

    return bot;
  }

  /**
   * Send message to ChatGPT bot
   */
  async sendMessage(botId: string, message: string): Promise<string> {
    const bot = this.activeBots.get(botId);
    if (!bot) {
      throw new Error(`Bot ${botId} not found`);
    }

    if (!bot.conversationId) {
      throw new Error(`Bot ${botId} has no active conversation`);
    }

    bot.status = 'active';

    try {
      const response = await chatGPTAgentService.sendMessage(
        bot.conversationId,
        message
      );

      bot.lastResponse = response.message;
      bot.status = 'idle';

      return response.message;

    } catch (error) {
      bot.status = 'error';
      console.error(`Error sending message to bot ${botId}:`, error);
      throw error;
    }
  }

  /**
   * Get bot details
   */
  getBot(botId: string): ChatGPTBot | null {
    return this.activeBots.get(botId) || null;
  }

  /**
   * Get all active bots
   */
  getAllBots(): ChatGPTBot[] {
    return Array.from(this.activeBots.values());
  }

  /**
   * Get bots by agent type
   */
  getBotsByAgentType(agentId: string): ChatGPTBot[] {
    return Array.from(this.activeBots.values()).filter(
      bot => bot.agentId === agentId
    );
  }

  /**
   * Delete bot
   */
  deleteBot(botId: string): void {
    const bot = this.activeBots.get(botId);
    if (bot && bot.conversationId) {
      chatGPTAgentService.clearConversation(bot.conversationId);
    }
    this.activeBots.delete(botId);
    console.log(`🗑️ Deleted ChatGPT bot: ${botId}`);
  }

  /**
   * Get available agent types
   */
  getAvailableAgentTypes(): ChatGPTAgentConfig[] {
    return chatGPTAgentService.getAvailableAgents();
  }

  /**
   * Generate unique bot ID
   */
  private generateBotId(): string {
    return `chatgpt_bot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Reset all bots
   */
  resetAll(): void {
    for (const [botId] of this.activeBots) {
      this.deleteBot(botId);
    }
    console.log('🔄 Reset all ChatGPT bots');
  }
}

// Export singleton
export const chatGPTBotIntegration = new ChatGPTBotIntegration();
