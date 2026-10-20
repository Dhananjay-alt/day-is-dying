import { useState } from 'react';
import { X, Volume2, ShieldCheck, Download, Trash2, Plus, Sliders, Clock } from 'lucide-react';
import { AppSettings, ActivityRule, Category } from '../types';
import { soundEngine } from '../services/audio';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  rules: ActivityRule[];
  onSaveSettings: (settings: AppSettings) => void;
  onAddRule: (pattern: string, type: 'app' | 'domain', category: Category) => void;
  onDeleteRule: (id: number) => void;
  onDeleteAllData: () => void;
  onExportData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  rules,
  onSaveSettings,
  onAddRule,
  onDeleteRule,
  onDeleteAllData,
  onExportData,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'rules' | 'privacy'>('general');
  const [currentSettings, setCurrentSettings] = useState<AppSettings>(settings);

  // New rule inputs
  const [newPattern, setNewPattern] = useState('');
  const [newRuleType, setNewRuleType] = useState<'app' | 'domain'>('domain');
  const [newCategory, setNewCategory] = useState<Category>('distraction');

  if (!isOpen) return null;

  const handleSave = () => {
    soundEngine.playFocusClick();
    onSaveSettings(currentSettings);
    onClose();
  };

  const handleAddRuleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPattern.trim()) return;
    onAddRule(newPattern.trim(), newRuleType, newCategory);
    setNewPattern('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="neu-panel w-full max-w-2xl max-h-[90vh] flex flex-col relative rounded-3xl border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.85)]">
        {/* Header */}
        <div className="p-6 border-b border-white/[0.04] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="neu-sunken p-2 rounded-xl">
              <Sliders className="w-5 h-5 text-white" />
            </div>
            <h2 className="font-display font-black text-lg text-white uppercase tracking-wider">
              CONTROL PANEL & CONFIGURATION
            </h2>
          </div>
          <button onClick={onClose} className="p-2 neu-btn rounded-full text-[#888998] hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="px-6 pt-4">
          <div className="neu-sunken p-1.5 rounded-2xl flex font-mono text-xs">
            {(['general', 'notifications', 'rules', 'privacy'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 rounded-xl uppercase font-bold tracking-wider transition-all text-center ${
                  activeTab === tab
                    ? 'neu-raised text-white shadow-md'
                    : 'text-[#787988] hover:text-[#a1a1aa]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 font-mono text-xs">
          {activeTab === 'general' && (
            <div className="space-y-5">
              {/* Day Boundaries */}
              <div className="neu-sunken p-5 rounded-2xl">
                <h4 className="font-bold text-white uppercase flex items-center gap-2 mb-3.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  Day Boundaries
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#a1a1aa] mb-1.5">Day Starts At</label>
                    <input
                      type="time"
                      value={currentSettings.day_start}
                      onChange={(e) =>
                        setCurrentSettings({ ...currentSettings, day_start: e.target.value })
                      }
                      className="w-full bg-[#0a0b0e] border border-white/5 rounded-xl p-2.5 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[#a1a1aa] mb-1.5">Day Ends At</label>
                    <input
                      type="time"
                      value={currentSettings.day_end}
                      onChange={(e) =>
                        setCurrentSettings({ ...currentSettings, day_end: e.target.value })
                      }
                      className="w-full bg-[#0a0b0e] border border-white/5 rounded-xl p-2.5 text-white font-bold"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-[#71727e] mt-2.5">
                  Remaining day countdown and health bar are calibrated to this custom active window.
                </p>
              </div>

              {/* Idle Detection Threshold */}
              <div className="neu-sunken p-5 rounded-2xl">
                <div className="flex justify-between items-center mb-2.5">
                  <h4 className="font-bold text-white uppercase">Idle Inactivity Threshold</h4>
                  <span className="font-bold text-white bg-[#15161c] px-2.5 py-1 rounded-lg border border-white/5">
                    {Math.round(currentSettings.idle_threshold_seconds / 60)} minutes
                  </span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="900"
                  step="60"
                  value={currentSettings.idle_threshold_seconds}
                  onChange={(e) =>
                    setCurrentSettings({
                      ...currentSettings,
                      idle_threshold_seconds: parseInt(e.target.value),
                    })
                  }
                  className="w-full accent-white"
                />
                <div className="flex justify-between text-[10px] text-[#71727e] mt-1.5">
                  <span>1 min</span>
                  <span>5 mins (Default)</span>
                  <span>15 mins</span>
                </div>
              </div>

              {/* Hourly Rate */}
              <div className="neu-sunken p-5 rounded-2xl">
                <h4 className="font-bold text-white uppercase mb-3">Opportunity Cost Calculation</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#a1a1aa] mb-1.5">Currency Symbol</label>
                    <input
                      type="text"
                      value={currentSettings.currency_symbol}
                      onChange={(e) =>
                        setCurrentSettings({ ...currentSettings, currency_symbol: e.target.value })
                      }
                      className="w-full bg-[#0a0b0e] border border-white/5 rounded-xl p-2.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[#a1a1aa] mb-1.5">Hourly Value</label>
                    <input
                      type="number"
                      value={currentSettings.hourly_rate}
                      onChange={(e) =>
                        setCurrentSettings({
                          ...currentSettings,
                          hourly_rate: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-[#0a0b0e] border border-white/5 rounded-xl p-2.5 text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-5">
              {/* Notification Interval */}
              <div className="neu-sunken p-5 rounded-2xl">
                <h4 className="font-bold text-white uppercase mb-2">
                  Interruption Frequency
                </h4>
                <p className="text-[#a1a1aa] text-[11px] mb-3.5 leading-relaxed">
                  How often should YOUR DAY IS DYING forcefully remind you of your disappearing time?
                </p>
                <div className="grid grid-cols-4 gap-2.5">
                  {[15, 30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      onClick={() =>
                        setCurrentSettings({
                          ...currentSettings,
                          reminder_interval_minutes: mins,
                        })
                      }
                      className={`py-2.5 text-center font-bold rounded-xl transition-all ${
                        currentSettings.reminder_interval_minutes === mins
                          ? 'bg-white text-black shadow-md'
                          : 'neu-btn text-[#a1a1aa]'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Sound Controls */}
              <div className="neu-sunken p-5 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-white uppercase flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                    Procedural Sound Engine
                  </h4>
                  <button
                    onClick={() => {
                      const enabled = !currentSettings.sound_enabled;
                      setCurrentSettings({ ...currentSettings, sound_enabled: enabled });
                      soundEngine.setMuted(!enabled);
                    }}
                    className={`px-3.5 py-1.5 font-bold rounded-full text-[10px] transition-all ${
                      currentSettings.sound_enabled
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-600/30'
                    }`}
                  >
                    {currentSettings.sound_enabled ? 'AUDIO ACTIVE' : 'MUTED'}
                  </button>
                </div>

                {/* Volume Slider */}
                <div className="mb-4">
                  <div className="flex justify-between text-[#a1a1aa] mb-1.5">
                    <span>Sound Volume</span>
                    <span className="font-bold text-white">{Math.round(currentSettings.sound_volume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={currentSettings.sound_volume}
                    onChange={(e) => {
                      const vol = parseFloat(e.target.value);
                      setCurrentSettings({ ...currentSettings, sound_volume: vol });
                      soundEngine.setVolume(vol);
                    }}
                    className="w-full accent-white"
                  />
                </div>

                {/* Sound Profile */}
                <div>
                  <label className="block text-[#a1a1aa] mb-2 uppercase font-bold text-[10px]">
                    Sound Profile Identity
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {(['cinematic', 'brutal', 'minimal'] as const).map((prof) => (
                      <button
                        key={prof}
                        onClick={() => {
                          setCurrentSettings({ ...currentSettings, sound_profile: prof });
                          soundEngine.setProfile(prof);
                          soundEngine.playDistractionHit();
                        }}
                        className={`py-2.5 uppercase font-bold text-[11px] rounded-xl transition-all ${
                          currentSettings.sound_profile === prof
                            ? 'bg-white text-black shadow-md'
                            : 'neu-btn text-[#a1a1aa]'
                        }`}
                      >
                        {prof}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Test Sound Cues */}
                <div className="mt-5 pt-3.5 border-t border-white/[0.04]">
                  <span className="text-[10px] text-[#787988] uppercase block mb-2.5 font-bold">
                    Test Acoustic Signatures:
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => soundEngine.playNormalTick()}
                      className="neu-btn p-2 text-[10px] rounded-xl"
                    >
                      Mechanical Tick
                    </button>
                    <button
                      onClick={() => soundEngine.playDistractionHit()}
                      className="neu-btn p-2 text-[10px] rounded-xl text-red-400"
                    >
                      Distraction Hit
                    </button>
                    <button
                      onClick={() => soundEngine.playHourStrike()}
                      className="neu-btn p-2 text-[10px] rounded-xl text-amber-400"
                    >
                      Cinematic Chime
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-4">
              {/* Add New Rule Form */}
              <form onSubmit={handleAddRuleSubmit} className="neu-sunken p-4 rounded-2xl">
                <span className="font-bold text-white uppercase block mb-2.5 text-[11px]">
                  Add / Override Classification Rule
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <input
                    type="text"
                    placeholder="e.g. youtube.com or code.exe"
                    value={newPattern}
                    onChange={(e) => setNewPattern(e.target.value)}
                    className="sm:col-span-2 bg-[#090a0d] border border-white/5 rounded-xl p-2.5 text-white font-mono text-xs"
                  />
                  <select
                    value={newRuleType}
                    onChange={(e) => setNewRuleType(e.target.value as any)}
                    className="bg-[#090a0d] border border-white/5 rounded-xl p-2.5 text-white font-mono text-xs"
                  >
                    <option value="domain">Domain (Web)</option>
                    <option value="app">App (.exe)</option>
                  </select>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="bg-[#090a0d] border border-white/5 rounded-xl p-2.5 text-white font-mono text-xs"
                  >
                    <option value="productive">Productive</option>
                    <option value="neutral">Neutral</option>
                    <option value="distraction">Distraction</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="neu-btn w-full mt-3 py-2 text-xs text-[#e4e4e7] flex items-center justify-center gap-2 rounded-xl"
                >
                  <Plus className="w-3.5 h-3.5" /> ADD RULE
                </button>
              </form>

              {/* Active Rules List */}
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between p-3 neu-sunken rounded-xl"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="text-[10px] text-[#787988] uppercase font-bold w-14">
                        {rule.rule_type}
                      </span>
                      <span className="font-bold text-white truncate max-w-[200px]">
                        {rule.pattern}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span
                        className={`text-[9px] uppercase px-2 py-0.5 font-bold rounded-full border ${
                          rule.category === 'productive'
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30'
                            : rule.category === 'distraction'
                            ? 'bg-red-950 text-red-400 border-red-500/30'
                            : 'bg-blue-950 text-blue-400 border-blue-500/30'
                        }`}
                      >
                        {rule.category}
                      </span>
                      <button
                        onClick={() => onDeleteRule(rule.id)}
                        className="text-[#71727e] hover:text-red-400 p-1 rounded-lg"
                        title="Delete rule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-5">
              <div className="neu-sunken p-6 rounded-2xl border border-emerald-500/30 bg-[#0c1a14]/60">
                <div className="flex items-center gap-2.5 text-emerald-400 font-bold mb-3 uppercase tracking-wider">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>YOUR DATA STAYS LOCAL</span>
                </div>
                <div className="space-y-1.5 text-[#d1fae5] font-mono text-xs">
                  <p>• No account required.</p>
                  <p>• No cloud service required.</p>
                  <p>• Zero keystrokes recorded.</p>
                  <p>• Zero screenshots captured.</p>
                  <p>• Zero passwords recorded.</p>
                  <p>• Zero browsing history uploaded.</p>
                  <p>• All tracking stays on your local SQLite file on this machine.</p>
                </div>
              </div>

              {/* Data actions */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={onExportData}
                  className="neu-btn py-3 flex items-center justify-center gap-2 text-white rounded-xl"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>EXPORT DATA (JSON)</span>
                </button>

                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to completely erase all activity records?')) {
                      onDeleteAllData();
                    }
                  }}
                  className="neu-btn neu-btn-danger py-3 flex items-center justify-center gap-2 rounded-xl text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>DELETE ALL DATA</span>
                </button>
              </div>

              <div className="text-[10px] text-[#71727e] border-t border-white/[0.04] pt-3.5">
                Chrome Extension Bridge: <code className="text-white">http://127.0.0.1:41832/api/activity</code>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/[0.04] flex justify-end gap-3 rounded-b-3xl">
          <button
            onClick={onClose}
            className="neu-btn px-5 py-2.5 font-mono text-xs text-[#a1a1aa] rounded-xl"
          >
            CANCEL
          </button>
          <button
            onClick={handleSave}
            className="neu-btn neu-btn-accent px-7 py-2.5 font-mono text-xs font-bold rounded-xl shadow-lg"
          >
            SAVE CHANGES
          </button>
        </div>
      </div>
    </div>
  );
};
