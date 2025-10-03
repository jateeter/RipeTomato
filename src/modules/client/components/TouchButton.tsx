import React from 'react';

interface TouchButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
  disabled?: boolean;
}

export const TouchButton: React.FC<TouchButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  className = '',
  disabled = false
}) => {
  const baseStyles = `
    min-h-[48px]
    px-6
    py-3
    rounded-lg
    font-semibold
    text-lg
    transition-colors
    active:scale-95
    disabled:opacity-50
    disabled:cursor-not-allowed
  `;

  const variantStyles = {
    primary: 'bg-blue-600 text-white active:bg-blue-700',
    secondary: 'bg-gray-600 text-white active:bg-gray-700',
    outline: 'bg-white border-2 border-gray-300 text-gray-800 active:bg-gray-50'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </button>
  );
};
