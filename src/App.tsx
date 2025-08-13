import { useState } from 'react';
import { CommunityServicesHub } from './components/CommunityServicesHub';
import ShelterApp from './components/ShelterApp';
import './App.css';

type ActiveView = 'community-hub' | 'legacy-shelter';

function App() {
  const [activeView, setActiveView] = useState<ActiveView>('community-hub' as ActiveView);

  if (activeView === 'community-hub') {
    // Full-screen Community Services Hub
    return <CommunityServicesHub />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Community Services Hub</h1>
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
  );
}

export default App;
