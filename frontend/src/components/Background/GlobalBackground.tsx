import React, { useState } from 'react';
import Silk from '../Silk/Silk';
import BackgroundConfig from './BackgroundConfig';

interface GlobalBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

const GlobalBackground: React.FC<GlobalBackgroundProps> = ({ children, className = '' }) => {
  const [backgroundConfig, setBackgroundConfig] = useState({
    speed: 2.5,
    scale: 1.1,
    color: '#1e293b',
    noiseIntensity: 1.0,
    rotation: 0,
  });

  return (
    <div className={`relative min-h-screen ${className}`}>
      {/* Silk Background */}
      <div className="fixed inset-0 z-0">
        <Silk
          speed={backgroundConfig.speed}
          scale={backgroundConfig.scale}
          color={backgroundConfig.color}
          noiseIntensity={backgroundConfig.noiseIntensity}
          rotation={backgroundConfig.rotation}
        />
      </div>
      
      {/* Content Overlay */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Background Configuration */}
      <BackgroundConfig onConfigChange={setBackgroundConfig} />
    </div>
  );
};

export default GlobalBackground;
