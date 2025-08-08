import React, { useState, useMemo, useEffect } from 'react';
import { Event } from '../types/Event';
import EventModal from './EventModal';
import GoogleAuth from './GoogleAuth';
import SyncStatus from './SyncStatus';
import { useGoogleCalendarSync } from '../hooks/useGoogleCalendarSync';

interface WeeklyCalendarProps {
  events?: Event[];
}

const WeeklyCalendar: React.FC<WeeklyCalendarProps> = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const {
    events,
    syncState,
    isGoogleSignedIn,
    syncFromGoogleCalendar,
    handleAuthChange
  } = useGoogleCalendarSync();

  const { weekStart, weekEnd, weekDays, weekEvents } = useMemo(() => {
    const start = new Date(currentWeek);
    start.setDate(start.getDate() - start.getDay());
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    
    const filteredEvents = events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate >= start && eventDate <= end;
    });
    
    return {
      weekStart: start,
      weekEnd: end,
      weekDays: days,
      weekEvents: filteredEvents
    };
  }, [currentWeek, events]);

  const getEventsForDay = (day: Date) => {
    return weekEvents.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === day.toDateString();
    });
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newWeek);
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  const handleSync = async () => {
    if (isGoogleSignedIn) {
      try {
        await syncFromGoogleCalendar(weekStart, weekEnd);
      } catch (error) {
        console.error('Sync failed:', error);
      }
    }
  };

  // Auto-sync when week changes or user signs in
  useEffect(() => {
    if (isGoogleSignedIn) {
      handleSync();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWeek, isGoogleSignedIn]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      community: 'bg-blue-100 text-blue-800 border-blue-200',
      sports: 'bg-green-100 text-green-800 border-green-200',
      arts: 'bg-purple-100 text-purple-800 border-purple-200',
      business: 'bg-gray-100 text-gray-800 border-gray-200',
      education: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      family: 'bg-pink-100 text-pink-800 border-pink-200',
      food: 'bg-orange-100 text-orange-800 border-orange-200',
      other: 'bg-indigo-100 text-indigo-800 border-indigo-200'
    };
    return colors[category as keyof typeof colors] || colors.other;
  };

  const getSyncStatusIcon = (event: Event) => {
    if (!event.syncStatus) return null;
    
    switch (event.syncStatus) {
      case 'synced':
        return <span className="text-xs text-green-600">🔄</span>;
      case 'pending':
        return <span className="text-xs text-yellow-600">⏳</span>;
      case 'error':
        return <span className="text-xs text-red-600">⚠️</span>;
      case 'local-only':
        return <span className="text-xs text-gray-600">📱</span>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Google Calendar Integration Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Google Calendar Integration</h2>
        <div className="space-y-4">
          <GoogleAuth onAuthChange={handleAuthChange} />
          <SyncStatus 
            syncState={syncState} 
            isGoogleSignedIn={isGoogleSignedIn}
            onSync={handleSync}
          />
        </div>
      </div>

      {/* Main Calendar */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Idaho Community Events</h1>
              <p className="text-blue-100">
                {weekStart.toLocaleDateString()} - {weekEnd.toLocaleDateString()}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => navigateWeek('prev')}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-400 rounded-lg transition-colors"
              >
                ← Previous
              </button>
              <button
                onClick={() => setCurrentWeek(new Date())}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-400 rounded-lg transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => navigateWeek('next')}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-400 rounded-lg transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-7 gap-0 border-l border-gray-200">
          {weekDays.map((day, index) => {
            const dayEvents = getEventsForDay(day);
            const isToday = day.toDateString() === new Date().toDateString();
            
            return (
              <div
                key={index}
                className={`border-r border-b border-gray-200 min-h-[300px] ${
                  isToday ? 'bg-blue-50' : 'bg-white'
                }`}
              >
                <div className={`p-3 border-b border-gray-200 ${
                  isToday ? 'bg-blue-100' : 'bg-gray-50'
                }`}>
                  <div className="text-sm font-medium text-gray-600">
                    {day.toLocaleDateString([], { weekday: 'long' })}
                  </div>
                  <div className={`text-lg font-bold ${
                    isToday ? 'text-blue-600' : 'text-gray-900'
                  }`}>
                    {day.getDate()}
                  </div>
                </div>
                
                <div className="p-2 space-y-1">
                  {dayEvents.map(event => (
                    <div
                      key={event.id}
                      className={`p-2 rounded-md border text-xs cursor-pointer hover:shadow-md transition-shadow ${getCategoryColor(event.category)}`}
                      onClick={() => handleEventClick(event)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-semibold truncate">{event.title}</div>
                        {getSyncStatusIcon(event)}
                      </div>
                      <div className="text-xs opacity-75">
                        {formatTime(new Date(event.startTime))}
                      </div>
                      <div className="text-xs opacity-75 truncate">
                        {event.location}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 bg-gray-50 border-t">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="font-semibold text-gray-700">Categories:</span>
            {Object.entries({
              community: 'Community',
              sports: 'Sports',
              arts: 'Arts',
              business: 'Business',
              education: 'Education',
              family: 'Family',
              food: 'Food'
            }).map(([key, label]) => (
              <span
                key={key}
                className={`px-2 py-1 rounded-full text-xs ${getCategoryColor(key)}`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default WeeklyCalendar;