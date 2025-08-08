import { v4 as uuidv4 } from 'uuid';
import { solidDataService } from './solidDataService';
import { solidAuthService } from './solidAuthService';
import { Client } from '../types/Shelter';

export interface UserPodConfig {
  userId: string;
  podUrl: string;
  webId: string;
  credentials: {
    identifier: string;
    secret: string;
  };
  containers: {
    personal: string;
    health: string;
    shelter: string;
    wallet: string;
    notifications: string;
  };
  createdAt: Date;
  lastAccessed?: Date;
  isActive: boolean;
}

export interface PodProvisionRequest {
  userId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  shelterName: string;
  preferredProvider?: string;
}

class UserPodService {
  private userPods: Map<string, UserPodConfig> = new Map();
  private readonly defaultProviders = [
    'https://solidcommunity.net',
    'https://inrupt.net',
    'https://solidweb.me'
  ];

  /**
   * Provision a new Solid Pod for a user
   */
  async provisionUserPod(request: PodProvisionRequest): Promise<UserPodConfig> {
    const userId = request.userId;
    
    // Check if user already has a pod
    if (this.userPods.has(userId)) {
      throw new Error(`User ${userId} already has a pod configured`);
    }

    // Generate unique pod identifier
    const podIdentifier = this.generatePodIdentifier(request.firstName, request.lastName, userId);
    const provider = request.preferredProvider || this.selectProvider();
    
    // In a real implementation, this would make API calls to the Solid provider
    // to create a new pod. For demo purposes, we'll simulate the creation.
    const podConfig = await this.createPodConfiguration(userId, podIdentifier, provider, request);
    
    this.userPods.set(userId, podConfig);
    
    console.log(`🏠 Created new Solid Pod for user ${request.firstName} ${request.lastName}:`, podConfig.podUrl);
    
    return podConfig;
  }

  /**
   * Get user's pod configuration
   */
  getUserPod(userId: string): UserPodConfig | null {
    return this.userPods.get(userId) || null;
  }

