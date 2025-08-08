import { v4 as uuidv4 } from 'uuid';
import { 
  BPMonitoringAgent, 
  BloodPressureThreshold, 
  BloodPressureReading, 
  BPAlertTrigger, 
  ParticipantAlert,
  AgentLog,
  NotificationTemplate,
  EscalationRule
} from '../types/AgentServices';
import { googleVoiceService } from './googleVoiceService';
import { healthKitService } from './healthKitService';
import { HealthMetrics } from '../types/Health';

class BloodPressureMonitoringAgent {
  private agent: BPMonitoringAgent;
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private logs: AgentLog[] = [];
  private recentReadings: BloodPressureReading[] = [];
  private activeAlerts: BPAlertTrigger[] = [];

  // Standard BP thresholds based on AHA guidelines
  private readonly standardThresholds: BloodPressureThreshold[] = [
    {
      id: 'normal',
      name: 'Normal',
      systolicMax: 120,
      diastolicMax: 80,
      severity: 'normal',
      description: 'Normal blood pressure',
      color: '#10B981',
      requiresImmediate: false,
      alertStaff: false,
      alertEmergency: false
    },
    {
      id: 'elevated',
      name: 'Elevated',
      systolicMin: 120,
      systolicMax: 129,
      diastolicMax: 80,
      severity: 'elevated',
      description: 'Elevated blood pressure',
      color: '#F59E0B',
      requiresImmediate: false,
      alertStaff: true,
      alertEmergency: false
    },
    {
      id: 'stage1',
      name: 'Stage 1 Hypertension',
      systolicMin: 130,
      systolicMax: 139,
      diastolicMin: 80,
      diastolicMax: 89,
      severity: 'stage1',
      description: 'Stage 1 High Blood Pressure',
      color: '#F97316',
      requiresImmediate: false,
      alertStaff: true,
      alertEmergency: false
    },
    {
      id: 'stage2',
      name: 'Stage 2 Hypertension',
      systolicMin: 140,
      systolicMax: 179,
      diastolicMin: 90,
      diastolicMax: 119,
      severity: 'stage2',
      description: 'Stage 2 High Blood Pressure',
      color: '#EF4444',
      requiresImmediate: true,
      alertStaff: true,
      alertEmergency: false
    },
    {
      id: 'crisis',
      name: 'Hypertensive Crisis',
      systolicMin: 180,
      diastolicMin: 120,
      severity: 'crisis',
      description: 'Hypertensive Crisis - Immediate Medical Attention Required',
      color: '#DC2626',
      requiresImmediate: true,
      alertStaff: true,
      alertEmergency: true
    },
    {
      id: 'low',
      name: 'Low Blood Pressure',
      systolicMax: 90,
      diastolicMax: 60,
      severity: 'low',
      description: 'Low blood pressure (Hypotension)',
      color: '#6366F1',
      requiresImmediate: true,
      alertStaff: true,
      alertEmergency: false
    }
  ];

