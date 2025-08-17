/**
 * Client Welcome Agent Service
 * 
 * An intelligent agent that spawns upon client registration to provide
 * personalized welcome, initial service allocation, and ongoing workflow monitoring.
 * Each agent instance is attached to a client's Solid Pod for privacy-compliant operation.
 * 
 * @license MIT
 */

import { PersonRegistrationData } from '../components/PersonRegistrationModal';
import { solidPodService } from './solidPodService';
import { unifiedDataOwnershipService } from './unifiedDataOwnershipService';
import { googleCalendarService } from './googleCalendarService';

export interface AgentConfiguration {
  agentId: string;
  clientId: string;
  podUrl: string;
  welcomeCompleted: boolean;
  servicesAllocated: boolean;
  notificationSubscriptions: string[];
  workflowSteps: WorkflowStep[];
  createdAt: Date;
  lastActivity: Date;
}

export interface WorkflowStep {
  stepId: string;
  stepType: 'welcome' | 'service_allocation' | 'bed_assignment' | 'meal_setup' | 'check_in' | 'case_management';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  scheduledTime?: Date;
  completedTime?: Date;
  notificationSent: boolean;
  metadata: Record<string, any>;
}

export interface ServiceAllocation {
  allocationId: string;
  serviceType: 'shelter' | 'meals' | 'case_management' | 'medical' | 'transportation';
  facilityId?: string;
  facilityName?: string;
  startDate: Date;
  endDate?: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'allocated' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  calendarEventId?: string;
  metadata: Record<string, any>;
}

export interface AgentNotification {
  notificationId: string;
  agentId: string;
  type: 'welcome' | 'service_update' | 'workflow_progress' | 'reminder' | 'alert';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: Date;
  read: boolean;
  actionRequired: boolean;
  metadata: Record<string, any>;
}

class ClientWelcomeAgent {
  private agentConfig: AgentConfiguration;
  private notificationQueue: AgentNotification[] = [];
  private workflowCallbacks: Map<string, (step: WorkflowStep) => void> = new Map();

  constructor(config: AgentConfiguration) {
    this.agentConfig = config;
    this.initialize();
  }

  /**
   * Create and spawn a new agent instance for a client
   */
  static async spawnAgent(clientData: PersonRegistrationData): Promise<ClientWelcomeAgent> {
    console.log(`🤖 Spawning welcome agent for client: ${clientData.firstName} ${clientData.lastName}`);

    const agentId = `agent_${clientData.id}_${Date.now()}`;
    const podUrl = await solidPodService.getClientPodUrl(clientData.id!);

    const agentConfig: AgentConfiguration = {
      agentId,
      clientId: clientData.id!,
      podUrl,
      welcomeCompleted: false,
      servicesAllocated: false,
      notificationSubscriptions: ['workflow_updates', 'service_changes', 'calendar_events'],
      workflowSteps: [
        {
          stepId: 'welcome_message',
          stepType: 'welcome',
          status: 'pending',
          scheduledTime: new Date(),
          notificationSent: false,
          metadata: { clientName: `${clientData.firstName} ${clientData.lastName}` }
        },
        {
          stepId: 'initial_service_allocation',
          stepType: 'service_allocation',
          status: 'pending',
          scheduledTime: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes later
          notificationSent: false,
          metadata: { preferences: clientData.preferredBedType || 'standard' }
        }
      ],
      createdAt: new Date(),
      lastActivity: new Date()
    };

    // Store agent configuration in client's Solid Pod
    await unifiedDataOwnershipService.storeData(clientData.id!, 'agent_configuration', agentConfig);

    const agent = new ClientWelcomeAgent(agentConfig);
    await agent.executeWelcomeSequence(clientData);

    console.log(`✅ Agent ${agentId} successfully spawned and initialized`);
    return agent;
  }

  /**
   * Initialize the agent and set up monitoring
   */
  private async initialize(): Promise<void> {
    console.log(`🔄 Initializing agent ${this.agentConfig.agentId}`);
    
    // Set up notification monitoring
    this.setupNotificationMonitoring();
    
    // Start workflow processing
    this.processWorkflowSteps();
    
    // Update last activity
    this.updateLastActivity();
  }

