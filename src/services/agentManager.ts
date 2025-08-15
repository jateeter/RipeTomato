/**
 * Agent Manager Service
 * 
 * Manages the lifecycle of client welcome agents, coordinates spawning,
 * monitoring, and communication between agents and the application.
 * 
 * @license MIT
 */

import { PersonRegistrationData } from '../components/PersonRegistrationModal';
import { ClientWelcomeAgent, AgentConfiguration, AgentNotification } from './clientWelcomeAgent';
import { unifiedDataOwnershipService } from './unifiedDataOwnershipService';

export interface AgentRegistry {
  agentId: string;
  clientId: string;
  agentInstance?: ClientWelcomeAgent;
  status: 'spawning' | 'active' | 'suspended' | 'terminated';
  spawnedAt: Date;
  lastActivity: Date;
  errorCount: number;
}

class AgentManagerService {
  private activeAgents: Map<string, AgentRegistry> = new Map();
  private spawningQueue: Array<{ clientData: PersonRegistrationData; priority: number }> = [];
  private isProcessingQueue = false;

  /**
   * Spawn a new agent for a client registration
   */
  async spawnAgentForClient(clientData: PersonRegistrationData): Promise<string> {
    console.log(`🚀 Agent Manager: Spawning agent for client ${clientData.firstName} ${clientData.lastName}`);

    if (!clientData.id) {
      throw new Error('Client ID is required to spawn an agent');
    }

    // Check if agent already exists for this client
    const existingAgent = this.findAgentByClientId(clientData.id);
    if (existingAgent) {
      console.log(`⚠️ Agent already exists for client ${clientData.id}: ${existingAgent.agentId}`);
      return existingAgent.agentId;
    }

    try {
      // Create agent registry entry
      const agentId = `agent_${clientData.id}_${Date.now()}`;
      const registry: AgentRegistry = {
        agentId,
        clientId: clientData.id,
        status: 'spawning',
        spawnedAt: new Date(),
        lastActivity: new Date(),
        errorCount: 0
      };

      this.activeAgents.set(agentId, registry);

      // Spawn the actual agent
      const agent = await ClientWelcomeAgent.spawnAgent(clientData);
      registry.agentInstance = agent;
      registry.status = 'active';

      console.log(`✅ Agent Manager: Successfully spawned agent ${agentId}`);

      // Store agent registry in global system
      await this.saveAgentRegistry();

      // Trigger notification to staff
      await this.notifyStaffOfAgentSpawn(clientData, agentId);

      return agentId;

    } catch (error) {
      console.error(`❌ Agent Manager: Failed to spawn agent for client ${clientData.id}:`, error);
      
      // Update registry with error
      const registry = this.activeAgents.get(`agent_${clientData.id}_${Date.now()}`);
      if (registry) {
        registry.status = 'terminated';
        registry.errorCount++;
      }

      throw new Error(`Failed to spawn agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Queue agent spawning for batch processing
   */
  async queueAgentSpawn(clientData: PersonRegistrationData, priority: number = 1): Promise<void> {
    this.spawningQueue.push({ clientData, priority });
    this.spawningQueue.sort((a, b) => b.priority - a.priority); // Higher priority first

    if (!this.isProcessingQueue) {
      await this.processSpawningQueue();
    }
  }

  /**
   * Process the agent spawning queue
   */
  private async processSpawningQueue(): Promise<void> {
    if (this.isProcessingQueue || this.spawningQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    console.log(`🔄 Agent Manager: Processing spawning queue (${this.spawningQueue.length} items)`);

    try {
      while (this.spawningQueue.length > 0) {
        const { clientData } = this.spawningQueue.shift()!;
        
        try {
          await this.spawnAgentForClient(clientData);
          // Small delay between spawns to avoid overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`❌ Queue processing error for client ${clientData.id}:`, error);
        }
      }
    } finally {
      this.isProcessingQueue = false;
    }

    console.log(`✅ Agent Manager: Spawning queue processing completed`);
  }

  /**
   * Get agent by client ID
   */
  getAgentByClientId(clientId: string): AgentRegistry | null {
    return this.findAgentByClientId(clientId);
  }

  /**
   * Get agent by agent ID
   */
  getAgentById(agentId: string): AgentRegistry | null {
    return this.activeAgents.get(agentId) || null;
  }

  /**
   * Get all active agents
   */
  getAllActiveAgents(): AgentRegistry[] {
    return Array.from(this.activeAgents.values()).filter(a => a.status === 'active');
  }

  /**
   * Get agent notifications for a client
   */
  async getClientNotifications(clientId: string, unreadOnly: boolean = false): Promise<AgentNotification[]> {
    const agent = this.findAgentByClientId(clientId);
    if (!agent || !agent.agentInstance) {
      return [];
    }

    return agent.agentInstance.getNotifications(unreadOnly);
  }

  /**
   * Mark notification as read
   */
  async markNotificationRead(clientId: string, notificationId: string): Promise<void> {
    const agent = this.findAgentByClientId(clientId);
    if (agent && agent.agentInstance) {
      await agent.agentInstance.markNotificationRead(notificationId);
    }
  }

  /**
   * Send workflow notification to agent
   */
  async sendWorkflowNotification(clientId: string, notification: {
    type: 'bed_assignment' | 'meal_setup' | 'check_in' | 'case_management';
    status: string;
    metadata: Record<string, any>;
  }): Promise<void> {
    console.log(`📩 Agent Manager: Sending workflow notification to client ${clientId}`);

    try {
      // Store notification in client's data store for agent to pick up
      const workflowNotification = {
        ...notification,
        timestamp: new Date(),
        processed: false,
        notificationId: `workflow_${clientId}_${Date.now()}`
      };

      await unifiedDataOwnershipService.storeData(
        clientId,
        'workflow_notifications',
        workflowNotification
      );

      // Update agent last activity
      const agent = this.findAgentByClientId(clientId);
      if (agent) {
        agent.lastActivity = new Date();
      }

      console.log(`✅ Workflow notification sent to client ${clientId}`);

    } catch (error) {
      console.error(`❌ Failed to send workflow notification:`, error);
    }
  }

  /**
   * Suspend an agent temporarily
   */
  async suspendAgent(agentId: string, reason: string): Promise<void> {
    const registry = this.activeAgents.get(agentId);
    if (registry) {
      registry.status = 'suspended';
      console.log(`⏸️ Agent ${agentId} suspended: ${reason}`);
      await this.saveAgentRegistry();
    }
  }

  /**
   * Resume a suspended agent
   */
  async resumeAgent(agentId: string): Promise<void> {
    const registry = this.activeAgents.get(agentId);
    if (registry && registry.status === 'suspended') {
      registry.status = 'active';
      registry.lastActivity = new Date();
      console.log(`▶️ Agent ${agentId} resumed`);
      await this.saveAgentRegistry();
    }
  }

  /**
   * Terminate an agent
   */
  async terminateAgent(agentId: string, reason: string): Promise<void> {
    const registry = this.activeAgents.get(agentId);
    if (registry) {
      if (registry.agentInstance) {
        await registry.agentInstance.terminate();
      }
      registry.status = 'terminated';
      console.log(`🛑 Agent ${agentId} terminated: ${reason}`);
      
      // Remove from active agents after a delay (for logging purposes)
      setTimeout(() => {
        this.activeAgents.delete(agentId);
      }, 5 * 60 * 1000); // 5 minutes

      await this.saveAgentRegistry();
    }
  }

  /**
   * Get agent status for monitoring dashboard
   */
  getAgentStatus(agentId: string): any {
    const registry = this.activeAgents.get(agentId);
    if (!registry) {
      return null;
    }

    const baseStatus = {
      agentId: registry.agentId,
      clientId: registry.clientId,
      status: registry.status,
      spawnedAt: registry.spawnedAt,
      lastActivity: registry.lastActivity,
      errorCount: registry.errorCount
    };

    if (registry.agentInstance) {
      return {
        ...baseStatus,
        ...registry.agentInstance.getAgentStatus()
      };
    }

    return baseStatus;
  }

  /**
   * Get system-wide agent statistics
   */
  getSystemStatistics(): {
    totalAgents: number;
    activeAgents: number;
    suspendedAgents: number;
    terminatedAgents: number;
    averageWorkflowProgress: number;
    totalNotifications: number;
  } {
    const agents = Array.from(this.activeAgents.values());
    
    const activeCount = agents.filter(a => a.status === 'active').length;
    const suspendedCount = agents.filter(a => a.status === 'suspended').length;
    const terminatedCount = agents.filter(a => a.status === 'terminated').length;

    let totalProgress = 0;
    let totalNotifications = 0;
    let agentsWithProgress = 0;

    agents.forEach(agent => {
      if (agent.agentInstance) {
        const status = agent.agentInstance.getAgentStatus();
        totalProgress += status.workflowProgress;
        totalNotifications += status.notificationCount;
        agentsWithProgress++;
      }
    });

    return {
      totalAgents: agents.length,
      activeAgents: activeCount,
      suspendedAgents: suspendedCount,
      terminatedAgents: terminatedCount,
      averageWorkflowProgress: agentsWithProgress > 0 ? totalProgress / agentsWithProgress : 0,
      totalNotifications
    };
  }

  /**
   * Health check for all agents
   */
  async performHealthCheck(): Promise<{
    healthy: number;
    unhealthy: number;
    issues: Array<{ agentId: string; issue: string }>;
  }> {
    const agents = Array.from(this.activeAgents.values());
    const issues: Array<{ agentId: string; issue: string }> = [];
    let healthy = 0;
    let unhealthy = 0;

    for (const agent of agents) {
      try {
        // Check if agent has been active recently (within last hour)
        const lastActivity = new Date(agent.lastActivity);
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        if (agent.status === 'active' && lastActivity < oneHourAgo) {
          issues.push({
            agentId: agent.agentId,
            issue: 'No activity for over 1 hour'
          });
          unhealthy++;
        } else if (agent.errorCount > 5) {
          issues.push({
            agentId: agent.agentId,
            issue: `High error count: ${agent.errorCount}`
          });
          unhealthy++;
        } else {
          healthy++;
        }

      } catch (error) {
        issues.push({
          agentId: agent.agentId,
          issue: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
        unhealthy++;
      }
    }

    return { healthy, unhealthy, issues };
  }

  /**
   * Find agent by client ID
   */
  private findAgentByClientId(clientId: string): AgentRegistry | null {
    for (const [agentId, registry] of this.activeAgents) {
      if (registry.clientId === clientId) {
        return registry;
      }
    }
    return null;
  }

  /**
   * Save agent registry to persistent storage
   */
  private async saveAgentRegistry(): Promise<void> {
    try {
      const registryData = Array.from(this.activeAgents.entries()).map(([agentId, registry]) => ({
        agentId,
        clientId: registry.clientId,
        status: registry.status,
        spawnedAt: registry.spawnedAt,
        lastActivity: registry.lastActivity,
        errorCount: registry.errorCount
      }));

      await unifiedDataOwnershipService.storeData(
        'system',
        'agent_registry',
        registryData
      );

    } catch (error) {
      console.error(`❌ Failed to save agent registry:`, error);
    }
  }

  /**
   * Notify staff of agent spawn
   */
  private async notifyStaffOfAgentSpawn(clientData: PersonRegistrationData, agentId: string): Promise<void> {
    const staffNotification = {
      type: 'agent_spawned',
      clientId: clientData.id,
      clientName: `${clientData.firstName} ${clientData.lastName}`,
      agentId,
      timestamp: new Date(),
      message: `New client welcome agent spawned for ${clientData.firstName} ${clientData.lastName}. Agent ID: ${agentId}`
    };

    await unifiedDataOwnershipService.storeData(
      'system',
      'staff_notifications',
      staffNotification
    );
  }

  /**
   * Initialize the agent manager service
   */
  async initialize(): Promise<void> {
    console.log('🔄 Initializing Agent Manager Service');

    try {
      // Load existing agent registry
      const savedRegistry = await unifiedDataOwnershipService.getData('system', 'agent_registry');
      
      if (savedRegistry && Array.isArray(savedRegistry)) {
        console.log(`📂 Loading ${savedRegistry.length} agents from registry`);
        
        for (const registryData of savedRegistry) {
          if (registryData.status === 'active') {
            // Restore active agents (simplified - in production, would fully restore state)
            const registry: AgentRegistry = {
              agentId: registryData.agentId,
              clientId: registryData.clientId,
              status: 'active', // Could be 'suspended' for safety
              spawnedAt: new Date(registryData.spawnedAt),
              lastActivity: new Date(registryData.lastActivity),
              errorCount: registryData.errorCount || 0
            };
            
            this.activeAgents.set(registryData.agentId, registry);
          }
        }
      }

      console.log(`✅ Agent Manager initialized with ${this.activeAgents.size} agents`);

    } catch (error) {
      console.error('❌ Failed to initialize Agent Manager:', error);
    }
  }
}

// Create singleton instance
export const agentManagerService = new AgentManagerService();
export { AgentManagerService };
export default agentManagerService;