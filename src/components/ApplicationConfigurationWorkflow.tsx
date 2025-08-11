/**
 * Application Configuration Workflow
 * 
 * Comprehensive configuration interface for setting up Solid Pod and HAT
 * identity management with Apple HealthKit integration and data access controls.
 * 
 * @license MIT
 */

import React, { useState, useEffect } from 'react';
import { UnifiedDataOwner, DataSource, PrivacyLevel } from '../types/UnifiedDataOwnership';
import { unifiedDataOwnershipService } from '../services/unifiedDataOwnershipService';
import { solidAuthService } from '../services/solidAuthService';
import { dataswiftHATService } from '../services/dataswiftHATService';
import { healthKitService } from '../services/healthKitService';
import { appleWalletService } from '../services/appleWalletService';

interface ApplicationConfigurationWorkflowProps {
  clientId: string;
  onConfigurationComplete?: (config: ApplicationConfiguration) => void;
}

export interface ApplicationConfiguration {
  clientId: string;
  solidPodEnabled: boolean;
  solidPodUrl?: string;
  hatEnabled: boolean;
  hatAddress?: string;
  healthKitEnabled: boolean;
  healthDataSharing: HealthSharingConfig;
  dataAccessControls: DataAccessControl[];
  privacySettings: PrivacySettings;
  identityVerification: IdentityVerificationConfig;
}

interface HealthSharingConfig {
  vitals: boolean;
  fitness: boolean;
  nutrition: boolean;
  medical: boolean;
  mental: boolean;
  reproductive: boolean;
  updateFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  retentionPeriod: number; // days
}

interface DataAccessControl {
  dataType: string;
  accessLevel: 'none' | 'read' | 'write' | 'admin';
  allowedServices: string[];
  expirationDate?: Date;
  conditions: AccessCondition[];
}

interface AccessCondition {
  type: 'location' | 'time' | 'purpose' | 'staff_role';
  value: any;
  description: string;
}

interface PrivacySettings {
  dataMinimization: boolean;
  automaticDeletion: boolean;
  encryptionLevel: 'basic' | 'enhanced' | 'maximum';
  anonymization: boolean;
  auditLogging: boolean;
}

interface IdentityVerificationConfig {
  requiredVerificationLevel: 'basic' | 'enhanced' | 'maximum';
  biometricEnabled: boolean;
  multiFactorAuth: boolean;
  verificationMethods: ('password' | 'biometric' | 'sms' | 'email' | 'hardware_key')[];
}

type ConfigurationStep = 
  | 'identity_setup' 
  | 'data_sources' 
  | 'health_integration' 
  | 'access_controls' 
  | 'privacy_settings' 
  | 'verification' 
  | 'complete';

