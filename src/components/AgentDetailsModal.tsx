/**
 * Agent Details Modal Component
 * 
 * Detailed view and management interface for individual AI agents
 */

import React, { useState } from 'react';
import {
  AIAgent,
  AgentRole,
  ServiceDeliveryAgent,
  StatusMonitoringAgent,
  IssueResolutionAgent
} from '../types/AgentManagement';

interface AgentDetailsModalProps {
  agent: AIAgent;
  userRole: AgentRole;
  isOpen: boolean;
  onClose: () => void;
  onAgentUpdate: (agent: AIAgent) => void;
  onAgentAction: (agentId: string, action: string) => void;
}

export const AgentDetailsModal: React.FC<AgentDetailsModalProps> = ({
  agent,
  userRole,
  isOpen,
  onClose,
  onAgentUpdate,
  onAgentAction
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'config' | 'associations'>('overview');
  const [isEditing, setIsEditing] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" data-testid="agent-details-modal">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
        {/* Overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        {/* Modal */}
        <div className="inline-block bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all w-full max-w-4xl">
          {/* Header */}
          <div className="bg-gray-50 px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{agent.name}</h2>
                <p className="text-sm text-gray-600">{agent.description}</p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
                data-testid="close-modal"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>
          </div>

          {/* Navigation */}
          <div className="border-b">
            <nav className="flex">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'performance', label: 'Performance', icon: '⚡' },
                { id: 'config', label: 'Configuration', icon: '⚙️' },
                { id: 'associations', label: 'Associations', icon: '🔗' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`px-6 py-3 text-sm font-medium border-b-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="px-6 py-6 max-h-96 overflow-y-auto">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Basic Information</h3>
                    <div className="mt-2 space-y-2">
                      <div><span className="font-medium">ID:</span> {agent.id}</div>
                      <div><span className="font-medium">Version:</span> {agent.version}</div>
                      <div><span className="font-medium">Status:</span> {agent.status}</div>
                      <div><span className="font-medium">Category:</span> {agent.category}</div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Health Status</h3>
                    <div className="mt-2">
                      <div className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        agent.healthCheck.status === 'healthy' ? 'bg-green-100 text-green-800' :
                        agent.healthCheck.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {agent.healthCheck.status}
                      </div>
                      <div className="text-sm text-gray-600 mt-2">
                        Last Check: {agent.healthCheck.lastCheck.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'performance' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded">
                    <div className="text-2xl font-bold text-blue-600">
                      {agent.performanceMetrics.successRate}%
                    </div>
                    <div className="text-sm text-gray-600">Success Rate</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded">
                    <div className="text-2xl font-bold text-green-600">
                      {agent.performanceMetrics.tasksCompleted}
                    </div>
                    <div className="text-sm text-gray-600">Tasks</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded">
                    <div className="text-2xl font-bold text-orange-600">
                      {Math.round(agent.performanceMetrics.averageResponseTime / 1000)}s
                    </div>
                    <div className="text-sm text-gray-600">Avg Response</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded">
                    <div className="text-2xl font-bold text-purple-600">
                      {agent.performanceMetrics.uptime}%
                    </div>
                    <div className="text-sm text-gray-600">Uptime</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'config' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Configuration</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Max Concurrent Tasks</label>
                      <div className="mt-1">
                        {isEditing ? (
                          <input
                            type="number"
                            defaultValue={agent.configuration.maxConcurrentTasks}
                            className="border border-gray-300 rounded px-3 py-2"
                          />
                        ) : (
                          <span>{agent.configuration.maxConcurrentTasks}</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Response Time Limit (ms)</label>
                      <div className="mt-1">
                        {isEditing ? (
                          <input
                            type="number"
                            defaultValue={agent.configuration.responseTimeLimit}
                            className="border border-gray-300 rounded px-3 py-2"
                          />
                        ) : (
                          <span>{agent.configuration.responseTimeLimit}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'associations' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Agent Associations</h3>
                {agent.associations.map((assoc, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{assoc.agentName}</h4>
                        <p className="text-sm text-gray-600">{assoc.relationship}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded ${
                        assoc.criticalityLevel === 'critical' ? 'bg-red-100 text-red-800' :
                        assoc.criticalityLevel === 'important' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {assoc.criticalityLevel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t flex justify-between">
            <div className="flex space-x-3">
              {userRole === 'manager' && (
                <>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    {isEditing ? 'Cancel Edit' : 'Edit'}
                  </button>
                  {isEditing && (
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        onAgentUpdate(agent);
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                      Save Changes
                    </button>
                  )}
                </>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => onAgentAction(agent.id, 'restart')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Restart
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};