  private readonly notificationTemplates: NotificationTemplate[] = [
    {
      id: 'bp_elevated_sms',
      name: 'Elevated BP SMS Alert',
      type: 'sms',
      category: 'bp_elevated',
      severity: 'warning',
      template: '⚠️ HEALTH ALERT: Your blood pressure reading is elevated ({systolic}/{diastolic}). Please rest and recheck in 15 minutes. If it remains high, contact your healthcare provider. - Idaho Community Shelter',
      variables: ['clientName', 'systolic', 'diastolic', 'timestamp'],
      language: 'en',
      isActive: true,
      usageCount: 0,
      createdAt: new Date()
    },
    {
      id: 'bp_high_sms',
      name: 'High BP SMS Alert',
      type: 'sms',
      category: 'bp_high',
      severity: 'critical',
      template: '🚨 CRITICAL HEALTH ALERT: Your blood pressure ({systolic}/{diastolic}) is dangerously high. Seek immediate medical attention. Staff have been notified. Call 911 if experiencing chest pain, shortness of breath, or severe headache.',
      variables: ['clientName', 'systolic', 'diastolic', 'timestamp'],
      language: 'en',
      isActive: true,
      usageCount: 0,
      createdAt: new Date()
    },
    {
      id: 'bp_crisis_sms',
      name: 'Hypertensive Crisis SMS Alert',
      type: 'sms',
      category: 'bp_crisis',
      severity: 'critical',
      template: '🆘 MEDICAL EMERGENCY: Hypertensive crisis detected ({systolic}/{diastolic}). Call 911 IMMEDIATELY. Do not wait. Emergency services and medical staff have been notified. Stay calm and seek immediate medical care.',
      variables: ['clientName', 'systolic', 'diastolic', 'timestamp'],
      language: 'en',
      isActive: true,
      usageCount: 0,
      createdAt: new Date()
    },
    {
      id: 'bp_low_sms',
      name: 'Low BP SMS Alert',
      type: 'sms',
      category: 'bp_low',
      severity: 'warning',
      template: '💙 HEALTH NOTICE: Your blood pressure is low ({systolic}/{diastolic}). Please sit down, drink water, and avoid sudden movements. Staff have been notified. If you feel dizzy or faint, seek immediate assistance.',
      variables: ['clientName', 'systolic', 'diastolic', 'timestamp'],
      language: 'en',
      isActive: true,
      usageCount: 0,
      createdAt: new Date()
    },
    {
      id: 'staff_bp_alert',
      name: 'Staff BP Alert',
      type: 'sms',
      category: 'bp_high',
      severity: 'critical',
      template: '🏥 STAFF ALERT: Client {clientName} has {severity} blood pressure ({systolic}/{diastolic}) at {timestamp}. Client has been notified. Please check on them immediately and assess need for medical intervention.',
      variables: ['clientName', 'systolic', 'diastolic', 'timestamp', 'severity'],
      language: 'en',
      isActive: true,
      usageCount: 0,
      createdAt: new Date()
    }
  ];

  constructor() {
    this.agent = {
      id: uuidv4(),
      name: 'Blood Pressure Monitoring Agent',
      type: 'blood_pressure_monitor',
      description: 'Monitors blood pressure readings and sends automated SMS alerts when thresholds are exceeded',
      isActive: false,
      configuration: {
        checkInterval: 5, // Check every 5 minutes
        enabledThresholds: ['elevated', 'stage1', 'stage2', 'crisis', 'low'],
        participantIds: [],
        businessHoursOnly: false,
        maxAlertsPerHour: 3,
        escalationDelay: 15, // 15 minutes
        staffNotificationList: ['+12085551111', '+12085552222'], // Supervisor, Nurse
        emergencyNotificationList: ['+1911', '+12085559911'],
        silentHours: {
          start: '22:00',
          end: '06:00'
        },
        dataSourcePriority: ['healthkit', 'device', 'manual'],
        minimumReadingAge: 10 // Only process readings from last 10 minutes
      },
      runInterval: 5,
      stats: {
        totalRuns: 0,
        totalAlerts: 0,
        successRate: 100,
      },
      createdAt: new Date(),
      createdBy: 'system'
    };
  }

  /**
   * Start the monitoring agent
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.log('warning', 'Agent already running');
      return;
    }

    this.agent.isActive = true;
    this.isRunning = true;
    
    this.log('info', 'Blood pressure monitoring agent started');
    
    // Initial check
    await this.performMonitoringCheck();
    
    // Set up recurring checks
    this.intervalId = setInterval(async () => {
      await this.performMonitoringCheck();
    }, this.agent.configuration.checkInterval * 60 * 1000);
  }

  /**
   * Stop the monitoring agent
   */
  stop(): void {
    if (!this.isRunning) return;

    this.agent.isActive = false;
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.log('info', 'Blood pressure monitoring agent stopped');
  }

  /**
   * Register a participant for monitoring
   */
  registerParticipant(participant: Omit<ParticipantAlert, 'id' | 'registeredAt'>): string {
    const participantAlert: ParticipantAlert = {
      id: uuidv4(),
      registeredAt: new Date(),
      ...participant
    };

    // Add to agent configuration
    if (!this.agent.configuration.participantIds.includes(participant.clientId)) {
      this.agent.configuration.participantIds.push(participant.clientId);
    }

    this.log('info', `Participant ${participant.clientName} registered for BP monitoring`, {
      clientId: participant.clientId,
      thresholds: participant.thresholds
    });

    return participantAlert.id;
  }

