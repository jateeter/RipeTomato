/**
 * Client Bed Registration Modal
 * 
 * Modal for registering clients into shelter beds with calendar integration,
 * bed selection, and comprehensive intake forms.
 * 
 * @license MIT
 */

import React, { useState, useEffect } from 'react';
import { ShelterFacility, shelterDataService } from '../services/shelterDataService';
import { solidPodService } from '../services/solidPodService';
import { PersonRegistrationData } from './PersonRegistrationModal';

export interface BedRegistration {
  id: string;
  clientId: string;
  clientName: string;
  shelterId: string;
  shelterName: string;
  bedNumber?: string;
  bedType: 'standard' | 'accessible' | 'family' | 'isolation';
  checkInDate: Date;
  expectedCheckOutDate?: Date;
  actualCheckOutDate?: Date;
  registrationDate: Date;
  registeredBy: string;
  status: 'active' | 'completed' | 'cancelled' | 'no_show';
  specialNeeds?: string[];
  medicalNotes?: string;
  behavioralNotes?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  documents?: {
    id: string;
    qrCode?: string;
    verified: boolean;
  }[];
}

interface ClientBedRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  shelter?: ShelterFacility;
  selectedDate?: Date;
  onRegistrationComplete: (registration: BedRegistration) => void;
  userRole: 'manager' | 'staff' | 'supervisor';
}

interface ClientSearchResult {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phone: string;
  lastSeen?: Date;
  hasActiveRegistration: boolean;
  preferredBedType?: string;
  medicalNotes?: string;
  behavioralNotes?: string;
}

