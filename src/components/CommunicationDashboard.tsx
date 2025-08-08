import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  VoiceCall, 
  TextMessage, 
  CommunicationStats, 
  VoicemailMessage,
  EmergencyAlert,
  Contact 
} from '../types/Communication';
import { googleVoiceService } from '../services/googleVoiceService';

interface CommunicationDashboardProps {
  staffId?: string;
  clientId?: string;
  isStaffView?: boolean;
}

const CommunicationDashboard: React.FC<CommunicationDashboardProps> = ({
  staffId,
  clientId,
  isStaffView = true
}) => {
  const [activeTab, setActiveTab] = useState<'calls' | 'messages' | 'voicemail' | 'emergency'>('calls');
  const [isServiceReady, setIsServiceReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CommunicationStats | null>(null);
  const [recentCalls, setRecentCalls] = useState<VoiceCall[]>([]);
  const [recentMessages, setRecentMessages] = useState<TextMessage[]>([]);
  const [voicemails, setVoicemails] = useState<VoicemailMessage[]>([]);
  
  // Call/Message form states
  const [showCallForm, setShowCallForm] = useState(false);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [showEmergencyForm, setShowEmergencyForm] = useState(false);
  const [callNumber, setCallNumber] = useState('');
  const [messageNumber, setMessageNumber] = useState('');
  const [messageText, setMessageText] = useState('');

  useEffect(() => {
    initializeService();
    loadCommunicationData();
  }, []);

  const initializeService = async () => {
    setLoading(true);
    try {
      const initialized = await googleVoiceService.initialize();
      setIsServiceReady(initialized);
    } catch (error) {
      console.error('Failed to initialize Google Voice service:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCommunicationData = async () => {
    try {
      const [statsData, callsData, messagesData, voicemailData] = await Promise.all([
        googleVoiceService.getCommunicationStats(),
        googleVoiceService.getRecentCalls(20),
        googleVoiceService.getRecentMessages(30),
        googleVoiceService.getVoicemails()
      ]);

      setStats(statsData);
      setRecentCalls(callsData);
      setRecentMessages(messagesData);
      setVoicemails(voicemailData);
    } catch (error) {
      console.error('Failed to load communication data:', error);
    }
  };

  const handleMakeCall = async () => {
    if (!callNumber.trim()) return;
    
    try {
      setLoading(true);
      const call = await googleVoiceService.makeCall(
        callNumber,
        'general',
        staffId,
        clientId
      );
      
      // Add to recent calls
      setRecentCalls(prev => [call, ...prev]);
      setCallNumber('');
      setShowCallForm(false);
      
      window.alert(`📞 Call initiated to ${callNumber}`);
    } catch (error) {
      console.error('Failed to make call:', error);
      window.alert('Failed to make call. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageNumber.trim() || !messageText.trim()) return;
    
    try {
      setLoading(true);
      const message = await googleVoiceService.sendMessage(
        messageNumber,
        messageText,
        'general',
        staffId,
        clientId
      );
      
      // Add to recent messages
      setRecentMessages(prev => [message, ...prev]);
      setMessageNumber('');
      setMessageText('');
      setShowMessageForm(false);
      
      window.alert(`💬 Message sent to ${messageNumber}`);
    } catch (error) {
      console.error('Failed to send message:', error);
      window.alert('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyAlert = async () => {
    try {
      setLoading(true);
      
      // Mock emergency contacts
      const emergencyContacts: Contact[] = [
        {
          id: '1',
          name: 'Emergency Services',
          phoneNumber: '+12085559911',
          type: 'emergency',
          isBlocked: false,
          isPrimary: true,
          createdAt: new Date()
        },
        {
          id: '2', 
          name: 'Shelter Supervisor',
          phoneNumber: '+12085551111',
          type: 'staff',
          isBlocked: false,
          isPrimary: true,
          createdAt: new Date()
        }
      ];

      const emergencyAlert = await googleVoiceService.sendEmergencyAlert({
        type: 'both',
        message: 'Emergency situation at Idaho Community Shelter requires immediate response',
        recipients: emergencyContacts,
        priority: 'critical',
        triggeredBy: staffId || 'system',
        reason: 'Manual emergency alert triggered from dashboard',
        location: 'Idaho Community Shelter',
        relatedClientId: clientId
      });

      setShowEmergencyForm(false);
      window.alert(`🚨 Emergency alert sent to ${emergencyContacts.length} contacts`);
    } catch (error) {
      console.error('Failed to send emergency alert:', error);
      window.alert('Failed to send emergency alert. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCallStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'in-progress': return 'text-blue-600';
      case 'failed': case 'no-answer': case 'busy': return 'text-red-600';
      case 'ringing': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getMessageStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'text-green-600';
      case 'sent': return 'text-blue-600';
      case 'failed': return 'text-red-600';
      case 'sending': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return '🚨';
      case 'high': return '⚠️';
      case 'normal': return '📞';
      case 'low': return '📝';
      default: return '📞';
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading communication dashboard...</span>
      </div>
    );
  }

  if (!isServiceReady) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">📵</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Communication Service Unavailable</h3>
          <p className="text-gray-600 mb-4">Google Voice integration is currently offline</p>
          <button
            onClick={initializeService}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <span className="text-blue-500 text-2xl mr-3">📞</span>
              <div>
                <div className="text-2xl font-bold text-blue-800">{stats.today.totalCalls}</div>
                <div className="text-sm text-blue-600">Total Calls Today</div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <span className="text-green-500 text-2xl mr-3">💬</span>
              <div>
                <div className="text-2xl font-bold text-green-800">{stats.today.totalMessages}</div>
                <div className="text-sm text-green-600">Messages Today</div>
              </div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <span className="text-red-500 text-2xl mr-3">🚨</span>
              <div>
                <div className="text-2xl font-bold text-red-800">{stats.today.emergencyCalls}</div>
                <div className="text-sm text-red-600">Emergency Calls</div>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center">
              <span className="text-orange-500 text-2xl mr-3">📋</span>
              <div>
                <div className="text-2xl font-bold text-orange-800">{voicemails.filter(v => !v.isListened).length}</div>
                <div className="text-sm text-orange-600">New Voicemails</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {isStaffView && (
        <div className="bg-white rounded-lg shadow-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowCallForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <span>📞</span>
              <span>Make Call</span>
            </button>

            <button
              onClick={() => setShowMessageForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span>💬</span>
              <span>Send Message</span>
            </button>

            <button
              onClick={() => setShowEmergencyForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <span>🚨</span>
              <span>Emergency Alert</span>
            </button>

            <button
              onClick={loadCommunicationData}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              <span>{loading ? '🔄' : '🔄'}</span>
              <span>Refresh</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6 py-3">
            {[
              { id: 'calls', label: 'Recent Calls', icon: '📞', count: recentCalls.length },
              { id: 'messages', label: 'Messages', icon: '💬', count: recentMessages.filter(m => !m.isRead).length },
              { id: 'voicemail', label: 'Voicemail', icon: '🔊', count: voicemails.filter(v => !v.isListened).length },
              { id: 'emergency', label: 'Emergency', icon: '🚨', count: 0 }
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
                {tab.count > 0 && (
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Recent Calls Tab */}
          {activeTab === 'calls' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Recent Calls</h3>
              {recentCalls.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No recent calls</p>
              ) : (
                <div className="space-y-3">
                  {recentCalls.map(call => (
                    <div key={call.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">
                          {call.direction === 'inbound' ? '📞' : '📱'}
                        </div>
                        <div>
                          <div className="font-medium">
                            {call.direction === 'inbound' ? call.fromNumber : call.toNumber}
                          </div>
                          <div className="text-sm text-gray-500">
                            {format(call.startTime, 'MMM d, h:mm a')} • {call.callType}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${getCallStatusColor(call.status)}`}>
                          {call.status}
                        </div>
                        {call.duration && (
                          <div className="text-xs text-gray-500">
                            {Math.floor(call.duration / 60)}:{(call.duration % 60).toString().padStart(2, '0')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Messages Tab */}
          {activeTab === 'messages' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Recent Messages</h3>
              {recentMessages.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No recent messages</p>
              ) : (
                <div className="space-y-3">
                  {recentMessages.map(message => (
                    <div 
                      key={message.id} 
                      className={`p-3 border rounded-lg hover:bg-gray-50 ${!message.isRead ? 'bg-blue-50 border-blue-200' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="text-xl">
                            {message.direction === 'inbound' ? '💬' : '📤'}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <div className="font-medium">
                                {message.direction === 'inbound' ? message.fromNumber : message.toNumber}
                              </div>
                              {!message.isRead && (
                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                              )}
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                message.priority === 'urgent' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {message.messageType}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mt-1">{message.body}</p>
                            <div className="text-xs text-gray-500 mt-1">
                              {format(message.timestamp, 'MMM d, h:mm a')}
                            </div>
                          </div>
                        </div>
                        <div className={`text-sm ${getMessageStatusColor(message.status)}`}>
                          {message.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Voicemail Tab */}
          {activeTab === 'voicemail' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Voicemail Messages</h3>
              {voicemails.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No voicemail messages</p>
              ) : (
                <div className="space-y-3">
                  {voicemails.map(voicemail => (
                    <div 
                      key={voicemail.id} 
                      className={`p-3 border rounded-lg hover:bg-gray-50 ${!voicemail.isListened ? 'bg-orange-50 border-orange-200' : ''}`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="text-xl">🔊</div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <div className="font-medium">{voicemail.fromNumber}</div>
                            {!voicemail.isListened && (
                              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                            )}
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              voicemail.priority === 'urgent' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {voicemail.category}
                            </span>
                          </div>
                          {voicemail.transcription && (
                            <p className="text-sm text-gray-700 mb-2 italic">"{voicemail.transcription}"</p>
                          )}
                          <div className="flex items-center space-x-4">
                            <div className="text-xs text-gray-500">
                              {format(voicemail.timestamp, 'MMM d, h:mm a')}
                            </div>
                            <div className="text-xs text-gray-500">
                              Duration: {Math.floor(voicemail.duration / 60)}:{(voicemail.duration % 60).toString().padStart(2, '0')}
                            </div>
                            <button className="text-xs text-blue-600 hover:text-blue-800">
                              ▶️ Play
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Emergency Tab */}
          {activeTab === 'emergency' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Emergency Communication</h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-800 mb-2">🚨 Emergency Alert System</h4>
                <p className="text-sm text-red-700 mb-4">
                  Use this system to quickly notify emergency contacts and staff of urgent situations.
                </p>
                <div className="space-y-2 text-sm text-red-700">
                  <div>• Emergency Services: Available 24/7</div>
                  <div>• Shelter Supervisor: On-call during business hours</div>
                  <div>• Medical Response: Coordinated with local health services</div>
                  <div>• Staff Notification: All active staff members</div>
                </div>
                {isStaffView && (
                  <button
                    onClick={() => setShowEmergencyForm(true)}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    🚨 Trigger Emergency Alert
                  </button>
                )}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">⚠️ Business Hours Status</h4>
                <p className="text-sm text-yellow-700">
                  {googleVoiceService.isBusinessHours() 
                    ? '✅ Currently within business hours - Full staff available'
                    : '🌙 Outside business hours - Emergency response only'
                  }
                </p>
                <div className="text-xs text-yellow-600 mt-2">
                  Business Hours: Monday-Friday 8:00 AM - 6:00 PM (Mountain Time)
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Call Form Modal */}
      {showCallForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Make Phone Call</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={callNumber}
                  onChange={(e) => setCallNumber(e.target.value)}
                  placeholder="+1 (208) 555-0123"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCallForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMakeCall}
                  disabled={!callNumber.trim() || loading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  📞 Call
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message Form Modal */}
      {showMessageForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Send Text Message</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={messageNumber}
                  onChange={(e) => setMessageNumber(e.target.value)}
                  placeholder="+1 (208) 555-0123"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Enter your message..."
                  rows={3}
                  maxLength={160}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="text-xs text-gray-500 mt-1">
                  {messageText.length}/160 characters
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowMessageForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!messageNumber.trim() || !messageText.trim() || loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  💬 Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Alert Modal */}
      {showEmergencyForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-red-900 mb-4">🚨 Emergency Alert</h3>
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">
                  This will immediately notify emergency services and shelter supervisors of an urgent situation.
                </p>
              </div>
              <p className="text-sm text-gray-700">
                Are you sure you want to trigger an emergency alert?
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowEmergencyForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEmergencyAlert}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  🚨 Send Alert
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunicationDashboard;