/**
 * Person Registration Modal
 * 
 * Unified registration component for clients, staff, and managers
 * with Solid Pod PII storage and persistent configuration.
 * 
 * @license MIT
 */

import React, { useState, useEffect } from 'react';
import { solidPodService } from '../services/solidPodService';
import { solidAuthService } from '../services/solidAuthService';
import { unifiedDataOwnershipService } from '../services/unifiedDataOwnershipService';
import { agentManagerService } from '../services/agentManager';

export type PersonType = 'client' | 'staff' | 'manager';

export interface PersonRegistrationData {
  // Identifier
  id?: string;
  
  // Basic Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  
  // Address Information
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  
  // Emergency Contact
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  
  // Role-specific fields
  role: PersonType;
  
  // Client-specific
  medicalNotes?: string;
  behavioralNotes?: string;
  restrictions?: string[];
  preferredBedType?: string;
  
  // Staff/Manager-specific
  department?: string;
  position?: string;
  startDate?: string;
  permissions?: string[];
  
  // Privacy and Consent
  consentGiven: boolean;
  consentDate: string;
  privacyAgreement: boolean;
  dataRetentionPeriod: number; // days
  
  // Registration metadata
  registrationDate?: string;
}

interface PersonRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  personType: PersonType;
  onSuccess: (person: PersonRegistrationData) => void;
}

