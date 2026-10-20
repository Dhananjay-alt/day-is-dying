import { invoke } from '@tauri-apps/api/core';
import {
  CurrentActivity,
  DayStatus,
  ActivitySummary,
  TimelineSegment,
  WeeklyReport,
  IntervalAnalysis,
  ActivityRule,
  AppSettings,
} from '../types';

// Check if Tauri environment is active
export const isTauri = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
};

// Fallback mock state for browser preview or demo
let mockPaused = false;
let mockTimeDebtSeconds = 4820; // 1h 20m default debt
let mockSettings: AppSettings = {
  day_start: '06:00',
  day_end: '00:00',
  reminder_interval_minutes: 30,
  idle_threshold_seconds: 300,
  sound_enabled: true,
  sound_volume: 0.8,
  sound_profile: 'cinematic',
  hourly_rate: 300,
  currency_symbol: '₹',
  time_debt_enabled: true,
  browser_tracking_enabled: true,
  desktop_tracking_enabled: true,
  first_run_completed: true,
};

let mockRules: ActivityRule[] = [
  { id: 1, pattern: 'code.exe', rule_type: 'app', category: 'productive' },
  { id: 2, pattern: 'windowsterminal.exe', rule_type: 'app', category: 'productive' },
  { id: 3, pattern: 'github.com', rule_type: 'domain', category: 'productive' },
  { id: 4, pattern: 'figma.exe', rule_type: 'app', category: 'productive' },
  { id: 5, pattern: 'spotify.exe', rule_type: 'app', category: 'neutral' },
  { id: 6, pattern: 'slack.exe', rule_type: 'app', category: 'neutral' },
  { id: 7, pattern: 'youtube.com', rule_type: 'domain', category: 'distraction' },
  { id: 8, pattern: 'reddit.com', rule_type: 'domain', category: 'distraction' },
  { id: 9, pattern: 'twitter.com', rule_type: 'domain', category: 'distraction' },
  { id: 10, pattern: 'steam.exe', rule_type: 'app', category: 'distraction' },
];

