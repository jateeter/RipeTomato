import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Client } from '../types/Shelter';
import { userPodService } from '../services/userPodService';
import { dataswiftHATService } from '../services/dataswiftHATService';
import { appleWalletService } from '../services/appleWalletService';
import { unifiedDataOwnershipService } from '../services/unifiedDataOwnershipService';
import { UnifiedDataOwner, WalletPassType, PassMetadata } from '../types/UnifiedDataOwnership';

interface ClientRegistrationProps {
  onClientRegistered: (client: Client) => void;
  onCancel: () => void;
  existingClient?: Client;
  mode?: 'create' | 'edit';
}

const ClientRegistration: React.FC<ClientRegistrationProps> = ({
  onClientRegistered,
  onCancel,
  existingClient,
  mode = 'create'
}) => {
  const [formData, setFormData] = useState<Partial<Client>>({
    firstName: existingClient?.firstName || '',
    lastName: existingClient?.lastName || '',
    dateOfBirth: existingClient?.dateOfBirth || new Date('1990-01-01'),
    phone: existingClient?.phone || '',
    email: existingClient?.email || '',
    emergencyContact: existingClient?.emergencyContact || {
      name: '',
      phone: '',
      relationship: ''
    },
    medicalNotes: existingClient?.medicalNotes || '',
    behavioralNotes: existingClient?.behavioralNotes || '',
    restrictions: existingClient?.restrictions || [],
    preferredBedType: existingClient?.preferredBedType || 'standard',
    isActive: existingClient?.isActive ?? true,
    identificationVerified: existingClient?.identificationVerified || false
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const steps = [
    {
      title: 'Basic Information',
      description: 'Personal details and contact information'
    },
    {
      title: 'Emergency Contact',
      description: 'Emergency contact person details'
    },
    {
      title: 'Medical & Behavioral',
      description: 'Medical conditions and behavioral notes'
    },
    {
      title: 'Preferences & Verification',
      description: 'Bed preferences and ID verification'
    }
  ];

  const validateCurrentStep = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (currentStep === 0) {
      if (!formData.firstName?.trim()) newErrors.firstName = 'First name is required';
      if (!formData.lastName?.trim()) newErrors.lastName = 'Last name is required';
      if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
      
      const today = new Date();
      const birthDate = formData.dateOfBirth ? new Date(formData.dateOfBirth) : null;
      if (birthDate && birthDate >= today) newErrors.dateOfBirth = 'Date of birth must be in the past';
      
      if (birthDate) {
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 18) newErrors.dateOfBirth = 'Client must be at least 18 years old';
      }
    }

    if (currentStep === 1 && formData.emergencyContact) {
      if (!formData.emergencyContact.name?.trim()) {
        newErrors['emergencyContact.name'] = 'Emergency contact name is required';
      }
      if (!formData.emergencyContact.phone?.trim()) {
        newErrors['emergencyContact.phone'] = 'Emergency contact phone is required';
      }
      if (!formData.emergencyContact.relationship?.trim()) {
        newErrors['emergencyContact.relationship'] = 'Relationship is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    const clientId = existingClient?.id || uuidv4();
    const newClient: Client = {
      id: clientId,
      firstName: formData.firstName!,
      lastName: formData.lastName!,
      dateOfBirth: formData.dateOfBirth!,
      phone: formData.phone,
      email: formData.email,
      emergencyContact: formData.emergencyContact,
      medicalNotes: formData.medicalNotes,
      behavioralNotes: formData.behavioralNotes,
      restrictions: formData.restrictions || [],
      preferredBedType: formData.preferredBedType!,
      lastStay: existingClient?.lastStay,
      totalStays: existingClient?.totalStays || 0,
      isActive: formData.isActive!,
      registrationDate: existingClient?.registrationDate || new Date(),
      identificationVerified: formData.identificationVerified!,
      bannedUntil: existingClient?.bannedUntil,
      banReason: existingClient?.banReason
    };

    // For new client registrations, create unified data ownership model
    if (mode === 'create' && !existingClient) {
      try {
        console.log(`🔐 Creating unified data ownership for ${newClient.firstName} ${newClient.lastName}...`);
        
        // Create unified data owner with HAT vault and wallet access
        const dataOwner: UnifiedDataOwner = await unifiedDataOwnershipService.createDataOwner(newClient);
        
        console.log(`✅ Unified data ownership created successfully:`);
        console.log(`🎩 HAT Vault: ${dataOwner.hatVault.hatDomain}`);
        console.log(`📱 Wallet Passes: ${dataOwner.walletAccess.passes.length} passes created`);
        console.log(`🔐 Privacy: ${dataOwner.dataPermissions.permissions.length} permissions configured`);
        console.log(`✅ Consent: ${dataOwner.consentRecords.length} consent records established`);

        // Create additional wallet passes for enhanced services
        const additionalPasses: { type: WalletPassType; metadata: PassMetadata }[] = [];

        // Service entitlement pass
        additionalPasses.push({
          type: 'service_entitlement',
          metadata: {
            title: 'Shelter Services Access',
            description: 'Entitlement to shelter services and programs',
            issuer: 'Idaho Community Shelter',
            category: 'services',
            services: ['Meals', 'Showers', 'Storage', 'WiFi', 'Counseling', 'Job Training', 'Medical Assistance'],
            restrictions: newClient.restrictions || []
          }
        });

        // Emergency contact pass if emergency contact provided
        if (newClient.emergencyContact) {
          additionalPasses.push({
            type: 'emergency_contact',
            metadata: {
              title: 'Emergency Contact Information',
              description: 'Critical emergency contact and medical information',
              issuer: 'Idaho Community Shelter',
              category: 'emergency',
              services: [],
              emergencyInfo: {
                contacts: [{
                  name: newClient.emergencyContact.name,
                  phone: newClient.emergencyContact.phone,
                  relationship: newClient.emergencyContact.relationship,
                  isPrimary: true
                }],
                medicalAlerts: newClient.medicalNotes ? [newClient.medicalNotes] : [],
                accessInstructions: 'Show this pass to emergency personnel for immediate access to critical information'
              }
            }
          });
        }

        // Create additional passes
        for (const passConfig of additionalPasses) {
          try {
            const additionalPass = await appleWalletService.createUnifiedWalletPass(
              clientId,
              passConfig.type,
              passConfig.metadata,
              newClient
            );
            console.log(`📱 Additional pass created: ${passConfig.type} (${additionalPass.serialNumber})`);
          } catch (passError) {
            console.warn(`Failed to create ${passConfig.type} pass:`, passError);
          }
        }

        // Backup: Also create Solid Pod for legacy compatibility
        try {
          const podConfig = await userPodService.provisionUserPod({
            userId: clientId,
            firstName: newClient.firstName,
            lastName: newClient.lastName,
            email: newClient.email,
            phone: newClient.phone,
            shelterName: 'Idaho Community Shelter',
            preferredProvider: 'https://solidcommunity.net'
          });
          await userPodService.initializePodStructure(clientId);
          await userPodService.storeUserData(clientId, newClient, true);
          console.log(`✅ Legacy Solid Pod backup created: ${podConfig.podUrl}`);
        } catch (podError) {
          console.warn('Solid Pod backup creation failed:', podError);
        }

        // Generate comprehensive success message
        const totalPasses = dataOwner.walletAccess.passes.length + additionalPasses.length;
        const successMessage = `✅ Client registered with unified data ownership!

🎩 Personal Data Vault: ${dataOwner.hatVault.hatDomain}
📱 Digital Wallet: ${totalPasses} passes created and ready
🔐 Data Privacy: Zero-knowledge architecture with full client control
✅ Data Consent: Comprehensive consent management established
🏠 Shelter Services: Full access to all available services

The client now owns and controls all their personal data through:
• Personal HAT data vault for secure storage
• Digital wallet passes for service access
• Granular privacy and consent controls
• Complete data portability and ownership rights

This unified approach ensures maximum privacy, security, and individual autonomy over personal information.`;

        window.alert(successMessage);

      } catch (error) {
        console.error('Failed to create unified data ownership:', error);
        
        // Fallback to legacy creation
        console.log('🔄 Attempting fallback to legacy services...');
        try {
          // Create individual Dataswift HAT for the user
          const hatDomain = await dataswiftHATService.createClientHAT(newClient);
          
          // Create basic wallet passes
          const shelterPass = await appleWalletService.createShelterPass(
            newClient,
            undefined,
            ['Meals', 'Showers', 'Storage', 'WiFi']
          );

          const idNumber = `ID-${new Date().getFullYear()}-${clientId.substring(0, 8).toUpperCase()}`;
          const idPass = await appleWalletService.createIdentificationPass(
            newClient,
            'shelter_id',
            idNumber
          );

          const fallbackMessage = `⚠️ Client registered with fallback services!

${hatDomain ? `🎩 Personal Dataswift HAT: ${hatDomain}` : ''}
📱 Basic wallet passes created
⚠️ Note: Full unified data ownership features may not be available

Error: ${error instanceof Error ? error.message : 'Unknown error'}`;

          window.alert(fallbackMessage);

        } catch (fallbackError) {
          console.error('Fallback creation also failed:', fallbackError);
          window.alert(`❌ Client registration encountered issues creating data infrastructure.

Error: ${error instanceof Error ? error.message : 'Unknown error'}
Fallback Error: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}

Client can still use basic shelter services, but personal data features may not be available.`);
        }
      }
    } else if (mode === 'edit') {
      console.log(`📝 Updated client information for ${newClient.firstName} ${newClient.lastName}`);
      
      // For existing clients, update their pod data if they have one
      try {
        const existingPod = userPodService.getUserPod(clientId);
        if (existingPod) {
          await userPodService.storeUserData(clientId, newClient, true);
          console.log(`✅ Updated client data in personal pod: ${existingPod.podUrl}`);
        }
      } catch (error) {
        console.error('Failed to update pod data:', error);
      }
    }

    onClientRegistered(newClient);
  };

  const updateFormData = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev] as any,
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const addRestriction = (restriction: string) => {
    if (restriction && !formData.restrictions?.includes(restriction)) {
      setFormData(prev => ({
        ...prev,
        restrictions: [...(prev.restrictions || []), restriction]
      }));
    }
  };

  const removeRestriction = (restriction: string) => {
    setFormData(prev => ({
      ...prev,
      restrictions: prev.restrictions?.filter(r => r !== restriction) || []
    }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.firstName || ''}
                  onChange={(e) => updateFormData('firstName', e.target.value)}
                  className={`w-full border rounded-md px-3 py-2 ${
                    errors.firstName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter first name"
                />
                {errors.firstName && <p className="text-red-600 text-xs mt-1">{errors.firstName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.lastName || ''}
                  onChange={(e) => updateFormData('lastName', e.target.value)}
                  className={`w-full border rounded-md px-3 py-2 ${
                    errors.lastName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter last name"
                />
                {errors.lastName && <p className="text-red-600 text-xs mt-1">{errors.lastName}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth *
              </label>
              <input
                type="date"
                value={formData.dateOfBirth?.toISOString().split('T')[0] || ''}
                onChange={(e) => updateFormData('dateOfBirth', new Date(e.target.value))}
                className={`w-full border rounded-md px-3 py-2 ${
                  errors.dateOfBirth ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.dateOfBirth && <p className="text-red-600 text-xs mt-1">{errors.dateOfBirth}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => updateFormData('phone', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="(208) 555-0123"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="email@example.com"
                />
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Emergency Contact Name *
              </label>
              <input
                type="text"
                value={formData.emergencyContact?.name || ''}
                onChange={(e) => updateFormData('emergencyContact.name', e.target.value)}
                className={`w-full border rounded-md px-3 py-2 ${
                  errors['emergencyContact.name'] ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Full name of emergency contact"
              />
              {errors['emergencyContact.name'] && (
                <p className="text-red-600 text-xs mt-1">{errors['emergencyContact.name']}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Emergency Contact Phone *
              </label>
              <input
                type="tel"
                value={formData.emergencyContact?.phone || ''}
                onChange={(e) => updateFormData('emergencyContact.phone', e.target.value)}
                className={`w-full border rounded-md px-3 py-2 ${
                  errors['emergencyContact.phone'] ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="(208) 555-0123"
              />
              {errors['emergencyContact.phone'] && (
                <p className="text-red-600 text-xs mt-1">{errors['emergencyContact.phone']}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Relationship *
              </label>
              <select
                value={formData.emergencyContact?.relationship || ''}
                onChange={(e) => updateFormData('emergencyContact.relationship', e.target.value)}
                className={`w-full border rounded-md px-3 py-2 ${
                  errors['emergencyContact.relationship'] ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select relationship</option>
                <option value="spouse">Spouse</option>
                <option value="parent">Parent</option>
                <option value="child">Child</option>
                <option value="sibling">Sibling</option>
                <option value="friend">Friend</option>
                <option value="other">Other</option>
              </select>
              {errors['emergencyContact.relationship'] && (
                <p className="text-red-600 text-xs mt-1">{errors['emergencyContact.relationship']}</p>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Medical Notes
              </label>
              <textarea
                value={formData.medicalNotes || ''}
                onChange={(e) => updateFormData('medicalNotes', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 h-24 resize-none"
                placeholder="Any medical conditions, medications, or health concerns..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Include allergies, medications, mobility issues, etc.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Behavioral Notes
              </label>
              <textarea
                value={formData.behavioralNotes || ''}
                onChange={(e) => updateFormData('behavioralNotes', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 h-24 resize-none"
                placeholder="Any behavioral considerations or special needs..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Include PTSD, anxiety, sleep issues, social preferences, etc.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Restrictions
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.restrictions?.map(restriction => (
                  <span
                    key={restriction}
                    className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm flex items-center space-x-1"
                  >
                    <span>{restriction}</span>
                    <button
                      onClick={() => removeRestriction(restriction)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Add restriction (e.g., no pets, no smoking)"
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addRestriction((e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const input = document.querySelector('input[placeholder*="Add restriction"]') as HTMLInputElement;
                    if (input?.value) {
                      addRestriction(input.value);
                      input.value = '';
                    }
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Bed Type
              </label>
              <select
                value={formData.preferredBedType || 'standard'}
                onChange={(e) => updateFormData('preferredBedType', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="standard">🛏️ Standard Bed</option>
                <option value="accessible">♿ Accessible Bed</option>
                <option value="family">👨‍👩‍👧‍👦 Family Bed</option>
              </select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.isActive || false}
                  onChange={(e) => updateFormData('isActive', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="active" className="text-sm text-gray-700">
                  Client is active and eligible for services
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="verified"
                  checked={formData.identificationVerified || false}
                  onChange={(e) => updateFormData('identificationVerified', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="verified" className="text-sm text-gray-700">
                  Identification has been verified
                </label>
              </div>
            </div>

            {!formData.identificationVerified && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <span className="text-yellow-600">⚠️</span>
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">ID Verification Required</p>
                    <p>Client will need to provide valid identification before check-in.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="bg-blue-600 text-white p-6 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {mode === 'edit' ? 'Edit Client' : 'Client Registration'}
            </h1>
            <p className="text-blue-100">
              {mode === 'edit' ? 'Update client information' : 'Register a new client for shelter services'}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-blue-100 hover:text-white text-xl"
          >
            ×
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-600">
            Step {currentStep + 1} of {steps.length}
          </span>
          <span className="text-sm text-gray-600">
            {Math.round(((currentStep + 1) / steps.length) * 100)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          ></div>
        </div>
        
        <div className="mt-4">
          <h2 className="text-lg font-semibold">{steps[currentStep].title}</h2>
          <p className="text-gray-600 text-sm">{steps[currentStep].description}</p>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-6">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="p-6 bg-gray-50 rounded-b-lg flex justify-between">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>

        <div className="space-x-2">
          {currentStep > 0 && (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Previous
            </button>
          )}

          <button
            onClick={handleNext}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {currentStep === steps.length - 1 
              ? (mode === 'edit' ? 'Update Client' : 'Register Client')
              : 'Next'
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientRegistration;