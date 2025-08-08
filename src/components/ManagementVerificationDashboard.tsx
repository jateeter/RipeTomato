/**
 * Management Verification Dashboard
 * 
 * Provides the staff/management perspective for QR-based identity verification
 * monitoring and control using the unified data ownership model.
 * 
 * @license MIT
 */

import React, { useState, useEffect } from 'react';
import {
  ManagementVerificationDashboard as DashboardData,
  PendingVerification,
  CompletedVerification,
  WalletCheckInSession,
  VerificationSystemStats,
  SecurityAlert
} from '../types/WalletVerification';
import { walletVerificationService } from '../services/walletVerificationService';

interface ManagementVerificationDashboardProps {
  staffId: string;
  onSessionSelect?: (session: WalletCheckInSession) => void;
}

export const ManagementVerificationDashboard: React.FC<ManagementVerificationDashboardProps> = ({
  staffId,
  onSessionSelect
}) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed' | 'stats' | 'alerts'>('pending');
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadDashboard();
    
    // Set up auto-refresh every 5 seconds
    const interval = setInterval(loadDashboard, 5000);
    setRefreshInterval(interval);
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await walletVerificationService.getVerificationDashboard();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to load verification dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionAction = async (sessionId: string, action: 'approve' | 'review' | 'cancel') => {
    try {
      switch (action) {
        case 'approve':
          await walletVerificationService.completeVerification(sessionId);
          break;
        case 'cancel':
          await walletVerificationService.cancelVerification(sessionId, `Cancelled by staff: ${staffId}`);
          break;
        case 'review':
          const sessions = await walletVerificationService.getActiveSessions();
          const session = sessions.find(s => s.sessionId === sessionId);
          if (session) {
            onSessionSelect?.(session);
          }
          break;
      }
      // Refresh dashboard after action
      await loadDashboard();
    } catch (error) {
      console.error(`Failed to ${action} session:`, error);
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'emergency': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getWaitTimeColor = (minutes: number): string => {
    if (minutes < 5) return 'text-green-600';
    if (minutes < 15) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
          <div className="h-60 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-500">Failed to load verification dashboard</div>
        <button
          onClick={loadDashboard}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Identity Verification Dashboard</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Live updates every 5 seconds
          </div>
          <button
            onClick={loadDashboard}
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
          >
            Refresh Now
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="text-3xl text-blue-500 mr-4">🔍</div>
            <div>
              <div className="text-2xl font-bold text-gray-800">
                {dashboardData.activeSessions.length}
              </div>
              <div className="text-sm text-gray-500">Active Verifications</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="text-3xl text-green-500 mr-4">📊</div>
            <div>
              <div className="text-2xl font-bold text-gray-800">
                {dashboardData.systemStats.todayVerifications}
              </div>
              <div className="text-sm text-gray-500">Today's Verifications</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="text-3xl text-emerald-500 mr-4">✅</div>
            <div>
              <div className="text-2xl font-bold text-gray-800">
                {dashboardData.systemStats.successRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500">Success Rate</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="text-3xl text-purple-500 mr-4">⏱️</div>
            <div>
              <div className="text-2xl font-bold text-gray-800">
                {dashboardData.systemStats.averageVerificationTime}m
              </div>
              <div className="text-sm text-gray-500">Avg. Time</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'pending', label: 'Pending Verifications', count: dashboardData.pendingVerifications.length },
            { id: 'completed', label: 'Recent Completions', count: dashboardData.recentCompletions.length },
            { id: 'stats', label: 'System Statistics', count: null },
            { id: 'alerts', label: 'Security Alerts', count: dashboardData.securityAlerts.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {/* Pending Verifications */}
        {activeTab === 'pending' && (
          <div className="space-y-4">
            {dashboardData.pendingVerifications.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">✨</div>
                <div className="text-lg">No pending verifications</div>
                <div className="text-sm">All clients are processed!</div>
              </div>
            ) : (
              dashboardData.pendingVerifications.map((verification) => (
                <div key={verification.sessionId} className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {verification.clientName}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs border ${getPriorityColor(verification.priority)}`}>
                          {verification.priority.toUpperCase()}
                        </span>
                        <span className={`text-sm font-medium ${getWaitTimeColor(verification.waitingTime)}`}>
                          Waiting {verification.waitingTime}m
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Current Step:</span><br />
                          {verification.currentStep}
                        </div>
                        <div>
                          <span className="font-medium">Location:</span><br />
                          {verification.location}
                        </div>
                        <div>
                          <span className="font-medium">Staff:</span><br />
                          {verification.assignedStaff || 'Unassigned'}
                        </div>
                        <div>
                          <span className="font-medium">QR Code:</span><br />
                          <code className="text-xs bg-gray-100 px-1 rounded">
                            {verification.qrCodeId.substring(0, 8)}...
                          </code>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 ml-6">
                      <button
                        onClick={() => handleSessionAction(verification.sessionId, 'review')}
                        className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
                      >
                        Review
                      </button>
                      <button
                        onClick={() => handleSessionAction(verification.sessionId, 'approve')}
                        className="bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleSessionAction(verification.sessionId, 'cancel')}
                        className="bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Completed Verifications */}
        {activeTab === 'completed' && (
          <div className="space-y-4">
            {dashboardData.recentCompletions.map((completion) => (
              <div key={completion.sessionId} className={`bg-white p-4 rounded-lg shadow border-l-4 ${
                completion.verificationResult === 'success' ? 'border-green-500' : 'border-red-500'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`text-2xl ${
                      completion.verificationResult === 'success' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {completion.verificationResult === 'success' ? '✅' : '❌'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{completion.clientName}</h3>
                      <div className="text-sm text-gray-600">
                        Completed in {completion.completionTime}m • 
                        Confidence: {completion.confidenceScore}% • 
                        Methods: {completion.verificationMethods.join(', ')}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(completion.completedAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* System Statistics */}
        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Wallet Method Performance */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Wallet Method Performance</h3>
              <div className="space-y-4">
                {Object.entries(dashboardData.systemStats.walletMethodStats).map(([method, stats]) => (
                  <div key={method} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="text-xl mr-3">
                        {method === 'appleWallet' ? '📱' : 
                         method === 'solidPod' ? '🔐' : 
                         method === 'dataswiftHat' ? '🎩' : '🔗'}
                      </div>
                      <div>
                        <div className="font-medium capitalize">
                          {method.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <div className="text-sm text-gray-600">
                          {stats.count} verifications
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{stats.successRate}%</div>
                      <div className={`text-xs px-2 py-1 rounded ${
                        stats.successRate >= 90 ? 'bg-green-100 text-green-800' :
                        stats.successRate >= 75 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {stats.successRate >= 90 ? 'Excellent' :
                         stats.successRate >= 75 ? 'Good' : 'Needs Attention'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Security Metrics */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Security Metrics</h3>
              <div className="space-y-4">
                {Object.entries(dashboardData.systemStats.securityMetrics).map(([metric, value]) => (
                  <div key={metric} className="flex items-center justify-between">
                    <div className="capitalize">
                      {metric.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                    <div className={`px-3 py-1 rounded text-sm font-medium ${
                      value === 0 ? 'bg-green-100 text-green-800' :
                      value <= 2 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Security Alerts */}
        {activeTab === 'alerts' && (
          <div className="space-y-4">
            {dashboardData.securityAlerts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">🛡️</div>
                <div className="text-lg">No security alerts</div>
                <div className="text-sm">System operating normally</div>
              </div>
            ) : (
              dashboardData.securityAlerts.map((alert) => (
                <div key={alert.alertId} className={`bg-white p-6 rounded-lg shadow border-l-4 ${
                  alert.severity === 'critical' ? 'border-red-500' :
                  alert.severity === 'high' ? 'border-orange-500' :
                  alert.severity === 'medium' ? 'border-yellow-500' :
                  'border-blue-500'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                          alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {alert.severity.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(alert.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-800 mb-2 capitalize">
                        {alert.alertType.replace(/_/g, ' ')}
                      </h3>
                      <p className="text-gray-600">{alert.message}</p>
                      {alert.relatedSession && (
                        <div className="mt-2 text-sm text-gray-500">
                          Related Session: <code className="bg-gray-100 px-1 rounded">{alert.relatedSession}</code>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      {!alert.acknowledged && (
                        <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                          Acknowledge
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};