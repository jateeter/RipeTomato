/**
 * Agent Category View Component
 * 
 * Displays agents organized by categories with detailed breakdowns
 * of service delivery agents, status monitoring, and issue resolution agents.
 */

import React, { useState } from 'react';
import {
  AIAgent,
  AgentCategory,
  ServiceType,
  AutomationLevel,
  AgentRole,
  AgentManagementDashboard,
  ServiceDeliveryAgent,
  StatusMonitoringAgent,
  IssueResolutionAgent
} from '../types/AgentManagement';

interface AgentCategoryViewProps {
  agents: AIAgent[];
  dashboardData: AgentManagementDashboard;
  userRole: AgentRole;
  selectedCategory: AgentCategory | null;
  onCategorySelect: (category: AgentCategory | null) => void;
  onAgentSelect: (agent: AIAgent) => void;
}

export const AgentCategoryView: React.FC<AgentCategoryViewProps> = ({
  agents,
  dashboardData,
  userRole,
  selectedCategory,
  onCategorySelect,
  onAgentSelect
}) => {
  const [expandedCategory, setExpandedCategory] = useState<AgentCategory | null>(null);

  const categoryConfigs = [
    {
      category: 'service_delivery' as AgentCategory,
      title: 'Service Delivery Agents',
      icon: '🚀',
      color: 'blue',
      description: 'Agents that directly deliver services to clients across various service types',
      automationLevels: ['fully_automated', 'semi_automated', 'assisted'] as AutomationLevel[]
    },
    {
      category: 'status_monitoring' as AgentCategory,
      title: 'Status Monitoring Agents',
      icon: '📊',
      color: 'green',
      description: 'Agents that monitor system health, service availability, and performance metrics',
      automationLevels: ['monitoring_only', 'assisted'] as AutomationLevel[]
    },
    {
      category: 'issue_resolution' as AgentCategory,
      title: 'Issue Resolution Agents',
      icon: '🔧',
      color: 'orange',
      description: 'Agents that identify, diagnose, and resolve operational issues automatically',
      automationLevels: ['fully_automated', 'semi_automated', 'assisted'] as AutomationLevel[]
    },
    {
      category: 'client_coordination' as AgentCategory,
      title: 'Client Coordination Agents',
      icon: '👥',
      color: 'purple',
      description: 'Agents that manage client relationships and coordinate between multiple services',
      automationLevels: ['semi_automated', 'assisted'] as AutomationLevel[]
    },
    {
      category: 'system_automation' as AgentCategory,
      title: 'System Automation Agents',
      icon: '⚙️',
      color: 'gray',
      description: 'Agents that handle system-level tasks like backups, updates, and maintenance',
      automationLevels: ['fully_automated'] as AutomationLevel[]
    }
  ];

  const getAgentsByCategory = (category: AgentCategory) => {
    return agents.filter(agent => agent.category === category);
  };

  const getCategoryColor = (color: string, variant: 'bg' | 'text' | 'border' = 'bg') => {
    const colors = {
      blue: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
      green: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
      orange: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
      gray: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' }
    };
    return colors[color as keyof typeof colors]?.[variant] || colors.gray[variant];
  };

  const getAutomationLevelIcon = (level: AutomationLevel) => {
    switch (level) {
      case 'fully_automated': return '🤖';
      case 'semi_automated': return '⚡';
      case 'assisted': return '🤝';
      case 'monitoring_only': return '👁️';
      default: return '❓';
    }
  };

  const getAutomationLevelColor = (level: AutomationLevel) => {
    switch (level) {
      case 'fully_automated': return 'text-green-600 bg-green-100';
      case 'semi_automated': return 'text-blue-600 bg-blue-100';
      case 'assisted': return 'text-orange-600 bg-orange-100';
      case 'monitoring_only': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const renderServiceDeliveryDetails = (agent: ServiceDeliveryAgent) => (
    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
      <h4 className="font-medium text-blue-800 mb-2">Service Delivery Configuration</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <span className="font-medium">Service Types:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {agent.serviceTypes.map(service => (
              <span key={service} className="px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs">
                {service.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>
        <div>
          <span className="font-medium">Client Capacity:</span>
          <span className="ml-2">{agent.serviceSpecificConfig.clientCapacity}</span>
        </div>
        <div>
          <span className="font-medium">Service Hours:</span>
          <span className="ml-2">
            {agent.serviceSpecificConfig.serviceHours.start} - {agent.serviceSpecificConfig.serviceHours.end}
          </span>
        </div>
        <div>
          <span className="font-medium">Specializations:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {agent.serviceSpecificConfig.specializations.map(spec => (
              <span key={spec} className="px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs">
                {spec}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStatusMonitoringDetails = (agent: StatusMonitoringAgent) => (
    <div className="mt-4 p-4 bg-green-50 rounded-lg">
      <h4 className="font-medium text-green-800 mb-2">Monitoring Configuration</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <span className="font-medium">Monitored Systems:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {agent.monitoringConfig.monitoredSystems.map(system => (
              <span key={system} className="px-2 py-1 bg-green-200 text-green-800 rounded text-xs">
                {system}
              </span>
            ))}
          </div>
        </div>
        <div>
          <span className="font-medium">Check Interval:</span>
          <span className="ml-2">{agent.monitoringConfig.checkInterval / 1000}s</span>
        </div>
        <div>
          <span className="font-medium">Warning Threshold:</span>
          <span className="ml-2">{agent.monitoringConfig.alertThresholds.warning}%</span>
        </div>
        <div>
          <span className="font-medium">Critical Threshold:</span>
          <span className="ml-2">{agent.monitoringConfig.alertThresholds.critical}%</span>
        </div>
      </div>
    </div>
  );

  const renderIssueResolutionDetails = (agent: IssueResolutionAgent) => (
    <div className="mt-4 p-4 bg-orange-50 rounded-lg">
      <h4 className="font-medium text-orange-800 mb-2">Resolution Configuration</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <span className="font-medium">Issue Categories:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {agent.resolutionConfig.issueCategories.map(category => (
              <span key={category} className="px-2 py-1 bg-orange-200 text-orange-800 rounded text-xs">
                {category}
              </span>
            ))}
          </div>
        </div>
        <div>
          <span className="font-medium">Knowledge Base Articles:</span>
          <span className="ml-2">{agent.resolutionConfig.knowledgeBase.articleCount}</span>
        </div>
        <div className="col-span-2">
          <span className="font-medium">Resolution Strategies:</span>
          <div className="mt-2 space-y-2">
            {agent.resolutionConfig.resolutionStrategies.map((strategy, index) => (
              <div key={index} className="flex items-center justify-between bg-white p-2 rounded">
                <span className="text-sm">{strategy.category}</span>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs ${getAutomationLevelColor(strategy.automationLevel)}`}>
                    {getAutomationLevelIcon(strategy.automationLevel)} {strategy.automationLevel.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-gray-500">Max: {strategy.maxAttempts}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6" data-testid="agent-category-view">
      {/* Category Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {categoryConfigs.map(config => {
          const categoryAgents = getAgentsByCategory(config.category);
          const activeAgents = categoryAgents.filter(agent => agent.status === 'active');
          
          return (
            <div
              key={config.category}
              className={`bg-white rounded-lg shadow-sm border-2 cursor-pointer transition-all hover:shadow-md ${
                selectedCategory === config.category 
                  ? `${getCategoryColor(config.color, 'border')} ring-2 ring-opacity-50` 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onCategorySelect(
                selectedCategory === config.category ? null : config.category
              )}
              data-testid={`category-card-${config.category}`}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${getCategoryColor(config.color, 'bg')}`}>
                    <span className="text-2xl">{config.icon}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      {categoryAgents.length}
                    </div>
                    <div className="text-sm text-gray-500">
                      {activeAgents.length} active
                    </div>
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {config.title}
                </h3>
                
                <p className="text-sm text-gray-600 mb-4">
                  {config.description}
                </p>
                
                {/* Automation Level Distribution */}
                <div className="space-y-2">
                  <div className="text-xs font-medium text-gray-700">Automation Levels:</div>
                  {config.automationLevels.map(level => {
                    const count = categoryAgents.filter(agent => agent.automationLevel === level).length;
                    return count > 0 ? (
                      <div key={level} className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">
                          {getAutomationLevelIcon(level)} {level.replace('_', ' ')}
                        </span>
                        <span className="text-xs font-medium">{count}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Category View */}
      {selectedCategory && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {categoryConfigs.find(c => c.category === selectedCategory)?.title} Details
              </h2>
              <button
                onClick={() => onCategorySelect(null)}
                className="text-gray-500 hover:text-gray-700"
                data-testid="close-category-details"
              >
                ✕
              </button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-6">
              {getAgentsByCategory(selectedCategory).map(agent => (
                <div key={agent.id} className="border rounded-lg overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">
                            {agent.name}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getAutomationLevelColor(agent.automationLevel)}`}>
                            {getAutomationLevelIcon(agent.automationLevel)} {agent.automationLevel.replace('_', ' ')}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            agent.status === 'active' ? 'bg-green-100 text-green-800' :
                            agent.status === 'error' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {agent.status}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 mb-4">{agent.description}</p>
                        
                        {/* Performance Metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="text-center p-3 bg-gray-50 rounded">
                            <div className="text-lg font-bold text-gray-900">
                              {agent.performanceMetrics.successRate}%
                            </div>
                            <div className="text-xs text-gray-600">Success Rate</div>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded">
                            <div className="text-lg font-bold text-gray-900">
                              {agent.performanceMetrics.tasksCompleted}
                            </div>
                            <div className="text-xs text-gray-600">Tasks Completed</div>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded">
                            <div className="text-lg font-bold text-gray-900">
                              {Math.round(agent.performanceMetrics.averageResponseTime / 1000)}s
                            </div>
                            <div className="text-xs text-gray-600">Avg Response</div>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded">
                            <div className="text-lg font-bold text-gray-900">
                              {agent.performanceMetrics.uptime}%
                            </div>
                            <div className="text-xs text-gray-600">Uptime</div>
                          </div>
                        </div>

                        {/* Agent Associations */}
                        {agent.associations.length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-medium text-gray-900 mb-2">Agent Associations:</h4>
                            <div className="space-y-1">
                              {agent.associations.map(assoc => (
                                <div key={assoc.agentId} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                                  <div>
                                    <span className="font-medium">{assoc.agentName}</span>
                                    <span className="text-gray-600 ml-2">({assoc.associationType})</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className={`px-2 py-1 rounded text-xs ${
                                      assoc.criticalityLevel === 'critical' ? 'bg-red-100 text-red-800' :
                                      assoc.criticalityLevel === 'important' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {assoc.criticalityLevel}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {assoc.dataFlow === 'bidirectional' ? '↔️' :
                                       assoc.dataFlow === 'incoming' ? '⬇️' :
                                       assoc.dataFlow === 'outgoing' ? '⬆️' : '➖'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-4 flex flex-col space-y-2">
                        <button
                          onClick={() => onAgentSelect(agent)}
                          className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          data-testid={`view-agent-${agent.id}`}
                        >
                          View Details
                        </button>
                        {userRole === 'manager' && (
                          <button
                            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
                            data-testid={`configure-agent-${agent.id}`}
                          >
                            Configure
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Category-specific details */}
                    {agent.category === 'service_delivery' && renderServiceDeliveryDetails(agent as ServiceDeliveryAgent)}
                    {agent.category === 'status_monitoring' && renderStatusMonitoringDetails(agent as StatusMonitoringAgent)}
                    {agent.category === 'issue_resolution' && renderIssueResolutionDetails(agent as IssueResolutionAgent)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};