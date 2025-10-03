/**
 * Bot Management Dashboard
 * 
 * Administrative interface for managing BotLab Core agent bots,
 * monitoring their status, and configuring bot settings.
 * 
 * @license MIT
 */

import React, { useState, useEffect } from 'react';
import { botManager, BotManagerStats } from '../services/botManager';
import { smsService } from '../services/smsService';
import { useResponsive } from '../hooks/useResponsive';
import { getCardClasses, getButtonClasses, getGridClasses } from '../utils/responsive';

interface BotStatusCard {
  botId: string;
  name: string;
  status: 'running' | 'stopped' | 'error' | 'starting' | 'stopping';
  uptime: string;
  messagesProcessed: number;
  errorCount: number;
  lastActivity?: Date;
}

export const BotManagementDashboard: React.FC = () => {
  const { isMobile, isTablet } = useResponsive();
  
  const [botStats, setBotStats] = useState<BotManagerStats>({
    totalBots: 0,
    activeBots: 0,
    inactiveBots: 0,
    errorBots: 0,
    uptimeHours: 0,
    totalEventsProcessed: 0
  });

  const [bots, setBots] = useState<BotStatusCard[]>([]);
  const [smsStats, setSmsStats] = useState({
    totalSent: 0,
    totalFailed: 0,
    queueSize: 0,
    optedInClients: 0
  });

  const [isLoading, setIsLoading] = useState(true);
  const [selectedBot, setSelectedBot] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load bot manager stats
      const managerStats = await botManager.getBotManagerStats();
      setBotStats(managerStats);

      // Load individual bot statuses
      const allBots = botManager.getAllBots();
      const botCards: BotStatusCard[] = allBots.map(({ registration, status, isRunning }) => ({
        botId: registration.botId,
        name: registration.botId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        status: isRunning ? (status?.status || 'running') : 'stopped',
        uptime: status ? calculateUptime(status.startTime) : '0m',
        messagesProcessed: status?.processedMessages || 0,
        errorCount: status?.errorCount || 0,
        lastActivity: status?.lastActivity
      }));
      setBots(botCards);

      // Load SMS service stats
      const smsServiceStats = await smsService.getMessageStats();
      setSmsStats(smsServiceStats);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateUptime = (startTime?: Date): string => {
    if (!startTime) return '0m';
    
    const now = new Date();
    const diffMs = now.getTime() - startTime.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    }
    return `${diffMinutes}m`;
  };

  const handleBotAction = async (botId: string, action: 'start' | 'stop' | 'restart') => {
    setActionMessage('');
    setSelectedBot(botId);
    
    try {
      switch (action) {
        case 'start':
          await botManager.startBot(botId);
          setActionMessage(`✅ Bot ${botId} started successfully`);
          break;
        case 'stop':
          await botManager.stopBot(botId);
          setActionMessage(`🛑 Bot ${botId} stopped successfully`);
          break;
        case 'restart':
          await botManager.restartBot(botId);
          setActionMessage(`🔄 Bot ${botId} restarted successfully`);
          break;
      }
      
      // Refresh data after action
      setTimeout(loadDashboardData, 1000);
      
    } catch (error) {
      console.error(`Failed to ${action} bot ${botId}:`, error);
      setActionMessage(`❌ Failed to ${action} bot ${botId}`);
    } finally {
      setSelectedBot(null);
    }
  };

  const handleStartAllBots = async () => {
    setActionMessage('🚀 Starting all bots...');
    try {
      await botManager.startAllBots();
      setActionMessage('✅ All bots start initiated');
      setTimeout(loadDashboardData, 2000);
    } catch (error) {
      setActionMessage('❌ Failed to start all bots');
    }
  };

  const handleStopAllBots = async () => {
    setActionMessage('🛑 Stopping all bots...');
    try {
      await botManager.stopAllBots();
      setActionMessage('✅ All bots stopped');
      setTimeout(loadDashboardData, 2000);
    } catch (error) {
      setActionMessage('❌ Failed to stop all bots');
    }
  };

  const testWakeupEvent = async () => {
    setActionMessage('🧪 Sending test wake-up event...');
    try {
      await botManager.publishWakeupEvent(
        'test_client_001',
        'A-12',
        'Test Facility',
        new Date(Date.now() + 30 * 60000) // 30 minutes from now
      );
      setActionMessage('✅ Test wake-up event sent');
    } catch (error) {
      setActionMessage('❌ Failed to send test event');
    }
  };

  if (isLoading) {
    return (
      <div className={getCardClasses()}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading bot dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className={`font-bold text-gray-900 ${isMobile ? 'text-xl' : 'text-2xl'}`}>
          🤖 Bot Management Dashboard
        </h1>
        <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'space-x-3'}`}>
          <button
            onClick={handleStartAllBots}
            className={getButtonClasses('primary', 'sm')}
          >
            🚀 Start All
          </button>
          <button
            onClick={handleStopAllBots}
            className={getButtonClasses('outline', 'sm')}
          >
            🛑 Stop All
          </button>
          <button
            onClick={testWakeupEvent}
            className={getButtonClasses('outline', 'sm')}
          >
            🧪 Test Event
          </button>
        </div>
      </div>

      {/* Action Message */}
      {actionMessage && (
        <div className={`p-4 rounded-lg ${
          actionMessage.includes('✅') ? 'bg-green-100 text-green-800' :
          actionMessage.includes('❌') ? 'bg-red-100 text-red-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {actionMessage}
        </div>
      )}

      {/* Stats Overview */}
      <div className={getGridClasses(2, 4, 4)}>
        <div className={getCardClasses()}>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <span className="text-2xl">🤖</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Bots</p>
              <p className="text-2xl font-bold text-gray-900">{botStats.totalBots}</p>
            </div>
          </div>
        </div>

        <div className={getCardClasses()}>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Bots</p>
              <p className="text-2xl font-bold text-green-600">{botStats.activeBots}</p>
            </div>
          </div>
        </div>

        <div className={getCardClasses()}>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Events Processed</p>
              <p className="text-2xl font-bold text-purple-600">{botStats.totalEventsProcessed}</p>
            </div>
          </div>
        </div>

        <div className={getCardClasses()}>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100">
              <span className="text-2xl">⏱️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Uptime</p>
              <p className="text-2xl font-bold text-orange-600">{botStats.uptimeHours.toFixed(1)}h</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bot Status Cards */}
      <div className="space-y-4">
        <h2 className={`font-semibold text-gray-900 ${isMobile ? 'text-lg' : 'text-xl'}`}>
          Bot Status
        </h2>
        
        <div className={getGridClasses(1, 2, 3)}>
          {bots.map((bot) => (
            <div key={bot.botId} className={getCardClasses()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">{bot.name}</h3>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  bot.status === 'running' ? 'bg-green-100 text-green-800' :
                  bot.status === 'error' ? 'bg-red-100 text-red-800' :
                  bot.status === 'starting' || bot.status === 'stopping' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {bot.status === 'running' ? '🟢 Running' :
                   bot.status === 'error' ? '🔴 Error' :
                   bot.status === 'starting' ? '🟡 Starting' :
                   bot.status === 'stopping' ? '🟡 Stopping' :
                   '⚫ Stopped'}
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex justify-between">
                  <span>Uptime:</span>
                  <span className="font-medium">{bot.uptime}</span>
                </div>
                <div className="flex justify-between">
                  <span>Messages:</span>
                  <span className="font-medium">{bot.messagesProcessed}</span>
                </div>
                <div className="flex justify-between">
                  <span>Errors:</span>
                  <span className={`font-medium ${bot.errorCount > 0 ? 'text-red-600' : ''}`}>
                    {bot.errorCount}
                  </span>
                </div>
                {bot.lastActivity && (
                  <div className="flex justify-between">
                    <span>Last Activity:</span>
                    <span className="font-medium text-xs">
                      {bot.lastActivity.toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>

              <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'space-x-2'}`}>
                {bot.status === 'running' ? (
                  <>
                    <button
                      onClick={() => handleBotAction(bot.botId, 'stop')}
                      disabled={selectedBot === bot.botId}
                      className={`${getButtonClasses('outline', 'sm')} flex-1`}
                    >
                      {selectedBot === bot.botId ? '⏳' : '🛑'} Stop
                    </button>
                    <button
                      onClick={() => handleBotAction(bot.botId, 'restart')}
                      disabled={selectedBot === bot.botId}
                      className={`${getButtonClasses('outline', 'sm')} flex-1`}
                    >
                      {selectedBot === bot.botId ? '⏳' : '🔄'} Restart
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleBotAction(bot.botId, 'start')}
                    disabled={selectedBot === bot.botId}
                    className={`${getButtonClasses('primary', 'sm')} w-full`}
                  >
                    {selectedBot === bot.botId ? '⏳ Starting...' : '🚀 Start'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SMS Service Stats */}
      <div className={getCardClasses()}>
        <h2 className={`font-semibold text-gray-900 mb-4 ${isMobile ? 'text-lg' : 'text-xl'}`}>
          📱 SMS Service Statistics
        </h2>
        
        <div className={getGridClasses(2, 4, 4)}>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{smsStats.totalSent}</p>
            <p className="text-sm text-gray-600">Messages Sent</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{smsStats.totalFailed}</p>
            <p className="text-sm text-gray-600">Failed Messages</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{smsStats.queueSize}</p>
            <p className="text-sm text-gray-600">Queued Messages</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{smsStats.optedInClients}</p>
            <p className="text-sm text-gray-600">Opted-In Clients</p>
          </div>
        </div>

        {/* SMS Provider Status */}
        {smsStats && 'providers' in smsStats && (smsStats as any).providers && (smsStats as any).providers.length > 0 && (
          <div className="mt-6">
            <h3 className="font-medium text-gray-900 mb-3">SMS Provider Status</h3>
            <div className={getGridClasses(1, 2, 3)}>
              {(smsStats as any).providers.map((provider: any) => (
                <div key={provider.providerName} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">
                      {provider.providerName === 'Twilio' ? '📞' : '📨'} {provider.providerName}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      provider.isHealthy ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {provider.isHealthy ? 'Healthy' : 'Error'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>Sent: {provider.totalSent}</div>
                    <div>Failed: {provider.totalFailed}</div>
                    <div>Success: {provider.successRate.toFixed(1)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Refresh Info */}
      <div className="text-center text-sm text-gray-500">
        Dashboard automatically refreshes every 30 seconds
      </div>
    </div>
  );
};