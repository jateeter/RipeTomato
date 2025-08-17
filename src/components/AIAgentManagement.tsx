/**
 * AI Agent Management Dashboard
 * 
 * Comprehensive management interface for AI agents across different service
 * categories with role-based access control and real-time monitoring.
 */

import React, { useState, useEffect } from 'react';
import {
  AIAgent,
  AgentCategory,
  ServiceType,
  AutomationLevel,
  AgentStatus,
  AgentRole,
  AgentManagementDashboard,
  AgentSearchFilters,
  AgentAlert,
  AgentActivity
} from '../types/AgentManagement';
import { AgentCategoryView } from './AgentCategoryView';
import { AgentDetailsModal } from './AgentDetailsModal';
import { AgentAssociationsView } from './AgentAssociationsView';
import { AgentPerformanceAnalytics } from './AgentPerformanceAnalytics';

interface AIAgentManagementProps {
  userRole: AgentRole;
  userId: string;
  organizationId: string;
}

export const AIAgentManagement: React.FC<AIAgentManagementProps> = ({
  userRole,
  userId,
  organizationId
}) => {
  const [dashboardData, setDashboardData] = useState<AgentManagementDashboard | null>(null);
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<AIAgent[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [activeView, setActiveView] = useState<'overview' | 'agents' | 'categories' | 'associations' | 'analytics' | 'alerts'>('overview');
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [searchFilters, setSearchFilters] = useState<AgentSearchFilters>({});
  const [selectedCategory, setSelectedCategory] = useState<AgentCategory | null>(null);

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [userRole, organizationId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Simulate API calls
      const mockDashboardData: AgentManagementDashboard = {
        totalAgents: 24,
        activeAgents: 21,
        agentsByCategory: {
          service_delivery: 12,
          status_monitoring: 6,
          issue_resolution: 4,
          client_coordination: 2,
          system_automation: 0
        },
        agentsByService: {
          shelter: 5,
          food_water: 4,
          sanitation: 3,
          transportation: 2,
          case_management: 3,
          medical: 2,
          mental_health: 1,
          job_training: 2,
          legal_aid: 2
        },
        agentsByAutomationLevel: {
          fully_automated: 8,
          semi_automated: 12,
          assisted: 3,
          monitoring_only: 1
        },
        systemHealth: 'good',
        alerts: generateMockAlerts(),
        recentActivity: generateMockActivity()
      };

      const mockAgents = generateMockAgents();

      setDashboardData(mockDashboardData);
      setAgents(mockAgents);
      setFilteredAgents(mockAgents);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filters: AgentSearchFilters) => {
    setSearchFilters(filters);
    
    let filtered = agents;
    
    if (filters.category?.length) {
      filtered = filtered.filter(agent => filters.category!.includes(agent.category));
    }
    
    if (filters.serviceType?.length) {
      filtered = filtered.filter(agent => 
        agent.serviceTypes.some(service => filters.serviceType!.includes(service))
      );
    }
    
    if (filters.automationLevel?.length) {
      filtered = filtered.filter(agent => filters.automationLevel!.includes(agent.automationLevel));
    }
    
    if (filters.status?.length) {
      filtered = filtered.filter(agent => filters.status!.includes(agent.status));
    }
    
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(agent => 
        agent.name.toLowerCase().includes(term) ||
        agent.description.toLowerCase().includes(term)
      );
    }
    
    setFilteredAgents(filtered);
  };

  const handleAgentAction = async (agentId: string, action: string) => {
    // Simulate agent action
    console.log(`Performing ${action} on agent ${agentId}`);
    
    // Update agent status optimistically
    const updatedAgents = agents.map(agent => 
      agent.id === agentId 
        ? { ...agent, status: getNewStatus(action) as AgentStatus }
        : agent
    );
    
    setAgents(updatedAgents);
    setFilteredAgents(updatedAgents.filter(agent => 
      filteredAgents.some(f => f.id === agent.id)
    ));
  };

  const getNewStatus = (action: string): AgentStatus => {
    switch (action) {
      case 'start': return 'active';
      case 'stop': return 'inactive';
      case 'suspend': return 'suspended';
      case 'resume': return 'active';
      default: return 'active';
    }
  };

  const getSystemHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: AgentStatus) => {
    switch (status) {
      case 'active': return '🟢';
      case 'inactive': return '⚪';
      case 'maintenance': return '🟠';
      case 'error': return '🔴';
      case 'suspended': return '🟡';
      case 'training': return '🔵';
      default: return '⚪';
    }
  };

  const getCategoryIcon = (category: AgentCategory) => {
    switch (category) {
      case 'service_delivery': return '🚀';
      case 'status_monitoring': return '📊';
      case 'issue_resolution': return '🔧';
      case 'client_coordination': return '👥';
      case 'system_automation': return '⚙️';
      default: return '🤖';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-lg">Loading Agent Management Dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="ai-agent-management">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <span className="mr-3">🤖</span>
              AI Agent Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage and monitor AI agents across all service categories
              {userRole === 'staff' && ' (Staff View)'}
            </p>
          </div>
          
          <div className={`px-4 py-2 rounded-full ${getSystemHealthColor(dashboardData?.systemHealth || 'unknown')}`}>
            <span className="font-medium">System Health: {dashboardData?.systemHealth?.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="flex overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'agents', label: 'All Agents', icon: '🤖' },
            { id: 'categories', label: 'Categories', icon: '📁' },
            { id: 'associations', label: 'Agent Network', icon: '🔗' },
            { id: 'analytics', label: 'Analytics', icon: '📈' },
            { id: 'alerts', label: 'Alerts', icon: '🚨' }
          ].map(tab => (
            <button
              key={tab.id}
              data-testid={`agent-tab-${tab.id}`}
              onClick={() => setActiveView(tab.id as typeof activeView)}
              className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 ${
                activeView === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
              {tab.id === 'alerts' && dashboardData?.alerts.filter(a => !a.resolved).length && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                  {dashboardData.alerts.filter(a => !a.resolved).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {activeView === 'overview' && (
          <AgentOverviewView 
            dashboardData={dashboardData!}
            agents={agents}
            userRole={userRole}
            onCategorySelect={setSelectedCategory}
            onAgentSelect={setSelectedAgent}
          />
        )}

        {activeView === 'agents' && (
          <AgentListView
            agents={filteredAgents}
            userRole={userRole}
            searchFilters={searchFilters}
            onFilterChange={handleFilterChange}
            onAgentSelect={(agent: AIAgent) => {
              setSelectedAgent(agent);
              setShowAgentModal(true);
            }}
            onAgentAction={handleAgentAction}
          />
        )}

        {activeView === 'categories' && (
          <AgentCategoryView
            agents={agents}
            dashboardData={dashboardData!}
            userRole={userRole}
            selectedCategory={selectedCategory}
            onCategorySelect={setSelectedCategory}
            onAgentSelect={(agent: AIAgent) => {
              setSelectedAgent(agent);
              setShowAgentModal(true);
            }}
          />
        )}

        {activeView === 'associations' && (
          <AgentAssociationsView
            agents={agents}
            userRole={userRole}
            onAgentSelect={(agent: AIAgent) => {
              setSelectedAgent(agent);
              setShowAgentModal(true);
            }}
          />
        )}

        {activeView === 'analytics' && (
          <AgentPerformanceAnalytics
            agents={agents}
            userRole={userRole}
            timeRange="day"
          />
        )}

        {activeView === 'alerts' && (
          <AgentAlertsView
            alerts={dashboardData?.alerts || []}
            activities={dashboardData?.recentActivity || []}
            userRole={userRole}
            onAlertResolve={(alertId: string) => {
              // Handle alert resolution
              console.log('Resolving alert:', alertId);
            }}
          />
        )}
      </div>

      {/* Agent Details Modal */}
      {showAgentModal && selectedAgent && (
        <AgentDetailsModal
          agent={selectedAgent}
          userRole={userRole}
          isOpen={showAgentModal}
          onClose={() => {
            setShowAgentModal(false);
            setSelectedAgent(null);
          }}
          onAgentUpdate={(updatedAgent) => {
            const updatedAgents = agents.map(a => 
              a.id === updatedAgent.id ? updatedAgent : a
            );
            setAgents(updatedAgents);
          }}
          onAgentAction={handleAgentAction}
        />
      )}
    </div>
  );
};

// Helper function to generate mock data
function generateMockAlerts(): AgentAlert[] {
  return [
  {
    id: 'alert_1',
    agentId: 'shelter_agent_1',
    agentName: 'Shelter Coordination Agent',
    severity: 'high',
    category: 'performance',
    message: 'Response time exceeded threshold (3.2s avg)',
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    resolved: false
  },
  {
    id: 'alert_2',
    agentId: 'food_agent_2',
    agentName: 'Food Service Monitor',
    severity: 'medium',
    category: 'dependency',
    message: 'External API connection unstable',
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    resolved: false
  }
  ];
}

function generateMockActivity(): AgentActivity[] {
  return [
  {
    id: 'activity_1',
    agentId: 'welcome_agent_3',
    agentName: 'Client Welcome Agent',
    action: 'client_registration',
    description: 'Processed new client registration for John Doe',
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    result: 'success'
  },
  {
    id: 'activity_2',
    agentId: 'issue_agent_1',
    agentName: 'Issue Resolution Agent',
    action: 'ticket_resolution',
    description: 'Resolved facility maintenance request #1247',
    timestamp: new Date(Date.now() - 1000 * 60 * 12),
    result: 'success'
  }
  ];
}

function generateMockAgents(): AIAgent[] {
  return [
  {
    id: 'shelter_agent_1',
    name: 'Shelter Coordination Agent',
    description: 'Manages bed assignments and shelter operations',
    category: 'service_delivery',
    serviceTypes: ['shelter'],
    automationLevel: 'semi_automated',
    status: 'active',
    version: '2.1.0',
    accessibleBy: ['manager', 'staff'],
    managedBy: ['manager'],
    performanceMetrics: {
      tasksCompleted: 1247,
      successRate: 94.2,
      averageResponseTime: 850,
      errorCount: 12,
      escalationCount: 8,
      uptime: 98.5,
      lastActive: new Date()
    },
    capabilities: [
      {
        name: 'Bed Assignment',
        description: 'Automatically assign beds based on availability and client needs',
        enabled: true,
        confidenceLevel: 95,
        lastTrained: new Date('2024-01-15')
      }
    ],
    associations: [
      {
        agentId: 'welcome_agent_3',
        agentName: 'Client Welcome Agent',
        associationType: 'collaboration',
        relationship: 'Receives client data for bed assignment',
        dataFlow: 'incoming',
        criticalityLevel: 'critical'
      }
    ],
    configuration: {
      maxConcurrentTasks: 50,
      responseTimeLimit: 2000,
      escalationThreshold: 5,
      allowedActions: ['assign_bed', 'update_availability', 'send_notification'],
      restrictedActions: ['delete_client', 'modify_pricing']
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
    createdBy: 'system',
    lastModifiedBy: 'manager_001',
    healthCheck: {
      status: 'warning',
      lastCheck: new Date(),
      issues: ['Response time above threshold'],
      recommendations: ['Consider scaling up resources', 'Review task queue']
    }
  }
  // Add more mock agents as needed
  ];
}

// Sub-components will be implemented in separate files
const AgentOverviewView = ({ dashboardData, agents, userRole, onCategorySelect, onAgentSelect }: any) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {/* Overview cards will be implemented */}
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-medium">Total Agents</h3>
      <p className="text-3xl font-bold text-blue-600">{dashboardData.totalAgents}</p>
    </div>
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-medium">Active Agents</h3>
      <p className="text-3xl font-bold text-green-600">{dashboardData.activeAgents}</p>
    </div>
  </div>
);

const AgentListView = ({ agents, userRole, searchFilters, onFilterChange, onAgentSelect, onAgentAction }: any) => (
  <div className="bg-white rounded-lg shadow-sm border p-6">
    <h2 className="text-xl font-bold mb-4">All Agents</h2>
    {/* Agent list implementation */}
    <div className="space-y-4">
      {agents.map((agent: AIAgent) => (
        <div key={agent.id} className="border rounded-lg p-4 hover:bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">{agent.name}</h3>
              <p className="text-sm text-gray-600">{agent.description}</p>
            </div>
            <div className="flex items-center space-x-2">
              <span>{getStatusIcon(agent.status)}</span>
              <span className="text-sm">{agent.status}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const AgentAlertsView = ({ alerts, activities, userRole, onAlertResolve }: any) => (
  <div className="space-y-6">
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-xl font-bold mb-4">Active Alerts</h2>
      <div className="space-y-3">
        {alerts.filter((alert: AgentAlert) => !alert.resolved).map((alert: AgentAlert) => (
          <div key={alert.id} className="border rounded-lg p-4 bg-red-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-red-800">{alert.agentName}</h3>
                <p className="text-sm text-red-600">{alert.message}</p>
              </div>
              <button
                onClick={() => onAlertResolve(alert.id)}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
              >
                Resolve
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Helper functions
function getStatusIcon(status: AgentStatus): string {
  switch (status) {
    case 'active': return '🟢';
    case 'inactive': return '⚪';
    case 'maintenance': return '🟠';
    case 'error': return '🔴';
    case 'suspended': return '🟡';
    case 'training': return '🔵';
    default: return '⚪';
  }
}

export default AIAgentManagement;