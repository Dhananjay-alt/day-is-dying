pub mod models;
pub mod db;
pub mod tracker;
pub mod server;
pub mod autostart;

use std::sync::{Arc, Mutex};
use std::time::Duration;
use chrono::{Local, NaiveTime, Timelike};
use tauri::{Emitter, Manager, State};
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
fn open_dashboard(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.show();
        let _ = w.set_focus();
    }
    Ok(())
}

#[tauri::command]
fn close_dashboard(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.hide();
    }
    Ok(())
}

#[tauri::command]
fn is_dashboard_open(app: tauri::AppHandle) -> bool {
    if let Some(w) = app.get_webview_window("main") {
        w.is_visible().unwrap_or(false)
    } else {
        false
    }
}

#[tauri::command]
fn set_hud_visible(app: tauri::AppHandle, state: State<'_, AppContext>, visible: bool) -> Result<(), String> {
    let mut settings = state.db.get_settings();
    settings.hud_visible = visible;
    state.db.save_settings(&settings);
    if let Some(w) = app.get_webview_window("hud") {
        if visible {
            let _ = w.show();
            let _ = w.set_focus();
        } else {
            let _ = w.hide();
        }
    }
    let _ = app.emit("hud-visibility-changed", visible);
    Ok(())
}

#[tauri::command]
fn toggle_hud(app: tauri::AppHandle, state: State<'_, AppContext>) -> Result<bool, String> {
    let is_vis = if let Some(w) = app.get_webview_window("hud") {
        w.is_visible().unwrap_or(false)
    } else {
        false
    };
    let target = !is_vis;
    set_hud_visible(app, state, target)?;
    Ok(target)
}

#[tauri::command]
fn is_hud_visible(app: tauri::AppHandle) -> bool {
    if let Some(w) = app.get_webview_window("hud") {
        w.is_visible().unwrap_or(false)
    } else {
        false
    }
}

#[tauri::command]
fn set_hud_always_on_top(app: tauri::AppHandle, state: State<'_, AppContext>, on_top: bool) -> Result<(), String> {
    let mut settings = state.db.get_settings();
    settings.hud_always_on_top = on_top;
    state.db.save_settings(&settings);
    if let Some(w) = app.get_webview_window("hud") {
        let _ = w.set_always_on_top(on_top);
    }
    let _ = app.emit("hud-always-on-top-changed", on_top);
    Ok(())
}

#[tauri::command]
fn save_hud_position(state: State<'_, AppContext>, x: i32, y: i32) -> Result<(), String> {
    let mut settings = state.db.get_settings();
    settings.hud_position_x = Some(x);
    settings.hud_position_y = Some(y);
    state.db.save_settings(&settings);
    Ok(())
}

#[tauri::command]
fn reset_hud_position(app: tauri::AppHandle, state: State<'_, AppContext>) -> Result<(), String> {
    if let Some(w) = app.get_webview_window("hud") {
        if let Ok(Some(monitor)) = w.primary_monitor() {
            let size = monitor.size();
            let scale = monitor.scale_factor();
            let hud_w = (320.0 * scale) as i32;
            let hud_h = (220.0 * scale) as i32;
            let margin = (24.0 * scale) as i32;
            let target_x = size.width as i32 - hud_w - margin;
            let target_y = size.height as i32 - hud_h - margin - 40;
            let _ = w.set_position(tauri::Position::Physical(tauri::PhysicalPosition::new(target_x, target_y)));

            let mut settings = state.db.get_settings();
            settings.hud_position_x = Some(target_x);
            settings.hud_position_y = Some(target_y);
            state.db.save_settings(&settings);
        }
    }
    Ok(())
}

#[tauri::command]
fn set_hud_size(app: tauri::AppHandle, minimized: bool) -> Result<(), String> {
    if let Some(w) = app.get_webview_window("hud") {
        let (width, height) = if minimized {
            (230.0, 56.0)
        } else {
            (320.0, 220.0)
        };
        let _ = w.set_size(tauri::Size::Logical(tauri::LogicalSize { width, height }));
    }
    Ok(())
}

#[tauri::command]
fn set_autostart_enabled(state: State<'_, AppContext>, enable: bool) -> Result<(), String> {
    autostart::set_autostart(enable)?;
    let mut settings = state.db.get_settings();
    settings.start_with_windows = enable;
    state.db.save_settings(&settings);
    Ok(())
}

#[tauri::command]
fn get_autostart_enabled() -> bool {
    autostart::get_autostart()
}

#[tauri::command]
fn quit_app(app: tauri::AppHandle) {
    app.exit(0);
}

