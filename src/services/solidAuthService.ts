import {
  login,
  logout,
  getDefaultSession,
  handleIncomingRedirect,
  Session,
  ISessionInfo
} from '@inrupt/solid-client-authn-browser';
import { SOLID_CONFIG } from '../config/solidConfig';
import { SOLID_CREDENTIALS, getSolidAuthHeader, hasSolidCredentials } from '../config/solidCredentials';

class SolidAuthService {
  private session: Session;
  private isCredentialAuthenticated: boolean = false;
  
  constructor() {
    this.session = getDefaultSession();
    // Auto-authenticate with credentials if available
    this.initializeWithCredentials();
  }

  /**
   * Initialize authentication using provided credentials
   */
  private async initializeWithCredentials(): Promise<void> {
    if (hasSolidCredentials()) {
      this.isCredentialAuthenticated = true;
      console.log('🔐 Solid Pod credentials configured for:', SOLID_CREDENTIALS.podOwner.identifier);
    }
  }

  /**
   * Initialize Solid authentication and handle redirects
   */
  async initialize(): Promise<ISessionInfo> {
    try {
      // Handle redirect from Solid provider
      await handleIncomingRedirect();
      return this.session.info;
    } catch (error) {
      console.error('Failed to initialize Solid authentication:', error);
      throw error;
    }
  }

  /**
   * Login to a Solid pod
   */
  async login(oidcIssuer?: string): Promise<void> {
    try {
      const provider = oidcIssuer || SOLID_CONFIG.defaultProvider;
      
      await login({
        redirectUrl: SOLID_CONFIG.redirectUrl,
        oidcIssuer: provider,
        clientName: SOLID_CONFIG.clientName,
      });
    } catch (error) {
      console.error('Solid login failed:', error);
      throw error;
    }
  }

  /**
   * Logout from Solid pod
   */
  async logout(): Promise<void> {
    try {
      await logout();
    } catch (error) {
      console.error('Solid logout failed:', error);
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.session.info.isLoggedIn || this.isCredentialAuthenticated;
  }

  /**
   * Get current session info
   */
  getSessionInfo(): ISessionInfo {
    return this.session.info;
  }

  /**
   * Get authenticated fetch function for API calls
   */
  getFetch() {
    if (this.isCredentialAuthenticated) {
      // Return custom fetch with authentication headers
      return this.getCredentialAuthenticatedFetch();
    }
    return this.session.fetch;
  }

  /**
   * Create authenticated fetch using credentials
   */
  private getCredentialAuthenticatedFetch(): typeof fetch {
    return async (input: RequestInfo | URL, options: RequestInit = {}) => {
      const url = typeof input === 'string' ? input : 
                  input instanceof URL ? input.toString() : 
                  input.url;
                  
      const authHeader = getSolidAuthHeader();
      const headers = {
        ...options.headers,
        'Authorization': authHeader,
        'Accept': 'text/turtle, application/ld+json, application/json, */*',
        'Content-Type': 'text/turtle'
      };
      
      return fetch(input, {
        ...options,
        headers
      });
    };
  }

  /**
   * Get user's WebID
   */
  getWebId(): string | undefined {
    if (this.isCredentialAuthenticated) {
      return SOLID_CREDENTIALS.podOwner.webId;
    }
    return this.session.info.webId;
  }

  /**
   * Get user's pod URL (extracted from WebID)
   */
  getPodUrl(): string | null {
    if (this.isCredentialAuthenticated) {
      return SOLID_CREDENTIALS.podOwner.podUrl;
    }
    
    const webId = this.getWebId();
    if (!webId) return null;

    try {
      const url = new URL(webId);
      return `${url.protocol}//${url.host}`;
    } catch (error) {
      console.error('Failed to extract pod URL from WebID:', error);
      return null;
    }
  }

  /**
   * Get user's pod root container URL
   */
  getPodRootUrl(): string | null {
    const podUrl = this.getPodUrl();
    if (!podUrl) return null;
    
    return `${podUrl}/`;
  }

  /**
   * Subscribe to authentication state changes
   */
  onSessionUpdate(callback: (session: ISessionInfo) => void): void {
    // Session update monitoring - simplified for now
    const interval = setInterval(() => {
      callback(this.session.info);
    }, 5000);
    // Store interval for cleanup if needed
    (this as any)._updateInterval = interval;
  }

  /**
   * Remove session update listener
   */
  removeSessionUpdateListener(callback: (session: ISessionInfo) => void): void {
    // Note: The Solid client doesn't provide a direct way to remove listeners
    // This would need to be implemented based on the specific use case
    console.warn('removeSessionUpdateListener not fully implemented');
  }
}

export const solidAuthService = new SolidAuthService();