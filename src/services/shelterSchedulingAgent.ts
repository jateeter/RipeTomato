/**
 * Shelter Scheduling Notification Agent
 * 
 * Provides automated monitoring and notification services for shelter-related
 * scheduling events using the unified data ownership model.
 * 
 * @license MIT
 */

import { v4 as uuidv4 } from 'uuid';
import {
  ShelterSchedulingAgent,
  SchedulingEventType,
  NotificationChannel,
  AgentConfiguration,
  EscalationRule,
  NotificationTemplate,
  AgentFilter,
  AgentStats
} from '../types/WalletVerification';
import { Client, BedReservation } from '../types/Shelter';
import { unifiedDataOwnershipService } from './unifiedDataOwnershipService';

interface SchedulingEvent {
  eventId: string;
  eventType: SchedulingEventType;
  clientId?: string;
  bedReservationId?: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'emergency';
  data: Record<string, any>;
  processed: boolean;
}

interface NotificationDelivery {
  deliveryId: string;
  eventId: string;
  channel: NotificationChannel;
  recipient: string;
  message: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'opened';
  sentAt?: Date;
  deliveredAt?: Date;
  error?: string;
}

class ShelterSchedulingAgentImpl implements ShelterSchedulingAgent {
  public agentId: string;
  public agentName: string;
  public isActive: boolean;
  public monitoredEvents: SchedulingEventType[];
  public notificationChannels: NotificationChannel[];
  public configuration: AgentConfiguration;
  public stats: AgentStats;

  private eventQueue: SchedulingEvent[] = [];
  private deliveryQueue: NotificationDelivery[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private clients: Map<string, Client> = new Map();
  private bedReservations: Map<string, BedReservation> = new Map();

  constructor() {
    this.agentId = uuidv4();
    this.agentName = 'Idaho Shelter Scheduling Agent';
    this.isActive = true;
    this.monitoredEvents = [
      'bed_reservation_created',
      'bed_reservation_cancelled',
      'check_in_due',
      'check_in_overdue',
      'no_show_detected',
      'bed_availability_low',
      'waiting_list_updated',
      'emergency_bed_needed',
      'maintenance_scheduled',
      'staff_schedule_change'
    ];
    
    this.notificationChannels = this.initializeNotificationChannels();
    this.configuration = this.initializeConfiguration();
    this.stats = this.initializeStats();

    // Start monitoring
    this.startMonitoring();
    
    console.log(`🤖 Shelter Scheduling Agent initialized: ${this.agentId}`);
  }

  /**
   * Start the monitoring process
   */
  private startMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(() => {
      this.processSchedulingEvents();
    }, this.configuration.checkInterval * 60 * 1000); // Convert minutes to milliseconds

    console.log(`🔄 Monitoring started with ${this.configuration.checkInterval}m intervals`);
  }

  /**
   * Stop the monitoring process
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isActive = false;
    console.log(`⏹️ Monitoring stopped for agent: ${this.agentId}`);
  }

  /**
   * Process all pending scheduling events
   */
  private async processSchedulingEvents(): Promise<void> {
    try {
      // Generate new events based on current system state
      await this.detectSchedulingEvents();
      
      // Process queued events
      const unprocessedEvents = this.eventQueue.filter(event => !event.processed);
      
      for (const event of unprocessedEvents) {
        await this.processEvent(event);
        event.processed = true;
      }

      // Clean up old processed events (keep last 24 hours)
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      this.eventQueue = this.eventQueue.filter(event => event.timestamp > cutoff);

      // Process notification deliveries
      await this.processNotificationDeliveries();

      // Update stats
      this.updateStats();

      console.log(`📊 Processed ${unprocessedEvents.length} scheduling events`);

    } catch (error) {
      console.error('Error processing scheduling events:', error);
      this.stats.failedDeliveries++;
    }
  }

