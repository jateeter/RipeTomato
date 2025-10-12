/**
 * Transportation Perspectives Component
 *
 * Unified transportation interface with tabs for Manager, Staff, and Client perspectives.
 * Each perspective shows relevant metrics and information for that user role.
 */

import React, { useState, useEffect } from 'react';
import { transportationMockDataService } from '../services/mockTransportationData';
import type {
  Vehicle,
  RideRequest,
  Driver,
  TransportationStats,
  TransportationVoucher,
  TransportationAlert,
  MaintenanceRecord
} from '../types/Transportation';

type PerspectiveType = 'manager' | 'staff' | 'client';

interface TransportationPerspectivesProps {
  initialPerspective?: PerspectiveType;
  clientId?: string; // For client perspective
}

const TransportationPerspectives: React.FC<TransportationPerspectivesProps> = ({
  initialPerspective = 'manager',
  clientId = 'CLI001'
}) => {
  const [activePerspective, setActivePerspective] = useState<PerspectiveType>(initialPerspective);
  const [loading, setLoading] = useState(true);

  // Data state
  const [stats, setStats] = useState<TransportationStats | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [rides, setRides] = useState<RideRequest[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vouchers, setVouchers] = useState<TransportationVoucher[]>([]);
  const [alerts, setAlerts] = useState<TransportationAlert[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]);

  // Client-specific data
  const [clientRides, setClientRides] = useState<RideRequest[]>([]);
  const [clientVouchers, setClientVouchers] = useState<TransportationVoucher[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [
        statsData,
        vehiclesData,
        ridesData,
        driversData,
        vouchersData,
        alertsData,
        maintenanceData
      ] = await Promise.all([
        transportationMockDataService.getTransportationStats(),
        transportationMockDataService.getVehicles(),
        transportationMockDataService.getRideRequests(),
        transportationMockDataService.getDrivers(),
        transportationMockDataService.getVouchers(),
        transportationMockDataService.getAlerts(),
        transportationMockDataService.getMaintenanceRecords()
      ]);

      setStats(statsData);
      setVehicles(vehiclesData);
      setRides(ridesData);
      setDrivers(driversData);
      setVouchers(vouchersData);
      setAlerts(alertsData);
      setMaintenance(maintenanceData);

      // Client-specific data
      const clientRidesData = await transportationMockDataService.getClientRides(clientId);
      const clientVouchersData = await transportationMockDataService.getClientVouchers(clientId);
      setClientRides(clientRidesData);
      setClientVouchers(clientVouchersData);

    } catch (error) {
      console.error('Error loading transportation data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading transportation data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="transportation-perspectives">
      {/* Perspective Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Perspectives">
          <button
            onClick={() => setActivePerspective('manager')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
              ${activePerspective === 'manager'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
            data-testid="perspective-manager"
          >
            👔 Manager View
          </button>
          <button
            onClick={() => setActivePerspective('staff')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
              ${activePerspective === 'staff'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
            data-testid="perspective-staff"
          >
            👨‍💼 Staff View
          </button>
          <button
            onClick={() => setActivePerspective('client')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
              ${activePerspective === 'client'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
            data-testid="perspective-client"
          >
            👤 Client View
          </button>
        </nav>
      </div>

      {/* Perspective Content */}
      <div className="perspective-content">
        {activePerspective === 'manager' && (
          <ManagerPerspective
            stats={stats}
            vehicles={vehicles}
            rides={rides}
            drivers={drivers}
            alerts={alerts}
            maintenance={maintenance}
          />
        )}
        {activePerspective === 'staff' && (
          <StaffPerspective
            stats={stats}
            vehicles={vehicles}
            rides={rides}
            drivers={drivers}
            alerts={alerts}
          />
        )}
        {activePerspective === 'client' && (
          <ClientPerspective
            rides={clientRides}
            vouchers={clientVouchers}
            stats={stats}
          />
        )}
      </div>
    </div>
  );
};

/**
 * Manager Perspective - High-level overview and analytics
 */
interface ManagerPerspectiveProps {
  stats: TransportationStats;
  vehicles: Vehicle[];
  rides: RideRequest[];
  drivers: Driver[];
  alerts: TransportationAlert[];
  maintenance: MaintenanceRecord[];
}

