import { useState, useEffect, useCallback } from 'react';
import { solidAuthService } from '../services/solidAuthService';
import { solidDataService, SolidClientData } from '../services/solidDataService';
import { Client, BedReservation, CheckInSession } from '../types/Shelter';
import { ISessionInfo } from '@inrupt/solid-client-authn-browser';

interface SolidDataState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  sessionInfo: ISessionInfo | null;
  clients: SolidClientData[];
}

export const useSolidData = () => {
  const [state, setState] = useState<SolidDataState>({
    isAuthenticated: false,
    isLoading: true,
    error: null,
    sessionInfo: null,
    clients: []
  });

  // Initialize Solid authentication
  useEffect(() => {
    const initializeSolid = async () => {
      try {
        const sessionInfo = await solidAuthService.initialize();
        setState(prev => ({
          ...prev,
          isAuthenticated: sessionInfo.isLoggedIn,
          sessionInfo,
          isLoading: false
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to initialize Solid',
          isLoading: false
        }));
      }
    };

    initializeSolid();

    // Listen for session updates
    const handleSessionUpdate = (sessionInfo: ISessionInfo) => {
      setState(prev => ({
        ...prev,
        isAuthenticated: sessionInfo.isLoggedIn,
        sessionInfo,
        error: null
      }));
    };

    solidAuthService.onSessionUpdate(handleSessionUpdate);

    return () => {
      // Cleanup would go here if supported by the library
    };
  }, []);

  // Login to Solid pod
  const login = useCallback(async (provider?: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      await solidAuthService.login(provider);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Login failed',
        isLoading: false
      }));
    }
  }, []);

  // Logout from Solid pod
  const logout = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      await solidAuthService.logout();
      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        sessionInfo: null,
        clients: [],
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Logout failed',
        isLoading: false
      }));
    }
  }, []);

  // Save client data to pod
  const saveClient = useCallback(async (client: Client, consent: boolean = true): Promise<boolean> => {
    if (!state.isAuthenticated) {
      setState(prev => ({ ...prev, error: 'Must be authenticated to save data' }));
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await solidDataService.saveClientToPod(client, consent);
      if (result) {
        // Refresh client data
        await loadClientData(client.id);
        return true;
      }
      return false;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to save client data',
        isLoading: false
      }));
      return false;
    }
  }, [state.isAuthenticated]);

  // Load client data from pod
  const loadClientData = useCallback(async (clientId: string, podUrl?: string): Promise<SolidClientData | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const clientData = await solidDataService.getClientFromPod(clientId, podUrl);
      
      if (clientData) {
        setState(prev => ({
          ...prev,
          clients: prev.clients.some(c => c.firstName === clientData.firstName && c.lastName === clientData.lastName)
            ? prev.clients.map(c => c.firstName === clientData.firstName && c.lastName === clientData.lastName ? clientData : c)
            : [...prev.clients, clientData],
          isLoading: false
        }));
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
      
      return clientData;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load client data',
        isLoading: false
      }));
      return null;
    }
  }, []);

  // Save reservation data to pod
  const saveReservation = useCallback(async (reservation: BedReservation, clientPodUrl: string): Promise<boolean> => {
    if (!state.isAuthenticated) {
      setState(prev => ({ ...prev, error: 'Must be authenticated to save data' }));
      return false;
    }

    try {
      const result = await solidDataService.saveReservationToPod(reservation, clientPodUrl);
      return !!result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to save reservation data'
      }));
      return false;
    }
  }, [state.isAuthenticated]);

  // Save check-in session to pod
  const saveCheckInSession = useCallback(async (session: CheckInSession, clientPodUrl: string): Promise<boolean> => {
    if (!state.isAuthenticated) {
      setState(prev => ({ ...prev, error: 'Must be authenticated to save data' }));
      return false;
    }

    try {
      const result = await solidDataService.saveCheckInSessionToPod(session, clientPodUrl);
      return !!result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to save check-in session'
      }));
      return false;
    }
  }, [state.isAuthenticated]);

  // Check if client has given consent
  const checkConsent = useCallback(async (clientId: string, podUrl?: string): Promise<boolean> => {
    try {
      return await solidDataService.hasClientConsent(clientId, podUrl);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to check consent'
      }));
      return false;
    }
  }, []);

  // Delete client data (GDPR compliance)
  const deleteClientData = useCallback(async (clientId: string): Promise<boolean> => {
    if (!state.isAuthenticated) {
      setState(prev => ({ ...prev, error: 'Must be authenticated to delete data' }));
      return false;
    }

    try {
      const result = await solidDataService.deleteClientData(clientId);
      if (result) {
        setState(prev => ({
          ...prev,
          clients: prev.clients.filter(c => `${c.firstName}-${c.lastName}` !== clientId)
        }));
      }
      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to delete client data'
      }));
      return false;
    }
  }, [state.isAuthenticated]);

  // Clear errors
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Get pod URL for current user
  const getPodUrl = useCallback(() => {
    return solidAuthService.getPodRootUrl();
  }, []);

  // Get WebID for current user
  const getWebId = useCallback(() => {
    return solidAuthService.getWebId();
  }, []);

  return {
    // State
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    sessionInfo: state.sessionInfo,
    clients: state.clients,
    
    // Actions
    login,
    logout,
    saveClient,
    loadClientData,
    saveReservation,
    saveCheckInSession,
    checkConsent,
    deleteClientData,
    clearError,
    getPodUrl,
    getWebId
  };
};