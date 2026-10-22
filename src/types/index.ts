export type Category = 'productive' | 'neutral' | 'distraction' | 'idle';

export interface ActivitySession {
  id: number;
  source: 'desktop' | 'browser';
  application: string;
  domain?: string | null;
  window_title: string;
  category: Category;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
}

export interface ActivityRule {
  id: number;
  pattern: string;
  rule_type: 'app' | 'domain';
  category: Category;
}

export interface CurrentActivity {
  application: string;
  domain?: string | null;
  window_title: string;
  category: Category;
  is_idle: boolean;
  idle_seconds: number;
  current_duration_seconds: number;
  is_tracking_paused: boolean;
}

export interface DayStatus {
  current_time: string;
  day_start: string;
  day_end: string;
  total_day_seconds: number;
  elapsed_seconds: number;
  remaining_seconds: number;
  percentage_elapsed: number;
  escalating_message: string;
  severity_level: 'normal' | 'half' | 'dying' | 'critical' | 'dead';
}

export interface ActivitySummary {
  date: string;
  productive_seconds: number;
  neutral_seconds: number;
  distraction_seconds: number;
  idle_seconds: number;
  total_active_seconds: number;
  biggest_sink_name: string;
  biggest_sink_seconds: number;
  opportunity_cost_estimated: number;
  time_debt_seconds: number;
}

export interface IntervalAnalysis {
  interval_minutes: number;
  productive_seconds: number;
  distraction_seconds: number;
  idle_seconds: number;
  app_switches_count: number;
  dominant_name: string;
  dominant_category: Category;
  headline: string;
  body: string;
  sound_type: 'normal' | 'distraction' | 'focus' | 'warning' | 'hour' | 'end_of_day';
}

export interface TimelineSegment {
  id: number;
  application: string;
  domain?: string | null;
  window_title: string;
  category: Category;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
}

export interface DailyBar {
  day_name: string;
  date: string;
  productive_seconds: number;
  neutral_seconds: number;
  distraction_seconds: number;
  idle_seconds: number;
  total_seconds: number;
}

export interface WeeklyReport {
  days: DailyBar[];
  total_active_seconds: number;
  total_productive_seconds: number;
  total_neutral_seconds: number;
  total_distraction_seconds: number;
  total_idle_seconds: number;
  average_daily_distraction_seconds: number;
  best_day_name: string;
  best_day_productive_seconds: number;
  worst_day_name: string;
  worst_day_distraction_seconds: number;
  biggest_sink_name: string;
  biggest_sink_seconds: number;
}

export interface AppSettings {
  day_start: string;
  day_end: string;
  reminder_interval_minutes: number;
  idle_threshold_seconds: number;
  sound_enabled: boolean;
  sound_volume: number;
  sound_profile: 'cinematic' | 'brutal' | 'minimal';
  hourly_rate: number;
  currency_symbol: string;
  time_debt_enabled: boolean;
  browser_tracking_enabled: boolean;
  desktop_tracking_enabled: boolean;
  first_run_completed: boolean;
  hud_visible?: boolean;
  hud_position_x?: number | null;
  hud_position_y?: number | null;
  hud_always_on_top?: boolean;
  start_with_windows?: boolean;
}
