/**
 * Shelter Registration Modal
 * 
 * Modal component for registering new shelter facilities with MediaWiki integration
 * and comprehensive data validation for HMIS OpenCommons synchronization.
 * 
 * @license MIT
 */

import React, { useState } from 'react';
import { ShelterRegistrationData, mediaWikiService } from '../services/mediaWikiService';

interface ShelterRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (shelter: ShelterRegistrationData) => void;
}

export const ShelterRegistrationModal: React.FC<ShelterRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState<ShelterRegistrationData>({
    id: '',
    name: '',
    description: '',
    address: {
      street: '',
      city: '',
      state: 'ID',
      zipCode: '',
      coordinates: {
        lat: 0,
        lng: 0
      }
    },
    capacity: {
      totalBeds: 0,
      availableBeds: 0,
      emergencyBeds: 0
    },
    services: [],
    contact: {
      phone: '',
      email: '',
      website: ''
    },
    operatingHours: {
      checkinTime: '',
      checkoutTime: '',
      officeHours: ''
    },
    accessibility: {
      wheelchairAccessible: false,
      ada_compliant: false,
      features: []
    },
    restrictions: {
      ageGroups: [],
      demographics: [],
      requirements: []
    },
    registrationDate: '',
    lastUpdated: '',
    status: 'active'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [newRequirement, setNewRequirement] = useState('');

  const availableServices = [
    'Overnight Shelter',
    'Meals',
    'Case Management',
    'Mental Health Services',
    'Job Training',
    'Laundry Facilities',
    'Mail Services',
    'Transportation',
    'Medical Services',
    'Childcare',
    'Pet Accommodations',
    'Storage'
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Shelter name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.address.street.trim()) newErrors.street = 'Street address is required';
    if (!formData.address.city.trim()) newErrors.city = 'City is required';
    if (!formData.address.zipCode.trim()) newErrors.zipCode = 'ZIP code is required';
    if (formData.capacity.totalBeds <= 0) newErrors.totalBeds = 'Total beds must be greater than 0';
    if (formData.capacity.availableBeds < 0) newErrors.availableBeds = 'Available beds cannot be negative';
    if (formData.capacity.emergencyBeds < 0) newErrors.emergencyBeds = 'Emergency beds cannot be negative';
    if (!formData.contact.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.contact.email.trim()) newErrors.email = 'Email is required';
    if (!formData.operatingHours.checkinTime) newErrors.checkinTime = 'Check-in time is required';
    if (!formData.operatingHours.checkoutTime) newErrors.checkoutTime = 'Check-out time is required';
    if (!formData.operatingHours.officeHours.trim()) newErrors.officeHours = 'Office hours are required';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.contact.email && !emailRegex.test(formData.contact.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate unique ID and set timestamps
      const shelterData: ShelterRegistrationData = {
        ...formData,
        id: `shelter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        registrationDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };

      // Register shelter with MediaWiki
      const result = await mediaWikiService.registerShelter(shelterData);

      if (result.success) {
        console.log('✅ Shelter registered successfully:', shelterData);
        setShowSuccess(true);
        setTimeout(() => {
          onSuccess(shelterData);
          onClose();
        }, 2000);
      } else {
        throw new Error(result.error || 'Registration failed');
      }

    } catch (error) {
      console.error('Failed to register shelter:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to register shelter');
      setShowError(true);
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

  const handleServiceToggle = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  const handleAgeGroupToggle = (ageGroup: string) => {
    setFormData(prev => ({
      ...prev,
      restrictions: {
        ...prev.restrictions!,
        ageGroups: prev.restrictions!.ageGroups!.includes(ageGroup)
          ? prev.restrictions!.ageGroups!.filter(g => g !== ageGroup)
          : [...(prev.restrictions!.ageGroups || []), ageGroup]
      }
    }));
  };

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setFormData(prev => ({
        ...prev,
        restrictions: {
          ...prev.restrictions!,
          requirements: [...(prev.restrictions!.requirements || []), newRequirement.trim()]
        }
      }));
      setNewRequirement('');
    }
  };

  const removeRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      restrictions: {
        ...prev.restrictions!,
        requirements: prev.restrictions!.requirements!.filter((_, i) => i !== index)
      }
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Register New Shelter</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Success Notification */}
          {showSuccess && (
            <div data-testid="success-notification" className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex">
                <div className="text-green-600">✅</div>
                <div className="ml-2 text-sm text-green-700">
                  Shelter registered successfully! Syncing to HMIS OpenCommons...
                </div>
              </div>
              <div data-testid="mediawiki-integration-status" className="mt-2 text-sm text-green-600">
                Successfully synced to HMIS OpenCommons - {formData.name}
              </div>
            </div>
          )}

          {/* Error Notification */}
          {showError && (
            <div data-testid="error-notification" className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <div className="text-red-600">❌</div>
                <div className="ml-2 text-sm text-red-700">{errorMessage}</div>
                <button 
                  onClick={() => setShowError(false)}
                  className="ml-auto text-red-600 hover:text-red-800"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Form Validation Status */}
          <div data-testid="form-validation-status" className="mt-2 text-sm">
            {Object.keys(errors).length === 0 && formData.name && formData.address.street && formData.capacity.totalBeds > 0 ? (
              <span className="text-green-600">All required fields completed</span>
            ) : (
              <span className="text-gray-500">Please complete all required fields</span>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Basic Information */}
          <section className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shelter Name *
              </label>
              <input
                type="text"
                data-testid="shelter-name-input"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter shelter name"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                data-testid="shelter-description-textarea"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                rows={3}
                placeholder="Describe the shelter's mission and services"
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            </div>
          </section>

          {/* Address Information */}
          <section className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Address</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Address *
              </label>
              <input
                type="text"
                data-testid="shelter-street-input"
                value={formData.address.street}
                onChange={(e) => handleInputChange('address.street', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.street ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.street && <p className="text-red-500 text-xs mt-1">{errors.street}</p>}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  data-testid="shelter-city-input"
                  value={formData.address.city}
                  onChange={(e) => handleInputChange('address.city', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.city ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <select
                  data-testid="shelter-state-select"
                  value={formData.address.state}
                  onChange={(e) => handleInputChange('address.state', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ID">Idaho</option>
                  <option value="WA">Washington</option>
                  <option value="OR">Oregon</option>
                  <option value="MT">Montana</option>
                  <option value="UT">Utah</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  data-testid="shelter-zipcode-input"
                  value={formData.address.zipCode}
                  onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.zipCode ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.zipCode && <p className="text-red-500 text-xs mt-1">{errors.zipCode}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  data-testid="shelter-latitude-input"
                  value={formData.address.coordinates?.lat || ''}
                  onChange={(e) => handleInputChange('address.coordinates.lat', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="43.6135"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  data-testid="shelter-longitude-input"
                  value={formData.address.coordinates?.lng || ''}
                  onChange={(e) => handleInputChange('address.coordinates.lng', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="-116.2023"
                />
              </div>
            </div>
          </section>

          {/* Capacity */}
          <section className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Capacity</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Beds *
                </label>
                <input
                  type="number"
                  data-testid="total-beds-input"
                  value={formData.capacity.totalBeds}
                  onChange={(e) => handleInputChange('capacity.totalBeds', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.totalBeds ? 'border-red-500' : 'border-gray-300'
                  }`}
                  min="1"
                />
                {errors.totalBeds && <p className="text-red-500 text-xs mt-1">{errors.totalBeds}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Available Beds
                </label>
                <input
                  type="number"
                  data-testid="available-beds-input"
                  value={formData.capacity.availableBeds}
                  onChange={(e) => handleInputChange('capacity.availableBeds', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.availableBeds ? 'border-red-500' : 'border-gray-300'
                  }`}
                  min="0"
                />
                {errors.availableBeds && <p className="text-red-500 text-xs mt-1">{errors.availableBeds}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Emergency Beds
                </label>
                <input
                  type="number"
                  data-testid="emergency-beds-input"
                  value={formData.capacity.emergencyBeds}
                  onChange={(e) => handleInputChange('capacity.emergencyBeds', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.emergencyBeds ? 'border-red-500' : 'border-gray-300'
                  }`}
                  min="0"
                />
                {errors.emergencyBeds && <p className="text-red-500 text-xs mt-1">{errors.emergencyBeds}</p>}
              </div>
            </div>
          </section>

          {/* Services */}
          <section className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Services Provided</h3>
            
            <div className="grid grid-cols-3 gap-2">
              {availableServices.map(service => (
                <label key={service} className="flex items-center">
                  <input
                    type="checkbox"
                    data-testid={`service-checkbox-${service.toLowerCase().replace(/\s+/g, '-')}`}
                    checked={formData.services.includes(service)}
                    onChange={() => handleServiceToggle(service)}
                    className="mr-2"
                  />
                  <span className="text-sm">{service}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Contact Information */}
          <section className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  data-testid="shelter-phone-input"
                  value={formData.contact.phone}
                  onChange={(e) => handleInputChange('contact.phone', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  data-testid="shelter-email-input"
                  value={formData.contact.email}
                  onChange={(e) => handleInputChange('contact.email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  data-testid="shelter-website-input"
                  value={formData.contact.website || ''}
                  onChange={(e) => handleInputChange('contact.website', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.org"
                />
              </div>
            </div>
          </section>

          {/* Operating Hours */}
          <section className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Operating Hours</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Check-in Time *
                </label>
                <input
                  type="time"
                  data-testid="checkin-time-input"
                  value={formData.operatingHours.checkinTime}
                  onChange={(e) => handleInputChange('operatingHours.checkinTime', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.checkinTime ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.checkinTime && <p className="text-red-500 text-xs mt-1">{errors.checkinTime}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Check-out Time *
                </label>
                <input
                  type="time"
                  data-testid="checkout-time-input"
                  value={formData.operatingHours.checkoutTime}
                  onChange={(e) => handleInputChange('operatingHours.checkoutTime', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.checkoutTime ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.checkoutTime && <p className="text-red-500 text-xs mt-1">{errors.checkoutTime}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Office Hours *
                </label>
                <input
                  type="text"
                  data-testid="office-hours-input"
                  value={formData.operatingHours.officeHours}
                  onChange={(e) => handleInputChange('operatingHours.officeHours', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.officeHours ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="9:00 AM - 5:00 PM, Monday-Friday"
                />
                {errors.officeHours && <p className="text-red-500 text-xs mt-1">{errors.officeHours}</p>}
              </div>
            </div>
          </section>

          {/* Accessibility */}
          <section className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Accessibility</h3>
            
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  data-testid="wheelchair-accessible-checkbox"
                  checked={formData.accessibility.wheelchairAccessible}
                  onChange={(e) => handleInputChange('accessibility.wheelchairAccessible', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Wheelchair Accessible</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  data-testid="ada-compliant-checkbox"
                  checked={formData.accessibility.ada_compliant}
                  onChange={(e) => handleInputChange('accessibility.ada_compliant', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">ADA Compliant</span>
              </label>
            </div>
          </section>

          {/* Restrictions and Requirements */}
          <section className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Restrictions and Requirements</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age Groups Served
                </label>
                <div className="space-y-2">
                  {['Adults', 'Families with children', 'Youth (18-24)', 'Seniors (55+)', 'Children only'].map(group => (
                    <label key={group} className="flex items-center">
                      <input
                        type="checkbox"
                        data-testid={`age-group-${group.toLowerCase().replace(/\s+/g, '-')}`}
                        checked={formData.restrictions?.ageGroups?.includes(group) || false}
                        onChange={() => handleAgeGroupToggle(group)}
                        className="mr-2"
                      />
                      <span className="text-sm">{group}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Requirements
                </label>
                <div className="space-y-2">
                  {formData.restrictions?.requirements?.map((requirement, index) => (
                    <div key={index} className="flex items-center">
                      <input
                        type="text"
                        data-testid={`requirement-input-${index}`}
                        value={requirement}
                        readOnly
                        className="flex-1 px-3 py-1 border border-gray-300 rounded-md bg-gray-50"
                      />
                      <button
                        type="button"
                        onClick={() => removeRequirement(index)}
                        className="ml-2 px-2 py-1 text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={newRequirement}
                      onChange={(e) => setNewRequirement(e.target.value)}
                      className="flex-1 px-3 py-1 border border-gray-300 rounded-md"
                      placeholder="Add a requirement..."
                    />
                    <button
                      type="button"
                      data-testid="add-requirement-button"
                      onClick={addRequirement}
                      className="ml-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Processing Indicator */}
          {isSubmitting && (
            <div data-testid="registration-processing" className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Processing registration...</p>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="submit-shelter-registration"
              disabled={isSubmitting || Object.keys(errors).length > 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Registering...
                </>
              ) : (
                'Register Shelter'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};