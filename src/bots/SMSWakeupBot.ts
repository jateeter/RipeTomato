/**
 * SMS Wake-up Agent Bot
 * 
 * BotLab Core agent that monitors wake-up events and sends SMS notifications
 * to clients when they need to vacate beds or prepare for checkout.
 * 
 * Integrates with:
 * - PeoplePower BotLab Core platform
 * - SMS Service (Twilio)
 * - Shelter Management System
 * - Client Preference Management
 * 
 * @license MIT
 */

import { BaseBotLabBot, type BotConfiguration, type BotEvent, type BotMessage } from '../modules/agents';
import { smsService, ClientSMSPreferences } from '../services/smsService';
import { format, addMinutes, isBefore, isAfter } from 'date-fns';

export interface WakeupEvent {
  clientId: string;
  bedNumber: string;
  facilityName: string;
  checkoutTime: Date;
  currentTime: Date;
  urgency: 'gentle' | 'warning' | 'urgent' | 'overdue';
  clientName?: string;
  roomNumber?: string;
}

export interface WakeupSchedule {
  facilityId: string;
  facilityName: string;
  checkoutTime: string; // HH:MM format
  warningTime: number; // minutes before checkout
  urgentTime: number; // minutes after checkout for urgent messages
  enabled: boolean;
}

export class SMSWakeupBot extends BaseBotLabBot {
  private wakeupSchedules: Map<string, WakeupSchedule> = new Map();
  private processedWakeups: Set<string> = new Set(); // Track processed wake-ups for today
  private lastProcessedDate: string = '';

  constructor() {
    const config: BotConfiguration = {
      botId: 'sms_wakeup_bot',
      name: 'SMS Wake-up Agent Bot',
      description: 'Sends SMS notifications to clients when wake-up events occur',
      version: '1.0.0',
      author: 'Community Services Bot Team',
      microservices: ['sms', 'shelter_management', 'client_preferences'],
      eventTypes: ['wakeup_event', 'checkout_reminder', 'bed_checkout', 'client_registration'],
      schedule: '*/5 * * * *', // Check every 5 minutes
      enabled: true,
      settings: {
        defaultWarningMinutes: 30,
        defaultUrgentMinutes: 15,
        maxRetries: 3,
        respectQuietHours: true
      }
    };

    super(config);
    this.loadWakeupSchedules();
  }

  async initialize(): Promise<void> {
    console.log('🏃 Initializing SMS Wake-up Bot...');
    
    // Load persisted state
    const savedSchedules = await this.loadState<Array<[string, WakeupSchedule]>>('wakeup_schedules');
    if (savedSchedules) {
      this.wakeupSchedules = new Map(savedSchedules);
    } else {
      this.setDefaultSchedules();
    }

    const savedProcessedWakeups = await this.loadState<string[]>('processed_wakeups');
    if (savedProcessedWakeups) {
      this.processedWakeups = new Set(savedProcessedWakeups);
    }

    this.lastProcessedDate = await this.loadState<string>('last_processed_date') || '';
    
    console.log(`✅ SMS Wake-up Bot initialized with ${this.wakeupSchedules.size} facility schedules`);
  }

  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up SMS Wake-up Bot...');
    
    // Save current state
    await this.saveState('wakeup_schedules', Array.from(this.wakeupSchedules.entries()));
    await this.saveState('processed_wakeups', Array.from(this.processedWakeups));
    await this.saveState('last_processed_date', this.lastProcessedDate);
    
