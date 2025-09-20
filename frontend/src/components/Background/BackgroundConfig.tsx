import React, { useState } from 'react';
import { Settings, Palette, Zap, RotateCcw } from 'lucide-react';

interface BackgroundConfigProps {
  onConfigChange: (config: {
    speed: number;
    scale: number;
    color: string;
    noiseIntensity: number;
    rotation: number;
  }) => void;
}

const BackgroundConfig: React.FC<BackgroundConfigProps> = ({ onConfigChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState({
    speed: 2.5,
    scale: 1.1,
    color: '#1e293b',
    noiseIntensity: 1.0,
    rotation: 0,
  });

  const colorPresets = [
    { name: 'Slate', value: '#1e293b' },
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Emerald', value: '#10b981' },
    { name: 'Rose', value: '#f43f5e' },
    { name: 'Amber', value: '#f59e0b' },
  ];

  const handleConfigChange = (newConfig: Partial<typeof config>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    onConfigChange(updatedConfig);
  };

  const resetToDefault = () => {
    const defaultConfig = {
      speed: 2.5,
      scale: 1.1,
      color: '#1e293b',
      noiseIntensity: 1.0,
      rotation: 0,
    };
    setConfig(defaultConfig);
    onConfigChange(defaultConfig);
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-3 rounded-full transition-all duration-300 border border-white/30 shadow-lg"
        title="Background Settings"
      >
        <Settings className="w-5 h-5" />
      </button>

      {/* Configuration Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 bg-white/95 backdrop-blur-sm rounded-lg p-6 w-80 border border-white/20 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Background Settings</h3>
            <button
              onClick={resetToDefault}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              title="Reset to Default"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Color Presets */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Palette className="w-4 h-4 inline mr-1" />
              Color Theme
            </label>
            <div className="grid grid-cols-3 gap-2">
              {colorPresets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => handleConfigChange({ color: preset.value })}
                  className={`p-2 rounded text-xs font-medium transition-all duration-200 ${
                    config.color === preset.value
                      ? 'ring-2 ring-blue-500 bg-blue-50'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                  style={{ backgroundColor: preset.value, color: 'white' }}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Speed Control */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Zap className="w-4 h-4 inline mr-1" />
              Animation Speed: {config.speed.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.1"
              value={config.speed}
              onChange={(e) => handleConfigChange({ speed: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Scale Control */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pattern Scale: {config.scale.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={config.scale}
              onChange={(e) => handleConfigChange({ scale: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Noise Intensity */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Noise Intensity: {config.noiseIntensity.toFixed(1)}
            </label>
            <input
              type="range"
              min="0"
              max="3"
              step="0.1"
              value={config.noiseIntensity}
              onChange={(e) => handleConfigChange({ noiseIntensity: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Close Button */}
          <button
            onClick={() => setIsOpen(false)}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Close
          </button>
        </div>
      )}
    </>
  );
};

export default BackgroundConfig;

