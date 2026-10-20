import { useState, useEffect, useCallback } from 'react';
import { api, isTauri } from './services/api';
import { soundEngine } from './services/audio';
import {
  DayStatus,
  CurrentActivity,
  ActivitySummary,
  TimelineSegment,
  WeeklyReport,
  AppSettings,
  ActivityRule,
  IntervalAnalysis,
  Category,
} from './types';
import { Header } from './components/Header';
import { CountdownHero } from './components/CountdownHero';
import { CurrentActivityBadge } from './components/CurrentActivityBadge';
import { StatsGrid } from './components/StatsGrid';
import { TimeDebtPanel } from './components/TimeDebtPanel';
import { OpportunityCostPanel } from './components/OpportunityCostPanel';
import { TimelineView } from './components/TimelineView';
import { WeeklyAnalytics } from './components/WeeklyAnalytics';
import { FocusModeModal } from './components/FocusModeModal';
import { EndOfDayReportModal } from './components/EndOfDayReportModal';
import { SignatureNotification } from './components/SignatureNotification';
import { SettingsModal } from './components/SettingsModal';
import { OnboardingModal } from './components/OnboardingModal';
import { FloatingWidgetView } from './components/FloatingWidgetView';
import { CornerPinWidget } from './components/CornerPinWidget';

