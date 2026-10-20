import { WeeklyReport } from '../types';
import { BarChart3, Trophy, Flame } from 'lucide-react';

interface WeeklyAnalyticsProps {
  report: WeeklyReport;
}

function formatHours(seconds: number): string {
  const h = (seconds / 3600).toFixed(1);
  return `${h}h`;
}

export const WeeklyAnalytics: React.FC<WeeklyAnalyticsProps> = ({ report }) => {
  const maxDaySeconds = Math.max(...report.days.map((d) => d.total_seconds), 3600);

  return (
    <div className="neu-panel p-6 sm:p-7 mb-7">
      <div className="flex items-center justify-between mb-6 border-b border-white/[0.04] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="neu-sunken p-1.5 rounded-lg">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-display font-extrabold text-sm sm:text-base tracking-wider uppercase text-white">
            WEEKLY TIME METRICS
          </h3>
        </div>
        <div className="font-mono text-xs text-[#787988] neu-sunken px-2.5 py-0.5 rounded-md">
          7-DAY ROLLING AUDIT
        </div>
      </div>

      {/* 7-Day Bar Chart */}
      <div className="space-y-3 mb-6">
        {report.days.map((day) => {
          const prodWidth = (day.productive_seconds / maxDaySeconds) * 100;
          const distWidth = (day.distraction_seconds / maxDaySeconds) * 100;
          const neutWidth = (day.neutral_seconds / maxDaySeconds) * 100;

          return (
            <div key={day.date} className="flex items-center gap-3 text-xs font-mono">
              <span className="w-10 font-bold text-[#a1a1aa] uppercase">{day.day_name}</span>
              
              <div className="flex-1 h-5 neu-sunken rounded-full flex overflow-hidden p-0.5 gap-0.5">
                {/* Productive chunk */}
                <div
                  style={{ width: `${prodWidth}%` }}
                  title={`${day.day_name} Productive: ${formatHours(day.productive_seconds)}`}
                  className="h-full rounded-full bg-emerald-500 hover:brightness-110 transition-all shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                />
                {/* Neutral chunk */}
                <div
                  style={{ width: `${neutWidth}%` }}
                  title={`${day.day_name} Neutral: ${formatHours(day.neutral_seconds)}`}
                  className="h-full rounded-full bg-blue-500 hover:brightness-110 transition-all"
                />
                {/* Distraction chunk */}
                <div
                  style={{ width: `${distWidth}%` }}
                  title={`${day.day_name} Distraction: ${formatHours(day.distraction_seconds)}`}
                  className="h-full rounded-full bg-red-500 hover:brightness-110 transition-all shadow-[0_0_8px_rgba(239,68,68,0.3)]"
                />
              </div>

              <span className="w-14 text-right text-[#787988] text-[11px] font-bold">
                {formatHours(day.total_seconds)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 text-[10px] font-mono uppercase text-[#787988] mb-6 pt-3 border-t border-white/[0.04]">
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-[0_0_6px_rgba(16,185,129,0.5)]" /> Productive
        </span>
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Neutral
        </span>
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block shadow-[0_0_6px_rgba(239,68,68,0.5)]" /> Distraction
        </span>
      </div>

      {/* Key Metric Callout Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Best Day */}
        <div className="neu-sunken p-4 rounded-2xl">
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono font-bold mb-1.5">
            <Trophy className="w-4 h-4 text-emerald-400" />
            <span>BEST DAY</span>
          </div>
          <div className="font-display font-black text-lg text-white">
            {report.best_day_name}
          </div>
          <div className="font-mono text-xs text-[#787988] mt-0.5">
            {formatHours(report.best_day_productive_seconds)} productive
          </div>
        </div>

        {/* Biggest Time Sink */}
        <div className="neu-sunken p-4 rounded-2xl">
          <div className="flex items-center gap-2 text-xs text-red-400 font-mono font-bold mb-1.5">
            <Flame className="w-4 h-4 text-red-400" />
            <span>BIGGEST TIME SINK</span>
          </div>
          <div className="font-display font-black text-lg text-white truncate">
            {report.biggest_sink_name}
          </div>
          <div className="font-mono text-xs text-[#787988] mt-0.5">
            {formatHours(report.biggest_sink_seconds)} this week
          </div>
        </div>

        {/* Average Daily Distraction */}
        <div className="neu-sunken p-4 rounded-2xl">
          <div className="flex items-center gap-2 text-xs text-[#d4d4d8] font-mono font-bold mb-1.5">
            <span>AVG DAILY DISTRACTION</span>
          </div>
          <div className="font-display font-black text-lg text-white">
            {formatHours(report.average_daily_distraction_seconds)}
          </div>
          <div className="font-mono text-xs text-[#787988] mt-0.5">
            Surrendered per day
          </div>
        </div>
      </div>
    </div>
  );
};
