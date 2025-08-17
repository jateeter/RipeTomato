import { useState, useEffect } from 'react';
import { CommunityServicesHub } from './components/CommunityServicesHub';
import ShelterApp from './components/ShelterApp';
import ErrorBoundary from './components/ErrorBoundary';
import { solidInitializationService } from './services/solidInitializationService';
import './App.css';

type ActiveView = 'community-hub' | 'legacy-shelter';

function App() {
  const [activeView, setActiveView] = useState<ActiveView>('community-hub' as ActiveView);
  const [solidInitialized, setSolidInitialized] = useState(false);
  const [solidInitError, setSolidInitError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize Solid Pod connection during app startup
    const initializeSolidPod = async () => {
      try {
        console.log('🚀 Starting application with Solid Pod initialization...');
        const result = await solidInitializationService.initialize();
        
        if (result.success) {
          console.log('✅ Solid Pod initialization completed successfully');
          setSolidInitialized(true);
        } else {
          console.warn('⚠️ Solid Pod initialization failed:', result.message);
          setSolidInitError(result.error || result.message);
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
      event.preventDefault(); // Prevent the error from propagating
    };

    // Add global error listeners
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Initialize Solid Pod connection
    initializeSolidPod();

    // Cleanup
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  if (activeView === 'community-hub') {
    // Full-screen Community Services Hub
    return (
      <ErrorBoundary>
        <CommunityServicesHub />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-bold text-gray-900">Community Services Hub</h1>
                
                {/* Solid Pod Connection Status */}
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
              </div>
              
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
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <ShelterApp />
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;
