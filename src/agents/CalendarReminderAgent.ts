/**
 * Calendar Reminder Agent
 * 
 * Intelligent agent that monitors calendar events and provides
 * proactive reminders via SMS, voice calls, and notifications
 * based on user preferences and upcoming calendar entries.
 * 
 * @license MIT
 */

import { googleCalendarService, GoogleCalendarEvent } from '../services/googleCalendarService';
import { googleVoiceService } from '../services/googleVoiceService';

export interface ReminderRule {
  id: string;
  userId: string;
  eventTypes: string[];
  reminderTypes: ('sms' | 'voice' | 'voicemail' | 'notification')[];
  offsetMinutes: number[];
  conditions: {
    minPriority?: 'low' | 'normal' | 'high' | 'urgent';
    eventKeywords?: string[];
    excludeKeywords?: string[];
    timeOfDay?: {
      start: string;
      end: string;
    };
    daysOfWeek?: number[];
    location?: string;
  };
  active: boolean;
  lastTriggered?: Date;
}

export interface ReminderExecution {
  id: string;
  ruleId: string;
  eventId: string;
  userId: string;
  reminderType: 'sms' | 'voice' | 'voicemail' | 'notification';
  status: 'scheduled' | 'sent' | 'delivered' | 'failed' | 'cancelled';
  scheduledTime: Date;
  executedTime?: Date;
  response?: {
    acknowledged: boolean;
    responseTime?: Date;
    userFeedback?: string;
  };
  metadata: {
    eventTitle: string;
    eventTime: Date;
    location?: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
  };
}

export interface AgentMetrics {
  totalReminders: number;
  remindersThisWeek: number;
  successfulReminders: number;
  failedReminders: number;
  averageResponseTime: number;
  userSatisfactionScore: number;
  remindersByType: Record<string, number>;
  remindersByPriority: Record<string, number>;
  peakReminderTimes: Array<{
    hour: number;
    count: number;
  }>;
}

class CalendarReminderAgent {
  private reminderRules: Map<string, ReminderRule> = new Map();
  private scheduledReminders: Map<string, ReminderExecution> = new Map();
  private executedReminders: Map<string, ReminderExecution> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isActive: boolean = false;

  constructor() {
    console.log('📅 Calendar Reminder Agent initialized');
    this.loadConfiguration();
  }

  /**
   * Start the calendar reminder monitoring
   */
  async start(): Promise<void> {
    if (this.isActive) return;

    try {
      await googleCalendarService.initialize();
      await googleVoiceService.initialize();

      this.isActive = true;
      
      // Start monitoring calendar events every 5 minutes
      this.monitoringInterval = setInterval(() => {
        this.monitorCalendarEvents();
      }, 5 * 60 * 1000);

      // Initial scan
      await this.monitorCalendarEvents();

      console.log('✅ Calendar Reminder Agent started');
    } catch (error) {
      console.error('Failed to start Calendar Reminder Agent:', error);
      throw error;
    }
  }

  /**
   * Stop the calendar reminder monitoring
   */
  stop(): void {
    if (!this.isActive) return;

    this.isActive = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log('⏹️ Calendar Reminder Agent stopped');
  }

  /**
   * Add a reminder rule for a user
   */
  async addReminderRule(rule: Omit<ReminderRule, 'id'>): Promise<string> {
    const ruleId = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    const fullRule: ReminderRule = {
      id: ruleId,
      ...rule
    };

    this.reminderRules.set(ruleId, fullRule);
    this.saveConfiguration();

    console.log(`➕ Added reminder rule for user ${rule.userId}:`, ruleId);
    
    // Immediately check for applicable events
    await this.processUserEvents(rule.userId);
    
    return ruleId;
  }

  /**
   * Update an existing reminder rule
   */
  async updateReminderRule(ruleId: string, updates: Partial<ReminderRule>): Promise<void> {
    const existingRule = this.reminderRules.get(ruleId);
    if (!existingRule) {
      throw new Error(`Reminder rule ${ruleId} not found`);
    }

    const updatedRule = { ...existingRule, ...updates };
    this.reminderRules.set(ruleId, updatedRule);
    this.saveConfiguration();

    console.log(`📝 Updated reminder rule ${ruleId}`);
  }

