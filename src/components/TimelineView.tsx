import { useState } from 'react';
import { TimelineSegment, Category } from '../types';
import { Clock, Filter } from 'lucide-react';

interface TimelineViewProps {
  timeline: TimelineSegment[];
}

function formatMinutes(seconds: number): string {
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const remM = m % 60;
  return `${h}h ${remM}m`;
}

function formatTimeString(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toTimeString().slice(0, 5); // "08:30"
  } catch {
    return isoString.slice(11, 16);
  }
}

export const TimelineView: React.FC<TimelineViewProps> = ({ timeline }) => {
  const [filter, setFilter] = useState<'all' | Category>('all');
  const [hoveredSegment, setHoveredSegment] = useState<TimelineSegment | null>(null);

  const filteredTimeline = timeline.filter((item) => {
    if (filter === 'all') return true;
    return item.category === filter;
  });

  const getCategoryColor = (cat: Category) => {
    switch (cat) {
      case 'productive':
        return 'bg-[#ccff00] hover:brightness-125 shadow-[0_0_8px_rgba(204,255,0,0.3)]';
      case 'distraction':
        return 'bg-red-500 hover:bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.3)]';
      case 'neutral':
        return 'bg-blue-500 hover:bg-blue-400';
      case 'idle':
      default:
        return 'bg-zinc-700 hover:bg-zinc-600';
    }
  };

  return (
    <div className="neu-panel p-6 sm:p-7 mb-7">
      {/* Header & Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 border-b border-white/[0.04] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="neu-sunken p-1.5 rounded-lg">
            <Clock className="w-4 h-4 text-[#ccff00]" />
          </div>
          <h3 className="font-display font-extrabold text-sm sm:text-base tracking-wider uppercase text-white">
            TODAY'S TIMELINE
          </h3>
          <span className="font-mono text-[10px] text-[#ccff00] neu-sunken px-2.5 py-0.5 rounded-full border border-[#ccff00]/20 font-bold">
            {filteredTimeline.length} SESSIONS
          </span>
        </div>

        {/* Filters as tactile pill buttons */}
        <div className="flex items-center gap-2 font-mono text-xs flex-wrap">
          <Filter className="w-3.5 h-3.5 text-white/40 mr-1 hidden sm:inline" />
          {(['all', 'productive', 'distraction', 'neutral', 'idle'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1 uppercase tracking-wider text-[11px] font-bold rounded-full transition-all cursor-pointer ${
                filter === cat
                  ? 'bg-[#ccff00] text-black font-extrabold shadow-[0_0_15px_rgba(204,255,0,0.35)]'
                  : 'neu-btn text-white/60 py-1 px-3 text-[11px] hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Timeline Bar / Continuous Ribbon */}
      <div className="mb-4">
        <div className="text-[10px] font-mono text-white/50 uppercase mb-2 flex justify-between px-1">
          <span>Day Timeline Ribbon</span>
          <span className="text-[#ccff00]/80">Hover segments to inspect</span>
        </div>
        <div className="neu-sunken h-8 w-full p-1 rounded-full flex items-center gap-0.5 overflow-hidden border border-white/10">
          {timeline.map((segment) => {
            const widthPct = Math.max(1.5, (segment.duration_seconds / 28800) * 100);
            return (
              <div
                key={segment.id}
                onMouseEnter={() => setHoveredSegment(segment)}
                onMouseLeave={() => setHoveredSegment(null)}
                style={{ width: `${widthPct}%` }}
                className={`h-full cursor-pointer transition-all duration-150 ${getCategoryColor(
                  segment.category
                )}`}
              />
            );
          })}
        </div>
      </div>

      {/* Session Inspector Banner - Fixed height (56px) to eliminate layout jitter and jumping */}
      <div className="neu-sunken px-4 py-2.5 mb-5 rounded-2xl flex items-center justify-between gap-3 text-xs font-mono h-[56px] border border-white/10 transition-all overflow-hidden select-none">
        {hoveredSegment ? (
          <>
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2 h-2 rounded-full bg-[#ccff00] shadow-[0_0_8px_#ccff00] animate-pulse shrink-0" />
              <span className="font-bold text-[#ebebeb] uppercase truncate">
                {hoveredSegment.application}
              </span>
              {hoveredSegment.domain && (
                <span className="text-[#ccff00] font-bold shrink-0">({hoveredSegment.domain})</span>
              )}
              <span className="text-white/40 truncate max-w-xs sm:max-w-md hidden md:inline">
                {hoveredSegment.window_title}
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <span className="text-white/70 font-semibold text-[11px]">
                {formatTimeString(hoveredSegment.started_at)} → {formatTimeString(hoveredSegment.ended_at)}
              </span>
              <span className="bg-white/10 px-2.5 py-0.5 rounded-full font-bold text-white text-[11px]">
                {formatMinutes(hoveredSegment.duration_seconds)}
              </span>
              <span className="uppercase text-[9px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#ccff00]/10 border border-[#ccff00]/30 text-[#ccff00]">
                {hoveredSegment.category}
              </span>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between w-full text-white/40 text-[11px]">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ccff00]/60" />
              <span>// HOVER ANY TIMELINE RIBBON SEGMENT OR SESSION TO INSPECT DETAILS</span>
            </span>
            <span className="text-[10px] text-[#ccff00]/60 font-mono tracking-widest hidden sm:inline">LIVE INSPECTOR</span>
          </div>
        )}
      </div>

      {/* Chronological List of Entries */}
      <div className="space-y-2.5 max-h-80 overflow-y-auto pr-2">
        {filteredTimeline.length === 0 ? (
          <div className="text-center py-8 text-xs font-mono text-[#787988]">
            NO ACTIVITY RECORDED FOR THIS FILTER YET.
          </div>
        ) : (
          filteredTimeline.map((item) => (
            <div
              key={item.id}
              onMouseEnter={() => setHoveredSegment(item)}
              onMouseLeave={() => setHoveredSegment(null)}
              className="neu-sunken p-3 rounded-xl flex items-center justify-between gap-3.5 hover:border-[#ccff00]/40 hover:bg-white/[0.04] transition-all cursor-pointer border border-transparent"
            >
              {/* Time Stamp */}
              <div className="font-mono text-xs font-bold text-white/50 w-14 shrink-0">
                {formatTimeString(item.started_at)}
              </div>

              {/* Proportional visual bar */}
              <div className="w-16 sm:w-28 shrink-0">
                <div
                  className={`h-2.5 rounded-full ${getCategoryColor(item.category)}`}
                  style={{
                    width: `${Math.min(100, Math.max(15, (item.duration_seconds / 3600) * 100))}%`,
                  }}
                />
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-xs text-[#ebebeb] truncate">
                    {item.domain || item.application}
                  </span>
                  <span className="text-[10px] font-mono text-white/40 truncate hidden md:inline">
                    {item.window_title}
                  </span>
                </div>
              </div>

              {/* Duration and Category Badge */}
              <div className="flex items-center gap-2.5 shrink-0">
                <span className="font-mono text-xs text-white/80 font-bold">
                  {formatMinutes(item.duration_seconds)}
                </span>
                <span
                  className={`text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded-full border ${
                    item.category === 'productive'
                      ? 'bg-[#ccff00]/10 border-[#ccff00]/30 text-[#ccff00]'
                      : item.category === 'distraction'
                      ? 'bg-red-950/60 border-red-500/30 text-red-400'
                      : 'bg-white/5 border-white/10 text-white/50'
                  }`}
                >
                  {item.category}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
