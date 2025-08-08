export interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  type: 'client' | 'staff' | 'emergency' | 'external';
  relationship?: string; // For emergency contacts
  isBlocked: boolean;
  isPrimary: boolean;
  notes?: string;
  lastContact?: Date;
  createdAt: Date;
}

export interface VoiceCall {
  id: string;
  callSid?: string; // Twilio call SID
  fromNumber: string;
  toNumber: string;
  fromContact?: Contact;
  toContact?: Contact;
  direction: 'inbound' | 'outbound';
  status: 'queued' | 'ringing' | 'in-progress' | 'completed' | 'failed' | 'busy' | 'no-answer';
  duration?: number; // seconds
  startTime: Date;
  endTime?: Date;
  recordingUrl?: string;
  callType: 'emergency' | 'appointment' | 'checkin' | 'support' | 'general';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  notes?: string;
  staffId?: string; // Staff member handling the call
  clientId?: string; // Associated client
}

export interface TextMessage {
  id: string;
  messageSid?: string; // Twilio message SID
  fromNumber: string;
  toNumber: string;
  fromContact?: Contact;
  toContact?: Contact;
  direction: 'inbound' | 'outbound';
  body: string;
  status: 'queued' | 'sending' | 'sent' | 'delivered' | 'failed' | 'undelivered';
  timestamp: Date;
  messageType: 'emergency' | 'reminder' | 'notification' | 'checkin' | 'support' | 'general';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  mediaUrls?: string[]; // For MMS attachments
  isRead: boolean;
  isArchived: boolean;
  staffId?: string;
  clientId?: string;
  threadId?: string; // Group related messages
}

export interface CommunicationThread {
  id: string;
  participants: Contact[];
  type: 'individual' | 'group';
  lastMessage?: TextMessage;
  lastCall?: VoiceCall;
  lastActivity: Date;
  isActive: boolean;
  subject?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  tags?: string[];
  assignedStaff?: string;
  clientId?: string;
}

export interface GoogleVoiceConfig {
  enabled: boolean;
  googleVoiceNumber: string;
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioPhoneNumber?: string;
  voiceCallbackUrl: string;
  smsCallbackUrl: string;
  recordCalls: boolean;
  allowInternationalCalls: boolean;
  businessHours: {
    start: string; // "09:00"
    end: string;   // "17:00"
    timezone: string;
    daysOfWeek: number[]; // 0-6, Sunday = 0
  };
  emergencyNumbers: string[];
  autoResponders: {
    enabled: boolean;
    afterHoursMessage: string;
    busyMessage: string;
    emergencyMessage: string;
  };
}

export interface CommunicationStats {
  today: {
    totalCalls: number;
    answeredCalls: number;
    missedCalls: number;
    totalMessages: number;
    emergencyCalls: number;
    averageCallDuration: number;
  };
  thisWeek: {
    totalCommunications: number;
    emergencyContacts: number;
    clientCheckIns: number;
    staffCommunications: number;
  };
}

export interface EmergencyAlert {
  id: string;
  type: 'voice' | 'sms' | 'both';
  message: string;
  recipients: Contact[];
  priority: 'high' | 'critical';
  status: 'pending' | 'sending' | 'sent' | 'failed';
  triggeredBy: string; // Staff member ID
  triggeredAt: Date;
  reason: string;
  location?: string;
  relatedClientId?: string;
  callResults?: {
    contacted: number;
    answered: number;
    failed: number;
  };
  messageResults?: {
    sent: number;
    delivered: number;
    failed: number;
  };
}

export interface VoicemailMessage {
  id: string;
  callId: string;
  fromNumber: string;
  fromContact?: Contact;
  duration: number;
  timestamp: Date;
  transcription?: string;
  audioUrl: string;
  isListened: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  staffId?: string; // Staff member who should handle this
  clientId?: string;
  category: 'emergency' | 'appointment' | 'inquiry' | 'complaint' | 'other';
}

export interface CommunicationTemplate {
  id: string;
  name: string;
  type: 'sms' | 'call_script' | 'voicemail';
  category: 'appointment_reminder' | 'bed_assignment' | 'emergency' | 'check_in' | 'follow_up' | 'general';
  subject?: string;
  body: string;
  variables: string[]; // Placeholders like {clientName}, {bedNumber}
  isActive: boolean;
  usageCount: number;
  createdBy: string;
  createdAt: Date;
  lastUsed?: Date;
}

export interface CallQueue {
  id: string;
  name: string;
  phoneNumber: string;
  description: string;
  maxWaitTime: number; // minutes
  staffMembers: string[]; // Staff IDs assigned to this queue
  businessHours: boolean; // Only active during business hours
  priority: number; // Lower number = higher priority
  voicemailEnabled: boolean;
  holdMusicUrl?: string;
  welcomeMessage: string;
  queueFullMessage: string;
  currentCalls: VoiceCall[];
  stats: {
    averageWaitTime: number;
    abandonmentRate: number;
    serviceLevel: number; // Percentage of calls answered within target time
  };
}