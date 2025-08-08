import React, { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { HealthMetrics, HealthAlert, ClientHealthProfile } from '../types/Health';
import { healthKitService } from '../services/healthKitService';

interface HealthDashboardProps {
  clientId?: string;
  isStaffView?: boolean;
}

const HealthDashboard: React.FC<HealthDashboardProps> = ({ 
  clientId = 'demo-client', 
  isStaffView = true 
}) => {
  const [healthProfile, setHealthProfile] = useState<ClientHealthProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadHealthData();
  }, [clientId]);

  const loadHealthData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Request HealthKit permissions first
      const permissionsGranted = await healthKitService.requestPermissions();
      
      if (!permissionsGranted) {
        setError('Health data access not granted');
        return;
      }

      // Sync health data
      const metrics = await healthKitService.syncHealthData(clientId);
      const alerts = healthKitService.generateHealthAlerts(clientId, metrics);
      const bedCriteria = healthKitService.generateBedCriteria(metrics);
      const syncStatus = healthKitService.getSyncStatus(clientId);

      const profile: ClientHealthProfile = {
        clientId,
        healthMetrics: metrics,
        healthAlerts: alerts,
        bedCriteria,
        syncStatus,
        consentGiven: true,
        consentDate: new Date(),
        dataRetentionDays: 365
      };

      setHealthProfile(profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load health data');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await loadHealthData();
    } finally {
      setSyncing(false);
    }
  };

  const getLatestMetrics = (): HealthMetrics | null => {
    return healthProfile?.healthMetrics[0] || null;
  };

  const getCriticalAlerts = (): HealthAlert[] => {
    return healthProfile?.healthAlerts.filter(alert => 
      alert.type === 'critical' && !alert.acknowledged
    ) || [];
  };

  const getVitalSignsStatus = (metrics: HealthMetrics | null) => {
    if (!metrics) return 'unknown';
    
    const issues: string[] = [];
    
    if (metrics.bloodPressure) {
      const { systolic, diastolic } = metrics.bloodPressure;
      if (systolic > 140 || diastolic > 90) issues.push('hypertension');
    }
    
    if (metrics.heartRate && (metrics.heartRate > 100 || metrics.heartRate < 60)) {
      issues.push('abnormal-hr');
    }
    
    if (metrics.oxygenSaturation && metrics.oxygenSaturation < 95) {
      issues.push('low-oxygen');
    }
    
    if (issues.length === 0) return 'normal';
    if (issues.length === 1) return 'warning';
    return 'critical';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading health data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Health Data Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadHealthData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const latestMetrics = getLatestMetrics();
  const criticalAlerts = getCriticalAlerts();
  const vitalsStatus = getVitalSignsStatus(latestMetrics);

  return (
    <div className="space-y-6">
      {/* Header with Sync Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Health Dashboard</h2>
          <p className="text-sm text-gray-600">
            Last updated: {healthProfile?.syncStatus.lastSync ? 
              format(healthProfile.syncStatus.lastSync, 'MMM d, yyyy h:mm a') : 
              'Never'
            }
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span>{syncing ? '🔄' : '📱'}</span>
          <span>{syncing ? 'Syncing...' : 'Sync HealthKit'}</span>
        </button>
      </div>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-400 text-xl">🚨</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Critical Health Alerts</h3>
              <div className="mt-2 text-sm text-red-700">
                {criticalAlerts.map(alert => (
                  <div key={alert.id} className="mb-2">
                    <div className="font-medium">{alert.title}</div>
                    <div>{alert.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Vital Signs Summary */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Vital Signs</h3>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              vitalsStatus === 'normal' ? 'bg-green-100 text-green-800' :
              vitalsStatus === 'warning' ? 'bg-yellow-100 text-yellow-800' :
              vitalsStatus === 'critical' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {vitalsStatus === 'normal' ? 'Normal' :
               vitalsStatus === 'warning' ? 'Attention' :
               vitalsStatus === 'critical' ? 'Critical' : 'Unknown'}
            </div>
          </div>

          {latestMetrics ? (
            <div className="space-y-3">
              {latestMetrics.heartRate && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Heart Rate:</span>
                  <span className={`font-medium ${
                    latestMetrics.heartRate > 100 || latestMetrics.heartRate < 60 ? 
                    'text-red-600' : 'text-gray-900'
                  }`}>
                    {latestMetrics.heartRate} bpm
                  </span>
                </div>
              )}

              {latestMetrics.bloodPressure && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Blood Pressure:</span>
                  <span className={`font-medium ${
                    latestMetrics.bloodPressure.systolic > 140 || 
                    latestMetrics.bloodPressure.diastolic > 90 ? 
                    'text-red-600' : 'text-gray-900'
                  }`}>
                    {latestMetrics.bloodPressure.systolic}/{latestMetrics.bloodPressure.diastolic}
                  </span>
                </div>
              )}

              {latestMetrics.temperature && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Temperature:</span>
                  <span className={`font-medium ${
                    latestMetrics.temperature > 99.5 || latestMetrics.temperature < 97 ? 
                    'text-red-600' : 'text-gray-900'
                  }`}>
                    {latestMetrics.temperature.toFixed(1)}°F
                  </span>
                </div>
              )}

              {latestMetrics.oxygenSaturation && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Oxygen Sat:</span>
                  <span className={`font-medium ${
                    latestMetrics.oxygenSaturation < 95 ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {latestMetrics.oxygenSaturation}%
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No vital signs data available</p>
          )}
        </div>

        {/* Activity Summary */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity & Sleep</h3>
          
          {latestMetrics ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Steps:</span>
                <span className="font-medium">{latestMetrics.stepCount?.toLocaleString() || 0}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Distance:</span>
                <span className="font-medium">{latestMetrics.distanceWalked?.toFixed(1) || 0} mi</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Exercise:</span>
                <span className="font-medium">{latestMetrics.exerciseMinutes || 0} min</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Sleep:</span>
                <span className="font-medium">
                  {latestMetrics.sleepHours?.toFixed(1) || 0}h 
                  <span className="text-xs ml-1 text-gray-500">
                    ({latestMetrics.sleepQuality || 'unknown'})
                  </span>
                </span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No activity data available</p>
          )}
        </div>

        {/* Health Conditions */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Health Status</h3>
          
          {latestMetrics ? (
            <div className="space-y-4">
              {/* Chronic Conditions */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Conditions:</h4>
                {latestMetrics.chronicConditions && latestMetrics.chronicConditions.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {latestMetrics.chronicConditions.map((condition, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full"
                      >
                        {condition}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-xs">None reported</p>
                )}
              </div>

              {/* Current Medications */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Medications:</h4>
                {latestMetrics.currentMedications && latestMetrics.currentMedications.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {latestMetrics.currentMedications.map((med, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {med}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-xs">None reported</p>
                )}
              </div>

              {/* Allergies */}
              {latestMetrics.allergies && latestMetrics.allergies.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Allergies:</h4>
                  <div className="flex flex-wrap gap-1">
                    {latestMetrics.allergies.map((allergy, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full"
                      >
                        {allergy}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No health status data available</p>
          )}
        </div>
      </div>

      {/* Bed Matching Criteria */}
      {healthProfile && isStaffView && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🛏️ Bed Allocation Criteria</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(healthProfile.bedCriteria).map(([key, value]) => (
              <div key={key} className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  typeof value === 'boolean' 
                    ? (value ? 'bg-green-500' : 'bg-gray-300')
                    : 'bg-blue-500'
                }`}></div>
                <span className="text-sm text-gray-700">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </span>
                {typeof value === 'string' && value !== 'standard' && (
                  <span className="text-xs text-gray-500">({value})</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Health Alerts List */}
      {healthProfile && healthProfile.healthAlerts.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Health Alerts</h3>
          <div className="space-y-3">
            {healthProfile.healthAlerts.map(alert => (
              <div 
                key={alert.id} 
                className={`p-4 rounded-lg border-l-4 ${
                  alert.type === 'critical' ? 'bg-red-50 border-red-400' :
                  alert.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                  'bg-blue-50 border-blue-400'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className={`font-medium ${
                      alert.type === 'critical' ? 'text-red-800' :
                      alert.type === 'warning' ? 'text-yellow-800' :
                      'text-blue-800'
                    }`}>
                      {alert.title}
                    </h4>
                    <p className={`text-sm mt-1 ${
                      alert.type === 'critical' ? 'text-red-700' :
                      alert.type === 'warning' ? 'text-yellow-700' :
                      'text-blue-700'
                    }`}>
                      {alert.description}
                    </p>
                    {alert.recommendations && alert.recommendations.length > 0 && (
                      <ul className={`text-xs mt-2 list-disc list-inside ${
                        alert.type === 'critical' ? 'text-red-600' :
                        alert.type === 'warning' ? 'text-yellow-600' :
                        'text-blue-600'
                      }`}>
                        {alert.recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {format(alert.createdAt, 'MMM d, h:mm a')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthDashboard;