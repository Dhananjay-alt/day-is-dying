import { useState } from 'react';
import { ArrowRight, Bell, Globe, Check, Zap } from 'lucide-react';
import { soundEngine } from '../services/audio';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (settings: { reminderInterval: number; trackBrowser: boolean; startWithWindows: boolean }) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onComplete }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [reminderInterval, setReminderInterval] = useState(30);
  const [trackBrowser, setTrackBrowser] = useState(true);
  const [startWithWindows, setStartWithWindows] = useState(true);

  if (!isOpen) return null;

  const handleNext = () => {
    soundEngine.playFocusClick();
    if (step < 4) {
      setStep((prev) => (prev + 1) as any);
    } else {
      soundEngine.playDistractionHit();
      onComplete({ reminderInterval, trackBrowser, startWithWindows });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="neu-panel w-full max-w-md p-8 sm:p-9 text-center relative rounded-3xl border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.85)]">
        {/* Step Indicator */}
        <div className="flex justify-center gap-2 mb-7">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                step === s
                  ? 'w-10 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                  : step > s
                  ? 'w-6 bg-zinc-600'
                  : 'w-6 bg-zinc-800'
              }`}
            />
          ))}
        </div>

        {/* SCREEN 1 */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 neu-sunken mx-auto rounded-3xl flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.2)]">
              <Zap className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h1 className="font-display font-black text-3xl tracking-widest text-white uppercase mb-2">
                YOUR DAY IS DYING.
              </h1>
              <p className="font-mono text-sm tracking-widest text-red-400 uppercase font-semibold">
                Time won't wait.
              </p>
            </div>
            <p className="text-xs font-mono text-[#a1a1aa] leading-relaxed">
              This is not a motivational app or a Pomodoro timer. It is a personal instrument measuring your remaining day in real time.
            </p>
            <button
              onClick={handleNext}
              className="neu-btn neu-btn-accent w-full py-4 font-mono font-bold text-xs tracking-widest flex items-center justify-center gap-2 rounded-2xl shadow-lg"
            >
              <span>CONTINUE</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* SCREEN 2 */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 neu-sunken mx-auto rounded-3xl flex items-center justify-center">
              <Bell className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <h2 className="font-display font-black text-xl text-white uppercase tracking-wider mb-2">
                HOW OFTEN SHOULD I REMIND YOU?
              </h2>
              <p className="text-xs font-mono text-[#787988]">
                Select your interruption frequency.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              {[15, 30, 45, 60].map((mins) => (
                <button
                  key={mins}
                  onClick={() => {
                    soundEngine.playNormalTick();
                    setReminderInterval(mins);
                  }}
                  className={`py-3.5 font-bold rounded-2xl transition-all ${
                    reminderInterval === mins
                      ? 'bg-white text-black shadow-md'
                      : 'neu-btn text-[#a1a1aa]'
                  }`}
                >
                  {mins} MINUTES {mins === 30 && '(DEFAULT)'}
                </button>
              ))}
            </div>

            <button
              onClick={handleNext}
              className="neu-btn w-full py-4 font-mono font-bold text-xs tracking-widest flex items-center justify-center gap-2 text-white rounded-2xl"
            >
              <span>CONTINUE</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* SCREEN 3 */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 neu-sunken mx-auto rounded-3xl flex items-center justify-center">
              <Globe className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <h2 className="font-display font-black text-xl text-white uppercase tracking-wider mb-2">
                SHOULD I TRACK YOUR BROWSER?
              </h2>
              <p className="text-xs font-mono text-[#a1a1aa] leading-relaxed">
                This allows YDID to understand where your time goes across YouTube, GitHub, Reddit, and docs.
              </p>
            </div>

            <div className="neu-sunken p-4 rounded-2xl text-left text-[11px] font-mono text-[#787988] space-y-1">
              <p className="text-emerald-400 font-bold mb-1">100% LOCAL PRIVACY GUARANTEE:</p>
              <p>Zero keystrokes. Zero passwords. Zero cloud uploads. All records remain in your local SQLite database.</p>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={() => {
                  setTrackBrowser(true);
                  handleNext();
                }}
                className="neu-btn neu-btn-accent w-full py-3.5 font-mono font-bold text-xs tracking-widest flex items-center justify-center gap-2 rounded-2xl shadow-lg"
              >
                <span>ENABLE BROWSER TRACKING</span>
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setTrackBrowser(false);
                  handleNext();
                }}
                className="w-full py-2.5 text-xs font-mono text-[#787988] hover:text-[#a1a1aa]"
              >
                SKIP FOR NOW
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 4 */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 neu-sunken mx-auto rounded-3xl flex items-center justify-center border border-red-500/30">
              <Check className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h2 className="font-display font-black text-2xl text-white uppercase tracking-wider mb-2">
                I'LL STAY QUIET.
              </h2>
              <p className="font-mono text-sm text-red-400 font-bold uppercase tracking-wider">
                Until your next {reminderInterval}-minute reminder.
              </p>
            </div>
            <p className="text-xs font-mono text-[#787988]">
              YDID is now calibrated. It runs unobtrusively in your system tray and floating desktop widget.
            </p>

            {/* Start with Windows toggle */}
            <div
              onClick={() => setStartWithWindows(!startWithWindows)}
              className="neu-sunken p-3.5 rounded-2xl flex items-center justify-between cursor-pointer text-left hover:border-white/10 transition-colors"
            >
              <div>
                <div className="font-mono text-xs font-bold text-white">Start automatically with Windows</div>
                <div className="text-[10px] text-[#787988]">Launch in background on boot</div>
              </div>
              <input
                type="checkbox"
                checked={startWithWindows}
                onChange={(e) => setStartWithWindows(e.target.checked)}
                className="w-4 h-4 rounded accent-red-500 cursor-pointer"
              />
            </div>

            <button
              onClick={handleNext}
              className="neu-btn neu-btn-accent w-full py-4 font-mono font-extrabold text-sm tracking-widest rounded-2xl shadow-xl"
            >
              START MONITORING
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
