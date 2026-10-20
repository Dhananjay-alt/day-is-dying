import { X, Skull } from 'lucide-react';
import { ActivitySummary } from '../types';

interface EndOfDayReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: ActivitySummary;
}

function formatHoursMinutes(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

export const EndOfDayReportModal: React.FC<EndOfDayReportModalProps> = ({
  isOpen,
  onClose,
  summary,
}) => {
  if (!isOpen) return null;

  const total = summary.total_active_seconds || 1;
  const distPct = Math.round((summary.distraction_seconds / total) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="neu-panel w-full max-w-lg p-7 sm:p-9 relative rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.85)] animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 neu-btn rounded-full text-[#888998] hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Title */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/[0.04]">
          <div className="neu-sunken p-2.5 rounded-xl">
            <Skull className="w-6 h-6 text-zinc-400" />
          </div>
          <h2 className="font-display font-black text-2xl tracking-[0.2em] text-white uppercase">
            TODAY IS DEAD.
          </h2>
        </div>

        {/* Time Audit Breakdown */}
        <div className="neu-sunken p-5 rounded-2xl space-y-2.5 font-mono text-sm mb-5">
          <div className="flex justify-between items-center pb-2 border-b border-white/[0.04]">
            <span className="text-[#a1a1aa] uppercase tracking-wider text-xs">ACTIVE TIME</span>
            <span className="font-bold text-white text-base">
              {formatHoursMinutes(summary.total_active_seconds)}
            </span>
          </div>

          <div className="flex justify-between items-center py-1 text-emerald-400 text-xs">
            <span className="uppercase font-bold">PRODUCTIVE</span>
            <span className="font-bold text-sm">{formatHoursMinutes(summary.productive_seconds)}</span>
          </div>

          <div className="flex justify-between items-center py-1 text-blue-400 text-xs">
            <span className="uppercase font-bold">NEUTRAL</span>
            <span className="font-bold text-sm">{formatHoursMinutes(summary.neutral_seconds)}</span>
          </div>

          <div className="flex justify-between items-center py-1 text-red-400 text-xs">
            <span className="uppercase font-bold">DISTRACTION</span>
            <span className="font-bold text-sm">{formatHoursMinutes(summary.distraction_seconds)}</span>
          </div>

          <div className="flex justify-between items-center py-1 text-zinc-400 text-xs">
            <span className="uppercase font-bold">IDLE</span>
            <span className="font-bold text-sm">{formatHoursMinutes(summary.idle_seconds)}</span>
          </div>
        </div>

        {/* Biggest Time Sink */}
        <div className="neu-sunken p-4 mb-5 rounded-xl">
          <div className="text-[10px] font-mono uppercase text-[#787988] tracking-wider mb-1 font-bold">
            BIGGEST TIME SINK
          </div>
          <div className="flex items-center justify-between font-mono">
            <span className="font-bold text-white text-base truncate">
              {summary.biggest_sink_name || 'None'}
            </span>
            <span className="font-bold text-red-400 text-base">
              {formatHoursMinutes(summary.biggest_sink_seconds)}
            </span>
          </div>
        </div>

        {/* Distraction Meter */}
        <div className="mb-6">
          <div className="flex justify-between text-xs font-mono text-[#a1a1aa] mb-2 px-1">
            <span>YOUR DAY CONSUMED</span>
            <span className="text-red-400 font-bold">{distPct}% distractions</span>
          </div>
          <div className="neu-sunken h-4 w-full rounded-full p-0.5">
            <div
              className="h-full bg-red-600 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]"
              style={{ width: `${distPct}%` }}
            />
          </div>
          <p className="text-xs font-mono text-[#787988] mt-2 px-1">
            {distPct}% of your active waking hours surrendered to non-essential entertainment.
          </p>
        </div>

        {/* Cold, Honest Closing Callout */}
        <div className="text-center py-4 border-t border-white/[0.04]">
          <p className="font-display font-medium text-sm text-[#e4e4e7] mb-1">
            Tomorrow starts fresh.
          </p>
          <p className="font-display font-black text-base text-red-400 tracking-wider uppercase drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]">
            Don't waste it.
          </p>
        </div>

        <button
          onClick={onClose}
          className="neu-btn w-full py-3.5 mt-2 text-xs font-mono font-bold tracking-widest text-[#a1a1aa] uppercase rounded-xl"
        >
          ACKNOWLEDGE & CLOSE
        </button>
      </div>
    </div>
  );
};
