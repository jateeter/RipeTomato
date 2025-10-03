import { SolidAuthService, SolidAuthConfig, SolidSession } from './SolidAuthService';
import { SolidDataService } from './SolidDataService';

export class SolidPodManager {
  private authService: SolidAuthService;
  private dataService: SolidDataService | null = null;

  constructor(config: SolidAuthConfig) {
    this.authService = new SolidAuthService(config);
  }

  async initialize(): Promise<void> {
    await this.authService.initialize();

    const session = this.authService.getSession();
    if (session.isLoggedIn) {
      this.dataService = new SolidDataService(session);
    }
  }

  async login(): Promise<void> {
    await this.authService.login();
  }

  async logout(): Promise<void> {
    await this.authService.logout();
    this.dataService = null;
  }

  async handleCallback(): Promise<void> {
    const session = await this.authService.handleRedirectCallback();
    if (session.isLoggedIn) {
      this.dataService = new SolidDataService(session);
    }
  }

  getAuthService(): SolidAuthService {
    return this.authService;
  }

  getDataService(): SolidDataService {
    if (!this.dataService) {
      throw new Error('Not authenticated - call login() first');
    }
    return this.dataService;
  }

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  getSession(): SolidSession {
    return this.authService.getSession();
  }
}
