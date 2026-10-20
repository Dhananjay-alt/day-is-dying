import { CurrentActivity } from '../types';
import { Monitor, Globe, Clock, ShieldAlert } from 'lucide-react';

interface CurrentActivityBadgeProps {
  activity: CurrentActivity;
}

export const CurrentActivityBadge: React.FC<CurrentActivityBadgeProps> = ({ activity }) => {
  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'productive':
        return {
          bg: 'bg-emerald-950/60',
          border: 'border-emerald-500/30',
          text: 'text-emerald-400',
          badgeText: 'PRODUCTIVE',
          glow: 'shadow-[0_0_12px_rgba(16,185,129,0.2)]',
        };
      case 'distraction':
        return {
          bg: 'bg-red-950/60',
          border: 'border-red-500/30',
          text: 'text-red-400',
          badgeText: 'DISTRACTION',
          glow: 'shadow-[0_0_12px_rgba(239,68,68,0.2)]',
        };
      case 'idle':
        return {
          bg: 'bg-zinc-900/60',
          border: 'border-zinc-600/30',
          text: 'text-zinc-400',
          badgeText: 'IDLE',
          glow: '',
        };
      case 'neutral':
      default:
        return {
          bg: 'bg-blue-950/60',
          border: 'border-blue-500/30',
          text: 'text-blue-400',
          badgeText: 'NEUTRAL',
          glow: 'shadow-[0_0_12px_rgba(59,130,246,0.2)]',
        };
    }
  };

  const style = getCategoryStyles(activity.category);
  const minutes = Math.floor(activity.current_duration_seconds / 60);
  const seconds = activity.current_duration_seconds % 60;

  return (
    <div className="neu-panel p-4 sm:p-5 mb-7 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3.5 min-w-0">
        {/* Recessed Icon Socket */}
        <div className={`neu-sunken p-3 rounded-2xl shrink-0 ${style.glow}`}>
          {activity.is_idle ? (
            <Clock className="w-5 h-5 text-zinc-400" />
          ) : activity.domain ? (
            <Globe className="w-5 h-5 text-amber-400" />
          ) : (
            <Monitor className="w-5 h-5 text-emerald-400" />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-display font-bold text-sm sm:text-base text-white tracking-wide truncate">
              {activity.application}
            </span>
            {activity.domain && (
              <span className="font-mono text-xs text-amber-300/90 bg-[#12110c] px-2 py-0.5 rounded-md border border-amber-500/20 shadow-inner truncate">
                {activity.domain}
              </span>
            )}
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${style.border} ${style.bg} ${style.text}`}>
              {style.badgeText}
            </span>
          </div>

          <p className="font-mono text-xs text-[#787988] truncate max-w-[320px] sm:max-w-md md:max-w-lg">
            {activity.window_title || 'Active Session'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {activity.is_idle && (
          <div className="neu-sunken flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-500/30 text-red-300 font-mono text-xs shadow-[0_0_10px_rgba(239,68,68,0.2)]">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            <span>IDLE DETECTED</span>
          </div>
        )}

        <div className="neu-sunken px-4 py-2 rounded-xl text-right">
          <div className="text-[10px] font-mono uppercase text-[#71727e] tracking-wider">DURATION</div>
          <div className="font-mono text-xs font-bold text-[#e4e4e7]">
            {minutes}m {seconds}s
          </div>
        </div>
      </div>
    </div>
  );
};
