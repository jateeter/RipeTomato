/**
 * Unit Tests for Agent Manager Service
 * 
 * Tests agent lifecycle management, spawning coordination,
 * notification routing, and system monitoring functionality.
 */

import { AgentManagerService, AgentRegistry } from '../agentManager';
import { ClientWelcomeAgent } from '../clientWelcomeAgent';
import { PersonRegistrationData } from '../../components/PersonRegistrationModal';
import { unifiedDataOwnershipService } from '../unifiedDataOwnershipService';

// Mock the dependencies
jest.mock('../clientWelcomeAgent');
jest.mock('../unifiedDataOwnershipService');

const mockClientWelcomeAgent = ClientWelcomeAgent as jest.MockedClass<typeof ClientWelcomeAgent>;
const mockUnifiedDataOwnership = unifiedDataOwnershipService as jest.Mocked<typeof unifiedDataOwnershipService>;

describe('AgentManagerService', () => {
  let agentManager: AgentManagerService;

  const mockClientData: PersonRegistrationData = {
    id: 'client_test_456',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    phone: '+1-555-0456',
    dateOfBirth: '1985-05-15',
    address: {
      street: '456 Oak Ave',
      city: 'Boise',
      state: 'ID',
      zipCode: '83704'
    },
    emergencyContact: {
      name: 'John Smith',
      relationship: 'Spouse',
      phone: '+1-555-0457'
    },
    role: 'client',
    preferredBedType: 'accessible',
    consentGiven: true,
    consentDate: new Date().toISOString(),
    privacyAgreement: true,
    dataRetentionPeriod: 2555,
    registrationDate: new Date().toISOString()
  };

  const mockAgentInstance = {
    getAgentStatus: jest.fn().mockReturnValue({
      agentId: 'agent_client_test_456_123',
      status: 'active',
      workflowProgress: 75,
      lastActivity: new Date(),
      notificationCount: 3,
      servicesCount: 2
    }),
    getNotifications: jest.fn().mockReturnValue([]),
    markNotificationRead: jest.fn().mockResolvedValue(undefined),
    terminate: jest.fn().mockResolvedValue(undefined)
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a fresh agent manager instance for each test
    agentManager = new AgentManagerService();
    
    // Setup default mock implementations
    mockUnifiedDataOwnership.storeData.mockResolvedValue(undefined);
    mockUnifiedDataOwnership.getData.mockResolvedValue(null);
    
    mockClientWelcomeAgent.spawnAgent.mockResolvedValue(mockAgentInstance);

    // Mock console methods to reduce test noise
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Agent Spawning', () => {
    it('should successfully spawn an agent for a new client', async () => {
      const agentId = await agentManager.spawnAgentForClient(mockClientData);

      expect(agentId).toMatch(/^agent_client_test_456_\d+$/);
      expect(mockClientWelcomeAgent.spawnAgent).toHaveBeenCalledWith(mockClientData);
      expect(mockUnifiedDataOwnership.storeData).toHaveBeenCalledWith(
        'system',
        'agent_registry',
        expect.any(Array)
      );
    });

    it('should not spawn duplicate agents for the same client', async () => {
      // Spawn first agent
      const firstAgentId = await agentManager.spawnAgentForClient(mockClientData);
      
      // Attempt to spawn second agent for same client
      const secondAgentId = await agentManager.spawnAgentForClient(mockClientData);

      expect(firstAgentId).toBe(secondAgentId);
      expect(mockClientWelcomeAgent.spawnAgent).toHaveBeenCalledTimes(1);
    });

    it('should handle agent spawn failures gracefully', async () => {
      mockClientWelcomeAgent.spawnAgent.mockRejectedValue(new Error('Agent spawn failed'));

      await expect(agentManager.spawnAgentForClient(mockClientData)).rejects.toThrow('Failed to spawn agent: Agent spawn failed');
    });

    it('should require client ID for agent spawning', async () => {
      const invalidClientData = { ...mockClientData, id: undefined };

      await expect(agentManager.spawnAgentForClient(invalidClientData as any)).rejects.toThrow('Client ID is required to spawn an agent');
    });

    it('should notify staff when agent is spawned', async () => {
      await agentManager.spawnAgentForClient(mockClientData);

      const storeDataCalls = mockUnifiedDataOwnership.storeData.mock.calls;
      const staffNotificationCall = storeDataCalls.find(call => call[1] === 'staff_notifications');

      expect(staffNotificationCall).toBeDefined();
      expect(staffNotificationCall![2]).toMatchObject({
        type: 'agent_spawned',
        clientId: 'client_test_456',
        clientName: 'Jane Smith'
      });
    });
  });

  describe('Agent Queuing', () => {
    it('should queue agent spawning requests', async () => {
      const client1 = { ...mockClientData, id: 'client_1' };
      const client2 = { ...mockClientData, id: 'client_2' };

      await agentManager.queueAgentSpawn(client1, 1);
      await agentManager.queueAgentSpawn(client2, 2);

      // Wait for queue processing
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockClientWelcomeAgent.spawnAgent).toHaveBeenCalledTimes(2);
    });

    it('should process higher priority spawns first', async () => {
      const client1 = { ...mockClientData, id: 'client_low_priority' };
      const client2 = { ...mockClientData, id: 'client_high_priority' };

      await agentManager.queueAgentSpawn(client1, 1); // Low priority
      await agentManager.queueAgentSpawn(client2, 5); // High priority

      // Wait for queue processing
      await new Promise(resolve => setTimeout(resolve, 100));

      const spawnCalls = mockClientWelcomeAgent.spawnAgent.mock.calls;
      expect(spawnCalls[0][0].id).toBe('client_high_priority');
      expect(spawnCalls[1][0].id).toBe('client_low_priority');
    });
  });

  describe('Agent Retrieval', () => {
    beforeEach(async () => {
      await agentManager.spawnAgentForClient(mockClientData);
    });

    it('should retrieve agent by client ID', () => {
      const agent = agentManager.getAgentByClientId('client_test_456');

      expect(agent).toBeDefined();
      expect(agent!.clientId).toBe('client_test_456');
      expect(agent!.status).toBe('active');
    });

    it('should retrieve agent by agent ID', () => {
      const agents = agentManager.getAllActiveAgents();
      expect(agents).toHaveLength(1);

      const agentId = agents[0].agentId;
      const agent = agentManager.getAgentById(agentId);

      expect(agent).toBeDefined();
      expect(agent!.agentId).toBe(agentId);
    });

    it('should return null for non-existent agent', () => {
      const agent = agentManager.getAgentByClientId('non_existent_client');
      expect(agent).toBeNull();
    });

    it('should get all active agents', () => {
      const activeAgents = agentManager.getAllActiveAgents();

      expect(activeAgents).toHaveLength(1);
      expect(activeAgents[0].status).toBe('active');
      expect(activeAgents[0].clientId).toBe('client_test_456');
    });
  });

  describe('Notification Management', () => {
    beforeEach(async () => {
      await agentManager.spawnAgentForClient(mockClientData);
    });

    it('should get client notifications', async () => {
      const notifications = await agentManager.getClientNotifications('client_test_456');

      expect(mockAgentInstance.getNotifications).toHaveBeenCalledWith(false);
      expect(Array.isArray(notifications)).toBe(true);
    });

    it('should get only unread notifications when requested', async () => {
      await agentManager.getClientNotifications('client_test_456', true);

      expect(mockAgentInstance.getNotifications).toHaveBeenCalledWith(true);
    });

    it('should mark notification as read', async () => {
      await agentManager.markNotificationRead('client_test_456', 'notification_123');

      expect(mockAgentInstance.markNotificationRead).toHaveBeenCalledWith('notification_123');
    });

    it('should handle notifications for non-existent agent', async () => {
      const notifications = await agentManager.getClientNotifications('non_existent_client');
      expect(notifications).toEqual([]);
    });

    it('should send workflow notifications', async () => {
      const workflowNotification = {
        type: 'bed_assignment' as const,
        status: 'completed',
        metadata: { bedNumber: 'A15' }
      };

      await agentManager.sendWorkflowNotification('client_test_456', workflowNotification);

      expect(mockUnifiedDataOwnership.storeData).toHaveBeenCalledWith(
        'client_test_456',
        'workflow_notifications',
        expect.objectContaining({
          type: 'bed_assignment',
          status: 'completed',
          processed: false
        })
      );
    });
  });

  describe('Agent Lifecycle Management', () => {
    let agentId: string;

    beforeEach(async () => {
      agentId = await agentManager.spawnAgentForClient(mockClientData);
    });

    it('should suspend an agent', async () => {
      await agentManager.suspendAgent(agentId, 'Maintenance required');

      const agent = agentManager.getAgentById(agentId);
      expect(agent!.status).toBe('suspended');
      expect(mockUnifiedDataOwnership.storeData).toHaveBeenCalledWith(
        'system',
        'agent_registry',
        expect.any(Array)
      );
    });

    it('should resume a suspended agent', async () => {
      await agentManager.suspendAgent(agentId, 'Test suspension');
      await agentManager.resumeAgent(agentId);

      const agent = agentManager.getAgentById(agentId);
      expect(agent!.status).toBe('active');
    });

    it('should not resume non-suspended agent', async () => {
      const initialLastActivity = agentManager.getAgentById(agentId)!.lastActivity;
      
      await agentManager.resumeAgent(agentId); // Try to resume active agent

      const agent = agentManager.getAgentById(agentId);
      expect(agent!.status).toBe('active');
      expect(agent!.lastActivity).toEqual(initialLastActivity);
    });

    it('should terminate an agent', async () => {
      await agentManager.terminateAgent(agentId, 'Client left program');

      const agent = agentManager.getAgentById(agentId);
      expect(agent!.status).toBe('terminated');
      expect(mockAgentInstance.terminate).toHaveBeenCalled();
    });
  });

  describe('Agent Status and Monitoring', () => {
    beforeEach(async () => {
      await agentManager.spawnAgentForClient(mockClientData);
    });

    it('should get agent status including instance data', () => {
      const agents = agentManager.getAllActiveAgents();
      const agentId = agents[0].agentId;

      const status = agentManager.getAgentStatus(agentId);

      expect(status).toMatchObject({
        agentId,
        clientId: 'client_test_456',
        status: 'active',
        workflowProgress: 75,
        notificationCount: 3,
        servicesCount: 2
      });
    });

    it('should return null status for non-existent agent', () => {
      const status = agentManager.getAgentStatus('non_existent_agent');
      expect(status).toBeNull();
    });

    it('should get system statistics', () => {
      const stats = agentManager.getSystemStatistics();

      expect(stats).toMatchObject({
        totalAgents: 1,
        activeAgents: 1,
        suspendedAgents: 0,
        terminatedAgents: 0,
        averageWorkflowProgress: 75,
        totalNotifications: 3
      });
    });

    it('should calculate correct statistics with multiple agents', async () => {
      // Add a second agent
      const secondClient = { ...mockClientData, id: 'client_test_789' };
      await agentManager.spawnAgentForClient(secondClient);

      const stats = agentManager.getSystemStatistics();

      expect(stats.totalAgents).toBe(2);
      expect(stats.activeAgents).toBe(2);
      expect(stats.averageWorkflowProgress).toBe(75); // Both agents return 75%
    });
  });

  describe('Health Checks', () => {
    beforeEach(async () => {
      await agentManager.spawnAgentForClient(mockClientData);
    });

    it('should perform health check on active agents', async () => {
      const healthCheck = await agentManager.performHealthCheck();

      expect(healthCheck).toMatchObject({
        healthy: 1,
        unhealthy: 0,
        issues: []
      });
    });

    it('should detect inactive agents as unhealthy', async () => {
      // Modify agent's last activity to be over an hour ago
      const agents = agentManager.getAllActiveAgents();
      const agent = agents[0];
      agent.lastActivity = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago

      const healthCheck = await agentManager.performHealthCheck();

      expect(healthCheck.healthy).toBe(0);
      expect(healthCheck.unhealthy).toBe(1);
      expect(healthCheck.issues).toHaveLength(1);
      expect(healthCheck.issues[0].issue).toContain('No activity for over 1 hour');
    });

    it('should detect high error count as unhealthy', async () => {
      const agents = agentManager.getAllActiveAgents();
      const agent = agents[0];
      agent.errorCount = 10; // High error count

      const healthCheck = await agentManager.performHealthCheck();

      expect(healthCheck.unhealthy).toBe(1);
      expect(healthCheck.issues[0].issue).toContain('High error count: 10');
    });
  });

  describe('Initialization', () => {
    it('should initialize with empty registry when no saved data', async () => {
      const freshManager = new AgentManagerService();
      await freshManager.initialize();

      const activeAgents = freshManager.getAllActiveAgents();
      expect(activeAgents).toHaveLength(0);
    });

    it('should restore agents from saved registry', async () => {
      const savedRegistry = [
        {
          agentId: 'agent_saved_123',
          clientId: 'client_saved_123',
          status: 'active',
          spawnedAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          errorCount: 0
        }
      ];

      mockUnifiedDataOwnership.getData.mockResolvedValue(savedRegistry);

      const freshManager = new AgentManagerService();
      await freshManager.initialize();

      const activeAgents = freshManager.getAllActiveAgents();
      expect(activeAgents).toHaveLength(1);
      expect(activeAgents[0].agentId).toBe('agent_saved_123');
    });

    it('should handle initialization errors gracefully', async () => {
      mockUnifiedDataOwnership.getData.mockRejectedValue(new Error('Storage unavailable'));

      const freshManager = new AgentManagerService();
      
      await expect(freshManager.initialize()).resolves.not.toThrow();
      expect(freshManager.getAllActiveAgents()).toHaveLength(0);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle storage failures when saving registry', async () => {
      mockUnifiedDataOwnership.storeData.mockRejectedValue(new Error('Storage failed'));

      // Should not throw even if storage fails
      await expect(agentManager.spawnAgentForClient(mockClientData)).resolves.toMatch(/^agent_/);
    });

    it('should handle workflow notification storage failures', async () => {
      await agentManager.spawnAgentForClient(mockClientData);
      
      mockUnifiedDataOwnership.storeData.mockRejectedValue(new Error('Storage failed'));

      const workflowNotification = {
        type: 'check_in' as const,
        status: 'completed',
        metadata: {}
      };

      // Should not throw even if notification storage fails
      await expect(agentManager.sendWorkflowNotification('client_test_456', workflowNotification)).resolves.not.toThrow();
    });
  });
});