  /**
   * Initialize user's pod with default containers and permissions
   */
  async initializePodStructure(userId: string): Promise<boolean> {
    const podConfig = this.getUserPod(userId);
    if (!podConfig) {
      throw new Error(`No pod found for user ${userId}`);
    }

    try {
      // Create default containers in the user's pod
      await this.createPodContainers(podConfig);
      
      // Set up default permissions
      await this.configurePodPermissions(podConfig);
      
      // Create welcome resources
      await this.createWelcomeResources(podConfig);
      
      console.log(`✅ Initialized pod structure for user ${userId}`);
      return true;
    } catch (error) {
      console.error(`Failed to initialize pod structure for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Store user data in their personal pod
   */
  async storeUserData(userId: string, client: Client, consent: boolean = true): Promise<boolean> {
    const podConfig = this.getUserPod(userId);
    if (!podConfig) {
      throw new Error(`No pod configured for user ${userId}`);
    }

    try {
      // Temporarily set authentication context to user's pod
      const originalAuth = solidAuthService.getFetch();
      this.setUserAuthContext(podConfig);

      // Store client data in user's pod
      const result = await solidDataService.saveClientToPod(client, consent);
      
      // Restore original auth context
      solidAuthService.getFetch = () => originalAuth;
      
      if (result) {
        podConfig.lastAccessed = new Date();
        console.log(`💾 Stored user data in pod: ${podConfig.podUrl}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Failed to store user data in pod:`, error);
      return false;
    }
  }

  /**
   * Get all active user pods
   */
  getAllUserPods(): UserPodConfig[] {
    return Array.from(this.userPods.values()).filter(pod => pod.isActive);
  }

  /**
   * Deactivate a user's pod
   */
  async deactivateUserPod(userId: string): Promise<boolean> {
    const podConfig = this.getUserPod(userId);
    if (!podConfig) return false;

    podConfig.isActive = false;
    console.log(`🔒 Deactivated pod for user ${userId}`);
    return true;
  }

  /**
   * Generate a unique pod identifier for the user
   */
  private generatePodIdentifier(firstName: string, lastName: string, userId: string): string {
    const cleanName = `${firstName}${lastName}`.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const shortUserId = userId.substring(0, 8);
    const timestamp = Date.now().toString().slice(-6);
    
    return `${cleanName}_${shortUserId}_${timestamp}`;
  }

  /**
   * Select an optimal Solid provider (load balancing)
   */
  private selectProvider(): string {
    // Simple round-robin selection
    const index = this.userPods.size % this.defaultProviders.length;
    return this.defaultProviders[index];
  }

  /**
   * Create pod configuration (simulated)
   */
  private async createPodConfiguration(
    userId: string, 
    podIdentifier: string, 
    provider: string,
    request: PodProvisionRequest
  ): Promise<UserPodConfig> {
    
    // In production, this would call the Solid provider's API to create a new pod
    // For demo purposes, we simulate the creation
    const podUrl = `${provider}/${podIdentifier}/`;
    const webId = `${podUrl}profile/card#me`;
    
    // Generate simulated credentials
    const credentials = {
      identifier: `${podIdentifier}_${uuidv4().substring(0, 8)}`,
      secret: this.generateSecureToken()
    };

    const containers = {
      personal: `${podUrl}personal/`,
      health: `${podUrl}health/`,
      shelter: `${podUrl}shelter/`,
      wallet: `${podUrl}wallet/`,
      notifications: `${podUrl}notifications/`
    };

    return {
      userId,
      podUrl,
      webId,
      credentials,
      containers,
      createdAt: new Date(),
      isActive: true
    };
  }

  /**
   * Create default containers in the user's pod
   */
  private async createPodContainers(podConfig: UserPodConfig): Promise<void> {
    // In a real implementation, this would create actual containers in the pod
    console.log(`📁 Creating containers in pod ${podConfig.podUrl}:`);
    Object.entries(podConfig.containers).forEach(([name, url]) => {
      console.log(`  - ${name}: ${url}`);
    });
  }

  /**
   * Configure pod permissions and ACL
   */
  private async configurePodPermissions(podConfig: UserPodConfig): Promise<void> {
    // Set up Access Control Lists (ACL) for the pod
    console.log(`🛡️ Configuring permissions for pod ${podConfig.podUrl}`);
    
    // Default permissions:
    // - User: Full control
    // - Shelter app: Read/Write access to shelter container only
    // - Public: No access
  }

  /**
   * Create welcome resources and profile information
   */
  private async createWelcomeResources(podConfig: UserPodConfig): Promise<void> {
    console.log(`📝 Creating welcome resources in pod ${podConfig.podUrl}`);
    
    // Create profile document
    // Create privacy policy agreement
    // Create data usage consent document
  }

  /**
   * Set authentication context to user's pod
   */
  private setUserAuthContext(podConfig: UserPodConfig): void {
    // Override the auth service to use this user's credentials
    // In production, this would use proper authentication delegation
  }

  /**
   * Generate a secure token for pod credentials
   */
  private generateSecureToken(): string {
    const length = 128;
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }

  /**
   * Get pod statistics
   */
  getPodStatistics(): {
    totalPods: number;
    activePods: number;
    providerDistribution: Record<string, number>;
    averageAge: number;
  } {
    const pods = Array.from(this.userPods.values());
    const activePods = pods.filter(p => p.isActive);
    
    const providerDistribution: Record<string, number> = {};
    pods.forEach(pod => {
      try {
        const provider = new URL(pod.podUrl).origin;
        providerDistribution[provider] = (providerDistribution[provider] || 0) + 1;
      } catch (e) {
        // Invalid URL
      }
    });

    const averageAge = pods.length > 0 
      ? pods.reduce((sum, pod) => sum + (Date.now() - pod.createdAt.getTime()), 0) / pods.length / (1000 * 60 * 60 * 24)
      : 0;

    return {
      totalPods: pods.length,
      activePods: activePods.length,
      providerDistribution,
      averageAge: Math.round(averageAge * 100) / 100 // Round to 2 decimal places
    };
  }
}

export const userPodService = new UserPodService();