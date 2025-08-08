import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { 
  VoiceCall, 
  TextMessage, 
  Contact, 
  EmergencyAlert, 
  VoicemailMessage,
  CommunicationStats,
  GoogleVoiceConfig 
} from '../types/Communication';

class GoogleVoiceService {
  private config: GoogleVoiceConfig;
  private isInitialized: boolean = false;

  constructor() {
    this.config = {
      enabled: true,
      googleVoiceNumber: '+12085551234', // Demo number
      twilioAccountSid: process.env.REACT_APP_TWILIO_ACCOUNT_SID,
      twilioAuthToken: process.env.REACT_APP_TWILIO_AUTH_TOKEN,
      twilioPhoneNumber: process.env.REACT_APP_TWILIO_PHONE_NUMBER || '+12085551234',
      voiceCallbackUrl: `${window.location.origin}/api/voice/callback`,
      smsCallbackUrl: `${window.location.origin}/api/sms/callback`,
      recordCalls: true,
      allowInternationalCalls: false,
      businessHours: {
        start: '08:00',
        end: '18:00',
        timezone: 'America/Boise',
        daysOfWeek: [1, 2, 3, 4, 5] // Monday-Friday
      },
      emergencyNumbers: ['911', '+12085559911'],
      autoResponders: {
        enabled: true,
        afterHoursMessage: 'Thank you for calling Idaho Community Shelter. Our office hours are Monday-Friday 8AM-6PM. For emergencies, please call 911 or text EMERGENCY to this number.',
        busyMessage: 'All our staff members are currently busy. Please leave a message and we will return your call within 4 hours.',
        emergencyMessage: 'EMERGENCY: This is an automated message from Idaho Community Shelter. Please respond immediately.'
      }
    };
  }

  /**
   * Initialize the Google Voice service
   */
  async initialize(): Promise<boolean> {
    try {
      // In a real implementation, this would authenticate with Google Voice API
      console.log('Initializing Google Voice Service...');
      
      // For demo purposes, simulate initialization
      await this.simulateServiceCheck();
      
      this.isInitialized = true;
      console.log('Google Voice Service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Google Voice Service:', error);
      return false;
    }
  }

