import React from 'react';
import { Maximize2, Play, Pause, AlertOctagon, GripHorizontal, Minus } from 'lucide-react';
import { DayStatus, CurrentActivity, IntervalAnalysis } from '../types';
import { soundEngine } from '../services/audio';
import { api } from '../services/api';

interface FloatingWidgetViewProps {
  dayStatus: DayStatus;
  currentActivity: CurrentActivity;
  isPaused: boolean;
  onTogglePause: () => void;
  onExpandDashboard: () => void;
  activeNotification: IntervalAnalysis | null;
  onDismissNotification: () => void;
}

function formatSeconds(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export const FloatingWidgetView: React.FC<FloatingWidgetViewProps> = ({
  dayStatus,
  currentActivity,
  isPaused,
  onTogglePause,
  onExpandDashboard,
  activeNotification,
  onDismissNotification,
}) => {
  const isCritical = dayStatus.percentage_elapsed >= 85;
  const isDying = dayStatus.percentage_elapsed >= 70;

  const handleHideToTray = async () => {
    soundEngine.playFocusClick();
    await api.hideToTray();
  };

  return (
    <div
      data-tauri-drag-region
      className="w-full h-screen bg-[#1e2028] p-3 text-white flex flex-col justify-between select-none overflow-hidden border border-white/10 shadow-[8px_8px_24px_rgba(0,0,0,0.6)] cursor-move"
      title="Click and drag anywhere to move widget on top of other apps"
    >
      {/* Top Header Bar with Drag Grip & App Badging */}
      <div
        data-tauri-drag-region
        className="flex items-center justify-between pb-2 border-b border-white/[0.06] cursor-move"
      >
        <div className="flex items-center gap-2" data-tauri-drag-region>
          <GripHorizontal className="w-4 h-4 text-[#787988] shrink-0" />
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
            YDID
          </span>
          <span className="text-[9px] font-mono tracking-widest bg-[#161720] text-emerald-400 px-1.5 py-0.5 rounded border border-white/5 font-bold shadow-inner">
            ON TOP
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs font-bold text-[#888998] mr-1">
            {dayStatus.current_time.slice(0, 5)}
          </span>

          {/* Minimize / Hide to Tray */}
          <button
            onClick={handleHideToTray}
            className="p-1 neu-btn rounded-lg text-[#888998] hover:text-white transition-colors"
            title="Minimize to System Tray"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          {/* Expand to Full Command Dashboard */}
          <button
            onClick={() => {
              soundEngine.playFocusClick();
              onExpandDashboard();
            }}
            className="p-1 neu-btn rounded-lg text-[#888998] hover:text-white transition-colors"
            title="Restore Full Command Dashboard"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Notification Drawer if active */}
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
        /* Standard Widget Main Display */
        <div
          data-tauri-drag-region
          onClick={onExpandDashboard}
          className="neu-sunken p-2.5 rounded-2xl my-auto cursor-pointer group text-center hover:border-white/10 transition-colors"
          title="Click to restore full dashboard • Drag header to move"
        >
          {/* Remaining Time Big Readout */}
          <div className="text-[9px] font-mono tracking-widest text-[#787988] uppercase font-bold mb-0.5">
            REMAINING TODAY
          </div>
          <div className="font-mono font-black text-3xl tracking-wider text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] group-hover:text-red-400 transition-colors">
            {formatSeconds(dayStatus.remaining_seconds)}
          </div>

          {/* Recessed Health Bar */}
          <div className="neu-sunken h-3.5 w-full p-0.5 rounded-full mt-2 relative overflow-hidden">
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

      {/* Bottom Bar: Active App Badge & Pause Toggle */}
      <div
        data-tauri-drag-region
        className="pt-1.5 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono"
      >
        <div className="flex items-center gap-1.5 truncate max-w-[210px]">
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
  );
};
