/**
 * Tests for SMS Wake-up Bot
 */

import { SMSWakeupBot } from '../SMSWakeupBot';
import { BotEvent } from '../../services/botlabCore';
import { smsService } from '../../services/smsService';

// Mock the SMS service
jest.mock('../../services/smsService', () => ({
  smsService: {
    sendWakeupSMS: jest.fn(),
    optInClient: jest.fn(),
    optOutClient: jest.fn(),
    getClientPreferences: jest.fn(),
    setClientPreferences: jest.fn(),
    getMessageStats: jest.fn().mockResolvedValue({
      totalSent: 0,
      totalFailed: 0,
      queueSize: 0,
      optedInClients: 0
    })
  }
}));

// Mock the safe localStorage
jest.mock('../../utils/localStorage', () => ({
  safeLocalStorage: {
    setJSON: jest.fn(),
    getJSON: jest.fn(),
    removeItem: jest.fn()
  }
}));

describe('SMSWakeupBot', () => {
  let bot: SMSWakeupBot;
  const mockSmsService = smsService as jest.Mocked<typeof smsService>;

  beforeEach(() => {
    bot = new SMSWakeupBot();
    jest.clearAllMocks();
  });

  describe('Bot Configuration', () => {
    it('should have correct bot configuration', () => {
      const config = bot.getConfiguration();
      
      expect(config.botId).toBe('sms_wakeup_bot');
      expect(config.name).toBe('SMS Wake-up Agent Bot');
      expect(config.eventTypes).toContain('wakeup_event');
      expect(config.eventTypes).toContain('client_registration');
      expect(config.enabled).toBe(true);
    });

    it('should have scheduled task configuration', () => {
      const config = bot.getConfiguration();
      
      expect(config.schedule).toBe('*/5 * * * *'); // Every 5 minutes
      expect(config.microservices).toContain('sms');
      expect(config.microservices).toContain('shelter_management');
    });
  });

  describe('Bot Initialization', () => {
    it('should initialize successfully', async () => {
      await expect(bot.initialize()).resolves.not.toThrow();
    });

    it('should load default wake-up schedules', async () => {
      await bot.initialize();
      
      const schedules = bot.getFacilitySchedules();
      expect(schedules.length).toBeGreaterThan(0);
      
      const mainShelter = schedules.find(s => s.facilityId === 'main_shelter');
      expect(mainShelter).toBeDefined();
      expect(mainShelter?.checkoutTime).toBe('07:00');
      expect(mainShelter?.enabled).toBe(true);
    });
  });

  describe('Wake-up Event Handling', () => {
    beforeEach(async () => {
      await bot.initialize();
    });

    it('should handle wake-up events successfully', async () => {
      const wakeupEvent: BotEvent = {
        id: 'test_wakeup_001',
        type: 'wakeup_event',
        timestamp: new Date(),
        data: {
          clientId: 'client_001',
          bedNumber: 'A-12',
          facilityName: 'Main Community Shelter',
          checkoutTime: new Date(Date.now() + 30 * 60000), // 30 minutes from now
          currentTime: new Date(),
          urgency: 'warning',
          clientName: 'John Doe'
        },
        processed: false
      };

      mockSmsService.sendWakeupSMS.mockResolvedValue({
        id: 'sms_test_001',
        to: '5551234567',
        from: '+1234567890',
        body: 'Wake-up test message',
        timestamp: new Date(),
        status: 'sent',
        retryCount: 0,
        maxRetries: 3
      });

      await bot.handleEvent(wakeupEvent);

      expect(mockSmsService.sendWakeupSMS).toHaveBeenCalledWith('client_001', expect.objectContaining({
        bedNumber: 'A-12',
        facilityName: 'Main Community Shelter',
        checkoutTime: expect.any(String)
      }));
    });

    it('should select correct template based on urgency', async () => {
      const urgentEvent: BotEvent = {
        id: 'test_urgent_001',
        type: 'wakeup_event',
        timestamp: new Date(),
        data: {
          clientId: 'client_002',
          bedNumber: 'B-08',
          facilityName: 'Test Facility',
          checkoutTime: new Date(Date.now() - 30 * 60000), // 30 minutes ago (overdue)
          currentTime: new Date(),
          urgency: 'urgent',
          clientName: 'Jane Smith'
        },
        processed: false
      };

      mockSmsService.sendWakeupSMS.mockResolvedValue(null); // Simulate client not opted in

      await bot.handleEvent(urgentEvent);

      expect(mockSmsService.sendWakeupSMS).toHaveBeenCalledWith('client_002', {
        templateId: 'wakeup_urgent',
        urgency: 'urgent',
        bedNumber: 'B-08',
        facilityName: 'Test Facility',
        checkoutTime: expect.any(String)
      });
    });

    it('should handle gentle wake-up events', async () => {
      const gentleEvent: BotEvent = {
        id: 'test_gentle_001',
        type: 'wakeup_event',
        timestamp: new Date(),
        data: {
          clientId: 'client_003',
          bedNumber: 'C-05',
          facilityName: 'Test Facility',
          checkoutTime: new Date(Date.now() + 2 * 60 * 60000), // 2 hours from now
          currentTime: new Date(),
          urgency: 'gentle',
          clientName: 'Bob Johnson'
        },
        processed: false
      };

      await bot.handleEvent(gentleEvent);

      expect(mockSmsService.sendWakeupSMS).toHaveBeenCalledWith('client_003', {
        templateId: 'wakeup_gentle',
        urgency: 'gentle',
        bedNumber: 'C-05',
        facilityName: 'Test Facility',
        checkoutTime: expect.any(String)
      });
    });
  });

  describe('Client Registration Handling', () => {
    beforeEach(async () => {
      await bot.initialize();
    });

    it('should handle client registration events', async () => {
      const registrationEvent: BotEvent = {
        id: 'test_reg_001',
        type: 'client_registration',
        timestamp: new Date(),
        data: {
          clientId: 'new_client_001',
          phoneNumber: '5559876543'
        },
        processed: false
      };

      mockSmsService.optInClient.mockResolvedValue();

      await bot.handleEvent(registrationEvent);

      expect(mockSmsService.optInClient).toHaveBeenCalledWith('new_client_001', '5559876543');
    });

    it('should skip registration without phone number', async () => {
      const registrationEvent: BotEvent = {
        id: 'test_reg_002',
        type: 'client_registration',
        timestamp: new Date(),
        data: {
          clientId: 'new_client_002'
          // No phone number
        },
        processed: false
      };

      await bot.handleEvent(registrationEvent);

      expect(mockSmsService.optInClient).not.toHaveBeenCalled();
    });
  });

  describe('Facility Management', () => {
    beforeEach(async () => {
      await bot.initialize();
    });

    it('should add new facility schedules', async () => {
      const newSchedule = {
        facilityId: 'test_facility',
        facilityName: 'Test Emergency Shelter',
        checkoutTime: '08:30',
        warningTime: 45,
        urgentTime: 20,
        enabled: true
      };

      await bot.addFacilitySchedule(newSchedule);

      const schedules = bot.getFacilitySchedules();
      const addedSchedule = schedules.find(s => s.facilityId === 'test_facility');
      
      expect(addedSchedule).toBeDefined();
      expect(addedSchedule?.facilityName).toBe('Test Emergency Shelter');
      expect(addedSchedule?.checkoutTime).toBe('08:30');
    });

    it('should track processed wake-ups count', async () => {
      const initialCount = bot.getProcessedWakeupsCount();
      expect(typeof initialCount).toBe('number');
      expect(initialCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Bot Lifecycle', () => {
    it('should start successfully', async () => {
      await expect(bot.start()).resolves.not.toThrow();
      
      const status = bot.getStatus();
      expect(status.status).toBe('running');
    });

    it('should stop successfully', async () => {
      await bot.start();
      await expect(bot.stop()).resolves.not.toThrow();
      
      const status = bot.getStatus();
      expect(status.status).toBe('stopped');
    });

    it('should pause and resume', async () => {
      await bot.start();
      
      await bot.pause();
      expect(bot.getStatus().status).toBe('paused');
      
      await bot.resume();
      expect(bot.getStatus().status).toBe('running');
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await bot.initialize();
    });

    it('should handle SMS service errors gracefully', async () => {
      const wakeupEvent: BotEvent = {
        id: 'test_error_001',
        type: 'wakeup_event',
        timestamp: new Date(),
        data: {
          clientId: 'error_client',
          bedNumber: 'E-01',
          facilityName: 'Error Test Facility',
          checkoutTime: new Date(),
          currentTime: new Date(),
          urgency: 'urgent'
        },
        processed: false
      };

      mockSmsService.sendWakeupSMS.mockRejectedValue(new Error('SMS service error'));

      // Should not throw, but handle error gracefully
      await expect(bot.handleEvent(wakeupEvent)).resolves.not.toThrow();
    });

    it('should track error count in status', async () => {
      const wakeupEvent: BotEvent = {
        id: 'test_error_002',
        type: 'wakeup_event',
        timestamp: new Date(),
        data: {
          clientId: 'error_client_2',
          bedNumber: 'E-02',
          facilityName: 'Error Test Facility',
          checkoutTime: new Date(),
          currentTime: new Date(),
          urgency: 'warning'
        },
        processed: false
      };

      mockSmsService.sendWakeupSMS.mockRejectedValue(new Error('Network error'));

      await bot.handleEvent(wakeupEvent);

      const status = bot.getStatus();
      expect(status.errorCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Message Processing', () => {
    beforeEach(async () => {
      await bot.initialize();
    });

    it('should process command messages', async () => {
      const commandMessage = {
        id: 'cmd_001',
        timestamp: new Date(),
        type: 'command' as const,
        source: 'dashboard',
        destination: 'sms_wakeup_bot',
        payload: {
          command: 'get_stats'
        }
      };

      await expect(bot.processMessage(commandMessage)).resolves.not.toThrow();
    });

    it('should process notification messages', async () => {
      const notificationMessage = {
        id: 'notif_001',
        timestamp: new Date(),
        type: 'notification' as const,
        source: 'shelter_management',
        destination: 'sms_wakeup_bot',
        payload: {
          type: 'facility_update'
        }
      };

      await expect(bot.processMessage(notificationMessage)).resolves.not.toThrow();
    });
  });
});

describe('SMS Wake-up Bot Integration', () => {
  let bot: SMSWakeupBot;
  const mockSmsService = smsService as jest.Mocked<typeof smsService>;

  beforeEach(async () => {
    bot = new SMSWakeupBot();
    await bot.initialize();
    await bot.start();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await bot.stop();
  });

  it('should integrate with SMS service for client preferences', async () => {
    mockSmsService.getClientPreferences.mockReturnValue({
      clientId: 'integration_client',
      phoneNumber: '5551112222',
      optedIn: true,
      wakeupEnabled: true,
      reminderEnabled: true,
      alertEnabled: true,
      timezone: 'America/Los_Angeles',
      lastUpdated: new Date()
    });

    mockSmsService.sendWakeupSMS.mockResolvedValue({
      id: 'integration_sms_001',
      to: '5551112222',
      from: '+1234567890',
      body: 'Integration test message',
      timestamp: new Date(),
      status: 'sent',
      retryCount: 0,
      maxRetries: 3
    });

    const wakeupEvent: BotEvent = {
      id: 'integration_event_001',
      type: 'wakeup_event',
      timestamp: new Date(),
      data: {
        clientId: 'integration_client',
        bedNumber: 'I-01',
        facilityName: 'Integration Test Facility',
        checkoutTime: new Date(Date.now() + 15 * 60000),
        currentTime: new Date(),
        urgency: 'warning'
      },
      processed: false
    };

    await bot.handleEvent(wakeupEvent);

    expect(mockSmsService.sendWakeupSMS).toHaveBeenCalledTimes(1);
    expect(mockSmsService.sendWakeupSMS).toHaveBeenCalledWith('integration_client', expect.objectContaining({
      bedNumber: 'I-01',
      facilityName: 'Integration Test Facility'
    }));
  });
});