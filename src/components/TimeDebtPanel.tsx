import { useState } from 'react';
import { ShieldAlert, Zap, CheckCircle2 } from 'lucide-react';
import { soundEngine } from '../services/audio';

interface TimeDebtPanelProps {
  debtSeconds: number;
  onRepayDebt: (seconds: number) => void;
  onStartFocus: (minutes: number) => void;
}

function formatSeconds(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export const TimeDebtPanel: React.FC<TimeDebtPanelProps> = ({
  debtSeconds,
  onRepayDebt,
  onStartFocus,
}) => {
  const [repaymentFeedback, setRepaymentFeedback] = useState<string | null>(null);

  const handleQuickRepay = (minutes: number) => {
    const sec = minutes * 60;
    soundEngine.playFocusClick();
    onRepayDebt(sec);
    setRepaymentFeedback(`${minutes} MIN REPAID`);
    setTimeout(() => setRepaymentFeedback(null), 3000);
  };

  const hasDebt = debtSeconds > 0;

  return (
    <div className="neu-panel p-6 flex-1 relative flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3.5 border-b border-white/[0.04] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="neu-sunken p-1.5 rounded-lg">
              <ShieldAlert className={`w-4 h-4 ${hasDebt ? 'text-amber-400' : 'text-emerald-400'}`} />
            </div>
            <h3 className="font-display font-extrabold text-sm tracking-wider uppercase text-white">
              TIME DEBT
            </h3>
          </div>
          <span className="text-[10px] font-mono text-[#787988] uppercase tracking-wider">
            Psychological Ledger
          </span>
        </div>

        <p className="text-xs text-[#a1a1aa] mb-4 leading-relaxed">
          Time surrendered to distractions accumulates here. Repay it with unbroken focus blocks.
        </p>

        {/* Debt Digital Readout */}
        <div className="neu-sunken p-5 mb-5 rounded-2xl text-center relative overflow-hidden">
          <div className={`font-mono font-black text-3xl sm:text-4xl tracking-wider drop-shadow-md ${
            hasDebt ? 'text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]' : 'text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]'
          }`}>
            {formatSeconds(debtSeconds)}
          </div>
          <div className="text-[10px] font-mono tracking-widest text-[#71727f] uppercase mt-1.5 font-bold">
            {hasDebt ? 'ACCUMULATED DISTRACTION TIME' : 'ALL TIME DEBT SETTLED'}
          </div>

          {repaymentFeedback && (
            <div className="absolute inset-0 bg-[#0d2a1d]/90 backdrop-blur-sm border border-emerald-500/40 rounded-2xl flex items-center justify-center gap-2 text-emerald-400 font-mono text-sm font-bold animate-in fade-in zoom-in-95 duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{repaymentFeedback}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Repayment Buttons */}
      <div>
        <div className="text-[10px] font-mono font-bold text-[#71727e] uppercase tracking-wider mb-2.5">
          REPAY THROUGH FOCUSED WORK:
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          <button
            onClick={() => onStartFocus(25)}
            className="neu-btn py-2.5 text-xs font-mono font-bold text-[#e4e4e7] flex flex-col items-center justify-center gap-0.5 rounded-xl"
            title="Focus for 25 minutes"
          >
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> 25m
            </span>
            <span className="text-[9px] text-[#71727e]">FOCUS</span>
          </button>

          <button
            onClick={() => onStartFocus(50)}
            className="neu-btn py-2.5 text-xs font-mono font-bold text-[#e4e4e7] flex flex-col items-center justify-center gap-0.5 rounded-xl"
            title="Focus for 50 minutes"
          >
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> 50m
            </span>
            <span className="text-[9px] text-[#71727e]">FOCUS</span>
          </button>

          <button
            onClick={() => handleQuickRepay(30)}
            className="neu-btn py-2.5 text-xs font-mono font-bold text-emerald-400 border-emerald-500/30 flex flex-col items-center justify-center gap-0.5 rounded-xl"
            title="Mark 30m as repaid manually"
          >
            <span>-30m</span>
            <span className="text-[9px] text-emerald-500/80">REPAY</span>
          </button>
        </div>
      </div>
    </div>
  );
};