const ManagerPerspective: React.FC<ManagerPerspectiveProps> = ({
  stats,
  vehicles,
  rides,
  drivers,
  alerts,
  maintenance
}) => {
  return (
    <div className="manager-perspective" data-testid="manager-content">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Transportation Management Dashboard</h2>
        <p className="text-gray-600">Comprehensive overview of fleet operations and performance metrics</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          title="Fleet Utilization"
          value={`${Math.round(stats.vehicles.utilizationRate * 100)}%`}
          subtitle={`${stats.vehicles.inUse} of ${stats.vehicles.total} in use`}
          icon="🚐"
          trend="up"
          dataTestId="metric-fleet-utilization"
        />
        <MetricCard
          title="On-Time Performance"
          value={`${stats.rides.onTimePercentage}%`}
          subtitle={`${stats.rides.completed} completed today`}
          icon="⏱️"
          trend="up"
          dataTestId="metric-ontime-performance"
        />
        <MetricCard
          title="Active Drivers"
          value={stats.drivers.onDuty.toString()}
          subtitle={`${stats.drivers.available} available`}
          icon="👨‍✈️"
          dataTestId="metric-active-drivers"
        />
        <MetricCard
          title="Maintenance Cost"
          value={`$${stats.maintenance.totalCost.toLocaleString()}`}
          subtitle={`${stats.maintenance.overdue} overdue`}
          icon="🔧"
          trend="down"
          dataTestId="metric-maintenance-cost"
        />
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="mb-8 bg-white rounded-lg shadow p-6" data-testid="alerts-section">
          <h3 className="text-lg font-semibold mb-4">⚠️ Active Alerts ({alerts.length})</h3>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <AlertItem key={alert.id} alert={alert} />
            ))}
          </div>
        </div>
      )}

      {/* Fleet Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6" data-testid="fleet-status">
          <h3 className="text-lg font-semibold mb-4">🚗 Fleet Status</h3>
          <div className="space-y-3">
            {vehicles.map((vehicle) => (
              <VehicleStatusItem key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6" data-testid="driver-status">
          <h3 className="text-lg font-semibold mb-4">👨‍✈️ Driver Status</h3>
          <div className="space-y-3">
            {drivers.map((driver) => (
              <DriverStatusItem key={driver.id} driver={driver} />
            ))}
          </div>
        </div>
      </div>

      {/* Rides Overview */}
      <div className="bg-white rounded-lg shadow p-6 mb-8" data-testid="rides-overview">
        <h3 className="text-lg font-semibold mb-4">🗓️ Rides Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatBox label="Today" value={stats.rides.today} color="blue" />
          <StatBox label="This Week" value={stats.rides.thisWeek} color="green" />
          <StatBox label="This Month" value={stats.rides.thisMonth} color="purple" />
          <StatBox label="Pending" value={stats.rides.pending} color="yellow" />
        </div>
        <div className="space-y-2">
          {rides.slice(0, 5).map((ride) => (
            <RideListItem key={ride.id} ride={ride} showDriver={true} />
          ))}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-lg shadow p-6" data-testid="performance-metrics">
        <h3 className="text-lg font-semibold mb-4">📊 Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Avg Ride Time</p>
            <p className="text-2xl font-bold text-gray-900">{stats.efficiency.averageRideTime} min</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Avg Miles/Ride</p>
            <p className="text-2xl font-bold text-gray-900">{stats.efficiency.averageMilesPerRide} mi</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Miles Today</p>
            <p className="text-2xl font-bold text-gray-900">{stats.efficiency.totalMilesToday} mi</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Fuel Efficiency</p>
            <p className="text-2xl font-bold text-gray-900">{stats.efficiency.fuelEfficiency} MPG</p>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Staff Perspective - Operational view for day-to-day coordination
 */
interface StaffPerspectiveProps {
  stats: TransportationStats;
  vehicles: Vehicle[];
  rides: RideRequest[];
  drivers: Driver[];
  alerts: TransportationAlert[];
}

