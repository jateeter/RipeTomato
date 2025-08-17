/**
 * Service Dashboard Component
 * 
 * Minimal dashboard displaying metrics for Shelters, Food, Hygiene, and Transportation
 * services with agent-provided foraging data.
 */

import React, { useState, useEffect } from 'react';
import { ServiceType, ServiceDashboardData, ServiceAlert } from '../types/ServiceMetrics';
import { agentForagingService } from '../services/agentForagingService';
import ErrorBoundary from './ErrorBoundary';

interface ServiceDashboardProps {
  serviceType: ServiceType;
  className?: string;
  compact?: boolean;
}

const ServiceDashboard: React.FC<ServiceDashboardProps> = ({
  serviceType,
  className = '',
  compact = false
}) => {
  const [dashboardData, setDashboardData] = useState<ServiceDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadDashboardData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      if (autoRefresh) {
        loadDashboardData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [serviceType, autoRefresh]);

  const loadDashboardData = () => {
    try {
      const data = agentForagingService.getServiceDashboard(serviceType);
      setDashboardData(data);
    } catch (error) {
      console.error(`Failed to load ${serviceType} dashboard:`, error);
    } finally {
      setLoading(false);
    }
  };

  const getServiceIcon = (type: ServiceType): string => {
    switch (type) {
      case 'shelter': return '🏠';
      case 'food': return '🍽️';
      case 'hygiene': return '🚿';
      case 'transportation': return '🚌';
      default: return '📊';
    }
  };

  const getServiceTitle = (type: ServiceType): string => {
    switch (type) {
      case 'shelter': return 'Emergency Shelters';
      case 'food': return 'Food Services';
      case 'hygiene': return 'Hygiene Centers';
      case 'transportation': return 'Transportation';
      default: return 'Service';
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable'): string => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '➡️';
    }
  };

  const getAlertIcon = (severity: 'info' | 'warning' | 'critical'): string => {
    switch (severity) {
      case 'info': return 'ℹ️';
      case 'warning': return '⚠️';
      case 'critical': return '🚨';
    }
  };

  const formatMetricValue = (value: number, unit: string): string => {
    const roundedValue = Math.round(value * 100) / 100;
    return `${roundedValue}${unit}`;
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
        <div className="text-center text-gray-500">
          <div className="text-2xl mb-2">⚠️</div>
          <p>Unable to load {getServiceTitle(serviceType)} data</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`} data-testid={`${serviceType}-dashboard`}>
      {/* Header */}
      <div className="px-4 py-3 border-b bg-gray-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl">{getServiceIcon(serviceType)}</span>
            <h3 className="text-lg font-semibold text-gray-900">
              {getServiceTitle(serviceType)}
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-2 py-1 text-xs rounded ${
                autoRefresh 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-600'
              }`}
              data-testid={`${serviceType}-auto-refresh`}
            >
              {autoRefresh ? '🔄 Live' : '⏸️ Paused'}
            </button>
            <button
              onClick={loadDashboardData}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              data-testid={`${serviceType}-refresh`}
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Key Metrics Grid */}
        <div className={`grid ${compact ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'} gap-3 mb-4`}>
          <div className="bg-blue-50 rounded-lg p-3" data-testid={`${serviceType}-total-locations`}>
            <div className="text-xs text-blue-600 font-medium">Total Locations</div>
            <div className="text-lg font-bold text-blue-700">{dashboardData.totalLocations}</div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-3" data-testid={`${serviceType}-operational`}>
            <div className="text-xs text-green-600 font-medium">Operational</div>
            <div className="text-lg font-bold text-green-700">{dashboardData.operationalLocations}</div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-3" data-testid={`${serviceType}-utilization`}>
            <div className="text-xs text-purple-600 font-medium">Utilization</div>
            <div className="text-lg font-bold text-purple-700">
              {Math.round(dashboardData.utilizationRate * 100)}%
            </div>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-3" data-testid={`${serviceType}-quality`}>
            <div className="text-xs text-orange-600 font-medium">Avg Quality</div>
            <div className="text-lg font-bold text-orange-700">
              {dashboardData.averageQuality.toFixed(1)}/5
            </div>
          </div>
        </div>

        {/* Detailed Metrics */}
        {!compact && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Agent Metrics</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {dashboardData.metrics.map((metric) => (
                <div key={metric.id} className="bg-gray-50 rounded-lg p-3" data-testid={`metric-${metric.id}`}>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-600">{metric.name}</div>
                    <div className="text-xs">{getTrendIcon(metric.trend)}</div>
                  </div>
                  <div className="font-semibold text-gray-900">
                    {formatMetricValue(metric.value, metric.unit)}
                  </div>
                  <div className={`text-xs ${
                    metric.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metric.changePercent >= 0 ? '+' : ''}{metric.changePercent.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alerts */}
        {dashboardData.alerts.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Active Alerts</h4>
            <div className="space-y-2">
              {dashboardData.alerts.slice(0, compact ? 2 : 3).map((alert) => (
                <div 
                  key={alert.id} 
                  className={`p-2 rounded-lg text-xs ${
                    alert.severity === 'critical' ? 'bg-red-50 text-red-700 border border-red-200' :
                    alert.severity === 'warning' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                    'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}
                  data-testid={`alert-${alert.id}`}
                >
                  <div className="flex items-center space-x-2">
                    <span>{getAlertIcon(alert.severity)}</span>
                    <span className="flex-1">{alert.message}</span>
                    <span className="text-xs opacity-75">
                      {alert.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Agent Activity */}
        {!compact && dashboardData.recentForaging.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Agent Activity</h4>
            <div className="text-xs text-gray-600 space-y-1">
              {dashboardData.recentForaging.slice(0, 3).map((foraging, index) => (
                <div key={index} className="flex items-center justify-between py-1">
                  <span>🤖 Agent scan: {foraging.operationalStatus}</span>
                  <span>{foraging.timestamp.toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Last Updated */}
        <div className="mt-4 pt-3 border-t text-xs text-gray-500 text-center">
          Last updated: {dashboardData.lastUpdated.toLocaleTimeString()}
          {dashboardData.recentForaging.length > 0 && (
            <span className="ml-2">• {dashboardData.recentForaging.length} agent reports</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceDashboard;