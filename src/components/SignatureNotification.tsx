import { X, AlertTriangle, ShieldAlert, Zap, Clock } from 'lucide-react';
import { IntervalAnalysis } from '../types';
import { soundEngine } from '../services/audio';

interface SignatureNotificationProps {
  notification: IntervalAnalysis | null;
  onDismiss: () => void;
  isOpenTester: boolean;
  onCloseTester: () => void;
  onTriggerSimulated: (scenario: 'productive' | 'distraction' | 'switching' | 'deep_focus' | 'idle' | 'mixed') => void;
}

export const SignatureNotification: React.FC<SignatureNotificationProps> = ({
  notification,
  onDismiss,
  isOpenTester,
  onCloseTester,
  onTriggerSimulated,
}) => {
  return (
    <>
      {/* 1. The Real Expanding Notification Interruption */}
      {notification && (
        <div className="fixed top-6 right-6 z-50 max-w-sm sm:max-w-md w-full animate-in slide-in-from-top-4 duration-300">
          <div className="neu-panel rounded-3xl p-6 text-white relative border border-red-500/40 shadow-[0_15px_35px_rgba(0,0,0,0.85)] glow-danger">
            {/* Warning Indicator */}
            <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-white/[0.04]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-ping" />
                <span className="font-display font-extrabold text-xs tracking-[0.2em] text-red-500 uppercase">
                  YOUR DAY IS DYING.
                </span>
              </div>
              <button
                onClick={onDismiss}
                className="p-1 neu-btn rounded-full text-[#888998] hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Headline */}
            <h3 className="font-mono font-black text-2xl tracking-wider text-white mb-2 uppercase drop-shadow-md">
              {notification.headline}
            </h3>

            {/* Context-aware message body */}
            <p className="font-display font-medium text-base text-[#e4e4e7] mb-4">
              {notification.body}
            </p>

            {/* Footer timestamp & acknowledge */}
            <div className="flex items-center justify-between pt-3.5 border-t border-white/[0.04]">
              <span className="font-mono text-[10px] text-[#787988] uppercase">
                {notification.interval_minutes}m interval audit
              </span>
              <button
                onClick={() => {
                  soundEngine.playFocusClick();
                  onDismiss();
                }}
                className="neu-btn neu-btn-accent py-1.5 px-4 text-xs font-mono font-bold text-white uppercase rounded-xl"
              >
                DISMISS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Notification Scenario Tester Modal */}
      {isOpenTester && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="neu-panel w-full max-w-lg p-7 sm:p-9 relative rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.85)]">
            <button
              onClick={onCloseTester}
              className="absolute top-5 right-5 p-2 neu-btn rounded-full text-[#888998] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="neu-sunken p-2 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <h2 className="font-display font-black text-lg text-white uppercase tracking-wider">
                SIGNATURE NOTIFICATION ENGINE
              </h2>
            </div>

            <p className="text-xs text-[#a1a1aa] mb-5 leading-relaxed">
              The app automatically interrupts you every configured interval (default 30m). Test how each context-aware scenario behaves:
            </p>

            <div className="space-y-3 font-mono text-xs">
              {/* Productive */}
              <button
                onClick={() => onTriggerSimulated('productive')}
                className="neu-sunken w-full p-4 text-left rounded-2xl hover:shadow-[inset_3px_3px_8px_rgba(0,0,0,0.8)] transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="font-bold text-emerald-400 flex items-center gap-2 mb-1">
                    <Zap className="w-3.5 h-3.5" /> 1. PRODUCTIVE INTERVAL
                  </div>
                  <div className="text-[11px] text-[#a1a1aa]">
                    "30 MINUTES GONE. You spent them coding. Keep going."
                  </div>
                </div>
                <span className="text-[10px] neu-btn text-emerald-400 px-3 py-1 font-bold rounded-xl border-emerald-500/20">
                  TEST
                </span>
              </button>

              {/* Distraction */}
              <button
                onClick={() => onTriggerSimulated('distraction')}
                className="neu-sunken w-full p-4 text-left rounded-2xl hover:shadow-[inset_3px_3px_8px_rgba(0,0,0,0.8)] transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="font-bold text-red-400 flex items-center gap-2 mb-1">
                    <ShieldAlert className="w-3.5 h-3.5" /> 2. DISTRACTION INTERVAL
                  </div>
                  <div className="text-[11px] text-[#a1a1aa]">
                    "30 MINUTES GONE. YouTube took 27 of them."
                  </div>
                </div>
                <span className="text-[10px] neu-btn text-red-400 px-3 py-1 font-bold rounded-xl border-red-500/20">
                  TEST
                </span>
              </button>

              {/* App Switching */}
              <button
                onClick={() => onTriggerSimulated('switching')}
                className="neu-sunken w-full p-4 text-left rounded-2xl hover:shadow-[inset_3px_3px_8px_rgba(0,0,0,0.8)] transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="font-bold text-amber-400 flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> 3. CHAOTIC APP SWITCHING
                  </div>
                  <div className="text-[11px] text-[#a1a1aa]">
                    "WHERE DID YOU GO? 7 apps. 30 minutes."
                  </div>
                </div>
                <span className="text-[10px] neu-btn text-amber-400 px-3 py-1 font-bold rounded-xl border-amber-500/20">
                  TEST
                </span>
              </button>

              {/* Deep Focus */}
              <button
                onClick={() => onTriggerSimulated('deep_focus')}
                className="neu-sunken w-full p-4 text-left rounded-2xl hover:shadow-[inset_3px_3px_8px_rgba(0,0,0,0.8)] transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="font-bold text-emerald-300 flex items-center gap-2 mb-1">
                    <Zap className="w-3.5 h-3.5" /> 4. DEEP FOCUS STREAK
                  </div>
                  <div className="text-[11px] text-[#a1a1aa]">
                    "TIME PASSED. 48 minutes of uninterrupted work. Keep going."
                  </div>
                </div>
                <span className="text-[10px] neu-btn text-emerald-300 px-3 py-1 font-bold rounded-xl border-emerald-500/20">
                  TEST
                </span>
              </button>

              {/* Idle Away */}
              <button
                onClick={() => onTriggerSimulated('idle')}
                className="neu-sunken w-full p-4 text-left rounded-2xl hover:shadow-[inset_3px_3px_8px_rgba(0,0,0,0.8)] transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="font-bold text-zinc-300 flex items-center gap-2 mb-1">
                    <Clock className="w-3.5 h-3.5" /> 5. IDLE / AWAY FROM DESK
                  </div>
                  <div className="text-[11px] text-[#a1a1aa]">
                    "THE CLOCK DIDN'T STOP. You were away for 30 minutes."
                  </div>
                </div>
                <span className="text-[10px] neu-btn text-zinc-400 px-3 py-1 font-bold rounded-xl">
                  TEST
                </span>
              </button>

              {/* Mixed Activity */}
              <button
                onClick={() => onTriggerSimulated('mixed')}
                className="neu-sunken w-full p-4 text-left rounded-2xl hover:shadow-[inset_3px_3px_8px_rgba(0,0,0,0.8)] transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="font-bold text-blue-400 flex items-center gap-2 mb-1">
                    <span>⚡</span> 6. MIXED ACTIVITY
                  </div>
                  <div className="text-[11px] text-[#a1a1aa]">
                    "30 MINUTES GONE. 12m coding, 11m YouTube, 7m browsing. Where did it go?"
                  </div>
                </div>
                <span className="text-[10px] neu-btn text-blue-400 px-3 py-1 font-bold rounded-xl border-blue-500/20">
                  TEST
                </span>
              </button>
            </div>

            <button
              onClick={onCloseTester}
              className="neu-btn w-full py-3.5 mt-6 text-xs font-mono font-bold text-[#a1a1aa] rounded-xl"
            >
              CLOSE TESTER
            </button>
          </div>
        </div>
      )}
    </>
  );
};
