import { Play, Pause, Settings, Crosshair, Bell, FileText, Pin } from 'lucide-react';
import { soundEngine } from '../services/audio';

interface HeaderProps {
  currentTime: string;
  isPaused: boolean;
  onTogglePause: () => void;
  onOpenFocus: () => void;
  onOpenSettings: () => void;
  onOpenEndOfDay: () => void;
  onOpenNotificationTest: () => void;
  isHudVisible?: boolean;
  onToggleHud?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTime,
  isPaused,
  onTogglePause,
  onOpenFocus,
  onOpenSettings,
  onOpenEndOfDay,
  onOpenNotificationTest,
  isHudVisible = true,
  onToggleHud,
}) => {
  return (
    <header className="neu-panel px-6 py-4 mb-6 flex flex-wrap items-center justify-between gap-4 relative z-20">
      {/* Brand Identity: Rounded-xl lime box with black initial + tech-industrial typography */}
      <div className="flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-[#ccff00] flex items-center justify-center font-black text-black text-lg shadow-[0_0_25px_rgba(204,255,0,0.4)] select-none">
          <span style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Y</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-black text-lg sm:text-xl tracking-tight text-[#ebebeb] uppercase">
              YOUR DAY IS DYING
            </h1>
            <span className="text-[10px] font-mono tracking-widest bg-[#ccff00]/15 text-[#ccff00] px-2 py-0.5 rounded-full border border-[#ccff00]/30 font-bold">
              v4.2
            </span>
          </div>
          <p className="text-[11px] font-mono tracking-[0.2em] text-white/50 uppercase">
            Obsidian // Time Protocol
          </p>
        </div>
      </div>

      {/* Clock & Status: Pill-shaped glass navigation container */}
      <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
        <div className="neu-sunken px-4 py-2 rounded-full flex items-center gap-3 border border-white/10">
          <span
            className={`w-2 h-2 rounded-full inline-block shadow-sm ${
              isPaused
                ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                : 'bg-[#ccff00] shadow-[0_0_10px_#ccff00] animate-pulse'
            }`}
          />
          <span className="font-mono text-xs font-bold tracking-wider text-[#ebebeb]">
            {isPaused ? 'TRACKING PAUSED' : 'SYSTEM ACTIVE'}
          </span>
          <span className="text-white/20">|</span>
          <span className="font-mono text-xs text-[#ccff00] font-bold tracking-widest">{currentTime}</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Pause / Resume */}
          <button
            onClick={() => {
              soundEngine.playFocusClick();
              onTogglePause();
            }}
            title={isPaused ? 'Resume tracking' : 'Pause tracking'}
            className={`neu-btn px-3 py-1.5 text-xs flex items-center gap-1.5 ${
              isPaused ? 'neu-btn-danger' : ''
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-amber-400" /> : <Pause className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{isPaused ? 'RESUME' : 'PAUSE'}</span>
          </button>

          {/* Focus Mode */}
          <button
            onClick={() => {
              soundEngine.playFocusClick();
              onOpenFocus();
            }}
            className="neu-btn px-3 py-1.5 text-xs text-[#34d399] flex items-center gap-1.5 border-emerald-500/20"
            title="Start Focus Mode"
          >
            <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">FOCUS</span>
          </button>

          {/* Test Interval Notification */}
          <button
            onClick={() => {
              soundEngine.playNormalTick();
              onOpenNotificationTest();
            }}
            className="neu-btn px-3 py-1.5 text-xs text-[#fca5a5] flex items-center gap-1.5 border-red-500/20"
            title="Trigger Context-Aware Notification"
          >
            <Bell className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden lg:inline">INTERRUPT</span>
          </button>

          {/* End-Of-Day Report */}
          <button
            onClick={() => {
              soundEngine.playNormalTick();
              onOpenEndOfDay();
            }}
            className="neu-btn px-3 py-1.5 text-xs text-[#a1a1aa] flex items-center gap-1.5"
            title="View End-of-Day Report"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">REPORT</span>
          </button>

          {/* Native Desktop HUD Widget Toggle */}
          {onToggleHud && (
            <button
              onClick={() => {
                soundEngine.playFocusClick();
                onToggleHud();
              }}
              className={`neu-btn px-3 py-1.5 text-xs flex items-center gap-1.5 ${
                isHudVisible ? 'text-amber-400 border border-amber-500/30' : 'text-[#888998]'
              }`}
              title={isHudVisible ? 'Hide Desktop HUD Widget (Running)' : 'Show Desktop HUD Widget'}
            >
              <Pin className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">HUD WIDGET</span>
            </button>
          )}

          {/* Settings */}
          <button
            onClick={() => {
              soundEngine.playNormalTick();
              onOpenSettings();
            }}
            className="neu-btn p-2 text-[#e4e4e7] rounded-xl"
            title="Open Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
