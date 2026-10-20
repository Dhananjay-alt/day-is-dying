use std::path::Path;

#[derive(Debug, Clone)]
pub struct WindowInfo {
    pub process_name: String,
    pub window_title: String,
}

#[cfg(windows)]
pub mod win_impl {
    use super::WindowInfo;
    use windows::Win32::Foundation::{HWND, CloseHandle};
    use windows::Win32::UI::WindowsAndMessaging::{
        GetForegroundWindow, GetWindowTextW, GetWindowThreadProcessId
    };
    use windows::Win32::System::Threading::{
        OpenProcess, QueryFullProcessImageNameW, PROCESS_QUERY_LIMITED_INFORMATION, PROCESS_NAME_FORMAT
    };
    use windows::Win32::UI::Input::KeyboardAndMouse::{GetLastInputInfo, LASTINPUTINFO};
    use windows::core::PWSTR;

    pub fn get_active_window() -> Option<WindowInfo> {
        unsafe {
            let hwnd: HWND = GetForegroundWindow();
            if hwnd.0 == (0 as _) {
                return None;
            }

            // 1. Get Window Title
            let mut title_buf = [0u16; 512];
            let len = GetWindowTextW(hwnd, &mut title_buf);
            let window_title = if len > 0 {
                String::from_utf16_lossy(&title_buf[..len as usize])
            } else {
                String::new()
            };

            // 2. Get Process ID & Process Executable Name
            let mut pid: u32 = 0;
            GetWindowThreadProcessId(hwnd, Some(&mut pid));
            if pid == 0 {
                return Some(WindowInfo {
                    process_name: "System".to_string(),
                    window_title,
                });
            }

            let mut process_name = "Unknown".to_string();
            if let Ok(h_process) = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, pid) {
                let mut path_buf = [0u16; 1024];
                let mut size = path_buf.len() as u32;

                if QueryFullProcessImageNameW(
                    h_process,
                    PROCESS_NAME_FORMAT(0),
                    PWSTR(path_buf.as_mut_ptr()),
                    &mut size,
                ).is_ok() {
                    let full_path = String::from_utf16_lossy(&path_buf[..size as usize]);
                    if let Some(file_name) = super::Path::new(&full_path).file_name() {
                        process_name = file_name.to_string_lossy().to_string();
                    }
                }
                let _ = CloseHandle(h_process);
            }

            Some(WindowInfo {
                process_name,
                window_title,
            })
        }
    }

    pub fn get_idle_seconds() -> u64 {
        unsafe {
            let mut lii = LASTINPUTINFO {
                cbSize: std::mem::size_of::<LASTINPUTINFO>() as u32,
                dwTime: 0,
            };

            if GetLastInputInfo(&mut lii).as_bool() {
                // Get current tick count
                let now_tick = windows::Win32::System::SystemInformation::GetTickCount();
                let diff = now_tick.saturating_sub(lii.dwTime);
                (diff / 1000) as u64
            } else {
                0
            }
        }
    }
}

#[cfg(not(windows))]
pub mod win_impl {
    use super::WindowInfo;

    pub fn get_active_window() -> Option<WindowInfo> {
        Some(WindowInfo {
            process_name: "Code.exe".to_string(),
            window_title: "YOUR DAY IS DYING - Workspace".to_string(),
        })
    }

    pub fn get_idle_seconds() -> u64 {
        0
    }
}

pub fn get_active_window() -> Option<WindowInfo> {
    win_impl::get_active_window()
}

pub fn get_idle_seconds() -> u64 {
    win_impl::get_idle_seconds()
}
