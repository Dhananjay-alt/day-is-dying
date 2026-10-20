import { ActivitySummary } from '../types';

interface StatsGridProps {
  summary: ActivitySummary;
}

function formatHoursMinutes(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ summary }) => {
  const total = summary.total_active_seconds || 1;
  const prodPct = Math.round((summary.productive_seconds / total) * 100);
  const distPct = Math.round((summary.distraction_seconds / total) * 100);
  const neutPct = Math.round((summary.neutral_seconds / total) * 100);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
      {/* PRODUCTIVE */}
      <div className="neu-panel p-5 relative group hover:shadow-[8px_8px_20px_rgba(0,0,0,0.7),-5px_-5px_15px_rgba(16,185,129,0.06)] transition-all">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-xs font-bold tracking-widest text-emerald-400 uppercase">
            PRODUCTIVE
          </span>
          <span className="font-mono text-[11px] text-emerald-400 bg-emerald-950/70 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold shadow-inner">
            {prodPct}%
          </span>
        </div>
        <div className="font-mono font-extrabold text-2xl sm:text-3xl text-white tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
          {formatHoursMinutes(summary.productive_seconds)}
        </div>
        <div className="text-[11px] font-mono text-[#787985] mt-1.5">
          Code, Terminal, Research
        </div>
      </div>

      {/* NEUTRAL */}
      <div className="neu-panel p-5 relative group hover:shadow-[8px_8px_20px_rgba(0,0,0,0.7),-5px_-5px_15px_rgba(59,130,246,0.06)] transition-all">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-xs font-bold tracking-widest text-blue-400 uppercase">
            NEUTRAL
          </span>
          <span className="font-mono text-[11px] text-blue-400 bg-blue-950/70 px-2 py-0.5 rounded-full border border-blue-500/30 font-bold shadow-inner">
            {neutPct}%
          </span>
        </div>
        <div className="font-mono font-extrabold text-2xl sm:text-3xl text-white tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
          {formatHoursMinutes(summary.neutral_seconds)}
        </div>
        <div className="text-[11px] font-mono text-[#787985] mt-1.5">
          System, Audio, Comms
        </div>
      </div>

      {/* DISTRACTION */}
      <div className="neu-panel p-5 relative group hover:shadow-[8px_8px_20px_rgba(0,0,0,0.7),-5px_-5px_15px_rgba(239,68,68,0.08)] transition-all">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-xs font-bold tracking-widest text-red-400 uppercase">
            DISTRACTION
          </span>
          <span className="font-mono text-[11px] text-red-400 bg-red-950/70 px-2 py-0.5 rounded-full border border-red-500/30 font-bold shadow-inner">
            {distPct}%
          </span>
        </div>
        <div className="font-mono font-extrabold text-2xl sm:text-3xl text-white tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
          {formatHoursMinutes(summary.distraction_seconds)}
        </div>
        <div className="text-[11px] font-mono text-red-400/80 mt-1.5 truncate">
          Top sink: {summary.biggest_sink_name || 'None'}
        </div>
      </div>

      {/* IDLE */}
      <div className="neu-panel p-5 relative group hover:shadow-[8px_8px_20px_rgba(0,0,0,0.7),-5px_-5px_15px_rgba(255,255,255,0.04)] transition-all">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-xs font-bold tracking-widest text-[#a1a1aa] uppercase">
            IDLE / AWAY
          </span>
          <span className="font-mono text-[10px] text-[#a1a1aa] bg-[#101115] px-2 py-0.5 rounded-full border border-white/5 shadow-inner">
            AWAY
          </span>
        </div>
        <div className="font-mono font-extrabold text-2xl sm:text-3xl text-white tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
          {formatHoursMinutes(summary.idle_seconds)}
        </div>
        <div className="text-[11px] font-mono text-[#787985] mt-1.5">
          No user input recorded
        </div>
      </div>
    </div>
  );
};
