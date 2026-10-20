import { Play, Pause, Maximize2, Settings, Crosshair, Bell, FileText, Pin } from 'lucide-react';
import { soundEngine } from '../services/audio';

interface HeaderProps {
  currentTime: string;
  isPaused: boolean;
  onTogglePause: () => void;
  onOpenFocus: () => void;
  onOpenSettings: () => void;
  onOpenEndOfDay: () => void;
  onOpenNotificationTest: () => void;
  onToggleWidgetMode: () => void;
  isCornerWidgetVisible?: boolean;
  onToggleCornerWidget?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTime,
  isPaused,
  onTogglePause,
  onOpenFocus,
  onOpenSettings,
  onOpenEndOfDay,
  onOpenNotificationTest,
  onToggleWidgetMode,
  isCornerWidgetVisible = true,
  onToggleCornerWidget,
}) => {
  return (
    <header className="neu-panel px-6 py-4 mb-6 flex flex-wrap items-center justify-between gap-4">
      {/* Brand Identity */}
      <div className="flex items-center gap-3.5">
        <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center shadow-[0_0_12px_rgba(239,68,68,0.6)] animate-warning-pulse">
          <div className="w-2 h-2 rounded-full bg-white/80" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-black text-lg sm:text-xl tracking-wider text-white uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
              YOUR DAY IS DYING
            </h1>
            <span className="text-[10px] font-mono tracking-widest bg-[#111216] text-red-400 px-2 py-0.5 rounded-md border border-white/5 font-bold shadow-inner">
              YDID
            </span>
          </div>
          <p className="text-[11px] font-mono tracking-widest text-[#787985] uppercase">
            Time won't wait.
          </p>
        </div>
      </div>

      {/* Clock & Status */}
      <div className="flex items-center gap-4">
        <div className="neu-sunken px-3.5 py-1.5 rounded-xl flex items-center gap-2.5">
          <div className={`w-2 h-2 rounded-full shadow-sm ${isPaused ? 'bg-amber-400 shadow-amber-400/50' : 'bg-emerald-400 shadow-emerald-400/50'}`} />
          <span className="font-mono text-xs font-bold tracking-wider text-[#d4d4d8]">
            {isPaused ? 'TRACKING PAUSED' : 'TRACKING ACTIVE'}
          </span>
          <span className="text-[#3f3f50]">|</span>
          <span className="font-mono text-xs text-[#a1a1aa] font-semibold tracking-wider">{currentTime}</span>
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

          {/* Floating Widget Mode (Compact Window) */}
          <button
            onClick={() => {
              soundEngine.playNormalTick();
              onToggleWidgetMode();
            }}
            className="neu-btn px-3 py-1.5 text-xs text-[#e4e4e7] flex items-center gap-1.5"
            title="Switch to Compact Desktop Widget View"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">MINI</span>
          </button>

          {/* Floating Corner Pin HUD */}
          {onToggleCornerWidget && (
            <button
              onClick={() => {
                soundEngine.playFocusClick();
                onToggleCornerWidget();
              }}
              className={`neu-btn px-3 py-1.5 text-xs flex items-center gap-1.5 ${
                isCornerWidgetVisible ? 'text-amber-400' : 'text-[#888998]'
              }`}
              title={isCornerWidgetVisible ? 'Hide Corner Pin HUD' : 'Show Corner Pin HUD'}
            >
              <Pin className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PIN HUD</span>
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
