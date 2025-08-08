import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { EmergencyAlert, Contact, VoiceCall, TextMessage } from '../types/Communication';
import { googleVoiceService } from '../services/googleVoiceService';

interface EmergencyCommCenterProps {
  onClose?: () => void;
}

const EmergencyCommCenter: React.FC<EmergencyCommCenterProps> = ({ onClose }) => {
  const [activeEmergencies, setActiveEmergencies] = useState<EmergencyAlert[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [alertType, setAlertType] = useState<'voice' | 'sms' | 'both'>('both');
  const [emergencyMessage, setEmergencyMessage] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);

  useEffect(() => {
    loadEmergencyContacts();
    loadActiveEmergencies();
  }, []);

  const loadEmergencyContacts = () => {
    // Mock emergency contacts
    const mockContacts: Contact[] = [
      {
        id: '1',
        name: '911 Emergency Services',
        phoneNumber: '+1911',
        type: 'emergency',
        relationship: 'Emergency Services',
        isBlocked: false,
        isPrimary: true,
        createdAt: new Date()
      },
      {
        id: '2',
        name: 'Shelter Supervisor - Sarah Johnson',
        phoneNumber: '+12085551111',
        type: 'staff',
        relationship: 'Supervisor',
        isBlocked: false,
        isPrimary: true,
        createdAt: new Date()
      },
      {
        id: '3',
        name: 'Medical Response Team',
        phoneNumber: '+12085552222',
        type: 'emergency',
        relationship: 'Medical',
        isBlocked: false,
        isPrimary: true,
        createdAt: new Date()
      },
      {
        id: '4',
        name: 'Security Team',
        phoneNumber: '+12085553333',
        type: 'staff',
        relationship: 'Security',
        isBlocked: false,
        isPrimary: false,
        createdAt: new Date()
      },
      {
        id: '5',
        name: 'Mental Health Crisis Line',
        phoneNumber: '+12085554444',
        type: 'emergency',
        relationship: 'Mental Health',
        isBlocked: false,
        isPrimary: false,
        createdAt: new Date()
      },
      {
        id: '6',
        name: 'Downtown Police Station',
        phoneNumber: '+12085555555',
        type: 'emergency',
        relationship: 'Police',
        isBlocked: false,
        isPrimary: false,
        createdAt: new Date()
      }
    ];

    setEmergencyContacts(mockContacts);
    setSelectedContacts(mockContacts.filter(c => c.isPrimary).map(c => c.id));
  };

  const loadActiveEmergencies = () => {
    // Mock active emergencies
    const mockEmergencies: EmergencyAlert[] = [
      {
        id: '1',
        type: 'both',
        message: 'Medical emergency in Room A - Client needs immediate assistance',
        recipients: [],
        priority: 'critical',
        status: 'sent',
        triggeredBy: 'staff-001',
        triggeredAt: new Date(Date.now() - 900000), // 15 minutes ago
        reason: 'Medical emergency',
        location: 'Room A - Bed A03',
        relatedClientId: 'client-123',
        callResults: { contacted: 6, answered: 4, failed: 2 },
        messageResults: { sent: 6, delivered: 5, failed: 1 }
      }
    ];

    setActiveEmergencies(mockEmergencies);
  };

  const handleSendEmergencyAlert = async () => {
    if (!emergencyMessage.trim() || selectedContacts.length === 0) {
      window.alert('Please enter a message and select at least one contact.');
      return;
    }

    setIsLoading(true);
    try {
      const selectedContactList = emergencyContacts.filter(c => selectedContacts.includes(c.id));
      
      const emergencyAlert = await googleVoiceService.sendEmergencyAlert({
        type: alertType,
        message: emergencyMessage,
        recipients: selectedContactList,
        priority: 'critical',
        triggeredBy: 'current-staff',
        reason: 'Manual emergency alert from communication center',
        location: 'Idaho Community Shelter'
      });

      setActiveEmergencies(prev => [emergencyAlert, ...prev]);
      setEmergencyMessage('');
      
      window.alert(`🚨 Emergency alert sent to ${selectedContactList.length} contacts`);
    } catch (error) {
      console.error('Failed to send emergency alert:', error);
      window.alert('Failed to send emergency alert. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickEmergencyCall = async (contactId: string) => {
    const contact = emergencyContacts.find(c => c.id === contactId);
    if (!contact) return;

    setIsLoading(true);
    try {
      await googleVoiceService.makeCall(
        contact.phoneNumber,
        'emergency',
        'current-staff'
      );
      window.alert(`📞 Emergency call initiated to ${contact.name}`);
    } catch (error) {
      console.error('Failed to make emergency call:', error);
      window.alert('Failed to make emergency call. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'text-green-600 bg-green-100';
      case 'sending': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-800 bg-red-100 border-red-300';
      case 'high': return 'text-orange-800 bg-orange-100 border-orange-300';
      default: return 'text-gray-800 bg-gray-100 border-gray-300';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-red-600 text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🚨</span>
            <h2 className="text-xl font-bold">Emergency Communication Center</h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl"
            >
              ×
            </button>
          )}
        </div>

        <div className="p-6 space-y-6">
          {/* Active Emergencies */}
          {activeEmergencies.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 mb-3">🚨 Active Emergency Alerts</h3>
              <div className="space-y-3">
                {activeEmergencies.map(emergency => (
                  <div key={emergency.id} className="bg-white border border-red-300 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(emergency.priority)}`}>
                            {emergency.priority.toUpperCase()}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(emergency.status)}`}>
                            {emergency.status}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 mb-1">{emergency.message}</p>
                        <div className="text-xs text-gray-600 space-y-1">
                          <div>📍 Location: {emergency.location}</div>
                          <div>🕐 Triggered: {format(emergency.triggeredAt, 'MMM d, h:mm a')}</div>
                          <div>👤 By: {emergency.triggeredBy}</div>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <div className="text-xs text-gray-600 space-y-1">
                          {emergency.callResults && (
                            <div>📞 Calls: {emergency.callResults.answered}/{emergency.callResults.contacted}</div>
                          )}
                          {emergency.messageResults && (
                            <div>💬 Messages: {emergency.messageResults.delivered}/{emergency.messageResults.sent}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Emergency Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => handleQuickEmergencyCall('1')}
              disabled={isLoading}
              className="flex items-center justify-center space-x-2 p-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              <span className="text-2xl">🚨</span>
              <div className="text-left">
                <div className="font-semibold">Call 911</div>
                <div className="text-xs opacity-90">Emergency Services</div>
              </div>
            </button>

            <button
              onClick={() => handleQuickEmergencyCall('3')}
              disabled={isLoading}
              className="flex items-center justify-center space-x-2 p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <span className="text-2xl">🏥</span>
              <div className="text-left">
                <div className="font-semibold">Medical Response</div>
                <div className="text-xs opacity-90">Health Emergency</div>
              </div>
            </button>

            <button
              onClick={() => handleQuickEmergencyCall('2')}
              disabled={isLoading}
              className="flex items-center justify-center space-x-2 p-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
            >
              <span className="text-2xl">👩‍💼</span>
              <div className="text-left">
                <div className="font-semibold">Call Supervisor</div>
                <div className="text-xs opacity-90">Staff Emergency</div>
              </div>
            </button>
          </div>

          {/* Emergency Alert Form */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Send Emergency Alert</h3>
            
            <div className="space-y-4">
              {/* Alert Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Alert Type</label>
                <div className="flex space-x-4">
                  {[
                    { value: 'voice', label: '📞 Voice Call', desc: 'Phone calls only' },
                    { value: 'sms', label: '💬 Text Message', desc: 'SMS messages only' },
                    { value: 'both', label: '📞💬 Both', desc: 'Calls and messages' }
                  ].map(option => (
                    <label key={option.value} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="alertType"
                        value={option.value}
                        checked={alertType === option.value}
                        onChange={(e) => setAlertType(e.target.value as any)}
                        className="text-blue-600"
                      />
                      <div>
                        <div className="text-sm font-medium">{option.label}</div>
                        <div className="text-xs text-gray-500">{option.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Emergency Message
                </label>
                <textarea
                  value={emergencyMessage}
                  onChange={(e) => setEmergencyMessage(e.target.value)}
                  placeholder="Describe the emergency situation..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                />
              </div>

              {/* Contact Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emergency Contacts ({selectedContacts.length} selected)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {emergencyContacts.map(contact => (
                    <label key={contact.id} className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={selectedContacts.includes(contact.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedContacts(prev => [...prev, contact.id]);
                          } else {
                            setSelectedContacts(prev => prev.filter(id => id !== contact.id));
                          }
                        }}
                        className="text-red-600"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{contact.name}</div>
                        <div className="text-xs text-gray-500">
                          {contact.phoneNumber} • {contact.relationship}
                        </div>
                      </div>
                      {contact.isPrimary && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          Primary
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Send Button */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setSelectedContacts(emergencyContacts.filter(c => c.isPrimary).map(c => c.id));
                  }}
                  className="px-4 py-2 text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50"
                >
                  Select Primary Only
                </button>
                <button
                  onClick={() => {
                    setSelectedContacts(emergencyContacts.map(c => c.id));
                  }}
                  className="px-4 py-2 text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50"
                >
                  Select All
                </button>
                <button
                  onClick={handleSendEmergencyAlert}
                  disabled={isLoading || !emergencyMessage.trim() || selectedContacts.length === 0}
                  className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? '🚨 Sending...' : '🚨 Send Emergency Alert'}
                </button>
              </div>
            </div>
          </div>

          {/* Emergency Protocols */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Emergency Protocols</h4>
            <div className="text-sm text-yellow-700 space-y-1">
              <div><strong>Medical Emergency:</strong> Call 911 first, then notify supervisor and medical team</div>
              <div><strong>Security Threat:</strong> Alert security team and supervisor, consider police if needed</div>
              <div><strong>Fire/Evacuation:</strong> Activate building alarm, call 911, notify all staff</div>
              <div><strong>Mental Health Crisis:</strong> Contact mental health crisis line and supervisor</div>
              <div><strong>After Hours:</strong> All emergency contacts are available 24/7</div>
            </div>
          </div>

          {/* Response Time Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">⏱️ Expected Response Times</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
              <div>
                <div><strong>911 Emergency:</strong> 3-8 minutes</div>
                <div><strong>Medical Response:</strong> 5-12 minutes</div>
              </div>
              <div>
                <div><strong>Shelter Supervisor:</strong> Immediate</div>
                <div><strong>Security Team:</strong> 2-5 minutes</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyCommCenter;