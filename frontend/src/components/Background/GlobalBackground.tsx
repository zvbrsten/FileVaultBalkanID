import React from 'react';
import Iridescence from './Iridescence';

interface GlobalBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

const GlobalBackground: React.FC<GlobalBackgroundProps> = ({ children, className = '' }) => {
  return (
    <div className={`relative min-h-screen ${className}`}>
      {/* Iridescence Background */}
      <div className="fixed inset-0 z-0">
        <Iridescence
          color={[0.2, 0.4, 0.8]} // Blue-ish color
          mouseReact={true}
          amplitude={0.1}
          speed={0.8}
        />
      </div>
      
      {/* Content Overlay with better centering */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  );
};

export default GlobalBackground;