  /**
   * Perform a monitoring check cycle
   */
  private async performMonitoringCheck(): Promise<void> {
    try {
      this.agent.stats.totalRuns++;
      this.agent.lastRun = new Date();
      
      this.log('debug', 'Starting monitoring check cycle');

      // Get recent health data for all monitored participants
      const participantIds = this.agent.configuration.participantIds;
      
      for (const clientId of participantIds) {
        await this.checkParticipantBP(clientId);
      }

      // Update next run time
      this.agent.nextRun = new Date(Date.now() + (this.agent.runInterval * 60 * 1000));
      
    } catch (error) {
      this.log('error', 'Monitoring check failed', { error: error instanceof Error ? error.message : String(error) });
      this.agent.stats.lastError = error instanceof Error ? error.message : String(error);
    }
  }

  /**
   * Check blood pressure for a specific participant
   */
  private async checkParticipantBP(clientId: string): Promise<void> {
    try {
      // Get recent health metrics from HealthKit service
      const healthMetrics = await healthKitService.syncHealthData(clientId);
      
      if (!healthMetrics || healthMetrics.length === 0) {
        this.log('debug', `No health data available for client ${clientId}`);
        return;
      }

      // Get the most recent reading
      const latestMetrics = healthMetrics[0];
      
      if (!latestMetrics.bloodPressure) {
        this.log('debug', `No blood pressure data for client ${clientId}`);
        return;
      }

      const reading: BloodPressureReading = {
        id: uuidv4(),
        clientId,
        systolic: latestMetrics.bloodPressure.systolic,
        diastolic: latestMetrics.bloodPressure.diastolic,
        heartRate: latestMetrics.heartRate,
        timestamp: latestMetrics.timestamp,
        source: 'healthkit',
        verified: true
      };

      // Check if reading is recent enough
      const readingAge = (Date.now() - reading.timestamp.getTime()) / (1000 * 60); // Minutes
      if (readingAge > this.agent.configuration.minimumReadingAge) {
        this.log('debug', `BP reading too old (${readingAge.toFixed(1)} min) for client ${clientId}`);
        return;
      }

      // Add to recent readings
      this.recentReadings.unshift(reading);
      this.recentReadings = this.recentReadings.slice(0, 100); // Keep last 100 readings

      // Analyze reading against thresholds
      await this.analyzeBloodPressureReading(reading);

    } catch (error) {
      this.log('error', `Failed to check BP for client ${clientId}`, { 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * Analyze blood pressure reading against thresholds
   */
  private async analyzeBloodPressureReading(reading: BloodPressureReading): Promise<void> {
    const { systolic, diastolic } = reading;
    
    // Find matching threshold
    const triggeredThreshold = this.standardThresholds.find(threshold => {
      // Skip normal threshold for alerts
      if (threshold.severity === 'normal') return false;
      
      // Check if threshold is enabled
      if (!this.agent.configuration.enabledThresholds.includes(threshold.id)) return false;

      // Check systolic conditions
      const systolicMatch = 
        (threshold.systolicMin === undefined || systolic >= threshold.systolicMin) &&
        (threshold.systolicMax === undefined || systolic <= threshold.systolicMax);

      // Check diastolic conditions
      const diastolicMatch = 
        (threshold.diastolicMin === undefined || diastolic >= threshold.diastolicMin) &&
        (threshold.diastolicMax === undefined || diastolic <= threshold.diastolicMax);

      // For crisis and stage2, either systolic OR diastolic can trigger
      if (threshold.severity === 'crisis' || threshold.severity === 'stage2') {
        return (threshold.systolicMin && systolic >= threshold.systolicMin) ||
               (threshold.diastolicMin && diastolic >= threshold.diastolicMin);
      }

      // For other thresholds, both conditions must match
      return systolicMatch && diastolicMatch;
    });

    if (!triggeredThreshold) {
      this.log('debug', `BP reading ${systolic}/${diastolic} within normal thresholds for client ${reading.clientId}`);
      return;
    }

    // Check if we should suppress alerts (silent hours, frequency limits, etc.)
    if (await this.shouldSuppressAlert(reading.clientId, triggeredThreshold)) {
      return;
    }

    // Create alert trigger
    const alertTrigger: BPAlertTrigger = {
      id: uuidv4(),
      readingId: reading.id,
      clientId: reading.clientId,
      clientName: `Client ${reading.clientId}`, // In real app, get from client database
      thresholdId: triggeredThreshold.id,
      thresholdName: triggeredThreshold.name,
      severity: triggeredThreshold.severity,
      systolic,
      diastolic,
      heartRate: reading.heartRate,
      triggeredAt: new Date(),
      alertsSent: {
        sms: false,
        voice: false,
        staff: false,
        emergency: false
      },
      responses: {
        clientResponded: false,
        staffResponded: false,
        actions: []
      },
      status: 'active'
    };

    this.activeAlerts.push(alertTrigger);
    this.agent.stats.totalAlerts++;

    this.log('warning', `BP threshold exceeded: ${triggeredThreshold.name}`, {
      clientId: reading.clientId,
      systolic,
      diastolic,
      severity: triggeredThreshold.severity
    });

    // Send notifications
    await this.sendBloodPressureAlert(alertTrigger, triggeredThreshold);
  }

  /**
   * Send blood pressure alert notifications
   */
  private async sendBloodPressureAlert(alert: BPAlertTrigger, threshold: BloodPressureThreshold): Promise<void> {
    try {
      // Get client phone number (mock for demo)
      const clientPhone = `+1208555${String(Math.floor(Math.random() * 9000) + 1000)}`;

      // Send SMS to client
      const template = this.getNotificationTemplate(threshold.severity);
      if (template) {
        const message = this.formatNotificationMessage(template.template, {
          clientName: alert.clientName,
          systolic: alert.systolic.toString(),
          diastolic: alert.diastolic.toString(),
          timestamp: alert.triggeredAt.toLocaleString(),
          severity: threshold.name
        });

        await googleVoiceService.sendMessage(clientPhone, message, 'emergency');
        alert.alertsSent.sms = true;
        
        this.log('info', `SMS alert sent to client ${alert.clientId}`, {
          phone: clientPhone,
          severity: threshold.severity
        });
      }

      // Notify staff if required
      if (threshold.alertStaff) {
        const staffTemplate = this.notificationTemplates.find(t => t.id === 'staff_bp_alert');
        if (staffTemplate) {
          const staffMessage = this.formatNotificationMessage(staffTemplate.template, {
            clientName: alert.clientName,
            systolic: alert.systolic.toString(),
            diastolic: alert.diastolic.toString(),
            timestamp: alert.triggeredAt.toLocaleString(),
            severity: threshold.name
          });

          for (const staffPhone of this.agent.configuration.staffNotificationList) {
            await googleVoiceService.sendMessage(staffPhone, staffMessage, 'emergency');
          }
          
          alert.alertsSent.staff = true;
          this.log('info', `Staff notifications sent for client ${alert.clientId}`, {
            staffCount: this.agent.configuration.staffNotificationList.length
          });
        }
      }

      // Emergency notifications for crisis situations
      if (threshold.alertEmergency) {
        const emergencyMessage = `🆘 MEDICAL EMERGENCY: Client ${alert.clientName} has hypertensive crisis (${alert.systolic}/${alert.diastolic}). Immediate medical intervention required at Idaho Community Shelter.`;
        
        for (const emergencyPhone of this.agent.configuration.emergencyNotificationList) {
          if (emergencyPhone !== '+1911') { // Don't SMS 911
            await googleVoiceService.sendMessage(emergencyPhone, emergencyMessage, 'emergency');
          }
        }
        
        alert.alertsSent.emergency = true;
        this.log('error', `Emergency notifications sent for hypertensive crisis`, {
          clientId: alert.clientId,
          reading: `${alert.systolic}/${alert.diastolic}`
        });
      }

    } catch (error) {
      this.log('error', 'Failed to send BP alert notifications', {
        alertId: alert.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Check if alert should be suppressed
   */
  private async shouldSuppressAlert(clientId: string, threshold: BloodPressureThreshold): Promise<boolean> {
    // Check silent hours
    if (!threshold.requiresImmediate) {
      const now = new Date();
      const currentTime = now.toTimeString().substring(0, 5); // "HH:MM"
      const { start, end } = this.agent.configuration.silentHours;
      
      if (currentTime >= start || currentTime <= end) {
        this.log('debug', `Alert suppressed due to silent hours for client ${clientId}`);
        return true;
      }
    }

    // Check frequency limits
    const recentAlerts = this.activeAlerts.filter(alert => 
      alert.clientId === clientId && 
      alert.thresholdId === threshold.id &&
      Date.now() - alert.triggeredAt.getTime() < (60 * 60 * 1000) // Last hour
    );

    if (recentAlerts.length >= this.agent.configuration.maxAlertsPerHour) {
      this.log('debug', `Alert suppressed due to frequency limits for client ${clientId}`);
      return true;
    }

    return false;
  }

  /**
   * Get appropriate notification template
   */
  private getNotificationTemplate(severity: BloodPressureThreshold['severity']): NotificationTemplate | undefined {
    switch (severity) {
      case 'elevated': return this.notificationTemplates.find(t => t.id === 'bp_elevated_sms');
      case 'stage1':
      case 'stage2': return this.notificationTemplates.find(t => t.id === 'bp_high_sms');
      case 'crisis': return this.notificationTemplates.find(t => t.id === 'bp_crisis_sms');
      case 'low': return this.notificationTemplates.find(t => t.id === 'bp_low_sms');
      default: return undefined;
    }
  }

  /**
   * Format notification message with variables
   */
  private formatNotificationMessage(template: string, variables: Record<string, string>): string {
    let formatted = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      formatted = formatted.replace(new RegExp(placeholder, 'g'), value);
    });
    
    return formatted;
  }

  /**
   * Log agent activity
   */
  private log(level: AgentLog['level'], message: string, details?: Record<string, any>): void {
    const logEntry: AgentLog = {
      id: uuidv4(),
      agentId: this.agent.id,
      timestamp: new Date(),
      level,
      message,
      details
    };

    this.logs.unshift(logEntry);
    this.logs = this.logs.slice(0, 1000); // Keep last 1000 logs

    // Console output for development
    const logMessage = `[BP Agent] ${level.toUpperCase()}: ${message}`;
    switch (level) {
      case 'error': console.error(logMessage, details); break;
      case 'warning': console.warn(logMessage, details); break;
      case 'info': console.info(logMessage, details); break;
      case 'debug': console.debug(logMessage, details); break;
    }
  }

  /**
   * Get agent configuration
   */
  getAgent(): BPMonitoringAgent {
    return { ...this.agent };
  }

  /**
   * Get recent logs
   */
  getLogs(limit: number = 50): AgentLog[] {
    return this.logs.slice(0, limit);
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): BPAlertTrigger[] {
    return [...this.activeAlerts];
  }

  /**
   * Get recent readings
   */
  getRecentReadings(limit: number = 20): BloodPressureReading[] {
    return this.recentReadings.slice(0, limit);
  }

  /**
   * Get monitoring statistics
   */
  getStats() {
    return {
      ...this.agent.stats,
      isRunning: this.isRunning,
      participantsMonitored: this.agent.configuration.participantIds.length,
      activeAlerts: this.activeAlerts.length,
      recentReadings: this.recentReadings.length,
      logsCount: this.logs.length
    };
  }

  /**
   * Update agent configuration
   */
  updateConfiguration(config: Partial<BPMonitoringAgent['configuration']>): void {
    this.agent.configuration = { ...this.agent.configuration, ...config };
    this.log('info', 'Agent configuration updated', config);
  }
}

export const bloodPressureAgent = new BloodPressureMonitoringAgent();