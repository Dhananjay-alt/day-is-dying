pub mod models;
pub mod db;
pub mod tracker;
pub mod server;

use std::sync::{Arc, Mutex};
use std::time::Duration;
use chrono::{Local, NaiveTime, Timelike};
use tauri::{Emitter, Manager, State, Window};
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{TrayIconBuilder, TrayIconEvent};

use crate::models::{
    AppSettings, ActivityRule, ActivitySummary, Category, CurrentActivity, 
    DayStatus, IntervalAnalysis, TimelineSegment, WeeklyReport
};
use crate::db::DbState;
use crate::server::LatestBrowserState;

pub struct AppContext {
    pub db: Arc<DbState>,
    pub current_activity: Arc<Mutex<CurrentActivity>>,
    pub browser_state: Arc<Mutex<LatestBrowserState>>,
    pub is_paused: Arc<Mutex<bool>>,
}

// ===================== TAURI COMMANDS =====================

#[tauri::command]
fn get_current_activity(state: State<'_, AppContext>) -> CurrentActivity {
    let act = state.current_activity.lock().unwrap();
    act.clone()
}

#[tauri::command]
fn get_day_status(state: State<'_, AppContext>) -> DayStatus {
    let settings = state.db.get_settings();
    let now = Local::now();
    let current_time_str = now.format("%H:%M:%S").to_string();

    // Parse configured day start and day end
    let start_time = NaiveTime::parse_from_str(&settings.day_start, "%H:%M")
        .unwrap_or_else(|_| NaiveTime::from_hms_opt(6, 0, 0).unwrap());
    
    let is_midnight_end = settings.day_end == "00:00" || settings.day_end == "24:00";
    let end_time = if is_midnight_end {
        NaiveTime::from_hms_opt(23, 59, 59).unwrap()
    } else {
        NaiveTime::parse_from_str(&settings.day_end, "%H:%M")
            .unwrap_or_else(|_| NaiveTime::from_hms_opt(23, 59, 59).unwrap())
    };

    let now_time = now.time();
    let start_secs = start_time.num_seconds_from_midnight() as i64;
    let end_secs = if is_midnight_end {
        86400
    } else {
        end_time.num_seconds_from_midnight() as i64
    };

    let total_day_seconds = (end_secs - start_secs).max(3600);
    let now_secs = now_time.num_seconds_from_midnight() as i64;

    let (elapsed_seconds, remaining_seconds, percentage) = if now_secs < start_secs {
        // Day hasn't started yet
        (0, total_day_seconds, 0.0)
    } else if now_secs >= end_secs {
        // Day is finished
        (total_day_seconds, 0, 100.0)
    } else {
        let elapsed = now_secs - start_secs;
        let rem = (total_day_seconds - elapsed).max(0);
        let pct = ((elapsed as f64) / (total_day_seconds as f64)) * 100.0;
        (elapsed, rem, pct)
    };

    // Escalating messages
    let (escalating_message, severity_level) = if percentage >= 100.0 {
        ("TODAY IS DEAD.", "dead")
    } else if percentage >= 95.0 {
        ("THIS IS ALMOST OVER.", "critical")
    } else if percentage >= 85.0 {
        ("YOU DON'T HAVE MUCH LEFT.", "critical")
    } else if percentage >= 70.0 {
        ("YOUR DAY IS DYING.", "dying")
    } else if percentage >= 50.0 {
        ("HALF YOUR DAY IS GONE.", "half")
    } else if percentage >= 25.0 {
        ("THE DAY IS SLIPPING AWAY.", "normal")
    } else {
        ("THE DAY HAS STARTED.", "normal")
    };

    DayStatus {
        current_time: current_time_str,
        day_start: settings.day_start,
        day_end: settings.day_end,
        total_day_seconds,
        elapsed_seconds,
        remaining_seconds,
        percentage_elapsed: (percentage * 10.0).round() / 10.0,
        escalating_message: escalating_message.to_string(),
        severity_level: severity_level.to_string(),
    }
}

#[tauri::command]
fn get_activity_summary(state: State<'_, AppContext>, date: Option<String>) -> ActivitySummary {
    let settings = state.db.get_settings();
    let date_str = date.unwrap_or_else(|| Local::now().format("%Y-%m-%d").to_string());
    state.db.get_summary(&date_str, settings.hourly_rate)
}

#[tauri::command]
fn get_timeline(state: State<'_, AppContext>, date: Option<String>) -> Vec<TimelineSegment> {
    let date_str = date.unwrap_or_else(|| Local::now().format("%Y-%m-%d").to_string());
    state.db.get_timeline(&date_str)
}

