import React from 'react';

export type ResolutionMode = {
  name: string;
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
};

export const MODES: ResolutionMode[] = [
  { name: 'Portrait HD', width: 720, height: 1280, orientation: 'portrait' },
  { name: 'Landscape HD', width: 1280, height: 720, orientation: 'landscape' },
  { name: 'Portrait FHD', width: 1080, height: 1920, orientation: 'portrait' },
  { name: 'Landscape FHD', width: 1920, height: 1080, orientation: 'landscape' },
];

interface ModeSelectorProps {
  currentMode: ResolutionMode;
  onModeSelect: (mode: ResolutionMode) => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ currentMode, onModeSelect }) => {
  return (
    <div className="flex flex-row flex-wrap justify-center gap-2 md:gap-4 bg-black/60 px-3 py-2 md:px-6 md:py-4 rounded-[2rem] backdrop-blur-sm pointer-events-auto max-w-full">
      {MODES.map(mode => (
        <button
          key={mode.name}
          onClick={() => onModeSelect(mode)}
          className={`px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-semibold rounded-full transition-all duration-200 whitespace-nowrap ${
            currentMode.name === mode.name
              ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)]'
              : 'bg-transparent text-white/70 hover:bg-white/10 hover:text-white'
          }`}
        >
          {mode.name}
        </button>
      ))}
    </div>
  );
};