const StaffPerspective: React.FC<StaffPerspectiveProps> = ({
  stats,
  vehicles,
  rides,
  drivers,
  alerts
}) => {
  const pendingRides = rides.filter(r => r.status === 'requested' || r.status === 'scheduled');
  const activeRides = rides.filter(r => r.status === 'in_progress');
  const availableVehicles = vehicles.filter(v => v.status === 'available');
  const availableDrivers = drivers.filter(d => d.status === 'active' && !d.currentVehicle);

  return (
    <div className="staff-perspective" data-testid="staff-content">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Transportation Operations</h2>
        <p className="text-gray-600">Coordinate rides, manage schedules, and track vehicle availability</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <QuickStatCard
          label="Pending Requests"
          value={pendingRides.length}
          icon="📋"
          color="yellow"
          dataTestId="stat-pending-requests"
        />
        <QuickStatCard
          label="Active Rides"
          value={activeRides.length}
          icon="🚗"
          color="green"
          dataTestId="stat-active-rides"
        />
        <QuickStatCard
          label="Available Vehicles"
          value={availableVehicles.length}
          icon="🅿️"
          color="blue"
          dataTestId="stat-available-vehicles"
        />
        <QuickStatCard
          label="Available Drivers"
          value={availableDrivers.length}
          icon="👤"
          color="purple"
          dataTestId="stat-available-drivers"
        />
      </div>

      {/* Priority Alerts for Staff */}
      {alerts.filter(a => !a.acknowledged).length > 0 && (
        <div className="mb-8 bg-amber-50 border border-amber-200 rounded-lg p-4" data-testid="staff-alerts">
          <h3 className="text-lg font-semibold text-amber-900 mb-3">⚠️ Attention Required</h3>
          <div className="space-y-2">
            {alerts.filter(a => !a.acknowledged).map((alert) => (
              <div key={alert.id} className="flex items-start gap-2 text-sm">
                <span className="text-amber-600">•</span>
                <span className="text-amber-900">{alert.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Rides Section */}
      <div className="mb-8 bg-white rounded-lg shadow p-6" data-testid="active-rides-section">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">🚗 Active Rides ({activeRides.length})</h3>
          <span className="text-sm text-gray-500">In Progress</span>
        </div>
        {activeRides.length > 0 ? (
          <div className="space-y-3">
            {activeRides.map((ride) => (
              <ActiveRideCard key={ride.id} ride={ride} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No active rides at this moment</p>
        )}
      </div>

      {/* Pending Requests */}
      <div className="mb-8 bg-white rounded-lg shadow p-6" data-testid="pending-requests-section">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">📋 Pending Requests ({pendingRides.length})</h3>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
            Assign Rides
          </button>
        </div>
        {pendingRides.length > 0 ? (
          <div className="space-y-3">
            {pendingRides.map((ride) => (
              <PendingRideCard key={ride.id} ride={ride} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">All ride requests have been assigned</p>
        )}
      </div>

      {/* Resource Availability */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6" data-testid="available-vehicles-section">
          <h3 className="text-lg font-semibold mb-4">🚐 Available Vehicles</h3>
          <div className="space-y-2">
            {availableVehicles.map((vehicle) => (
              <VehicleAvailabilityItem key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6" data-testid="available-drivers-section">
          <h3 className="text-lg font-semibold mb-4">👨‍✈️ Available Drivers</h3>
          <div className="space-y-2">
            {availableDrivers.map((driver) => (
              <DriverAvailabilityItem key={driver.id} driver={driver} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Client Perspective - Simple, user-friendly view for clients
 */
interface ClientPerspectiveProps {
  rides: RideRequest[];
  vouchers: TransportationVoucher[];
  stats: TransportationStats;
}

const ClientPerspective: React.FC<ClientPerspectiveProps> = ({
  rides,
  vouchers,
  stats
}) => {
  const upcomingRides = rides.filter(r => r.status === 'scheduled' || r.status === 'requested');
  const pastRides = rides.filter(r => r.status === 'completed');
  const activeVouchers = vouchers.filter(v => v.status === 'active');

  return (
    <div className="client-perspective" data-testid="client-content">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">My Transportation</h2>
        <p className="text-gray-600">View your rides, track status, and manage transportation vouchers</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <button className="bg-blue-600 text-white rounded-lg p-6 hover:bg-blue-700 transition-colors flex items-center justify-center gap-3">
          <span className="text-2xl">🚗</span>
          <span className="font-semibold">Request a Ride</span>
        </button>
        <button className="bg-green-600 text-white rounded-lg p-6 hover:bg-green-700 transition-colors flex items-center justify-center gap-3">
          <span className="text-2xl">🎫</span>
          <span className="font-semibold">View My Vouchers</span>
        </button>
      </div>

      {/* Upcoming Rides */}
      <div className="mb-8 bg-white rounded-lg shadow p-6" data-testid="client-upcoming-rides">
        <h3 className="text-lg font-semibold mb-4">📅 Upcoming Rides</h3>
        {upcomingRides.length > 0 ? (
          <div className="space-y-4">
            {upcomingRides.map((ride) => (
              <ClientRideCard key={ride.id} ride={ride} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="text-4xl mb-2">🚗</p>
            <p>No upcoming rides scheduled</p>
            <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Request a Ride
            </button>
          </div>
        )}
      </div>

      {/* Active Vouchers */}
      <div className="mb-8 bg-white rounded-lg shadow p-6" data-testid="client-vouchers">
        <h3 className="text-lg font-semibold mb-4">🎫 My Transportation Vouchers</h3>
        {activeVouchers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeVouchers.map((voucher) => (
              <VoucherCard key={voucher.id} voucher={voucher} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="text-4xl mb-2">🎫</p>
            <p>No active vouchers</p>
            <p className="text-sm mt-2">Contact staff to request transportation assistance</p>
          </div>
        )}
      </div>

      {/* Ride History */}
      <div className="bg-white rounded-lg shadow p-6" data-testid="client-ride-history">
        <h3 className="text-lg font-semibold mb-4">📋 Recent Ride History</h3>
        {pastRides.length > 0 ? (
          <div className="space-y-2">
            {pastRides.slice(0, 5).map((ride) => (
              <RideHistoryItem key={ride.id} ride={ride} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No ride history available</p>
        )}
      </div>

      {/* Transportation Tips */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6" data-testid="transportation-tips">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 Transportation Tips</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• Request rides at least 24 hours in advance when possible</li>
          <li>• Be ready 10 minutes before your scheduled pickup time</li>
          <li>• Call our dispatch at (208) 555-0100 if you need to cancel or modify a ride</li>
          <li>• Transportation vouchers expire at the end of each month</li>
          <li>• Emergency medical transportation is available 24/7</li>
        </ul>
      </div>
    </div>
  );
};

// ===== Reusable Components =====

interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  trend?: 'up' | 'down';
  dataTestId?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, icon, trend, dataTestId }) => (
  <div className="bg-white rounded-lg shadow p-6" data-testid={dataTestId}>
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
      <div className="text-3xl">{icon}</div>
    </div>
    {trend && (
      <div className={`mt-2 flex items-center text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
        <span>{trend === 'up' ? '↑' : '↓'}</span>
      </div>
    )}
  </div>
);

interface AlertItemProps {
  alert: TransportationAlert;
}

const AlertItem: React.FC<AlertItemProps> = ({ alert }) => {
  const severityColors = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    critical: 'bg-red-100 border-red-300 text-red-900'
  };

  return (
    <div className={`border rounded-lg p-3 ${severityColors[alert.severity]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold">{alert.title}</p>
          <p className="text-sm mt-1">{alert.message}</p>
        </div>
        {!alert.acknowledged && (
          <button className="px-3 py-1 bg-white rounded text-xs font-medium">
            Acknowledge
          </button>
        )}
      </div>
    </div>
  );
};

interface VehicleStatusItemProps {
  vehicle: Vehicle;
}

const VehicleStatusItem: React.FC<VehicleStatusItemProps> = ({ vehicle }) => {
  const statusColors = {
    available: 'bg-green-100 text-green-800',
    in_use: 'bg-blue-100 text-blue-800',
    maintenance: 'bg-yellow-100 text-yellow-800',
    out_of_service: 'bg-red-100 text-red-800',
    reserved: 'bg-purple-100 text-purple-800'
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <p className="font-semibold text-gray-900">{vehicle.name}</p>
        <p className="text-sm text-gray-600">{vehicle.make} {vehicle.model} • {vehicle.licensePlate}</p>
      </div>
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[vehicle.status]}`}>
        {vehicle.status.replace('_', ' ')}
      </span>
    </div>
  );
};

interface DriverStatusItemProps {
  driver: Driver;
}

const DriverStatusItem: React.FC<DriverStatusItemProps> = ({ driver }) => {
  const statusIcon = driver.currentVehicle ? '🚗' : '✓';
  const statusText = driver.currentVehicle ? 'On Route' : 'Available';

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <p className="font-semibold text-gray-900">{driver.name}</p>
        <p className="text-sm text-gray-600">{driver.stats?.totalRides || 0} total rides</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm">{statusIcon}</span>
        <span className="text-sm font-medium text-gray-700">{statusText}</span>
      </div>
    </div>
  );
};

interface StatBoxProps {
  label: string;
  value: number;
  color: string;
}

const StatBox: React.FC<StatBoxProps> = ({ label, value, color }) => {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-900',
    green: 'bg-green-50 text-green-900',
    purple: 'bg-purple-50 text-purple-900',
    yellow: 'bg-yellow-50 text-yellow-900'
  };

  return (
    <div className={`rounded-lg p-4 ${colorClasses[color]}`}>
      <p className="text-sm opacity-75 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
};

interface RideListItemProps {
  ride: RideRequest;
  showDriver?: boolean;
}

const RideListItem: React.FC<RideListItemProps> = ({ ride, showDriver }) => {
  const priorityIcons: Record<string, string> = {
    low: '🟢',
    medium: '🟡',
    high: '🟠',
    emergency: '🔴'
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span>{priorityIcons[ride.priority]}</span>
          <p className="font-semibold text-gray-900">{ride.clientName}</p>
          <span className="text-xs px-2 py-1 bg-white rounded">{ride.type.replace('_', ' ')}</span>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {ride.scheduledTime} • {ride.pickup.address}
        </p>
      </div>
      {showDriver && ride.assignedDriver && (
        <span className="text-sm text-gray-600">Driver: {ride.assignedDriver}</span>
      )}
    </div>
  );
};

interface QuickStatCardProps {
  label: string;
  value: number;
  icon: string;
  color: string;
  dataTestId?: string;
}

const QuickStatCard: React.FC<QuickStatCardProps> = ({ label, value, icon, color, dataTestId }) => (
  <div className="bg-white rounded-lg shadow p-6" data-testid={dataTestId}>
    <div className="flex items-center justify-between mb-2">
      <span className="text-2xl">{icon}</span>
      <span className="text-3xl font-bold text-gray-900">{value}</span>
    </div>
    <p className="text-sm text-gray-600">{label}</p>
  </div>
);

interface ActiveRideCardProps {
  ride: RideRequest;
}

const ActiveRideCard: React.FC<ActiveRideCardProps> = ({ ride }) => (
  <div className="border border-green-200 bg-green-50 rounded-lg p-4">
    <div className="flex items-start justify-between mb-2">
      <div>
        <p className="font-semibold text-gray-900">{ride.clientName}</p>
        <p className="text-sm text-gray-600">{ride.type.replace('_', ' ')}</p>
      </div>
      <span className="px-3 py-1 bg-green-600 text-white rounded-full text-xs font-medium">In Progress</span>
    </div>
    <div className="grid grid-cols-2 gap-2 text-sm mt-3">
      <div>
        <p className="text-gray-600">From:</p>
        <p className="text-gray-900">{ride.pickup.address}</p>
      </div>
      <div>
        <p className="text-gray-600">To:</p>
        <p className="text-gray-900">{ride.dropoff.address}</p>
      </div>
    </div>
    {ride.assignedDriver && (
      <p className="text-sm text-gray-600 mt-2">Driver: {ride.assignedDriver}</p>
    )}
  </div>
);

interface PendingRideCardProps {
  ride: RideRequest;
}

const PendingRideCard: React.FC<PendingRideCardProps> = ({ ride }) => {
  const priorityColors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    emergency: 'bg-red-100 text-red-800'
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-semibold text-gray-900">{ride.clientName}</p>
          <p className="text-sm text-gray-600">{ride.scheduledDate.toLocaleDateString()} at {ride.scheduledTime}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${priorityColors[ride.priority]}`}>
          {ride.priority}
        </span>
      </div>
      <div className="text-sm space-y-1 mb-3">
        <p><span className="text-gray-600">From:</span> {ride.pickup.address}</p>
        <p><span className="text-gray-600">To:</span> {ride.dropoff.address}</p>
        <p><span className="text-gray-600">Type:</span> {ride.type.replace('_', ' ')}</p>
        {ride.wheelchairRequired && <p className="text-blue-600">♿ Wheelchair accessible vehicle required</p>}
      </div>
      <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
        Assign Driver & Vehicle
      </button>
    </div>
  );
};

interface VehicleAvailabilityItemProps {
  vehicle: Vehicle;
}

const VehicleAvailabilityItem: React.FC<VehicleAvailabilityItemProps> = ({ vehicle }) => (
  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
    <div>
      <p className="font-semibold text-gray-900">{vehicle.name}</p>
      <p className="text-sm text-gray-600">
        Capacity: {vehicle.capacity} • {vehicle.wheelchairAccessible ? '♿ Accessible' : 'Standard'}
      </p>
    </div>
    <button className="px-3 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700">
      Assign
    </button>
  </div>
);

interface DriverAvailabilityItemProps {
  driver: Driver;
}

const DriverAvailabilityItem: React.FC<DriverAvailabilityItemProps> = ({ driver }) => (
  <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
    <div>
      <p className="font-semibold text-gray-900">{driver.name}</p>
      <p className="text-sm text-gray-600">
        Rating: {driver.stats?.safetyRating || 0}/5.0 • {driver.certifications?.length || 0} certifications
      </p>
    </div>
    <button className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700">
      Assign
    </button>
  </div>
);

interface ClientRideCardProps {
  ride: RideRequest;
}

const ClientRideCard: React.FC<ClientRideCardProps> = ({ ride }) => {
  const statusColors: Record<string, string> = {
    requested: 'bg-yellow-100 text-yellow-800',
    scheduled: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
    no_show: 'bg-red-100 text-red-800'
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-lg font-semibold text-gray-900">
            {ride.scheduledDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <p className="text-2xl font-bold text-blue-600">{ride.scheduledTime}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[ride.status]}`}>
          {ride.status.replace('_', ' ')}
        </span>
      </div>
      <div className="space-y-3">
        <div>
          <p className="text-sm text-gray-600 font-medium">Pickup Location</p>
          <p className="text-gray-900">{ride.pickup.address}</p>
        </div>
        <div className="border-t pt-3">
          <p className="text-sm text-gray-600 font-medium">Destination</p>
          <p className="text-gray-900">{ride.dropoff.address}</p>
        </div>
        <div className="border-t pt-3">
          <p className="text-sm text-gray-600 font-medium">Trip Purpose</p>
          <p className="text-gray-900">{ride.type.replace('_', ' ')}</p>
        </div>
      </div>
      {ride.notes && (
        <div className="mt-4 p-3 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">Note: {ride.notes}</p>
        </div>
      )}
      <div className="mt-4 flex gap-2">
        <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
          Modify
        </button>
        <button className="flex-1 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50">
          Cancel
        </button>
      </div>
    </div>
  );
};

interface VoucherCardProps {
  voucher: TransportationVoucher;
}

const VoucherCard: React.FC<VoucherCardProps> = ({ voucher }) => (
  <div className="border border-green-200 bg-green-50 rounded-lg p-4">
    <div className="flex items-start justify-between mb-2">
      <div>
        <p className="font-semibold text-gray-900">{voucher.type.replace('_', ' ').toUpperCase()}</p>
        <p className="text-sm text-gray-600">{voucher.provider}</p>
      </div>
      <p className="text-2xl font-bold text-green-600">${voucher.value.toFixed(2)}</p>
    </div>
    <div className="text-sm space-y-1 mt-3">
      <p className="text-gray-600">Expires: {voucher.expirationDate.toLocaleDateString()}</p>
      {voucher.notes && <p className="text-gray-700 italic">{voucher.notes}</p>}
    </div>
    <button className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
      View Details
    </button>
  </div>
);

interface RideHistoryItemProps {
  ride: RideRequest;
}

const RideHistoryItem: React.FC<RideHistoryItemProps> = ({ ride }) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
    <div className="flex-1">
      <p className="font-semibold text-gray-900">{ride.scheduledDate.toLocaleDateString()}</p>
      <p className="text-sm text-gray-600">{ride.pickup.address} → {ride.dropoff.address}</p>
    </div>
    <span className="text-sm text-gray-500">{ride.type.replace('_', ' ')}</span>
  </div>
);

export default TransportationPerspectives;
