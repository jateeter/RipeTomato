/**
 * Unified SMS Manager
 * 
 * Manages multiple SMS providers with automatic fallback, load balancing,
 * and health monitoring. Provides a unified interface for sending SMS
 * messages regardless of the underlying provider.
 * 
 * @license MIT
 */

import { 
  SMSProvider, 
  SMSProviderMessage, 
  SMSSendResult, 
  SMSProviderConfig,
  SMSProviderStats
} from './SMSProviderInterface';
import { TwilioProvider } from './TwilioProvider';
import { GoogleVoiceProvider } from './GoogleVoiceProvider';

export interface UnifiedSMSConfig {
  providers: SMSProviderConfig[];
  fallbackEnabled: boolean;
  maxRetries: number;
  retryDelay: number; // milliseconds
  healthCheckInterval: number; // milliseconds
  loadBalancing: 'priority' | 'round-robin' | 'least-used';
}

export interface UnifiedSMSStats {
  totalSent: number;
  totalFailed: number;
  successRate: number;
  providers: SMSProviderStats[];
  lastActivity?: Date;
  activeProviders: number;
}

export class UnifiedSMSManager {
  private providers: Map<string, SMSProvider> = new Map();
  private config: UnifiedSMSConfig;
  private stats: UnifiedSMSStats;
  private healthCheckTimer?: NodeJS.Timeout;
  private currentRoundRobinIndex = 0;

  constructor(config: UnifiedSMSConfig) {
    this.config = config;
    this.stats = {
      totalSent: 0,
      totalFailed: 0,
      successRate: 100,
      providers: [],
      activeProviders: 0
    };
  }

  async initialize(): Promise<void> {
    console.log('🚀 Initializing Unified SMS Manager...');
    
    // Initialize all configured providers
    for (const providerConfig of this.config.providers) {
      try {
        const provider = this.createProvider(providerConfig);
        await provider.initialize();
        
        if (provider.isEnabled()) {
          this.providers.set(provider.getName(), provider);
          console.log(`✅ SMS Provider '${provider.getName()}' initialized successfully`);
        } else {
          console.log(`⏭️ SMS Provider '${provider.getName()}' disabled, skipping`);
        }
      } catch (error) {
        console.error(`❌ Failed to initialize SMS provider '${providerConfig.name}':`, error);
        
        // Continue with other providers even if one fails
        if (!this.config.fallbackEnabled) {
          throw error;
        }
      }
    }

    if (this.providers.size === 0) {
      throw new Error('No SMS providers successfully initialized');
    }

    // Start health monitoring
    if (this.config.healthCheckInterval > 0) {
      this.startHealthMonitoring();
    }

    this.updateStats();
    console.log(`✅ Unified SMS Manager initialized with ${this.providers.size} providers`);
  }

  private createProvider(config: SMSProviderConfig): SMSProvider {
    switch (config.name.toLowerCase()) {
      case 'twilio':
        return new TwilioProvider(config);
      case 'google voice':
      case 'googlevoice':
        return new GoogleVoiceProvider(config);
      default:
        throw new Error(`Unknown SMS provider: ${config.name}`);
    }
  }

  async sendMessage(message: SMSProviderMessage): Promise<SMSSendResult> {
    const availableProviders = this.getAvailableProviders();
    
    if (availableProviders.length === 0) {
      return {
        success: false,
        messageId: message.id,
        timestamp: new Date(),
        errorCode: 'NO_PROVIDERS',
        errorMessage: 'No SMS providers available'
      };
    }

    let lastError: any;
    let attempts = 0;
    const maxAttempts = this.config.fallbackEnabled ? 
      Math.min(availableProviders.length, this.config.maxRetries) : 1;

    while (attempts < maxAttempts) {
      const provider = this.selectProvider(availableProviders, attempts);
      
      try {
        console.log(`📤 Attempting to send SMS via ${provider.getName()} (attempt ${attempts + 1}/${maxAttempts})`);
        
        const result = await provider.sendMessage(message);
        
        if (result.success) {
          this.stats.totalSent++;
          this.updateStats();
          console.log(`✅ SMS sent successfully via ${provider.getName()}`);
          return result;
        } else {
          lastError = result.errorMessage;
          console.warn(`⚠️ SMS failed via ${provider.getName()}: ${result.errorMessage}`);
        }
      } catch (error) {
        lastError = error;
        console.error(`❌ SMS provider ${provider.getName()} threw error:`, error);
      }

      attempts++;
      
      // Wait before retry (except on last attempt)
      if (attempts < maxAttempts && this.config.retryDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
      }
    }

    // All providers failed
    this.stats.totalFailed++;
    this.updateStats();
    
    return {
      success: false,
      messageId: message.id,
      timestamp: new Date(),
      errorCode: 'ALL_PROVIDERS_FAILED',
      errorMessage: `All SMS providers failed. Last error: ${lastError}`,
      metadata: { attempts, lastError }
    };
  }

