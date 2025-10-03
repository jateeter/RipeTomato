import React, { useState, useEffect } from 'react';
import { SimpleCard } from '../components/SimpleCard';
import { TouchButton } from '../components/TouchButton';
import { StatusIndicator } from '../components/StatusIndicator';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ClientDataService, DashboardData } from '../services/ClientDataService';

export const MobileClientDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    loadDashboardData();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      const clientService = new ClientDataService();
      const dashboardData = await clientService.getDashboardData();
      setData(dashboardData);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOnline = () => {
    setOffline(false);
    syncOfflineData();
  };

  const handleOffline = () => {
    setOffline(true);
  };

  const syncOfflineData = async () => {
    const clientService = new ClientDataService();
    await clientService.syncOfflineChanges();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="mobile-dashboard p-4 min-h-screen bg-gray-50">
      {offline && (
        <div className="offline-banner bg-yellow-100 text-yellow-800 p-4 mb-4 rounded-lg">
          <p className="text-lg font-semibold">Offline Mode</p>
          <p className="text-base">Changes will sync when you're back online</p>
        </div>
      )}

      <div className="welcome-header mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Welcome Back!</h1>
        <p className="text-lg text-gray-600 mt-2">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      <SimpleCard className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Bed Status</h2>
            <p className="text-base text-gray-600 mt-1">
              {data?.bedStatus === 'available' && 'Bed available for tonight'}
              {data?.bedStatus === 'occupied' && 'Bed reserved for tonight'}
              {data?.bedStatus === 'pending' && 'Reservation pending'}
            </p>
          </div>
          <StatusIndicator
            status={data?.bedStatus || 'pending'}
            size="large"
          />
        </div>
        <TouchButton
          className="mt-4 w-full"
          variant="primary"
          onClick={() => alert('Bed management coming soon')}
        >
          Manage Bed Reservation
        </TouchButton>
      </SimpleCard>

      <SimpleCard className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Upcoming Services
        </h2>
        {!data?.upcomingServices || data.upcomingServices.length === 0 ? (
          <p className="text-base text-gray-600">No upcoming services</p>
        ) : (
          <div className="space-y-3">
            {data.upcomingServices.map(service => (
              <div
                key={service.id}
                className="service-item p-4 bg-blue-50 rounded-lg"
              >
                <h3 className="text-lg font-semibold text-gray-900">
                  {service.name}
                </h3>
                <p className="text-base text-gray-600 mt-1">
                  {service.date} at {service.time}
                </p>
              </div>
            ))}
          </div>
        )}
        <TouchButton
          className="mt-4 w-full"
          variant="secondary"
          onClick={() => alert('Services view coming soon')}
        >
          View All Services
        </TouchButton>
      </SimpleCard>

      <SimpleCard>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <TouchButton
            variant="outline"
            onClick={() => alert('Calendar coming soon')}
          >
            📅 Calendar
          </TouchButton>
          <TouchButton
            variant="outline"
            onClick={() => alert('Profile coming soon')}
          >
            👤 Profile
          </TouchButton>
          <TouchButton
            variant="outline"
            onClick={() => alert('Services coming soon')}
          >
            🏥 Services
          </TouchButton>
          <TouchButton
            variant="outline"
            onClick={() => alert('Help coming soon')}
          >
            ❓ Help
          </TouchButton>
        </div>
      </SimpleCard>
    </div>
  );
};
