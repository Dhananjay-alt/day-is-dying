use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use rusqlite::{params, Connection};
use chrono::{Local, Duration, NaiveDate, DateTime};
use crate::models::{
    Category, ActivitySession, ActivityRule, ActivitySummary, 
    IntervalAnalysis, TimelineSegment, DailyBar, WeeklyReport, AppSettings
};

pub struct DbState {
    pub conn: Arc<Mutex<Connection>>,
}

impl DbState {
    pub fn new(db_path: PathBuf) -> Self {
        if let Some(parent) = db_path.parent() {
            let _ = std::fs::create_dir_all(parent);
        }

        let conn = Connection::open(&db_path)
            .expect("Failed to open SQLite database for YDID");

        // Enable WAL mode for high performance and low lock contention
        let _ = conn.execute_batch("PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL;");

        let state = Self {
            conn: Arc::new(Mutex::new(conn)),
        };

        state.init_schema();
        state.seed_defaults();
        state
    }

    fn init_schema(&self) {
        let conn = self.conn.lock().unwrap();
        conn.execute_batch(
            "
            CREATE TABLE IF NOT EXISTS activity_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source TEXT NOT NULL,
                application TEXT NOT NULL,
                domain TEXT,
                window_title TEXT NOT NULL,
                category TEXT NOT NULL,
                started_at TEXT NOT NULL,
                ended_at TEXT NOT NULL,
                duration_seconds INTEGER NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_sessions_dates 
            ON activity_sessions (started_at, ended_at);

            CREATE TABLE IF NOT EXISTS activity_rules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pattern TEXT NOT NULL UNIQUE,
                rule_type TEXT NOT NULL,
                category TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS focus_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                started_at TEXT NOT NULL,
                ended_at TEXT,
                planned_duration INTEGER NOT NULL,
                actual_duration INTEGER,
                completed INTEGER NOT NULL DEFAULT 0,
                goal TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS time_debt_repayments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                repaid_at TEXT NOT NULL,
                seconds INTEGER NOT NULL
            );
            "
        ).expect("Failed to initialize database schema");
    }

    fn seed_defaults(&self) {
        let conn = self.conn.lock().unwrap();
        let count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM activity_rules", 
            [], 
            |row| row.get(0)
        ).unwrap_or(0);

        if count == 0 {
            let default_rules = vec![
                // Productive Apps
                ("code.exe", "app", "productive"),
                ("devenv.exe", "app", "productive"),
                ("windowsterminal.exe", "app", "productive"),
                ("powershell.exe", "app", "productive"),
                ("cmd.exe", "app", "productive"),
                ("cursor.exe", "app", "productive"),
                ("figma.exe", "app", "productive"),
                ("notion.exe", "app", "productive"),
                ("obsidian.exe", "app", "productive"),
                ("datagrip64.exe", "app", "productive"),
                ("postman.exe", "app", "productive"),
                // Productive Domains
                ("github.com", "domain", "productive"),
                ("gitlab.com", "domain", "productive"),
                ("stackoverflow.com", "domain", "productive"),
                ("chatgpt.com", "domain", "productive"),
                ("claude.ai", "domain", "productive"),
                ("docs.google.com", "domain", "productive"),
                ("developer.mozilla.org", "domain", "productive"),
                ("rust-lang.org", "domain", "productive"),
                // Neutral Apps
                ("explorer.exe", "app", "neutral"),
                ("spotify.exe", "app", "neutral"),
                ("slack.exe", "app", "neutral"),
                ("teams.exe", "app", "neutral"),
                ("systemsettings.exe", "app", "neutral"),
                ("taskmgr.exe", "app", "neutral"),
                // Distraction Domains
                ("youtube.com", "domain", "distraction"),
                ("reddit.com", "domain", "distraction"),
                ("twitter.com", "domain", "distraction"),
                ("x.com", "domain", "distraction"),
                ("instagram.com", "domain", "distraction"),
                ("tiktok.com", "domain", "distraction"),
                ("twitch.tv", "domain", "distraction"),
                ("netflix.com", "domain", "distraction"),
                ("facebook.com", "domain", "distraction"),
                ("9gag.com", "domain", "distraction"),
                ("hulu.com", "domain", "distraction"),
                ("disneyplus.com", "domain", "distraction"),
                // Distraction Apps
                ("steam.exe", "app", "distraction"),
                ("epicgameslauncher.exe", "app", "distraction"),
                ("battle.net.exe", "app", "distraction"),
            ];

            for (pattern, r_type, cat) in default_rules {
                let _ = conn.execute(
                    "INSERT OR IGNORE INTO activity_rules (pattern, rule_type, category) VALUES (?1, ?2, ?3)",
                    params![pattern, r_type, cat],
                );
            }
        }
    }

    pub fn classify(&self, app_name: &str, domain: Option<&str>) -> Category {
        let conn = self.conn.lock().unwrap();

        // 1. Check domain rules first if available
        if let Some(dom) = domain {
            let dom_lower = dom.to_lowercase();
            let mut stmt = conn.prepare(
                "SELECT pattern, category FROM activity_rules WHERE rule_type = 'domain'"
            ).unwrap();
            let rows = stmt.query_map([], |row| {
                Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
            }).unwrap();

            for item in rows.flatten() {
                if dom_lower.contains(&item.0.to_lowercase()) {
                    return Category::from_str(&item.1);
                }
            }
        }

        // 2. Check application rules
        let app_lower = app_name.to_lowercase();
        let mut stmt = conn.prepare(
            "SELECT pattern, category FROM activity_rules WHERE rule_type = 'app'"
        ).unwrap();
        let rows = stmt.query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
        }).unwrap();

        for item in rows.flatten() {
            if app_lower.contains(&item.0.to_lowercase()) {
                return Category::from_str(&item.1);
            }
        }

        Category::Neutral
    }

    pub fn record_activity_chunk(
        &self,
        source: &str,
        app: &str,
        domain: Option<&str>,
        title: &str,
        category: &Category,
        duration_sec: i64,
    ) {
        if duration_sec <= 0 {
            return;
        }

        let conn = self.conn.lock().unwrap();
        let now = Local::now();
        let start = now - Duration::seconds(duration_sec);
        let started_at = start.to_rfc3339();
        let ended_at = now.to_rfc3339();

        // Check if the last recorded session has same app, domain and category within the last 5 seconds,
        // if so, coalesce / extend it to avoid fragmentation.
        let mut coalesced = false;
        let last_entry: Option<(i64, String, Option<String>, String, String, i64)> = conn.query_row(
            "SELECT id, application, domain, category, ended_at, duration_seconds 
             FROM activity_sessions ORDER BY id DESC LIMIT 1",
            [],
            |row| Ok((
                row.get(0)?,
                row.get(1)?,
                row.get(2)?,
                row.get(3)?,
                row.get(4)?,
                row.get(5)?,
            ))
        ).ok();

        if let Some((id, last_app, last_domain, last_cat, last_ended_at, prev_duration)) = last_entry {
            if last_app.eq_ignore_ascii_case(app) 
                && last_domain == domain.map(|s| s.to_string())
                && last_cat == category.as_str() 
            {
                if let Ok(prev_end) = DateTime::parse_from_rfc3339(&last_ended_at) {
                    let diff = (now.with_timezone(&prev_end.timezone()) - prev_end).num_seconds();
                    if diff < 15 {
                        let new_duration = prev_duration + duration_sec;
                        let _ = conn.execute(
                            "UPDATE activity_sessions SET ended_at = ?1, duration_seconds = ?2, window_title = ?3 WHERE id = ?4",
                            params![ended_at, new_duration, title, id],
                        );
                        coalesced = true;
                    }
                }
            }
        }

        if !coalesced {
            let _ = conn.execute(
                "INSERT INTO activity_sessions (source, application, domain, window_title, category, started_at, ended_at, duration_seconds)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
                params![
                    source,
                    app,
                    domain,
                    title,
                    category.as_str(),
                    started_at,
                    ended_at,
                    duration_sec,
                ],
            );
        }
    }

    pub fn get_summary(&self, date_str: &str, hourly_rate: f64) -> ActivitySummary {
        let conn = self.conn.lock().unwrap();
        let prefix = format!("{}%", date_str);

        let mut productive_seconds: i64 = 0;
        let mut neutral_seconds: i64 = 0;
        let mut distraction_seconds: i64 = 0;
        let mut idle_seconds: i64 = 0;

        let mut stmt = conn.prepare(
            "SELECT category, SUM(duration_seconds) 
             FROM activity_sessions 
             WHERE started_at LIKE ?1 
             GROUP BY category"
        ).unwrap();

        let rows = stmt.query_map(params![prefix], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?))
        }).unwrap();

        for item in rows.flatten() {
            match item.0.as_str() {
                "productive" => productive_seconds = item.1,
                "neutral" => neutral_seconds = item.1,
                "distraction" => distraction_seconds = item.1,
                "idle" => idle_seconds = item.1,
                _ => {}
            }
        }

        // Find biggest time sink among distractions & neutral
        let mut biggest_name = "None".to_string();
        let mut biggest_sec: i64 = 0;

        let sink_row: Option<(String, Option<String>, i64)> = conn.query_row(
            "SELECT application, domain, SUM(duration_seconds) as total_dur
             FROM activity_sessions
             WHERE started_at LIKE ?1 AND category = 'distraction'
             GROUP BY COALESCE(domain, application)
             ORDER BY total_dur DESC LIMIT 1",
            params![prefix],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?))
        ).ok();

        if let Some((app, dom, dur)) = sink_row {
            biggest_name = dom.unwrap_or(app);
            biggest_sec = dur;
        }

        let total_active_seconds = productive_seconds + neutral_seconds + distraction_seconds;

        // Estimated opportunity cost on distractions
        let hours_wasted = (distraction_seconds as f64) / 3600.0;
        let opportunity_cost_estimated = (hours_wasted * hourly_rate).max(0.0);

        // Time debt: all distraction time minus repayments
        let total_distractions_ever: i64 = conn.query_row(
            "SELECT COALESCE(SUM(duration_seconds), 0) FROM activity_sessions WHERE category = 'distraction'",
            [],
            |row| row.get(0)
        ).unwrap_or(0);

        let total_repaid: i64 = conn.query_row(
            "SELECT COALESCE(SUM(seconds), 0) FROM time_debt_repayments",
            [],
            |row| row.get(0)
        ).unwrap_or(0);

        let time_debt_seconds = (total_distractions_ever - total_repaid).max(0);

        ActivitySummary {
            date: date_str.to_string(),
            productive_seconds,
            neutral_seconds,
            distraction_seconds,
            idle_seconds,
            total_active_seconds,
            biggest_sink_name: biggest_name,
            biggest_sink_seconds: biggest_sec,
            opportunity_cost_estimated,
            time_debt_seconds,
        }
    }

    pub fn get_interval_analysis(&self, interval_minutes: i64) -> IntervalAnalysis {
        let conn = self.conn.lock().unwrap();
        let cutoff = (Local::now() - Duration::minutes(interval_minutes)).to_rfc3339();

        let mut productive: i64 = 0;
        let mut distraction: i64 = 0;
        let mut idle: i64 = 0;

        let mut stmt = conn.prepare(
            "SELECT category, SUM(duration_seconds) FROM activity_sessions 
             WHERE started_at >= ?1 GROUP BY category"
        ).unwrap();
        let rows = stmt.query_map(params![cutoff], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?))
        }).unwrap();

        for item in rows.flatten() {
            match item.0.as_str() {
                "productive" => productive = item.1,
                "distraction" => distraction = item.1,
                "idle" => idle = item.1,
                _ => {}
            }
        }

        // Distinct apps count
        let app_switches_count: i64 = conn.query_row(
            "SELECT COUNT(DISTINCT application) FROM activity_sessions WHERE started_at >= ?1",
            params![cutoff],
            |row| row.get(0)
        ).unwrap_or(1);

        // Dominant app
        let dom_row: Option<(String, Option<String>, String, i64)> = conn.query_row(
            "SELECT application, domain, category, SUM(duration_seconds) as dur
             FROM activity_sessions WHERE started_at >= ?1
             GROUP BY application, domain ORDER BY dur DESC LIMIT 1",
            params![cutoff],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?))
        ).ok();

        let (dominant_name, dominant_cat, _dominant_dur) = match dom_row {
            Some((app, dom, cat_str, dur)) => (dom.unwrap_or(app), Category::from_str(&cat_str), dur),
            None => ("Unknown".to_string(), Category::Neutral, 0),
        };

        // Synthesize brutal, context-aware notification copy
        let total_sec = productive + distraction + idle;
        let headline: String;
        let body: String;
        let sound_type: String;

        let interval_m = interval_minutes;
        let dist_m = distraction / 60;
        let prod_m = productive / 60;
        let idle_m = idle / 60;

        if idle >= (total_sec * 7 / 10).max(300) {
            headline = "THE CLOCK DIDN'T STOP.".to_string();
            body = format!("You were away for {} minutes.", idle_m.max(interval_m));
            sound_type = "warning".to_string();
        } else if distraction >= (total_sec * 6 / 10).max(300) {
            headline = format!("{} MINUTES GONE.", interval_m);
            body = format!("{} took {} of them.", dominant_name, dist_m.max(1));
            sound_type = "distraction".to_string();
        } else if app_switches_count >= 5 {
            headline = "WHERE DID YOU GO?".to_string();
            body = format!("{} apps. {} minutes.", app_switches_count, interval_m);
            sound_type = "warning".to_string();
        } else if productive >= (total_sec * 7 / 10).max(300) {
            if prod_m >= 40 {
                headline = "TIME PASSED.".to_string();
                body = format!("{} minutes of uninterrupted focus. Keep going.", prod_m);
            } else {
                headline = format!("{} MINUTES GONE.", interval_m);
                body = format!("You spent them on {}. Keep going.", dominant_name);
            }
            sound_type = "focus".to_string();
        } else {
            headline = format!("{} MINUTES GONE.", interval_m);
            body = format!("{}m productive, {}m distraction. Where did it go?", prod_m, dist_m);
            sound_type = "normal".to_string();
        }

        IntervalAnalysis {
            interval_minutes,
            productive_seconds: productive,
            distraction_seconds: distraction,
            idle_seconds: idle,
            app_switches_count,
            dominant_name,
            dominant_category: dominant_cat,
            headline,
            body,
            sound_type,
        }
    }

    pub fn get_timeline(&self, date_str: &str) -> Vec<TimelineSegment> {
        let conn = self.conn.lock().unwrap();
        let prefix = format!("{}%", date_str);

        let mut stmt = conn.prepare(
            "SELECT id, application, domain, window_title, category, started_at, ended_at, duration_seconds
             FROM activity_sessions
             WHERE started_at LIKE ?1
             ORDER BY started_at ASC"
        ).unwrap();

        let rows = stmt.query_map(params![prefix], |row| {
            Ok(TimelineSegment {
                id: row.get(0)?,
                application: row.get(1)?,
                domain: row.get(2)?,
                window_title: row.get(3)?,
                category: Category::from_str(&row.get::<_, String>(4)?),
                started_at: row.get(5)?,
                ended_at: row.get(6)?,
                duration_seconds: row.get(7)?,
            })
        }).unwrap();

        rows.flatten().collect()
    }

    pub fn get_weekly_report(&self, end_date_str: &str) -> WeeklyReport {
        let end_date = NaiveDate::parse_from_str(end_date_str, "%Y-%m-%d")
            .unwrap_or_else(|_| Local::now().date_naive());

        let mut daily_bars = Vec::new();
        let mut total_active = 0;
        let mut total_prod = 0;
        let mut total_neut = 0;
        let mut total_dist = 0;
        let mut total_idle = 0;

        let mut best_day = "None".to_string();
        let mut best_prod = -1;
        let mut worst_day = "None".to_string();
        let mut worst_dist = -1;

        for i in (0..7).rev() {
            let current = end_date - Duration::days(i);
            let d_str = current.format("%Y-%m-%d").to_string();
            let day_name = current.format("%a").to_string(); // "Mon", "Tue", etc.

            let summary = self.get_summary(&d_str, 0.0);
            total_prod += summary.productive_seconds;
            total_neut += summary.neutral_seconds;
            total_dist += summary.distraction_seconds;
            total_idle += summary.idle_seconds;
            total_active += summary.total_active_seconds;

            if summary.productive_seconds > best_prod {
                best_prod = summary.productive_seconds;
                best_day = current.format("%A").to_string();
            }

            if summary.distraction_seconds > worst_dist {
                worst_dist = summary.distraction_seconds;
                worst_day = current.format("%A").to_string();
            }

            daily_bars.push(DailyBar {
                day_name,
                date: d_str,
                productive_seconds: summary.productive_seconds,
                neutral_seconds: summary.neutral_seconds,
                distraction_seconds: summary.distraction_seconds,
                idle_seconds: summary.idle_seconds,
                total_seconds: summary.total_active_seconds + summary.idle_seconds,
            });
        }

        // Biggest sink for the week
        let conn = self.conn.lock().unwrap();
        let start_str = (end_date - Duration::days(6)).format("%Y-%m-%d").to_string();
        let mut sink_name = "None".to_string();
        let mut sink_seconds: i64 = 0;

        let week_sink: Option<(String, Option<String>, i64)> = conn.query_row(
            "SELECT application, domain, SUM(duration_seconds) as total_dur
             FROM activity_sessions
             WHERE started_at >= ?1 AND category = 'distraction'
             GROUP BY COALESCE(domain, application)
             ORDER BY total_dur DESC LIMIT 1",
            params![start_str],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?))
        ).ok();

        if let Some((app, dom, dur)) = week_sink {
            sink_name = dom.unwrap_or(app);
            sink_seconds = dur;
        }

        let avg_dist = if !daily_bars.is_empty() { total_dist / 7 } else { 0 };

        WeeklyReport {
            days: daily_bars,
            total_active_seconds: total_active,
            total_productive_seconds: total_prod,
            total_neutral_seconds: total_neut,
            total_distraction_seconds: total_dist,
            total_idle_seconds: total_idle,
            average_daily_distraction_seconds: avg_dist,
            best_day_name: best_day,
            best_day_productive_seconds: best_prod.max(0),
            worst_day_name: worst_day,
            worst_day_distraction_seconds: worst_dist.max(0),
            biggest_sink_name: sink_name,
            biggest_sink_seconds: sink_seconds,
        }
    }

    pub fn repay_time_debt(&self, seconds: i64) {
        let conn = self.conn.lock().unwrap();
        let now = Local::now().to_rfc3339();
        let _ = conn.execute(
            "INSERT INTO time_debt_repayments (repaid_at, seconds) VALUES (?1, ?2)",
            params![now, seconds],
        );
    }

    pub fn get_rules(&self) -> Vec<ActivityRule> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, pattern, rule_type, category FROM activity_rules ORDER BY id DESC"
        ).unwrap();
        let rows = stmt.query_map([], |row| {
            Ok(ActivityRule {
                id: row.get(0)?,
                pattern: row.get(1)?,
                rule_type: row.get(2)?,
                category: Category::from_str(&row.get::<_, String>(3)?),
            })
        }).unwrap();
        rows.flatten().collect()
    }

    pub fn add_or_update_rule(&self, pattern: &str, rule_type: &str, category: &str) {
        let conn = self.conn.lock().unwrap();
        let _ = conn.execute(
            "INSERT INTO activity_rules (pattern, rule_type, category) VALUES (?1, ?2, ?3)
             ON CONFLICT(pattern) DO UPDATE SET rule_type = excluded.rule_type, category = excluded.category",
            params![pattern, rule_type, category],
        );
    }

    pub fn delete_rule(&self, id: i64) {
        let conn = self.conn.lock().unwrap();
        let _ = conn.execute("DELETE FROM activity_rules WHERE id = ?1", params![id]);
    }

    pub fn get_settings(&self) -> AppSettings {
        let conn = self.conn.lock().unwrap();
        let json_val: Option<String> = conn.query_row(
            "SELECT value FROM settings WHERE key = 'app_settings'",
            [],
            |row| row.get(0)
        ).ok();

        if let Some(json) = json_val {
            serde_json::from_str(&json).unwrap_or_default()
        } else {
            AppSettings::default()
        }
    }

    pub fn save_settings(&self, settings: &AppSettings) {
        let conn = self.conn.lock().unwrap();
        let json = serde_json::to_string(settings).unwrap();
        let _ = conn.execute(
            "INSERT INTO settings (key, value) VALUES ('app_settings', ?1)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            params![json],
        );
    }

    pub fn delete_all_data(&self) {
        let conn = self.conn.lock().unwrap();
        let _ = conn.execute_batch(
            "DELETE FROM activity_sessions;
             DELETE FROM time_debt_repayments;
             DELETE FROM focus_sessions;"
        );
    }

    pub fn export_data_json(&self) -> String {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, source, application, domain, window_title, category, started_at, ended_at, duration_seconds 
             FROM activity_sessions ORDER BY id ASC"
        ).unwrap();
        let rows: Vec<ActivitySession> = stmt.query_map([], |row| {
            Ok(ActivitySession {
                id: row.get(0)?,
                source: row.get(1)?,
                application: row.get(2)?,
                domain: row.get(3)?,
                window_title: row.get(4)?,
                category: Category::from_str(&row.get::<_, String>(5)?),
                started_at: row.get(6)?,
                ended_at: row.get(7)?,
                duration_seconds: row.get(8)?,
            })
        }).unwrap().flatten().collect();

        serde_json::to_string_pretty(&rows).unwrap_or_else(|_| "[]".to_string())
    }
}