  /**
   * Remove a reminder rule
   */
  async removeReminderRule(ruleId: string): Promise<void> {
    if (!this.reminderRules.has(ruleId)) {
      throw new Error(`Reminder rule ${ruleId} not found`);
    }

    this.reminderRules.delete(ruleId);
    
    // Cancel any scheduled reminders for this rule
    const toCancel = Array.from(this.scheduledReminders.values()).filter(
      reminder => reminder.ruleId === ruleId
    );
    
    toCancel.forEach(reminder => {
      reminder.status = 'cancelled';
      this.scheduledReminders.delete(reminder.id);
    });

    this.saveConfiguration();
    console.log(`🗑️ Removed reminder rule ${ruleId}`);
  }

  /**
   * Get reminder rules for a user
   */
  getReminderRules(userId: string): ReminderRule[] {
    return Array.from(this.reminderRules.values()).filter(
      rule => rule.userId === userId
    );
  }

  /**
   * Get scheduled reminders for a user
   */
  getScheduledReminders(userId: string): ReminderExecution[] {
    return Array.from(this.scheduledReminders.values())
      .filter(reminder => reminder.userId === userId)
      .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
  }

  /**
   * Get agent metrics
   */
  getMetrics(): AgentMetrics {
    const allExecuted = Array.from(this.executedReminders.values());
    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);
    
    const thisWeekReminders = allExecuted.filter(
      r => r.executedTime && r.executedTime >= thisWeek
    );

    const successful = allExecuted.filter(r => r.status === 'delivered').length;
    const failed = allExecuted.filter(r => r.status === 'failed').length;

    const responseTimes = allExecuted
      .filter(r => r.response?.responseTime && r.executedTime)
      .map(r => r.response!.responseTime!.getTime() - r.executedTime!.getTime());

    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0;

    // Group by type
    const remindersByType: Record<string, number> = {};
    allExecuted.forEach(r => {
      remindersByType[r.reminderType] = (remindersByType[r.reminderType] || 0) + 1;
    });

    // Group by priority
    const remindersByPriority: Record<string, number> = {};
    allExecuted.forEach(r => {
      remindersByPriority[r.metadata.priority] = (remindersByPriority[r.metadata.priority] || 0) + 1;
    });

