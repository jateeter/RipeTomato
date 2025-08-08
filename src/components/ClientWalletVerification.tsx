/**
 * Client Wallet Verification Interface
 * 
 * Provides the client perspective for QR-based identity verification
 * using the unified data ownership model with multi-wallet support.
 * 
 * @license MIT
 */

import React, { useState, useEffect } from 'react';
import {
  ClientVerificationInterface,
  ClientWalletOption,
  QRVerificationCode,
  ClientVerificationStatus,
  VerificationInstruction,
  WalletCheckInSession
} from '../types/WalletVerification';
import { walletVerificationService } from '../services/walletVerificationService';
import QRCode from 'qrcode';

interface ClientWalletVerificationProps {
  ownerId: string;
  onVerificationComplete?: (session: WalletCheckInSession) => void;
}

export const ClientWalletVerification: React.FC<ClientWalletVerificationProps> = ({
  ownerId,
  onVerificationComplete
}) => {
  const [clientInterface, setClientInterface] = useState<ClientVerificationInterface | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<ClientWalletOption | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<WalletCheckInSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadClientInterface();
  }, [ownerId]);

  const loadClientInterface = async () => {
    try {
      setLoading(true);
      const interface_ = await walletVerificationService.getClientInterface(ownerId);
      setClientInterface(interface_);
      
      // Auto-select the first available wallet
      const availableWallet = interface_.availableWallets.find(w => w.isAvailable);
      if (availableWallet) {
        setSelectedWallet(availableWallet);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load verification interface');
    } finally {
      setLoading(false);
    }
  };

  const handleWalletSelection = (wallet: ClientWalletOption) => {
    setSelectedWallet(wallet);
    updateClientStatus('wallet_selection');
  };

  const generateQRCode = async () => {
    if (!selectedWallet) {
      setError('Please select a wallet first');
      return;
    }

    try {
      setLoading(true);
      updateClientStatus('generating_qr');

      // Generate QR verification code
      const qrVerificationCode = await walletVerificationService.generateQRCode(
        ownerId,
        'check_in_verification',
        {
          location: 'Idaho Community Shelter',
          expirationMinutes: 15,
          requiredVerifications: [
            {
              requirementType: 'identity_match',
              required: true,
              weight: 100,
              description: 'Verify identity matches selected wallet'
            }
          ]
        }
      );

      // Generate QR code image
      const qrDataString = JSON.stringify(qrVerificationCode.qrData);
      const qrImageUrl = await QRCode.toDataURL(qrDataString, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      setQrCode(qrImageUrl);
      updateClientStatus('ready_to_scan');
      
      console.log('🔗 QR code generated for client verification');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate QR code');
      updateClientStatus('wallet_selection');
    } finally {
      setLoading(false);
    }
  };

  const updateClientStatus = (status: ClientVerificationStatus) => {
    if (clientInterface) {
      setClientInterface({
        ...clientInterface,
        currentStatus: status
      });
    }
  };

  const checkVerificationStatus = async () => {
    // In a real implementation, this would poll the backend for status updates
    // For now, simulate verification progress
    if (currentSession) {
      try {
        const sessions = await walletVerificationService.getActiveSessions();
        const updatedSession = sessions.find(s => s.sessionId === currentSession.sessionId);
        
        if (updatedSession) {
          setCurrentSession(updatedSession);
          
          if (updatedSession.overallStatus === 'completed') {
            updateClientStatus('verification_complete');
            onVerificationComplete?.(updatedSession);
          } else if (updatedSession.overallStatus === 'failed') {
            updateClientStatus('verification_failed');
          }
        }
      } catch (err) {
        console.error('Failed to check verification status:', err);
      }
    }
  };

  // Poll for verification updates
  useEffect(() => {
    if (currentSession && clientInterface?.currentStatus === 'verification_in_progress') {
      const interval = setInterval(checkVerificationStatus, 2000);
      return () => clearInterval(interval);
    }
  }, [currentSession, clientInterface?.currentStatus]);

  const getStatusIcon = (status: ClientVerificationStatus): string => {
    switch (status) {
      case 'wallet_selection': return '📱';
      case 'generating_qr': return '🔗';
      case 'ready_to_scan': return '👁️';
      case 'verification_in_progress': return '🔍';
      case 'waiting_for_staff': return '⏳';
      case 'verification_complete': return '✅';
      case 'verification_failed': return '❌';
      case 'session_expired': return '⏰';
      default: return '📱';
    }
  };

  const getStatusMessage = (status: ClientVerificationStatus): string => {
    switch (status) {
      case 'wallet_selection': return 'Select your preferred wallet for verification';
      case 'generating_qr': return 'Generating your verification QR code...';
      case 'ready_to_scan': return 'Show this QR code to shelter staff';
      case 'verification_in_progress': return 'Verifying your identity...';
      case 'waiting_for_staff': return 'Waiting for staff to complete verification';
      case 'verification_complete': return 'Verification successful! Welcome to the shelter.';
      case 'verification_failed': return 'Verification failed. Please try again or see staff.';
      case 'session_expired': return 'Verification session expired. Please generate a new QR code.';
      default: return 'Preparing verification...';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-center">Loading verification interface...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-red-800 mb-2">Verification Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadClientInterface}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!clientInterface) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <p className="text-gray-600">Unable to load verification interface</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Identity Verification</h1>
          <p className="text-gray-600">
            Use your digital wallet to verify your identity for shelter access
          </p>
        </div>

        {/* Status Card */}
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg mb-6">
          <div className="p-6">
            <div className="text-center">
              <div className="text-6xl mb-4">{getStatusIcon(clientInterface.currentStatus)}</div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {getStatusMessage(clientInterface.currentStatus)}
              </h2>
              
              {clientInterface.currentStatus === 'verification_in_progress' && currentSession && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">Verification Progress</h3>
                  <div className="space-y-2">
                    {currentSession.verificationSteps.map((step, index) => (
                      <div key={step.stepId} className="flex items-center text-sm">
                        <div className={`w-4 h-4 rounded-full mr-3 ${
                          step.status === 'completed' ? 'bg-green-500' :
                          step.status === 'in_progress' ? 'bg-blue-500' :
                          step.status === 'failed' ? 'bg-red-500' :
                          'bg-gray-300'
                        }`}></div>
                        <span className={
                          step.status === 'completed' ? 'text-green-700' :
                          step.status === 'in_progress' ? 'text-blue-700' :
                          step.status === 'failed' ? 'text-red-700' :
                          'text-gray-500'
                        }>
                          {step.stepName}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Wallet Selection */}
        {clientInterface.currentStatus === 'wallet_selection' && (
          <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg mb-6">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Select Your Wallet</h3>
              <div className="space-y-3">
                {clientInterface.availableWallets.map((wallet) => (
                  <div
                    key={wallet.walletType}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedWallet?.walletType === wallet.walletType
                        ? 'border-blue-500 bg-blue-50'
                        : wallet.isAvailable
                        ? 'border-gray-200 hover:border-gray-300'
                        : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-50'
                    }`}
                    onClick={() => wallet.isAvailable && handleWalletSelection(wallet)}
                  >
                    <div className="flex items-center">
                      <div className="text-2xl mr-3">{wallet.icon}</div>
                      <div className="flex-1">
                        <div className="font-semibold">{wallet.walletName}</div>
                        <div className="text-sm text-gray-600">{wallet.description}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {wallet.verificationCapabilities.join(' • ')}
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs ${
                        wallet.credentialStatus === 'valid' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {wallet.credentialStatus}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {selectedWallet && (
                <button
                  onClick={generateQRCode}
                  className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Generate QR Code
                </button>
              )}
            </div>
          </div>
        )}

        {/* QR Code Display */}
        {qrCode && clientInterface.currentStatus === 'ready_to_scan' && (
          <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg mb-6">
            <div className="p-6 text-center">
              <h3 className="text-lg font-semibold mb-4">Your Verification QR Code</h3>
              <div className="bg-gray-50 p-6 rounded-lg mb-4">
                <img src={qrCode} alt="Verification QR Code" className="mx-auto" />
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Show this QR code to shelter staff for identity verification
              </p>
              <div className="flex items-center justify-center text-sm text-gray-500">
                <div className="animate-pulse flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Code expires in 15 minutes
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Verification Steps</h3>
            <div className="space-y-3">
              {clientInterface.verificationInstructions.map((instruction, index) => (
                <div key={index} className="flex items-start">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold mr-3 ${
                    instruction.isCompleted 
                      ? 'bg-green-100 text-green-800' 
                      : index === 0 || clientInterface.verificationInstructions[index - 1]?.isCompleted
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {instruction.isCompleted ? '✓' : instruction.stepNumber}
                  </div>
                  <div className="flex-1">
                    <div className={`font-medium ${
                      instruction.isCompleted ? 'text-green-800 line-through' : 'text-gray-800'
                    }`}>
                      {instruction.instruction}
                    </div>
                    <div className="text-sm text-gray-500">
                      ~{instruction.expectedDuration} seconds
                    </div>
                  </div>
                  {instruction.icon && (
                    <div className="text-xl ml-2">{instruction.icon}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="max-w-md mx-auto mt-6 text-center">
          <p className="text-sm text-gray-500">
            Need help with verification? Ask any staff member for assistance.
          </p>
        </div>
      </div>
    </div>
  );
};