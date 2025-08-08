import React from 'react';

interface SyncState {
  isLoading: boolean;
  error: string | null;
  lastSyncTime: Date | null;
  syncedEventsCount: number;
}

interface SyncStatusProps {
  syncState: SyncState;
  isGoogleSignedIn: boolean;
  onSync: () => void;
}

const SyncStatus: React.FC<SyncStatusProps> = ({ syncState, isGoogleSignedIn, onSync }) => {
  const { isLoading, error, lastSyncTime, syncedEventsCount } = syncState;

  const formatLastSyncTime = (date: Date | null) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  if (!isGoogleSignedIn) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <div className="flex items-center space-x-2">
          <div className="text-gray-400">📅</div>
          <span className="text-sm text-gray-600">Sign in to Google Calendar to sync events</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-blue-600 font-medium">Syncing...</span>
              </>
            ) : error ? (
              <>
                <div className="text-red-500">⚠️</div>
                <span className="text-sm text-red-600 font-medium">Sync Error</span>
              </>
            ) : (
              <>
                <div className="text-green-500">✅</div>
                <span className="text-sm text-green-600 font-medium">Sync Ready</span>
              </>
            )}
          </div>
          
          <div className="text-sm text-gray-500">
            Last sync: {formatLastSyncTime(lastSyncTime)}
          </div>
          
          {syncedEventsCount > 0 && (
            <div className="text-sm text-blue-600">
              {syncedEventsCount} events synced
            </div>
          )}
        </div>

        <button
          onClick={onSync}
          disabled={isLoading}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            isLoading
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isLoading ? 'Syncing...' : 'Sync Now'}
        </button>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {lastSyncTime && syncedEventsCount === 0 && !error && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            No events found in your Google Calendar for the current week. 
            Local events will be displayed.
          </p>
        </div>
      )}
    </div>
  );
};

export default SyncStatus;