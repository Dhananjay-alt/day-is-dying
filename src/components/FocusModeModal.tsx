import { useState, useEffect } from 'react';
import { X, Crosshair, AlertOctagon, CheckCircle2, Play, Square } from 'lucide-react';
import { CurrentActivity } from '../types';
import { soundEngine } from '../services/audio';

interface FocusModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentActivity: CurrentActivity;
  onCompleteFocusSession: (minutes: number) => void;
  initialMinutes?: number;
}

export const FocusModeModal: React.FC<FocusModeModalProps> = ({
  isOpen,
  onClose,
  currentActivity,
  onCompleteFocusSession,
  initialMinutes = 25,
}) => {
  const [durationMinutes, setDurationMinutes] = useState(initialMinutes);
  const [goal, setGoal] = useState('Deep Work & Core Execution');
  const [isActive, setIsActive] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(initialMinutes * 60);

  useEffect(() => {
    setDurationMinutes(initialMinutes);
    setSecondsRemaining(initialMinutes * 60);
  }, [initialMinutes]);

  // Focus timer interval
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isActive && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            setIsActive(false);
            soundEngine.playHourStrike();
            onCompleteFocusSession(durationMinutes);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, secondsRemaining, durationMinutes, onCompleteFocusSession]);

  if (!isOpen) return null;

  const totalSec = durationMinutes * 60;
  const elapsed = totalSec - secondsRemaining;
  const progressPct = totalSec > 0 ? (elapsed / totalSec) * 100 : 0;

  const m = Math.floor(secondsRemaining / 60);
  const s = secondsRemaining % 60;
  const formattedTime = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

  const isDistracted = isActive && currentActivity.category === 'distraction';

  const handleStart = () => {
    soundEngine.playFocusClick();
    setSecondsRemaining(durationMinutes * 60);
    setIsActive(true);
  };

  const handleEnd = () => {
    soundEngine.playNormalTick();
    setIsActive(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="neu-panel w-full max-w-lg p-7 sm:p-9 relative rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.85)] animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 neu-btn rounded-full text-[#888998] hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2.5 mb-5">
          <div className="neu-sunken p-2 rounded-xl">
            <Crosshair className="w-5 h-5 text-emerald-400" />
          </div>
          <h2 className="font-display font-black text-xl text-white tracking-widest uppercase">
            FOCUS CONSOLE
          </h2>
        </div>

        {!isActive ? (
          /* Configuration Setup */
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-mono font-bold text-[#a1a1aa] uppercase mb-2">
                Session Goal / Target
              </label>
              <input
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. Finish core compiler refactor"
                className="w-full neu-sunken p-3.5 rounded-xl text-sm font-mono text-white focus:outline-none focus:ring-1 focus:ring-white/20"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-[#a1a1aa] uppercase mb-2.5">
                Session Duration
              </label>
              <div className="grid grid-cols-4 gap-2.5">
                {[15, 25, 50, 90].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => {
                      setDurationMinutes(mins);
                      setSecondsRemaining(mins * 60);
                    }}
                    className={`py-3 font-mono text-xs font-bold rounded-xl transition-all ${
                      durationMinutes === mins
                        ? 'bg-white text-black shadow-md'
                        : 'neu-btn text-[#a1a1aa]'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleStart}
              className="neu-btn neu-btn-accent w-full py-4 flex items-center justify-center gap-2 font-display text-sm tracking-widest font-extrabold rounded-2xl shadow-lg"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>START FOCUS SESSION</span>
            </button>
          </div>
        ) : (
          /* Active Focus Execution */
          <div className="space-y-6">
            {/* Warning Overlay if User Left Focus */}
            {isDistracted && (
              <div className="neu-sunken bg-red-950/70 border border-red-500/50 p-4 rounded-2xl text-center shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse">
                <div className="flex items-center justify-center gap-2 text-red-400 font-display font-black tracking-wider text-sm mb-1">
                  <AlertOctagon className="w-4 h-4" />
                  <span>YOU LEFT FOCUS.</span>
                </div>
                <p className="text-xs font-mono text-[#fca5a5] mb-3">
                  Distraction active: {currentActivity.domain || currentActivity.application}
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => soundEngine.playFocusClick()}
                    className="neu-btn neu-btn-accent py-2 px-5 text-xs font-mono font-bold rounded-xl"
                  >
                    RETURN TO WORK
                  </button>
                  <button
                    onClick={handleEnd}
                    className="neu-btn py-2 px-4 text-xs font-mono font-bold text-[#a1a1aa] rounded-xl"
                  >
                    ABORT
                  </button>
                </div>
              </div>
            )}

            {/* Huge Focus Timer */}
            <div className="neu-sunken p-8 text-center rounded-3xl">
              <div className="text-[11px] font-mono tracking-widest text-[#71727e] uppercase mb-1.5 font-bold">
                TIME REMAINING
              </div>
              <div className="font-mono font-black text-6xl sm:text-7xl text-white tracking-widest drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
                {formattedTime}
              </div>
              <div className="text-xs font-mono text-emerald-400 font-bold mt-3 truncate">
                GOAL: {goal}
              </div>
            </div>

            {/* Focus Progress Bar */}
            <div className="neu-sunken h-5 w-full p-1 rounded-full">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {/* Currently Active App Monitor */}
            <div className="neu-sunken p-3 rounded-xl flex items-center justify-between text-xs font-mono">
              <span className="text-[#71727e]">ACTIVE PROCESS:</span>
              <span className="font-bold text-white">
                {currentActivity.domain || currentActivity.application}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  soundEngine.playHourStrike();
                  onCompleteFocusSession(durationMinutes);
                  onClose();
                }}
                className="neu-btn neu-btn-success flex-1 py-3.5 flex items-center justify-center gap-2 text-xs font-bold font-mono rounded-xl"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>COMPLETE EARLY</span>
              </button>
              <button
                onClick={handleEnd}
                className="neu-btn py-3.5 px-5 flex items-center justify-center gap-1.5 text-xs text-red-400 font-mono rounded-xl"
              >
                <Square className="w-3.5 h-3.5" />
                <span>STOP</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
