import { DayStatus } from '../types';
import { soundEngine } from '../services/audio';

interface CountdownHeroProps {
  dayStatus: DayStatus;
}

function formatSeconds(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatHoursMinutes(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  return `${h}h ${m}m`;
}

export const CountdownHero: React.FC<CountdownHeroProps> = ({ dayStatus }) => {
  const isDying = dayStatus.percentage_elapsed >= 70;
  const isCritical = dayStatus.percentage_elapsed >= 85;
  const isDead = dayStatus.percentage_elapsed >= 100;

  return (
    <div
      className={`neu-panel p-7 sm:p-9 mb-7 relative overflow-hidden transition-all duration-500 ${
        isCritical ? 'glow-danger border-red-500/30' : isDying ? 'glow-warning border-amber-500/20' : ''
      }`}
    >
      {/* Top Banner: Escalating Message & Active Day Boundaries */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          <div
            className={`w-3.5 h-3.5 rounded-full shadow-md transition-all ${
              isDead
                ? 'bg-zinc-600 shadow-zinc-700/50'
                : isCritical
                ? 'bg-red-500 shadow-red-500/80 animate-pulse'
                : isDying
                ? 'bg-amber-500 shadow-amber-500/80'
                : 'bg-emerald-500 shadow-emerald-500/80'
            }`}
          />
          <h2 className="font-display font-black text-sm sm:text-base tracking-[0.2em] text-[#f4f4f6] uppercase">
            {dayStatus.escalating_message}
          </h2>
        </div>

        <div className="neu-sunken px-3.5 py-1.5 rounded-xl font-mono text-[11px] tracking-wider text-[#8b8c99]">
          ACTIVE WINDOW: <span className="text-white font-bold">{dayStatus.day_start}</span> →{' '}
          <span className="text-white font-bold">{dayStatus.day_end}</span>
        </div>
      </div>

      {/* The Central Monospaced Countdown Instrument */}
      <div
        onClick={() => soundEngine.playFocusClick()}
        className="neu-sunken p-7 sm:p-10 rounded-2xl flex flex-col items-center justify-center cursor-pointer group hover:shadow-[inset_6px_6px_14px_rgba(0,0,0,0.9),inset_-3px_-3px_9px_rgba(255,255,255,0.04)] active:scale-[0.99] transition-all mb-7 relative"
      >
        <span className="font-mono text-xs font-bold tracking-[0.35em] text-[#6d6e7a] uppercase mb-2">
          REMAINING TODAY
        </span>

        <div className="font-mono font-black text-5xl sm:text-7xl md:text-8xl tracking-wider text-white text-center select-all drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
          {formatSeconds(dayStatus.remaining_seconds)}
        </div>

        <div className="flex items-center gap-4 mt-4">
          <span className="font-mono text-xs sm:text-sm text-[#a1a1aa] font-semibold tracking-wider">
            {formatHoursMinutes(dayStatus.remaining_seconds)} LEFT
          </span>
          <span className="text-[#3f3f50]">•</span>
          <span
            className={`font-mono text-xs sm:text-sm font-bold tracking-wider ${
              isCritical ? 'text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' : isDying ? 'text-amber-400' : 'text-[#d4d4d8]'
            }`}
          >
            {dayStatus.percentage_elapsed}% GONE
          </span>
        </div>
      </div>

      {/* THE DAY AS A LIFE BAR / FUEL GAUGE */}
      <div>
        <div className="flex items-center justify-between text-xs font-mono font-bold tracking-wider text-[#a1a1aa] mb-2.5 px-1">
          <span className="uppercase flex items-center gap-2">
            <span>DAY LIFE BAR</span>
            <span className="text-[10px] text-[#656673] font-normal">
              ({formatHoursMinutes(dayStatus.elapsed_seconds)} elapsed)
            </span>
          </span>
          <span className={isCritical ? 'text-red-400 font-extrabold text-sm' : 'text-[#e4e4e7] text-sm'}>
            {dayStatus.percentage_elapsed}%
          </span>
        </div>

        {/* Life Bar Track with deep neomorphic sunken channel */}
        <div className="neu-sunken h-8 w-full p-1.5 rounded-full relative overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out relative meter-stripes shadow-md ${
              isDead
                ? 'bg-zinc-700'
                : isCritical
                ? 'bg-gradient-to-r from-red-950 via-red-600 to-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                : isDying
                ? 'bg-gradient-to-r from-amber-950 via-amber-600 to-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                : 'bg-gradient-to-r from-zinc-800 via-zinc-600 to-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, dayStatus.percentage_elapsed))}%` }}
          >
            <div className="absolute inset-0 bg-white/10 opacity-40 animate-pulse rounded-full" />
          </div>
        </div>

        {/* Segment Markers */}
        <div className="flex justify-between items-center text-[10px] font-mono text-[#656673] mt-2 px-2">
          <span>06:00 (0%)</span>
          <span>10:30 (25%)</span>
          <span className="font-bold text-[#8c8d9d]">15:00 (50%)</span>
          <span className="text-amber-500/80 font-bold">19:30 (75%)</span>
          <span className="text-red-500/80 font-bold">00:00 (100%)</span>
        </div>
      </div>
    </div>
  );
};
