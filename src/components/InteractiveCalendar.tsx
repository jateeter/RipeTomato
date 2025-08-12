/**
 * Interactive Calendar Widget
 * 
 * Calendar component for facilities with occupancy tracking,
 * bed registration scheduling, and interactive data visualization.
 * 
 * @license MIT
 */

import React, { useState, useEffect } from 'react';
import { ShelterFacility, shelterDataService } from '../services/shelterDataService';
import { BedRegistration } from './ClientBedRegistrationModal';

interface CalendarDay {
  date: Date;
  dayNumber: number;
  isToday: boolean;
  isCurrentMonth: boolean;
  registrations: BedRegistration[];
  occupancyRate: number;
  availableBeds: number;
  events: CalendarEvent[];
}

interface CalendarEvent {
  id: string;
  type: 'check_in' | 'check_out' | 'maintenance' | 'inspection' | 'staff_event';
  title: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  priority: 'low' | 'medium' | 'high';
  assignedTo?: string;
}

interface InteractiveCalendarProps {
  shelter?: ShelterFacility;
  onDateSelect?: (date: Date, availableBeds: number) => void;
  onEventSelect?: (event: CalendarEvent) => void;
  showOccupancy?: boolean;
  showEvents?: boolean;
  userRole: 'manager' | 'staff' | 'supervisor';
  height?: string;
}

