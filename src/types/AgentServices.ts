export interface BloodPressureThreshold {
  id: string;
  name: string;
  systolicMin?: number;
  systolicMax?: number;
  diastolicMin?: number;
  diastolicMax?: number;
  severity: 'low' | 'normal' | 'elevated' | 'stage1' | 'stage2' | 'crisis';
  description: string;
  color: string;
  requiresImmediate: boolean;
  alertStaff: boolean;
  alertEmergency: boolean;
}

export interface ParticipantAlert {
  id: string;
  clientId: string;
  clientName: string;
  phoneNumber: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  thresholds: string[]; // Threshold IDs to monitor
  isActive: boolean;
  lastAlertSent?: Date;
  alertFrequency: number; // Minutes between alerts for same condition
  preferences: {
    smsEnabled: boolean;
    voiceCallEnabled: boolean;
    emergencyContactNotify: boolean;
    staffNotify: boolean;
  };
  registeredAt: Date;
  registeredBy: string;
}

export interface BloodPressureReading {
  id: string;
  clientId: string;
  systolic: number;
  diastolic: number;
  heartRate?: number;
  timestamp: Date;
  source: 'healthkit' | 'manual' | 'device';
  deviceId?: string;
  notes?: string;
  verified: boolean;
}

export interface BPAlertTrigger {
  id: string;
  readingId: string;
  clientId: string;
  clientName: string;
  thresholdId: string;
  thresholdName: string;
  severity: BloodPressureThreshold['severity'];
  systolic: number;
  diastolic: number;
  heartRate?: number;
  triggeredAt: Date;
  alertsSent: {
    sms: boolean;
    voice: boolean;
    staff: boolean;
    emergency: boolean;
  };
  responses: {
    clientResponded: boolean;
    staffResponded: boolean;
    responseTime?: Date;
    actions: string[];
  };
  status: 'active' | 'acknowledged' | 'resolved' | 'escalated';
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface AgentService {
  id: string;
  name: string;
  type: 'blood_pressure_monitor' | 'heart_rate_monitor' | 'medication_reminder' | 'check_in_reminder';
  description: string;
  isActive: boolean;
  configuration: Record<string, any>;
  lastRun?: Date;
  nextRun?: Date;
  runInterval: number; // Minutes
  stats: {
    totalRuns: number;
    totalAlerts: number;
    successRate: number;
    lastError?: string;
  };
  createdAt: Date;
  createdBy: string;
}

export interface BPMonitoringAgent extends AgentService {
  type: 'blood_pressure_monitor';
  configuration: {
    checkInterval: number; // Minutes
    enabledThresholds: string[];
    participantIds: string[];
    businessHoursOnly: boolean;
    maxAlertsPerHour: number;
    escalationDelay: number; // Minutes before escalating
    staffNotificationList: string[];
    emergencyNotificationList: string[];
    silentHours: {
      start: string; // "22:00"
      end: string;   // "06:00"
    };
    dataSourcePriority: ('healthkit' | 'manual' | 'device')[];
    minimumReadingAge: number; // Minutes - ignore readings older than this
  };
}

export interface AgentLog {
  id: string;
  agentId: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  details?: Record<string, any>;
  clientId?: string;
  alertId?: string;
}

export interface AgentStats {
  totalAgents: number;
  activeAgents: number;
  alertsToday: number;
  alertsThisWeek: number;
  participantsMonitored: number;
  averageResponseTime: number; // Minutes
  criticalAlertsActive: number;
  systemHealthScore: number; // 0-100
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: 'sms' | 'voice_script';
  category: 'bp_elevated' | 'bp_high' | 'bp_crisis' | 'bp_low' | 'reminder' | 'followup';
  severity: 'info' | 'warning' | 'critical';
  template: string;
  variables: string[]; // {clientName}, {systolic}, {diastolic}, etc.
  language: string;
  isActive: boolean;
  usageCount: number;
  createdAt: Date;
  lastUsed?: Date;
}

export interface EscalationRule {
  id: string;
  name: string;
  triggerConditions: {
    severity: BloodPressureThreshold['severity'][];
    noResponseTime: number; // Minutes
    repeatCount: number;
  };
  actions: {
    notifyStaff: boolean;
    notifyEmergency: boolean;
    callEmergencyServices: boolean;
    escalateToSupervisor: boolean;
    dispatchMedical: boolean;
  };
  contacts: {
    staff: string[];
    emergency: string[];
    medical: string[];
  };
  isActive: boolean;
  priority: number;
  createdAt: Date;
}

export interface MonitoringSession {
  id: string;
  clientId: string;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'paused' | 'completed' | 'interrupted';
  readingsCount: number;
  alertsTriggered: number;
  averageSystolic: number;
  averageDiastolic: number;
  highestReading?: {
    systolic: number;
    diastolic: number;
    timestamp: Date;
  };
  lowestReading?: {
    systolic: number;
    diastolic: number;
    timestamp: Date;
  };
  notes?: string;
  staffId: string;
}