/**
 * Multi-Language Agent System Example
 * 
 * Demonstrates how to use the enhanced agent infrastructure with support for
 * JavaScript/TypeScript and Python agents working together in a unified system.
 * 
 * This example shows:
 * - Setting up multi-language agents
 * - Cross-language communication
 * - Event coordination between different language runtimes
 * - Resource monitoring and management
 * - Error handling and recovery
 * 
 * @license MIT
 */

import {
  enhancedBotLabCore,
  EnhancedBotConfiguration
} from '../services/enhancedBotlabCore';
import {
  AgentLanguage,
  CrossLanguageMessage
} from '../modules/agents';
import { type BotEvent } from '../modules/agents';

class MultiLanguageAgentExample {
  private isRunning = false;

  constructor() {
    console.log('🌐 Multi-Language Agent System Example');
  }

  async run(): Promise<void> {
    try {
      this.isRunning = true;
      console.log('🚀 Starting multi-language agent demonstration...');

      // Step 1: Register different types of agents
      await this.registerAgents();

      // Step 2: Start all agents
      await this.startAgents();

      // Step 3: Demonstrate cross-language communication
      await this.demonstrateCrossLanguageCommunication();

      // Step 4: Show event coordination
      await this.demonstrateEventCoordination();

      // Step 5: Monitor system performance
      await this.monitorSystemPerformance();

      // Step 6: Test error handling
      await this.testErrorHandling();

      console.log('✅ Multi-language agent demonstration completed successfully');

    } catch (error) {
      console.error('❌ Error in multi-language agent demonstration:', error);
    } finally {
      await this.cleanup();
    }
  }

  private async registerAgents(): Promise<void> {
    console.log('\n📝 Step 1: Registering multi-language agents...');

    // Register JavaScript/TypeScript SMS Wake-up Bot (existing)
    const smsWakeupConfig: EnhancedBotConfiguration = {
      botId: 'sms_wakeup_js',
      name: 'SMS Wake-up Bot (JavaScript)',
      description: 'Sends SMS notifications for wake-up events',
      version: '1.0.0',
      author: 'Community Services Team',
      language: AgentLanguage.JAVASCRIPT,
      microservices: ['sms', 'shelter_management'],
      eventTypes: ['wakeup_event', 'client_registration'],
      schedule: '*/5 * * * *',
      enabled: true,
      settings: {
        defaultWarningMinutes: 30
      },
      scriptPath: '../bots/SMSWakeupBot' // Path to existing bot
    };

    await enhancedBotLabCore.registerMultiLanguageBot(smsWakeupConfig);
    console.log('✅ Registered JavaScript SMS Wake-up Bot');

    // Register Python Analytics Agent
    const analyticsConfig: EnhancedBotConfiguration = {
      botId: 'analytics_python',
      name: 'Analytics Agent (Python)',
      description: 'Provides data analytics and reporting capabilities',
      version: '1.0.0',
      author: 'Data Science Team',
      language: AgentLanguage.PYTHON,
      microservices: ['analytics', 'reporting', 'machine_learning'],
      eventTypes: ['client_data_update', 'occupancy_change', 'analytics_request'],
      schedule: '*/15 * * * *', // Every 15 minutes
      enabled: true,
      settings: {
        analysisPeriod: '30d',
        confidenceThreshold: 0.8
      },
      scriptPath: './src/agents/python/example_analytics_agent.py',
      runtime: {
        executable: 'python3',
        workingDirectory: process.cwd(),
        environmentVariables: {
          PYTHONPATH: './src/agents/python',
          ANALYTICS_CONFIG: 'production'
        },
        resourceLimits: {
          maxMemoryMB: 512,
          maxCpuPercent: 70,
          timeoutMs: 30000
        }
      }
    };

    await enhancedBotLabCore.registerMultiLanguageBot(analyticsConfig);
    console.log('✅ Registered Python Analytics Agent');

    // Register Python Data Processing Agent
    const dataProcessingConfig: EnhancedBotConfiguration = {
      botId: 'data_processor_python',
      name: 'Data Processing Agent (Python)',
      description: 'Handles batch data processing and ETL operations',
      version: '1.0.0',
      author: 'Data Engineering Team',
      language: AgentLanguage.PYTHON,
      microservices: ['data_processing', 'etl', 'data_validation'],
      eventTypes: ['batch_data_received', 'data_validation_request'],
      enabled: true,
      settings: {
        batchSize: 1000,
        processingMode: 'streaming'
      },
      scriptPath: './src/agents/python/data_processing_agent.py',
      runtime: {
        executable: 'python3',
        resourceLimits: {
          maxMemoryMB: 1024,
          maxCpuPercent: 80,
          timeoutMs: 60000
        }
      }
    };

    await enhancedBotLabCore.registerMultiLanguageBot(dataProcessingConfig);
    console.log('✅ Registered Python Data Processing Agent');

    console.log('🎯 All agents registered successfully');
  }