#[tauri::command]
fn hide_to_tray(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.hide();
    }
    Ok(())
}

#[tauri::command]
fn set_widget_mode(app: tauri::AppHandle, state: State<'_, AppContext>, widget: bool) -> Result<(), String> {
    if widget {
        if let Some(w) = app.get_webview_window("main") {
            let _ = w.hide();
        }
        let _ = set_hud_visible(app, state, true);
    } else {
        let _ = open_dashboard(app);
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

            // Configure and position native HUD window based on saved desktop settings
            if let Some(hud_win) = app_handle.get_webview_window("hud") {
                let settings = db.get_settings();
                let mut positioned = false;

                if let (Some(x), Some(y)) = (settings.hud_position_x, settings.hud_position_y) {
                    if let Ok(monitors) = hud_win.available_monitors() {
                        for m in monitors {
                            let m_pos = m.position();
                            let m_size = m.size();
                            if x >= m_pos.x && x < (m_pos.x + m_size.width as i32 - 40)
                               && y >= m_pos.y && y < (m_pos.y + m_size.height as i32 - 40) {
                                let _ = hud_win.set_position(tauri::Position::Physical(tauri::PhysicalPosition::new(x, y)));
                                positioned = true;
                                break;
                            }
                        }
                    }
                }

                if !positioned {
                    if let Ok(Some(primary)) = hud_win.primary_monitor() {
                        let scale = primary.scale_factor();
                        let size = primary.size();
                        let hud_w = (320.0 * scale) as i32;
                        let hud_h = (220.0 * scale) as i32;
                        let margin = (24.0 * scale) as i32;
                        let target_x = size.width as i32 - hud_w - margin;
                        let target_y = size.height as i32 - hud_h - margin - 40;
                        let _ = hud_win.set_position(tauri::Position::Physical(tauri::PhysicalPosition::new(target_x, target_y)));
                    }
                }

                let _ = hud_win.set_always_on_top(settings.hud_always_on_top);

                if !settings.hud_visible {
                    let _ = hud_win.hide();
                } else {
                    let _ = hud_win.show();
                }
            }

            // Setup System Tray
            let tray_menu = Menu::with_items(
                app_handle,
                &[
                    &MenuItem::with_id(app_handle, "title", "YOUR DAY IS DYING", false, None::<&str>)?,
                    &MenuItem::with_id(app_handle, "open", "Open Dashboard", true, None::<&str>)?,
                    &MenuItem::with_id(app_handle, "toggle_hud", "Show / Hide HUD Widget", true, None::<&str>)?,
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
                            }
                        }
                        "toggle_hud" => {
                            let state: State<AppContext> = app.state();
                            let _ = toggle_hud(app.clone(), state);
                        }
                        "toggle_pause" => {
                            let state: State<AppContext> = app.state();
                            let mut p = state.is_paused.lock().unwrap();
                            *p = !*p;
                            let new_val = *p;
                            let _ = app.emit("pause-changed", new_val);
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
                            if w.is_visible().unwrap_or(false) {
                                let _ = w.hide();
                            } else {
                                let _ = w.show();
                                let _ = w.set_focus();
                            }
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
            hide_to_tray,
            open_dashboard,
            close_dashboard,
            is_dashboard_open,
            set_hud_visible,
            toggle_hud,
            is_hud_visible,
            set_hud_always_on_top,
            save_hud_position,
            reset_hud_position,
            set_hud_size,
            set_autostart_enabled,
            get_autostart_enabled,
            quit_app
        ])
        .on_window_event(|window, event| {
            match event {
                tauri::WindowEvent::CloseRequested { api, .. } => {
                    api.prevent_close();
                    if window.label() == "main" {
                        // Closing main dashboard hides it, while the native HUD widget continues running!
                        let _ = window.hide();
                    } else if window.label() == "hud" {
                        // Closing HUD hides it
                        let _ = window.hide();
                        let app = window.app_handle();
                        let state: State<AppContext> = app.state();
                        let mut settings = state.db.get_settings();
                        settings.hud_visible = false;
                        state.db.save_settings(&settings);
                        let _ = app.emit("hud-visibility-changed", false);
                    }
                }
                tauri::WindowEvent::Moved(physical_pos) => {
                    if window.label() == "hud" {
                        let app = window.app_handle();
                        let state: State<AppContext> = app.state();
                        let mut settings = state.db.get_settings();
                        settings.hud_position_x = Some(physical_pos.x);
                        settings.hud_position_y = Some(physical_pos.y);
                        state.db.save_settings(&settings);
                    }
                }
                _ => {}
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running YOUR DAY IS DYING");
}
