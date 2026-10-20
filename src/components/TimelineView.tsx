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
        return 'bg-emerald-500 hover:bg-emerald-400';
      case 'distraction':
        return 'bg-red-500 hover:bg-red-400';
      case 'neutral':
        return 'bg-blue-500 hover:bg-blue-400';
      case 'idle':
      default:
        return 'bg-zinc-600 hover:bg-zinc-500';
    }
  };

  return (
    <div className="neu-panel p-6 sm:p-7 mb-7">
      {/* Header & Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 border-b border-white/[0.04] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="neu-sunken p-1.5 rounded-lg">
            <Clock className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-display font-extrabold text-sm sm:text-base tracking-wider uppercase text-white">
            TODAY'S TIMELINE
          </h3>
          <span className="font-mono text-[10px] text-[#787988] neu-sunken px-2.5 py-0.5 rounded-md">
            {filteredTimeline.length} SESSIONS
          </span>
        </div>

        {/* Filters as tactile pill buttons */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <Filter className="w-3.5 h-3.5 text-[#71727e] mr-1 hidden sm:inline" />
          {(['all', 'productive', 'distraction', 'neutral', 'idle'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1 uppercase tracking-wider text-[11px] font-bold rounded-full transition-all ${
                filter === cat
                  ? 'bg-white text-black shadow-md'
                  : 'neu-btn text-[#a1a1aa] py-1 px-3 text-[11px]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Timeline Bar / Continuous Ribbon */}
      <div className="mb-6">
        <div className="text-[10px] font-mono text-[#787988] uppercase mb-2 flex justify-between px-1">
          <span>Day Timeline Ribbon</span>
          <span>Hover for session details</span>
        </div>
        <div className="neu-sunken h-8 w-full p-1 rounded-full flex items-center gap-0.5 overflow-hidden">
          {timeline.map((segment) => {
            const widthPct = Math.max(1.5, (segment.duration_seconds / 28800) * 100);
            return (
              <div
                key={segment.id}
                onMouseEnter={() => setHoveredSegment(segment)}
                onMouseLeave={() => setHoveredSegment(null)}
                style={{ width: `${widthPct}%` }}
                className={`h-full cursor-pointer transition-all ${getCategoryColor(
                  segment.category
                )}`}
              />
            );
          })}
        </div>
      </div>

      {/* Hover Info Tooltip Banner */}
      {hoveredSegment && (
        <div className="neu-raised p-4 mb-4 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs font-mono animate-in fade-in duration-150">
          <div>
            <span className="font-bold text-white uppercase mr-2.5">
              {hoveredSegment.application}
            </span>
            {hoveredSegment.domain && (
              <span className="text-amber-300 mr-2.5 font-bold">({hoveredSegment.domain})</span>
            )}
            <span className="text-[#a1a1aa] truncate max-w-sm inline-block align-bottom">
              {hoveredSegment.window_title}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white font-bold">
              {formatTimeString(hoveredSegment.started_at)} → {formatTimeString(hoveredSegment.ended_at)}
            </span>
            <span className="neu-sunken px-2.5 py-1 rounded-md font-bold text-white">
              {formatMinutes(hoveredSegment.duration_seconds)}
            </span>
            <span className="uppercase text-[10px] font-extrabold px-2 py-0.5 rounded-full neu-raised">
              {hoveredSegment.category}
            </span>
          </div>
        </div>
      )}

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
              className="neu-sunken p-3 rounded-xl flex items-center justify-between gap-3.5 hover:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.6)] transition-all cursor-pointer"
            >
              {/* Time Stamp */}
              <div className="font-mono text-xs font-bold text-[#a1a1aa] w-14 shrink-0">
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
                  <span className="font-display font-bold text-xs text-white truncate">
                    {item.domain || item.application}
                  </span>
                  <span className="text-[10px] font-mono text-[#656673] truncate hidden md:inline">
                    {item.window_title}
                  </span>
                </div>
              </div>

              {/* Duration and Category Badge */}
              <div className="flex items-center gap-2.5 shrink-0">
                <span className="font-mono text-xs text-[#d4d4d8] font-bold">
                  {formatMinutes(item.duration_seconds)}
                </span>
                <span className="text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-[#181920] border border-white/5 text-[#a1a1aa]">
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
