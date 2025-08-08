import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  BPMonitoringAgent, 
  BloodPressureThreshold, 
  BPAlertTrigger, 
  ParticipantAlert,
  AgentLog,
  BloodPressureReading,
  AgentStats
} from '../types/AgentServices';
import { bloodPressureAgent } from '../services/bloodPressureAgent';

interface AgentServicesDashboardProps {
  staffId?: string;
}

const AgentServicesDashboard: React.FC<AgentServicesDashboardProps> = ({ staffId }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'participants' | 'alerts' | 'settings' | 'logs'>('overview');
  const [agent, setAgent] = useState<BPMonitoringAgent | null>(null);
  const [agentStats, setAgentStats] = useState<any>(null);
  const [activeAlerts, setActiveAlerts] = useState<BPAlertTrigger[]>([]);
  const [recentReadings, setRecentReadings] = useState<BloodPressureReading[]>([]);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Participant registration form
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [participantForm, setParticipantForm] = useState({
    clientName: '',
    phoneNumber: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    thresholds: ['elevated', 'stage1', 'stage2', 'crisis', 'low'],
    smsEnabled: true,
    staffNotify: true
  });

  useEffect(() => {
    loadAgentData();
    const interval = setInterval(loadAgentData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadAgentData = () => {
    try {
      setAgent(bloodPressureAgent.getAgent());
      setAgentStats(bloodPressureAgent.getStats());
      setActiveAlerts(bloodPressureAgent.getActiveAlerts());
      setRecentReadings(bloodPressureAgent.getRecentReadings());
      setLogs(bloodPressureAgent.getLogs());
      setLoading(false);
    } catch (error) {
      console.error('Failed to load agent data:', error);
      setLoading(false);
    }
  };

  const handleStartAgent = async () => {
    setLoading(true);
    try {
      await bloodPressureAgent.start();
      loadAgentData();
      window.alert('✅ Blood pressure monitoring agent started successfully');
    } catch (error) {
      console.error('Failed to start agent:', error);
      window.alert('❌ Failed to start agent');
    } finally {
      setLoading(false);
    }
  };

  const handleStopAgent = () => {
    setLoading(true);
    try {
      bloodPressureAgent.stop();
      loadAgentData();
      window.alert('⏹️ Blood pressure monitoring agent stopped');
    } catch (error) {
      console.error('Failed to stop agent:', error);
      window.alert('❌ Failed to stop agent');
    } finally {
      setLoading(false);
    }
  };

  const handleAddParticipant = () => {
    if (!participantForm.clientName.trim() || !participantForm.phoneNumber.trim()) {
      window.alert('Please enter client name and phone number');
      return;
    }

    try {
      const participantId = bloodPressureAgent.registerParticipant({
        clientId: `client-${Date.now()}`,
        clientName: participantForm.clientName,
        phoneNumber: participantForm.phoneNumber,
        emergencyContact: participantForm.emergencyContactName ? {
          name: participantForm.emergencyContactName,
          phone: participantForm.emergencyContactPhone,
          relationship: 'Emergency Contact'
        } : undefined,
        thresholds: participantForm.thresholds,
        isActive: true,
        alertFrequency: 30, // 30 minutes
        preferences: {
          smsEnabled: participantForm.smsEnabled,
          voiceCallEnabled: false,
          emergencyContactNotify: !!participantForm.emergencyContactName,
          staffNotify: participantForm.staffNotify
        },
        registeredBy: staffId || 'system'
      });

      setParticipantForm({
        clientName: '',
        phoneNumber: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        thresholds: ['elevated', 'stage1', 'stage2', 'crisis', 'low'],
        smsEnabled: true,
        staffNotify: true
      });
      
      setShowAddParticipant(false);
      loadAgentData();
      
      window.alert(`✅ Participant ${participantForm.clientName} registered for BP monitoring`);
    } catch (error) {
      console.error('Failed to add participant:', error);
      window.alert('❌ Failed to register participant');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'acknowledged': return 'text-blue-600 bg-blue-100';
      case 'resolved': return 'text-gray-600 bg-gray-100';
      case 'escalated': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'normal': return 'text-green-800 bg-green-100';
      case 'elevated': return 'text-yellow-800 bg-yellow-100';
      case 'stage1': return 'text-orange-800 bg-orange-100';
      case 'stage2': return 'text-red-800 bg-red-100';
      case 'crisis': return 'text-red-900 bg-red-200 border-red-400';
      case 'low': return 'text-blue-800 bg-blue-100';
      default: return 'text-gray-800 bg-gray-100';
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-700 bg-red-50';
      case 'warning': return 'text-yellow-700 bg-yellow-50';
      case 'info': return 'text-blue-700 bg-blue-50';
      case 'debug': return 'text-gray-700 bg-gray-50';
      default: return 'text-gray-700 bg-gray-50';
    }
  };

  if (loading && !agent) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading agent services...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Agent Status */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-3xl">🤖</div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Agent Services</h2>
              <p className="text-gray-600">Blood Pressure Monitoring & SMS Alerts</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                agent?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  agent?.isActive ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                {agent?.isActive ? 'Active' : 'Stopped'}
              </div>
              {agent?.lastRun && (
                <div className="text-xs text-gray-500 mt-1">
                  Last check: {format(agent.lastRun, 'h:mm a')}
                </div>
              )}
            </div>
            
            <div className="flex space-x-2">
              {agent?.isActive ? (
                <button
                  onClick={handleStopAgent}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  ⏹️ Stop Agent
                </button>
              ) : (
                <button
                  onClick={handleStartAgent}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  ▶️ Start Agent
                </button>
              )}
              
              <button
                onClick={loadAgentData}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      {agentStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <span className="text-blue-500 text-2xl mr-3">👥</span>
              <div>
                <div className="text-2xl font-bold text-blue-800">{agentStats.participantsMonitored}</div>
                <div className="text-sm text-blue-600">Participants Monitored</div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <span className="text-green-500 text-2xl mr-3">✅</span>
              <div>
                <div className="text-2xl font-bold text-green-800">{agentStats.totalRuns}</div>
                <div className="text-sm text-green-600">Total Checks</div>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center">
              <span className="text-orange-500 text-2xl mr-3">🚨</span>
              <div>
                <div className="text-2xl font-bold text-orange-800">{agentStats.totalAlerts}</div>
                <div className="text-sm text-orange-600">Alerts Sent</div>
              </div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <span className="text-red-500 text-2xl mr-3">⚠️</span>
              <div>
                <div className="text-2xl font-bold text-red-800">{agentStats.activeAlerts}</div>
                <div className="text-sm text-red-600">Active Alerts</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6 py-3">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'participants', label: 'Participants', icon: '👥' },
              { id: 'alerts', label: 'Active Alerts', icon: '🚨', count: activeAlerts.length },
              { id: 'settings', label: 'Settings', icon: '⚙️' },
              { id: 'logs', label: 'Logs', icon: '📋' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Agent Configuration */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">🤖 Agent Configuration</h3>
                  {agent && (
                    <div className="space-y-2 text-sm">
                      <div><strong>Check Interval:</strong> {agent.configuration.checkInterval} minutes</div>
                      <div><strong>Max Alerts/Hour:</strong> {agent.configuration.maxAlertsPerHour}</div>
                      <div><strong>Silent Hours:</strong> {agent.configuration.silentHours.start} - {agent.configuration.silentHours.end}</div>
                      <div><strong>Escalation Delay:</strong> {agent.configuration.escalationDelay} minutes</div>
                      <div><strong>Enabled Thresholds:</strong> {agent.configuration.enabledThresholds.join(', ')}</div>
                    </div>
                  )}
                </div>

                {/* Recent Activity */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">📈 Recent Activity</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Recent Readings:</strong> {recentReadings.length}</div>
                    <div><strong>Success Rate:</strong> {agentStats?.successRate}%</div>
                    <div><strong>Next Check:</strong> {agent?.nextRun ? format(agent.nextRun, 'h:mm a') : 'Not scheduled'}</div>
                    {agent?.stats.lastError && (
                      <div className="text-red-600"><strong>Last Error:</strong> {agent.stats.lastError}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Blood Pressure Thresholds */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">🩺 Blood Pressure Thresholds</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { name: 'Normal', range: '<120/80', color: 'bg-green-100 text-green-800' },
                    { name: 'Elevated', range: '120-129/<80', color: 'bg-yellow-100 text-yellow-800' },
                    { name: 'Stage 1', range: '130-139/80-89', color: 'bg-orange-100 text-orange-800' },
                    { name: 'Stage 2', range: '140-179/90-119', color: 'bg-red-100 text-red-800' },
                    { name: 'Crisis', range: '≥180/≥120', color: 'bg-red-200 text-red-900' },
                    { name: 'Low', range: '<90/60', color: 'bg-blue-100 text-blue-800' }
                  ].map(threshold => (
                    <div key={threshold.name} className={`p-3 rounded-lg ${threshold.color}`}>
                      <div className="font-medium">{threshold.name}</div>
                      <div className="text-xs">{threshold.range} mmHg</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Participants Tab */}
          {activeTab === 'participants' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Registered Participants</h3>
                <button
                  onClick={() => setShowAddParticipant(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  + Add Participant
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">📋 Participant Information</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <div>• Currently monitoring {agentStats?.participantsMonitored} participants</div>
                  <div>• SMS alerts sent automatically when thresholds are exceeded</div>
                  <div>• Emergency contacts notified for critical readings</div>
                  <div>• Staff notifications enabled for all high-risk readings</div>
                </div>
              </div>

              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">👥</div>
                <p>Participant management interface would show registered users here</p>
                <p className="text-sm mt-1">In a full implementation, this would list all registered participants with their monitoring status</p>
              </div>
            </div>
          )}

          {/* Active Alerts Tab */}
          {activeTab === 'alerts' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Active Blood Pressure Alerts</h3>
              
              {activeAlerts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">✅</div>
                  <p>No active alerts</p>
                  <p className="text-sm mt-1">All participants have normal blood pressure readings</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeAlerts.map(alert => (
                    <div key={alert.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(alert.severity)}`}>
                              {alert.thresholdName}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(alert.status)}`}>
                              {alert.status}
                            </span>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="font-medium">{alert.clientName}</div>
                            <div className="text-sm text-gray-600">
                              Blood Pressure: <span className="font-medium text-red-600">{alert.systolic}/{alert.diastolic} mmHg</span>
                              {alert.heartRate && <span className="ml-4">Heart Rate: {alert.heartRate} bpm</span>}
                            </div>
                            <div className="text-xs text-gray-500">
                              Triggered: {format(alert.triggeredAt, 'MMM d, h:mm a')}
                            </div>
                          </div>

                          <div className="mt-2 flex space-x-4 text-xs">
                            <span className={alert.alertsSent.sms ? 'text-green-600' : 'text-gray-400'}>
                              {alert.alertsSent.sms ? '✅' : '❌'} SMS Sent
                            </span>
                            <span className={alert.alertsSent.staff ? 'text-green-600' : 'text-gray-400'}>
                              {alert.alertsSent.staff ? '✅' : '❌'} Staff Notified
                            </span>
                            <span className={alert.alertsSent.emergency ? 'text-green-600' : 'text-gray-400'}>
                              {alert.alertsSent.emergency ? '✅' : '❌'} Emergency Notified
                            </span>
                          </div>
                        </div>

                        <div className="ml-4">
                          {alert.severity === 'crisis' && (
                            <div className="text-red-600 font-bold text-sm">
                              🆘 EMERGENCY
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Agent Settings</h3>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">⚙️ Configuration</h4>
                <p className="text-sm text-yellow-700">
                  Agent settings can be modified here. Changes take effect on the next monitoring cycle.
                </p>
              </div>

              {agent && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Check Interval (minutes)
                      </label>
                      <input
                        type="number"
                        value={agent.configuration.checkInterval}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        readOnly
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Alerts Per Hour
                      </label>
                      <input
                        type="number"
                        value={agent.configuration.maxAlertsPerHour}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Silent Hours Start
                      </label>
                      <input
                        type="time"
                        value={agent.configuration.silentHours.start}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        readOnly
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Silent Hours End
                      </label>
                      <input
                        type="time"
                        value={agent.configuration.silentHours.end}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Logs Tab */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Agent Logs</h3>
              
              {logs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📋</div>
                  <p>No logs available</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {logs.map(log => (
                    <div key={log.id} className={`p-3 rounded-lg border text-sm ${getLogLevelColor(log.level)}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium uppercase text-xs">{log.level}</span>
                            <span className="text-xs text-gray-500">
                              {format(log.timestamp, 'MMM d, h:mm:ss a')}
                            </span>
                          </div>
                          <div>{log.message}</div>
                          {log.details && (
                            <div className="text-xs mt-1 font-mono bg-white bg-opacity-50 rounded p-1">
                              {JSON.stringify(log.details, null, 2)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Participant Modal */}
      {showAddParticipant && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Register Participant for BP Monitoring</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Name *
                </label>
                <input
                  type="text"
                  value={participantForm.clientName}
                  onChange={(e) => setParticipantForm(prev => ({ ...prev, clientName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter client name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={participantForm.phoneNumber}
                  onChange={(e) => setParticipantForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+1 (208) 555-0123"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Emergency Contact Name
                </label>
                <input
                  type="text"
                  value={participantForm.emergencyContactName}
                  onChange={(e) => setParticipantForm(prev => ({ ...prev, emergencyContactName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Emergency Contact Phone
                </label>
                <input
                  type="tel"
                  value={participantForm.emergencyContactPhone}
                  onChange={(e) => setParticipantForm(prev => ({ ...prev, emergencyContactPhone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Optional"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={participantForm.smsEnabled}
                    onChange={(e) => setParticipantForm(prev => ({ ...prev, smsEnabled: e.target.checked }))}
                    className="text-blue-600"
                  />
                  <span className="text-sm">Enable SMS alerts</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={participantForm.staffNotify}
                    onChange={(e) => setParticipantForm(prev => ({ ...prev, staffNotify: e.target.checked }))}
                    className="text-blue-600"
                  />
                  <span className="text-sm">Notify staff of alerts</span>
                </label>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddParticipant(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddParticipant}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Register
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentServicesDashboard;