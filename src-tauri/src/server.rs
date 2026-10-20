use std::sync::{Arc, Mutex};
use std::thread;
use tiny_http::{Server, Response, Header, Method};
use serde_json::json;
use crate::models::{BrowserActivityPayload, Category};
use crate::db::DbState;

#[derive(Debug, Clone, Default)]
pub struct LatestBrowserState {
    pub domain: Option<String>,
    pub title: Option<String>,
    pub last_reported_time: Option<std::time::Instant>,
}

pub fn start_local_server(
    db: Arc<DbState>,
    browser_state: Arc<Mutex<LatestBrowserState>>,
    paused: Arc<Mutex<bool>>,
) {
    thread::spawn(move || {
        let server = match Server::http("127.0.0.1:41832") {
            Ok(s) => s,
            Err(e) => {
                eprintln!("[YDID Server] Failed to bind 127.0.0.1:41832: {}", e);
                return;
            }
        };

        println!("[YDID Server] Browser Extension Bridge listening on http://127.0.0.1:41832");

        for mut request in server.incoming_requests() {
            let cors_origin = Header::from_bytes(&b"Access-Control-Allow-Origin"[..], &b"*"[..]).unwrap();
            let cors_methods = Header::from_bytes(&b"Access-Control-Allow-Methods"[..], &b"GET, POST, OPTIONS"[..]).unwrap();
            let cors_headers = Header::from_bytes(&b"Access-Control-Allow-Headers"[..], &b"Content-Type"[..]).unwrap();
            let content_type = Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap();

            if request.method() == &Method::Options {
                let response = Response::empty(200)
                    .with_header(cors_origin)
                    .with_header(cors_methods)
                    .with_header(cors_headers);
                let _ = request.respond(response);
                continue;
            }

            let url = request.url().to_string();

            if url == "/api/status" {
                let body = json!({
                    "status": "online",
                    "app": "YOUR DAY IS DYING",
                    "tagline": "Time won't wait."
                }).to_string();

                let response = Response::from_string(body)
                    .with_header(cors_origin)
                    .with_header(content_type);
                let _ = request.respond(response);
                continue;
            }

            if url == "/api/activity" && request.method() == &Method::Post {
                // If tracking is paused, ignore payload
                let is_paused = *paused.lock().unwrap();
                if is_paused {
                    let resp = Response::from_string(json!({"status": "paused"}).to_string())
                        .with_header(cors_origin)
                        .with_header(content_type);
                    let _ = request.respond(resp);
                    continue;
                }

                let mut content = String::new();
                if request.as_reader().read_to_string(&mut content).is_ok() {
                    if let Ok(payload) = serde_json::from_str::<BrowserActivityPayload>(&content) {
                        let domain = payload.domain.trim().to_string();
                        let title = payload.title.unwrap_or_else(|| domain.clone());
                        let duration = payload.duration_seconds.unwrap_or(5);
                        let is_idle = payload.is_idle.unwrap_or(false);

                        let category = if is_idle {
                            Category::Idle
                        } else {
                            db.classify("browser.exe", Some(&domain))
                        };

                        // Update shared browser state
                        {
                            let mut st = browser_state.lock().unwrap();
                            st.domain = Some(domain.clone());
                            st.title = Some(title.clone());
                            st.last_reported_time = Some(std::time::Instant::now());
                        }

                        // Record chunk in DB
                        db.record_activity_chunk(
                            "browser",
                            "Browser",
                            Some(&domain),
                            &title,
                            &category,
                            duration,
                        );

                        let resp = Response::from_string(json!({
                            "status": "recorded",
                            "domain": domain,
                            "category": category.as_str()
                        }).to_string())
                            .with_header(cors_origin)
                            .with_header(content_type);
                        let _ = request.respond(resp);
                        continue;
                    }
                }

                let resp = Response::from_string(json!({"error": "invalid payload"}).to_string())
                    .with_status_code(400)
                    .with_header(cors_origin)
                    .with_header(content_type);
                let _ = request.respond(resp);
                continue;
            }

            let resp = Response::from_string(json!({"error": "not found"}).to_string())
                .with_status_code(404)
                .with_header(cors_origin);
            let _ = request.respond(resp);
        }
    });
}
