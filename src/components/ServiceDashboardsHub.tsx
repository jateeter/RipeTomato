/**
 * Service Dashboards Hub
 * 
 * Container component for all service dashboards with navigation
 * and overview metrics.
 */

import React, { useState, useEffect } from 'react';
import { ServiceType } from '../types/ServiceMetrics';
import ServiceDashboard from './ServiceDashboard';
import { agentForagingService } from '../services/agentForagingService';
import ErrorBoundary from './ErrorBoundary';

interface ServiceDashboardsHubProps {
  className?: string;
  defaultView?: 'overview' | 'detailed';
}

const ServiceDashboardsHub: React.FC<ServiceDashboardsHubProps> = ({
  className = '',
  defaultView = 'overview'
}) => {
  const [activeService, setActiveService] = useState<ServiceType | 'all'>('all');
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>(defaultView);
  const [agents, setAgents] = useState(agentForagingService.getAgents());

  const serviceTypes: ServiceType[] = ['shelter', 'food', 'hygiene', 'transportation'];

  useEffect(() => {
    // Update agent data periodically
    const interval = setInterval(() => {
      setAgents(agentForagingService.getAgents());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getServiceConfig = (serviceType: ServiceType) => {
    const configs = {
      shelter: { icon: '🏠', name: 'Shelters', color: 'blue' },
      food: { icon: '🍽️', name: 'Food', color: 'green' },
      hygiene: { icon: '🚿', name: 'Hygiene', color: 'purple' },
      transportation: { icon: '🚌', name: 'Transport', color: 'orange' }
    };
    return configs[serviceType];
  };

  const getTotalActiveAgents = () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return agents.filter(agent => agent.lastActive > fiveMinutesAgo).length;
  };

  const getOverallSystemStatus = () => {
    const activeAgents = getTotalActiveAgents();
    if (activeAgents >= 3) return { status: 'optimal', color: 'green', message: 'All systems operational' };
    if (activeAgents >= 2) return { status: 'good', color: 'yellow', message: 'Systems running normally' };
    return { status: 'limited', color: 'red', message: 'Limited monitoring coverage' };
  };

  const systemStatus = getOverallSystemStatus();

  return (
    <div className={`space-y-6 ${className}`} data-testid="service-dashboards-hub">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Service Dashboards</h2>
            <p className="text-gray-600">Real-time monitoring via agent foraging</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* System Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                systemStatus.color === 'green' ? 'bg-green-500' :
                systemStatus.color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm text-gray-600">{systemStatus.message}</span>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('overview')}
                className={`px-3 py-1 text-sm rounded ${
                  viewMode === 'overview' 
                    ? 'bg-white text-gray-900 shadow' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                data-testid="view-overview"
              >
                Overview
              </button>
              <button
                onClick={() => setViewMode('detailed')}
                className={`px-3 py-1 text-sm rounded ${
                  viewMode === 'detailed' 
                    ? 'bg-white text-gray-900 shadow' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                data-testid="view-detailed"
              >
                Detailed
              </button>
            </div>
          </div>
        </div>

        {/* Service Navigation */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveService('all')}
            className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
              activeService === 'all'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            data-testid="service-all"
          >
            📊 All Services
          </button>
          
          {serviceTypes.map((serviceType) => {
            const config = getServiceConfig(serviceType);
            return (
              <button
                key={serviceType}
                onClick={() => setActiveService(serviceType)}
                className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                  activeService === serviceType
                    ? `bg-${config.color}-600 text-white border-${config.color}-600`
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
                data-testid={`service-${serviceType}`}
              >
                {config.icon} {config.name}
              </button>
            );
          })}
        </div>

        {/* Agent Status Summary */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-600 font-medium">Active Agents</div>
            <div className="text-lg font-bold text-gray-900">{getTotalActiveAgents()}/{agents.length}</div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-600 font-medium">Total Scans</div>
            <div className="text-lg font-bold text-gray-900">
              {agents.reduce((sum, agent) => sum + agent.foragingCount, 0)}
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-600 font-medium">Avg Accuracy</div>
            <div className="text-lg font-bold text-gray-900">
              {agents.length > 0 ? Math.round((agents.reduce((sum, agent) => sum + agent.accuracy, 0) / agents.length) * 100) : 0}%
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-600 font-medium">Coverage</div>
            <div className="text-lg font-bold text-gray-900">
              {Math.round((getTotalActiveAgents() / agents.length) * 100)}%
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <ErrorBoundary>
        {activeService === 'all' ? (
          // All Services View
          <div className={`grid ${
            viewMode === 'overview' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' 
              : 'grid-cols-1 lg:grid-cols-2'
          } gap-6`}>
            {serviceTypes.map((serviceType) => (
              <ServiceDashboard
                key={serviceType}
                serviceType={serviceType}
                compact={viewMode === 'overview'}
                className={viewMode === 'overview' ? 'h-auto' : 'h-full'}
              />
            ))}
          </div>
        ) : (
          // Single Service View
          <div className="max-w-4xl mx-auto">
            <ServiceDashboard
              serviceType={activeService}
              compact={false}
              className="w-full"
            />
          </div>
        )}
      </ErrorBoundary>

      {/* Agent Details (Detailed View Only) */}
      {viewMode === 'detailed' && (
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Foraging Agents</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {agents.map((agent) => (
              <div key={agent.id} className="bg-gray-50 rounded-lg p-3" data-testid={`agent-${agent.id}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-sm text-gray-900">{agent.name}</div>
                  <div className={`w-2 h-2 rounded-full ${
                    new Date(Date.now() - 5 * 60 * 1000) < agent.lastActive 
                      ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                </div>
                
                <div className="space-y-1 text-xs text-gray-600">
                  <div>Type: {agent.type}</div>
                  <div>Reliability: {Math.round(agent.reliability * 100)}%</div>
                  <div>Accuracy: {Math.round(agent.accuracy * 100)}%</div>
                  <div>Scans: {agent.foragingCount}</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {agent.specialties.map((specialty) => (
                      <span key={specialty} className="bg-white px-1 py-0.5 rounded text-xs">
                        {getServiceConfig(specialty).icon}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceDashboardsHub;