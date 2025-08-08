import React from 'react';
import { Event } from '../types/Event';

interface EventModalProps {
  event: Event;
  isOpen: boolean;
  onClose: () => void;
}

const EventModal: React.FC<EventModalProps> = ({ event, isOpen, onClose }) => {
  if (!isOpen) return null;

  const formatDateTime = (date: Date) => {
    return date.toLocaleString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-gray-900">{event.title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          <div className="mb-4">
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getCategoryColor(event.category)}`}>
              {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
            </span>
            {event.isRecurring && (
              <span className="ml-2 inline-block px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 border border-gray-200">
                Recurring
              </span>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">When</h3>
              <p className="text-gray-700">
                <span className="font-medium">Start:</span> {formatDateTime(new Date(event.startTime))}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">End:</span> {formatDateTime(new Date(event.endTime))}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Where</h3>
              <p className="text-gray-700">{event.location}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700 leading-relaxed">{event.description}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Organizer</h3>
              <p className="text-gray-700">{event.organizer}</p>
            </div>

            {event.contact && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Contact</h3>
                <p className="text-gray-700">{event.contact}</p>
              </div>
            )}

            {event.website && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Website</h3>
                <a
                  href={event.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  {event.website}
                </a>
              </div>
            )}

            {event.tags && event.tags.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {event.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventModal;