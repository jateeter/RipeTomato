/**
 * CORS Error Handler Component
 * 
 * Displays user-friendly error messages for CORS-related issues
 * and provides troubleshooting guidance for HMIS system access.
 * 
 * @license MIT
 */

import React, { useState, useEffect } from 'react';
import { useResponsive } from '../hooks/useResponsive';
import { getCardClasses, getButtonClasses } from '../utils/responsive';

export interface CORSErrorInfo {
  isCORSError: boolean;
  errorMessage: string;
  statusCode?: number;
  endpoint?: string;
  suggestedAction?: string;
}

interface CORSErrorHandlerProps {
  error: CORSErrorInfo | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  showTroubleshooting?: boolean;
}

export const CORSErrorHandler: React.FC<CORSErrorHandlerProps> = ({
  error,
  onRetry,
  onDismiss,
  showTroubleshooting = true
}) => {
  const { isMobile } = useResponsive();
  const [showDetails, setShowDetails] = useState(false);
  const [connectivityStatus, setConnectivityStatus] = useState<any>(null);

  useEffect(() => {
    if (error?.isCORSError) {
      checkConnectivity();
    }
  }, [error]);

  const checkConnectivity = async () => {
    try {
      const { testCORSConnectivity } = await import('../config/corsConfig');
      const status = await testCORSConnectivity();
      setConnectivityStatus(status);
    } catch (err) {
      console.error('Failed to test connectivity:', err);
    }
  };

  if (!error) {
    return null;
  }

  const getErrorSeverity = (): 'error' | 'warning' | 'info' => {
    if (error.isCORSError) return 'error';
    if (error.statusCode && error.statusCode >= 500) return 'error';
    if (error.statusCode && error.statusCode >= 400) return 'warning';
    return 'info';
  };

  const getErrorIcon = () => {
    const severity = getErrorSeverity();
    switch (severity) {
      case 'error': return '🚫';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  const getErrorTitle = () => {
    if (error.isCORSError) {
      return 'HMIS System Access Blocked';
    }
    if (error.statusCode) {
      return `HTTP ${error.statusCode} Error`;
    }
    return 'Connection Error';
  };

  const getErrorDescription = () => {
    if (error.isCORSError) {
      return 'The browser has blocked access to the HMIS system due to security restrictions (CORS policy).';
    }
    return error.errorMessage;
  };

  const getSuggestedActions = (): string[] => {
    const actions: string[] = [];

    if (error.isCORSError) {
      actions.push('Try refreshing the page');
      actions.push('Check if you\'re using the latest version of the application');
      actions.push('Contact your system administrator if the problem persists');
      
      if (connectivityStatus?.usingProxy) {
        actions.push('The system is using a development proxy - this is normal in development mode');
      }
    } else if (error.statusCode) {
      if (error.statusCode >= 500) {
        actions.push('The HMIS server is temporarily unavailable');
        actions.push('Try again in a few minutes');
        actions.push('Contact support if the issue continues');
      } else if (error.statusCode >= 400) {
        actions.push('Check your network connection');
        actions.push('Verify the HMIS system URL is correct');
        actions.push('Contact your administrator for access permissions');
      }
    } else {
      actions.push('Check your internet connection');
      actions.push('Try refreshing the page');
      actions.push('Contact support if the problem continues');
    }

    return actions;
  };

  return (
    <div className={getCardClasses()}>
      <div className="flex items-start space-x-3">
        <span className="text-2xl flex-shrink-0">{getErrorIcon()}</span>
        
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-2">
            {getErrorTitle()}
          </h3>
          
          <p className="text-gray-700 mb-4">
            {getErrorDescription()}
          </p>

          {/* Connectivity Status */}
          {connectivityStatus && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-sm text-gray-900 mb-2">System Status</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>HMIS Accessible:</span>
                  <span className={connectivityStatus.hmisAccessible ? 'text-green-600' : 'text-red-600'}>
                    {connectivityStatus.hmisAccessible ? '✅ Yes' : '❌ No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>CORS Enabled:</span>
                  <span className={connectivityStatus.corsEnabled ? 'text-green-600' : 'text-red-600'}>
                    {connectivityStatus.corsEnabled ? '✅ Yes' : '❌ No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Using Proxy:</span>
                  <span className={connectivityStatus.usingProxy ? 'text-blue-600' : 'text-gray-600'}>
                    {connectivityStatus.usingProxy ? '🔄 Yes' : '📡 Direct'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Suggested Actions */}
          <div className="mb-4">
            <h4 className="font-medium text-sm text-gray-900 mb-2">Suggested Actions:</h4>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              {getSuggestedActions().map((action, index) => (
                <li key={index}>{action}</li>
              ))}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'space-x-3'}`}>
            {onRetry && (
              <button
                onClick={onRetry}
                className={getButtonClasses('primary', 'sm')}
              >
                🔄 Retry Connection
              </button>
            )}
            
            {showTroubleshooting && (
              <button
                onClick={() => setShowDetails(!showDetails)}
                className={getButtonClasses('outline', 'sm')}
              >
                {showDetails ? '🔼 Hide' : '🔽 Show'} Technical Details
              </button>
            )}
            
            {onDismiss && (
              <button
                onClick={onDismiss}
                className={getButtonClasses('outline', 'sm')}
              >
                ✕ Dismiss
              </button>
            )}
          </div>

          {/* Technical Details */}
          {showDetails && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-sm text-gray-900 mb-2">Technical Details</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <div><strong>Error Message:</strong> {error.errorMessage}</div>
                {error.statusCode && (
                  <div><strong>Status Code:</strong> {error.statusCode}</div>
                )}
                {error.endpoint && (
                  <div><strong>Endpoint:</strong> {error.endpoint}</div>
                )}
                <div><strong>User Agent:</strong> {navigator.userAgent}</div>
                <div><strong>Timestamp:</strong> {new Date().toISOString()}</div>
                
                {connectivityStatus?.errors && connectivityStatus.errors.length > 0 && (
                  <div>
                    <strong>Additional Errors:</strong>
                    <ul className="list-disc list-inside ml-4 mt-1">
                      {connectivityStatus.errors.map((err: string, index: number) => (
                        <li key={index}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Development Mode Info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-sm text-blue-900 mb-2">Development Mode</h4>
              <p className="text-xs text-blue-700">
                This application is running in development mode. CORS issues may be resolved by:
              </p>
              <ul className="list-disc list-inside text-xs text-blue-700 mt-1 space-y-1">
                <li>Using the built-in CORS proxy (automatic)</li>
                <li>Starting the development server with <code>npm start</code></li>
                <li>Checking that the proxy configuration is working</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Hook for handling CORS errors in components
 */
export const useCORSErrorHandler = () => {
  const [corsError, setCorsError] = useState<CORSErrorInfo | null>(null);

  const handleError = (error: any, endpoint?: string) => {
    const corsErrorInfo: CORSErrorInfo = {
      isCORSError: error.isCORSError || 
                   error.message?.toLowerCase().includes('cors') ||
                   error.message?.toLowerCase().includes('cross-origin') ||
                   (error.response?.status === 0 && !error.response?.data),
      errorMessage: error.message || 'Unknown error occurred',
      statusCode: error.response?.status || error.statusCode,
      endpoint,
      suggestedAction: error.suggestedAction
    };

    setCorsError(corsErrorInfo);
  };

  const clearError = () => {
    setCorsError(null);
  };

  const retryOperation = async (operation: () => Promise<any>): Promise<any> => {
    try {
      clearError();
      return await operation();
    } catch (error) {
      handleError(error);
      throw error;
    }
  };

  return {
    corsError,
    handleError,
    clearError,
    retryOperation
  };
};