  /**
   * Execute the welcome sequence for a new client
   */
  private async executeWelcomeSequence(clientData: PersonRegistrationData): Promise<void> {
    console.log(`👋 Executing welcome sequence for ${clientData.firstName} ${clientData.lastName}`);

    try {
      // Step 1: Send welcome message
      await this.sendWelcomeMessage(clientData);
      
      // Step 2: Allocate initial services
      await this.allocateInitialServices(clientData);
      
      // Step 3: Set up calendar events
      await this.setupInitialCalendarEvents(clientData);
      
      // Step 4: Create reminder schedule
      await this.createReminderSchedule(clientData);

      // Mark welcome as completed
      this.agentConfig.welcomeCompleted = true;
      await this.saveAgentConfiguration();

    } catch (error) {
      console.error(`❌ Welcome sequence failed for agent ${this.agentConfig.agentId}:`, error);
      await this.handleWelcomeError(error);
    }
  }

  /**
   * Send personalized welcome message to client
   */
  private async sendWelcomeMessage(clientData: PersonRegistrationData): Promise<void> {
    const welcomeMessage = this.generateWelcomeMessage(clientData);
    
    const notification: AgentNotification = {
      notificationId: `welcome_${this.agentConfig.agentId}_${Date.now()}`,
      agentId: this.agentConfig.agentId,
      type: 'welcome',
      title: `Welcome to Community Services, ${clientData.firstName}!`,
      message: welcomeMessage,
      priority: 'high',
      timestamp: new Date(),
      read: false,
      actionRequired: false,
      metadata: {
        clientId: clientData.id,
        welcomeType: 'initial_registration'
      }
    };

    await this.sendNotification(notification);
    await this.completeWorkflowStep('welcome_message');
  }

  /**
   * Generate personalized welcome message
   */
  private generateWelcomeMessage(clientData: PersonRegistrationData): string {
    const timeOfDay = new Date().getHours() < 12 ? 'morning' : 
                     new Date().getHours() < 18 ? 'afternoon' : 'evening';

    return `Good ${timeOfDay}, ${clientData.firstName}!

Welcome to Community Services. I'm your personal service coordinator agent, and I'm here to help you navigate our shelter and support services.

Here's what I'm setting up for you right now:

🏠 **Shelter Services**: I'm finding you the best available bed based on your preferences
📅 **Calendar Setup**: Creating your personal service calendar with important dates
🍽️ **Meal Services**: Coordinating meal times and dietary accommodations
🤝 **Case Management**: Scheduling your intake appointment with a case manager

You'll receive updates as each service becomes available. I'm monitoring your progress 24/7 and will notify you of any important updates or required actions.

If you need immediate assistance, please speak with any staff member and mention your agent ID: ${this.agentConfig.agentId}

Welcome to our community - we're here to support you every step of the way!

Your Service Coordinator Agent 🤖`;
  }

  /**
   * Allocate initial services for the client
   */
  private async allocateInitialServices(clientData: PersonRegistrationData): Promise<void> {
    console.log(`🏠 Allocating initial services for client ${clientData.id}`);

    const allocations: ServiceAllocation[] = [
      {
        allocationId: `shelter_${this.agentConfig.clientId}_${Date.now()}`,
        serviceType: 'shelter',
        startDate: new Date(),
        priority: 'high',
        status: 'allocated',
        metadata: {
          bedType: clientData.preferredBedType || 'standard',
          specialNeeds: clientData.medicalNotes || 'none',
          duration: '30_days_initial'
        }
      },
      {
        allocationId: `meals_${this.agentConfig.clientId}_${Date.now()}`,
        serviceType: 'meals',
        startDate: new Date(),
        priority: 'high',
        status: 'allocated',
        metadata: {
          mealTimes: ['breakfast', 'lunch', 'dinner'],
          dietaryRestrictions: clientData.restrictions || []
        }
      },
      {
        allocationId: `case_mgmt_${this.agentConfig.clientId}_${Date.now()}`,
        serviceType: 'case_management',
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        priority: 'medium',
        status: 'allocated',
        metadata: {
          intakeRequired: true,
          servicePlan: 'comprehensive'
        }
      }
    ];

    // Store allocations in client's Solid Pod
    await unifiedDataOwnershipService.storeData(
      this.agentConfig.clientId, 
      'service_allocations', 
      allocations
    );

    // Mark service allocation step as complete
    await this.completeWorkflowStep('initial_service_allocation');
    this.agentConfig.servicesAllocated = true;

    console.log(`✅ Initial services allocated for client ${clientData.id}`);
  }