export const ClientBedRegistrationModal: React.FC<ClientBedRegistrationModalProps> = ({
  isOpen,
  onClose,
  shelter,
  selectedDate,
  onRegistrationComplete,
  userRole
}) => {
  const [step, setStep] = useState<'search' | 'select' | 'register' | 'confirm'>('search');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ClientSearchResult[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientSearchResult | null>(null);
  const [availableShelters, setAvailableShelters] = useState<ShelterFacility[]>([]);
  const [selectedShelter, setSelectedShelter] = useState<ShelterFacility | null>(shelter || null);
  const [loading, setLoading] = useState(false);
  
  // Registration form data
  const [registrationForm, setRegistrationForm] = useState<{
    bedType: 'standard' | 'accessible' | 'family' | 'isolation';
    bedNumber: string;
    checkInDate: string;
    expectedCheckOutDate: string;
    specialNeeds: string[];
    medicalNotes: string;
    behavioralNotes: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    emergencyContactRelationship: string;
    consentGiven: boolean;
    documentsRequested: boolean;
  }>({
    bedType: 'standard',
    bedNumber: '',
    checkInDate: selectedDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
    expectedCheckOutDate: '',
    specialNeeds: [],
    medicalNotes: '',
    behavioralNotes: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    consentGiven: false,
    documentsRequested: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      loadAvailableShelters();
      if (selectedDate) {
        setRegistrationForm(prev => ({
          ...prev,
          checkInDate: selectedDate.toISOString().split('T')[0]
        }));
      }
    }
  }, [isOpen, selectedDate]);

  const loadAvailableShelters = async () => {
    try {
      const shelters = await shelterDataService.getAllShelters({
        availabilityOnly: true
      });
      setAvailableShelters(shelters);
    } catch (error) {
      console.error('Failed to load available shelters:', error);
    }
  };

  const handleClientSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    try {
      // Search for clients in Solid Pod storage
      const clients = await solidPodService.getPersonsByRole('client');
      
      // Filter and map results
      const results = clients
        .filter((client: PersonRegistrationData) => 
          client.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.phone.includes(searchTerm) ||
          client.email.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .map((client: PersonRegistrationData) => ({
          id: client.id || 'unknown',
          firstName: client.firstName,
          lastName: client.lastName,
          dateOfBirth: client.dateOfBirth,
          phone: client.phone,
          lastSeen: undefined,
          hasActiveRegistration: false, // TODO: Check against active registrations
          preferredBedType: client.preferredBedType,
          medicalNotes: client.medicalNotes,
          behavioralNotes: client.behavioralNotes
        }));

      setSearchResults(results);
      
      if (results.length === 0) {
        setErrors({ search: 'No clients found matching your search criteria.' });
      } else {
        setErrors({});
      }
    } catch (error) {
      console.error('Failed to search clients:', error);
      setErrors({ search: 'Failed to search clients. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleClientSelect = (client: ClientSearchResult) => {
    setSelectedClient(client);
    
    // Pre-populate form with client preferences
    setRegistrationForm(prev => ({
      ...prev,
      bedType: (client.preferredBedType as any) || 'standard',
      medicalNotes: client.medicalNotes || '',
      behavioralNotes: client.behavioralNotes || ''
    }));
    
    setStep('select');
  };

  const handleShelterSelect = (shelter: ShelterFacility) => {
    setSelectedShelter(shelter);
    setStep('register');
  };

  const validateRegistrationForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!registrationForm.checkInDate) {
      newErrors.checkInDate = 'Check-in date is required';
    }
    
    if (!registrationForm.consentGiven) {
      newErrors.consent = 'Client consent is required for bed registration';
    }
    
    // Check if check-in date is in the past (allow today)
    const checkInDate = new Date(registrationForm.checkInDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (checkInDate < today) {
      newErrors.checkInDate = 'Check-in date cannot be in the past';
    }
    
    // Validate expected check-out date if provided
    if (registrationForm.expectedCheckOutDate) {
      const checkOutDate = new Date(registrationForm.expectedCheckOutDate);
      if (checkOutDate <= checkInDate) {
        newErrors.expectedCheckOutDate = 'Check-out date must be after check-in date';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegistrationSubmit = async () => {
    if (!selectedClient || !selectedShelter || !validateRegistrationForm()) {
      return;
    }

    setLoading(true);
    try {
      // Generate bed registration
      const registration: BedRegistration = {
        id: `bed_reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        clientId: selectedClient.id,
        clientName: `${selectedClient.firstName} ${selectedClient.lastName}`,
        shelterId: selectedShelter.id,
        shelterName: selectedShelter.name,
        bedNumber: registrationForm.bedNumber || 'TBD',
        bedType: registrationForm.bedType,
        checkInDate: new Date(registrationForm.checkInDate),
        expectedCheckOutDate: registrationForm.expectedCheckOutDate 
          ? new Date(registrationForm.expectedCheckOutDate) 
          : undefined,
        registrationDate: new Date(),
        registeredBy: userRole, // In real app, use actual user ID
        status: 'active',
        specialNeeds: registrationForm.specialNeeds,
        medicalNotes: registrationForm.medicalNotes,
        behavioralNotes: registrationForm.behavioralNotes,
        emergencyContact: registrationForm.emergencyContactName ? {
          name: registrationForm.emergencyContactName,
          phone: registrationForm.emergencyContactPhone,
          relationship: registrationForm.emergencyContactRelationship
        } : undefined
      };

      // Store registration in Solid Pod
      await solidPodService.storePersonData({
        ...selectedClient,
        id: selectedClient.id,
        firstName: selectedClient.firstName,
        lastName: selectedClient.lastName,
        email: '',
        phone: selectedClient.phone,
        dateOfBirth: selectedClient.dateOfBirth,
        address: { street: '', city: '', state: '', zipCode: '' },
        emergencyContact: { name: '', relationship: '', phone: '' },
        role: 'client',
        consentGiven: true,
        consentDate: new Date().toISOString(),
        privacyAgreement: true,
        dataRetentionPeriod: 2555
      });

      // Update shelter utilization
      await shelterDataService.updateShelterUtilization(selectedShelter.id, {
        occupied: selectedShelter.currentUtilization.occupied + 1,
        available: selectedShelter.currentUtilization.available - 1
      });

      // Store bed registration
      localStorage.setItem(`bed_registration_${registration.id}`, JSON.stringify(registration));
      
      console.log('✅ Bed registration completed:', registration);
      onRegistrationComplete(registration);
      setStep('confirm');
      
    } catch (error) {
      console.error('Failed to complete bed registration:', error);
      setErrors({ submit: 'Failed to complete registration. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const renderSearchStep = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Search for Client</h3>
      
      <div className="flex space-x-2">
        <input
          type="text"
          placeholder="Search by name, phone, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleClientSearch()}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={handleClientSearch}
          disabled={loading || !searchTerm.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <span className="mr-2">🔍</span>
          )}
          Search
        </button>
      </div>
      
      {errors.search && (
        <div className="text-red-600 text-sm">{errors.search}</div>
      )}
      
      {searchResults.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {searchResults.map(client => (
            <div
              key={client.id}
              onClick={() => handleClientSelect(client)}
              className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">
                    {client.firstName} {client.lastName}
                  </div>
                  <div className="text-sm text-gray-600">
                    DOB: {new Date(client.dateOfBirth).toLocaleDateString()} • Phone: {client.phone}
                  </div>
                  {client.preferredBedType && (
                    <div className="text-xs text-blue-600">
                      Preferred: {client.preferredBedType} bed
                    </div>
                  )}
                </div>
                <div className="text-right text-xs">
                  {client.hasActiveRegistration && (
                    <div className="text-yellow-600 mb-1">Active Registration</div>
                  )}
                  <button className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                    Select
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSelectStep = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Select Shelter</h3>
        <button
          onClick={() => setStep('search')}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          ← Back to Client Search
        </button>
      </div>
      
      {selectedClient && (
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="font-medium">Selected Client:</div>
          <div>{selectedClient.firstName} {selectedClient.lastName}</div>
          <div className="text-sm text-gray-600">DOB: {new Date(selectedClient.dateOfBirth).toLocaleDateString()}</div>
        </div>
      )}
      
      {selectedShelter ? (
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="font-medium">Pre-selected Shelter:</div>
          <div>{selectedShelter.name}</div>
          <div className="text-sm text-gray-600">
            Available Beds: {selectedShelter.currentUtilization.available}
          </div>
          <button
            onClick={() => handleShelterSelect(selectedShelter)}
            className="mt-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Continue with {selectedShelter.name}
          </button>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {availableShelters.map(shelter => (
            <div
              key={shelter.id}
              onClick={() => handleShelterSelect(shelter)}
              className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{shelter.name}</div>
                  <div className="text-sm text-gray-600">
                    {shelter.address.street}, {shelter.address.city}
                  </div>
                  <div className="text-sm">
                    Available: {shelter.currentUtilization.available} beds
                    <span className="ml-2 text-gray-500">
                      ({Math.round((1 - shelter.currentUtilization.utilizationRate) * 100)}% free)
                    </span>
                  </div>
                </div>
                <button className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                  Select
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderRegistrationStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Bed Registration Details</h3>
        <button
          onClick={() => setStep('select')}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          ← Back to Shelter Selection
        </button>
      </div>
      
      {/* Client and Shelter Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="font-medium text-blue-800">Client</div>
          <div>{selectedClient?.firstName} {selectedClient?.lastName}</div>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="font-medium text-green-800">Shelter</div>
          <div>{selectedShelter?.name}</div>
        </div>
      </div>
      
      {/* Registration Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Check-in Date *
          </label>
          <input
            type="date"
            value={registrationForm.checkInDate}
            onChange={(e) => setRegistrationForm(prev => ({ ...prev, checkInDate: e.target.value }))}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
              errors.checkInDate ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.checkInDate && <div className="text-red-600 text-xs mt-1">{errors.checkInDate}</div>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expected Check-out Date
          </label>
          <input
            type="date"
            value={registrationForm.expectedCheckOutDate}
            onChange={(e) => setRegistrationForm(prev => ({ ...prev, expectedCheckOutDate: e.target.value }))}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
              errors.expectedCheckOutDate ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.expectedCheckOutDate && <div className="text-red-600 text-xs mt-1">{errors.expectedCheckOutDate}</div>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bed Type *
          </label>
          <select
            value={registrationForm.bedType}
            onChange={(e) => setRegistrationForm(prev => ({ ...prev, bedType: e.target.value as any }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="standard">Standard</option>
            <option value="accessible">Accessible</option>
            <option value="family">Family</option>
            <option value="isolation">Isolation</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bed Number (if known)
          </label>
          <input
            type="text"
            value={registrationForm.bedNumber}
            onChange={(e) => setRegistrationForm(prev => ({ ...prev, bedNumber: e.target.value }))}
            placeholder="e.g., A-12, B-05"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      {/* Medical and Behavioral Notes */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Medical Notes
          </label>
          <textarea
            value={registrationForm.medicalNotes}
            onChange={(e) => setRegistrationForm(prev => ({ ...prev, medicalNotes: e.target.value }))}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder="Any medical conditions, medications, or special needs..."
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Behavioral Notes
          </label>
          <textarea
            value={registrationForm.behavioralNotes}
            onChange={(e) => setRegistrationForm(prev => ({ ...prev, behavioralNotes: e.target.value }))}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder="Any behavioral considerations or special requirements..."
          />
        </div>
      </div>
      
      {/* Emergency Contact */}
      <div className="border-t pt-4">
        <h4 className="font-medium mb-3">Emergency Contact (Optional)</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Contact Name"
            value={registrationForm.emergencyContactName}
            onChange={(e) => setRegistrationForm(prev => ({ ...prev, emergencyContactName: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="tel"
            placeholder="Phone Number"
            value={registrationForm.emergencyContactPhone}
            onChange={(e) => setRegistrationForm(prev => ({ ...prev, emergencyContactPhone: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Relationship"
            value={registrationForm.emergencyContactRelationship}
            onChange={(e) => setRegistrationForm(prev => ({ ...prev, emergencyContactRelationship: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      {/* Consent */}
      <div className="border-t pt-4">
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={registrationForm.consentGiven}
              onChange={(e) => setRegistrationForm(prev => ({ ...prev, consentGiven: e.target.checked }))}
              className="mr-3"
            />
            <span className="text-sm">
              I have client consent for this bed registration and data collection *
            </span>
          </label>
          {errors.consent && <div className="text-red-600 text-xs">{errors.consent}</div>}
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={registrationForm.documentsRequested}
              onChange={(e) => setRegistrationForm(prev => ({ ...prev, documentsRequested: e.target.checked }))}
              className="mr-3"
            />
            <span className="text-sm">
              Request access to client documents via Solid Pod
            </span>
          </label>
        </div>
      </div>
      
      {errors.submit && (
        <div className="text-red-600 text-sm">{errors.submit}</div>
      )}
    </div>
  );

  const renderConfirmStep = () => (
    <div className="text-center space-y-4">
      <div className="text-4xl mb-4">✅</div>
      <h3 className="text-lg font-semibold text-green-800">
        Bed Registration Completed Successfully!
      </h3>
      <div className="bg-green-50 p-4 rounded-lg text-left">
        <div className="font-medium">Registration Details:</div>
        <div className="mt-2 space-y-1 text-sm">
          <div><strong>Client:</strong> {selectedClient?.firstName} {selectedClient?.lastName}</div>
          <div><strong>Shelter:</strong> {selectedShelter?.name}</div>
          <div><strong>Check-in:</strong> {new Date(registrationForm.checkInDate).toLocaleDateString()}</div>
          <div><strong>Bed Type:</strong> {registrationForm.bedType}</div>
          {registrationForm.bedNumber && (
            <div><strong>Bed Number:</strong> {registrationForm.bedNumber}</div>
          )}
        </div>
      </div>
      <button
        onClick={onClose}
        className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
      >
        Close
      </button>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              Client Bed Registration
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>
          
          {/* Progress Steps */}
          <div className="mt-4 flex items-center justify-center space-x-2">
            {['search', 'select', 'register', 'confirm'].map((stepName, index) => (
              <div
                key={stepName}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  step === stepName
                    ? 'bg-blue-600 text-white'
                    : ['search', 'select', 'register', 'confirm'].indexOf(step) > index
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {index + 1}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6">
          {step === 'search' && renderSearchStep()}
          {step === 'select' && renderSelectStep()}
          {step === 'register' && renderRegistrationStep()}
          {step === 'confirm' && renderConfirmStep()}
          
          {step === 'register' && (
            <div className="flex justify-between mt-6 pt-6 border-t">
              <button
                onClick={() => setStep('select')}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleRegistrationSubmit}
                disabled={loading || !registrationForm.consentGiven}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Registering...
                  </>
                ) : (
                  'Complete Registration'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};