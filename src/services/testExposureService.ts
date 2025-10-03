/**
 * Test Exposure Service
 * 
 * Exposes agent services and other testable components to the global window
 * object for E2E testing purposes. Only active in development/test environments.
 * 
 * @license MIT
 */

import { agentManagerService } from './agentManager';
import { ClientWelcomeAgent } from './clientWelcomeAgent';
import { botInitializationService } from './botInitializationService';
import { botManager } from './botManager';

interface TestExposureWindow extends Window {
  __TEST_EXPOSURE__?: {
    AgentManager: typeof agentManagerService;
    ClientWelcomeAgent: typeof ClientWelcomeAgent;
    BotInitializationService: typeof botInitializationService;
    BotManager: typeof botManager;
    isReady: boolean;
    readyPromise: Promise<boolean>;
  };
}

class TestExposureService {
  private isInitialized = false;
  private readyResolve?: (value: boolean) => void;
  private readyPromise: Promise<boolean>;

  constructor() {
    this.readyPromise = new Promise((resolve) => {
      this.readyResolve = resolve;
    });
  }

  /**
   * Initialize test exposure - only in development/test environments
   */
  async initialize(): Promise<void> {
    // Only expose in development or test environment
    if (process.env.NODE_ENV === 'production') {
      console.log('🔒 Test exposure disabled in production');
      this.readyResolve?.(false);
      return;
    }

    console.log('🧪 Initializing test exposure service...');

    try {
      // Wait for agent services to initialize
      await this.waitForServices();

      // Expose services to window for testing
      this.exposeToWindow();

      this.isInitialized = true;
      console.log('✅ Test exposure service initialized');
      
      this.readyResolve?.(true);

    } catch (error) {
      console.error('❌ Failed to initialize test exposure service:', error);
      this.readyResolve?.(false);
    }
  }

  /**
   * Wait for required services to be available
   */
  private async waitForServices(): Promise<void> {
    console.log('⏳ Waiting for agent services to initialize...');
    
    // Wait for agent manager to initialize
    if (!agentManagerService) {
      throw new Error('AgentManager service not available');
    }

    // Initialize agent manager if not already done
    try {
      await agentManagerService.initialize();
    } catch (error) {
      console.warn('⚠️ AgentManager initialization had issues:', error);
    }

    // Wait for bot services to be ready
    let botRetries = 0;
    const maxBotRetries = 10;
    
    while (botRetries < maxBotRetries) {
      try {
        if (botInitializationService.isInitializedSync()) {
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 500));
        botRetries++;
      } catch (error) {
        console.warn(`⚠️ Bot service check attempt ${botRetries + 1}:`, error);
        botRetries++;
      }
    }

    console.log('✅ Services ready for test exposure');
  }

  /**
   * Expose services to global window object
   */
  private exposeToWindow(): void {
    const testWindow = window as TestExposureWindow;

    testWindow.__TEST_EXPOSURE__ = {
      AgentManager: agentManagerService,
      ClientWelcomeAgent: ClientWelcomeAgent,
      BotInitializationService: botInitializationService,
      BotManager: botManager,
      isReady: true,
      readyPromise: this.readyPromise
    };

    // Also expose individual components for easier access in tests
    (window as any).AgentManager = agentManagerService;
    (window as any).ClientWelcomeAgent = ClientWelcomeAgent;
    (window as any).BotInitializationService = botInitializationService;
    (window as any).BotManager = botManager;

    console.log('🌐 Test services exposed to window object');
  }

  /**
   * Check if test exposure is ready
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get ready promise for async waiting
   */
  getReadyPromise(): Promise<boolean> {
    return this.readyPromise;
  }

  /**
   * Get exposed services (for internal use)
   */
  getExposedServices() {
    const testWindow = window as TestExposureWindow;
    return testWindow.__TEST_EXPOSURE__;
  }

  /**
   * Create a test agent for E2E testing
   */
  async createTestAgent(): Promise<string> {
    const testClientData = {
      id: `test_client_${Date.now()}`,
      firstName: 'Test',
      lastName: 'Client',
      email: 'test@example.com',
      phone: '555-0123',
      dateOfBirth: '1990-01-01',
      address: {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345'
      },
      emergencyContact: {
        name: 'Test Emergency',
        relationship: 'Friend',
        phone: '555-0124'
      },
      role: 'client' as const,
      medicalNotes: 'Test medical notes',
      restrictions: [],
      consentGiven: true,
      consentDate: new Date().toISOString(),
      privacyAgreement: true,
      dataRetentionPeriod: 365
    };

    try {
      const agentId = await agentManagerService.spawnAgentForClient(testClientData);
      console.log(`🧪 Test agent created: ${agentId}`);
      return agentId;
    } catch (error) {
      console.error('❌ Failed to create test agent:', error);
      throw error;
    }
  }

  /**
   * Get test agent statistics
   */
  getTestStatistics() {
    const agentStats = agentManagerService.getSystemStatistics();
    const botStats = botInitializationService.isInitializedSync();

    return {
      agents: agentStats,
      bots: {
        initialized: botStats,
        isReady: this.isReady()
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Clean up test exposure
   */
  cleanup(): void {
    const testWindow = window as TestExposureWindow;
    if (testWindow.__TEST_EXPOSURE__) {
      delete testWindow.__TEST_EXPOSURE__;
    }

    // Clean up individual exposures
    delete (window as any).AgentManager;
    delete (window as any).ClientWelcomeAgent;
    delete (window as any).BotInitializationService;
    delete (window as any).BotManager;

    this.isInitialized = false;
    console.log('🧹 Test exposure cleaned up');
  }
}

// Create singleton instance
export const testExposureService = new TestExposureService();
export default testExposureService;