export const InteractiveCalendar: React.FC<InteractiveCalendarProps> = ({
  shelter,
  onDateSelect,
  onEventSelect,
  showOccupancy = true,
  showEvents = true,
  userRole,
  height = '500px'
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  const [registrations, setRegistrations] = useState<BedRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  useEffect(() => {
    loadCalendarData();
  }, [currentDate, shelter]);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      
      // Load existing registrations from localStorage (in real app, from API/Solid Pod)
      const storedRegistrations = loadStoredRegistrations();
      setRegistrations(storedRegistrations);
      
      // Generate calendar days for current month
      const days = generateCalendarDays(currentDate, storedRegistrations);
      setCalendarData(days);
      
    } catch (error) {
      console.error('Failed to load calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStoredRegistrations = (): BedRegistration[] => {
    const registrations: BedRegistration[] = [];
    
    // Load from localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('bed_registration_')) {
        try {
          const registration = JSON.parse(localStorage.getItem(key) || '{}');
          registrations.push({
            ...registration,
            checkInDate: new Date(registration.checkInDate),
            expectedCheckOutDate: registration.expectedCheckOutDate 
              ? new Date(registration.expectedCheckOutDate) 
              : undefined,
            actualCheckOutDate: registration.actualCheckOutDate 
              ? new Date(registration.actualCheckOutDate) 
              : undefined,
            registrationDate: new Date(registration.registrationDate)
          });
        } catch (error) {
          console.error('Failed to parse registration:', error);
        }
      }
    }
    
    // Filter by shelter if provided
    if (shelter) {
      return registrations.filter(reg => reg.shelterId === shelter.id);
    }
    
    return registrations;
  };

  const generateCalendarDays = (date: Date, registrations: BedRegistration[]): CalendarDay[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // Get first day of month and adjust for Monday start
    const firstDayOfMonth = new Date(year, month, 1);
    const startDate = new Date(firstDayOfMonth);
    const dayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // Adjust for Monday start
    startDate.setDate(startDate.getDate() - dayOfWeek);
    
    // Generate 42 days (6 weeks)
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 42; i++) {
      const dayDate = new Date(startDate);
      dayDate.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = dayDate.getMonth() === month;
      const isToday = dayDate.getTime() === today.getTime();
      
      // Get registrations for this day
      const dayRegistrations = registrations.filter(reg => {
        const checkIn = new Date(reg.checkInDate);
        checkIn.setHours(0, 0, 0, 0);
        
        const checkOut = reg.expectedCheckOutDate 
          ? new Date(reg.expectedCheckOutDate)
          : new Date(checkIn.getTime() + 30 * 24 * 60 * 60 * 1000); // Default 30 days
        checkOut.setHours(0, 0, 0, 0);
        
        return dayDate >= checkIn && dayDate <= checkOut && reg.status === 'active';
      });
      
      // Calculate occupancy
      const totalCapacity = shelter?.capacity.total || 100;
      const occupiedBeds = dayRegistrations.length;
      const occupancyRate = occupiedBeds / totalCapacity;
      const availableBeds = totalCapacity - occupiedBeds;
      
      // Generate mock events
      const events = generateMockEvents(dayDate, isCurrentMonth);
      
      days.push({
        date: dayDate,
        dayNumber: dayDate.getDate(),
        isToday,
        isCurrentMonth,
        registrations: dayRegistrations,
        occupancyRate,
        availableBeds,
        events
      });
    }
    
    return days;
  };

  const generateMockEvents = (date: Date, isCurrentMonth: boolean): CalendarEvent[] => {
    if (!isCurrentMonth || Math.random() > 0.3) return [];
    
    const events: CalendarEvent[] = [];
    const eventTypes = ['maintenance', 'inspection', 'staff_event'];
    
    // Random chance of having events
    if (Math.random() > 0.7) {
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)] as CalendarEvent['type'];
      const eventTitles: Record<string, string[]> = {
        maintenance: ['HVAC Maintenance', 'Plumbing Repair', 'Fire Safety Check', 'Deep Cleaning'],
        inspection: ['Health Inspection', 'Fire Marshall Visit', 'Building Inspection', 'Safety Audit'],
        staff_event: ['Staff Meeting', 'Training Session', 'Team Building', 'Policy Review'],
        check_in: ['Client Check-in', 'Emergency Admission', 'Transfer Arrival'],
        check_out: ['Client Check-out', 'Planned Departure', 'Transfer Out']
      };
      
      events.push({
        id: `event_${date.getTime()}_${Math.random().toString(36).substr(2, 6)}`,
        type: eventType,
        title: eventTitles[eventType][Math.floor(Math.random() * eventTitles[eventType].length)],
        description: `Scheduled ${eventType.replace('_', ' ')} event`,
        startTime: '09:00',
        endTime: '11:00',
        priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as CalendarEvent['priority'],
        assignedTo: userRole
      });
    }
    
    return events;
  };

  const handleDateClick = (day: CalendarDay) => {
    setSelectedDate(day.date);
    onDateSelect?.(day.date, day.availableBeds);
  };

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    onEventSelect?.(event);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const getOccupancyColor = (rate: number): string => {
    if (rate >= 1.0) return 'bg-red-500';
    if (rate >= 0.85) return 'bg-yellow-500';
    if (rate >= 0.5) return 'bg-green-500';
    return 'bg-blue-500';
  };

  const getEventColor = (event: CalendarEvent): string => {
    const colors = {
      check_in: 'bg-green-100 text-green-800 border-green-300',
      check_out: 'bg-red-100 text-red-800 border-red-300',
      maintenance: 'bg-orange-100 text-orange-800 border-orange-300',
      inspection: 'bg-purple-100 text-purple-800 border-purple-300',
      staff_event: 'bg-blue-100 text-blue-800 border-blue-300'
    };
    return colors[event.type];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-lg border">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow border" style={{ height }}>
      {/* Calendar Header */}
      <div className="px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            {shelter && (
              <div className="text-sm text-gray-600">
                {shelter.name} • Capacity: {shelter.capacity.total}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setViewMode('month')}
                className={`px-2 py-1 text-xs rounded ${
                  viewMode === 'month' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-2 py-1 text-xs rounded ${
                  viewMode === 'week' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Week
              </button>
            </div>
            
            <button
              onClick={() => navigateMonth('prev')}
              className="p-1 text-gray-600 hover:text-gray-800"
            >
              ←
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Today
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-1 text-gray-600 hover:text-gray-800"
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-auto" style={{ height: 'calc(100% - 80px)' }}>
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b bg-gray-50 sticky top-0">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-700 border-r last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {calendarData.map((day, index) => (
            <div
              key={index}
              onClick={() => handleDateClick(day)}
              className={`min-h-24 border-r border-b last:border-r-0 cursor-pointer hover:bg-gray-50 relative ${
                !day.isCurrentMonth ? 'bg-gray-25 text-gray-400' : ''
              } ${selectedDate?.getTime() === day.date.getTime() ? 'ring-2 ring-blue-500' : ''} ${
                day.isToday ? 'bg-blue-50' : ''
              }`}
            >
              <div className="p-1">
                {/* Day Number */}
                <div className={`text-sm font-medium ${
                  day.isToday ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''
                }`}>
                  {day.dayNumber}
                </div>

                {/* Occupancy Indicator */}
                {showOccupancy && day.isCurrentMonth && (
                  <div className="mt-1">
                    <div className={`h-1 rounded-full ${getOccupancyColor(day.occupancyRate)} opacity-70`} />
                    <div className="text-xs text-gray-600 mt-1">
                      {day.availableBeds} free
                    </div>
                  </div>
                )}

                {/* Registrations Count */}
                {day.registrations.length > 0 && (
                  <div className="text-xs text-blue-600 mt-1">
                    {day.registrations.length} registered
                  </div>
                )}

                {/* Events */}
                {showEvents && day.events.length > 0 && (
                  <div className="mt-1 space-y-1">
                    {day.events.slice(0, 2).map(event => (
                      <div
                        key={event.id}
                        onClick={(e) => handleEventClick(event, e)}
                        className={`text-xs px-1 py-0.5 rounded border cursor-pointer hover:opacity-80 ${getEventColor(event)}`}
                        title={`${event.title} - ${event.startTime}`}
                      >
                        {event.title}
                      </div>
                    ))}
                    {day.events.length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{day.events.length - 2} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Date Info */}
      {selectedDate && (
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">
                {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              {(() => {
                const dayData = calendarData.find(d => d.date.getTime() === selectedDate.getTime());
                return dayData ? (
                  <div className="text-sm text-gray-600 mt-1">
                    {dayData.availableBeds} beds available • {dayData.registrations.length} active registrations
                    {dayData.events.length > 0 && ` • ${dayData.events.length} events`}
                  </div>
                ) : null;
              })()}
            </div>
            <button
              onClick={() => setSelectedDate(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute top-16 right-4 bg-white border rounded-lg p-2 text-xs space-y-1 opacity-90">
        <div className="font-medium">Occupancy:</div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-1 bg-blue-500 rounded"></div>
          <span>&lt;50%</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-1 bg-green-500 rounded"></div>
          <span>50-84%</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-1 bg-yellow-500 rounded"></div>
          <span>85-99%</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-1 bg-red-500 rounded"></div>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
};