    console.log('✅ SMS Wake-up Bot cleanup completed');
  }

  protected initializeEventHandlers(): void {
    // Register event handlers for different wake-up scenarios
    this.registerEventHandler('wakeup_event', this.handleWakeupEvent.bind(this));
    this.registerEventHandler('checkout_reminder', this.handleCheckoutReminder.bind(this));
    this.registerEventHandler('bed_checkout', this.handleBedCheckout.bind(this));
    this.registerEventHandler('client_registration', this.handleClientRegistration.bind(this));
  }

  async processMessage(message: BotMessage): Promise<void> {
    this.instance.processedMessages++;
    
    console.log(`📨 SMS Wake-up Bot processing message: ${message.type}`);
    
    try {
      switch (message.type) {
        case 'command':
          await this.handleCommand(message);
          break;
        case 'notification':
          await this.handleNotification(message);
          break;
        default:
          console.log(`ℹ️ Unhandled message type: ${message.type}`);
      }
      
      this.instance.lastActivity = new Date();
    } catch (error) {
      console.error(`❌ Error processing message:`, error);
      this.instance.errorCount++;
      throw error;
    }
  }

  // Event handling method required by the base class
  async handleEvent(event: BotEvent): Promise<void> {
    this.instance.processedMessages++;
    
    console.log(`📨 Processing event of type: ${event.type}`);
    
    try {
      switch (event.type) {
        case 'wakeup_event':
          await this.handleWakeupEvent(event);
          break;
        case 'checkout_reminder':
          await this.handleCheckoutReminder(event);
          break;
        case 'bed_checkout':
          await this.handleBedCheckout(event);
          break;
        case 'client_registration':
          await this.handleClientRegistration(event);
          break;
        default:
          console.log(`❓ Unknown event type: ${event.type}`);
      }
      
      this.instance.lastActivity = new Date();
    } catch (error) {
      console.error(`❌ Error processing event:`, error);
      this.instance.errorCount++;
      throw error;
    }
  }

  // Scheduled task execution (runs every 5 minutes)
  protected async executeScheduledTask(): Promise<void> {
    console.log('⏰ SMS Wake-up Bot: Executing scheduled wake-up check...');
    
    const now = new Date();
    const currentDate = format(now, 'yyyy-MM-dd');
    
    // Reset daily tracking if it's a new day
    if (this.lastProcessedDate !== currentDate) {
      this.processedWakeups.clear();
      this.lastProcessedDate = currentDate;
      await this.saveState('last_processed_date', currentDate);
      console.log('🌅 New day detected, reset processed wake-ups tracking');
    }

    // Check each facility's wake-up schedule
    for (const [facilityId, schedule] of this.wakeupSchedules) {
      if (!schedule.enabled) continue;

      await this.checkFacilityWakeups(facilityId, schedule, now);
    }
  }

  private async checkFacilityWakeups(facilityId: string, schedule: WakeupSchedule, currentTime: Date): Promise<void> {
    // Parse checkout time for today
    const [hours, minutes] = schedule.checkoutTime.split(':').map(Number);
    const checkoutTime = new Date(currentTime);
    checkoutTime.setHours(hours, minutes, 0, 0);

    // Calculate warning times
    const warningTime = addMinutes(checkoutTime, -schedule.warningTime);
    const urgentTime = addMinutes(checkoutTime, schedule.urgentTime);

    // Determine current urgency level
    let urgency: WakeupEvent['urgency'];
    if (isAfter(currentTime, urgentTime)) {
      urgency = 'overdue';
    } else if (isAfter(currentTime, checkoutTime)) {
      urgency = 'urgent';
    } else if (isAfter(currentTime, warningTime)) {
      urgency = 'warning';
    } else {
      urgency = 'gentle';
    }

    // Only process if we're in an active period and haven't sent today
    if (urgency === 'gentle' && isBefore(currentTime, warningTime)) {
      return; // Too early for any notifications
    }

    // Get active clients for this facility (mock data for now)
    const activeClients = await this.getActiveClientsForFacility(facilityId);
    
    for (const client of activeClients) {
      const wakeupKey = `${facilityId}_${client.clientId}_${format(currentTime, 'yyyy-MM-dd')}`;
      
      // Skip if already processed today
      if (this.processedWakeups.has(wakeupKey)) {
        continue;
      }

      const wakeupEvent: WakeupEvent = {
        clientId: client.clientId,
        bedNumber: client.bedNumber,
        facilityName: schedule.facilityName,
        checkoutTime,
        currentTime,
        urgency,
        clientName: client.clientName,
        roomNumber: client.roomNumber
      };

      // Send wake-up event for processing
      await this.handleWakeupEvent({
        id: `wakeup_${wakeupKey}`,
        type: 'wakeup_event',
        timestamp: currentTime,
        sourceDevice: facilityId,
        location: schedule.facilityName,
        data: wakeupEvent,
        processed: false
      });

      // Mark as processed
      this.processedWakeups.add(wakeupKey);
    }
  }

  // Event handlers
  private async handleWakeupEvent(event: BotEvent): Promise<void> {
    const wakeupEvent = event.data as WakeupEvent;
    console.log(`🏃 Processing wake-up event for client ${wakeupEvent.clientId} (${wakeupEvent.urgency})`);

    try {
      // Select appropriate SMS template based on urgency
      let templateId: string;
      switch (wakeupEvent.urgency) {
        case 'gentle':
          templateId = 'wakeup_gentle';
          break;
        case 'urgent':
        case 'overdue':
          templateId = 'wakeup_urgent';
          break;
        default:
          templateId = 'wakeup_15min';
      }

      // Send SMS wake-up notification
      const mappedUrgency = wakeupEvent.urgency === 'warning' ? 'normal' : 
                           wakeupEvent.urgency === 'overdue' ? 'urgent' : 
                           wakeupEvent.urgency;
      
      const smsResult = await smsService.sendWakeupSMS(wakeupEvent.clientId, {
        templateId,
        urgency: mappedUrgency,
        bedNumber: wakeupEvent.bedNumber,
        facilityName: wakeupEvent.facilityName,
        checkoutTime: format(wakeupEvent.checkoutTime, 'h:mm a')
      });

      if (smsResult) {
        console.log(`✅ Wake-up SMS sent to client ${wakeupEvent.clientId}: ${smsResult.id}`);
        
        // Send success message back to system
        await this.sendMessage({
          id: `wakeup_success_${Date.now()}`,
          timestamp: new Date(),
          type: 'notification',
          source: this.config.botId,
          destination: 'shelter_management',
          payload: {
            eventType: 'wakeup_sms_sent',
            clientId: wakeupEvent.clientId,
            smsMessageId: smsResult.id,
            urgency: wakeupEvent.urgency
          }
        });
      } else {
        console.log(`⏭️ Wake-up SMS skipped for client ${wakeupEvent.clientId} (not opted in)`);
      }
    } catch (error) {
      console.error(`❌ Failed to process wake-up event for client ${wakeupEvent.clientId}:`, error);
      
      // Send error notification
      await this.sendMessage({
        id: `wakeup_error_${Date.now()}`,
        timestamp: new Date(),
        type: 'notification',
        source: this.config.botId,
        destination: 'shelter_management',
        payload: {
          eventType: 'wakeup_sms_failed',
          clientId: wakeupEvent.clientId,
          error: error instanceof Error ? error.message : 'Unknown error',
          urgency: wakeupEvent.urgency
        }
      });
    }
  }

  private async handleCheckoutReminder(event: BotEvent): Promise<void> {
    console.log('🔔 Processing checkout reminder event');
    // Implementation for checkout reminder logic
  }

  private async handleBedCheckout(event: BotEvent): Promise<void> {
    console.log('🛏️ Processing bed checkout event');
    // Implementation for bed checkout completion
  }

  private async handleClientRegistration(event: BotEvent): Promise<void> {
    const clientData = event.data;
    console.log(`👤 Processing new client registration: ${clientData.clientId}`);
    
    // Auto-opt in new clients for SMS notifications if phone number provided
    if (clientData.phoneNumber) {
      await smsService.optInClient(clientData.clientId, clientData.phoneNumber);
      console.log(`📱 Auto-enrolled client ${clientData.clientId} for SMS notifications`);
    }
  }

  private async handleCommand(message: BotMessage): Promise<void> {
    const command = message.payload?.command;
    
    switch (command) {
      case 'enable_facility':
        await this.enableFacility(message.payload.facilityId);
        break;
      case 'disable_facility':
        await this.disableFacility(message.payload.facilityId);
        break;
      case 'update_schedule':
        await this.updateFacilitySchedule(message.payload.facilityId, message.payload.schedule);
        break;
      case 'get_stats':
        await this.sendBotStats();
        break;
      default:
        console.log(`❓ Unknown command: ${command}`);
    }
  }

  private async handleNotification(message: BotMessage): Promise<void> {
    console.log(`🔔 Processing notification: ${message.payload?.type}`);
  }

  // Facility management
  private setDefaultSchedules(): void {
    const defaultSchedules: WakeupSchedule[] = [
      {
        facilityId: 'main_shelter',
        facilityName: 'Main Community Shelter',
        checkoutTime: '07:00',
        warningTime: 30,
        urgentTime: 15,
        enabled: true
      },
      {
        facilityId: 'family_shelter',
        facilityName: 'Family Emergency Shelter',
        checkoutTime: '08:00',
        warningTime: 45,
        urgentTime: 30,
        enabled: true
      },
      {
        facilityId: 'overflow_shelter',
        facilityName: 'Overflow Winter Shelter',
        checkoutTime: '06:30',
        warningTime: 30,
        urgentTime: 15,
        enabled: true
      }
    ];

    defaultSchedules.forEach(schedule => {
      this.wakeupSchedules.set(schedule.facilityId, schedule);
    });
  }

  private loadWakeupSchedules(): void {
    // This would typically load from a database or API
    this.setDefaultSchedules();
  }

  private async enableFacility(facilityId: string): Promise<void> {
    const schedule = this.wakeupSchedules.get(facilityId);
    if (schedule) {
      schedule.enabled = true;
      await this.saveState('wakeup_schedules', Array.from(this.wakeupSchedules.entries()));
      console.log(`✅ Enabled wake-up notifications for facility: ${facilityId}`);
    }
  }

  private async disableFacility(facilityId: string): Promise<void> {
    const schedule = this.wakeupSchedules.get(facilityId);
    if (schedule) {
      schedule.enabled = false;
      await this.saveState('wakeup_schedules', Array.from(this.wakeupSchedules.entries()));
      console.log(`❌ Disabled wake-up notifications for facility: ${facilityId}`);
    }
  }

  private async updateFacilitySchedule(facilityId: string, newSchedule: Partial<WakeupSchedule>): Promise<void> {
    const existingSchedule = this.wakeupSchedules.get(facilityId);
    if (existingSchedule) {
      Object.assign(existingSchedule, newSchedule);
      await this.saveState('wakeup_schedules', Array.from(this.wakeupSchedules.entries()));
      console.log(`🔄 Updated schedule for facility: ${facilityId}`);
    }
  }

  private async sendBotStats(): Promise<void> {
    const smsStats = await smsService.getMessageStats();
    const stats = {
      botId: this.config.botId,
      status: this.getStatus(),
      facilitiesConfigured: this.wakeupSchedules.size,
      enabledFacilities: Array.from(this.wakeupSchedules.values()).filter(s => s.enabled).length,
      processedWakeupsToday: this.processedWakeups.size,
      smsStats
    };

    await this.sendMessage({
      id: `stats_${Date.now()}`,
      timestamp: new Date(),
      type: 'notification',
      source: this.config.botId,
      destination: 'dashboard',
      payload: {
        eventType: 'bot_stats',
        stats
      }
    });
  }

  // Mock function to get active clients - in real implementation this would query the shelter management system
  private async getActiveClientsForFacility(facilityId: string): Promise<Array<{
    clientId: string;
    clientName: string;
    bedNumber: string;
    roomNumber?: string;
  }>> {
    // Mock data for demonstration
    const mockClients = [
      {
        clientId: 'client_001',
        clientName: 'John Doe',
        bedNumber: 'A-12',
        roomNumber: 'Room 101'
      },
      {
        clientId: 'client_002', 
        clientName: 'Jane Smith',
        bedNumber: 'B-08',
        roomNumber: 'Room 203'
      }
    ];

    return mockClients.filter(client => Math.random() > 0.7); // Randomly simulate some clients being present
  }

  // Public methods for external control
  async addFacilitySchedule(schedule: WakeupSchedule): Promise<void> {
    this.wakeupSchedules.set(schedule.facilityId, schedule);
    await this.saveState('wakeup_schedules', Array.from(this.wakeupSchedules.entries()));
    console.log(`➕ Added wake-up schedule for facility: ${schedule.facilityName}`);
  }

  getFacilitySchedules(): WakeupSchedule[] {
    return Array.from(this.wakeupSchedules.values());
  }

  getProcessedWakeupsCount(): number {
    return this.processedWakeups.size;
  }
}