    // Peak hours analysis
    const hourCounts: Record<number, number> = {};
    allExecuted.forEach(r => {
      if (r.executedTime) {
        const hour = r.executedTime.getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    });

    const peakReminderTimes = Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalReminders: allExecuted.length,
      remindersThisWeek: thisWeekReminders.length,
      successfulReminders: successful,
      failedReminders: failed,
      averageResponseTime: avgResponseTime,
      userSatisfactionScore: this.calculateSatisfactionScore(allExecuted),
      remindersByType,
      remindersByPriority,
      peakReminderTimes
    };
  }

  /**
   * Create default reminder rules for different user types
   */
  async createDefaultRules(userId: string, userType: 'client' | 'staff' | 'manager'): Promise<string[]> {
    const defaultRules: Array<Omit<ReminderRule, 'id'>> = [];

    switch (userType) {
      case 'client':
        defaultRules.push(
          {
            userId,
            eventTypes: ['appointment', 'case_meeting', 'bed_registration'],
            reminderTypes: ['sms', 'voice'],
            offsetMinutes: [60, 15], // 1 hour and 15 minutes before
            conditions: {
              minPriority: 'normal',
              timeOfDay: { start: '08:00', end: '20:00' }
            },
            active: true
          },
          {
            userId,
            eventTypes: ['bed_registration', 'check_out'],
            reminderTypes: ['sms'],
            offsetMinutes: [1440, 60], // 24 hours and 1 hour before
            conditions: {
              eventKeywords: ['check', 'bed', 'shelter'],
              timeOfDay: { start: '09:00', end: '21:00' }
            },
            active: true
          }
        );
        break;

      case 'staff':
        defaultRules.push(
          {
            userId,
            eventTypes: ['appointment', 'case_meeting', 'staff_meeting', 'client_check_in'],
            reminderTypes: ['sms', 'notification'],
            offsetMinutes: [30, 5], // 30 minutes and 5 minutes before
            conditions: {
              timeOfDay: { start: '07:00', end: '19:00' },
              daysOfWeek: [1, 2, 3, 4, 5] // Monday-Friday
            },
            active: true
          },
          {
            userId,
            eventTypes: ['emergency', 'urgent_appointment'],
            reminderTypes: ['voice', 'sms'],
            offsetMinutes: [15, 5, 0], // 15 min, 5 min, and at time
            conditions: {
              minPriority: 'high'
            },
            active: true
          }
        );
        break;

      case 'manager':
        defaultRules.push(
          {
            userId,
            eventTypes: ['staff_meeting', 'board_meeting', 'inspection', 'review'],
            reminderTypes: ['sms', 'notification'],
            offsetMinutes: [60, 15], // 1 hour and 15 minutes before
            conditions: {
              minPriority: 'normal'
            },
            active: true
          },
          {
            userId,
            eventTypes: ['emergency', 'crisis_response'],
            reminderTypes: ['voice', 'sms', 'notification'],
            offsetMinutes: [30, 10, 0], // Multiple reminders
            conditions: {
              minPriority: 'urgent'
            },
            active: true
          }
        );
        break;
    }

    const ruleIds: string[] = [];
    for (const rule of defaultRules) {
      const ruleId = await this.addReminderRule(rule);
      ruleIds.push(ruleId);
    }

    console.log(`📋 Created ${ruleIds.length} default reminder rules for ${userType} ${userId}`);
    return ruleIds;
  }

  /**
   * Monitor calendar events and create reminders
   */
  private async monitorCalendarEvents(): Promise<void> {
    if (!this.isActive) return;

    try {
      console.log('🔍 Monitoring calendar events for reminders...');

      // Get all users with reminder rules
      const userIds = new Set(Array.from(this.reminderRules.values()).map(rule => rule.userId));
      const userIdsArray = Array.from(userIds);

      for (const userId of userIdsArray) {
        await this.processUserEvents(userId);
      }

      // Process scheduled reminders
      await this.processScheduledReminders();

      console.log('✅ Calendar monitoring cycle completed');
    } catch (error) {
      console.error('Calendar monitoring failed:', error);
    }
  }

  /**
   * Process events for a specific user
   */
  private async processUserEvents(userId: string): Promise<void> {
    try {
      // Get user's calendars and events
      const calendars = await googleCalendarService.getUserCalendars(userId);
      const userRules = this.getReminderRules(userId);

      if (userRules.length === 0 || calendars.length === 0) return;

      // Get upcoming events (next 7 days)
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      for (const calendar of calendars) {
        const events = await googleCalendarService.getCalendarEvents(calendar.id);
        const upcomingEvents = events.filter(event => {
          const eventTime = new Date(event.start.dateTime || event.start.date || '');
          return eventTime >= now && eventTime <= nextWeek;
        });

        for (const event of upcomingEvents) {
          await this.processEventForUser(userId, event, userRules);
        }
      }
    } catch (error) {
      console.error(`Failed to process events for user ${userId}:`, error);
    }
  }

  /**
   * Process a single event for a user against their rules
   */
  private async processEventForUser(
    userId: string,
    event: GoogleCalendarEvent,
    rules: ReminderRule[]
  ): Promise<void> {
    const eventTime = new Date(event.start.dateTime || event.start.date || '');
    
    for (const rule of rules) {
      if (!rule.active) continue;

      // Check if rule applies to this event
      if (!this.doesRuleApplyToEvent(rule, event)) continue;

      // Create reminders for each offset
      for (const offsetMinutes of rule.offsetMinutes) {
        for (const reminderType of rule.reminderTypes) {
          const reminderTime = new Date(eventTime.getTime() - offsetMinutes * 60 * 1000);
          
          // Skip if reminder time has passed
          if (reminderTime <= new Date()) continue;

          // Check if we already have this reminder
          const existingReminderKey = `${rule.id}_${event.id}_${offsetMinutes}_${reminderType}`;
          if (this.scheduledReminders.has(existingReminderKey)) continue;

          const reminder: ReminderExecution = {
            id: existingReminderKey,
            ruleId: rule.id,
            eventId: event.id!,
            userId,
            reminderType,
            status: 'scheduled',
            scheduledTime: reminderTime,
            metadata: {
              eventTitle: event.summary,
              eventTime: eventTime,
              location: event.location,
              priority: this.determineEventPriority(event)
            }
          };

          this.scheduledReminders.set(reminder.id, reminder);
          
          // Schedule the reminder
          this.scheduleReminder(reminder);
        }
      }

      // Update rule's last triggered time
      rule.lastTriggered = new Date();
      this.reminderRules.set(rule.id, rule);
    }
  }

  /**
   * Check if a rule applies to a specific event
   */
  private doesRuleApplyToEvent(rule: ReminderRule, event: GoogleCalendarEvent): boolean {
    const eventTime = new Date(event.start.dateTime || event.start.date || '');
    
    // Check event type
    const eventType = event.extendedProperties?.private?.eventType || 'general';
    if (rule.eventTypes.length > 0 && !rule.eventTypes.includes(eventType)) {
      return false;
    }

    // Check conditions
    if (rule.conditions.minPriority) {
      const eventPriority = this.determineEventPriority(event);
      const priorities = ['low', 'normal', 'high', 'urgent'];
      const minIndex = priorities.indexOf(rule.conditions.minPriority);
      const eventIndex = priorities.indexOf(eventPriority);
      if (eventIndex < minIndex) return false;
    }

    // Check keywords
    if (rule.conditions.eventKeywords) {
      const hasKeyword = rule.conditions.eventKeywords.some(keyword =>
        event.summary.toLowerCase().includes(keyword.toLowerCase()) ||
        event.description?.toLowerCase().includes(keyword.toLowerCase())
      );
      if (!hasKeyword) return false;
    }

    // Check exclude keywords
    if (rule.conditions.excludeKeywords) {
      const hasExcludeKeyword = rule.conditions.excludeKeywords.some(keyword =>
        event.summary.toLowerCase().includes(keyword.toLowerCase()) ||
        event.description?.toLowerCase().includes(keyword.toLowerCase())
      );
      if (hasExcludeKeyword) return false;
    }

    // Check time of day
    if (rule.conditions.timeOfDay) {
      const eventHour = eventTime.getHours();
      const eventMinute = eventTime.getMinutes();
      const eventTimeStr = `${eventHour.toString().padStart(2, '0')}:${eventMinute.toString().padStart(2, '0')}`;
      
      if (eventTimeStr < rule.conditions.timeOfDay.start || eventTimeStr > rule.conditions.timeOfDay.end) {
        return false;
      }
    }

    // Check days of week
    if (rule.conditions.daysOfWeek) {
      const dayOfWeek = eventTime.getDay();
      if (!rule.conditions.daysOfWeek.includes(dayOfWeek)) {
        return false;
      }
    }

    // Check location
    if (rule.conditions.location && event.location) {
      if (!event.location.toLowerCase().includes(rule.conditions.location.toLowerCase())) {
        return false;
      }
    }

    return true;
  }

  /**
   * Process scheduled reminders that are due
   */
  private async processScheduledReminders(): Promise<void> {
    const now = new Date();
    const dueReminders = Array.from(this.scheduledReminders.values()).filter(
      reminder => reminder.status === 'scheduled' && reminder.scheduledTime <= now
    );

    for (const reminder of dueReminders) {
      await this.executeReminder(reminder);
    }
  }

  /**
   * Execute a reminder
   */
  private async executeReminder(reminder: ReminderExecution): Promise<void> {
    try {
      reminder.status = 'sent';
      reminder.executedTime = new Date();

      const message = this.generateReminderMessage(reminder);

      switch (reminder.reminderType) {
        case 'sms':
          await googleVoiceService.sendMessage(
            reminder.userId, // Would need to get phone number
            message,
            'general'
          );
          break;

        case 'voice':
          await googleVoiceService.makeCall(
            reminder.userId, // Would need to get phone number
            'general'
          );
          break;

        case 'voicemail':
          // Would implement voicemail sending
          console.log(`🎤 Sending voicemail reminder to ${reminder.userId}`);
          break;

        case 'notification':
          // Would implement push notification
          console.log(`🔔 Sending notification to ${reminder.userId}: ${message}`);
          break;
      }

      reminder.status = 'delivered';
      this.scheduledReminders.delete(reminder.id);
      this.executedReminders.set(reminder.id, reminder);

      console.log(`✅ Reminder executed: ${reminder.reminderType} for event "${reminder.metadata.eventTitle}"`);

    } catch (error) {
      reminder.status = 'failed';
      console.error(`Failed to execute reminder ${reminder.id}:`, error);
    }

    this.saveConfiguration();
  }

  /**
   * Schedule a reminder for execution
   */
  private scheduleReminder(reminder: ReminderExecution): void {
    const delay = reminder.scheduledTime.getTime() - Date.now();
    
    if (delay <= 0) {
      // Execute immediately if time has passed
      this.executeReminder(reminder);
    } else {
      // Schedule for future execution
      setTimeout(() => {
        this.executeReminder(reminder);
      }, delay);
      
      console.log(`⏰ Scheduled ${reminder.reminderType} reminder for "${reminder.metadata.eventTitle}" at ${reminder.scheduledTime.toLocaleString()}`);
    }
  }

  /**
   * Generate reminder message
   */
  private generateReminderMessage(reminder: ReminderExecution): string {
    const timeUntil = Math.max(0, Math.floor((reminder.metadata.eventTime.getTime() - Date.now()) / (60 * 1000)));
    const eventTimeStr = reminder.metadata.eventTime.toLocaleString();
    
    let message = `Reminder: You have "${reminder.metadata.eventTitle}"`;
    
    if (timeUntil === 0) {
      message += ' starting now';
    } else if (timeUntil < 60) {
      message += ` in ${timeUntil} minutes`;
    } else {
      const hours = Math.floor(timeUntil / 60);
      const minutes = timeUntil % 60;
      message += ` in ${hours} hour${hours > 1 ? 's' : ''}`;
      if (minutes > 0) {
        message += ` and ${minutes} minute${minutes > 1 ? 's' : ''}`;
      }
    }
    
    message += ` at ${eventTimeStr}`;
    
    if (reminder.metadata.location) {
      message += ` at ${reminder.metadata.location}`;
    }

    return message;
  }

  /**
   * Determine event priority based on content
   */
  private determineEventPriority(event: GoogleCalendarEvent): 'low' | 'normal' | 'high' | 'urgent' {
    const title = event.summary.toLowerCase();
    const description = event.description?.toLowerCase() || '';
    
    if (title.includes('emergency') || description.includes('emergency')) {
      return 'urgent';
    }
    if (title.includes('urgent') || description.includes('urgent')) {
      return 'urgent';
    }
    if (title.includes('important') || description.includes('important')) {
      return 'high';
    }
    if (title.includes('meeting') || title.includes('appointment')) {
      return 'high';
    }
    
    return 'normal';
  }

  /**
   * Calculate user satisfaction score
   */
  private calculateSatisfactionScore(reminders: ReminderExecution[]): number {
    if (reminders.length === 0) return 0;

    const acknowledgedCount = reminders.filter(r => r.response?.acknowledged).length;
    const successfulCount = reminders.filter(r => r.status === 'delivered').length;
    
    if (successfulCount === 0) return 0;
    
    return Math.round((acknowledgedCount / successfulCount) * 100);
  }

  /**
   * Load configuration from storage
   */
  private loadConfiguration(): void {
    try {
      const rulesData = localStorage.getItem('calendar_reminder_rules');
      if (rulesData) {
        const rules = JSON.parse(rulesData);
        this.reminderRules = new Map(Object.entries(rules));
      }

      const scheduledData = localStorage.getItem('scheduled_reminders');
      if (scheduledData) {
        const scheduled = JSON.parse(scheduledData);
        this.scheduledReminders = new Map(Object.entries(scheduled).map(([key, value]: [string, any]) => [
          key, 
          {
            ...value,
            scheduledTime: new Date(value.scheduledTime),
            executedTime: value.executedTime ? new Date(value.executedTime) : undefined
          }
        ]));
      }

      const executedData = localStorage.getItem('executed_reminders');
      if (executedData) {
        const executed = JSON.parse(executedData);
        this.executedReminders = new Map(Object.entries(executed).map(([key, value]: [string, any]) => [
          key,
          {
            ...value,
            scheduledTime: new Date(value.scheduledTime),
            executedTime: value.executedTime ? new Date(value.executedTime) : undefined,
            response: value.response ? {
              ...value.response,
              responseTime: value.response.responseTime ? new Date(value.response.responseTime) : undefined
            } : undefined
          }
        ]));
      }

    } catch (error) {
      console.error('Failed to load calendar reminder configuration:', error);
    }
  }

  /**
   * Save configuration to storage
   */
  private saveConfiguration(): void {
    try {
      const rulesData = Object.fromEntries(this.reminderRules.entries());
      localStorage.setItem('calendar_reminder_rules', JSON.stringify(rulesData));

      const scheduledData = Object.fromEntries(this.scheduledReminders.entries());
      localStorage.setItem('scheduled_reminders', JSON.stringify(scheduledData));

      const executedData = Object.fromEntries(this.executedReminders.entries());
      localStorage.setItem('executed_reminders', JSON.stringify(executedData));
    } catch (error) {
      console.error('Failed to save calendar reminder configuration:', error);
    }
  }
}

export const calendarReminderAgent = new CalendarReminderAgent();