export const ApplicationConfigurationWorkflow: React.FC<ApplicationConfigurationWorkflowProps> = ({
  clientId,
  onConfigurationComplete
}) => {
  const [currentStep, setCurrentStep] = useState<ConfigurationStep>('identity_setup');
  const [configuration, setConfiguration] = useState<ApplicationConfiguration>({
    clientId,
    solidPodEnabled: false,
    hatEnabled: false,
    healthKitEnabled: false,
    healthDataSharing: {
      vitals: false,
      fitness: false,
      nutrition: false,
      medical: false,
      mental: false,
      reproductive: false,
      updateFrequency: 'daily',
      retentionPeriod: 30
    },
    dataAccessControls: [],
    privacySettings: {
      dataMinimization: true,
      automaticDeletion: false,
      encryptionLevel: 'enhanced',
      anonymization: false,
      auditLogging: true
    },
    identityVerification: {
      requiredVerificationLevel: 'enhanced',
      biometricEnabled: false,
      multiFactorAuth: false,
      verificationMethods: ['password']
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [solidAuthStatus, setSolidAuthStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [hatAuthStatus, setHatAuthStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [healthKitStatus, setHealthKitStatus] = useState<'unavailable' | 'denied' | 'authorized' | 'not_determined'>('not_determined');

  useEffect(() => {
    checkExistingConfiguration();
  }, [clientId]);

  const checkExistingConfiguration = async () => {
    try {
      setLoading(true);
      
      // Check existing Solid Pod connection
      const solidSessionInfo = solidAuthService.getSessionInfo();
      if (solidSessionInfo.isLoggedIn) {
        setSolidAuthStatus('connected');
        setConfiguration(prev => ({
          ...prev,
          solidPodEnabled: true,
          solidPodUrl: solidSessionInfo.webId
        }));
      }

      // Check existing HAT connection (simplified check)
      try {
        const hatStats = await dataswiftHATService.getHATStats();
        if (hatStats) {
          setHatAuthStatus('connected');
          setConfiguration(prev => ({
            ...prev,
            hatEnabled: true,
            hatAddress: 'connected'
          }));
        }
      } catch (error) {
        // HAT not connected
        setHatAuthStatus('disconnected');
      }

      // Check HealthKit authorization status (simplified)
      setHealthKitStatus('not_determined');
      
      // For demonstration, we'll leave HealthKit disabled by default
      // In a real app, this would check actual HealthKit authorization status

    } catch (error) {
      console.error('Failed to check existing configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { key: 'identity_setup', title: 'Identity Setup', description: 'Configure your digital identity providers' },
    { key: 'data_sources', title: 'Data Sources', description: 'Connect your personal data stores' },
    { key: 'health_integration', title: 'Health Integration', description: 'Configure Apple HealthKit integration' },
    { key: 'access_controls', title: 'Access Controls', description: 'Set who can access your data' },
    { key: 'privacy_settings', title: 'Privacy Settings', description: 'Configure privacy and security options' },
    { key: 'verification', title: 'Verification', description: 'Set up identity verification methods' },
    { key: 'complete', title: 'Complete', description: 'Review and finalize your configuration' }
  ];

  const currentStepIndex = steps.findIndex(step => step.key === currentStep);

  const nextStep = () => {
    const nextIndex = Math.min(currentStepIndex + 1, steps.length - 1);
    setCurrentStep(steps[nextIndex].key as ConfigurationStep);
  };

  const prevStep = () => {
    const prevIndex = Math.max(currentStepIndex - 1, 0);
    setCurrentStep(steps[prevIndex].key as ConfigurationStep);
  };

  const handleSolidPodConnect = async () => {
    try {
      setSolidAuthStatus('connecting');
      setErrors(prev => ({ ...prev, solid: '' }));
      
      await solidAuthService.login();
      const sessionInfo = solidAuthService.getSessionInfo();
      
      if (sessionInfo.isLoggedIn) {
        setSolidAuthStatus('connected');
        setConfiguration(prev => ({
          ...prev,
          solidPodEnabled: true,
          solidPodUrl: sessionInfo.webId
        }));
      }
    } catch (error) {
      setSolidAuthStatus('disconnected');
      setErrors(prev => ({ ...prev, solid: 'Failed to connect to Solid Pod. Please try again.' }));
    }
  };

  const handleHATConnect = async (hatAddress: string) => {
    try {
      setHatAuthStatus('connecting');
      setErrors(prev => ({ ...prev, hat: '' }));
      
      const credentials = await dataswiftHATService.authenticate(hatAddress);
      
      if (credentials) {
        setHatAuthStatus('connected');
        setConfiguration(prev => ({
          ...prev,
          hatEnabled: true,
          hatAddress
        }));
      } else {
        throw new Error('HAT connection failed');
      }
    } catch (error) {
      setHatAuthStatus('disconnected');
      setErrors(prev => ({ ...prev, hat: 'Failed to connect to HAT. Please check the address and try again.' }));
    }
  };

  const handleHealthKitConnect = async () => {
    try {
      setLoading(true);
      setErrors(prev => ({ ...prev, healthkit: '' }));
      
      const authorized = await healthKitService.requestPermissions(['heart_rate', 'steps']);
      
      if (authorized) {
        setHealthKitStatus('authorized');
        setConfiguration(prev => ({
          ...prev,
          healthKitEnabled: true
        }));
      } else {
        setHealthKitStatus('denied');
        setErrors(prev => ({ ...prev, healthkit: 'HealthKit authorization denied. You can change this in Settings.' }));
      }
    } catch (error) {
      setHealthKitStatus('denied');
      setErrors(prev => ({ ...prev, healthkit: 'Failed to request HealthKit authorization.' }));
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async () => {
    try {
      setLoading(true);
      
      // Save configuration to unified data store
      await unifiedDataOwnershipService.storeData(clientId, 'personal_identity', {
        configurationData: configuration,
        configuredAt: new Date(),
        version: '1.0'
      });

      // Initialize data access controls
      for (const control of configuration.dataAccessControls) {
        await unifiedDataOwnershipService.storeData(
          clientId,
          'access_records',
          {
            dataType: control.dataType,
            accessLevel: control.accessLevel,
            allowedServices: control.allowedServices,
            expirationDate: control.expirationDate,
            createdAt: new Date()
          }
        );
      }

      onConfigurationComplete?.(configuration);
      
    } catch (error) {
      setErrors(prev => ({ ...prev, save: 'Failed to save configuration. Please try again.' }));
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'identity_setup':
        return <IdentitySetupStep 
          solidAuthStatus={solidAuthStatus}
          hatAuthStatus={hatAuthStatus}
          onSolidConnect={handleSolidPodConnect}
          onHATConnect={handleHATConnect}
          errors={errors}
        />;
        
      case 'data_sources':
        return <DataSourcesStep 
          configuration={configuration}
          setConfiguration={setConfiguration}
          solidConnected={solidAuthStatus === 'connected'}
          hatConnected={hatAuthStatus === 'connected'}
        />;
        
      case 'health_integration':
        return <HealthIntegrationStep 
          configuration={configuration}
          setConfiguration={setConfiguration}
          healthKitStatus={healthKitStatus}
          onHealthKitConnect={handleHealthKitConnect}
          errors={errors}
        />;
        
      case 'access_controls':
        return <AccessControlsStep 
          configuration={configuration}
          setConfiguration={setConfiguration}
        />;
        
      case 'privacy_settings':
        return <PrivacySettingsStep 
          configuration={configuration}
          setConfiguration={setConfiguration}
        />;
        
      case 'verification':
        return <VerificationStep 
          configuration={configuration}
          setConfiguration={setConfiguration}
        />;
        
      case 'complete':
        return <CompleteStep 
          configuration={configuration}
          onSave={saveConfiguration}
          loading={loading}
          errors={errors}
        />;
        
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Application Configuration</h1>
          <div className="text-sm text-gray-500">
            Step {currentStepIndex + 1} of {steps.length}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {steps.map((step, index) => (
            <div key={step.key} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                index < currentStepIndex ? 'bg-green-500 text-white' :
                index === currentStepIndex ? 'bg-blue-500 text-white' :
                'bg-gray-200 text-gray-500'
              }`}>
                {index < currentStepIndex ? '✓' : index + 1}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-12 h-0.5 ${
                  index < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-4">
          <h2 className="text-lg font-semibold text-gray-900">{steps[currentStepIndex].title}</h2>
          <p className="text-sm text-gray-600">{steps[currentStepIndex].description}</p>
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          onClick={prevStep}
          disabled={currentStepIndex === 0 || loading}
          className={`px-6 py-2 rounded-lg font-medium ${
            currentStepIndex === 0 || loading
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Previous
        </button>
        
        <button
          onClick={currentStep === 'complete' ? saveConfiguration : nextStep}
          disabled={loading}
          className={`px-6 py-2 rounded-lg font-medium ${
            loading
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {loading ? 'Processing...' : currentStep === 'complete' ? 'Save Configuration' : 'Next'}
        </button>
      </div>
    </div>
  );
};

// Step Components (will be implemented separately)
interface StepProps {
  configuration: ApplicationConfiguration;
  setConfiguration: React.Dispatch<React.SetStateAction<ApplicationConfiguration>>;
  errors?: Record<string, string>;
}

const IdentitySetupStep: React.FC<{
  solidAuthStatus: string;
  hatAuthStatus: string;
  onSolidConnect: () => void;
  onHATConnect: (address: string) => void;
  errors: Record<string, string>;
}> = ({ solidAuthStatus, hatAuthStatus, onSolidConnect, onHATConnect, errors }) => {
  const [hatAddress, setHatAddress] = useState('');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Choose Your Identity Providers</h3>
        <p className="text-sm text-gray-600 mb-6">
          Select and configure your digital identity providers to manage your personal data securely.
        </p>
      </div>

      {/* Solid Pod Setup */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-medium">Solid Pod</h4>
            <p className="text-sm text-gray-600">Decentralized personal data store</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            solidAuthStatus === 'connected' ? 'bg-green-100 text-green-800' :
            solidAuthStatus === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {solidAuthStatus}
          </div>
        </div>
        
        {solidAuthStatus === 'disconnected' && (
          <div>
            <button
              onClick={onSolidConnect}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Connect Solid Pod
            </button>
            {errors?.solid && (
              <p className="text-red-600 text-sm mt-2">{errors.solid}</p>
            )}
          </div>
        )}
        
        {solidAuthStatus === 'connected' && (
          <div className="text-green-600 text-sm">
            ✓ Successfully connected to your Solid Pod
          </div>
        )}
      </div>

      {/* HAT Setup */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-medium">HAT (Hub of All Things)</h4>
            <p className="text-sm text-gray-600">Personal data exchange platform</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            hatAuthStatus === 'connected' ? 'bg-green-100 text-green-800' :
            hatAuthStatus === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {hatAuthStatus}
          </div>
        </div>
        
        {hatAuthStatus === 'disconnected' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                HAT Address
              </label>
              <input
                type="text"
                value={hatAddress}
                onChange={(e) => setHatAddress(e.target.value)}
                placeholder="your-name.hubat.net"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <button
              onClick={() => onHATConnect(hatAddress)}
              disabled={!hatAddress.trim()}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                hatAddress.trim()
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Connect HAT
            </button>
            {errors?.hat && (
              <p className="text-red-600 text-sm">{errors.hat}</p>
            )}
          </div>
        )}
        
        {hatAuthStatus === 'connected' && (
          <div className="text-green-600 text-sm">
            ✓ Successfully connected to your HAT
          </div>
        )}
      </div>
    </div>
  );
};

const DataSourcesStep: React.FC<StepProps & {
  solidConnected: boolean;
  hatConnected: boolean;
}> = ({ configuration, setConfiguration, solidConnected, hatConnected }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Configure Data Sources</h3>
        <p className="text-sm text-gray-600 mb-6">
          Choose which data sources to enable and configure how they integrate with your personal data stores.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">Solid Pod Integration</h4>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={configuration.solidPodEnabled}
                onChange={(e) => setConfiguration(prev => ({
                  ...prev,
                  solidPodEnabled: e.target.checked
                }))}
                disabled={!solidConnected}
                className="rounded"
              />
            </label>
          </div>
          <p className="text-sm text-gray-600">
            Store and manage your personal data in your Solid Pod
          </p>
          {!solidConnected && (
            <p className="text-sm text-orange-600 mt-2">
              Connect your Solid Pod in the previous step to enable
            </p>
          )}
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">HAT Integration</h4>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={configuration.hatEnabled}
                onChange={(e) => setConfiguration(prev => ({
                  ...prev,
                  hatEnabled: e.target.checked
                }))}
                disabled={!hatConnected}
                className="rounded"
              />
            </label>
          </div>
          <p className="text-sm text-gray-600">
            Exchange data through your personal HAT
          </p>
          {!hatConnected && (
            <p className="text-sm text-orange-600 mt-2">
              Connect your HAT in the previous step to enable
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const HealthIntegrationStep: React.FC<StepProps & {
  healthKitStatus: string;
  onHealthKitConnect: () => void;
}> = ({ configuration, setConfiguration, healthKitStatus, onHealthKitConnect, errors }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Apple HealthKit Integration</h3>
        <p className="text-sm text-gray-600 mb-6">
          Configure how your health data is shared and managed through your personal data stores.
        </p>
      </div>

      {/* HealthKit Authorization */}
      <div className="border rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-medium">HealthKit Authorization</h4>
            <p className="text-sm text-gray-600">Enable access to your Apple Health data</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            healthKitStatus === 'authorized' ? 'bg-green-100 text-green-800' :
            healthKitStatus === 'denied' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {healthKitStatus}
          </div>
        </div>
        
        {healthKitStatus !== 'authorized' && (
          <div>
            <button
              onClick={onHealthKitConnect}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Authorize HealthKit
            </button>
            {errors?.healthkit && (
              <p className="text-red-600 text-sm mt-2">{errors.healthkit}</p>
            )}
          </div>
        )}
      </div>

      {/* Health Data Categories */}
      {(healthKitStatus === 'authorized' || configuration.healthKitEnabled) && (
        <div>
          <h4 className="font-medium mb-4">Health Data Categories</h4>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries({
              vitals: 'Vital Signs (Heart Rate, Blood Pressure)',
              fitness: 'Fitness & Activity',
              nutrition: 'Nutrition & Diet',
              medical: 'Medical Records',
              mental: 'Mental Health',
              reproductive: 'Reproductive Health'
            }).map(([key, label]) => (
              <label key={key} className="flex items-center space-x-3 p-3 border rounded-lg">
                <input
                  type="checkbox"
                  checked={Boolean(configuration.healthDataSharing[key as keyof HealthSharingConfig])}
                  onChange={(e) => setConfiguration(prev => ({
                    ...prev,
                    healthDataSharing: {
                      ...prev.healthDataSharing,
                      [key]: e.target.checked
                    }
                  }))}
                  className="rounded"
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>

          {/* Update Frequency */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Update Frequency
            </label>
            <select
              value={configuration.healthDataSharing.updateFrequency}
              onChange={(e) => setConfiguration(prev => ({
                ...prev,
                healthDataSharing: {
                  ...prev.healthDataSharing,
                  updateFrequency: e.target.value as any
                }
              }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="realtime">Real-time</option>
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>

          {/* Retention Period */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Retention Period (days)
            </label>
            <input
              type="number"
              min="1"
              max="365"
              value={configuration.healthDataSharing.retentionPeriod}
              onChange={(e) => setConfiguration(prev => ({
                ...prev,
                healthDataSharing: {
                  ...prev.healthDataSharing,
                  retentionPeriod: parseInt(e.target.value) || 30
                }
              }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-32"
            />
          </div>
        </div>
      )}
    </div>
  );
};

const AccessControlsStep: React.FC<StepProps> = ({ configuration, setConfiguration }) => {
  const [newControl, setNewControl] = useState<Partial<DataAccessControl>>({
    dataType: '',
    accessLevel: 'read',
    allowedServices: [],
    conditions: []
  });

  const addAccessControl = () => {
    if (newControl.dataType && newControl.accessLevel) {
      setConfiguration(prev => ({
        ...prev,
        dataAccessControls: [...prev.dataAccessControls, newControl as DataAccessControl]
      }));
      setNewControl({
        dataType: '',
        accessLevel: 'read',
        allowedServices: [],
        conditions: []
      });
    }
  };

  const removeAccessControl = (index: number) => {
    setConfiguration(prev => ({
      ...prev,
      dataAccessControls: prev.dataAccessControls.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Data Access Controls</h3>
        <p className="text-sm text-gray-600 mb-6">
          Define who can access your data and under what conditions.
        </p>
      </div>

      {/* Existing Controls */}
      <div className="space-y-3">
        <h4 className="font-medium">Current Access Controls</h4>
        {configuration.dataAccessControls.length === 0 ? (
          <p className="text-gray-500 text-sm">No access controls configured yet.</p>
        ) : (
          configuration.dataAccessControls.map((control, index) => (
            <div key={index} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">{control.dataType}</div>
                <button
                  onClick={() => removeAccessControl(index)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>
              <div className="text-sm text-gray-600">
                Access Level: {control.accessLevel} | 
                Services: {control.allowedServices.join(', ') || 'None'}
                {control.expirationDate && ` | Expires: ${control.expirationDate.toLocaleDateString()}`}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add New Control */}
      <div className="border rounded-lg p-4">
        <h4 className="font-medium mb-4">Add New Access Control</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Type
            </label>
            <select
              value={newControl.dataType}
              onChange={(e) => setNewControl(prev => ({ ...prev, dataType: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Select data type</option>
              <option value="health_vitals">Health Vitals</option>
              <option value="health_fitness">Health Fitness</option>
              <option value="personal_identity">Personal Identity</option>
              <option value="contact_info">Contact Information</option>
              <option value="service_history">Service History</option>
              <option value="documents">Documents</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Access Level
            </label>
            <select
              value={newControl.accessLevel}
              onChange={(e) => setNewControl(prev => ({ ...prev, accessLevel: e.target.value as any }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="none">No Access</option>
              <option value="read">Read Only</option>
              <option value="write">Read & Write</option>
              <option value="admin">Full Admin</option>
            </select>
          </div>
        </div>
        
        <button
          onClick={addAccessControl}
          disabled={!newControl.dataType || !newControl.accessLevel}
          className={`mt-4 px-4 py-2 rounded-lg text-sm font-medium ${
            newControl.dataType && newControl.accessLevel
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Add Control
        </button>
      </div>
    </div>
  );
};

const PrivacySettingsStep: React.FC<StepProps> = ({ configuration, setConfiguration }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Privacy Settings</h3>
        <p className="text-sm text-gray-600 mb-6">
          Configure your privacy preferences and data protection settings.
        </p>
      </div>

      <div className="space-y-4">
        {Object.entries({
          dataMinimization: 'Data Minimization - Only collect necessary data',
          automaticDeletion: 'Automatic Deletion - Delete data after retention period',
          anonymization: 'Data Anonymization - Remove identifying information when possible',
          auditLogging: 'Audit Logging - Track all data access and changes'
        }).map(([key, label]) => (
          <label key={key} className="flex items-center space-x-3 p-3 border rounded-lg">
            <input
              type="checkbox"
              checked={Boolean(configuration.privacySettings[key as keyof PrivacySettings])}
              onChange={(e) => setConfiguration(prev => ({
                ...prev,
                privacySettings: {
                  ...prev.privacySettings,
                  [key]: e.target.checked
                }
              }))}
              className="rounded"
            />
            <span className="text-sm">{label}</span>
          </label>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Encryption Level
        </label>
        <select
          value={configuration.privacySettings.encryptionLevel}
          onChange={(e) => setConfiguration(prev => ({
            ...prev,
            privacySettings: {
              ...prev.privacySettings,
              encryptionLevel: e.target.value as any
            }
          }))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="basic">Basic Encryption</option>
          <option value="enhanced">Enhanced Encryption (Recommended)</option>
          <option value="maximum">Maximum Security Encryption</option>
        </select>
      </div>
    </div>
  );
};

const VerificationStep: React.FC<StepProps> = ({ configuration, setConfiguration }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Identity Verification</h3>
        <p className="text-sm text-gray-600 mb-6">
          Configure how your identity is verified when accessing sensitive data.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Required Verification Level
        </label>
        <select
          value={configuration.identityVerification.requiredVerificationLevel}
          onChange={(e) => setConfiguration(prev => ({
            ...prev,
            identityVerification: {
              ...prev.identityVerification,
              requiredVerificationLevel: e.target.value as any
            }
          }))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="basic">Basic - Password only</option>
          <option value="enhanced">Enhanced - Multiple factors</option>
          <option value="maximum">Maximum - All available methods</option>
        </select>
      </div>

      <div className="space-y-3">
        <h4 className="font-medium">Verification Methods</h4>
        {[
          { key: 'biometric', label: 'Biometric Authentication (Touch ID, Face ID)' },
          { key: 'multiFactorAuth', label: 'Multi-Factor Authentication' }
        ].map(({ key, label }) => (
          <label key={key} className="flex items-center space-x-3 p-3 border rounded-lg">
            <input
              type="checkbox"
              checked={Boolean(configuration.identityVerification[key as keyof IdentityVerificationConfig])}
              onChange={(e) => setConfiguration(prev => ({
                ...prev,
                identityVerification: {
                  ...prev.identityVerification,
                  [key]: e.target.checked
                }
              }))}
              className="rounded"
            />
            <span className="text-sm">{label}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

const CompleteStep: React.FC<{
  configuration: ApplicationConfiguration;
  onSave: () => void;
  loading: boolean;
  errors: Record<string, string>;
}> = ({ configuration, onSave, loading, errors }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Configuration Summary</h3>
        <p className="text-sm text-gray-600 mb-6">
          Review your configuration before saving. You can always modify these settings later.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-2">Identity Providers</h4>
          <ul className="text-sm space-y-1">
            <li>Solid Pod: {configuration.solidPodEnabled ? '✅ Enabled' : '❌ Disabled'}</li>
            <li>HAT: {configuration.hatEnabled ? '✅ Enabled' : '❌ Disabled'}</li>
          </ul>
        </div>

        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-2">Health Integration</h4>
          <ul className="text-sm space-y-1">
            <li>HealthKit: {configuration.healthKitEnabled ? '✅ Enabled' : '❌ Disabled'}</li>
            {configuration.healthKitEnabled && (
              <>
                <li>Categories: {Object.values(configuration.healthDataSharing).filter(v => typeof v === 'boolean' && v).length} enabled</li>
                <li>Updates: {configuration.healthDataSharing.updateFrequency}</li>
              </>
            )}
          </ul>
        </div>

        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-2">Access Controls</h4>
          <p className="text-sm">
            {configuration.dataAccessControls.length} access control{configuration.dataAccessControls.length !== 1 ? 's' : ''} configured
          </p>
        </div>

        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-2">Privacy & Security</h4>
          <ul className="text-sm space-y-1">
            <li>Encryption: {configuration.privacySettings.encryptionLevel}</li>
            <li>Verification: {configuration.identityVerification.requiredVerificationLevel}</li>
          </ul>
        </div>
      </div>

      {errors.save && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{errors.save}</p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800 text-sm">
          Your configuration will be saved securely using your selected identity providers. 
          You can modify these settings anytime from your personal dashboard.
        </p>
      </div>
    </div>
  );
};

export default ApplicationConfigurationWorkflow;