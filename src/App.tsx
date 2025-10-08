import { useState, useEffect } from 'react';
import { CommunityServicesHub } from './components/CommunityServicesHub';
import ShelterApp from './components/ShelterApp';
import ErrorBoundary from './components/ErrorBoundary';
import { MobileClientDashboard } from './modules/client/mobile/MobileClientDashboard';
import SimpleClientRegistration from './components/SimpleClientRegistration';
import { solidInitializationService } from './services/solidInitializationService';
import { botInitializationService } from './services/botInitializationService';
import { testExposureService } from './services/testExposureService';
import { cacheInitializationService } from './services/cacheInitializationService';
import { useResponsive } from './hooks/useResponsive';
import { getContainerClasses, getNavigationClasses, getSafeAreaClasses } from './utils/responsive';
import './App.css';

type ActiveView = 'community-hub' | 'legacy-shelter' | 'client-dashboard' | 'simple-registration';

function App() {
  const [activeView, setActiveView] = useState<ActiveView>('community-hub' as ActiveView);
  const [solidInitialized, setSolidInitialized] = useState(false);
  const [solidInitError, setSolidInitError] = useState<string | null>(null);
  const [botInitialized, setBotInitialized] = useState(false);
  const [botInitError, setBotInitError] = useState<string | null>(null);
  const [cacheInitialized, setCacheInitialized] = useState(false);
  const [cacheInitError, setCacheInitError] = useState<string | null>(null);
  const { isMobile, isTablet, deviceType, specificDevice } = useResponsive();

  useEffect(() => {
    // Initialize Solid Pod connection during app startup
    const initializeSolidPod = async () => {
      try {
        console.log('🚀 Starting application with Solid Pod initialization...');
        const result = await solidInitializationService.initialize();
        
        if (result.success) {
          console.log('✅ Solid Pod initialization completed successfully');
          setSolidInitialized(true);
          setSolidInitError(null); // Clear any previous errors
        } else {
          console.warn('⚠️ Solid Pod initialization failed:', result.message);
          // Still allow the app to function without Solid Pod
          setSolidInitError(result.error || result.message);
          setSolidInitialized(false);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
        console.error('❌ Critical error during Solid Pod initialization:', errorMessage);
        setSolidInitError(errorMessage);
      }
    };

    // Global error handlers to prevent script errors from crashing the app
    const handleError = (event: ErrorEvent) => {
      console.error('Global error caught:', event.error);
      event.preventDefault(); // Prevent the error from propagating
      return true;
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      // Log additional context for debugging
      if (event.reason instanceof Error) {
        console.error('Promise rejection stack:', event.reason.stack);
      }
      event.preventDefault(); // Prevent the error from propagating
    };

    // Add global error listeners
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Initialize Solid Pod connection
    initializeSolidPod();

    // Initialize Bot System
    const initializeBotSystem = async () => {
      try {
        console.log('🤖 Starting BotLab Core initialization...');
        const result = await botInitializationService.initialize();
        
        if (result.success) {
          console.log('✅ BotLab Core initialization completed successfully');
          setBotInitialized(true);
          setBotInitError(null);
        } else {
          console.warn('⚠️ BotLab Core initialization failed:', result.message);
          setBotInitError(result.error || result.message);
          setBotInitialized(false);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown bot initialization error';
        console.error('❌ Critical error during BotLab Core initialization:', errorMessage);
        setBotInitError(errorMessage);
      }
    };

    initializeBotSystem();

    // Initialize Cache Database
    const initializeCacheDatabase = async () => {
      try {
        console.log('📦 Starting cache database initialization...');
        const result = await cacheInitializationService.initialize();

        if (result.success) {
          console.log('✅ Cache database initialization completed successfully');
          console.log(`   Source: ${result.source}`);
          if (result.stats) {
            console.log(`   Locations: ${result.stats.locations}`);
            console.log(`   Shelters: ${result.stats.shelters}`);
            console.log(`   Last Sync: ${new Date(result.stats.lastSync).toLocaleString()}`);
          }
          setCacheInitialized(true);
          setCacheInitError(null);
        } else {
          console.warn('⚠️ Cache database initialization failed:', result.message);
          setCacheInitError(result.error || result.message);
          setCacheInitialized(false);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown cache initialization error';
        console.error('❌ Critical error during cache database initialization:', errorMessage);
        setCacheInitError(errorMessage);
      }
    };

    initializeCacheDatabase();

    // Initialize test exposure service for E2E testing
    const initializeTestExposure = async () => {
      try {
        console.log('🧪 Initializing test exposure service...');
        await testExposureService.initialize();
        console.log('✅ Test exposure service ready');
      } catch (error) {
        console.warn('⚠️ Test exposure service initialization failed:', error);
      }
    };

    initializeTestExposure();

    // Register setActiveView for E2E testing
    testExposureService.registerSetActiveView(setActiveView);

    // Cleanup
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      testExposureService.cleanup();
    };
  }, []);

  if (activeView === 'community-hub') {
    // Full-screen Community Services Hub with responsive wrapper
    return (
      <ErrorBoundary>
        <div data-testid="app-loaded" className={`min-h-mobile-screen ${getSafeAreaClasses()}`}>
          <CommunityServicesHub />
        </div>
      </ErrorBoundary>
    );
  }

  if (activeView === 'client-dashboard') {
    // Full-screen Mobile Client Dashboard
    return (
      <ErrorBoundary>
        <div data-testid="client-dashboard-loaded" className={`min-h-mobile-screen ${getSafeAreaClasses()}`}>
          <MobileClientDashboard />
        </div>
      </ErrorBoundary>
    );
  }

  if (activeView === 'simple-registration') {
    // Full-screen Simple Client Registration (iPad-optimized)
    return (
      <ErrorBoundary>
        <div data-testid="simple-registration-loaded" className={`min-h-mobile-screen ${getSafeAreaClasses()}`}>
          <SimpleClientRegistration />
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className={`min-h-mobile-screen bg-gray-50 ${getSafeAreaClasses()}`}>
        {/* Responsive Navigation Header */}
        <header className={getNavigationClasses(isMobile)}>
          <div className={getContainerClasses()}>
            <div className={`flex items-center ${isMobile ? 'justify-center h-12' : 'justify-between h-16'}`}>
              {/* Title - responsive sizing */}
              <div className={`flex items-center ${isMobile ? 'flex-col' : 'space-x-4'}`}>
                <h1 className={`font-bold text-gray-900 ${
                  isMobile ? 'text-sm-mobile' : isTablet ? 'text-lg' : 'text-xl'
                }`}>
                  Community Services Hub
                </h1>
                
                {/* System Status - hide on very small screens */}
                {(!isMobile || deviceType !== 'mobile') && (
                  <div className="flex items-center space-x-4">
                    {/* Solid Pod Status */}
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        solidInitialized ? 'bg-green-500' : 
                        solidInitError ? 'bg-red-500' : 'bg-yellow-500'
                      }`}></div>
                      <span className="text-xs text-gray-600">
                        {solidInitialized ? 'Pod Connected' : 
                         solidInitError ? 'Pod Error' : 'Pod Connecting...'}
                      </span>
                      {solidInitError && (
                        <span className="text-xs text-red-600" title={solidInitError}>
                          ⚠️
                        </span>
                      )}
                    </div>
                    
                    {/* Bot System Status */}
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        botInitialized ? 'bg-green-500' : 
                        botInitError ? 'bg-red-500' : 'bg-yellow-500'
                      }`}></div>
                      <span className="text-xs text-gray-600">
                        {botInitialized ? 'Bots Active' : 
                         botInitError ? 'Bot Error' : 'Bots Starting...'}
                      </span>
                      {botInitError && (
                        <span className="text-xs text-red-600" title={botInitError}>
                          ⚠️
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Navigation - mobile responsive */}
              {!isMobile ? (
                <nav className="flex space-x-1">
                  <button
                    onClick={() => setActiveView('community-hub')}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      (activeView as string) === 'community-hub'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-1">🏘️</span>
                    Community Hub
                  </button>
                  <button
                    onClick={() => setActiveView('client-dashboard')}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      (activeView as string) === 'client-dashboard'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-1">📱</span>
                    Client Portal
                  </button>
                  <button
                    onClick={() => setActiveView('legacy-shelter')}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      (activeView as string) === 'legacy-shelter'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-1">🛏️</span>
                    Legacy Shelter
                  </button>
                </nav>
              ) : (
                // Mobile bottom navigation will be handled in main content
                null
              )}
            </div>
          </div>
        </header>

        {/* Main Content with responsive padding */}
        <main className={`${getContainerClasses()} ${isMobile ? 'py-2 pb-16' : 'py-6'}`}>
          <ShelterApp />
        </main>

        {/* Mobile Bottom Navigation */}
        {isMobile && (
          <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-1 z-50 flex justify-around">
            <button
              onClick={() => setActiveView('community-hub')}
              className={`flex flex-col items-center px-3 py-2 text-xs transition-colors ${
                (activeView as string) === 'community-hub'
                  ? 'text-blue-700'
                  : 'text-gray-500'
              }`}
            >
              <span className="text-lg mb-1">🏘️</span>
              Community
            </button>
            <button
              onClick={() => setActiveView('legacy-shelter')}
              className={`flex flex-col items-center px-3 py-2 text-xs transition-colors ${
                (activeView as string) === 'legacy-shelter'
                  ? 'text-blue-700'
                  : 'text-gray-500'
              }`}
            >
              <span className="text-lg mb-1">🛏️</span>
              Shelter
            </button>
          </nav>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;