export const PersonRegistrationModal: React.FC<PersonRegistrationModalProps> = ({
  isOpen,
  onClose,
  personType,
  onSuccess
}) => {
  const [formData, setFormData] = useState<PersonRegistrationData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: {
      street: '',
      city: '',
      state: 'ID',
      zipCode: ''
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    },
    role: personType,
    consentGiven: false,
    consentDate: '',
    privacyAgreement: false,
    dataRetentionPeriod: 2555 // 7 years default
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [solidConnected, setSolidConnected] = useState(false);
  const [showPrivacyDetails, setShowPrivacyDetails] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Check Solid Pod connection status
    const checkSolidConnection = async () => {
      const sessionInfo = solidAuthService.getSessionInfo();
      setSolidConnected(sessionInfo.isLoggedIn);
    };

    checkSolidConnection();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Basic validation
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Phone validation
    const phoneRegex = /^[\d\s\-\(\)\+]{10,}$/;
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Address validation
    if (!formData.address.street.trim()) newErrors.addressStreet = 'Street address is required';
    if (!formData.address.city.trim()) newErrors.addressCity = 'City is required';
    if (!formData.address.zipCode.trim()) newErrors.addressZip = 'ZIP code is required';

    // Emergency contact validation
    if (!formData.emergencyContact.name.trim()) newErrors.emergencyName = 'Emergency contact name is required';
    if (!formData.emergencyContact.phone.trim()) newErrors.emergencyPhone = 'Emergency contact phone is required';

    // Role-specific validation
    if (personType === 'staff' || personType === 'manager') {
      if (!formData.department?.trim()) newErrors.department = 'Department is required';
      if (!formData.position?.trim()) newErrors.position = 'Position is required';
      if (!formData.startDate) newErrors.startDate = 'Start date is required';
    }

    // Consent validation
    if (!formData.consentGiven) newErrors.consent = 'Consent is required to proceed';
    if (!formData.privacyAgreement) newErrors.privacy = 'Privacy agreement must be accepted';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!solidConnected) {
      alert('Please connect to your Solid Pod first to store personal information securely.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate unique ID
      const personId = `${personType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Set consent date
      const registrationData = {
        ...formData,
        id: personId,
        consentDate: new Date().toISOString(),
        registrationDate: new Date().toISOString()
      };

      // Store in Solid Pod
      await solidPodService.storePersonData(registrationData);

      // Store in unified data ownership system
      await unifiedDataOwnershipService.storeData(personId, 'personal_identity', {
        ...registrationData,
        storedAt: new Date(),
        dataSource: 'registration_form'
      });

      // Create consent record
      await unifiedDataOwnershipService.storeData(personId, 'consent_records', {
        consentType: 'registration_and_storage',
        purpose: `${personType} registration and data management`,
        granted: true,
        timestamp: new Date(),
        evidence: {
          method: 'digital_form',
          ipAddress: 'localhost', // In production, get real IP
          userAgent: navigator.userAgent,
          timestamp: new Date()
        },
        retentionPeriod: registrationData.dataRetentionPeriod
      });

      console.log(`✅ ${personType} registered successfully:`, registrationData);
      
      // Spawn welcome agent for clients
      if (personType === 'client') {
        try {
          console.log('🤖 Spawning welcome agent for new client...');
          const agentId = await agentManagerService.spawnAgentForClient(registrationData);
          console.log(`✅ Welcome agent spawned successfully: ${agentId}`);
          
          // Add agent info to success message
          setShowSuccessMessage(true);
          setTimeout(() => {
            // Show agent spawn notification
            const agentElement = document.createElement('div');
            agentElement.setAttribute('data-testid', 'agent-spawn-notification');
            agentElement.className = 'fixed top-16 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
            agentElement.textContent = `🤖 Welcome agent ${agentId} activated for ${registrationData.firstName}`;
            document.body.appendChild(agentElement);
            
            setTimeout(() => {
              if (document.body.contains(agentElement)) {
                document.body.removeChild(agentElement);
              }
            }, 4000);
            
            onSuccess(registrationData);
            onClose();
          }, 2000);
          
        } catch (agentError) {
          console.warn('⚠️ Failed to spawn welcome agent, but registration completed:', agentError);
          // Continue with normal success flow even if agent spawn fails
          setShowSuccessMessage(true);
          setTimeout(() => {
            onSuccess(registrationData);
            onClose();
          }, 2000);
        }
      } else {
        // Non-client registration - no agent needed
        setShowSuccessMessage(true);
        setTimeout(() => {
          onSuccess(registrationData);
          onClose();
        }, 2000);
      }

    } catch (error) {
      console.error(`Failed to register ${personType}:`, error);
      setErrorMessage(`Failed to register ${personType}. Please try again.`);
      setShowErrorMessage(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getRoleSpecificFields = () => {
    if (personType === 'client') {
      return (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Client-Specific Information</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Medical Notes
            </label>
            <textarea
              value={formData.medicalNotes || ''}
              onChange={(e) => handleInputChange('medicalNotes', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Any medical conditions, medications, or health concerns..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Behavioral Notes
            </label>
            <textarea
              value={formData.behavioralNotes || ''}
              onChange={(e) => handleInputChange('behavioralNotes', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Any behavioral considerations or special needs..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Bed Type
            </label>
            <select
              value={formData.preferredBedType || 'standard'}
              onChange={(e) => handleInputChange('preferredBedType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="standard">Standard</option>
              <option value="accessible">Accessible</option>
              <option value="family">Family</option>
              <option value="isolation">Isolation</option>
            </select>
          </div>
        </div>
      );
    } else {
      return (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">
            {personType === 'staff' ? 'Staff' : 'Manager'} Information
          </h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department *
              </label>
              <input
                type="text"
                value={formData.department || ''}
                onChange={(e) => handleInputChange('department', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.department ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Operations, Social Services"
              />
              {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position *
              </label>
              <input
                type="text"
                value={formData.position || ''}
                onChange={(e) => handleInputChange('position', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.position ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Case Manager, Supervisor"
              />
              {errors.position && <p className="text-red-500 text-xs mt-1">{errors.position}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date *
            </label>
            <input
              type="date"
              value={formData.startDate || ''}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.startDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
          </div>
        </div>
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">
              Register New {personType.charAt(0).toUpperCase() + personType.slice(1)}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>
          
          {/* Success Notification */}
          {showSuccessMessage && (
            <div data-testid="success-notification" className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex">
                <div className="text-green-600">✅</div>
                <div className="ml-2 text-sm text-green-700">
                  {personType.charAt(0).toUpperCase() + personType.slice(1)} registered successfully! Redirecting...
                </div>
              </div>
            </div>
          )}

          {/* Error Notification */}
          {showErrorMessage && (
            <div data-testid="error-notification" className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <div className="text-red-600">❌</div>
                <div className="ml-2 text-sm text-red-700">
                  {errorMessage}
                </div>
                <button 
                  onClick={() => setShowErrorMessage(false)}
                  className="ml-auto text-red-600 hover:text-red-800"
                >
                  ×
                </button>
              </div>
            </div>
          )}
          
          {!solidConnected && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex">
                <div className="text-yellow-600">⚠️</div>
                <div className="ml-2 text-sm text-yellow-700">
                  Solid Pod not connected. Personal information will be stored securely in your Solid Pod.
                  Please connect to your pod first.
                </div>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  data-testid="first-name-input"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.firstName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  data-testid="last-name-input"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.lastName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  data-testid="email-input"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  data-testid="phone-input"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth *
              </label>
              <input
                type="date"
                data-testid="date-of-birth-input"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.dateOfBirth && <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth}</p>}
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Address</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Address *
              </label>
              <input
                type="text"
                value={formData.address.street}
                onChange={(e) => handleInputChange('address.street', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.addressStreet ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.addressStreet && <p className="text-red-500 text-xs mt-1">{errors.addressStreet}</p>}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  value={formData.address.city}
                  onChange={(e) => handleInputChange('address.city', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.addressCity ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.addressCity && <p className="text-red-500 text-xs mt-1">{errors.addressCity}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <select
                  value={formData.address.state}
                  onChange={(e) => handleInputChange('address.state', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ID">Idaho</option>
                  <option value="WA">Washington</option>
                  <option value="OR">Oregon</option>
                  <option value="MT">Montana</option>
                  <option value="UT">Utah</option>
                  <option value="NV">Nevada</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  value={formData.address.zipCode}
                  onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.addressZip ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.addressZip && <p className="text-red-500 text-xs mt-1">{errors.addressZip}</p>}
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Emergency Contact</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Name *
                </label>
                <input
                  type="text"
                  data-testid="emergency-contact-name-input"
                  value={formData.emergencyContact.name}
                  onChange={(e) => handleInputChange('emergencyContact.name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.emergencyName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.emergencyName && <p className="text-red-500 text-xs mt-1">{errors.emergencyName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Relationship
                </label>
                <input
                  type="text"
                  data-testid="emergency-contact-relationship-input"
                  value={formData.emergencyContact.relationship}
                  onChange={(e) => handleInputChange('emergencyContact.relationship', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Spouse, Parent, Friend"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Phone *
              </label>
              <input
                type="tel"
                data-testid="emergency-contact-phone-input"
                value={formData.emergencyContact.phone}
                onChange={(e) => handleInputChange('emergencyContact.phone', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.emergencyPhone ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.emergencyPhone && <p className="text-red-500 text-xs mt-1">{errors.emergencyPhone}</p>}
            </div>
          </div>

          {/* Role-specific fields */}
          {getRoleSpecificFields()}

          {/* Privacy and Consent */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Privacy and Consent</h3>
            
            <div className="space-y-3">
              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={formData.consentGiven}
                  onChange={(e) => handleInputChange('consentGiven', e.target.checked)}
                  className="mt-1 mr-3"
                />
                <div className="text-sm">
                  <div className="font-medium text-gray-900">
                    I consent to the collection and storage of my personal information *
                  </div>
                  <div className="text-gray-600 mt-1">
                    This information will be stored securely in your personal Solid Pod and used only for 
                    shelter services and emergency purposes. You maintain full control over your data.
                  </div>
                </div>
              </label>
              {errors.consent && <p className="text-red-500 text-xs">{errors.consent}</p>}

              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={formData.privacyAgreement}
                  onChange={(e) => handleInputChange('privacyAgreement', e.target.checked)}
                  className="mt-1 mr-3"
                />
                <div className="text-sm">
                  <div className="font-medium text-gray-900">
                    I agree to the Privacy Policy and Terms of Service *
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPrivacyDetails(!showPrivacyDetails)}
                    className="text-blue-600 hover:text-blue-800 underline mt-1"
                  >
                    {showPrivacyDetails ? 'Hide' : 'View'} privacy details
                  </button>
                </div>
              </label>
              {errors.privacy && <p className="text-red-500 text-xs">{errors.privacy}</p>}

              {showPrivacyDetails && (
                <div className="bg-gray-50 p-4 rounded-md text-sm text-gray-700">
                  <h4 className="font-medium mb-2">Privacy and Data Protection:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Your data is stored in your personal Solid Pod, giving you full control</li>
                    <li>We only access data necessary for providing services</li>
                    <li>Data is encrypted and protected according to industry standards</li>
                    <li>You can revoke access or delete data at any time</li>
                    <li>Data retention period: {formData.dataRetentionPeriod} days (7 years default)</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="submit-registration-button"
              disabled={isSubmitting || !solidConnected}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Registering...
                </>
              ) : (
                `Register ${personType.charAt(0).toUpperCase() + personType.slice(1)}`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};