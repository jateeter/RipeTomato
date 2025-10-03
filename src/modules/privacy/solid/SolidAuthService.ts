import { Session } from '@inrupt/solid-client-authn-browser';

export interface SolidAuthConfig {
  issuer: string;
  clientId: string;
  redirectUrl: string;
  scopes?: string[];
}

export interface SolidSession {
  isLoggedIn: boolean;
  webId?: string;
  accessToken?: string;
  expiresAt?: number;
}

export class SolidAuthService {
  private config: SolidAuthConfig;
  private session: Session | null = null;

  constructor(config: SolidAuthConfig) {
    this.config = {
      ...config,
      scopes: config.scopes || ['openid', 'profile', 'offline_access']
    };
  }

  async initialize(): Promise<void> {
    if (typeof window === 'undefined') {
      console.warn('Solid authentication requires browser environment');
      return;
    }

    const { Session } = await import('@inrupt/solid-client-authn-browser');
    this.session = new Session();
    await this.session.handleIncomingRedirect();
  }

  async login(): Promise<void> {
    if (!this.session) {
      throw new Error('SolidAuthService not initialized');
    }

    await this.session.login({
      oidcIssuer: this.config.issuer,
      clientId: this.config.clientId,
      redirectUrl: this.config.redirectUrl
    });
  }

  async logout(): Promise<void> {
    if (!this.session) {
      throw new Error('SolidAuthService not initialized');
    }

    await this.session.logout();
  }

  async handleRedirectCallback(): Promise<SolidSession> {
    if (!this.session) {
      throw new Error('SolidAuthService not initialized');
    }

    await this.session.handleIncomingRedirect();

    return this.getSession();
  }

  getSession(): SolidSession {
    if (!this.session) {
      return { isLoggedIn: false };
    }

    return {
      isLoggedIn: this.session.info.isLoggedIn,
      webId: this.session.info.webId,
      accessToken: this.session.info.sessionId
    };
  }

  async refreshToken(): Promise<void> {
    // Token refresh is handled automatically by the Solid client
    if (this.session) {
      await this.session.handleIncomingRedirect();
    }
  }

  isAuthenticated(): boolean {
    return this.session?.info.isLoggedIn || false;
  }

  getWebId(): string | undefined {
    return this.session?.info.webId;
  }
}
