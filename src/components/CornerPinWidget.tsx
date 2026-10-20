import { useState, useEffect, useRef } from 'react';
import {
  Pin,
  PinOff,
  Play,
  Pause,
  Crosshair,
  ChevronDown,
  ChevronUp,
  Move,
  X,
  GripHorizontal,
} from 'lucide-react';
import { DayStatus, CurrentActivity } from '../types';
import { soundEngine } from '../services/audio';

type CornerPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

interface CornerPinWidgetProps {
  dayStatus: DayStatus;
  currentActivity: CurrentActivity;
  isPaused: boolean;
  onTogglePause: () => void;
  onStartFocus: () => void;
  onClose?: () => void;
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

const STORAGE_KEY_POS = 'ydid_hud_position';
const STORAGE_KEY_PINNED = 'ydid_hud_pinned';

export const CornerPinWidget: React.FC<CornerPinWidgetProps> = ({
  dayStatus,
  currentActivity,
  isPaused,
  onTogglePause,
  onStartFocus,
  onClose,
}) => {
  const [isPinned, setIsPinned] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PINNED);
      return saved !== 'false';
    } catch {
      return true;
    }
  });

  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_POS);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return null;
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    posX: number;
    posY: number;
  } | null>(null);

  const isCritical = dayStatus.percentage_elapsed >= 85;
  const isDying = dayStatus.percentage_elapsed >= 70;

  // Initialize default position on mount if none saved
  useEffect(() => {
    if (!position && typeof window !== 'undefined') {
      const defaultX = Math.max(16, window.innerWidth - 320);
      const defaultY = Math.max(16, window.innerHeight - 280);
      setPosition({ x: defaultX, y: defaultY });
    }
  }, [position]);

  // Adjust on window resize to ensure widget remains in viewport bounds
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        if (!prev) return null;
        const width = isMinimized ? 220 : 300;
        const height = isMinimized ? 50 : 250;
        const clampedX = Math.max(12, Math.min(window.innerWidth - width - 12, prev.x));
        const clampedY = Math.max(12, Math.min(window.innerHeight - height - 12, prev.y));
        return { x: clampedX, y: clampedY };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMinimized]);

  // Mouse Dragging Handlers
  const handleStartDrag = (e: React.MouseEvent) => {
    // Only drag with left mouse button, don't trigger if clicking buttons
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button')) return;

    e.preventDefault();
    const currentX = position?.x ?? (window.innerWidth - 320);
    const currentY = position?.y ?? (window.innerHeight - 280);

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: currentX,
      posY: currentY,
    };
    setIsDragging(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragRef.current) return;
      const deltaX = moveEvent.clientX - dragRef.current.startX;
      const deltaY = moveEvent.clientY - dragRef.current.startY;

      const width = isMinimized ? 200 : 300;
      const height = isMinimized ? 50 : 240;

      const newX = Math.max(8, Math.min(window.innerWidth - width - 8, dragRef.current.posX + deltaX));
      const newY = Math.max(8, Math.min(window.innerHeight - height - 8, dragRef.current.posY + deltaY));

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (position) {
        try {
          localStorage.setItem(STORAGE_KEY_POS, JSON.stringify(position));
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Corner Snap Cycling
  const snapToCorner = (targetCorner?: CornerPosition) => {
    soundEngine.playFocusClick();
    const width = isMinimized ? 220 : 300;
    const height = isMinimized ? 50 : 250;
    const margin = 24;

    const corners: { name: CornerPosition; x: number; y: number }[] = [
      { name: 'bottom-right', x: window.innerWidth - width - margin, y: window.innerHeight - height - margin },
      { name: 'bottom-left', x: margin, y: window.innerHeight - height - margin },
      { name: 'top-left', x: margin, y: margin },
      { name: 'top-right', x: window.innerWidth - width - margin, y: margin },
    ];

    let nextCorner = corners[0];
    if (targetCorner) {
      nextCorner = corners.find((c) => c.name === targetCorner) || corners[0];
    } else if (position) {
      // Find nearest and cycle to next
      const currentIdx = corners.findIndex((c) => {
        return Math.hypot(c.x - position.x, c.y - position.y) < 180;
      });
      const nextIdx = (currentIdx + 1) % corners.length;
      nextCorner = corners[nextIdx];
    }

    const newPos = { x: nextCorner.x, y: nextCorner.y };
    setPosition(newPos);
    try {
      localStorage.setItem(STORAGE_KEY_POS, JSON.stringify(newPos));
    } catch {}
  };

  const togglePinned = () => {
    soundEngine.playFocusClick();
    const next = !isPinned;
    setIsPinned(next);
    try {
      localStorage.setItem(STORAGE_KEY_PINNED, String(next));
    } catch {}
  };

  // Positional styling
  const stylePos: React.CSSProperties = position
    ? { left: `${position.x}px`, top: `${position.y}px` }
    : { right: '24px', bottom: '24px' };

  return (
    <div
      style={stylePos}
      className={`fixed z-50 transition-[opacity,box-shadow] select-none ${
        isDragging ? 'cursor-grabbing scale-[1.02]' : ''
      } ${!isPinned ? 'opacity-40 hover:opacity-100 hover:scale-[1.01]' : 'opacity-100'}`}
    >
      {isMinimized ? (
        /* MINIMIZED FLOATING PILL / DIAL (DRAGGABLE) */
        <div
          onMouseDown={handleStartDrag}
          onClick={() => {
            if (!isDragging) {
              soundEngine.playFocusClick();
              setIsMinimized(false);
            }
          }}
          className="neu-panel p-2.5 rounded-full flex items-center gap-2.5 cursor-grab active:cursor-grabbing hover:scale-105 transition-transform shadow-[8px_8px_20px_rgba(0,0,0,0.5),-4px_-4px_12px_rgba(255,255,255,0.06)] border border-white/10 group backdrop-blur-md"
          title="Drag to reposition anywhere • Click to expand HUD"
        >
          <GripHorizontal className="w-3.5 h-3.5 text-[#787988] group-hover:text-amber-400 shrink-0 ml-1" />
          <div
            className={`w-2.5 h-2.5 rounded-full shadow-sm ${
              isCritical
                ? 'bg-red-500 shadow-red-500/80 animate-pulse'
                : isDying
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
          />
          <div className="font-mono font-black text-xs text-white tracking-wider">
            {formatHoursMinutes(dayStatus.remaining_seconds)}
          </div>
          <div className="neu-sunken px-2 py-0.5 rounded-full text-[10px] font-mono font-bold text-[#a1a1aa]">
            {dayStatus.percentage_elapsed}%
          </div>
          <ChevronUp className="w-3.5 h-3.5 text-[#888998] group-hover:text-white mr-1 shrink-0" />
        </div>
      ) : (
        /* EXPANDED TACTILE NEOMORPHIC FLOATING INSTRUMENT (DRAGGABLE) */
        <div className="neu-panel w-76 p-4 rounded-3xl border border-white/10 shadow-[10px_10px_28px_rgba(0,0,0,0.55),-6px_-6px_16px_rgba(255,255,255,0.07)] relative backdrop-blur-md">
          {/* Draggable Header Bar with tactile Grip */}
          <div
            onMouseDown={handleStartDrag}
            className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/[0.06] cursor-grab active:cursor-grabbing"
            title="Click and drag to move anywhere on your screen"
          >
            <div className="flex items-center gap-2">
              <GripHorizontal className="w-4 h-4 text-[#787988] hover:text-amber-400 shrink-0" />
              <div
                className={`w-2.5 h-2.5 rounded-full shadow-sm ${
                  isCritical
                    ? 'bg-red-500 shadow-red-500/80 animate-pulse'
                    : isDying
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
              />
              <span className="font-display font-black text-xs tracking-widest text-white uppercase">
                YDID HUD
              </span>
              <span className="text-[10px] font-mono text-[#888998]">
                {dayStatus.current_time.slice(0, 5)}
              </span>
            </div>

            {/* Quick Window Utility Buttons */}
            <div className="flex items-center gap-1">
              {/* Corner Snap / Move Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  snapToCorner();
                }}
                className="p-1.5 neu-btn rounded-lg text-[#888998] hover:text-white"
                title="Snap / Cycle through window corners"
              >
                <Move className="w-3 h-3" />
              </button>

              {/* Pin / Unpin Toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePinned();
                }}
                className={`p-1.5 neu-btn rounded-lg ${
                  isPinned ? 'text-amber-400' : 'text-[#888998]'
                }`}
                title={isPinned ? 'Pinned (always solid)' : 'Unpinned (semi-transparent when inactive)'}
              >
                {isPinned ? <Pin className="w-3 h-3" /> : <PinOff className="w-3 h-3" />}
              </button>

              {/* Minimize to Pill */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  soundEngine.playFocusClick();
                  setIsMinimized(true);
                }}
                className="p-1.5 neu-btn rounded-lg text-[#888998] hover:text-white"
                title="Minimize to draggable pill dial"
              >
                <ChevronDown className="w-3 h-3" />
              </button>

              {/* Dismiss / Close Widget */}
              {onClose && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    soundEngine.playFocusClick();
                    onClose();
                  }}
                  className="p-1.5 neu-btn rounded-lg text-[#888998] hover:text-red-400"
                  title="Hide HUD widget"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Sunken Countdown Screen */}
          <div className="neu-sunken p-3.5 rounded-2xl text-center mb-3">
            <div className="text-[9px] font-mono tracking-widest text-[#787988] uppercase font-bold mb-0.5">
              REMAINING TODAY
            </div>
            <div className="font-mono font-black text-2xl tracking-wider text-white drop-shadow-md">
              {formatSeconds(dayStatus.remaining_seconds)}
            </div>

            {/* Recessed Mini Life Bar */}
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
              <span className="truncate max-w-[130px] font-semibold">{dayStatus.escalating_message}</span>
            </div>
          </div>

          {/* Active Process Readout & Action Controls */}
          <div className="flex items-center justify-between text-[10px] font-mono">
            <div className="flex items-center gap-1.5 truncate max-w-[155px]">
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

            <div className="flex items-center gap-1">
              <button
                onClick={onStartFocus}
                className="neu-btn px-2 py-1 text-[10px] font-mono text-emerald-400 rounded-lg flex items-center gap-1"
                title="Start 25-minute focus session"
              >
                <Crosshair className="w-3 h-3 text-emerald-400" />
                <span>FOCUS</span>
              </button>

              <button
                onClick={onTogglePause}
                className="p-1 neu-btn rounded-lg text-[#888998] hover:text-white"
                title={isPaused ? 'Resume tracking' : 'Pause tracking'}
              >
                {isPaused ? <Play className="w-3 h-3 text-amber-400" /> : <Pause className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