  private getAvailableProviders(): SMSProvider[] {
    const providers = Array.from(this.providers.values())
      .filter(provider => provider.isEnabled())
      .sort((a, b) => a.getPriority() - b.getPriority());
    
    return providers;
  }

  private selectProvider(availableProviders: SMSProvider[], attemptNumber: number): SMSProvider {
    switch (this.config.loadBalancing) {
      case 'round-robin':
        this.currentRoundRobinIndex = (this.currentRoundRobinIndex + 1) % availableProviders.length;
        return availableProviders[this.currentRoundRobinIndex];
        
      case 'least-used':
        return availableProviders
          .sort((a, b) => a.getStats().totalSent - b.getStats().totalSent)[0];
          
      case 'priority':
      default:
        // Use priority order, but skip failed providers in previous attempts
        return availableProviders[Math.min(attemptNumber, availableProviders.length - 1)];
    }
  }

  private startHealthMonitoring(): void {
    this.healthCheckTimer = setInterval(async () => {
      console.log('🏥 Running SMS provider health checks...');
      
      for (const [name, provider] of this.providers) {
        try {
          const isHealthy = await provider.healthCheck();
          console.log(`🏥 Provider ${name}: ${isHealthy ? 'Healthy' : 'Unhealthy'}`);
        } catch (error) {
          console.error(`🏥 Health check failed for provider ${name}:`, error);
        }
      }
      
      this.updateStats();
    }, this.config.healthCheckInterval);
  }

  private updateStats(): void {
    const providerStats = Array.from(this.providers.values()).map(p => p.getStats());
    
    this.stats.providers = providerStats;
    this.stats.activeProviders = providerStats.filter(s => s.isHealthy).length;
    this.stats.successRate = this.stats.totalSent + this.stats.totalFailed > 0 ?
      (this.stats.totalSent / (this.stats.totalSent + this.stats.totalFailed)) * 100 : 100;
    this.stats.lastActivity = new Date();
  }

  // Public methods for management and monitoring

  getStats(): UnifiedSMSStats {
    this.updateStats();
    return { ...this.stats };
  }

  getProviderStats(providerName?: string): SMSProviderStats[] {
    if (providerName) {
      const provider = this.providers.get(providerName);
      return provider ? [provider.getStats()] : [];
    }
    
    return Array.from(this.providers.values()).map(p => p.getStats());
  }

  async enableProvider(providerName: string): Promise<boolean> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      return false;
    }

    try {
      provider.updateConfig({ enabled: true });
      await provider.initialize();
      console.log(`✅ Provider ${providerName} enabled`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to enable provider ${providerName}:`, error);
      return false;
    }
  }

  disableProvider(providerName: string): boolean {
    const provider = this.providers.get(providerName);
    if (!provider) {
      return false;
    }

    provider.updateConfig({ enabled: false });
    console.log(`🛑 Provider ${providerName} disabled`);
    return true;
  }

  getAvailableProviderNames(): string[] {
    return Array.from(this.providers.keys());
  }

  getHealthyProviderNames(): string[] {
    return Array.from(this.providers.entries())
      .filter(([_, provider]) => provider.getStats().isHealthy)
      .map(([name]) => name);
  }

  async testProvider(providerName: string, testPhoneNumber: string): Promise<SMSSendResult> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      return {
        success: false,
        timestamp: new Date(),
        errorCode: 'PROVIDER_NOT_FOUND',
        errorMessage: `Provider ${providerName} not found`
      };
    }

    const testMessage: SMSProviderMessage = {
      id: `test_${Date.now()}`,
      to: testPhoneNumber,
      from: '',
      body: `SMS Provider Test - ${providerName} - ${new Date().toLocaleTimeString()}`,
      timestamp: new Date(),
      status: 'queued',
      retryCount: 0,
      maxRetries: 1
    };

    return provider.sendMessage(testMessage);
  }

  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up Unified SMS Manager...');
    
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    for (const [name, provider] of this.providers) {
      try {
        await provider.cleanup();
        console.log(`✅ Provider ${name} cleaned up`);
      } catch (error) {
        console.error(`❌ Failed to cleanup provider ${name}:`, error);
      }
    }

    this.providers.clear();
    console.log('✅ Unified SMS Manager cleanup completed');
  }
}