  private async startAgents(): Promise<void> {
    console.log('\n🚀 Step 2: Starting all agents...');

    try {
      await enhancedBotLabCore.startAllBots();
      
      // Wait a moment for agents to initialize
      await this.sleep(2000);

      // Check system status
      const status = enhancedBotLabCore.getEnhancedSystemStatus();
      console.log('📊 System Status:', JSON.stringify(status, null, 2));

      console.log('✅ All agents started successfully');
    } catch (error) {
      console.error('❌ Error starting agents:', error);
      throw error;
    }
  }

  private async demonstrateCrossLanguageCommunication(): Promise<void> {
    console.log('\n🔄 Step 3: Demonstrating cross-language communication...');

    // Example 1: JavaScript bot requests analytics from Python agent
    console.log('📊 Example 1: JavaScript → Python analytics request');
    
    const analyticsRequest: BotEvent = {
      id: 'analytics_req_001',
      type: 'analytics_request',
      timestamp: new Date(),
      data: {
        request_type: 'client_analysis',
        client_data: [
          { id: 'client_001', age: 28, services: ['shelter', 'meals'] },
          { id: 'client_002', age: 35, services: ['shelter', 'medical'] },
          { id: 'client_003', age: 42, services: ['meals', 'counseling'] }
        ],
        analysis_type: 'comprehensive'
      },
      processed: false
    };

    await enhancedBotLabCore.publishCrossLanguageEvent(analyticsRequest, [AgentLanguage.PYTHON]);
    console.log('✅ Analytics request sent to Python agents');

    await this.sleep(1000);

    // Example 2: Request occupancy analysis
    console.log('🏠 Example 2: Occupancy trend analysis request');
    
    const occupancyRequest: BotEvent = {
      id: 'occupancy_req_001',
      type: 'analytics_request',
      timestamp: new Date(),
      data: {
        request_type: 'occupancy_analysis',
        occupancy_data: [
          { date: '2024-01-01', occupancy_rate: 0.75 },
          { date: '2024-01-02', occupancy_rate: 0.82 },
          { date: '2024-01-03', occupancy_rate: 0.78 },
          { date: '2024-01-04', occupancy_rate: 0.85 },
          { date: '2024-01-05', occupancy_rate: 0.88 }
        ],
        time_period: '7d'
      },
      processed: false
    };

    await enhancedBotLabCore.publishCrossLanguageEvent(occupancyRequest, [AgentLanguage.PYTHON]);
    console.log('✅ Occupancy analysis request sent to Python agents');

    await this.sleep(1000);

    // Example 3: Execute command on specific language agents
    console.log('📋 Example 3: Execute command on Python agents');
    
    const commandResults = await enhancedBotLabCore.executeCommandOnLanguageAgents(
      AgentLanguage.PYTHON,
      'generate_report',
      {
        report_type: 'summary',
        include_charts: true,
        format: 'json'
      }
    );

    console.log('📋 Command execution results:', commandResults);
    console.log('✅ Cross-language communication demonstrated');
  }

