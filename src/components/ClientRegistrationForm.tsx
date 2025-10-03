/**
 * Client Registration Form Component
 * 
 * Complete form for registering new shelter clients with their own Solid Pod creation.
 * Integrates with the comprehensive PII management and access control system.
 * 
 * @license MIT
 */

import React, { useState, useEffect } from 'react';
import { Session } from '@inrupt/solid-client-authn-browser';
import ClientRegistrationService, { 
  ClientRegistrationData, 
  ClientRegistrationResult 
} from '../services/clientRegistrationService';
import { UserRole } from '../services/solidPIICredentialManager';
import PIICredentialManager from './PIICredentialManager';
import SecureClientDataViewer from './SecureClientDataViewer';

interface ClientRegistrationFormProps {
  session: Session;
  shelterPodUrl: string;
  currentStaff: {
    id: string;
    name: string;
    webId: string;
    role: UserRole;
  };
  onRegistrationComplete?: (result: ClientRegistrationResult) => void;
}

interface RegistrationProgress {
  step: 'intake' | 'pod_creation' | 'data_storage' | 'access_setup' | 'verification' | 'completed';
  progress: number;
  message: string;
  timestamp: string;
}

export const ClientRegistrationForm: React.FC<ClientRegistrationFormProps> = ({
  session,
  shelterPodUrl,
  currentStaff,
  onRegistrationComplete
}) => {
  const [registrationService, setRegistrationService] = useState<ClientRegistrationService | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'form' | 'registration' | 'completed'>('form');
  const [registrationProgress, setRegistrationProgress] = useState<RegistrationProgress | null>(null);
  const [registrationResult, setRegistrationResult] = useState<ClientRegistrationResult | null>(null);

  // Form data state
  const [formData, setFormData] = useState<Partial<ClientRegistrationData>>({
    // Basic Information
    firstName: '',
    lastName: '',
    preferredName: '',
    dateOfBirth: '',
    age: 0,
    gender: '',
    pronouns: '',
    phoneNumber: '',
    email: '',
    
    // Registration info
    intakeDate: new Date().toISOString(),
    intakeStaff: currentStaff,
    
    // Initial Assessment
    initialAssessment: {
      housingStatus: 'unsheltered',
      urgencyLevel: 'medium',
      immediateNeeds: [],
      healthConcerns: [],
      hasChildren: false,
      veteranStatus: false,
      disabilityStatus: false
    },
    
    // Service Preferences
    servicePreferences: {
      preferredContactMethod: 'in_person',
      languagePreference: 'English',
      accessibilityNeeds: [],
      consentToShare: {
        medicalInfo: false,
        financialInfo: false,
        caseNotes: true,
        emergencyContact: true
      }
    }
  });

  // Initialize registration service
  useEffect(() => {
    const initService = async () => {
      try {
        setIsLoading(true);
        const service = new ClientRegistrationService(session, shelterPodUrl);
        await service.initialize();
        
        service.setProgressCallback(setRegistrationProgress);
        setRegistrationService(service);
        setIsInitialized(true);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize registration service');
        console.error('Registration service initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (session && shelterPodUrl) {
      initService();
    }
  }, [session, shelterPodUrl]);

  // Handle form field changes
  const handleInputChange = (field: string, value: any, section?: string) => {
    setFormData(prev => {
      if (section) {
        return {
          ...prev,
          [section]: {
            ...(prev[section as keyof ClientRegistrationData] as any || {}),
            [field]: value
          }
        };
      }
      return {
        ...prev,
        [field]: value
      };
    });
  };

  // Handle array field changes (like immediate needs, health concerns)
  const handleArrayFieldChange = (section: string, field: string, values: string[]) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section as keyof ClientRegistrationData] as any || {}),
        [field]: values
      }
    }));
  };

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return 0;
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // Handle date of birth change with age calculation
  const handleDateOfBirthChange = (dateOfBirth: string) => {
    const age = calculateAge(dateOfBirth);
    setFormData(prev => ({
      ...prev,
      dateOfBirth,
      age
    }));
  };

  // Validate form
  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (!formData.firstName?.trim()) errors.push('First name is required');
    if (!formData.lastName?.trim()) errors.push('Last name is required');
    if (!formData.dateOfBirth) errors.push('Date of birth is required');
    if (!formData.initialAssessment?.housingStatus) errors.push('Housing status is required');
    if (!formData.servicePreferences?.preferredContactMethod) errors.push('Preferred contact method is required');
    
    return errors;
  };

  // Handle form submission
  const handleSubmit = async () => {
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return;
    }

    if (!registrationService) {
      setError('Registration service not initialized');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setCurrentStep('registration');

      // Complete the registration data
      const completeRegistrationData: ClientRegistrationData = {
        ...formData as ClientRegistrationData,
        clientId: '', // Will be generated
        registrationDate: new Date().toISOString(),
        registrationLocation: 'Main Shelter',
        intakeWorker: currentStaff.name,
        consentGiven: true,
        consentDate: new Date().toISOString(),
        privacyNoticeAccepted: true,
        status: 'active',
        lastUpdated: new Date().toISOString(),
        updatedBy: currentStaff.id
      };

      // Start registration process
      const result = await registrationService.registerNewClient(completeRegistrationData);
      
      setRegistrationResult(result);
      setCurrentStep('completed');
      
      onRegistrationComplete?.(result);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      setCurrentStep('form');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setCurrentStep('form');
    setRegistrationResult(null);
    setRegistrationProgress(null);
    setError(null);
    setFormData({
      firstName: '',
      lastName: '',
      preferredName: '',
      dateOfBirth: '',
      age: 0,
      gender: '',
      pronouns: '',
      phoneNumber: '',
      email: '',
      intakeDate: new Date().toISOString(),
      intakeStaff: currentStaff,
      initialAssessment: {
        housingStatus: 'unsheltered',
        urgencyLevel: 'medium',
        immediateNeeds: [],
        healthConcerns: [],
        hasChildren: false,
        veteranStatus: false,
        disabilityStatus: false
      },
      servicePreferences: {
        preferredContactMethod: 'in_person',
        languagePreference: 'English',
        accessibilityNeeds: [],
        consentToShare: {
          medicalInfo: false,
          financialInfo: false,
          caseNotes: true,
          emergencyContact: true
        }
      }
    });
  };

  if (!isInitialized && isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Initializing registration system...</span>
      </div>
    );
  }

  if (error && !registrationService) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Initialization Error</h3>
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  // Registration in progress
  if (currentStep === 'registration') {
    return (
      <div className="bg-white shadow-lg rounded-lg p-8">
        <div className="text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Registering Client</h2>
            <p className="text-gray-600">Creating secure client pod and access controls...</p>
          </div>
          
          {registrationProgress && (
            <div className="space-y-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${registrationProgress.progress}%` }}
                ></div>
              </div>
              
              <div className="text-left space-y-2">
                <p className="font-medium text-gray-700">{registrationProgress.message}</p>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Step: {registrationProgress.step.replace('_', ' ')}</span>
                  <span>{registrationProgress.progress}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Registration completed
  if (currentStep === 'completed' && registrationResult) {
    return (
      <div className="bg-white shadow-lg rounded-lg p-8">
        {registrationResult.success ? (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <span className="text-2xl">✅</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
            <p className="text-gray-600 mb-6">Client has been registered with their own secure data pod.</p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-gray-800 mb-3">Registration Details</h3>
              <div className="space-y-2 text-sm">
                <div><strong>Client ID:</strong> {registrationResult.clientId}</div>
                <div><strong>Client Pod URL:</strong> {registrationResult.podUrl}</div>
                {registrationResult.accessCredentials && (
                  <>
                    <div><strong>Staff Credential ID:</strong> {registrationResult.accessCredentials.staffCredentialId}</div>
                    <div><strong>Client Access Code:</strong> {registrationResult.accessCredentials.clientAccessCode}</div>
                  </>
                )}
              </div>
            </div>

            {registrationResult.warnings && registrationResult.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-yellow-800 mb-2">Warnings</h4>
                <ul className="text-sm text-yellow-700 list-disc list-inside">
                  {registrationResult.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex space-x-4">
              <button
                onClick={resetForm}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Register Another Client
              </button>
              <button
                onClick={() => window.print()}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Print Registration
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <span className="text-2xl">❌</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Failed</h2>
            <p className="text-gray-600 mb-6">There was an error during the registration process.</p>
            
            {registrationResult.errors && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                <h4 className="font-medium text-red-800 mb-2">Errors</h4>
                <ul className="text-sm text-red-700 list-disc list-inside">
                  {registrationResult.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={() => setCurrentStep('form')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    );
  }

  // Main registration form
  return (
    <div data-testid="client-registration-form" className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg">
      <div className="px-8 py-6 border-b border-gray-200">
        <div className="flex items-center">
          <div className="bg-blue-100 p-2 rounded-full mr-4">
            <span className="text-xl">🏠</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New Client Registration</h1>
            <p className="text-gray-600">Register a new shelter client with secure data pod creation</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-8 mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-red-600 mr-2">⚠️</span>
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="p-8 space-y-8">
        {/* Basic Information Section */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                data-testid="input-firstName"
                type="text"
                value={formData.firstName || ''}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                data-testid="input-lastName"
                type="text"
                value={formData.lastName || ''}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Name
              </label>
              <input
                type="text"
                value={formData.preferredName || ''}
                onChange={(e) => handleInputChange('preferredName', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                data-testid="input-dateOfBirth"
                type="date"
                value={formData.dateOfBirth || ''}
                onChange={(e) => handleDateOfBirthChange(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
              {formData.age && formData.age > 0 && (
                <p data-testid="calculated-age" className="text-sm text-gray-500 mt-1">Age: {formData.age} years</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                value={formData.gender || ''}
                onChange={(e) => handleInputChange('gender', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non-binary">Non-binary</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pronouns</label>
              <input
                type="text"
                value={formData.pronouns || ''}
                onChange={(e) => handleInputChange('pronouns', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="he/him, she/her, they/them, etc."
              />
            </div>
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={formData.phoneNumber || ''}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>
        </div>

        {/* Initial Assessment Section */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Initial Assessment</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Housing Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.initialAssessment?.housingStatus || ''}
                  onChange={(e) => handleInputChange('housingStatus', e.target.value, 'initialAssessment')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                >
                  <option value="unsheltered">Unsheltered (street, car, abandoned building)</option>
                  <option value="temporary">Temporary housing (friend's couch, hotel)</option>
                  <option value="doubled_up">Doubled up (staying with others)</option>
                  <option value="institutional">Institutional (hospital, jail, rehab)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Urgency Level</label>
                <select
                  value={formData.initialAssessment?.urgencyLevel || ''}
                  onChange={(e) => handleInputChange('urgencyLevel', e.target.value, 'initialAssessment')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.initialAssessment?.hasChildren || false}
                  onChange={(e) => handleInputChange('hasChildren', e.target.checked, 'initialAssessment')}
                  className="mr-2"
                />
                <span className="text-sm">Has Children</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.initialAssessment?.veteranStatus || false}
                  onChange={(e) => handleInputChange('veteranStatus', e.target.checked, 'initialAssessment')}
                  className="mr-2"
                />
                <span className="text-sm">Veteran Status</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.initialAssessment?.disabilityStatus || false}
                  onChange={(e) => handleInputChange('disabilityStatus', e.target.checked, 'initialAssessment')}
                  className="mr-2"
                />
                <span className="text-sm">Has Disability</span>
              </label>
            </div>
          </div>
        </div>

        {/* Service Preferences Section */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Service Preferences</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Contact Method <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.servicePreferences?.preferredContactMethod || ''}
                onChange={(e) => handleInputChange('preferredContactMethod', e.target.value, 'servicePreferences')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              >
                <option value="phone">Phone</option>
                <option value="email">Email</option>
                <option value="in_person">In Person</option>
                <option value="text">Text Message</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Language Preference</label>
              <input
                type="text"
                value={formData.servicePreferences?.languagePreference || ''}
                onChange={(e) => handleInputChange('languagePreference', e.target.value, 'servicePreferences')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="English, Spanish, etc."
              />
            </div>
          </div>
          
          {/* Data Sharing Consent */}
          <div className="mt-6">
            <h3 className="text-md font-medium text-gray-700 mb-3">Data Sharing Consent</h3>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.servicePreferences?.consentToShare?.medicalInfo || false}
                  onChange={(e) => handleInputChange('consentToShare', {
                    ...formData.servicePreferences?.consentToShare,
                    medicalInfo: e.target.checked
                  }, 'servicePreferences')}
                  className="mr-2"
                />
                <span className="text-sm">Consent to share medical information with healthcare providers</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.servicePreferences?.consentToShare?.financialInfo || false}
                  onChange={(e) => handleInputChange('consentToShare', {
                    ...formData.servicePreferences?.consentToShare,
                    financialInfo: e.target.checked
                  }, 'servicePreferences')}
                  className="mr-2"
                />
                <span className="text-sm">Consent to share financial information for benefits assistance</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.servicePreferences?.consentToShare?.caseNotes || false}
                  onChange={(e) => handleInputChange('consentToShare', {
                    ...formData.servicePreferences?.consentToShare,
                    caseNotes: e.target.checked
                  }, 'servicePreferences')}
                  className="mr-2"
                />
                <span className="text-sm">Consent to share case notes between case managers</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.servicePreferences?.consentToShare?.emergencyContact || false}
                  onChange={(e) => handleInputChange('consentToShare', {
                    ...formData.servicePreferences?.consentToShare,
                    emergencyContact: e.target.checked
                  }, 'servicePreferences')}
                  className="mr-2"
                />
                <span className="text-sm">Consent to contact emergency contact in crisis situations</span>
              </label>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <span className="text-red-500">*</span> Required fields
          </div>
          
          <div className="space-x-4">
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Form
            </button>
            
            <button
              type="submit"
              disabled={isLoading}
              className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Registering...' : 'Register Client'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ClientRegistrationForm;