mod daemon;

use daemon::DaemonManager;
use serde_json::Value;
use std::sync::Mutex;
use tauri::State;

struct AppState {
    daemon: Mutex<DaemonManager>,
}

#[tauri::command]
fn dispatch_daemon(request: Value, state: State<'_, AppState>) -> Result<Value, String> {
    let mut mgr = state
        .daemon
        .lock()
        .map_err(|e| format!("Lock poisoned: {}", e))?;
    mgr.send_request(request)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState {
            daemon: Mutex::new(DaemonManager::new()),
        })
        .invoke_handler(tauri::generate_handler![dispatch_daemon])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
