/**
 * Weather Monitoring Agent Demo
 * 
 * Demonstrates the weather monitoring Python agent in action with the
 * multi-language agent runtime system. This example shows:
 * - Weather agent registration and startup
 * - Cross-language communication between JS and Python
 * - Real-time weather monitoring simulation
 * - Alert generation and handling
 * - Data analysis and reporting
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

class WeatherAgentDemo {
  private isRunning = false;
  private weatherAgentId = 'demo_weather_boise';

  constructor() {
    console.log('🌤️ Weather Monitoring Agent Demo');
  }

  async run(): Promise<void> {
    try {
      this.isRunning = true;
      console.log('🚀 Starting weather agent demonstration...');

      // Step 1: Register and start weather monitoring agent
      await this.registerWeatherAgent();

      // Step 2: Start weather monitoring
      await this.startWeatherMonitoring();

      // Step 3: Demonstrate weather data requests
      await this.demonstrateWeatherRequests();

      // Step 4: Simulate weather alerts
      await this.demonstrateWeatherAlerts();

      // Step 5: Show weather analysis capabilities
      await this.demonstrateWeatherAnalysis();

      // Step 6: Monitor for a period then cleanup
      await this.monitorAndCleanup();

      console.log('✅ Weather agent demonstration completed successfully');

    } catch (error) {
      console.error('❌ Error in weather agent demonstration:', error);
    }
  }

  private async registerWeatherAgent(): Promise<void> {
    console.log('\\n📝 Step 1: Registering Weather Monitoring Agent...');

    const weatherAgentConfig: EnhancedBotConfiguration = {
      botId: this.weatherAgentId,
      name: 'Boise Weather Monitor Demo',
      description: 'Demonstrates weather monitoring for Boise community services',
      version: '1.0.0',
      author: 'Demo Team',
      language: AgentLanguage.PYTHON,
      microservices: ['weather', 'alerts', 'analysis'],
      eventTypes: [
        'weather_update', 
        'weather_alert', 
        'weather_analysis_request',
        'start_monitoring',
        'stop_monitoring'
      ],
      enabled: true,
      settings: {
        location: 'Boise, ID',
        monitoring_duration_hours: 24, // 1 day for demo
        alert_thresholds: {
          temperature_high: 85.0,    // Lower threshold for demo
          temperature_low: 35.0,     // Higher threshold for demo
          precipitation_heavy: 0.3,  // Lower threshold for demo
          wind_high: 25.0,           // Lower threshold for demo
          visibility_low: 3.0,
          uv_extreme: 7
        }
      },
      scriptPath: './src/agents/python/weather_monitoring_agent.py',
      runtime: {
        executable: 'python3',
        workingDirectory: process.cwd(),
        environmentVariables: {
          PYTHONPATH: './src/agents/python',
          WEATHER_DEMO: 'true',
          LOG_LEVEL: 'INFO'
        },
        resourceLimits: {
          maxMemoryMB: 256,
          maxCpuPercent: 50,
          timeoutMs: 30000
        }
      }
    };

    try {
      await enhancedBotLabCore.registerMultiLanguageBot(weatherAgentConfig);
      console.log('✅ Weather agent registered successfully');

      // Start the weather agent
      await enhancedBotLabCore.startMultiLanguageBot(this.weatherAgentId);
      console.log('✅ Weather agent started successfully');

      // Wait for initialization
      await this.sleep(3000);

      // Verify agent status
      const status = enhancedBotLabCore.getEnhancedSystemStatus();
      console.log('📊 System Status:', {
        totalBots: status.totalBots,
        activeBots: status.activeBots,
        multiLanguageBots: enhancedBotLabCore.getAllMultiLanguageBots().length
      });

    } catch (error) {
      console.error('❌ Failed to register weather agent:', error);
      throw error;
    }
  }

  private async startWeatherMonitoring(): Promise<void> {
    console.log('\\n🌡️ Step 2: Starting Weather Monitoring...');

    const startMonitoringMessage: CrossLanguageMessage = {
      id: `start_monitoring_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'start_monitoring',
      source: {
        agentId: 'demo_controller',
        language: 'javascript',
        runtime: 'nodejs'
      },
      destination: {
        agentId: this.weatherAgentId
      },
      payload: {
        duration_hours: 24 // 1 day of monitoring
      },
      metadata: {
        priority: 'normal',
        retryCount: 0,
        maxRetries: 3,
        timeoutMs: 10000
      }
    };

    try {
      await enhancedBotLabCore.publishCrossLanguageEvent(
        startMonitoringMessage, 
        [AgentLanguage.PYTHON]
      );
      console.log('✅ Weather monitoring start command sent');

      // Wait for monitoring to begin
      await this.sleep(2000);

    } catch (error) {
      console.error('❌ Failed to start weather monitoring:', error);
      throw error;
    }
  }

  private async demonstrateWeatherRequests(): Promise<void> {
    console.log('\\n📊 Step 3: Demonstrating Weather Data Requests...');

    // Request current weather
    console.log('🌡️ Requesting current weather...');
    const currentWeatherRequest: CrossLanguageMessage = {
      id: `current_weather_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'get_current_weather',
      source: {
        agentId: 'demo_controller',
        language: 'javascript',
        runtime: 'nodejs'
      },
      destination: {
        agentId: this.weatherAgentId
      },
      payload: {},
      metadata: {
        priority: 'normal',
        retryCount: 0,
        maxRetries: 3,
        timeoutMs: 5000
      }
    };

    await enhancedBotLabCore.publishCrossLanguageEvent(
      currentWeatherRequest, 
      [AgentLanguage.PYTHON]
    );

    await this.sleep(1000);

    // Request weather forecast
    console.log('🔮 Requesting weather forecast...');
    const forecastRequest: CrossLanguageMessage = {
      id: `forecast_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'get_weather_forecast',
      source: {
        agentId: 'demo_controller',
        language: 'javascript',
        runtime: 'nodejs'
      },
      destination: {
        agentId: this.weatherAgentId
      },
      payload: {
        hours_ahead: 12 // 12 hour forecast
      },
      metadata: {
        priority: 'normal',
        retryCount: 0,
        maxRetries: 3,
        timeoutMs: 10000
      }
    };

    await enhancedBotLabCore.publishCrossLanguageEvent(
      forecastRequest, 
      [AgentLanguage.PYTHON]
    );

    await this.sleep(1000);

    // Request weather history
    console.log('📈 Requesting weather history...');
    const historyRequest: CrossLanguageMessage = {
      id: `history_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'get_weather_history',
      source: {
        agentId: 'demo_controller',
        language: 'javascript',
        runtime: 'nodejs'
      },
      destination: {
        agentId: this.weatherAgentId
      },
      payload: {
        hours_back: 6 // Last 6 hours
      },
      metadata: {
        priority: 'normal',
        retryCount: 0,
        maxRetries: 3,
        timeoutMs: 5000
      }
    };

    await enhancedBotLabCore.publishCrossLanguageEvent(
      historyRequest, 
      [AgentLanguage.PYTHON]
    );

    console.log('✅ Weather data requests sent');
    await this.sleep(2000);
  }

  private async demonstrateWeatherAlerts(): Promise<void> {
    console.log('\\n⚠️ Step 4: Demonstrating Weather Alert System...');

    // Update alert thresholds to trigger more alerts for demo
    const updateThresholdsRequest: CrossLanguageMessage = {
      id: `update_thresholds_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'update_alert_thresholds',
      source: {
        agentId: 'demo_controller',
        language: 'javascript',
        runtime: 'nodejs'
      },
      destination: {
        agentId: this.weatherAgentId
      },
      payload: {
        thresholds: {
          temperature_high: 75.0,    // Very low threshold for demo
          temperature_low: 45.0,     // Higher threshold for demo
          precipitation_heavy: 0.1,  // Very low threshold for demo
          wind_high: 15.0,           // Very low threshold for demo
          visibility_low: 5.0,
          uv_extreme: 5
        }
      },
      metadata: {
        priority: 'normal',
        retryCount: 0,
        maxRetries: 3,
        timeoutMs: 5000
      }
    };

    await enhancedBotLabCore.publishCrossLanguageEvent(
      updateThresholdsRequest, 
      [AgentLanguage.PYTHON]
    );

    console.log('✅ Alert thresholds updated for demonstration');
    await this.sleep(1000);

    // Request current alerts
    const alertsRequest: CrossLanguageMessage = {
      id: `alerts_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'get_weather_alerts',
      source: {
        agentId: 'demo_controller',
        language: 'javascript',
        runtime: 'nodejs'
      },
      destination: {
        agentId: this.weatherAgentId
      },
      payload: {},
      metadata: {
        priority: 'normal',
        retryCount: 0,
        maxRetries: 3,
        timeoutMs: 5000
      }
    };

    await enhancedBotLabCore.publishCrossLanguageEvent(
      alertsRequest, 
      [AgentLanguage.PYTHON]
    );

    console.log('✅ Weather alerts requested');
    await this.sleep(2000);
  }

  private async demonstrateWeatherAnalysis(): Promise<void> {
    console.log('\\n📊 Step 5: Demonstrating Weather Analysis...');

    const analysisRequest: CrossLanguageMessage = {
      id: `analysis_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'weather_analysis_request',
      source: {
        agentId: 'demo_controller',
        language: 'javascript',
        runtime: 'nodejs'
      },
      destination: {
        agentId: this.weatherAgentId
      },
      payload: {
        hours_back: 12 // Analyze last 12 hours
      },
      metadata: {
        priority: 'normal',
        retryCount: 0,
        maxRetries: 3,
        timeoutMs: 15000
      }
    };

    await enhancedBotLabCore.publishCrossLanguageEvent(
      analysisRequest, 
      [AgentLanguage.PYTHON]
    );

    console.log('✅ Weather analysis requested');
    await this.sleep(3000);
  }

  private async monitorAndCleanup(): Promise<void> {
    console.log('\\n🕐 Step 6: Monitoring system activity...');

    // Monitor for a period to see weather updates
    console.log('📡 Monitoring weather updates for 30 seconds...');
    for (let i = 0; i < 6; i++) {
      await this.sleep(5000);
      
      // Show system status
      const status = enhancedBotLabCore.getEnhancedSystemStatus();
      const multiLangBots = enhancedBotLabCore.getAllMultiLanguageBots();
      const weatherBot = multiLangBots.find(bot => bot.config.botId === this.weatherAgentId);
      
      console.log(`📊 Status check ${i + 1}/6:`, {
        totalBots: status.totalBots,
        activeBots: status.activeBots,
        weatherAgentHealth: weatherBot?.status.status || 'unknown',
        weatherAgentMemory: weatherBot?.context.resourceUsage.memoryMB || 0
      });
    }

    // Stop weather monitoring
    console.log('\\n🛑 Stopping weather monitoring...');
    const stopMonitoringMessage: CrossLanguageMessage = {
      id: `stop_monitoring_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'stop_monitoring',
      source: {
        agentId: 'demo_controller',
        language: 'javascript',
        runtime: 'nodejs'
      },
      destination: {
        agentId: this.weatherAgentId
      },
      payload: {},
      metadata: {
        priority: 'normal',
        retryCount: 0,
        maxRetries: 3,
        timeoutMs: 5000
      }
    };

    await enhancedBotLabCore.publishCrossLanguageEvent(
      stopMonitoringMessage, 
      [AgentLanguage.PYTHON]
    );

    await this.sleep(2000);

    // Clean up
    console.log('🧹 Cleaning up weather agent...');
    try {
      await enhancedBotLabCore.stopMultiLanguageBot(this.weatherAgentId);
      console.log('✅ Weather agent stopped successfully');
    } catch (error) {
      console.error('⚠️ Error stopping weather agent:', error);
    }

    // Final status
    const finalStatus = enhancedBotLabCore.getEnhancedSystemStatus();
    console.log('📊 Final System Status:', {
      totalBots: finalStatus.totalBots,
      activeBots: finalStatus.activeBots
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Utility methods for demo

  private async showWeatherAgentCapabilities(): Promise<void> {
    console.log('\\n🔧 Weather Agent Capabilities:');
    console.log('  • Real-time weather monitoring (hourly readings)');
    console.log('  • Weather data simulation with realistic patterns');
    console.log('  • Extreme weather alert generation');
    console.log('  • Historical weather data analysis');
    console.log('  • Weather forecasting (simulated)');
    console.log('  • Cross-language communication with JavaScript agents');
    console.log('  • Resource usage monitoring');
    console.log('  • Configurable alert thresholds');
    console.log('  • Community services impact analysis');
  }

  private async showUseCase(): Promise<void> {
    console.log('\\n🏠 Community Services Use Cases:');
    console.log('  • Shelter Operations:');
    console.log('    - Open cooling/warming centers based on temperature');
    console.log('    - Adjust capacity planning for extreme weather');
    console.log('    - Coordinate with transportation for client pickup');
    console.log('');
    console.log('  • Outdoor Events:');
    console.log('    - Cancel/reschedule events for severe weather');
    console.log('    - Provide weather updates to participants');
    console.log('    - Adjust safety protocols based on conditions');
    console.log('');
    console.log('  • Transportation Services:');
    console.log('    - Route planning around weather conditions');
    console.log('    - Vehicle safety adjustments for visibility/wind');
    console.log('    - Schedule modifications for severe weather');
    console.log('');
    console.log('  • Outreach Services:');
    console.log('    - Priority wellness checks during extreme weather');
    console.log('    - Deploy additional resources for weather events');
    console.log('    - Coordinate emergency response efforts');
  }
}

// Example usage
export async function runWeatherAgentDemo(): Promise<void> {
  const demo = new WeatherAgentDemo();
  
  // Show capabilities and use cases
  await demo.showWeatherAgentCapabilities();
  await demo.showUseCase();
  
  // Run the demo
  await demo.run();
}

// Run the demo if this file is executed directly
if (require.main === module) {
  runWeatherAgentDemo()
    .then(() => {
      console.log('🎉 Weather agent demo completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Weather agent demo failed:', error);
      process.exit(1);
    });
}

export default WeatherAgentDemo;