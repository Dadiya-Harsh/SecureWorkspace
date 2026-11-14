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

#[tauri::command]
fn open_system_path(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        Command::new("cmd")
            .args(["/C", "start", "", &path])
            .spawn()
            .map_err(|e| format!("Failed to open file: {}", e))?;
        Ok(())
    }
    #[cfg(not(target_os = "windows"))]
    {
        use std::process::Command;
        Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open file: {}", e))?;
        Ok(())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState {
            daemon: Mutex::new(DaemonManager::new()),
        })
        .invoke_handler(tauri::generate_handler![dispatch_daemon, open_system_path])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
