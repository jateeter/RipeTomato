/**
 * AI Agent Management Types and Interfaces
 * 
 * Comprehensive type definitions for managing AI agents across different
 * service categories with automation levels and inter-agent associations.
 */

export type AgentCategory = 
  | 'service_delivery'
  | 'status_monitoring' 
  | 'issue_resolution'
  | 'client_coordination'
  | 'system_automation';

export type ServiceType = 
  | 'shelter'
  | 'food_water'
  | 'sanitation'
  | 'transportation'
  | 'case_management'
  | 'medical'
  | 'mental_health'
  | 'job_training'
  | 'legal_aid';

export type AutomationLevel = 
  | 'fully_automated'    // Agent handles everything without human intervention
  | 'semi_automated'     // Agent handles routine tasks, escalates complex issues
  | 'assisted'          // Agent provides recommendations, human makes decisions
  | 'monitoring_only';   // Agent observes and reports, no actions taken

export type AgentStatus = 
  | 'active'
  | 'inactive'
  | 'maintenance'
  | 'error'
  | 'suspended'
  | 'training';

export type AgentRole = 'manager' | 'staff' | 'system';

export interface AgentAssociation {
  agentId: string;
  agentName: string;
  associationType: 'supervisor' | 'peer' | 'subordinate' | 'dependency' | 'collaboration';
  relationship: string;
  dataFlow: 'bidirectional' | 'incoming' | 'outgoing' | 'none';
  criticalityLevel: 'critical' | 'important' | 'optional';
}

export interface AgentPerformanceMetrics {
  tasksCompleted: number;
  successRate: number;
  averageResponseTime: number; // in milliseconds
  errorCount: number;
  escalationCount: number;
  clientSatisfactionScore?: number;
  uptime: number; // percentage
  lastActive: Date;
}

export interface AgentCapability {
  name: string;
  description: string;
  enabled: boolean;
  confidenceLevel: number; // 0-100
  lastTrained: Date;
}

export interface AIAgent {
  id: string;
  name: string;
  description: string;
  category: AgentCategory;
  serviceTypes: ServiceType[];
  automationLevel: AutomationLevel;
  status: AgentStatus;
  version: string;
  
  // Access Control
  accessibleBy: AgentRole[];
  managedBy: AgentRole[];
  
  // Performance and Monitoring
  performanceMetrics: AgentPerformanceMetrics;
  capabilities: AgentCapability[];
  
  // Inter-agent Relationships
  associations: AgentAssociation[];
  
  // Configuration
  configuration: {
    maxConcurrentTasks: number;
    responseTimeLimit: number;
    escalationThreshold: number;
    allowedActions: string[];
    restrictedActions: string[];
  };
  
  // Lifecycle
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastModifiedBy: string;
  
  // Health and Diagnostics
  healthCheck: {
    status: 'healthy' | 'warning' | 'critical' | 'unknown';
    lastCheck: Date;
    issues: string[];
    recommendations: string[];
  };
}

export interface ServiceDeliveryAgent extends AIAgent {
  category: 'service_delivery';
  serviceSpecificConfig: {
    serviceHours: {
      start: string; // HH:mm format
      end: string;
      timezone: string;
    };
    clientCapacity: number;
    specializations: string[];
    requiredCertifications: string[];
  };
}

export interface StatusMonitoringAgent extends AIAgent {
  category: 'status_monitoring';
  monitoringConfig: {
    monitoredSystems: string[];
    checkInterval: number; // in milliseconds
    alertThresholds: {
      warning: number;
      critical: number;
    };
    notificationChannels: string[];
  };
}

export interface IssueResolutionAgent extends AIAgent {
  category: 'issue_resolution';
  resolutionConfig: {
    issueCategories: string[];
    resolutionStrategies: {
      category: string;
      automationLevel: AutomationLevel;
      maxAttempts: number;
      escalationPath: string[];
    }[];
    knowledgeBase: {
      lastUpdated: Date;
      articleCount: number;
      sources: string[];
    };
  };
}

export type AgentUnion = ServiceDeliveryAgent | StatusMonitoringAgent | IssueResolutionAgent | AIAgent;

export interface AgentManagementDashboard {
  totalAgents: number;
  activeAgents: number;
  agentsByCategory: Record<AgentCategory, number>;
  agentsByService: Record<ServiceType, number>;
  agentsByAutomationLevel: Record<AutomationLevel, number>;
  systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
  alerts: AgentAlert[];
  recentActivity: AgentActivity[];
}

export interface AgentAlert {
  id: string;
  agentId: string;
  agentName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'performance' | 'error' | 'security' | 'configuration' | 'dependency';
  message: string;
  timestamp: Date;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
}

export interface AgentActivity {
  id: string;
  agentId: string;
  agentName: string;
  action: string;
  description: string;
  timestamp: Date;
  userId?: string;
  result: 'success' | 'failure' | 'pending';
  details?: any;
}

export interface AgentDeployment {
  environment: 'development' | 'staging' | 'production';
  version: string;
  deployedAt: Date;
  deployedBy: string;
  rollbackAvailable: boolean;
  healthStatus: 'healthy' | 'unhealthy' | 'unknown';
}

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  category: AgentCategory;
  defaultConfig: Partial<AIAgent>;
  requiredCapabilities: string[];
  estimatedSetupTime: number; // in minutes
  complexity: 'simple' | 'moderate' | 'complex';
}

// Agent Management API Types
export interface CreateAgentRequest {
  templateId?: string;
  name: string;
  description: string;
  category: AgentCategory;
  serviceTypes: ServiceType[];
  automationLevel: AutomationLevel;
  configuration: AIAgent['configuration'];
}

export interface UpdateAgentRequest {
  id: string;
  updates: Partial<AIAgent>;
}

export interface AgentActionRequest {
  agentId: string;
  action: 'start' | 'stop' | 'restart' | 'suspend' | 'resume' | 'configure' | 'delete';
  parameters?: any;
}

export interface AgentSearchFilters {
  category?: AgentCategory[];
  serviceType?: ServiceType[];
  automationLevel?: AutomationLevel[];
  status?: AgentStatus[];
  accessibleBy?: AgentRole;
  searchTerm?: string;
}

export interface AgentAnalytics {
  timeRange: 'hour' | 'day' | 'week' | 'month' | 'quarter';
  metrics: {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    averageResponseTime: number;
    peakUsageTime: string;
    topPerformingAgents: Array<{
      agentId: string;
      name: string;
      successRate: number;
    }>;
    issueBreakdown: Record<string, number>;
  };
}