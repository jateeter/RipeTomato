/**
 * Agent Performance Analytics Component
 * 
 * Provides comprehensive analytics and performance monitoring for AI agents
 * with real-time metrics, trend analysis, and performance insights.
 */

import React, { useState, useEffect } from 'react';
import {
  AIAgent,
  AgentRole,
  AgentAnalytics,
  AgentCategory,
  AutomationLevel
} from '../types/AgentManagement';

interface AgentPerformanceAnalyticsProps {
  agents: AIAgent[];
  userRole: AgentRole;
  timeRange: 'hour' | 'day' | 'week' | 'month';
}

export const AgentPerformanceAnalytics: React.FC<AgentPerformanceAnalyticsProps> = ({
  agents,
  userRole,
  timeRange: initialTimeRange
}) => {
  const [timeRange, setTimeRange] = useState(initialTimeRange);
  const [selectedCategory, setSelectedCategory] = useState<AgentCategory | 'all'>('all');
  const [analytics, setAnalytics] = useState<AgentAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateAnalytics();
  }, [agents, timeRange, selectedCategory]);

  const generateAnalytics = () => {
    setLoading(true);
    
    // Filter agents by category if selected
    let filteredAgents = agents;
    if (selectedCategory !== 'all') {
      filteredAgents = agents.filter(agent => agent.category === selectedCategory);
    }

    // Generate mock analytics data based on agents
    const totalTasks = filteredAgents.reduce((sum, agent) => sum + agent.performanceMetrics.tasksCompleted, 0);
    const totalErrors = filteredAgents.reduce((sum, agent) => sum + agent.performanceMetrics.errorCount, 0);
    const failedTasks = Math.round(totalTasks * 0.05); // Assume 5% failure rate

    const mockAnalytics: AgentAnalytics = {
      timeRange,
      metrics: {
        totalTasks,
        completedTasks: totalTasks - failedTasks,
        failedTasks,
        averageResponseTime: Math.round(
          filteredAgents.reduce((sum, agent) => sum + agent.performanceMetrics.averageResponseTime, 0) / 
          filteredAgents.length
        ),
        peakUsageTime: '14:30', // 2:30 PM
        topPerformingAgents: filteredAgents
          .sort((a, b) => b.performanceMetrics.successRate - a.performanceMetrics.successRate)
          .slice(0, 5)
          .map(agent => ({
            agentId: agent.id,
            name: agent.name,
            successRate: agent.performanceMetrics.successRate
          })),
        issueBreakdown: {
          'Performance': Math.round(totalErrors * 0.4),
          'Configuration': Math.round(totalErrors * 0.3),
          'Dependencies': Math.round(totalErrors * 0.2),
          'Other': Math.round(totalErrors * 0.1)
        }
      }
    };

    setAnalytics(mockAnalytics);
    setLoading(false);
  };

  const getPerformanceColor = (value: number, type: 'successRate' | 'responseTime' | 'uptime') => {
    switch (type) {
      case 'successRate':
      case 'uptime':
        if (value >= 95) return 'text-green-600';
        if (value >= 85) return 'text-yellow-600';
        return 'text-red-600';
      case 'responseTime':
        if (value <= 1000) return 'text-green-600';
        if (value <= 3000) return 'text-yellow-600';
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getPerformanceIcon = (value: number, type: 'successRate' | 'responseTime' | 'uptime') => {
    switch (type) {
      case 'successRate':
      case 'uptime':
        if (value >= 95) return '🟢';
        if (value >= 85) return '🟡';
        return '🔴';
      case 'responseTime':
        if (value <= 1000) return '🟢';
        if (value <= 3000) return '🟡';
        return '🔴';
      default:
        return '⚪';
    }
  };

  const getCategoryIcon = (category: AgentCategory | 'all') => {
    switch (category) {
      case 'service_delivery': return '🚀';
      case 'status_monitoring': return '📊';
      case 'issue_resolution': return '🔧';
      case 'client_coordination': return '👥';
      case 'system_automation': return '⚙️';
      case 'all': return '🤖';
      default: return '🤖';
    }
  };

  if (loading || !analytics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-lg">Loading Analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="agent-performance-analytics">
      {/* Header and Controls */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Agent Performance Analytics</h2>
            <p className="text-gray-600">Monitor and analyze AI agent performance across all categories</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Time Range Selector */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Time Range:</label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                data-testid="time-range-selector"
              >
                <option value="hour">Last Hour</option>
                <option value="day">Last 24 Hours</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Category:</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as typeof selectedCategory)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                data-testid="category-selector"
              >
                <option value="all">All Categories</option>
                <option value="service_delivery">Service Delivery</option>
                <option value="status_monitoring">Status Monitoring</option>
                <option value="issue_resolution">Issue Resolution</option>
                <option value="client_coordination">Client Coordination</option>
                <option value="system_automation">System Automation</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.metrics.totalTasks.toLocaleString()}</p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Across {agents.length} active agents
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-green-600">
                {((analytics.metrics.completedTasks / analytics.metrics.totalTasks) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="text-3xl">✅</div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {analytics.metrics.completedTasks.toLocaleString()} completed
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
              <p className={`text-2xl font-bold ${getPerformanceColor(analytics.metrics.averageResponseTime, 'responseTime')}`}>
                {(analytics.metrics.averageResponseTime / 1000).toFixed(1)}s
              </p>
            </div>
            <div className="text-3xl">{getPerformanceIcon(analytics.metrics.averageResponseTime, 'responseTime')}</div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Target: &lt;2.0s
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Peak Usage</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.metrics.peakUsageTime}</p>
            </div>
            <div className="text-3xl">⏰</div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Daily peak time
          </p>
        </div>
      </div>

      {/* Top Performing Agents */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-medium text-gray-900">Top Performing Agents</h3>
          <p className="text-gray-600 text-sm">Ranked by success rate</p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {analytics.metrics.topPerformingAgents.map((agent, index) => (
              <div key={agent.agentId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full text-sm font-bold">
                    #{index + 1}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{agent.name}</h4>
                    <p className="text-sm text-gray-600">Agent ID: {agent.agentId}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className={`font-bold ${getPerformanceColor(agent.successRate, 'successRate')}`}>
                      {agent.successRate}%
                    </p>
                    <p className="text-sm text-gray-500">Success Rate</p>
                  </div>
                  <span className="text-2xl">{getPerformanceIcon(agent.successRate, 'successRate')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Agent Performance by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance by Category */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-medium text-gray-900">Performance by Category</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {['service_delivery', 'status_monitoring', 'issue_resolution', 'client_coordination'].map(category => {
                const categoryAgents = agents.filter(agent => agent.category === category);
                if (categoryAgents.length === 0) return null;

                const avgSuccessRate = categoryAgents.reduce((sum, agent) => 
                  sum + agent.performanceMetrics.successRate, 0
                ) / categoryAgents.length;

                const avgResponseTime = categoryAgents.reduce((sum, agent) => 
                  sum + agent.performanceMetrics.averageResponseTime, 0
                ) / categoryAgents.length;

                return (
                  <div key={category} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{getCategoryIcon(category as AgentCategory)}</span>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </h4>
                        <p className="text-sm text-gray-600">{categoryAgents.length} agents</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${getPerformanceColor(avgSuccessRate, 'successRate')}`}>
                        {avgSuccessRate.toFixed(1)}%
                      </p>
                      <p className="text-sm text-gray-500">
                        {(avgResponseTime / 1000).toFixed(1)}s avg
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Issue Breakdown */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-medium text-gray-900">Issue Breakdown</h3>
            <p className="text-gray-600 text-sm">Common issues across all agents</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {Object.entries(analytics.metrics.issueBreakdown).map(([category, count]) => (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded ${
                      category === 'Performance' ? 'bg-red-400' :
                      category === 'Configuration' ? 'bg-orange-400' :
                      category === 'Dependencies' ? 'bg-yellow-400' :
                      'bg-gray-400'
                    }`}></div>
                    <span className="font-medium text-gray-900">{category}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-gray-900">{count}</span>
                    <span className="text-sm text-gray-500 ml-1">issues</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Agent Performance Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-medium text-gray-900">Detailed Agent Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tasks Completed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Success Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Response Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uptime
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {agents
                .filter(agent => selectedCategory === 'all' || agent.category === selectedCategory)
                .sort((a, b) => b.performanceMetrics.successRate - a.performanceMetrics.successRate)
                .map(agent => (
                <tr key={agent.id} className="hover:bg-gray-50" data-testid={`agent-row-${agent.id}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{agent.name}</div>
                      <div className="text-sm text-gray-500">{agent.id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="flex items-center">
                      <span className="mr-2">{getCategoryIcon(agent.category)}</span>
                      <span className="text-sm text-gray-900">
                        {agent.category.replace('_', ' ')}
                      </span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {agent.performanceMetrics.tasksCompleted.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`text-sm font-medium ${getPerformanceColor(agent.performanceMetrics.successRate, 'successRate')}`}>
                        {agent.performanceMetrics.successRate}%
                      </span>
                      <span className="ml-2">{getPerformanceIcon(agent.performanceMetrics.successRate, 'successRate')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`text-sm font-medium ${getPerformanceColor(agent.performanceMetrics.averageResponseTime, 'responseTime')}`}>
                        {(agent.performanceMetrics.averageResponseTime / 1000).toFixed(1)}s
                      </span>
                      <span className="ml-2">{getPerformanceIcon(agent.performanceMetrics.averageResponseTime, 'responseTime')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`text-sm font-medium ${getPerformanceColor(agent.performanceMetrics.uptime, 'uptime')}`}>
                        {agent.performanceMetrics.uptime}%
                      </span>
                      <span className="ml-2">{getPerformanceIcon(agent.performanceMetrics.uptime, 'uptime')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      agent.status === 'active' ? 'bg-green-100 text-green-800' :
                      agent.status === 'error' ? 'bg-red-100 text-red-800' :
                      agent.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {agent.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export and Actions */}
      {userRole === 'manager' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Analytics Actions</h3>
              <p className="text-gray-600 text-sm">Export data and generate reports</p>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                data-testid="export-analytics"
              >
                📊 Export Analytics
              </button>
              <button 
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50"
                data-testid="schedule-report"
              >
                📅 Schedule Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};