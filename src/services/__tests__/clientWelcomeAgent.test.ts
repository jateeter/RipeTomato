/**
 * Unit Tests for Client Welcome Agent
 * 
 * Tests agent instantiation, welcome sequence, notification handling,
 * and workflow management functionality.
 */

import { ClientWelcomeAgent, AgentConfiguration, WorkflowStep, AgentNotification } from '../clientWelcomeAgent';
import { PersonRegistrationData } from '../../components/PersonRegistrationModal';
import { unifiedDataOwnershipService } from '../unifiedDataOwnershipService';
import { solidPodService } from '../solidPodService';
import { googleCalendarService } from '../googleCalendarService';

// Mock the dependencies
jest.mock('../unifiedDataOwnershipService');
jest.mock('../solidPodService');
jest.mock('../googleCalendarService');

const mockUnifiedDataOwnership = unifiedDataOwnershipService as jest.Mocked<typeof unifiedDataOwnershipService>;
const mockSolidPodService = solidPodService as jest.Mocked<typeof solidPodService>;
const mockGoogleCalendarService = googleCalendarService as jest.Mocked<typeof googleCalendarService>;

describe('ClientWelcomeAgent', () => {
  const mockClientData: PersonRegistrationData = {
    id: 'client_test_123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1-555-0123',
    dateOfBirth: '1990-01-01',
    address: {
      street: '123 Main St',
      city: 'Boise',
      state: 'ID',
      zipCode: '83702'
    },
    emergencyContact: {
      name: 'Jane Doe',
      relationship: 'Spouse',
      phone: '+1-555-0124'
    },
    role: 'client',
    preferredBedType: 'standard',
    consentGiven: true,
    consentDate: new Date().toISOString(),
    privacyAgreement: true,
    dataRetentionPeriod: 2555,
    registrationDate: new Date().toISOString()
  };

  const mockAgentConfig: AgentConfiguration = {
    agentId: 'agent_client_test_123_1234567890',
    clientId: 'client_test_123',
    podUrl: 'https://test-pod.solidcommunity.net/',
    welcomeCompleted: false,
    servicesAllocated: false,
    notificationSubscriptions: ['workflow_updates', 'service_changes'],
    workflowSteps: [],
    createdAt: new Date(),
    lastActivity: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockSolidPodService.getClientPodUrl.mockResolvedValue('https://test-pod.solidcommunity.net/');
    mockUnifiedDataOwnership.storeData.mockResolvedValue(undefined);
    mockUnifiedDataOwnership.getData.mockResolvedValue(null);
    mockGoogleCalendarService.createEvent.mockResolvedValue({
      id: 'test-event-id',
      summary: 'Test Event'
    });

    // Mock console methods to reduce test noise
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Agent Spawning', () => {
    it('should successfully spawn a new agent for a client', async () => {
      const agent = await ClientWelcomeAgent.spawnAgent(mockClientData);

      expect(agent).toBeInstanceOf(ClientWelcomeAgent);
      expect(mockSolidPodService.getClientPodUrl).toHaveBeenCalledWith('client_test_123');
      expect(mockUnifiedDataOwnership.storeData).toHaveBeenCalledWith(
        'client_test_123',
        'agent_configuration',
        expect.objectContaining({
          clientId: 'client_test_123',
          welcomeCompleted: false,
          servicesAllocated: false
        })
      );
    });

    it('should store agent configuration with correct workflow steps', async () => {
      await ClientWelcomeAgent.spawnAgent(mockClientData);

      const storeDataCalls = mockUnifiedDataOwnership.storeData.mock.calls;
      const agentConfigCall = storeDataCalls.find(call => call[1] === 'agent_configuration');
      
      expect(agentConfigCall).toBeDefined();
      const config = agentConfigCall![2] as AgentConfiguration;
      
      expect(config.workflowSteps).toHaveLength(2);
      expect(config.workflowSteps[0].stepType).toBe('welcome');
      expect(config.workflowSteps[1].stepType).toBe('service_allocation');
    });

    it('should handle agent spawn errors gracefully', async () => {
      mockSolidPodService.getClientPodUrl.mockRejectedValue(new Error('Pod URL fetch failed'));

      await expect(ClientWelcomeAgent.spawnAgent(mockClientData)).rejects.toThrow('Pod URL fetch failed');
    });
  });

  describe('Welcome Sequence', () => {
    let agent: ClientWelcomeAgent;

    beforeEach(async () => {
      agent = await ClientWelcomeAgent.spawnAgent(mockClientData);
    });

    it('should send a welcome notification', async () => {
      const storeDataCalls = mockUnifiedDataOwnership.storeData.mock.calls;
      const notificationCalls = storeDataCalls.filter(call => call[1] === 'agent_notifications');
      
      expect(notificationCalls.length).toBeGreaterThan(0);
      
      const notification = notificationCalls[0][2] as AgentNotification;
      expect(notification.type).toBe('welcome');
      expect(notification.title).toContain('Welcome to Idaho Events Services, John!');
      expect(notification.message).toContain('Good');
      expect(notification.priority).toBe('high');
    });

    it('should create initial service allocations', async () => {
      const storeDataCalls = mockUnifiedDataOwnership.storeData.mock.calls;
      const allocationCalls = storeDataCalls.filter(call => call[1] === 'service_allocations');
      
      expect(allocationCalls.length).toBeGreaterThan(0);
      
      const allocations = allocationCalls[0][2];
      expect(Array.isArray(allocations)).toBe(true);
      expect(allocations).toHaveLength(3);
      
      const serviceTypes = allocations.map((a: any) => a.serviceType);
      expect(serviceTypes).toContain('shelter');
      expect(serviceTypes).toContain('meals');
      expect(serviceTypes).toContain('case_management');
    });

    it('should create calendar events for the client', async () => {
      expect(mockGoogleCalendarService.createEvent).toHaveBeenCalledTimes(2);
      
      const createEventCalls = mockGoogleCalendarService.createEvent.mock.calls;
      const eventSummaries = createEventCalls.map(call => call[0].summary);
      
      expect(eventSummaries).toContain('Daily Check-in - Shelter Services');
      expect(eventSummaries).toContain('Initial Case Management Meeting');
    });

    it('should store reminder schedule', async () => {
      const storeDataCalls = mockUnifiedDataOwnership.storeData.mock.calls;
      const reminderCalls = storeDataCalls.filter(call => call[1] === 'agent_reminders');
      
      expect(reminderCalls.length).toBeGreaterThan(0);
      
      const reminders = reminderCalls[0][2];
      expect(Array.isArray(reminders)).toBe(true);
      expect(reminders).toHaveLength(3);
      
      const reminderTypes = reminders.map((r: any) => r.type);
      expect(reminderTypes).toContain('check_in_reminder');
      expect(reminderTypes).toContain('case_management_reminder');
      expect(reminderTypes).toContain('meal_reminder');
    });
  });

  describe('Notification Management', () => {
    let agent: ClientWelcomeAgent;

    beforeEach(async () => {
      agent = await ClientWelcomeAgent.spawnAgent(mockClientData);
    });

    it('should get agent status correctly', () => {
      const status = agent.getAgentStatus();
      
      expect(status).toHaveProperty('agentId');
      expect(status).toHaveProperty('status');
      expect(status).toHaveProperty('workflowProgress');
      expect(status).toHaveProperty('lastActivity');
      expect(status).toHaveProperty('notificationCount');
      expect(status).toHaveProperty('servicesCount');
      
      expect(typeof status.workflowProgress).toBe('number');
      expect(status.workflowProgress).toBeGreaterThanOrEqual(0);
      expect(status.workflowProgress).toBeLessThanOrEqual(100);
    });

    it('should return all notifications when requested', () => {
      const allNotifications = agent.getNotifications(false);
      expect(Array.isArray(allNotifications)).toBe(true);
    });

    it('should filter unread notifications when requested', () => {
      const unreadNotifications = agent.getNotifications(true);
      expect(Array.isArray(unreadNotifications)).toBe(true);
      
      // All notifications should be unread initially
      const allNotifications = agent.getNotifications(false);
      expect(unreadNotifications.length).toBe(allNotifications.length);
    });

    it('should mark notifications as read', async () => {
      const notifications = agent.getNotifications(false);
      
      if (notifications.length > 0) {
        const notificationId = notifications[0].notificationId;
        await agent.markNotificationRead(notificationId);
        
        expect(mockUnifiedDataOwnership.storeData).toHaveBeenCalledWith(
          'client_test_123',
          'agent_notifications',
          expect.objectContaining({
            notificationId,
            read: true
          })
        );
      }
    });
  });

  describe('Workflow Step Processing', () => {
    let agent: ClientWelcomeAgent;

    beforeEach(async () => {
      agent = await ClientWelcomeAgent.spawnAgent(mockClientData);
    });

    it('should handle bed assignment notifications', async () => {
      const mockNotification = {
        type: 'bed_assignment',
        status: 'completed',
        metadata: { bedNumber: 'B12' },
        stepId: 'bed_test_123',
        processed: false,
        timestamp: new Date()
      };

      mockUnifiedDataOwnership.getData.mockResolvedValue([mockNotification]);

      // Simulate notification check (normally done by timer)
      await agent['checkForWorkflowNotifications']();

      // Verify notification was processed
      expect(mockUnifiedDataOwnership.storeData).toHaveBeenCalledWith(
        'client_test_123',
        'agent_notifications',
        expect.objectContaining({
          type: 'service_update',
          title: '🛏️ Bed Assignment Confirmed'
        })
      );
    });

    it('should handle meal setup notifications', async () => {
      const mockNotification = {
        type: 'meal_setup',
        status: 'completed',
        metadata: { dietaryNotes: 'Vegetarian' },
        stepId: 'meal_test_123',
        processed: false,
        timestamp: new Date()
      };

      mockUnifiedDataOwnership.getData.mockResolvedValue([mockNotification]);

      await agent['checkForWorkflowNotifications']();

      expect(mockUnifiedDataOwnership.storeData).toHaveBeenCalledWith(
        'client_test_123',
        'agent_notifications',
        expect.objectContaining({
          type: 'service_update',
          title: '🍽️ Meal Services Ready'
        })
      );
    });

    it('should handle check-in notifications', async () => {
      const mockNotification = {
        type: 'check_in',
        status: 'completed',
        metadata: { notes: 'All good today' },
        stepId: 'checkin_test_123',
        processed: false,
        timestamp: new Date()
      };

      mockUnifiedDataOwnership.getData.mockResolvedValue([mockNotification]);

      await agent['checkForWorkflowNotifications']();

      expect(mockUnifiedDataOwnership.storeData).toHaveBeenCalledWith(
        'client_test_123',
        'agent_notifications',
        expect.objectContaining({
          type: 'workflow_progress',
          title: '✅ Check-in Completed'
        })
      );
    });

    it('should handle case management notifications', async () => {
      const mockNotification = {
        type: 'case_management',
        status: 'completed',
        metadata: { servicePlan: 'Housing assistance approved' },
        stepId: 'case_test_123',
        processed: false,
        timestamp: new Date()
      };

      mockUnifiedDataOwnership.getData.mockResolvedValue([mockNotification]);

      await agent['checkForWorkflowNotifications']();

      expect(mockUnifiedDataOwnership.storeData).toHaveBeenCalledWith(
        'client_test_123',
        'agent_notifications',
        expect.objectContaining({
          type: 'workflow_progress',
          title: '🤝 Case Management Update'
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle welcome sequence errors gracefully', async () => {
      mockGoogleCalendarService.createEvent.mockRejectedValue(new Error('Calendar service unavailable'));

      const agent = await ClientWelcomeAgent.spawnAgent(mockClientData);

      // Should still create agent even if calendar fails
      expect(agent).toBeInstanceOf(ClientWelcomeAgent);

      // Should create error notification
      const storeDataCalls = mockUnifiedDataOwnership.storeData.mock.calls;
      const errorNotificationCalls = storeDataCalls.filter(call => 
        call[1] === 'agent_notifications' && 
        (call[2] as AgentNotification).type === 'alert'
      );

      expect(errorNotificationCalls.length).toBeGreaterThan(0);
    });

    it('should handle notification processing errors', async () => {
      const agent = await ClientWelcomeAgent.spawnAgent(mockClientData);

      mockUnifiedDataOwnership.getData.mockRejectedValue(new Error('Data access failed'));

      // Should not throw when checking for notifications fails
      await expect(agent['checkForWorkflowNotifications']()).resolves.not.toThrow();
    });
  });

  describe('Agent Termination', () => {
    it('should terminate agent properly', async () => {
      const agent = await ClientWelcomeAgent.spawnAgent(mockClientData);

      await agent.terminate();

      // Should save final configuration
      expect(mockUnifiedDataOwnership.storeData).toHaveBeenCalledWith(
        'client_test_123',
        'agent_configuration',
        expect.objectContaining({
          clientId: 'client_test_123'
        })
      );
    });
  });

  describe('Welcome Message Generation', () => {
    it('should generate personalized welcome message with correct greeting', () => {
      // Test morning greeting
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(10);
      
      const agent = new (ClientWelcomeAgent as any)(mockAgentConfig);
      const message = agent.generateWelcomeMessage(mockClientData);
      
      expect(message).toContain('Good morning, John!');
      expect(message).toContain('Welcome to Idaho Events Services');
      expect(message).toContain('personal service coordinator agent');
      expect(message).toContain(mockAgentConfig.agentId);
    });

    it('should generate afternoon greeting', () => {
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(15);
      
      const agent = new (ClientWelcomeAgent as any)(mockAgentConfig);
      const message = agent.generateWelcomeMessage(mockClientData);
      
      expect(message).toContain('Good afternoon, John!');
    });

    it('should generate evening greeting', () => {
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(20);
      
      const agent = new (ClientWelcomeAgent as any)(mockAgentConfig);
      const message = agent.generateWelcomeMessage(mockClientData);
      
      expect(message).toContain('Good evening, John!');
    });
  });
});