import { DollarSign, AlertTriangle } from 'lucide-react';
import { ActivitySummary } from '../types';

interface OpportunityCostPanelProps {
  summary: ActivitySummary;
  hourlyRate: number;
  currencySymbol: string;
}

export const OpportunityCostPanel: React.FC<OpportunityCostPanelProps> = ({
  summary,
  hourlyRate,
  currencySymbol,
}) => {
  const hoursWasted = summary.distraction_seconds / 3600;
  const cost = Math.round(hoursWasted * hourlyRate);

  const formatDistractionTime = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  };

  return (
    <div className="neu-panel p-6 flex-1 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3.5 border-b border-white/[0.04] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="neu-sunken p-1.5 rounded-lg">
              <DollarSign className="w-4 h-4 text-red-400" />
            </div>
            <h3 className="font-display font-extrabold text-sm tracking-wider uppercase text-white">
              OPPORTUNITY COST
            </h3>
          </div>
          <span className="text-[10px] font-mono text-[#787988] uppercase tracking-wider">
            Value Estimation
          </span>
        </div>

        <p className="text-xs text-[#a1a1aa] mb-4 leading-relaxed">
          Calculates estimated economic value lost during distraction intervals based on your rate.
        </p>

        {/* Readout */}
        <div className="neu-sunken p-5 mb-5 rounded-2xl text-center">
          <div className="font-mono font-black text-3xl sm:text-4xl tracking-wider text-red-400 drop-shadow-[0_0_12px_rgba(239,68,68,0.35)]">
            {currencySymbol}{cost.toLocaleString()}
          </div>
          <div className="text-[10px] font-mono tracking-widest text-[#71727f] uppercase mt-1.5 font-bold">
            ESTIMATED LOST VALUE TODAY
          </div>
        </div>
      </div>

      <div className="neu-sunken p-4 rounded-xl text-xs font-mono">
        <div className="flex items-center justify-between text-[#a1a1aa] mb-1.5">
          <span>Distraction duration:</span>
          <span className="font-bold text-red-400">{formatDistractionTime(summary.distraction_seconds)}</span>
        </div>
        <div className="flex items-center justify-between text-[#a1a1aa] mb-1.5">
          <span>Configured hourly value:</span>
          <span className="font-bold text-white">{currencySymbol}{hourlyRate}/hr</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-[#656673] mt-2.5 pt-2 border-t border-white/[0.04]">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-500/70" />
          <span>This is an estimated potential value metric, not actual financial loss.</span>
        </div>
      </div>
    </div>
  );
};
