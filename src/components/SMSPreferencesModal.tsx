/**
 * SMS Preferences Modal
 * 
 * Allows clients to configure their SMS notification preferences including
 * wake-up notifications, reminders, opt-in/opt-out settings, and quiet hours.
 * 
 * @license MIT
 */

import React, { useState, useEffect } from 'react';
import { smsService, ClientSMSPreferences } from '../services/smsService';
import { useResponsive } from '../hooks/useResponsive';
import { getCardClasses, getButtonClasses } from '../utils/responsive';

interface SMSPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName?: string;
  initialPhone?: string;
}

export const SMSPreferencesModal: React.FC<SMSPreferencesModalProps> = ({
  isOpen,
  onClose,
  clientId,
  clientName = 'Client',
  initialPhone = ''
}) => {
  const { isMobile, isTablet } = useResponsive();
  
  const [preferences, setPreferences] = useState<ClientSMSPreferences>({
    clientId,
    phoneNumber: initialPhone,
    optedIn: false,
    wakeupEnabled: true,
    reminderEnabled: true,
    alertEnabled: true,
    timezone: 'America/Los_Angeles',
    lastUpdated: new Date()
  });

  const [phoneInput, setPhoneInput] = useState(initialPhone);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietStart, setQuietStart] = useState('22:00');
  const [quietEnd, setQuietEnd] = useState('07:00');
  const [isLoading, setIsLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (isOpen && clientId) {
      loadClientPreferences();
    }
  }, [isOpen, clientId]);

  const loadClientPreferences = async () => {
    setIsLoading(true);
    try {
      const existingPrefs = smsService.getClientPreferences(clientId);
      if (existingPrefs) {
        setPreferences(existingPrefs);
        setPhoneInput(existingPrefs.phoneNumber);
        
        if (existingPrefs.quietHours) {
          setQuietHoursEnabled(true);
          setQuietStart(existingPrefs.quietHours.start);
          setQuietEnd(existingPrefs.quietHours.end);
        }
      }
    } catch (error) {
      console.error('Failed to load SMS preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setIsLoading(true);
    setSaveMessage('');

    try {
      // Validate phone number
      const cleanPhone = phoneInput.replace(/\D/g, '');
      if (preferences.optedIn && cleanPhone.length !== 10) {
        setSaveMessage('Please enter a valid 10-digit phone number');
        setIsLoading(false);
        return;
      }

      const updatedPrefs: ClientSMSPreferences = {
        ...preferences,
        phoneNumber: cleanPhone,
        quietHours: quietHoursEnabled ? {
          start: quietStart,
          end: quietEnd
        } : undefined
      };

      await smsService.setClientPreferences(updatedPrefs);
      setSaveMessage('SMS preferences saved successfully!');
      
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('Failed to save SMS preferences:', error);
      setSaveMessage('Failed to save preferences. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptIn = async () => {
    const cleanPhone = phoneInput.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setSaveMessage('Please enter a valid 10-digit phone number to opt in');
      return;
    }

    try {
      await smsService.optInClient(clientId, cleanPhone);
      setPreferences(prev => ({ ...prev, optedIn: true, phoneNumber: cleanPhone }));
      setSaveMessage('Successfully opted in for SMS notifications!');
    } catch (error) {
      console.error('Failed to opt in:', error);
      setSaveMessage('Failed to opt in. Please try again.');
    }
  };

  const handleOptOut = async () => {
    try {
      await smsService.optOutClient(clientId);
      setPreferences(prev => ({ 
        ...prev, 
        optedIn: false,
        wakeupEnabled: false,
        reminderEnabled: false,
        alertEnabled: false
      }));
      setSaveMessage('Successfully opted out of SMS notifications.');
    } catch (error) {
      console.error('Failed to opt out:', error);
      setSaveMessage('Failed to opt out. Please try again.');
    }
  };

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return value;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white rounded-lg shadow-xl ${
        isMobile 
          ? 'w-full h-full p-4 overflow-y-auto' 
          : isTablet 
            ? 'max-w-md w-full mx-4 p-6' 
            : 'max-w-lg w-full mx-4 p-8'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className={`font-bold text-gray-900 ${
            isMobile ? 'text-lg' : 'text-xl'
          }`}>
            📱 SMS Preferences
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            disabled={isLoading}
          >
            ×
          </button>
        </div>

        {/* Client Info */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900">Client: {clientName}</h3>
          <p className="text-sm text-blue-700">ID: {clientId}</p>
        </div>

        {/* Phone Number */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            value={formatPhoneNumber(phoneInput)}
            onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="(555) 123-4567"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Required for SMS notifications
          </p>
        </div>

        {/* Opt In/Out Status */}
        <div className="mb-6 p-4 border rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">SMS Notifications</h3>
              <p className="text-sm text-gray-600">
                {preferences.optedIn ? 'You are opted in' : 'You are not receiving SMS notifications'}
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              preferences.optedIn 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {preferences.optedIn ? 'Opted In' : 'Opted Out'}
            </div>
          </div>
          
          <div className="mt-4 flex space-x-3">
            {!preferences.optedIn ? (
              <button
                onClick={handleOptIn}
                disabled={isLoading}
                className={getButtonClasses('primary', 'sm')}
              >
                Opt In
              </button>
            ) : (
              <button
                onClick={handleOptOut}
                disabled={isLoading}
                className={getButtonClasses('outline', 'sm')}
              >
                Opt Out
              </button>
            )}
          </div>
        </div>

        {/* Notification Types */}
        {preferences.optedIn && (
          <div className="mb-6 space-y-4">
            <h3 className="font-medium text-gray-900">Notification Types</h3>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={preferences.wakeupEnabled}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  wakeupEnabled: e.target.checked
                }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={isLoading}
              />
              <span className="ml-3 text-sm text-gray-700">
                🌅 Wake-up notifications (bed checkout reminders)
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={preferences.reminderEnabled}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  reminderEnabled: e.target.checked
                }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={isLoading}
              />
              <span className="ml-3 text-sm text-gray-700">
                ⏰ Service reminders (meals, appointments)
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={preferences.alertEnabled}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  alertEnabled: e.target.checked
                }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={isLoading}
              />
              <span className="ml-3 text-sm text-gray-700">
                🚨 Important alerts and updates
              </span>
            </label>
          </div>
        )}

        {/* Quiet Hours */}
        {preferences.optedIn && (
          <div className="mb-6">
            <label className="flex items-center mb-3">
              <input
                type="checkbox"
                checked={quietHoursEnabled}
                onChange={(e) => setQuietHoursEnabled(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={isLoading}
              />
              <span className="ml-3 text-sm text-gray-700">
                🔇 Enable quiet hours (no non-urgent notifications)
              </span>
            </label>

            {quietHoursEnabled && (
              <div className="ml-6 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={quietStart}
                    onChange={(e) => setQuietStart(e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={quietEnd}
                    onChange={(e) => setQuietEnd(e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Save Message */}
        {saveMessage && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            saveMessage.includes('successfully') || saveMessage.includes('Successfully')
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {saveMessage}
          </div>
        )}

        {/* Actions */}
        <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'justify-end space-x-3'}`}>
          <button
            onClick={onClose}
            disabled={isLoading}
            className={getButtonClasses('outline', 'md')}
          >
            Cancel
          </button>
          <button
            onClick={handleSavePreferences}
            disabled={isLoading}
            className={getButtonClasses('primary', 'md')}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : (
              'Save Preferences'
            )}
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">
            💡 <strong>About SMS notifications:</strong> We use text messages to send important reminders about bed checkout times, meal services, and other community services. You can opt out at any time by replying "STOP" to any message.
          </p>
        </div>
      </div>
    </div>
  );
};