  /**
   * Set up initial calendar events for the client
   */
  private async setupInitialCalendarEvents(clientData: PersonRegistrationData): Promise<void> {
    try {
      // Create check-in reminder for tomorrow
      const checkInEvent = await googleCalendarService.createEvent({
        id: '',
        title: 'Daily Check-in - Shelter Services',
        description: `Daily check-in with staff for ${clientData.firstName} ${clientData.lastName}`,
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000), // Tomorrow 9 AM
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 9.5 * 60 * 60 * 1000), // 9:30 AM
        location: 'Shelter Facility',
        category: 'other',
        organizer: 'Shelter Staff',
        isRecurring: true
      });

      // Create case management appointment
      const caseManagementEvent = await googleCalendarService.createEvent({
        id: '',
        title: 'Initial Case Management Meeting',
        description: `Comprehensive intake and service planning session for ${clientData.firstName} ${clientData.lastName}`,
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000), // Tomorrow 2 PM
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000), // 3 PM
        location: 'Case Management Office',
        category: 'other',
        organizer: 'Case Manager',
        isRecurring: false
      });

      console.log(`📅 Calendar events created for client ${clientData.id}`);

    } catch (error) {
      console.error(`❌ Failed to create calendar events:`, error);
    }
  }

  /**
   * Create reminder schedule for the client
   */
  private async createReminderSchedule(clientData: PersonRegistrationData): Promise<void> {
    const reminders = [
      {
        type: 'check_in_reminder',
        scheduledTime: new Date(Date.now() + 8.5 * 60 * 60 * 1000), // Tomorrow 8:30 AM
        message: `Good morning, ${clientData.firstName}! Your daily check-in is at 9:00 AM today.`
      },
      {
        type: 'case_management_reminder', 
        scheduledTime: new Date(Date.now() + 13 * 60 * 60 * 1000), // Tomorrow 1:00 PM
        message: `${clientData.firstName}, your case management meeting is at 2:00 PM today. Please bring your ID and any documentation you have.`
      },
      {
        type: 'meal_reminder',
        scheduledTime: new Date(Date.now() + 17.5 * 60 * 60 * 1000), // Tomorrow 5:30 PM
        message: `Dinner is served from 6:00-7:30 PM today. See you in the dining area!`
      }
    ];

    // Store reminders in client's Solid Pod
    await unifiedDataOwnershipService.storeData(
      this.agentConfig.clientId,
      'agent_reminders',
      reminders
    );

    console.log(`⏰ Reminder schedule created for client ${clientData.id}`);
  }

  /**
   * Set up notification monitoring for workflow updates
   */
  private setupNotificationMonitoring(): void {
    console.log(`🔔 Setting up notification monitoring for agent ${this.agentConfig.agentId}`);

    // Monitor for workflow notifications every 30 seconds
    setInterval(async () => {
      await this.checkForWorkflowNotifications();
    }, 30000);

    // Set up workflow callbacks
    this.workflowCallbacks.set('bed_assignment', this.handleBedAssignment.bind(this));
    this.workflowCallbacks.set('meal_setup', this.handleMealSetup.bind(this));
    this.workflowCallbacks.set('check_in', this.handleCheckIn.bind(this));
    this.workflowCallbacks.set('case_management', this.handleCaseManagement.bind(this));
  }

  /**
   * Check for new workflow notifications
   */
  private async checkForWorkflowNotifications(): Promise<void> {
    try {
      // Check for new notifications in client's data store
      const notifications = await unifiedDataOwnershipService.getData(
        this.agentConfig.clientId,
        'workflow_notifications'
      );

      if (notifications && Array.isArray(notifications)) {
        for (const notification of notifications) {
          if (!notification.processed) {
            await this.processWorkflowNotification(notification);
          }
        }
      }

    } catch (error) {
      console.error(`❌ Error checking workflow notifications:`, error);
    }
  }

  /**
   * Process a workflow notification
   */
  private async processWorkflowNotification(notification: any): Promise<void> {
    console.log(`📩 Processing workflow notification: ${notification.type}`);

    const callback = this.workflowCallbacks.get(notification.type);
    if (callback) {
      const workflowStep: WorkflowStep = {
        stepId: notification.stepId || `${notification.type}_${Date.now()}`,
        stepType: notification.type,
        status: notification.status || 'completed',
        completedTime: new Date(),
        notificationSent: false,
        metadata: notification.metadata || {}
      };

      await callback(workflowStep);
    }

    // Mark notification as processed
    notification.processed = true;
    await unifiedDataOwnershipService.storeData(
      this.agentConfig.clientId,
      'workflow_notifications',
      notification
    );

    this.updateLastActivity();
  }

  /**
   * Handle bed assignment workflow step
   */
  private async handleBedAssignment(step: WorkflowStep): Promise<void> {
    const notification: AgentNotification = {
      notificationId: `bed_${this.agentConfig.agentId}_${Date.now()}`,
      agentId: this.agentConfig.agentId,
      type: 'service_update',
      title: '🛏️ Bed Assignment Confirmed',
      message: `Great news! Your bed has been assigned and is ready. ${step.metadata.bedNumber ? `Bed Number: ${step.metadata.bedNumber}` : ''} Please check in with staff for access instructions.`,
      priority: 'high',
      timestamp: new Date(),
      read: false,
      actionRequired: true,
      metadata: {
        stepType: 'bed_assignment',
        bedInfo: step.metadata
      }
    };

    await this.sendNotification(notification);
    await this.addWorkflowStep(step);
  }

  /**
   * Handle meal setup workflow step
   */
  private async handleMealSetup(step: WorkflowStep): Promise<void> {
    const notification: AgentNotification = {
      notificationId: `meal_${this.agentConfig.agentId}_${Date.now()}`,
      agentId: this.agentConfig.agentId,
      type: 'service_update',
      title: '🍽️ Meal Services Ready',
      message: `Your meal services have been set up! Breakfast: 7-9 AM, Lunch: 12-2 PM, Dinner: 6-7:30 PM. ${step.metadata.dietaryNotes ? `Special dietary accommodations: ${step.metadata.dietaryNotes}` : ''}`,
      priority: 'medium',
      timestamp: new Date(),
      read: false,
      actionRequired: false,
      metadata: {
        stepType: 'meal_setup',
        mealInfo: step.metadata
      }
    };

    await this.sendNotification(notification);
    await this.addWorkflowStep(step);
  }

  /**
   * Handle check-in workflow step
   */
  private async handleCheckIn(step: WorkflowStep): Promise<void> {
    const notification: AgentNotification = {
      notificationId: `checkin_${this.agentConfig.agentId}_${Date.now()}`,
      agentId: this.agentConfig.agentId,
      type: 'workflow_progress',
      title: '✅ Check-in Completed',
      message: `Daily check-in completed successfully. ${step.metadata.notes ? `Notes: ${step.metadata.notes}` : ''} Have a great day!`,
      priority: 'low',
      timestamp: new Date(),
      read: false,
      actionRequired: false,
      metadata: {
        stepType: 'check_in',
        checkInInfo: step.metadata
      }
    };

    await this.sendNotification(notification);
    await this.addWorkflowStep(step);
  }

  /**
   * Handle case management workflow step
   */
  private async handleCaseManagement(step: WorkflowStep): Promise<void> {
    const notification: AgentNotification = {
      notificationId: `case_mgmt_${this.agentConfig.agentId}_${Date.now()}`,
      agentId: this.agentConfig.agentId,
      type: 'workflow_progress',
      title: '🤝 Case Management Update',
      message: `Case management session completed. ${step.metadata.servicePlan ? `Service plan updated: ${step.metadata.servicePlan}` : ''} Next appointment scheduled.`,
      priority: 'medium',
      timestamp: new Date(),
      read: false,
      actionRequired: false,
      metadata: {
        stepType: 'case_management',
        caseInfo: step.metadata
      }
    };

    await this.sendNotification(notification);
    await this.addWorkflowStep(step);
  }

  /**
   * Send notification to client
   */
  private async sendNotification(notification: AgentNotification): Promise<void> {
    console.log(`📨 Sending notification: ${notification.title}`);

    // Add to internal queue
    this.notificationQueue.push(notification);

    // Store in client's Solid Pod
    await unifiedDataOwnershipService.storeData(
      this.agentConfig.clientId,
      'agent_notifications',
      notification
    );

    // TODO: Integrate with voice services for audio notifications
    // TODO: Integrate with SMS for text notifications
    
    console.log(`✅ Notification sent: ${notification.notificationId}`);
  }

  /**
   * Process workflow steps
   */
  private async processWorkflowSteps(): Promise<void> {
    for (const step of this.agentConfig.workflowSteps) {
      if (step.status === 'pending' && step.scheduledTime && step.scheduledTime <= new Date()) {
        step.status = 'in_progress';
        // Process step based on type
        console.log(`⚡ Processing workflow step: ${step.stepType}`);
      }
    }
  }

  /**
   * Complete a workflow step
   */
  private async completeWorkflowStep(stepId: string): Promise<void> {
    const step = this.agentConfig.workflowSteps.find(s => s.stepId === stepId);
    if (step) {
      step.status = 'completed';
      step.completedTime = new Date();
      step.notificationSent = true;
      await this.saveAgentConfiguration();
    }
  }

  /**
   * Add a new workflow step
   */
  private async addWorkflowStep(step: WorkflowStep): Promise<void> {
    this.agentConfig.workflowSteps.push(step);
    await this.saveAgentConfiguration();
  }

  /**
   * Update last activity timestamp
   */
  private updateLastActivity(): void {
    this.agentConfig.lastActivity = new Date();
  }

  /**
   * Save agent configuration to Solid Pod
   */
  private async saveAgentConfiguration(): Promise<void> {
    await unifiedDataOwnershipService.storeData(
      this.agentConfig.clientId,
      'agent_configuration',
      this.agentConfig
    );
  }

  /**
   * Handle welcome sequence errors
   */
  private async handleWelcomeError(error: any): Promise<void> {
    const errorNotification: AgentNotification = {
      notificationId: `error_${this.agentConfig.agentId}_${Date.now()}`,
      agentId: this.agentConfig.agentId,
      type: 'alert',
      title: '⚠️ Welcome Setup Issue',
      message: 'We encountered an issue setting up your services. Our staff has been notified and will assist you shortly.',
      priority: 'urgent',
      timestamp: new Date(),
      read: false,
      actionRequired: true,
      metadata: {
        error: error.message,
        stepType: 'welcome_error'
      }
    };

    await this.sendNotification(errorNotification);
  }

  /**
   * Get agent status and statistics
   */
  public getAgentStatus(): {
    agentId: string;
    status: string;
    workflowProgress: number;
    lastActivity: Date;
    notificationCount: number;
    servicesCount: number;
  } {
    const completedSteps = this.agentConfig.workflowSteps.filter(s => s.status === 'completed').length;
    const totalSteps = this.agentConfig.workflowSteps.length;

    return {
      agentId: this.agentConfig.agentId,
      status: this.agentConfig.welcomeCompleted ? 'active' : 'initializing',
      workflowProgress: totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0,
      lastActivity: this.agentConfig.lastActivity,
      notificationCount: this.notificationQueue.length,
      servicesCount: this.agentConfig.workflowSteps.filter(s => s.stepType === 'service_allocation' && s.status === 'completed').length
    };
  }

  /**
   * Get client notifications
   */
  public getNotifications(unreadOnly: boolean = false): AgentNotification[] {
    return unreadOnly 
      ? this.notificationQueue.filter(n => !n.read)
      : this.notificationQueue;
  }

  /**
   * Mark notification as read
   */
  public async markNotificationRead(notificationId: string): Promise<void> {
    const notification = this.notificationQueue.find(n => n.notificationId === notificationId);
    if (notification) {
      notification.read = true;
      await unifiedDataOwnershipService.storeData(
        this.agentConfig.clientId,
        'agent_notifications',
        notification
      );
    }
  }

  /**
   * Terminate agent (cleanup)
   */
  public async terminate(): Promise<void> {
    console.log(`🛑 Terminating agent ${this.agentConfig.agentId}`);
    // Cleanup timers, connections, etc.
    // Mark agent as terminated in storage
    this.agentConfig.lastActivity = new Date();
    await this.saveAgentConfiguration();
  }
}

export { ClientWelcomeAgent };
export default ClientWelcomeAgent;