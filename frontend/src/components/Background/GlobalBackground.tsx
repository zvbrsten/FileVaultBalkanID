import React from 'react';

interface GlobalBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

const GlobalBackground: React.FC<GlobalBackgroundProps> = ({ children, className = '' }) => {
  return (
    <div className={`relative min-h-screen bg-background transition-colors duration-300 ${className}`}>
      {/* Theme-aware Background */}
      <div className="fixed inset-0 z-0">
        {/* Dark theme background */}
        <div className="dark-theme-bg absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        {/* Light theme background */}
        <div className="light-theme-bg absolute inset-0 bg-gradient-to-br from-[#FEFEF8] via-[#FDFCF5] to-[#F2E8D9]" />
      </div>
      
      {/* Content Overlay */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default GlobalBackground;
