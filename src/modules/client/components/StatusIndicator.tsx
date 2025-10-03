import React from 'react';

interface StatusIndicatorProps {
  status: 'available' | 'occupied' | 'pending' | 'unavailable';
  size?: 'small' | 'medium' | 'large';
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  size = 'medium'
}) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
  };

  const statusConfig = {
    available: { color: 'bg-green-500', label: '✓' },
    occupied: { color: 'bg-blue-500', label: '●' },
    pending: { color: 'bg-yellow-500', label: '...' },
    unavailable: { color: 'bg-red-500', label: '✗' }
  };

  const config = statusConfig[status];

  return (
    <div
      className={`
        ${sizeClasses[size]}
        ${config.color}
        rounded-full
        flex
        items-center
        justify-center
        text-white
        font-bold
        text-xl
      `}
    >
      {config.label}
    </div>
  );
};
