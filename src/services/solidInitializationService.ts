/**
 * Solid Pod Initialization Service
 * 
 * Handles startup workflow for connecting to Solid Pod provider (https://opencommons.net)
 * with proper credential initialization and connection validation.
 * 
 * @license MIT
 */

import { 
  SOLID_CREDENTIALS, 
  validateOpenCommonsConnection, 
  updateSolidCredentials,
  hasSolidCredentials 
} from '../config/solidCredentials';
import { SOLID_CONFIG } from '../config/solidConfig';
import { solidAuthService } from './solidAuthService';
import { solidPodService } from './solidPodService';

interface InitializationResult {
  success: boolean;
  message: string;
  connectionStatus: 'connected' | 'disconnected' | 'error';
  providerConfig?: any;
  credentials?: any;
  error?: string;
}

interface EnvironmentCredentials {
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  webId?: string;
  podUrl?: string;
}

class SolidInitializationService {
  private isInitialized: boolean = false;
  private initializationPromise: Promise<InitializationResult> | null = null;

  /**
   * Initialize Solid Pod connection during application startup
   */
  async initialize(): Promise<InitializationResult> {
    // Return existing promise if initialization is in progress
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Return cached result if already initialized
    if (this.isInitialized) {
      return {
        success: true,
        message: 'Solid Pod already initialized',
        connectionStatus: 'connected'
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

  /**
   * Perform the actual initialization workflow
   */
  private async performInitialization(): Promise<InitializationResult> {
    console.log('🚀 Starting Solid Pod initialization workflow...');

    try {
      // Step 1: Validate OpenCommons.net connectivity
      console.log('📡 Step 1: Validating OpenCommons.net connectivity...');
      const connectionValidation = await validateOpenCommonsConnection();
      
      if (!connectionValidation.isValid) {
        return {
          success: false,
          message: 'Failed to connect to OpenCommons.net',
          connectionStatus: 'error',
          error: connectionValidation.error
        };
      }

      console.log('✅ OpenCommons.net connection validated');
      console.log('🔧 Provider configuration:', connectionValidation.config);

      // Step 2: Load environment credentials
      console.log('🔑 Step 2: Loading credentials from environment...');
      const envCredentials = this.loadEnvironmentCredentials();
      
      if (this.hasValidCredentials(envCredentials)) {
        console.log('✅ Environment credentials found');
        updateSolidCredentials(envCredentials);
      } else {
        console.log('⚠️ No environment credentials found, using default configuration');
      }

      // Step 3: Attempt to restore persistent session
      console.log('💾 Step 3: Checking for persistent session...');
      const persistentSession = await this.restorePersistentSession();
      
      if (persistentSession.success) {
        console.log('✅ Persistent session restored');
      } else {
        console.log('ℹ️ No persistent session found, will require authentication');
      }

      // Step 4: Initialize Solid Auth Service
      console.log('🔐 Step 4: Initializing Solid authentication...');
      try {
        const authInfo = await solidAuthService.initialize();
        console.log('✅ Solid authentication initialized');
        console.log('👤 Auth status:', authInfo.isLoggedIn ? 'Logged in' : 'Not logged in');
        
        if (authInfo.isLoggedIn && authInfo.webId) {
          console.log('🆔 WebID:', authInfo.webId);
          
          // Update credentials with session info
          updateSolidCredentials({
            webId: authInfo.webId,
            podUrl: solidAuthService.getPodUrl() || undefined
          });
        }
      } catch (authError) {
        console.warn('⚠️ Solid authentication initialization failed:', authError);
        // Continue with initialization even if auth fails
      }

      // Step 5: Test Pod connectivity
      console.log('🧪 Step 5: Testing Pod connectivity...');
      const connectivityTest = await this.testPodConnectivity();
      
      if (connectivityTest.success) {
        console.log('✅ Pod connectivity test passed');
      } else {
        console.log('⚠️ Pod connectivity test failed:', connectivityTest.error);
      }

      // Step 6: Save initialization state
      console.log('💾 Step 6: Saving initialization state...');
      await this.saveInitializationState({
        timestamp: new Date(),
        provider: SOLID_CONFIG.defaultProvider,
        connectionStatus: connectivityTest.success ? 'connected' : 'disconnected',
        hasCredentials: hasSolidCredentials()
      });

      const finalResult: InitializationResult = {
        success: true,
        message: 'Solid Pod initialization completed successfully',
        connectionStatus: connectivityTest.success ? 'connected' : 'disconnected',
        providerConfig: connectionValidation.config,
        credentials: {
          hasCredentials: hasSolidCredentials(),
          webId: solidAuthService.getWebId(),
          podUrl: solidAuthService.getPodUrl()
        }
      };

      console.log('🎉 Solid Pod initialization workflow completed');
      console.log('📊 Final status:', finalResult);

      return finalResult;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
      console.error('❌ Solid Pod initialization failed:', errorMessage);

      return {
        success: false,
        message: 'Solid Pod initialization failed',
        connectionStatus: 'error',
        error: errorMessage
      };
    }
  }

  /**
   * Load credentials from environment variables
   */
  private loadEnvironmentCredentials(): EnvironmentCredentials {
    return {
      clientId: process.env.REACT_APP_SOLID_CLIENT_ID,
      clientSecret: process.env.REACT_APP_SOLID_CLIENT_SECRET,
      accessToken: process.env.REACT_APP_SOLID_ACCESS_TOKEN,
      refreshToken: process.env.REACT_APP_SOLID_REFRESH_TOKEN,
      webId: process.env.REACT_APP_SOLID_WEB_ID,
      podUrl: process.env.REACT_APP_SOLID_POD_URL
    };
  }

  /**
   * Check if credentials are valid
   */
  private hasValidCredentials(credentials: EnvironmentCredentials): boolean {
    return !!(
      credentials.accessToken || 
      (credentials.clientId && credentials.clientSecret) ||
      credentials.webId
    );
  }

  /**
   * Attempt to restore persistent session
   */
  private async restorePersistentSession(): Promise<{ success: boolean; session?: any }> {
    try {
      const persistentConfig = await solidPodService.loadSolidConfiguration();
      
      if (persistentConfig && persistentConfig.connected) {
        // Validate that the session is still valid
        const sessionAge = new Date().getTime() - new Date(persistentConfig.lastConnected).getTime();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (sessionAge < maxAge) {
          // Session is recent enough, attempt to restore
          updateSolidCredentials({
            webId: persistentConfig.webId,
            podUrl: persistentConfig.podUrl
          });
          
          return {
            success: true,
            session: persistentConfig
          };
        } else {
          console.log('🕒 Persistent session expired, clearing...');
          await solidPodService.clearPersistentSession();
        }
      }
      
      return { success: false };
    } catch (error) {
      console.error('Failed to restore persistent session:', error);
      return { success: false };
    }
  }

  /**
   * Test Pod connectivity
   */
  private async testPodConnectivity(): Promise<{ success: boolean; error?: string }> {
    try {
      const podUrl = solidAuthService.getPodUrl();
      
      if (!podUrl) {
        return {
          success: false,
          error: 'No Pod URL available for connectivity test'
        };
      }

      // Test basic connectivity to Pod root
      const response = await fetch(podUrl, {
        method: 'HEAD',
        headers: {
          'Accept': 'text/turtle, application/ld+json'
        }
      });

      if (response.ok || response.status === 401) {
        // 200 OK or 401 Unauthorized both indicate the Pod is reachable
        return { success: true };
      } else {
        return {
          success: false,
          error: `Pod connectivity test failed: ${response.status} ${response.statusText}`
        };
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connectivity test failed'
      };
    }
  }

  /**
   * Save initialization state
   */
  private async saveInitializationState(state: {
    timestamp: Date;
    provider: string;
    connectionStatus: string;
    hasCredentials: boolean;
  }): Promise<void> {
    try {
      const stateData = {
        ...state,
        version: '1.0',
        appVersion: process.env.REACT_APP_VERSION || 'development'
      };

      localStorage.setItem('solid_initialization_state', JSON.stringify(stateData));
      console.log('💾 Initialization state saved');
    } catch (error) {
      console.error('Failed to save initialization state:', error);
    }
  }

  /**
   * Get initialization status
   */
  getInitializationStatus(): {
    isInitialized: boolean;
    lastInitialization?: any;
  } {
    const stateData = localStorage.getItem('solid_initialization_state');
    
    return {
      isInitialized: this.isInitialized,
      lastInitialization: stateData ? JSON.parse(stateData) : undefined
    };
  }

  /**
   * Force re-initialization
   */
  async reinitialize(): Promise<InitializationResult> {
    console.log('🔄 Forcing Solid Pod re-initialization...');
    
    this.isInitialized = false;
    this.initializationPromise = null;
    
    // Clear cached state
    localStorage.removeItem('solid_initialization_state');
    
    return this.initialize();
  }

  /**
   * Get connection status
   */
  async getConnectionStatus(): Promise<{
    isConnected: boolean;
    provider: string;
    webId?: string;
    podUrl?: string;
    lastChecked: Date;
  }> {
    const webId = solidAuthService.getWebId();
    const podUrl = solidAuthService.getPodUrl();
    
    // Test current connectivity
    let isConnected = false;
    try {
      if (podUrl) {
        const response = await fetch(podUrl, { method: 'HEAD' });
        isConnected = response.ok || response.status === 401;
      }
    } catch (error) {
      isConnected = false;
    }

    return {
      isConnected,
      provider: SOLID_CONFIG.defaultProvider,
      webId: webId || undefined,
      podUrl: podUrl || undefined,
      lastChecked: new Date()
    };
  }
}

export const solidInitializationService = new SolidInitializationService();
export default solidInitializationService;