import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-lg transition-all duration-300 hover:scale-105 group"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
    >
      <div className="relative w-6 h-6">
        {/* Sun Icon */}
        <Sun 
          className={`absolute inset-0 w-6 h-6 transition-all duration-300 ${
            theme === 'light' 
              ? 'text-amber-600 rotate-0 scale-100' 
              : 'text-amber-500 rotate-90 scale-0'
          }`} 
        />
        {/* Moon Icon */}
        <Moon 
          className={`absolute inset-0 w-6 h-6 transition-all duration-300 ${
            theme === 'dark' 
              ? 'text-blue-300 rotate-0 scale-100' 
              : 'text-blue-400 rotate-90 scale-0'
          }`} 
        />
      </div>
      
      {/* Hover effect background */}
      <div className="absolute inset-0 rounded-lg bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </button>
  );
};

export default ThemeToggle;
