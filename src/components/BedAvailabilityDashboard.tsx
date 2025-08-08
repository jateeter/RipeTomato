import React, { useState } from 'react';
import { Bed, BedReservation, ShelterCapacity, Client } from '../types/Shelter';
import { mockBeds, mockReservations, mockCapacity, mockClients } from '../data/mockShelterData';

interface BedAvailabilityDashboardProps {
  onBedSelect?: (bed: Bed) => void;
  onReservationSelect?: (reservation: BedReservation) => void;
}

const BedAvailabilityDashboard: React.FC<BedAvailabilityDashboardProps> = ({
  onBedSelect,
  onReservationSelect
}) => {
  const [beds] = useState<Bed[]>(mockBeds);
  const [reservations] = useState<BedReservation[]>(mockReservations);
  const [capacity] = useState<ShelterCapacity>(mockCapacity);
  const [clients] = useState<Client[]>(mockClients);
  const [filter, setFilter] = useState<'all' | 'available' | 'occupied' | 'maintenance'>('all');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const getBedStatus = (bed: Bed): 'available' | 'reserved' | 'occupied' | 'maintenance' => {
    if (!bed.isActive || bed.maintenanceRequired) return 'maintenance';
    
    const todayReservation = reservations.find(
      res => res.bedId === bed.id && 
      res.reservationDate.toDateString() === selectedDate.toDateString()
    );

    if (!todayReservation) return 'available';
    
    switch (todayReservation.status) {
      case 'checked-in':
        return 'occupied';
      case 'reserved':
        return 'reserved';
      case 'no-show':
      case 'cancelled':
        return 'available';
      default:
        return 'available';
    }
  };

  const getClientForBed = (bed: Bed): Client | null => {
    const reservation = reservations.find(
      res => res.bedId === bed.id && 
      res.reservationDate.toDateString() === selectedDate.toDateString() &&
      (res.status === 'reserved' || res.status === 'checked-in')
    );

    if (!reservation) return null;
    
    return clients.find(client => client.id === reservation.clientId) || null;
  };

  const filteredBeds = beds.filter(bed => {
    if (filter === 'all') return true;
    return getBedStatus(bed) === filter;
  });

  const getBedStatusColor = (status: string): string => {
    switch (status) {
      case 'available':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'reserved':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'occupied':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'maintenance':
        return 'bg-gray-100 border-gray-300 text-gray-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getBedTypeIcon = (type: string): string => {
    switch (type) {
      case 'standard':
        return '🛏️';
      case 'accessible':
        return '♿';
      case 'family':
        return '👨‍👩‍👧‍👦';
      case 'isolation':
        return '🏥';
      default:
        return '🛏️';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bed Availability Dashboard</h1>
            <p className="text-gray-600">{formatDate(selectedDate)}</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <input
              type="date"
              value={selectedDate.toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-2"
            />
            
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="all">All Beds</option>
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
              <option value="occupied">Occupied</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        </div>

        {/* Capacity Overview */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{capacity.totalBeds}</div>
            <div className="text-sm text-blue-800">Total Beds</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">{capacity.availableBeds}</div>
            <div className="text-sm text-green-800">Available</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-600">{capacity.reservedBeds}</div>
            <div className="text-sm text-yellow-800">Reserved</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-red-600">{capacity.occupiedBeds}</div>
            <div className="text-sm text-red-800">Occupied</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-gray-600">{capacity.maintenanceBeds}</div>
            <div className="text-sm text-gray-800">Maintenance</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600">{capacity.waitlistCount}</div>
            <div className="text-sm text-purple-800">Waitlist</div>
          </div>
        </div>

        {/* Utilization Rate */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Utilization Rate</span>
            <span className="text-sm text-gray-600">{Math.round(capacity.utilizationRate * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${capacity.utilizationRate * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Bed Grid */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Bed Status Overview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredBeds.map(bed => {
            const status = getBedStatus(bed);
            const client = getClientForBed(bed);
            const reservation = reservations.find(
              res => res.bedId === bed.id && 
              res.reservationDate.toDateString() === selectedDate.toDateString()
            );

            return (
              <div
                key={bed.id}
                className={`border-2 rounded-lg p-4 cursor-pointer hover:shadow-md transition-all ${getBedStatusColor(status)}`}
                onClick={() => {
                  if (onBedSelect) onBedSelect(bed);
                  if (reservation && onReservationSelect) onReservationSelect(reservation);
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getBedTypeIcon(bed.type)}</span>
                    <span className="font-bold text-lg">#{bed.number}</span>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-white bg-opacity-50 capitalize">
                    {status}
                  </span>
                </div>

                <div className="space-y-1 text-sm">
                  <div><strong>Location:</strong> {bed.location}</div>
                  <div><strong>Type:</strong> {bed.type}</div>
                  {bed.capacity > 1 && (
                    <div><strong>Capacity:</strong> {bed.capacity}</div>
                  )}
                </div>

                {client && (
                  <div className="mt-3 pt-3 border-t border-current border-opacity-30">
                    <div className="font-medium">{client.firstName} {client.lastName}</div>
                    <div className="text-xs opacity-75">
                      {reservation?.status === 'checked-in' ? 'Checked In' : 'Reserved'}
                      {reservation?.checkInTime && (
                        <span className="ml-2">
                          @ {reservation.checkInTime.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      )}
                    </div>
                    {reservation?.priority === 'high' && (
                      <div className="text-xs mt-1">
                        <span className="bg-red-500 text-white px-2 py-1 rounded-full">
                          High Priority
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {bed.maintenanceRequired && (
                  <div className="mt-3 pt-3 border-t border-current border-opacity-30">
                    <div className="text-xs font-medium text-red-600">
                      ⚠️ Maintenance Required
                    </div>
                  </div>
                )}

                {bed.notes && (
                  <div className="mt-2 text-xs opacity-75">
                    <strong>Notes:</strong> {bed.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredBeds.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">🛏️</div>
            <p>No beds match the selected filter</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Status Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-300 rounded border border-green-400"></div>
            <span className="text-sm">Available</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-300 rounded border border-yellow-400"></div>
            <span className="text-sm">Reserved</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-300 rounded border border-red-400"></div>
            <span className="text-sm">Occupied</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-300 rounded border border-gray-400"></div>
            <span className="text-sm">Maintenance</span>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="font-medium mb-2">Bed Types</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-lg">🛏️</span>
              <span className="text-sm">Standard</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg">♿</span>
              <span className="text-sm">Accessible</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg">👨‍👩‍👧‍👦</span>
              <span className="text-sm">Family</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg">🏥</span>
              <span className="text-sm">Isolation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BedAvailabilityDashboard;