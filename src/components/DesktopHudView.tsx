import React, { useState } from 'react';
import {
  Maximize2,
  Play,
  Pause,
  AlertOctagon,
  GripHorizontal,
  Pin,
  PinOff,
  ChevronDown,
  ChevronUp,
  X,
  Crosshair,
  RotateCcw,
} from 'lucide-react';
import { DayStatus, CurrentActivity, IntervalAnalysis } from '../types';
import { soundEngine } from '../services/audio';
import { api } from '../services/api';

interface DesktopHudViewProps {
  dayStatus: DayStatus;
  currentActivity: CurrentActivity;
  isPaused: boolean;
  onTogglePause: () => void;
  activeNotification: IntervalAnalysis | null;
  onDismissNotification: () => void;
  onStartFocus?: (minutes: number) => void;
}

function formatHoursMinutes(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  return `${h}h ${m}m`;
}

function formatSeconds(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export const DesktopHudView: React.FC<DesktopHudViewProps> = ({
  dayStatus,
  currentActivity,
  isPaused,
  onTogglePause,
  activeNotification,
  onDismissNotification,
  onStartFocus,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(true);

  const isCritical = dayStatus.percentage_elapsed >= 85;
  const isDying = dayStatus.percentage_elapsed >= 70;

  // Toggle minimized pill vs full HUD size in native window
  const handleToggleMinimize = async (targetMinimized: boolean) => {
    soundEngine.playFocusClick();
    setIsMinimized(targetMinimized);
    await api.setHudSize(targetMinimized);
  };

  const handleToggleAlwaysOnTop = async () => {
    soundEngine.playFocusClick();
    const next = !isAlwaysOnTop;
    setIsAlwaysOnTop(next);
    await api.setHudAlwaysOnTop(next);
  };

  const handleOpenDashboard = async () => {
    soundEngine.playFocusClick();
    await api.openDashboard();
  };

  const handleCloseHud = async () => {
    soundEngine.playFocusClick();
    await api.setHudVisible(false);
  };

  const handleResetPosition = async () => {
    soundEngine.playFocusClick();
    await api.resetHudPosition();
  };

  return (
    <div
      data-tauri-drag-region
      className="w-full h-screen p-1.5 select-none overflow-hidden flex flex-col justify-center items-center bg-transparent"
    >
      {isMinimized ? (
        /* MINIMIZED TACTILE PILL DIAL */
        <div
          data-tauri-drag-region
          className="w-full h-full neu-panel px-3 py-1.5 rounded-full flex items-center justify-between cursor-move shadow-[8px_8px_20px_rgba(0,0,0,0.65),-4px_-4px_12px_rgba(255,255,255,0.06)] border border-white/10 group backdrop-blur-md"
          title="Drag anywhere to move across desktop • Click arrow to expand"
        >
          <div className="flex items-center gap-2" data-tauri-drag-region>
            <GripHorizontal className="w-3.5 h-3.5 text-[#787988] group-hover:text-amber-400 shrink-0" />
            <div
              className={`w-2 h-2 rounded-full shadow-sm ${
                isCritical
                  ? 'bg-red-500 shadow-red-500/80 animate-pulse'
                  : isDying
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
            />
            <span className="font-mono font-black text-xs text-white tracking-wider">
              {formatHoursMinutes(dayStatus.remaining_seconds)}
            </span>
            <span className="neu-sunken px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold text-[#a1a1aa]">
              {dayStatus.percentage_elapsed}%
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handleToggleMinimize(false)}
              className="p-1 neu-btn rounded-full text-[#888998] hover:text-white"
              title="Expand HUD"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleOpenDashboard}
              className="p-1 neu-btn rounded-full text-[#888998] hover:text-white"
              title="Open Main Command Dashboard"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* EXPANDED DESKTOP FLOATING INSTRUMENT */
        <div
          data-tauri-drag-region
          className="w-full h-full neu-panel p-3.5 rounded-3xl border border-white/10 shadow-[10px_10px_28px_rgba(0,0,0,0.6),-6px_-6px_16px_rgba(255,255,255,0.07)] flex flex-col justify-between cursor-move backdrop-blur-md"
          title="Drag anywhere to move across your Windows desktop"
        >
          {/* Header Bar */}
          <div
            data-tauri-drag-region
            className="flex items-center justify-between pb-2 border-b border-white/[0.06] cursor-move"
          >
            <div className="flex items-center gap-2" data-tauri-drag-region>
              <GripHorizontal className="w-4 h-4 text-[#787988] hover:text-amber-400 shrink-0 cursor-move" />
              <div
                className={`w-2.5 h-2.5 rounded-full shadow-sm ${
                  isCritical
                    ? 'bg-red-500 shadow-red-500/80 animate-pulse'
                    : isDying
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
              />
              <span className="font-display font-black text-xs tracking-wider text-white uppercase">
                YDID HUD
              </span>
              <span className="text-[10px] font-mono text-[#888998]">
                {dayStatus.current_time.slice(0, 5)}
              </span>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleResetPosition}
                className="p-1 neu-btn rounded-lg text-[#888998] hover:text-white"
                title="Reset HUD to default bottom-right screen position"
              >
                <RotateCcw className="w-3 h-3" />
              </button>

              <button
                onClick={handleToggleAlwaysOnTop}
                className={`p-1 neu-btn rounded-lg ${
                  isAlwaysOnTop ? 'text-amber-400' : 'text-[#888998]'
                }`}
                title={isAlwaysOnTop ? 'Always on Top (Active)' : 'Always on Top (Disabled)'}
              >
                {isAlwaysOnTop ? <Pin className="w-3 h-3" /> : <PinOff className="w-3 h-3" />}
              </button>

              <button
                onClick={() => handleToggleMinimize(true)}
                className="p-1 neu-btn rounded-lg text-[#888998] hover:text-white"
                title="Minimize to floating pill"
              >
                <ChevronDown className="w-3 h-3" />
              </button>

              <button
                onClick={handleOpenDashboard}
                className="p-1 neu-btn rounded-lg text-[#888998] hover:text-white"
                title="Open Main Command Dashboard"
              >
                <Maximize2 className="w-3 h-3" />
              </button>

              <button
                onClick={handleCloseHud}
                className="p-1 neu-btn rounded-lg text-[#888998] hover:text-red-400"
                title="Hide HUD (can reopen from system tray)"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Active Notification Banner or Main Countdown Screen */}
          {activeNotification ? (
            <div className="neu-sunken bg-red-950/60 border border-red-500/50 p-2.5 my-1 rounded-2xl text-center shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-center gap-1.5 text-red-400 font-display font-black text-xs uppercase mb-1">
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>{activeNotification.headline}</span>
              </div>
              <p className="font-mono text-[10px] text-white truncate mb-2">
                {activeNotification.body}
              </p>
              <button
                onClick={onDismissNotification}
                className="neu-btn neu-btn-accent py-1 px-3 text-[10px] font-mono font-bold text-white w-full rounded-xl"
              >
                ACKNOWLEDGE
              </button>
            </div>
          ) : (
            <div
              data-tauri-drag-region
              className="neu-sunken p-2.5 rounded-2xl my-auto text-center cursor-move"
            >
              <div className="text-[9px] font-mono tracking-widest text-[#787988] uppercase font-bold mb-0.5">
                REMAINING TODAY
              </div>
              <div className="font-mono font-black text-3xl tracking-wider text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                {formatSeconds(dayStatus.remaining_seconds)}
              </div>

              {/* Recessed Life Meter */}
              <div className="neu-sunken h-3 w-full p-0.5 rounded-full mt-2 relative overflow-hidden">
                <div
                  className={`h-full rounded-full meter-stripes transition-all duration-500 ${
                    isCritical
                      ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                      : isDying
                      ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                      : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, dayStatus.percentage_elapsed))}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] font-mono text-[#888998] mt-1 px-1">
                <span>{dayStatus.percentage_elapsed}% GONE</span>
                <span className="truncate max-w-[140px] font-semibold">{dayStatus.escalating_message}</span>
              </div>
            </div>
          )}

          {/* Bottom Bar: Active Process & Action Controls */}
          <div
            data-tauri-drag-region
            className="pt-1.5 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono"
          >
            <div className="flex items-center gap-1.5 truncate max-w-[170px]">
              <span className="w-1.5 h-1.5 rounded-full bg-white/40 shrink-0" />
              <span className="text-[#d4d4d8] font-bold truncate">
                {currentActivity.domain || currentActivity.application}
              </span>
              <span
                className={`text-[8px] uppercase px-1.5 py-0.2 rounded-full border ${
                  currentActivity.category === 'productive'
                    ? 'text-emerald-400 border-emerald-500/30 bg-emerald-950/40'
                    : currentActivity.category === 'distraction'
                    ? 'text-red-400 border-red-500/30 bg-red-950/40'
                    : 'text-blue-400 border-blue-500/30 bg-blue-950/40'
                }`}
              >
                {currentActivity.category.slice(0, 4)}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {onStartFocus && (
                <button
                  onClick={() => onStartFocus(25)}
                  className="neu-btn px-2 py-1 text-[9px] font-mono text-emerald-400 rounded-lg flex items-center gap-1"
                  title="Start 25-minute focus session"
                >
                  <Crosshair className="w-3 h-3 text-emerald-400" />
                  <span>FOCUS</span>
                </button>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePause();
                }}
                className="p-1 neu-btn rounded-lg text-[#888998] hover:text-white"
                title={isPaused ? 'Resume tracking' : 'Pause tracking'}
              >
                {isPaused ? <Play className="w-3.5 h-3.5 text-amber-400" /> : <Pause className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
