import React, { useState, useEffect } from 'react';
import { googleCalendarService } from '../services/googleCalendarService';

interface GoogleAuthProps {
  onAuthChange: (isSignedIn: boolean) => void;
}

const GoogleAuth: React.FC<GoogleAuthProps> = ({ onAuthChange }) => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const initialized = await googleCalendarService.initialize();
      if (initialized) {
        const signedIn = googleCalendarService.isUserSignedIn();
        setIsSignedIn(signedIn);
        onAuthChange(signedIn);
      } else {
        setError('Failed to initialize Google Calendar API. Please check your configuration.');
      }
    } catch (err) {
      setError('Failed to connect to Google Calendar. Please try again.');
      console.error('Auth initialization error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const success = await googleCalendarService.signIn();
      if (success) {
        setIsSignedIn(true);
        onAuthChange(true);
      } else {
        setError('Sign-in failed. Please try again.');
      }
    } catch (err) {
      setError('Sign-in failed. Please try again.');
      console.error('Sign-in error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      await googleCalendarService.signOut();
      setIsSignedIn(false);
      onAuthChange(false);
    } catch (err) {
      setError('Sign-out failed. Please try again.');
      console.error('Sign-out error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-blue-600">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-sm">Connecting to Google Calendar...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
        <div className="flex items-center space-x-2">
          <div className="text-red-500">⚠️</div>
          <div>
            <p className="text-sm text-red-800 font-medium">Google Calendar Error</p>
            <p className="text-xs text-red-600">{error}</p>
          </div>
        </div>
        <button
          onClick={initializeAuth}
          className="mt-2 text-xs text-red-700 hover:text-red-900 underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3">
      {isSignedIn ? (
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-green-800 font-medium">Connected to Google Calendar</span>
          </div>
          <button
            onClick={handleSignOut}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="text-sm text-yellow-800">Not connected to Google Calendar</span>
          </div>
          <button
            onClick={handleSignIn}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Connect Google Calendar</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default GoogleAuth;