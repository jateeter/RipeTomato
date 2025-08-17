/**
 * Agent Associations View Component
 * 
 * Visualizes the network of relationships between AI agents, showing
 * data flow, dependencies, and collaboration patterns.
 */

import React, { useState, useEffect } from 'react';
import {
  AIAgent,
  AgentRole,
  AgentAssociation
} from '../types/AgentManagement';

interface AgentAssociationsViewProps {
  agents: AIAgent[];
  userRole: AgentRole;
  onAgentSelect: (agent: AIAgent) => void;
}

interface NetworkNode {
  id: string;
  name: string;
  category: string;
  status: string;
  x: number;
  y: number;
  connections: string[];
}

interface NetworkEdge {
  from: string;
  to: string;
  type: string;
  dataFlow: string;
  criticality: string;
  label: string;
}

export const AgentAssociationsView: React.FC<AgentAssociationsViewProps> = ({
  agents,
  userRole,
  onAgentSelect
}) => {
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  const [viewMode, setViewMode] = useState<'network' | 'hierarchy' | 'flow'>('network');
  const [networkData, setNetworkData] = useState<{nodes: NetworkNode[]; edges: NetworkEdge[]}>({
    nodes: [],
    edges: []
  });
  const [filterByCategory, setFilterByCategory] = useState<string>('all');
  const [filterByCriticality, setFilterByCriticality] = useState<string>('all');

  useEffect(() => {
    generateNetworkData();
  }, [agents, filterByCategory, filterByCriticality]);

  const generateNetworkData = () => {
    let filteredAgents = agents;
    
    if (filterByCategory !== 'all') {
      filteredAgents = agents.filter(agent => agent.category === filterByCategory);
    }

    // Create nodes
    const nodes: NetworkNode[] = filteredAgents.map((agent, index) => ({
      id: agent.id,
      name: agent.name,
      category: agent.category,
      status: agent.status,
      x: (index % 4) * 200 + 100,
      y: Math.floor(index / 4) * 150 + 100,
      connections: agent.associations.map(assoc => assoc.agentId)
    }));

    // Create edges
    const edges: NetworkEdge[] = [];
    filteredAgents.forEach(agent => {
      agent.associations.forEach(assoc => {
        if (filterByCriticality === 'all' || assoc.criticalityLevel === filterByCriticality) {
          // Only add edge if target agent exists in filtered set
          if (filteredAgents.some(a => a.id === assoc.agentId)) {
            edges.push({
              from: agent.id,
              to: assoc.agentId,
              type: assoc.associationType,
              dataFlow: assoc.dataFlow,
              criticality: assoc.criticalityLevel,
              label: assoc.relationship
            });
          }
        }
      });
    });

    setNetworkData({ nodes, edges });
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      service_delivery: '#3B82F6', // blue
      status_monitoring: '#10B981', // green
      issue_resolution: '#F59E0B', // orange
      client_coordination: '#8B5CF6', // purple
      system_automation: '#6B7280' // gray
    };
    return colors[category as keyof typeof colors] || '#6B7280';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: '#10B981',
      inactive: '#9CA3AF',
      maintenance: '#F59E0B',
      error: '#EF4444',
      suspended: '#F59E0B',
      training: '#3B82F6'
    };
    return colors[status as keyof typeof colors] || '#9CA3AF';
  };

  const getAssociationIcon = (type: string) => {
    switch (type) {
      case 'supervisor': return '👆';
      case 'subordinate': return '👇';
      case 'peer': return '👥';
      case 'dependency': return '🔗';
      case 'collaboration': return '🤝';
      default: return '↔️';
    }
  };

  const getDataFlowIcon = (flow: string) => {
    switch (flow) {
      case 'bidirectional': return '↔️';
      case 'incoming': return '⬇️';
      case 'outgoing': return '⬆️';
      case 'none': return '➖';
      default: return '↔️';
    }
  };

  const getCriticalityColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'important': return 'text-yellow-600 bg-yellow-100';
      case 'optional': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const renderNetworkView = () => (
    <div className="relative bg-gray-50 rounded-lg" style={{ height: '600px' }}>
      <svg width="100%" height="100%" className="absolute inset-0">
        {/* Render edges first */}
        {networkData.edges.map((edge, index) => {
          const fromNode = networkData.nodes.find(n => n.id === edge.from);
          const toNode = networkData.nodes.find(n => n.id === edge.to);
          
          if (!fromNode || !toNode) return null;
          
          const strokeColor = edge.criticality === 'critical' ? '#EF4444' :
                             edge.criticality === 'important' ? '#F59E0B' : '#9CA3AF';
          const strokeWidth = edge.criticality === 'critical' ? 3 :
                             edge.criticality === 'important' ? 2 : 1;

          return (
            <g key={`edge-${index}`}>
              <line
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeDasharray={edge.dataFlow === 'none' ? '5,5' : 'none'}
                markerEnd="url(#arrowhead)"
              />
              {/* Edge label */}
              <text
                x={(fromNode.x + toNode.x) / 2}
                y={(fromNode.y + toNode.y) / 2 - 10}
                textAnchor="middle"
                className="text-xs fill-gray-600"
                style={{ fontSize: '10px' }}
              >
                {getAssociationIcon(edge.type)} {getDataFlowIcon(edge.dataFlow)}
              </text>
            </g>
          );
        })}
        
        {/* Arrow marker definition */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="#9CA3AF"
            />
          </marker>
        </defs>
      </svg>

      {/* Render nodes */}
      {networkData.nodes.map(node => {
        const agent = agents.find(a => a.id === node.id);
        if (!agent) return null;

        return (
          <div
            key={node.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
            style={{ left: node.x, top: node.y }}
            onClick={() => {
              setSelectedAgent(agent);
              onAgentSelect(agent);
            }}
            data-testid={`network-node-${node.id}`}
          >
            <div className={`w-20 h-20 rounded-full border-4 flex flex-col items-center justify-center text-xs text-center shadow-lg transition-transform hover:scale-110 ${
              selectedAgent?.id === node.id ? 'ring-4 ring-blue-300' : ''
            }`}
            style={{ 
              backgroundColor: getCategoryColor(node.category),
              borderColor: getStatusColor(node.status),
              color: 'white'
            }}>
              <div className="text-lg mb-1">
                {node.category === 'service_delivery' ? '🚀' :
                 node.category === 'status_monitoring' ? '📊' :
                 node.category === 'issue_resolution' ? '🔧' :
                 node.category === 'client_coordination' ? '👥' : '⚙️'}
              </div>
              <div className="text-xs font-medium leading-tight">
                {node.name.split(' ').slice(0, 2).join(' ')}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderHierarchyView = () => {
    const supervisors = agents.filter(agent => 
      agent.associations.some(assoc => assoc.associationType === 'supervisor')
    );
    const peers = agents.filter(agent =>
      agent.associations.some(assoc => assoc.associationType === 'peer')
    );
    const subordinates = agents.filter(agent =>
      agent.associations.some(assoc => assoc.associationType === 'subordinate')
    );

    return (
      <div className="space-y-8">
        {/* Supervisors */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">👆 Supervisor Agents</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {supervisors.map(agent => (
              <AgentCard key={agent.id} agent={agent} onClick={() => onAgentSelect(agent)} />
            ))}
          </div>
        </div>

        {/* Peers */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">👥 Peer Agents</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {peers.map(agent => (
              <AgentCard key={agent.id} agent={agent} onClick={() => onAgentSelect(agent)} />
            ))}
          </div>
        </div>

        {/* Subordinates */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">👇 Subordinate Agents</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subordinates.map(agent => (
              <AgentCard key={agent.id} agent={agent} onClick={() => onAgentSelect(agent)} />
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderFlowView = () => {
    // Group agents by data flow patterns
    const dataProviders = agents.filter(agent =>
      agent.associations.some(assoc => assoc.dataFlow === 'outgoing')
    );
    const dataConsumers = agents.filter(agent =>
      agent.associations.some(assoc => assoc.dataFlow === 'incoming')
    );
    const bidirectionalAgents = agents.filter(agent =>
      agent.associations.some(assoc => assoc.dataFlow === 'bidirectional')
    );

    return (
      <div className="space-y-8">
        {/* Data Providers */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">⬆️ Data Providers</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dataProviders.map(agent => (
              <AgentCard key={`provider-${agent.id}`} agent={agent} onClick={() => onAgentSelect(agent)} />
            ))}
          </div>
        </div>

        {/* Bidirectional Agents */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">↔️ Bidirectional Agents</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bidirectionalAgents.map(agent => (
              <AgentCard key={`bidirectional-${agent.id}`} agent={agent} onClick={() => onAgentSelect(agent)} />
            ))}
          </div>
        </div>

        {/* Data Consumers */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">⬇️ Data Consumers</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dataConsumers.map(agent => (
              <AgentCard key={`consumer-${agent.id}`} agent={agent} onClick={() => onAgentSelect(agent)} />
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6" data-testid="agent-associations-view">
      {/* Header and Controls */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Agent Network</h2>
            <p className="text-gray-600">Visualize relationships and data flow between AI agents</p>
          </div>
          
          {/* View Mode Selector */}
          <div className="flex items-center space-x-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              {[
                { mode: 'network', label: 'Network', icon: '🕸️' },
                { mode: 'hierarchy', label: 'Hierarchy', icon: '📊' },
                { mode: 'flow', label: 'Data Flow', icon: '🔄' }
              ].map(option => (
                <button
                  key={option.mode}
                  onClick={() => setViewMode(option.mode as typeof viewMode)}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    viewMode === option.mode
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  data-testid={`view-mode-${option.mode}`}
                >
                  <span className="mr-2">{option.icon}</span>
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mt-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Category:</label>
            <select
              value={filterByCategory}
              onChange={(e) => setFilterByCategory(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              data-testid="category-filter"
            >
              <option value="all">All Categories</option>
              <option value="service_delivery">Service Delivery</option>
              <option value="status_monitoring">Status Monitoring</option>
              <option value="issue_resolution">Issue Resolution</option>
              <option value="client_coordination">Client Coordination</option>
              <option value="system_automation">System Automation</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Criticality:</label>
            <select
              value={filterByCriticality}
              onChange={(e) => setFilterByCriticality(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              data-testid="criticality-filter"
            >
              <option value="all">All Levels</option>
              <option value="critical">Critical</option>
              <option value="important">Important</option>
              <option value="optional">Optional</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          {viewMode === 'network' && renderNetworkView()}
          {viewMode === 'hierarchy' && renderHierarchyView()}
          {viewMode === 'flow' && renderFlowView()}
        </div>
      </div>

      {/* Selected Agent Details */}
      {selectedAgent && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Agent Associations: {selectedAgent.name}
          </h3>
          
          <div className="space-y-4">
            {selectedAgent.associations.map((assoc, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <span className="text-2xl">{getAssociationIcon(assoc.associationType)}</span>
                  <div>
                    <div className="font-medium text-gray-900">{assoc.agentName}</div>
                    <div className="text-sm text-gray-600">{assoc.relationship}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getCriticalityColor(assoc.criticalityLevel)}`}>
                    {assoc.criticalityLevel}
                  </span>
                  <span className="text-lg" title={`Data Flow: ${assoc.dataFlow}`}>
                    {getDataFlowIcon(assoc.dataFlow)}
                  </span>
                  <span className="text-xs text-gray-500 capitalize">
                    {assoc.associationType}
                  </span>
                </div>
              </div>
            ))}
            
            {selectedAgent.associations.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                This agent has no associations with other agents.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Legend</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Association Types</h4>
            <div className="space-y-1 text-sm">
              <div>👆 Supervisor - Manages other agents</div>
              <div>👇 Subordinate - Managed by other agents</div>
              <div>👥 Peer - Equal relationship</div>
              <div>🔗 Dependency - Depends on other agent</div>
              <div>🤝 Collaboration - Works together</div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Data Flow</h4>
            <div className="space-y-1 text-sm">
              <div>↔️ Bidirectional - Data flows both ways</div>
              <div>⬆️ Outgoing - Provides data to others</div>
              <div>⬇️ Incoming - Receives data from others</div>
              <div>➖ None - No data exchange</div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Criticality Levels</h4>
            <div className="space-y-1 text-sm">
              <div className="flex items-center">
                <span className="w-4 h-4 bg-red-100 border border-red-200 rounded mr-2"></span>
                Critical - Essential relationship
              </div>
              <div className="flex items-center">
                <span className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded mr-2"></span>
                Important - Significant relationship
              </div>
              <div className="flex items-center">
                <span className="w-4 h-4 bg-gray-100 border border-gray-200 rounded mr-2"></span>
                Optional - Nice to have
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper component for agent cards
const AgentCard: React.FC<{ agent: AIAgent; onClick: () => void }> = ({ agent, onClick }) => (
  <div
    className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
    onClick={onClick}
    data-testid={`agent-card-${agent.id}`}
  >
    <div className="flex items-center justify-between mb-2">
      <h4 className="font-medium text-gray-900">{agent.name}</h4>
      <span className={`px-2 py-1 rounded text-xs ${
        agent.status === 'active' ? 'bg-green-100 text-green-800' :
        agent.status === 'error' ? 'bg-red-100 text-red-800' :
        'bg-gray-100 text-gray-800'
      }`}>
        {agent.status}
      </span>
    </div>
    <p className="text-sm text-gray-600 mb-3">{agent.description}</p>
    <div className="text-xs text-gray-500">
      {agent.associations.length} association{agent.associations.length !== 1 ? 's' : ''}
    </div>
  </div>
);