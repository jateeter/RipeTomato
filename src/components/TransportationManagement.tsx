/**
 * Transportation Management Component
 *
 * Comprehensive transportation management system for homeless services including:
 * - Fleet management and vehicle tracking
 * - Route planning and scheduling
 * - Transportation voucher system
 * - Driver coordination
 * - Fuel and maintenance tracking
 */

import React, { useState, useEffect } from 'react';

// Types
interface Vehicle {
  id: string;
  name: string;
  type: 'van' | 'bus' | 'car' | 'wheelchair_accessible';
  capacity: number;
  status: 'available' | 'in_use' | 'maintenance' | 'out_of_service';
  currentLocation?: string;
  driverId?: string;
  fuelLevel: number;
  mileage: number;
  lastMaintenance: string;
  nextMaintenance: string;
  licensePlate: string;
}

interface Route {
  id: string;
  name: string;
  vehicleId: string;
  driverId: string;
  stops: RouteStop[];
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  startTime: string;
  endTime?: string;
  date: string;
  passengerCount: number;
  distance: number;
  notes?: string;
}

interface RouteStop {
  id: string;
  location: string;
  address: string;
  arrivalTime: string;
  departureTime?: string;
  passengers: number;
  status: 'pending' | 'arrived' | 'departed' | 'skipped';
  notes?: string;
}

interface Voucher {
  id: string;
  clientId: string;
  clientName: string;
  type: 'bus_pass' | 'taxi' | 'uber_lyft' | 'gas_card';
  amount: number;
  issueDate: string;
  expiryDate: string;
  status: 'active' | 'used' | 'expired' | 'cancelled';
  purpose: string;
  approvedBy: string;
  usedDate?: string;
}

interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  licenseExpiry: string;
  status: 'available' | 'on_route' | 'off_duty';
  phone: string;
  currentVehicleId?: string;
  hoursThisWeek: number;
}

interface TransportationMetrics {
  activeVehicles: number;
  totalVehicles: number;
  routesScheduledToday: number;
  routesCompleted: number;
  activeVouchers: number;
  availableDrivers: number;
  maintenanceAlerts: number;
}

type ViewMode = 'overview' | 'fleet' | 'routes' | 'vouchers' | 'drivers' | 'maintenance';

interface TransportationManagementProps {
  compact?: boolean;
  showMetrics?: boolean;
}