  /**
   * Simulate service availability check
   */
  private async simulateServiceCheck(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('✓ Google Voice API connection verified');
        console.log('✓ Twilio integration active');
        console.log('✓ Phone number registration confirmed');
        resolve();
      }, 1000);
    });
  }

  /**
   * Make an outbound voice call
   */
  async makeCall(
    toNumber: string, 
    callType: VoiceCall['callType'] = 'general',
    staffId?: string,
    clientId?: string
  ): Promise<VoiceCall> {
    if (!this.isInitialized) {
      throw new Error('Google Voice service not initialized');
    }

    const call: VoiceCall = {
      id: uuidv4(),
      fromNumber: this.config.twilioPhoneNumber!,
      toNumber: this.formatPhoneNumber(toNumber),
      direction: 'outbound',
      status: 'queued',
      startTime: new Date(),
      callType,
      priority: callType === 'emergency' ? 'urgent' : 'normal',
      staffId,
      clientId
    };

    try {
      // In a real implementation, this would use Twilio Voice API
      const mockCallSid = await this.simulateOutboundCall(call);
      call.callSid = mockCallSid;
      call.status = 'ringing';
      
      console.log(`📞 Outbound call initiated: ${call.fromNumber} -> ${call.toNumber}`);
      return call;
    } catch (error) {
      call.status = 'failed';
      call.endTime = new Date();
      throw error;
    }
  }

  /**
   * Send SMS/text message
   */
  async sendMessage(
    toNumber: string, 
    message: string, 
    messageType: TextMessage['messageType'] = 'general',
    staffId?: string,
    clientId?: string
  ): Promise<TextMessage> {
    if (!this.isInitialized) {
      throw new Error('Google Voice service not initialized');
    }

    const textMessage: TextMessage = {
      id: uuidv4(),
      fromNumber: this.config.twilioPhoneNumber!,
      toNumber: this.formatPhoneNumber(toNumber),
      direction: 'outbound',
      body: message,
      status: 'queued',
      timestamp: new Date(),
      messageType,
      priority: messageType === 'emergency' ? 'urgent' : 'normal',
      isRead: false,
      isArchived: false,
      staffId,
      clientId
    };

    try {
      // In a real implementation, this would use Twilio SMS API
      const mockMessageSid = await this.simulateOutboundMessage(textMessage);
      textMessage.messageSid = mockMessageSid;
      textMessage.status = 'sending';
      
      // Simulate delivery
      setTimeout(() => {
        textMessage.status = 'delivered';
      }, 2000);
      
      console.log(`💬 SMS sent: ${textMessage.fromNumber} -> ${textMessage.toNumber}`);
      return textMessage;
    } catch (error) {
      textMessage.status = 'failed';
      throw error;
    }
  }

  /**
   * Send emergency alert to multiple contacts
   */
  async sendEmergencyAlert(alert: Omit<EmergencyAlert, 'id' | 'status' | 'triggeredAt'>): Promise<EmergencyAlert> {
    const emergencyAlert: EmergencyAlert = {
      id: uuidv4(),
      status: 'pending',
      triggeredAt: new Date(),
      callResults: { contacted: 0, answered: 0, failed: 0 },
      messageResults: { sent: 0, delivered: 0, failed: 0 },
      ...alert
    };

    try {
      emergencyAlert.status = 'sending';
      
      // Send messages if SMS is enabled
      if (alert.type === 'sms' || alert.type === 'both') {
        for (const contact of alert.recipients) {
          try {
            await this.sendMessage(
              contact.phoneNumber,
              `🚨 EMERGENCY ALERT: ${alert.message}\n\nLocation: ${alert.location || 'Idaho Community Shelter'}\nTime: ${new Date().toLocaleString()}\n\nThis is an automated emergency notification.`,
              'emergency',
              alert.triggeredBy,
              alert.relatedClientId
            );
            emergencyAlert.messageResults!.sent++;
          } catch (error) {
            emergencyAlert.messageResults!.failed++;
            console.error(`Failed to send emergency SMS to ${contact.phoneNumber}:`, error);
          }
        }
      }

      // Make calls if voice is enabled
      if (alert.type === 'voice' || alert.type === 'both') {
        for (const contact of alert.recipients) {
          try {
            await this.makeCall(
              contact.phoneNumber,
              'emergency',
              alert.triggeredBy,
              alert.relatedClientId
            );
            emergencyAlert.callResults!.contacted++;
          } catch (error) {
            emergencyAlert.callResults!.failed++;
            console.error(`Failed to make emergency call to ${contact.phoneNumber}:`, error);
          }
        }
      }

      emergencyAlert.status = 'sent';
      console.log(`🚨 Emergency alert sent to ${alert.recipients.length} contacts`);
      
      return emergencyAlert;
    } catch (error) {
      emergencyAlert.status = 'failed';
      throw error;
    }
  }

  /**
   * Get communication statistics
   */
  async getCommunicationStats(): Promise<CommunicationStats> {
    // In a real implementation, this would query actual call/message logs
    const stats: CommunicationStats = {
      today: {
        totalCalls: Math.floor(Math.random() * 50) + 10,
        answeredCalls: Math.floor(Math.random() * 40) + 8,
        missedCalls: Math.floor(Math.random() * 10) + 2,
        totalMessages: Math.floor(Math.random() * 100) + 20,
        emergencyCalls: Math.floor(Math.random() * 3),
        averageCallDuration: Math.floor(Math.random() * 300) + 120 // 2-7 minutes
      },
      thisWeek: {
        totalCommunications: Math.floor(Math.random() * 500) + 200,
        emergencyContacts: Math.floor(Math.random() * 15) + 5,
        clientCheckIns: Math.floor(Math.random() * 100) + 50,
        staffCommunications: Math.floor(Math.random() * 200) + 100
      }
    };

    return stats;
  }

  /**
   * Get recent calls
   */
  async getRecentCalls(limit: number = 20): Promise<VoiceCall[]> {
    // Mock recent calls data
    const calls: VoiceCall[] = [];
    
    for (let i = 0; i < Math.min(limit, 15); i++) {
      const isInbound = Math.random() > 0.5;
      const startTime = new Date(Date.now() - (i * 3600000) - Math.random() * 7200000); // Last 2 hours with some randomness
      const duration = Math.floor(Math.random() * 600) + 30; // 30 seconds to 10 minutes
      
      calls.push({
        id: uuidv4(),
        callSid: `CA${Math.random().toString(36).substring(2, 15)}`,
        fromNumber: isInbound ? this.generateRandomPhoneNumber() : this.config.twilioPhoneNumber!,
        toNumber: isInbound ? this.config.twilioPhoneNumber! : this.generateRandomPhoneNumber(),
        direction: isInbound ? 'inbound' : 'outbound',
        status: Math.random() > 0.1 ? 'completed' : (Math.random() > 0.5 ? 'no-answer' : 'busy'),
        duration,
        startTime,
        endTime: new Date(startTime.getTime() + duration * 1000),
        callType: Math.random() > 0.8 ? 'emergency' : (Math.random() > 0.6 ? 'checkin' : 'general'),
        priority: Math.random() > 0.9 ? 'urgent' : 'normal',
        staffId: `staff-${Math.floor(Math.random() * 5) + 1}`
      });
    }

    return calls.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }

  /**
   * Get recent messages
   */
  async getRecentMessages(limit: number = 50): Promise<TextMessage[]> {
    const messages: TextMessage[] = [];
    
    for (let i = 0; i < Math.min(limit, 25); i++) {
      const isInbound = Math.random() > 0.4;
      const timestamp = new Date(Date.now() - (i * 1800000) - Math.random() * 1800000); // Last hour with randomness
      
      const messageTemplates = [
        'Hi, I need help with my bed reservation for tonight',
        'Thank you for your help today',
        'Can I check in early today?',
        'I lost my ID, what should I do?',
        'Are meals provided tonight?',
        'Emergency: Client needs immediate assistance',
        'Bed A03 is ready for cleaning',
        'Medical supplies are running low',
        'Client check-in reminder for 6 PM',
        'Weather alert: Extra blankets needed'
      ];
      
      messages.push({
        id: uuidv4(),
        messageSid: `SM${Math.random().toString(36).substring(2, 15)}`,
        fromNumber: isInbound ? this.generateRandomPhoneNumber() : this.config.twilioPhoneNumber!,
        toNumber: isInbound ? this.config.twilioPhoneNumber! : this.generateRandomPhoneNumber(),
        direction: isInbound ? 'inbound' : 'outbound',
        body: messageTemplates[Math.floor(Math.random() * messageTemplates.length)],
        status: Math.random() > 0.05 ? 'delivered' : 'failed',
        timestamp,
        messageType: Math.random() > 0.85 ? 'emergency' : (Math.random() > 0.6 ? 'checkin' : 'general'),
        priority: Math.random() > 0.9 ? 'urgent' : 'normal',
        isRead: Math.random() > 0.3,
        isArchived: false,
        staffId: isInbound ? `staff-${Math.floor(Math.random() * 5) + 1}` : undefined,
        clientId: Math.random() > 0.3 ? `client-${Math.floor(Math.random() * 10) + 1}` : undefined
      });
    }

    return messages.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get voicemail messages
   */
  async getVoicemails(): Promise<VoicemailMessage[]> {
    const voicemails: VoicemailMessage[] = [];
    
    for (let i = 0; i < Math.floor(Math.random() * 5) + 1; i++) {
      const timestamp = new Date(Date.now() - (i * 7200000) - Math.random() * 3600000);
      
      const transcriptions = [
        'Hi, this is John. I need to change my check-in time for tonight. Please call me back.',
        'This is Sarah from Downtown Health Clinic. We need to coordinate care for one of your clients.',
        'Emergency: We have a client who needs immediate shelter. Please call back ASAP.',
        'Hi, I was wondering if you have any beds available for families?',
        'This is Mike. I left some belongings there yesterday. When can I pick them up?'
      ];
      
      voicemails.push({
        id: uuidv4(),
        callId: `call-${uuidv4()}`,
        fromNumber: this.generateRandomPhoneNumber(),
        duration: Math.floor(Math.random() * 120) + 30,
        timestamp,
        transcription: transcriptions[Math.floor(Math.random() * transcriptions.length)],
        audioUrl: `/api/voicemail/${uuidv4()}.mp3`,
        isListened: Math.random() > 0.6,
        priority: Math.random() > 0.8 ? 'urgent' : 'normal',
        category: Math.random() > 0.7 ? 'emergency' : (Math.random() > 0.5 ? 'inquiry' : 'appointment')
      });
    }

    return voicemails.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Check if currently within business hours
   */
  isBusinessHours(): boolean {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const timeString = now.toTimeString().substring(0, 5); // "HH:MM"
    
    const isBusinessDay = this.config.businessHours.daysOfWeek.includes(dayOfWeek);
    const isBusinessTime = timeString >= this.config.businessHours.start && 
                          timeString <= this.config.businessHours.end;
    
    return isBusinessDay && isBusinessTime;
  }

  /**
   * Format phone number to E.164 format
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const digits = phoneNumber.replace(/\D/g, '');
    
    // Add country code if missing
    if (digits.length === 10) {
      return `+1${digits}`;
    } else if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    }
    
    return phoneNumber; // Return as-is if format is unclear
  }

  /**
   * Generate random phone number for demo
   */
  private generateRandomPhoneNumber(): string {
    const areaCode = Math.floor(Math.random() * 900) + 100;
    const exchange = Math.floor(Math.random() * 900) + 100;
    const number = Math.floor(Math.random() * 9000) + 1000;
    return `+1${areaCode}${exchange}${number}`;
  }

  /**
   * Simulate outbound call using Twilio
   */
  private async simulateOutboundCall(call: VoiceCall): Promise<string> {
    return new Promise((resolve) => {
      // Simulate API call delay
      setTimeout(() => {
        const mockCallSid = `CA${Math.random().toString(36).substring(2, 15)}`;
        resolve(mockCallSid);
      }, 1000);
    });
  }

  /**
   * Simulate outbound message using Twilio
   */
  private async simulateOutboundMessage(message: TextMessage): Promise<string> {
    return new Promise((resolve) => {
      // Simulate API call delay
      setTimeout(() => {
        const mockMessageSid = `SM${Math.random().toString(36).substring(2, 15)}`;
        resolve(mockMessageSid);
      }, 500);
    });
  }

  /**
   * Get service configuration
   */
  getConfig(): GoogleVoiceConfig {
    return { ...this.config };
  }

  /**
   * Update service configuration
   */
  updateConfig(newConfig: Partial<GoogleVoiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Check if service is initialized
   */
  isServiceReady(): boolean {
    return this.isInitialized;
  }
}

export const googleVoiceService = new GoogleVoiceService();