  /**
   * Detect new scheduling events based on system state
   */
  private async detectSchedulingEvents(): Promise<void> {
    const now = new Date();
    
    // Check for check-in due events
    for (const reservation of Array.from(this.bedReservations.values())) {
      if (reservation.status === 'reserved' && reservation.checkInTime) {
        const checkInTime = new Date(reservation.checkInTime);
        const timeDiff = checkInTime.getTime() - now.getTime();
        const hoursUntilCheckIn = timeDiff / (1000 * 60 * 60);
        
        // Notify 2 hours before check-in
        if (hoursUntilCheckIn <= 2 && hoursUntilCheckIn > 1.5) {
          this.addEvent('check_in_due', 'medium', {
            bedReservationId: reservation.id,
            clientId: reservation.clientId,
            checkInTime: checkInTime.toISOString(),
            location: `Bed ID: ${reservation.bedId}`
          });
        }
        
        // Check for overdue check-ins (30 minutes past scheduled time)
        if (hoursUntilCheckIn < -0.5) {
          this.addEvent('check_in_overdue', 'high', {
            bedReservationId: reservation.id,
            clientId: reservation.clientId,
            overdueMinutes: Math.abs(Math.floor(hoursUntilCheckIn * 60)),
            location: `Bed ID: ${reservation.bedId}`
          });
        }
      }
    }

    // Check bed availability
    const totalBeds = 50; // This would come from bed management system
    const occupiedBeds = Array.from(this.bedReservations.values())
      .filter(r => r.status === 'checked-in').length;
    const availableBeds = totalBeds - occupiedBeds;
    const occupancyRate = (occupiedBeds / totalBeds) * 100;
    
    if (occupancyRate >= 90) {
      this.addEvent('bed_availability_low', 'high', {
        totalBeds,
        occupiedBeds,
        availableBeds,
        occupancyRate
      });
    }

    // Check for no-shows (2+ hours past check-in with no contact)
    for (const reservation of Array.from(this.bedReservations.values())) {
      if (reservation.status === 'reserved' && reservation.checkInTime) {
        const checkInTime = new Date(reservation.checkInTime);
        const hoursOverdue = (now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
        
        if (hoursOverdue >= 2) {
          this.addEvent('no_show_detected', 'medium', {
            bedReservationId: reservation.id,
            clientId: reservation.clientId,
            hoursOverdue: Math.floor(hoursOverdue),
            scheduledCheckIn: checkInTime.toISOString()
          });
        }
      }
    }
  }

  /**
   * Add a new scheduling event to the queue
   */
  private addEvent(eventType: SchedulingEventType, priority: 'low' | 'medium' | 'high' | 'urgent' | 'emergency', data: Record<string, any>): void {
    // Check if we already have a recent similar event to avoid duplicates
    const recentCutoff = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes
    const existingEvent = this.eventQueue.find(event => 
      event.eventType === eventType &&
      event.timestamp > recentCutoff &&
      JSON.stringify(event.data) === JSON.stringify(data)
    );
    
    if (existingEvent) {
      return; // Don't duplicate recent events
    }

    const event: SchedulingEvent = {
      eventId: uuidv4(),
      eventType,
      clientId: data.clientId,
      bedReservationId: data.bedReservationId,
      timestamp: new Date(),
      priority,
      data,
      processed: false
    };

    this.eventQueue.push(event);
    console.log(`📅 New scheduling event: ${eventType} (${priority})`);
  }

  /**
   * Process a single scheduling event
   */
  private async processEvent(event: SchedulingEvent): Promise<void> {
    try {
      // Apply filters
      if (!this.shouldProcessEvent(event)) {
        console.log(`🚫 Event filtered out: ${event.eventType}`);
        return;
      }

      // Get notification template
      const template = this.getNotificationTemplate(event.eventType, 'sms'); // Default to SMS
      if (!template) {
        console.warn(`📝 No notification template found for event: ${event.eventType}`);
        return;
      }

      // Generate notification message
      const message = this.generateNotificationMessage(template, event);

      // Determine recipients
      const recipients = await this.getNotificationRecipients(event);

      // Send notifications through enabled channels
      for (const channel of this.notificationChannels.filter(c => c.isEnabled)) {
        for (const recipient of recipients) {
          await this.sendNotification(event, channel, recipient, message);
        }
      }

      // Handle escalation if needed
      await this.handleEscalation(event);

      this.stats.totalNotifications++;
      this.stats.notificationsToday++;

    } catch (error) {
      console.error(`Failed to process event ${event.eventId}:`, error);
      this.stats.failedDeliveries++;
    }
  }

  /**
   * Send a notification through a specific channel
   */
  private async sendNotification(
    event: SchedulingEvent,
    channel: NotificationChannel,
    recipient: string,
    message: string
  ): Promise<void> {
    const delivery: NotificationDelivery = {
      deliveryId: uuidv4(),
      eventId: event.eventId,
      channel,
      recipient,
      message,
      status: 'pending'
    };

    this.deliveryQueue.push(delivery);

    try {
      // Simulate notification delivery based on channel type
      switch (channel.channelType) {
        case 'sms':
          await this.sendSMS(recipient, message);
          break;
        case 'push':
          await this.sendPushNotification(recipient, message);
          break;
        case 'email':
          await this.sendEmail(recipient, message);
          break;
        case 'in_app':
          await this.sendInAppNotification(recipient, message);
          break;
        case 'voice':
          await this.makeVoiceCall(recipient, message);
          break;
        case 'webhook':
          await this.sendWebhook(channel.configuration.url, { event, message });
          break;
        default:
          throw new Error(`Unsupported channel type: ${channel.channelType}`);
      }

      delivery.status = 'sent';
      delivery.sentAt = new Date();
      channel.deliveryStats.sent++;

      // Simulate delivery confirmation (would be real in production)
      setTimeout(() => {
        delivery.status = 'delivered';
        delivery.deliveredAt = new Date();
        channel.deliveryStats.delivered++;
      }, 1000);

      console.log(`📱 Notification sent via ${channel.channelType} to ${recipient}`);

    } catch (error) {
      delivery.status = 'failed';
      delivery.error = error instanceof Error ? error.message : 'Unknown error';
      channel.deliveryStats.failed++;
      console.error(`Failed to send ${channel.channelType} notification:`, error);
    }
  }

  /**
   * Check if event should be processed based on filters
   */
  private shouldProcessEvent(event: SchedulingEvent): boolean {
    // Check business hours
    const now = new Date();
    const hour = now.getHours();
    const businessStart = parseInt(this.configuration.businessHours.start.split(':')[0]);
    const businessEnd = parseInt(this.configuration.businessHours.end.split(':')[0]);
    
    const isBusinessHours = hour >= businessStart && hour < businessEnd;
    
    // Emergency events bypass business hours
    if (event.priority === 'emergency' || event.priority === 'urgent') {
      return true;
    }
    
    // Apply custom filters
    for (const filter of this.configuration.filters) {
      if (!this.applyFilter(filter, event)) {
        return false;
      }
    }
    
    return isBusinessHours;
  }

  /**
   * Get notification recipients for an event
   */
  private async getNotificationRecipients(event: SchedulingEvent): Promise<string[]> {
    const recipients: string[] = [];
    
    // Add client if available and event relates to them
    if (event.clientId) {
      const client = this.clients.get(event.clientId);
      if (client?.phone) {
        recipients.push(client.phone);
      }
      
      // Get client's emergency contacts from unified data
      const owner = await unifiedDataOwnershipService.getDataOwner(event.clientId);
      if (owner) {
        // Add emergency contacts for high priority events
        if (event.priority === 'high' || event.priority === 'urgent' || event.priority === 'emergency') {
          // Would retrieve emergency contacts from unified data here
        }
      }
    }
    
    // Add staff/management contacts for system events
    const systemEvents: SchedulingEventType[] = [
      'bed_availability_low',
      'maintenance_scheduled',
      'staff_schedule_change'
    ];
    
    if (systemEvents.includes(event.eventType)) {
      // Add staff notification numbers (would come from staff management system)
      recipients.push('+1234567890'); // Placeholder staff number
    }
    
    return recipients;
  }

  /**
   * Generate notification message from template and event data
   */
  private generateNotificationMessage(template: NotificationTemplate, event: SchedulingEvent): string {
    let message = template.message;
    
    // Replace template variables
    for (const variable of template.variables) {
      const value = this.getVariableValue(variable, event);
      message = message.replace(`{{${variable}}}`, value);
    }
    
    return message;
  }

  /**
   * Get value for template variable
   */
  private getVariableValue(variable: string, event: SchedulingEvent): string {
    switch (variable) {
      case 'clientName':
        if (event.clientId) {
          const client = this.clients.get(event.clientId);
          return client ? `${client.firstName} ${client.lastName}` : 'Unknown Client';
        }
        return 'N/A';
      case 'bedId':
        return event.data.bedId || event.data.location || 'TBD';
      case 'checkInTime':
        return event.data.checkInTime ? new Date(event.data.checkInTime).toLocaleString() : 'TBD';
      case 'availableBeds':
        return event.data.availableBeds?.toString() || '0';
      case 'occupancyRate':
        return event.data.occupancyRate ? `${Math.round(event.data.occupancyRate)}%` : '0%';
      case 'eventTime':
        return event.timestamp.toLocaleString();
      default:
        return event.data[variable]?.toString() || '';
    }
  }

  // Notification delivery methods (simulated)
  private async sendSMS(phone: string, message: string): Promise<void> {
    console.log(`📱 SMS to ${phone}: ${message}`);
    // In real implementation, integrate with Twilio or similar service
  }

  private async sendPushNotification(deviceToken: string, message: string): Promise<void> {
    console.log(`🔔 Push to ${deviceToken}: ${message}`);
    // In real implementation, integrate with FCM or APNS
  }

  private async sendEmail(email: string, message: string): Promise<void> {
    console.log(`📧 Email to ${email}: ${message}`);
    // In real implementation, integrate with SendGrid or similar
  }

  private async sendInAppNotification(userId: string, message: string): Promise<void> {
    console.log(`📱 In-app to ${userId}: ${message}`);
    // In real implementation, store in database for app to retrieve
  }

  private async makeVoiceCall(phone: string, message: string): Promise<void> {
    console.log(`📞 Voice call to ${phone}: ${message}`);
    // In real implementation, integrate with Twilio Voice API
  }

  private async sendWebhook(url: string, payload: any): Promise<void> {
    console.log(`🔗 Webhook to ${url}:`, payload);
    // In real implementation, make HTTP POST request
  }

  // Helper methods
  private initializeNotificationChannels(): NotificationChannel[] {
    return [
      {
        channelType: 'sms',
        channelId: 'primary-sms',
        isEnabled: true,
        configuration: { provider: 'twilio' },
        deliveryStats: { sent: 0, delivered: 0, failed: 0, opened: 0 }
      },
      {
        channelType: 'push',
        channelId: 'mobile-push',
        isEnabled: true,
        configuration: { provider: 'fcm' },
        deliveryStats: { sent: 0, delivered: 0, failed: 0, opened: 0 }
      },
      {
        channelType: 'in_app',
        channelId: 'app-notifications',
        isEnabled: true,
        configuration: {},
        deliveryStats: { sent: 0, delivered: 0, failed: 0, opened: 0 }
      }
    ];
  }

  private initializeConfiguration(): AgentConfiguration {
    return {
      checkInterval: 5, // Check every 5 minutes
      businessHours: {
        start: '06:00',
        end: '22:00',
        timezone: 'America/Boise'
      },
      escalationRules: [
        {
          ruleId: uuidv4(),
          eventType: 'emergency_bed_needed',
          condition: 'priority=emergency',
          escalationDelay: 5, // 5 minutes
          escalationTarget: 'manager',
          maxEscalations: 3,
          isActive: true
        },
        {
          ruleId: uuidv4(),
          eventType: 'check_in_overdue',
          condition: 'overdueMinutes>=60',
          escalationDelay: 15,
          escalationTarget: 'supervisor',
          maxEscalations: 2,
          isActive: true
        }
      ],
      notificationTemplates: [
        {
          templateId: uuidv4(),
          eventType: 'check_in_due',
          channel: 'sms',
          message: 'Hi {{clientName}}, your check-in at Idaho Shelter is scheduled for {{checkInTime}} at {{bedId}}. Please arrive on time.',
          variables: ['clientName', 'checkInTime', 'bedId'],
          priority: 'medium'
        },
        {
          templateId: uuidv4(),
          eventType: 'bed_availability_low',
          channel: 'sms',
          message: 'ALERT: Bed availability low. {{availableBeds}} beds remaining ({{occupancyRate}} occupancy). Consider activating overflow protocol.',
          variables: ['availableBeds', 'occupancyRate'],
          priority: 'high'
        },
        {
          templateId: uuidv4(),
          eventType: 'check_in_overdue',
          channel: 'sms',
          message: 'Check-in overdue for {{clientName}} at {{bedId}}. Scheduled {{checkInTime}}. Please contact client or update reservation.',
          variables: ['clientName', 'bedId', 'checkInTime'],
          priority: 'high'
        }
      ],
      filters: []
    };
  }

  private initializeStats(): AgentStats {
    return {
      totalNotifications: 0,
      notificationsToday: 0,
      successfulDeliveries: 0,
      failedDeliveries: 0,
      averageResponseTime: 0,
      lastActivity: new Date(),
      uptime: 100
    };
  }

  private updateStats(): void {
    this.stats.lastActivity = new Date();
    
    // Calculate successful deliveries
    const deliveredCount = this.deliveryQueue.filter(d => d.status === 'delivered').length;
    this.stats.successfulDeliveries = deliveredCount;
    
    // Reset daily stats if it's a new day
    const now = new Date();
    const lastActivity = new Date(this.stats.lastActivity);
    if (now.getDate() !== lastActivity.getDate()) {
      this.stats.notificationsToday = 0;
    }
  }

  private async processNotificationDeliveries(): Promise<void> {
    // Process pending deliveries (simulated)
    const pendingDeliveries = this.deliveryQueue.filter(d => d.status === 'pending');
    for (const delivery of pendingDeliveries) {
      // Simulate processing time
      if (delivery.sentAt && Date.now() - delivery.sentAt.getTime() > 5000) {
        delivery.status = 'delivered';
        delivery.deliveredAt = new Date();
      }
    }
  }

  private async handleEscalation(event: SchedulingEvent): Promise<void> {
    const escalationRules = this.configuration.escalationRules
      .filter(rule => rule.eventType === event.eventType && rule.isActive);
    
    for (const rule of escalationRules) {
      // Check if escalation conditions are met
      if (this.evaluateEscalationCondition(rule.condition, event)) {
        console.log(`⏫ Escalating event ${event.eventId} to ${rule.escalationTarget}`);
        // In real implementation, would create escalated notifications
      }
    }
  }

  private applyFilter(filter: AgentFilter, event: SchedulingEvent): boolean {
    // Simplified filter implementation
    return true; // For demo, allow all events
  }

  private getNotificationTemplate(eventType: SchedulingEventType, channel: string): NotificationTemplate | undefined {
    return this.configuration.notificationTemplates.find(
      t => t.eventType === eventType && t.channel === channel
    );
  }

  private evaluateEscalationCondition(condition: string, event: SchedulingEvent): boolean {
    // Simplified condition evaluation
    return event.priority === 'emergency' || event.priority === 'urgent';
  }

  // Public interface methods
  public addBedReservation(reservation: BedReservation): void {
    this.bedReservations.set(reservation.id, reservation);
    
    // Trigger bed reservation created event
    this.addEvent('bed_reservation_created', 'medium', {
      bedReservationId: reservation.id,
      clientId: reservation.clientId,
      bedId: reservation.bedId,
      checkInTime: reservation.checkInTime?.toISOString()
    });
  }

  public addClient(client: Client): void {
    this.clients.set(client.id, client);
  }

  public updateConfiguration(updates: Partial<AgentConfiguration>): void {
    this.configuration = { ...this.configuration, ...updates };
    console.log('🔧 Agent configuration updated');
  }

  public getStats(): AgentStats {
    this.updateStats();
    return { ...this.stats };
  }
}

export const shelterSchedulingAgent = new ShelterSchedulingAgentImpl();