#[tauri::command]
fn get_weekly_report(state: State<'_, AppContext>, end_date: Option<String>) -> WeeklyReport {
    let date_str = end_date.unwrap_or_else(|| Local::now().format("%Y-%m-%d").to_string());
    state.db.get_weekly_report(&date_str)
}

#[tauri::command]
fn get_interval_analysis(state: State<'_, AppContext>, minutes: i64) -> IntervalAnalysis {
    state.db.get_interval_analysis(minutes)
}

#[tauri::command]
fn repay_time_debt(state: State<'_, AppContext>, seconds: i64) {
    state.db.repay_time_debt(seconds);
}

#[tauri::command]
fn get_rules(state: State<'_, AppContext>) -> Vec<ActivityRule> {
    state.db.get_rules()
}

#[tauri::command]
fn add_or_update_rule(
    state: State<'_, AppContext>,
    pattern: String,
    rule_type: String,
    category: String,
) {
    state.db.add_or_update_rule(&pattern, &rule_type, &category);
}

#[tauri::command]
fn delete_rule(state: State<'_, AppContext>, id: i64) {
    state.db.delete_rule(id);
}

#[tauri::command]
fn get_settings(state: State<'_, AppContext>) -> AppSettings {
    state.db.get_settings()
}

#[tauri::command]
fn save_settings(state: State<'_, AppContext>, settings: AppSettings) {
    state.db.save_settings(&settings);
}

#[tauri::command]
fn toggle_tracking_paused(state: State<'_, AppContext>) -> bool {
    let mut paused = state.is_paused.lock().unwrap();
    *paused = !*paused;
    *paused
}

#[tauri::command]
fn delete_all_data(state: State<'_, AppContext>) {
    state.db.delete_all_data();
}

#[tauri::command]
fn export_data_json(state: State<'_, AppContext>) -> String {
    state.db.export_data_json()
}

#[tauri::command]
fn hide_to_tray(window: Window) -> Result<(), String> {
    window.hide().map_err(|e| e.to_string())
}

#[tauri::command]
fn set_widget_mode(window: Window, widget: bool) -> Result<(), String> {
    if widget {
        let _ = window.set_size(tauri::Size::Logical(tauri::LogicalSize {
            width: 340.0,
            height: 220.0,
        }));
        let _ = window.set_always_on_top(true);
        let _ = window.set_resizable(true);
    } else {
        let _ = window.set_size(tauri::Size::Logical(tauri::LogicalSize {
            width: 1080.0,
            height: 760.0,
        }));
        let _ = window.set_always_on_top(false);
        let _ = window.set_resizable(true);
    }
    Ok(())
}


