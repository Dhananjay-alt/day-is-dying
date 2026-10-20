use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Category {
    Productive,
    Neutral,
    Distraction,
    Idle,
}

impl Category {
    pub fn as_str(&self) -> &'static str {
        match self {
            Category::Productive => "productive",
            Category::Neutral => "neutral",
            Category::Distraction => "distraction",
            Category::Idle => "idle",
        }
    }

    pub fn from_str(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "productive" => Category::Productive,
            "neutral" => Category::Neutral,
            "distraction" => Category::Distraction,
            "idle" => Category::Idle,
            _ => Category::Neutral,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivitySession {
    pub id: i64,
    pub source: String, // "desktop" or "browser"
    pub application: String,
    pub domain: Option<String>,
    pub window_title: String,
    pub category: Category,
    pub started_at: String, // ISO timestamp
    pub ended_at: String,
    pub duration_seconds: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivityRule {
    pub id: i64,
    pub pattern: String,
    pub rule_type: String, // "app" or "domain"
    pub category: Category,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CurrentActivity {
    pub application: String,
    pub domain: Option<String>,
    pub window_title: String,
    pub category: Category,
    pub is_idle: bool,
    pub idle_seconds: i64,
    pub current_duration_seconds: i64,
    pub is_tracking_paused: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DayStatus {
    pub current_time: String,
    pub day_start: String,
    pub day_end: String,
    pub total_day_seconds: i64,
    pub elapsed_seconds: i64,
    pub remaining_seconds: i64,
    pub percentage_elapsed: f64,
    pub escalating_message: String,
    pub severity_level: String, // "normal", "half", "dying", "critical", "dead"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivitySummary {
    pub date: String,
    pub productive_seconds: i64,
    pub neutral_seconds: i64,
    pub distraction_seconds: i64,
    pub idle_seconds: i64,
    pub total_active_seconds: i64,
    pub biggest_sink_name: String,
    pub biggest_sink_seconds: i64,
    pub opportunity_cost_estimated: f64,
    pub time_debt_seconds: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IntervalAnalysis {
    pub interval_minutes: i64,
    pub productive_seconds: i64,
    pub distraction_seconds: i64,
    pub idle_seconds: i64,
    pub app_switches_count: i64,
    pub dominant_name: String,
    pub dominant_category: Category,
    pub headline: String,
    pub body: String,
    pub sound_type: String, // "normal", "distraction", "focus", "warning", "hour", "end_of_day"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimelineSegment {
    pub id: i64,
    pub application: String,
    pub domain: Option<String>,
    pub window_title: String,
    pub category: Category,
    pub started_at: String,
    pub ended_at: String,
    pub duration_seconds: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DailyBar {
    pub day_name: String,
    pub date: String,
    pub productive_seconds: i64,
    pub neutral_seconds: i64,
    pub distraction_seconds: i64,
    pub idle_seconds: i64,
    pub total_seconds: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WeeklyReport {
    pub days: Vec<DailyBar>,
    pub total_active_seconds: i64,
    pub total_productive_seconds: i64,
    pub total_neutral_seconds: i64,
    pub total_distraction_seconds: i64,
    pub total_idle_seconds: i64,
    pub average_daily_distraction_seconds: i64,
    pub best_day_name: String,
    pub best_day_productive_seconds: i64,
    pub worst_day_name: String,
    pub worst_day_distraction_seconds: i64,
    pub biggest_sink_name: String,
    pub biggest_sink_seconds: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BrowserActivityPayload {
    pub domain: String,
    pub title: Option<String>,
    pub duration_seconds: Option<i64>,
    pub is_idle: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub day_start: String, // "06:00"
    pub day_end: String,   // "00:00"
    pub reminder_interval_minutes: i64, // 15, 30, 45, 60
    pub idle_threshold_seconds: i64,    // 300
    pub sound_enabled: bool,
    pub sound_volume: f64, // 0.0 - 1.0
    pub sound_profile: String, // "cinematic", "brutal", "minimal"
    pub hourly_rate: f64,      // e.g. 300.0
    pub currency_symbol: String, // "₹", "$", etc.
    pub time_debt_enabled: bool,
    pub browser_tracking_enabled: bool,
    pub desktop_tracking_enabled: bool,
    pub first_run_completed: bool,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            day_start: "06:00".to_string(),
            day_end: "00:00".to_string(),
            reminder_interval_minutes: 30,
            idle_threshold_seconds: 300,
            sound_enabled: true,
            sound_volume: 0.8,
            sound_profile: "cinematic".to_string(),
            hourly_rate: 300.0,
            currency_symbol: "₹".to_string(),
            time_debt_enabled: true,
            browser_tracking_enabled: true,
            desktop_tracking_enabled: true,
            first_run_completed: false,
        }
    }
}