export const api = {
  async getCurrentActivity(): Promise<CurrentActivity> {
    if (isTauri()) {
      try {
        return await invoke<CurrentActivity>('get_current_activity');
      } catch (e) {
        console.warn('Tauri invoke failed:', e);
      }
    }
    // Browser fallback simulation
    return {
      application: 'Code.exe',
      domain: 'github.com',
      window_title: 'YOUR DAY IS DYING - App.tsx',
      category: 'productive',
      is_idle: false,
      idle_seconds: 0,
      current_duration_seconds: 1420,
      is_tracking_paused: mockPaused,
    };
  },

  async getDayStatus(): Promise<DayStatus> {
    if (isTauri()) {
      try {
        return await invoke<DayStatus>('get_day_status');
      } catch (e) {
        console.warn('Tauri invoke failed:', e);
      }
    }
    // Calculate realistic day status from real current clock time
    const now = new Date();
    const curSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const startSec = 6 * 3600; // 06:00
    const endSec = 24 * 3600; // 00:00 midnight
    const totalDaySec = endSec - startSec;
    const elapsed = Math.max(0, curSeconds - startSec);
    const rem = Math.max(0, totalDaySec - elapsed);
    const pct = Math.min(100, (elapsed / totalDaySec) * 100);

    let msg = 'YOUR DAY IS DYING.';
    let severity: DayStatus['severity_level'] = 'dying';

    if (pct >= 100) {
      msg = 'TODAY IS DEAD.';
      severity = 'dead';
    } else if (pct >= 95) {
      msg = 'THIS IS ALMOST OVER.';
      severity = 'critical';
    } else if (pct >= 85) {
      msg = "YOU DON'T HAVE MUCH LEFT.";
      severity = 'critical';
    } else if (pct >= 70) {
      msg = 'YOUR DAY IS DYING.';
      severity = 'dying';
    } else if (pct >= 50) {
      msg = 'HALF YOUR DAY IS GONE.';
      severity = 'half';
    } else if (pct >= 25) {
      msg = 'THE DAY IS SLIPPING AWAY.';
      severity = 'normal';
    } else {
      msg = 'THE DAY HAS STARTED.';
      severity = 'normal';
    }

    return {
      current_time: now.toTimeString().split(' ')[0],
      day_start: mockSettings.day_start,
      day_end: mockSettings.day_end,
      total_day_seconds: totalDaySec,
      elapsed_seconds: elapsed,
      remaining_seconds: rem,
      percentage_elapsed: Math.round(pct * 10) / 10,
      escalating_message: msg,
      severity_level: severity,
    };
  },

  async getActivitySummary(date?: string): Promise<ActivitySummary> {
    if (isTauri()) {
      try {
        return await invoke<ActivitySummary>('get_activity_summary', { date });
      } catch (e) {
        console.warn('Tauri invoke failed:', e);
      }
    }
    return {
      date: date || new Date().toISOString().split('T')[0],
      productive_seconds: 4 * 3600 + 32 * 60,
      neutral_seconds: 2 * 3600 + 11 * 60,
      distraction_seconds: 1 * 3600 + 48 * 60,
      idle_seconds: 51 * 60,
      total_active_seconds: 8 * 3600 + 31 * 60,
      biggest_sink_name: 'youtube.com',
      biggest_sink_seconds: 78 * 60,
      opportunity_cost_estimated: 540,
      time_debt_seconds: mockTimeDebtSeconds,
    };
  },

  async getTimeline(date?: string): Promise<TimelineSegment[]> {
    if (isTauri()) {
      try {
        return await invoke<TimelineSegment[]>('get_timeline', { date });
      } catch (e) {
        console.warn('Tauri invoke failed:', e);
      }
    }
    const today = date || new Date().toISOString().split('T')[0];
    return [
      { id: 1, application: 'Code.exe', window_title: 'YDID Architecture - VS Code', category: 'productive', started_at: `${today}T08:30:00`, ended_at: `${today}T09:40:00`, duration_seconds: 70 * 60 },
      { id: 2, application: 'Browser', domain: 'youtube.com', window_title: 'Mechanical Keyboards & Dark Ambience - YouTube', category: 'distraction', started_at: `${today}T09:40:00`, ended_at: `${today}T10:12:00`, duration_seconds: 32 * 60 },
      { id: 3, application: 'WindowsTerminal.exe', window_title: 'PowerShell - cargo check', category: 'productive', started_at: `${today}T10:12:00`, ended_at: `${today}T11:30:00`, duration_seconds: 78 * 60 },
      { id: 4, application: 'Browser', domain: 'reddit.com', window_title: 'r/unixporn - Neobrutalism UI', category: 'distraction', started_at: `${today}T11:30:00`, ended_at: `${today}T12:00:00`, duration_seconds: 30 * 60 },
      { id: 5, application: 'Idle', window_title: 'Away from desk - Lunch', category: 'idle', started_at: `${today}T12:00:00`, ended_at: `${today}T13:00:00`, duration_seconds: 60 * 60 },
      { id: 6, application: 'Code.exe', window_title: 'App.tsx - React Tauri UI', category: 'productive', started_at: `${today}T13:00:00`, ended_at: `${today}T15:20:00`, duration_seconds: 140 * 60 },
      { id: 7, application: 'Spotify.exe', window_title: 'Trent Reznor - Atmospheric Soundtrack', category: 'neutral', started_at: `${today}T15:20:00`, ended_at: `${today}T16:00:00`, duration_seconds: 40 * 60 },
      { id: 8, application: 'Browser', domain: 'github.com', window_title: 'tauri-apps/tauri - GitHub', category: 'productive', started_at: `${today}T16:00:00`, ended_at: `${today}T18:19:00`, duration_seconds: 139 * 60 },
    ];
  },

  async getWeeklyReport(endDate?: string): Promise<WeeklyReport> {
    if (isTauri()) {
      try {
        return await invoke<WeeklyReport>('get_weekly_report', { endDate });
      } catch (e) {
        console.warn('Tauri invoke failed:', e);
      }
    }
    return {
      days: [
        { day_name: 'Mon', date: '2026-10-14', productive_seconds: 6 * 3600, neutral_seconds: 2 * 3600, distraction_seconds: 2.2 * 3600, idle_seconds: 1.2 * 3600, total_seconds: 11.4 * 3600 },
        { day_name: 'Tue', date: '2026-10-15', productive_seconds: 6.7 * 3600, neutral_seconds: 1.5 * 3600, distraction_seconds: 1.2 * 3600, idle_seconds: 1.0 * 3600, total_seconds: 10.4 * 3600 },
        { day_name: 'Wed', date: '2026-10-16', productive_seconds: 7.2 * 3600, neutral_seconds: 2.0 * 3600, distraction_seconds: 1.8 * 3600, idle_seconds: 0.8 * 3600, total_seconds: 11.8 * 3600 },
        { day_name: 'Thu', date: '2026-10-17', productive_seconds: 4.1 * 3600, neutral_seconds: 1.8 * 3600, distraction_seconds: 3.5 * 3600, idle_seconds: 1.5 * 3600, total_seconds: 10.9 * 3600 },
        { day_name: 'Fri', date: '2026-10-18', productive_seconds: 5.8 * 3600, neutral_seconds: 2.2 * 3600, distraction_seconds: 2.1 * 3600, idle_seconds: 1.1 * 3600, total_seconds: 11.2 * 3600 },
        { day_name: 'Sat', date: '2026-10-19', productive_seconds: 6.5 * 3600, neutral_seconds: 1.2 * 3600, distraction_seconds: 2.8 * 3600, idle_seconds: 2.0 * 3600, total_seconds: 12.5 * 3600 },
        { day_name: 'Sun', date: '2026-10-20', productive_seconds: 4.5 * 3600, neutral_seconds: 2.1 * 3600, distraction_seconds: 1.8 * 3600, idle_seconds: 0.9 * 3600, total_seconds: 9.3 * 3600 },
      ],
      total_active_seconds: 56 * 3600,
      total_productive_seconds: 40.8 * 3600,
      total_neutral_seconds: 12.8 * 3600,
      total_distraction_seconds: 15.4 * 3600,
      total_idle_seconds: 8.5 * 3600,
      average_daily_distraction_seconds: 2.2 * 3600,
      best_day_name: 'Tuesday',
      best_day_productive_seconds: 6.7 * 3600,
      worst_day_name: 'Thursday',
      worst_day_distraction_seconds: 3.5 * 3600,
      biggest_sink_name: 'youtube.com',
      biggest_sink_seconds: 5 * 3600 + 13 * 60,
    };
  },

  async getIntervalAnalysis(minutes: number): Promise<IntervalAnalysis> {
    if (isTauri()) {
      try {
        return await invoke<IntervalAnalysis>('get_interval_analysis', { minutes });
      } catch (e) {
        console.warn('Tauri invoke failed:', e);
      }
    }
    return {
      interval_minutes: minutes,
      productive_seconds: 3 * 60,
      distraction_seconds: 27 * 60,
      idle_seconds: 0,
      app_switches_count: 2,
      dominant_name: 'YouTube',
      dominant_category: 'distraction',
      headline: `${minutes} MINUTES GONE.`,
      body: `YouTube took 27 of them.`,
      sound_type: 'distraction',
    };
  },

  async repayTimeDebt(seconds: number): Promise<void> {
    if (isTauri()) {
      try {
        await invoke('repay_time_debt', { seconds });
        return;
      } catch (e) {
        console.warn('Tauri invoke failed:', e);
      }
    }
    mockTimeDebtSeconds = Math.max(0, mockTimeDebtSeconds - seconds);
  },

  async getRules(): Promise<ActivityRule[]> {
    if (isTauri()) {
      try {
        return await invoke<ActivityRule[]>('get_rules');
      } catch (e) {
        console.warn('Tauri invoke failed:', e);
      }
    }
    return [...mockRules];
  },

  async addOrUpdateRule(pattern: string, rule_type: string, category: string): Promise<void> {
    if (isTauri()) {
      try {
        await invoke('add_or_update_rule', { pattern, ruleType: rule_type, category });
        return;
      } catch (e) {
        console.warn('Tauri invoke failed:', e);
      }
    }
    const existing = mockRules.find((r) => r.pattern.toLowerCase() === pattern.toLowerCase());
    if (existing) {
      existing.rule_type = rule_type as 'app' | 'domain';
      existing.category = category as any;
    } else {
      mockRules.push({
        id: Date.now(),
        pattern,
        rule_type: rule_type as 'app' | 'domain',
        category: category as any,
      });
    }
  },

  async deleteRule(id: number): Promise<void> {
    if (isTauri()) {
      try {
        await invoke('delete_rule', { id });
        return;
      } catch (e) {
        console.warn('Tauri invoke failed:', e);
      }
    }
    mockRules = mockRules.filter((r) => r.id !== id);
  },

  async getSettings(): Promise<AppSettings> {
    if (isTauri()) {
      try {
        return await invoke<AppSettings>('get_settings');
      } catch (e) {
        console.warn('Tauri invoke failed:', e);
      }
    }
    return { ...mockSettings };
  },

  async saveSettings(settings: AppSettings): Promise<void> {
    if (isTauri()) {
      try {
        await invoke('save_settings', { settings });
        return;
      } catch (e) {
        console.warn('Tauri invoke failed:', e);
      }
    }
    mockSettings = { ...settings };
  },

  async toggleTrackingPaused(): Promise<boolean> {
    if (isTauri()) {
      try {
        return await invoke<boolean>('toggle_tracking_paused');
      } catch (e) {
        console.warn('Tauri invoke failed:', e);
      }
    }
    mockPaused = !mockPaused;
    return mockPaused;
  },

  async deleteAllData(): Promise<void> {
    if (isTauri()) {
      try {
        await invoke('delete_all_data');
        return;
      } catch (e) {
        console.warn('Tauri invoke failed:', e);
      }
    }
    mockTimeDebtSeconds = 0;
  },

  async exportDataJson(): Promise<string> {
    if (isTauri()) {
      try {
        return await invoke<string>('export_data_json');
      } catch (e) {
        console.warn('Tauri invoke failed:', e);
      }
    }
    return JSON.stringify(await this.getTimeline(), null, 2);
  },

  async setWidgetMode(widget: boolean): Promise<void> {
    if (isTauri()) {
      try {
        await invoke('set_widget_mode', { widget });
      } catch (e) {
        console.warn('Tauri invoke failed:', e);
      }
    }
  },

  async hideToTray(): Promise<void> {
    if (isTauri()) {
      try {
        await invoke('hide_to_tray');
      } catch (e) {
        console.warn('Tauri invoke failed:', e);
      }
    }
  },
};