  private async demonstrateEventCoordination(): Promise<void> {
    console.log('\n🎭 Step 4: Demonstrating event coordination...');

    // Simulate client registration event that triggers multiple agents
    console.log('👤 Simulating client registration event...');
    
    const clientRegistrationEvent: BotEvent = {
      id: 'client_reg_001',
      type: 'client_registration',
      timestamp: new Date(),
      data: {
        client_id: 'client_004',
        name: 'John Doe',
        age: 32,
        phone: '+1234567890',
        needs: ['shelter', 'meals', 'job_training'],
        priority: 'high',
        registration_time: new Date().toISOString()
      },
      processed: false
    };

    // This will trigger:
    // 1. SMS Wake-up Bot (JavaScript) - to set up wake-up notifications
    // 2. Analytics Agent (Python) - to update client demographics
    // 3. Data Processing Agent (Python) - to process registration data
    await enhancedBotLabCore.publishCrossLanguageEvent(clientRegistrationEvent);
    console.log('✅ Client registration event published to all agents');

    await this.sleep(1500);

    // Simulate occupancy change event
    console.log('🏠 Simulating occupancy change event...');
    
    const occupancyChangeEvent: BotEvent = {
      id: 'occupancy_001',
      type: 'occupancy_change',
      timestamp: new Date(),
      data: {
        facility_id: 'shelter_main',
        previous_occupancy: 45,
        current_occupancy: 47,
        capacity: 50,
        change_reason: 'new_check_in',
        alert_level: 'normal'
      },
      processed: false
    };

    await enhancedBotLabCore.publishCrossLanguageEvent(occupancyChangeEvent, [AgentLanguage.PYTHON]);
    console.log('✅ Occupancy change event sent to Python analytics agents');

    await this.sleep(1000);
    console.log('✅ Event coordination demonstrated');
  }

  private async monitorSystemPerformance(): Promise<void> {
    console.log('\n📈 Step 5: Monitoring system performance...');

    // Get enhanced system status
    const systemStatus = enhancedBotLabCore.getEnhancedSystemStatus();
    console.log('🔍 Enhanced System Status:');
    console.log(JSON.stringify(systemStatus, null, 2));

    // Get resource usage
    const resourceUsage = await enhancedBotLabCore.getResourceUsage();
    console.log('💾 Resource Usage:');
    console.log(JSON.stringify(resourceUsage, null, 2));

    // Get all multi-language bots
    const multiLangBots = enhancedBotLabCore.getAllMultiLanguageBots();
    console.log(`🤖 Multi-language bots running: ${multiLangBots.length}`);
    
    multiLangBots.forEach(bot => {
      console.log(`  - ${bot.config.name} (${bot.config.language}): ${bot.status.status}`);
      console.log(`    Memory: ${bot.context.resourceUsage.memoryMB}MB, CPU: ${bot.context.resourceUsage.cpuPercent}%`);
    });

    // Check agents by language
    const pythonBots = enhancedBotLabCore.getBotsByLanguage(AgentLanguage.PYTHON);
    console.log(`🐍 Python agents: ${pythonBots.length}`);

    const jsBots = enhancedBotLabCore.getBotsByLanguage(AgentLanguage.JAVASCRIPT);
    console.log(`🟨 JavaScript agents: ${jsBots.length}`);

    console.log('✅ System performance monitoring completed');
  }