// ===================== RUNTIME & INITIALIZATION =====================

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_handle = app.handle();

            // Locate local DB file in app data or project directory
            let db_path = match app_handle.path().app_data_dir() {
                Ok(mut p) => {
                    p.push("ydid_data.sqlite");
                    p
                }
                Err(_) => std::path::PathBuf::from("ydid_data.sqlite"),
            };

            let db = Arc::new(DbState::new(db_path));
            let current_activity = Arc::new(Mutex::new(CurrentActivity {
                application: "Initializing".to_string(),
                domain: None,
                window_title: String::new(),
                category: Category::Neutral,
                is_idle: false,
                idle_seconds: 0,
                current_duration_seconds: 0,
                is_tracking_paused: false,
            }));
            let browser_state = Arc::new(Mutex::new(LatestBrowserState::default()));
            let is_paused = Arc::new(Mutex::new(false));

            // Start Browser Bridge HTTP Server on 127.0.0.1:41832
            server::start_local_server(
                Arc::clone(&db),
                Arc::clone(&browser_state),
                Arc::clone(&is_paused),
            );

            // Start Desktop & Idle Tracker Worker Loop (runs every 1 second)
            {
                let db_clone = Arc::clone(&db);
                let current_activity_clone = Arc::clone(&current_activity);
                let browser_state_clone = Arc::clone(&browser_state);
                let is_paused_clone = Arc::clone(&is_paused);

                std::thread::spawn(move || {
                    let mut prev_app = String::new();
                    let mut prev_domain: Option<String> = None;
                    let mut current_streak_seconds: i64 = 0;
                    let mut chunk_accum_seconds: i64 = 0;

                    loop {
                        std::thread::sleep(Duration::from_secs(1));

                        let paused = *is_paused_clone.lock().unwrap();
                        if paused {
                            let mut act = current_activity_clone.lock().unwrap();
                            act.is_tracking_paused = true;
                            continue;
                        }

                        let settings = db_clone.get_settings();
                        let idle_seconds = tracker::get_idle_seconds();
                        let is_idle = idle_seconds >= (settings.idle_threshold_seconds as u64);

                        let (app_name, domain_name, title, category) = if is_idle {
                            (
                                "Idle".to_string(),
                                None,
                                "User away from computer".to_string(),
                                Category::Idle,
                            )
                        } else {
                            let win = tracker::get_active_window().unwrap_or(tracker::WindowInfo {
                                process_name: "Desktop".to_string(),
                                window_title: "Active Desktop".to_string(),
                            });

                            let is_browser = {
                                let p = win.process_name.to_lowercase();
                                p.contains("chrome") || p.contains("msedge") || p.contains("brave") || p.contains("firefox") || p.contains("opera")
                            };

                            let (dom, tab_title) = if is_browser {
                                let st = browser_state_clone.lock().unwrap();
                                if let Some(last_time) = st.last_reported_time {
                                    if last_time.elapsed().as_secs() < 15 {
                                        (st.domain.clone(), st.title.clone())
                                    } else {
                                        (None, None)
                                    }
                                } else {
                                    (None, None)
                                }
                            } else {
                                (None, None)
                            };

                            let final_title = tab_title.unwrap_or(win.window_title);
                            let cat = db_clone.classify(&win.process_name, dom.as_deref());
                            (win.process_name, dom, final_title, cat)
                        };

                        // Check streak continuity
                        if app_name == prev_app && domain_name == prev_domain {
                            current_streak_seconds += 1;
                        } else {
                            prev_app = app_name.clone();
                            prev_domain = domain_name.clone();
                            current_streak_seconds = 1;
                        }

                        // Update shared current activity
                        {
                            let mut act = current_activity_clone.lock().unwrap();
                            act.application = app_name.clone();
                            act.domain = domain_name.clone();
                            act.window_title = title.clone();
                            act.category = category.clone();
                            act.is_idle = is_idle;
                            act.idle_seconds = idle_seconds as i64;
                            act.current_duration_seconds = current_streak_seconds;
                            act.is_tracking_paused = false;
                        }

                        // Accumulate and commit chunk to DB every 5 seconds or upon transition
                        chunk_accum_seconds += 1;
                        if chunk_accum_seconds >= 5 {
                            db_clone.record_activity_chunk(
                                if domain_name.is_some() { "browser" } else { "desktop" },
                                &app_name,
                                domain_name.as_deref(),
                                &title,
                                &category,
                                chunk_accum_seconds,
                            );
                            chunk_accum_seconds = 0;
                        }
                    }
                });
            }

            // Setup System Tray
            let tray_menu = Menu::with_items(
                app_handle,
                &[
                    &MenuItem::with_id(app_handle, "title", "YOUR DAY IS DYING", false, None::<&str>)?,
                    &MenuItem::with_id(app_handle, "open", "Open Dashboard", true, None::<&str>)?,
                    &MenuItem::with_id(app_handle, "widget", "Floating Widget Mode", true, None::<&str>)?,
                    &MenuItem::with_id(app_handle, "toggle_pause", "Pause / Resume Tracking", true, None::<&str>)?,
                    &MenuItem::with_id(app_handle, "quit", "Quit YDID", true, None::<&str>)?,
                ],
            )?;

            let _tray = TrayIconBuilder::new()
                .menu(&tray_menu)
                .tooltip("YOUR DAY IS DYING")
                .on_menu_event(|app, event| {
                    match event.id.as_ref() {
                        "open" => {
                            if let Some(w) = app.get_webview_window("main") {
                                let _ = w.show();
                                let _ = w.set_focus();
                                let _ = set_widget_mode(w.as_ref().window(), false);
                            }
                        }
                        "widget" => {
                            if let Some(w) = app.get_webview_window("main") {
                                let _ = w.show();
                                let _ = w.set_focus();
                                let _ = set_widget_mode(w.as_ref().window(), true);
                            }
                        }
                        "toggle_pause" => {
                            let state: State<AppContext> = app.state();
                            let mut p = state.is_paused.lock().unwrap();
                            *p = !*p;
                        }
                        "quit" => {
                            app.exit(0);
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click { .. } = event {
                        let app = tray.app_handle();
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                })
                .build(app_handle)?;

            // Register AppContext managed state
            app.manage(AppContext {
                db,
                current_activity,
                browser_state,
                is_paused,
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_current_activity,
            get_day_status,
            get_activity_summary,
            get_timeline,
            get_weekly_report,
            get_interval_analysis,
            repay_time_debt,
            get_rules,
            add_or_update_rule,
            delete_rule,
            get_settings,
            save_settings,
            toggle_tracking_paused,
            delete_all_data,
            export_data_json,
            set_widget_mode,
            hide_to_tray
        ])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                // Keep widget alive on top of other applications even after closing window
                api.prevent_close();
                let _ = set_widget_mode(window.clone(), true);
                let _ = window.emit("switch-to-widget-mode", ());
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running YOUR DAY IS DYING");
}
