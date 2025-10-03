import React from 'react';

interface SimpleCardProps {
  children: React.ReactNode;
  className?: string;
}

export const SimpleCard: React.FC<SimpleCardProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`
      bg-white
      rounded-lg
      shadow-md
      p-6
      ${className}
    `}>
      {children}
    </div>
  );
};