  private async testErrorHandling(): Promise<void> {
    console.log('\n🛡️ Step 6: Testing error handling...');

    // Test 1: Send invalid message to Python agent
    console.log('🔧 Test 1: Sending invalid message format...');
    
    try {
      const invalidEvent: BotEvent = {
        id: 'invalid_001',
        type: 'invalid_message_type',
        timestamp: new Date(),
        data: {
          malformed: 'data',
          missing_required_fields: true
        },
        processed: false
      };

      await enhancedBotLabCore.publishCrossLanguageEvent(invalidEvent, [AgentLanguage.PYTHON]);
      console.log('✅ Invalid message sent (agents should handle gracefully)');
    } catch (error) {
      console.log('⚠️ Expected error caught:', error instanceof Error ? error.message : error);
    }

    await this.sleep(1000);

    // Test 2: Try to interact with non-existent agent
    console.log('🔧 Test 2: Trying to interact with non-existent agent...');
    
    try {
      await enhancedBotLabCore.startBot('non_existent_agent');
    } catch (error) {
      console.log('✅ Expected error for non-existent agent:', error instanceof Error ? error.message : error);
    }

    // Test 3: Monitor system health after errors
    console.log('🔧 Test 3: Checking system health after errors...');
    
    const healthStatus = enhancedBotLabCore.getEnhancedSystemStatus();
    console.log('🏥 System health after error tests:');
    console.log(`  Total bots: ${healthStatus.totalBots}`);
    console.log(`  Active bots: ${enhancedBotLabCore.getActiveBotsCount()}`);

    console.log('✅ Error handling tests completed');
  }

  private async cleanup(): Promise<void> {
    console.log('\n🧹 Cleaning up multi-language agent system...');

    try {
      this.isRunning = false;
      await enhancedBotLabCore.stopAllBots();
      console.log('✅ All agents stopped successfully');
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Utility methods for demonstration
  private async demonstrateAdvancedFeatures(): Promise<void> {
    console.log('\n🔬 Advanced Features Demonstration...');

    // Feature 1: Dynamic agent spawning
    console.log('🚀 Feature 1: Dynamic agent spawning...');
    
    const dynamicConfig: EnhancedBotConfiguration = {
      botId: 'dynamic_python_agent',
      name: 'Dynamic Python Agent',
      description: 'Dynamically spawned Python agent for specialized tasks',
      version: '1.0.0',
      author: 'System',
      language: AgentLanguage.PYTHON,
      microservices: ['dynamic_processing'],
      eventTypes: ['dynamic_task'],
      enabled: true,
      settings: {
        task_type: 'specialized_analysis'
      },
      scriptPath: './src/agents/python/dynamic_agent.py'
    };

    try {
      await enhancedBotLabCore.registerMultiLanguageBot(dynamicConfig);
      await enhancedBotLabCore.startMultiLanguageBot(dynamicConfig.botId);
      console.log('✅ Dynamic agent spawned successfully');

      // Use the dynamic agent
      await this.sleep(1000);

      // Clean up dynamic agent
      await enhancedBotLabCore.stopMultiLanguageBot(dynamicConfig.botId);
      console.log('✅ Dynamic agent stopped and cleaned up');
    } catch (error) {
      console.log('⚠️ Dynamic agent feature demo (expected - script may not exist)');
    }

    // Feature 2: Language-specific performance optimization
    console.log('🔧 Feature 2: Language-specific optimization...');
    
    // Show how to optimize resource limits for different languages
    const jsOptimizations = {
      resourceLimits: {
        maxMemoryMB: 256, // JavaScript agents typically use less memory
        maxCpuPercent: 50,
        timeoutMs: 15000
      }
    };

    const pythonOptimizations = {
      resourceLimits: {
        maxMemoryMB: 1024, // Python agents may need more memory for data processing
        maxCpuPercent: 80,
        timeoutMs: 60000
      }
    };

    console.log('💡 JavaScript optimization recommendations:', jsOptimizations);
    console.log('💡 Python optimization recommendations:', pythonOptimizations);

    console.log('✅ Advanced features demonstration completed');
  }
}

// Example usage
export async function runMultiLanguageAgentExample(): Promise<void> {
  const example = new MultiLanguageAgentExample();
  await example.run();
}

// Run the example if this file is executed directly
if (require.main === module) {
  runMultiLanguageAgentExample()
    .then(() => {
      console.log('🎉 Multi-language agent example completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Multi-language agent example failed:', error);
      process.exit(1);
    });
}

export default MultiLanguageAgentExample;