const TransportationManagement: React.FC<TransportationManagementProps> = ({
  compact = false,
  showMetrics = true
}) => {
  const [currentView, setCurrentView] = useState<ViewMode>('overview');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Mock data - in production, this would come from API/database
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    {
      id: 'v1',
      name: 'Transit Van 1',
      type: 'van',
      capacity: 12,
      status: 'available',
      currentLocation: 'Shelter A',
      fuelLevel: 75,
      mileage: 45230,
      lastMaintenance: '2025-09-15',
      nextMaintenance: '2025-12-15',
      licensePlate: 'ABC-1234'
    },
    {
      id: 'v2',
      name: 'Accessible Bus',
      type: 'wheelchair_accessible',
      capacity: 8,
      status: 'in_use',
      driverId: 'd1',
      currentLocation: 'Route 3',
      fuelLevel: 45,
      mileage: 62100,
      lastMaintenance: '2025-08-20',
      nextMaintenance: '2025-11-20',
      licensePlate: 'XYZ-5678'
    },
    {
      id: 'v3',
      name: 'Service Van 2',
      type: 'van',
      capacity: 10,
      status: 'maintenance',
      fuelLevel: 30,
      mileage: 71500,
      lastMaintenance: '2025-10-01',
      nextMaintenance: '2026-01-01',
      licensePlate: 'DEF-9012'
    }
  ]);

  const [routes, setRoutes] = useState<Route[]>([
    {
      id: 'r1',
      name: 'Morning Clinic Run',
      vehicleId: 'v2',
      driverId: 'd1',
      status: 'in_progress',
      startTime: '08:00',
      date: selectedDate,
      passengerCount: 6,
      distance: 12.5,
      stops: [
        {
          id: 's1',
          location: 'Shelter A',
          address: '123 Main St',
          arrivalTime: '08:00',
          departureTime: '08:15',
          passengers: 3,
          status: 'departed'
        },
        {
          id: 's2',
          location: 'Shelter B',
          address: '456 Oak Ave',
          arrivalTime: '08:30',
          passengers: 3,
          status: 'arrived'
        },
        {
          id: 's3',
          location: 'Community Health Center',
          address: '789 Elm St',
          arrivalTime: '09:00',
          passengers: 6,
          status: 'pending'
        }
      ]
    },
    {
      id: 'r2',
      name: 'Job Services Transport',
      vehicleId: 'v1',
      driverId: 'd2',
      status: 'scheduled',
      startTime: '13:00',
      date: selectedDate,
      passengerCount: 8,
      distance: 8.3,
      stops: [
        {
          id: 's4',
          location: 'Day Center',
          address: '321 Pine St',
          arrivalTime: '13:00',
          passengers: 5,
          status: 'pending'
        },
        {
          id: 's5',
          location: 'Workforce Development',
          address: '654 Cedar Rd',
          arrivalTime: '13:30',
          passengers: 8,
          status: 'pending'
        }
      ]
    }
  ]);

  const [vouchers, setVouchers] = useState<Voucher[]>([
    {
      id: 'vch1',
      clientId: 'c001',
      clientName: 'John Doe',
      type: 'bus_pass',
      amount: 30,
      issueDate: '2025-10-01',
      expiryDate: '2025-10-31',
      status: 'active',
      purpose: 'Job interviews',
      approvedBy: 'Case Manager A'
    },
    {
      id: 'vch2',
      clientId: 'c002',
      clientName: 'Jane Smith',
      type: 'taxi',
      amount: 25,
      issueDate: '2025-10-05',
      expiryDate: '2025-10-15',
      status: 'active',
      purpose: 'Medical appointment',
      approvedBy: 'Case Manager B'
    },
    {
      id: 'vch3',
      clientId: 'c003',
      clientName: 'Robert Johnson',
      type: 'uber_lyft',
      amount: 20,
      issueDate: '2025-09-28',
      expiryDate: '2025-10-08',
      status: 'used',
      purpose: 'Housing appointment',
      approvedBy: 'Case Manager A',
      usedDate: '2025-10-02'
    }
  ]);

  const [drivers, setDrivers] = useState<Driver[]>([
    {
      id: 'd1',
      name: 'Mike Anderson',
      licenseNumber: 'DL123456',
      licenseExpiry: '2026-03-15',
      status: 'on_route',
      phone: '555-0101',
      currentVehicleId: 'v2',
      hoursThisWeek: 32
    },
    {
      id: 'd2',
      name: 'Sarah Williams',
      licenseNumber: 'DL789012',
      licenseExpiry: '2025-11-20',
      status: 'available',
      phone: '555-0102',
      hoursThisWeek: 28
    }
  ]);

  const metrics: TransportationMetrics = {
    activeVehicles: vehicles.filter(v => v.status === 'available' || v.status === 'in_use').length,
    totalVehicles: vehicles.length,
    routesScheduledToday: routes.filter(r => r.date === selectedDate).length,
    routesCompleted: routes.filter(r => r.status === 'completed' && r.date === selectedDate).length,
    activeVouchers: vouchers.filter(v => v.status === 'active').length,
    availableDrivers: drivers.filter(d => d.status === 'available').length,
    maintenanceAlerts: vehicles.filter(v => {
      const nextMaintenance = new Date(v.nextMaintenance);
      const today = new Date();
      const daysUntil = Math.floor((nextMaintenance.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil <= 30;
    }).length
  };

  const getStatusColor = (status: string): string => {
    const colors: { [key: string]: string } = {
      available: 'text-green-600 bg-green-50',
      in_use: 'text-blue-600 bg-blue-50',
      on_route: 'text-blue-600 bg-blue-50',
      maintenance: 'text-yellow-600 bg-yellow-50',
      out_of_service: 'text-red-600 bg-red-50',
      scheduled: 'text-gray-600 bg-gray-50',
      in_progress: 'text-blue-600 bg-blue-50',
      completed: 'text-green-600 bg-green-50',
      cancelled: 'text-red-600 bg-red-50',
      active: 'text-green-600 bg-green-50',
      used: 'text-gray-600 bg-gray-50',
      expired: 'text-red-600 bg-red-50',
      off_duty: 'text-gray-600 bg-gray-50',
      pending: 'text-yellow-600 bg-yellow-50',
      arrived: 'text-blue-600 bg-blue-50',
      departed: 'text-green-600 bg-green-50',
      skipped: 'text-red-600 bg-red-50'
    };
    return colors[status] || 'text-gray-600 bg-gray-50';
  };

  const getVehicleTypeIcon = (type: Vehicle['type']): string => {
    const icons: { [key: string]: string } = {
      van: '🚐',
      bus: '🚌',
      car: '🚗',
      wheelchair_accessible: '♿🚐'
    };
    return icons[type] || '🚗';
  };

  const getVoucherTypeIcon = (type: Voucher['type']): string => {
    const icons: { [key: string]: string } = {
      bus_pass: '🚌',
      taxi: '🚕',
      uber_lyft: '🚗',
      gas_card: '⛽'
    };
    return icons[type] || '🎫';
  };

  const renderMetrics = () => {
    if (!showMetrics || compact) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">{metrics.activeVehicles}/{metrics.totalVehicles}</div>
          <div className="text-sm text-gray-600">Active Vehicles</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">{metrics.routesCompleted}/{metrics.routesScheduledToday}</div>
          <div className="text-sm text-gray-600">Routes Today</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-purple-600">{metrics.activeVouchers}</div>
          <div className="text-sm text-gray-600">Active Vouchers</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-orange-600">{metrics.maintenanceAlerts}</div>
          <div className="text-sm text-gray-600">Maintenance Alerts</div>
        </div>
      </div>
    );
  };

  const renderViewTabs = () => {
    if (compact) return null;

    const tabs: { id: ViewMode; label: string; icon: string }[] = [
      { id: 'overview', label: 'Overview', icon: '📊' },
      { id: 'fleet', label: 'Fleet', icon: '🚐' },
      { id: 'routes', label: 'Routes', icon: '🗺️' },
      { id: 'vouchers', label: 'Vouchers', icon: '🎫' },
      { id: 'drivers', label: 'Drivers', icon: '👨‍✈️' },
      { id: 'maintenance', label: 'Maintenance', icon: '🔧' }
    ];

    return (
      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setCurrentView(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              currentView === tab.id
                ? 'bg-blue-500 text-white border-2 border-blue-600'
                : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
    );
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Active Routes Today */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">🚍 Active Routes Today</h3>
        {routes.filter(r => r.date === selectedDate && r.status !== 'completed').length === 0 ? (
          <p className="text-gray-500">No active routes scheduled</p>
        ) : (
          <div className="space-y-3">
            {routes
              .filter(r => r.date === selectedDate && r.status !== 'completed')
              .map(route => (
                <div key={route.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium">{route.name}</div>
                      <div className="text-sm text-gray-600">
                        {route.stops.length} stops • {route.passengerCount} passengers • {route.distance} miles
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(route.status)}`}>
                      {route.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Vehicle: {vehicles.find(v => v.id === route.vehicleId)?.name || 'Unknown'} •
                    Driver: {drivers.find(d => d.id === route.driverId)?.name || 'Unknown'}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Fleet Status */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">🚐 Fleet Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map(vehicle => (
            <div key={vehicle.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-medium">
                    {getVehicleTypeIcon(vehicle.type)} {vehicle.name}
                  </div>
                  <div className="text-sm text-gray-600">{vehicle.licensePlate}</div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                  {vehicle.status.replace('_', ' ')}
                </span>
              </div>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">Fuel:</span>
                  <span className={vehicle.fuelLevel < 30 ? 'text-red-600 font-medium' : ''}>
                    {vehicle.fuelLevel}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Capacity:</span>
                  <span>{vehicle.capacity} passengers</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Vouchers */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">🎫 Recent Vouchers</h3>
        {vouchers.slice(0, 5).map(voucher => (
          <div key={voucher.id} className="border-b last:border-b-0 py-3">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">
                  {getVoucherTypeIcon(voucher.type)} {voucher.clientName}
                </div>
                <div className="text-sm text-gray-600">
                  {voucher.type.replace('_', ' ')} • ${voucher.amount} • {voucher.purpose}
                </div>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(voucher.status)}`}>
                {voucher.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFleet = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">🚐 Vehicle Fleet</h3>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="all">All Vehicles</option>
          <option value="available">Available</option>
          <option value="in_use">In Use</option>
          <option value="maintenance">Maintenance</option>
          <option value="out_of_service">Out of Service</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {vehicles
          .filter(v => filterStatus === 'all' || v.status === filterStatus)
          .map(vehicle => (
            <div key={vehicle.id} className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-semibold">
                    {getVehicleTypeIcon(vehicle.type)} {vehicle.name}
                  </h4>
                  <div className="text-sm text-gray-600">{vehicle.licensePlate}</div>
                </div>
                <span className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(vehicle.status)}`}>
                  {vehicle.status.replace('_', ' ')}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium">{vehicle.type.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Capacity:</span>
                  <span>{vehicle.capacity} passengers</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fuel Level:</span>
                  <span className={vehicle.fuelLevel < 30 ? 'text-red-600 font-medium' : ''}>
                    {vehicle.fuelLevel}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mileage:</span>
                  <span>{vehicle.mileage.toLocaleString()} miles</span>
                </div>
                {vehicle.currentLocation && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span>{vehicle.currentLocation}</span>
                  </div>
                )}
                {vehicle.driverId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Driver:</span>
                    <span>{drivers.find(d => d.id === vehicle.driverId)?.name || 'Unknown'}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t">
                <div className="text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600">Last Maintenance:</span>
                    <span>{new Date(vehicle.lastMaintenance).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Next Maintenance:</span>
                    <span className={
                      new Date(vehicle.nextMaintenance) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                        ? 'text-red-600 font-medium'
                        : ''
                    }>
                      {new Date(vehicle.nextMaintenance).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex space-x-2">
                <button className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm">
                  View Details
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm">
                  Edit
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );

  const renderRoutes = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">🗺️ Transportation Routes</h3>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border rounded px-3 py-2"
        />
      </div>

      {routes.filter(r => r.date === selectedDate).map(route => (
        <div key={route.id} className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h4 className="text-lg font-semibold">{route.name}</h4>
              <div className="text-sm text-gray-600 mt-1">
                {route.startTime} {route.endTime && `- ${route.endTime}`} • {route.distance} miles
              </div>
            </div>
            <span className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(route.status)}`}>
              {route.status.replace('_', ' ')}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-sm text-gray-600">Vehicle</div>
              <div className="font-medium">
                {vehicles.find(v => v.id === route.vehicleId)?.name || 'Unknown'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Driver</div>
              <div className="font-medium">
                {drivers.find(d => d.id === route.driverId)?.name || 'Unknown'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Passengers</div>
              <div className="font-medium">{route.passengerCount}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Stops</div>
              <div className="font-medium">{route.stops.length}</div>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="font-medium mb-3">Route Stops</div>
            <div className="space-y-3">
              {route.stops.map((stop, index) => (
                <div key={stop.id} className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{stop.location}</div>
                        <div className="text-sm text-gray-600">{stop.address}</div>
                        <div className="text-sm text-gray-600">
                          Arrival: {stop.arrivalTime} • {stop.passengers} passenger{stop.passengers !== 1 ? 's' : ''}
                        </div>
                        {stop.notes && (
                          <div className="text-sm text-gray-500 italic mt-1">{stop.notes}</div>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(stop.status)}`}>
                        {stop.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {route.notes && (
            <div className="mt-4 p-3 bg-gray-50 rounded">
              <div className="text-sm font-medium text-gray-700 mb-1">Notes:</div>
              <div className="text-sm text-gray-600">{route.notes}</div>
            </div>
          )}

          <div className="mt-4 flex space-x-2">
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm">
              Track Route
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm">
              Edit Route
            </button>
            {route.status === 'scheduled' && (
              <button className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100 text-sm">
                Cancel
              </button>
            )}
          </div>
        </div>
      ))}

      {routes.filter(r => r.date === selectedDate).length === 0 && (
        <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
          No routes scheduled for {new Date(selectedDate).toLocaleDateString()}
        </div>
      )}
    </div>
  );

  const renderVouchers = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">🎫 Transportation Vouchers</h3>
        <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm">
          + Issue New Voucher
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {vouchers.map(voucher => (
          <div key={voucher.id} className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-lg font-semibold">
                  {getVoucherTypeIcon(voucher.type)} {voucher.clientName}
                </h4>
                <div className="text-sm text-gray-600">ID: {voucher.id}</div>
              </div>
              <span className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(voucher.status)}`}>
                {voucher.status}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium">{voucher.type.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium">${voucher.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Purpose:</span>
                <span>{voucher.purpose}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Issue Date:</span>
                <span>{new Date(voucher.issueDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Expiry Date:</span>
                <span className={
                  new Date(voucher.expiryDate) < new Date()
                    ? 'text-red-600 font-medium'
                    : ''
                }>
                  {new Date(voucher.expiryDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Approved By:</span>
                <span>{voucher.approvedBy}</span>
              </div>
              {voucher.usedDate && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Used Date:</span>
                  <span>{new Date(voucher.usedDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            <div className="mt-4 flex space-x-2">
              <button className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm">
                View Details
              </button>
              {voucher.status === 'active' && (
                <button className="px-4 py-2 bg-green-50 text-green-600 border border-green-200 rounded hover:bg-green-100 text-sm">
                  Mark Used
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDrivers = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">👨‍✈️ Drivers</h3>
        <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm">
          + Add Driver
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {drivers.map(driver => (
          <div key={driver.id} className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-lg font-semibold">{driver.name}</h4>
                <div className="text-sm text-gray-600">{driver.phone}</div>
              </div>
              <span className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(driver.status)}`}>
                {driver.status.replace('_', ' ')}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">License #:</span>
                <span className="font-medium">{driver.licenseNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">License Expiry:</span>
                <span className={
                  new Date(driver.licenseExpiry) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
                    ? 'text-red-600 font-medium'
                    : ''
                }>
                  {new Date(driver.licenseExpiry).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Hours This Week:</span>
                <span>{driver.hoursThisWeek} hours</span>
              </div>
              {driver.currentVehicleId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Vehicle:</span>
                  <span>{vehicles.find(v => v.id === driver.currentVehicleId)?.name || 'Unknown'}</span>
                </div>
              )}
            </div>

            <div className="mt-4 flex space-x-2">
              <button className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm">
                View Schedule
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm">
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMaintenance = () => {
    const maintenanceVehicles = vehicles.map(v => {
      const nextMaintenance = new Date(v.nextMaintenance);
      const today = new Date();
      const daysUntil = Math.floor((nextMaintenance.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      return {
        ...v,
        daysUntilMaintenance: daysUntil,
        needsAttention: daysUntil <= 30 || v.fuelLevel < 30
      };
    });

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold mb-4">🔧 Maintenance Management</h3>

        {/* Urgent Alerts */}
        {maintenanceVehicles.some(v => v.needsAttention) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-red-800 mb-2">⚠️ Urgent Attention Required</h4>
            <div className="space-y-2">
              {maintenanceVehicles
                .filter(v => v.needsAttention)
                .map(vehicle => (
                  <div key={vehicle.id} className="text-sm text-red-700">
                    • {vehicle.name}:
                    {vehicle.fuelLevel < 30 && ` Low fuel (${vehicle.fuelLevel}%)`}
                    {vehicle.fuelLevel < 30 && vehicle.daysUntilMaintenance <= 30 && ' • '}
                    {vehicle.daysUntilMaintenance <= 30 &&
                      ` Maintenance due in ${vehicle.daysUntilMaintenance} days`}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Maintenance Schedule */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {maintenanceVehicles.map(vehicle => (
            <div key={vehicle.id} className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-semibold">
                    {getVehicleTypeIcon(vehicle.type)} {vehicle.name}
                  </h4>
                  <div className="text-sm text-gray-600">{vehicle.licensePlate}</div>
                </div>
                {vehicle.needsAttention && (
                  <span className="px-3 py-1 rounded text-sm font-medium bg-red-100 text-red-600">
                    Attention Required
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Fuel Level</span>
                    <span className={vehicle.fuelLevel < 30 ? 'text-red-600 font-medium' : ''}>
                      {vehicle.fuelLevel}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        vehicle.fuelLevel < 30 ? 'bg-red-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${vehicle.fuelLevel}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Mileage:</span>
                    <span>{vehicle.mileage.toLocaleString()} miles</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Last Maintenance:</span>
                    <span>{new Date(vehicle.lastMaintenance).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Next Maintenance:</span>
                    <span className={vehicle.daysUntilMaintenance <= 30 ? 'text-red-600 font-medium' : ''}>
                      {new Date(vehicle.nextMaintenance).toLocaleDateString()}
                      <span className="text-xs ml-1">
                        ({vehicle.daysUntilMaintenance} days)
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex space-x-2">
                <button className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm">
                  Schedule Service
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm">
                  History
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (currentView) {
      case 'overview':
        return renderOverview();
      case 'fleet':
        return renderFleet();
      case 'routes':
        return renderRoutes();
      case 'vouchers':
        return renderVouchers();
      case 'drivers':
        return renderDrivers();
      case 'maintenance':
        return renderMaintenance();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="p-6">
      {renderMetrics()}
      {renderViewTabs()}
      {renderContent()}
    </div>
  );
};

export default TransportationManagement;