export function App() {
  const [dayStatus, setDayStatus] = useState<DayStatus | null>(null);
  const [currentActivity, setCurrentActivity] = useState<CurrentActivity | null>(null);
  const [summary, setSummary] = useState<ActivitySummary | null>(null);
  const [timeline, setTimeline] = useState<TimelineSegment[]>([]);
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [rules, setRules] = useState<ActivityRule[]>([]);
  const [isPaused, setIsPaused] = useState(false);

  // Modals & View States
  const [isWidgetMode, setIsWidgetMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      return p.get('view') === 'widget';
    }
    return false;
  });
  const [isCornerWidgetVisible, setIsCornerWidgetVisible] = useState(() => {
    try {
      return localStorage.getItem('ydid_corner_visible') !== 'false';
    } catch {
      return true;
    }
  });
  const [isFocusOpen, setIsFocusOpen] = useState(false);
  const [focusInitialMinutes, setFocusInitialMinutes] = useState(25);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEndOfDayOpen, setIsEndOfDayOpen] = useState(false);
  const [isOpenNotificationTester, setIsOpenNotificationTester] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [activeNotification, setActiveNotification] = useState<IntervalAnalysis | null>(null);

  // Listen for native Tauri window events (e.g. CloseRequested transitions into floating widget on top of other apps)
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    if (isTauri()) {
      import('@tauri-apps/api/event')
        .then(({ listen }) => {
          listen('switch-to-widget-mode', () => {
            setIsWidgetMode(true);
          }).then((fn) => {
            unlisten = fn;
          });
        })
        .catch((err) => {
          console.warn('Failed to register switch-to-widget-mode listener:', err);
        });
    }
    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  // 1. Initial Data Load
  const loadInitialData = useCallback(async () => {
    try {
      const [initSettings, initRules, initSummary, initTimeline, initWeekly, initDay, initAct] =
        await Promise.all([
          api.getSettings(),
          api.getRules(),
          api.getActivitySummary(),
          api.getTimeline(),
          api.getWeeklyReport(),
          api.getDayStatus(),
          api.getCurrentActivity(),
        ]);

      setSettings(initSettings);
      setRules(initRules);
      setSummary(initSummary);
      setTimeline(initTimeline);
      setWeeklyReport(initWeekly);
      setDayStatus(initDay);
      setCurrentActivity(initAct);
      setIsPaused(initAct.is_tracking_paused);

      // Sound settings configuration
      soundEngine.setVolume(initSettings.sound_volume);
      soundEngine.setMuted(!initSettings.sound_enabled);
      soundEngine.setProfile(initSettings.sound_profile);

      // Check onboarding
      if (!initSettings.first_run_completed) {
        setIsOnboardingOpen(true);
      }
    } catch (err) {
      console.error('Failed to load initial YDID data:', err);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // 2. High-Frequency Poller (1-second clock & active activity)
  useEffect(() => {
    const tickInterval = setInterval(async () => {
      try {
        const [day, act] = await Promise.all([api.getDayStatus(), api.getCurrentActivity()]);
        setDayStatus(day);
        setCurrentActivity(act);
        setIsPaused(act.is_tracking_paused);
      } catch (err) {
        console.error('Tick update error:', err);
      }
    }, 1000);

    return () => clearInterval(tickInterval);
  }, []);

  // 3. Medium-Frequency Poller (Summary & Timeline every 10 seconds)
  useEffect(() => {
    const dataInterval = setInterval(async () => {
      try {
        const [sum, time] = await Promise.all([api.getActivitySummary(), api.getTimeline()]);
        setSummary(sum);
        setTimeline(time);
      } catch (err) {
        console.error('Data refresh error:', err);
      }
    }, 10000);

    return () => clearInterval(dataInterval);
  }, []);

  // 4. Periodic Context-Aware Interruption Engine
  useEffect(() => {
    if (!settings) return;
    const intervalMs = settings.reminder_interval_minutes * 60 * 1000;

    const notifInterval = setInterval(async () => {
      if (isPaused) return;
      try {
        const analysis = await api.getIntervalAnalysis(settings.reminder_interval_minutes);
        soundEngine.playByType(analysis.sound_type);
        setActiveNotification(analysis);

        // Auto dismiss after 12 seconds
        setTimeout(() => {
          setActiveNotification(null);
        }, 12000);
      } catch (err) {
        console.error('Notification engine error:', err);
      }
    }, intervalMs);

    return () => clearInterval(notifInterval);
  }, [settings, isPaused]);

  // Handlers
  const handleTogglePause = async () => {
    const newPause = await api.toggleTrackingPaused();
    setIsPaused(newPause);
    if (currentActivity) {
      setCurrentActivity({ ...currentActivity, is_tracking_paused: newPause });
    }
  };

  const handleToggleWidgetMode = async () => {
    const target = !isWidgetMode;
    setIsWidgetMode(target);
    await api.setWidgetMode(target);
  };

  const handleToggleCornerWidget = (target?: boolean) => {
    setIsCornerWidgetVisible((prev) => {
      const next = typeof target === 'boolean' ? target : !prev;
      try {
        localStorage.setItem('ydid_corner_visible', String(next));
      } catch {}
      return next;
    });
  };

  const handleStartFocus = (mins: number) => {
    setFocusInitialMinutes(mins);
    setIsFocusOpen(true);
  };

  const handleCompleteFocusSession = async (minutes: number) => {
    const repaySec = minutes * 60;
    await api.repayTimeDebt(repaySec);
    const updatedSummary = await api.getActivitySummary();
    setSummary(updatedSummary);
  };

  const handleRepayDebtDirect = async (seconds: number) => {
    await api.repayTimeDebt(seconds);
    const updatedSummary = await api.getActivitySummary();
    setSummary(updatedSummary);
  };

  const handleSaveSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    await api.saveSettings(newSettings);
    soundEngine.setVolume(newSettings.sound_volume);
    soundEngine.setMuted(!newSettings.sound_enabled);
    soundEngine.setProfile(newSettings.sound_profile);
  };

  const handleAddRule = async (pattern: string, type: 'app' | 'domain', category: Category) => {
    await api.addOrUpdateRule(pattern, type, category);
    const updatedRules = await api.getRules();
    setRules(updatedRules);
  };

  const handleDeleteRule = async (id: number) => {
    await api.deleteRule(id);
    const updatedRules = await api.getRules();
    setRules(updatedRules);
  };

  const handleDeleteAllData = async () => {
    await api.deleteAllData();
    const [initSummary, initTimeline, initWeekly] = await Promise.all([
      api.getActivitySummary(),
      api.getTimeline(),
      api.getWeeklyReport(),
    ]);
    setSummary(initSummary);
    setTimeline(initTimeline);
    setWeeklyReport(initWeekly);
    soundEngine.playDistractionHit();
  };

  const handleExportData = async () => {
    const jsonStr = await api.exportDataJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `YDID_activity_export_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOnboardingComplete = async (onboardConfig: {
    reminderInterval: number;
    trackBrowser: boolean;
  }) => {
    if (!settings) return;
    const updated: AppSettings = {
      ...settings,
      reminder_interval_minutes: onboardConfig.reminderInterval,
      browser_tracking_enabled: onboardConfig.trackBrowser,
      first_run_completed: true,
    };
    setSettings(updated);
    await api.saveSettings(updated);
    setIsOnboardingOpen(false);
  };

  // Simulated notification triggers for test suite
  const handleTriggerSimulatedNotification = (
    scenario: 'productive' | 'distraction' | 'switching' | 'deep_focus' | 'idle' | 'mixed'
  ) => {
    let payload: IntervalAnalysis;

    switch (scenario) {
      case 'productive':
        payload = {
          interval_minutes: 30,
          productive_seconds: 28 * 60,
          distraction_seconds: 0,
          idle_seconds: 0,
          app_switches_count: 1,
          dominant_name: 'VS Code',
          dominant_category: 'productive',
          headline: '30 MINUTES GONE.',
          body: 'You spent them coding. Keep going.',
          sound_type: 'focus',
        };
        break;
      case 'distraction':
        payload = {
          interval_minutes: 30,
          productive_seconds: 3 * 60,
          distraction_seconds: 27 * 60,
          idle_seconds: 0,
          app_switches_count: 2,
          dominant_name: 'YouTube',
          dominant_category: 'distraction',
          headline: '30 MINUTES GONE.',
          body: 'YouTube took 27 of them.',
          sound_type: 'distraction',
        };
        break;
      case 'switching':
        payload = {
          interval_minutes: 30,
          productive_seconds: 10 * 60,
          distraction_seconds: 12 * 60,
          idle_seconds: 0,
          app_switches_count: 7,
          dominant_name: 'Multiple',
          dominant_category: 'distraction',
          headline: 'WHERE DID YOU GO?',
          body: '7 apps. 30 minutes.',
          sound_type: 'warning',
        };
        break;
      case 'deep_focus':
        payload = {
          interval_minutes: 48,
          productive_seconds: 48 * 60,
          distraction_seconds: 0,
          idle_seconds: 0,
          app_switches_count: 1,
          dominant_name: 'Terminal',
          dominant_category: 'productive',
          headline: 'TIME PASSED.',
          body: '48 minutes of uninterrupted work. Keep going.',
          sound_type: 'focus',
        };
        break;
      case 'idle':
        payload = {
          interval_minutes: 30,
          productive_seconds: 0,
          distraction_seconds: 0,
          idle_seconds: 30 * 60,
          app_switches_count: 0,
          dominant_name: 'Away',
          dominant_category: 'idle',
          headline: "THE CLOCK DIDN'T STOP.",
          body: 'You were away for 30 minutes.',
          sound_type: 'warning',
        };
        break;
      case 'mixed':
      default:
        payload = {
          interval_minutes: 30,
          productive_seconds: 12 * 60,
          distraction_seconds: 11 * 60,
          idle_seconds: 7 * 60,
          app_switches_count: 4,
          dominant_name: 'Mixed',
          dominant_category: 'neutral',
          headline: '30 MINUTES GONE.',
          body: '12m coding, 11m YouTube, 7m browsing. Where did it go?',
          sound_type: 'normal',
        };
        break;
    }

    soundEngine.playByType(payload.sound_type);
    setActiveNotification(payload);
    setIsOpenNotificationTester(false);

    setTimeout(() => {
      setActiveNotification(null);
    }, 10000);
  };

  // If in Floating Widget Mode, render the tactile compact widget
  if (isWidgetMode && dayStatus && currentActivity) {
    return (
      <FloatingWidgetView
        dayStatus={dayStatus}
        currentActivity={currentActivity}
        isPaused={isPaused}
        onTogglePause={handleTogglePause}
        onExpandDashboard={handleToggleWidgetMode}
        activeNotification={activeNotification}
        onDismissNotification={() => setActiveNotification(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#1e2028] text-[#e4e4e7] p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto flex flex-col justify-between overflow-x-hidden">
      <div>
        {/* Navigation & Header */}
        <Header
          currentTime={dayStatus?.current_time || '18:19:17'}
          isPaused={isPaused}
          onTogglePause={handleTogglePause}
          onOpenFocus={() => setIsFocusOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenEndOfDay={() => setIsEndOfDayOpen(true)}
          onOpenNotificationTest={() => setIsOpenNotificationTester(true)}
          onToggleWidgetMode={handleToggleWidgetMode}
          isCornerWidgetVisible={isCornerWidgetVisible}
          onToggleCornerWidget={() => handleToggleCornerWidget()}
        />

        {/* Central Physical Countdown Instrument & Life Bar */}
        {dayStatus && <CountdownHero dayStatus={dayStatus} />}

        {/* Currently Tracked Desktop Window / Browser Badge */}
        {currentActivity && <CurrentActivityBadge activity={currentActivity} />}

        {/* 4 Metric Category Blocks (Productive, Neutral, Distraction, Idle) */}
        {summary && <StatsGrid summary={summary} />}

        {/* Asymmetrical Ledger: Time Debt + Opportunity Cost */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {summary && (
            <TimeDebtPanel
              debtSeconds={summary.time_debt_seconds}
              onRepayDebt={handleRepayDebtDirect}
              onStartFocus={handleStartFocus}
            />
          )}

          {summary && settings && (
            <OpportunityCostPanel
              summary={summary}
              hourlyRate={settings.hourly_rate}
              currencySymbol={settings.currency_symbol}
            />
          )}
        </div>

        {/* Today's Timeline with Filtered Segments */}
        <TimelineView timeline={timeline} />

        {/* Weekly Rolling Analytics */}
        {weeklyReport && <WeeklyAnalytics report={weeklyReport} />}
      </div>

      {/* Understated Neomorphic Footer */}
      <footer className="mt-8 pt-5 border-t border-white/[0.04] flex flex-wrap items-center justify-between text-[11px] font-mono text-[#656673] gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-600 inline-block shadow-[0_0_6px_rgba(239,68,68,0.6)]" />
          <span className="font-bold text-[#a1a1aa] uppercase">YOUR DAY IS DYING</span>
          <span>• 100% Local SQLite • Zero Telemetry</span>
        </div>
        <div>
          <span>Browser Bridge: </span>
          <code className="text-[#808096]">http://127.0.0.1:41832</code>
        </div>
      </footer>

      {/* Pinned HUD Widget (Freely movable anywhere on screen) */}
      {isCornerWidgetVisible && dayStatus && currentActivity && (
        <CornerPinWidget
          dayStatus={dayStatus}
          currentActivity={currentActivity}
          isPaused={isPaused}
          onTogglePause={handleTogglePause}
          onStartFocus={() => handleStartFocus(25)}
          onClose={() => handleToggleCornerWidget(false)}
        />
      )}

      {/* Modals & Overlays */}
      {currentActivity && (
        <FocusModeModal
          isOpen={isFocusOpen}
          onClose={() => setIsFocusOpen(false)}
          currentActivity={currentActivity}
          onCompleteFocusSession={handleCompleteFocusSession}
          initialMinutes={focusInitialMinutes}
        />
      )}

      {summary && (
        <EndOfDayReportModal
          isOpen={isEndOfDayOpen}
          onClose={() => setIsEndOfDayOpen(false)}
          summary={summary}
        />
      )}

      {settings && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          rules={rules}
          onSaveSettings={handleSaveSettings}
          onAddRule={handleAddRule}
          onDeleteRule={handleDeleteRule}
          onDeleteAllData={handleDeleteAllData}
          onExportData={handleExportData}
        />
      )}

      <SignatureNotification
        notification={activeNotification}
        onDismiss={() => setActiveNotification(null)}
        isOpenTester={isOpenNotificationTester}
        onCloseTester={() => setIsOpenNotificationTester(false)}
        onTriggerSimulated={handleTriggerSimulatedNotification}
      />

      <OnboardingModal
        isOpen={isOnboardingOpen}
        onComplete={handleOnboardingComplete}
      />
    </div>
  );
}

export default App;
