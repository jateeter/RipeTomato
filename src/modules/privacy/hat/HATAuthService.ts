export interface HATAuthConfig {
  serviceUrl: string;
  applicationId: string;
  applicationSecret: string;
  namespace: string;
}

export interface HATAuthResult {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

export class HATAuthService {
  private config: HATAuthConfig;
  private currentToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: HATAuthConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    // Check for stored token
    const stored = localStorage.getItem('hat-auth-token');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data.expiresAt > Date.now()) {
          this.currentToken = data.accessToken;
          this.tokenExpiry = data.expiresAt;
        }
      } catch (error) {
        console.error('Failed to restore HAT token:', error);
      }
    }
  }

  async authenticateClient(credentials: { username: string; password: string }): Promise<HATAuthResult> {
    try {
      const response = await fetch(`${this.config.serviceUrl}/users/authenticate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': this.config.applicationSecret
        },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password,
          applicationId: this.config.applicationId
        })
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.statusText}`);
      }

      const data = await response.json();

      const result: HATAuthResult = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: Date.now() + (data.expiresIn || 3600) * 1000
      };

      this.currentToken = result.accessToken;
      this.tokenExpiry = result.expiresAt;

      // Store token
      localStorage.setItem('hat-auth-token', JSON.stringify(result));

      return result;
    } catch (error) {
      console.error('HAT authentication failed:', error);
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<HATAuthResult> {
    try {
      const response = await fetch(`${this.config.serviceUrl}/users/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': this.config.applicationSecret
        },
        body: JSON.stringify({
          refreshToken,
          applicationId: this.config.applicationId
        })
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.statusText}`);
      }

      const data = await response.json();

      const result: HATAuthResult = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: Date.now() + (data.expiresIn || 3600) * 1000
      };

      this.currentToken = result.accessToken;
      this.tokenExpiry = result.expiresAt;

      localStorage.setItem('hat-auth-token', JSON.stringify(result));

      return result;
    } catch (error) {
      console.error('HAT token refresh failed:', error);
      throw error;
    }
  }

  getAccessToken(): string | null {
    if (this.currentToken && this.tokenExpiry > Date.now()) {
      return this.currentToken;
    }
    return null;
  }

  isAuthenticated(): boolean {
    return this.getAccessToken() !== null;
  }

  async logout(): Promise<void> {
    this.currentToken = null;
    this.tokenExpiry = 0;
    localStorage.removeItem('hat-auth-token');
  }
}
