import { HATAuthService, HATAuthConfig } from './HATAuthService';
import { HATDataService } from './HATDataService';

export class HATManager {
  private authService: HATAuthService;
  private dataService: HATDataService | null = null;
  private config: HATAuthConfig;

  constructor(config: HATAuthConfig) {
    this.config = config;
    this.authService = new HATAuthService(config);
  }

  async initialize(): Promise<void> {
    await this.authService.initialize();

    const token = this.authService.getAccessToken();
    if (token) {
      this.dataService = new HATDataService(token, this.config.serviceUrl, this.config.namespace);
    }
  }

  async login(credentials: { username: string; password: string }): Promise<void> {
    const result = await this.authService.authenticateClient(credentials);
    this.dataService = new HATDataService(result.accessToken, this.config.serviceUrl, this.config.namespace);
  }

  async logout(): Promise<void> {
    await this.authService.logout();
    this.dataService = null;
  }

  getAuthService(): HATAuthService {
    return this.authService;
  }

  getDataService(): HATDataService {
    if (!this.dataService) {
      throw new Error('Not authenticated - call login() first');
    }
    return this.dataService;
  }

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }
}
