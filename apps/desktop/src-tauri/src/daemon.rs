use std::io::{BufRead, BufReader, Write};
use std::path::PathBuf;
use std::process::{Child, ChildStdin, ChildStdout, Command, Stdio};
use serde_json::Value;

pub struct DaemonManager {
    child: Option<Child>,
    stdin: Option<ChildStdin>,
    reader: Option<BufReader<ChildStdout>>,
}

impl DaemonManager {
    pub fn new() -> Self {
        Self {
            child: None,
            stdin: None,
            reader: None,
        }
    }

    pub fn ensure_started(&mut self) -> Result<(), String> {
        if self.child.is_some() && self.stdin.is_some() && self.reader.is_some() {
            if let Some(ref mut child) = self.child {
                match child.try_wait() {
                    Ok(None) => return Ok(()), // Still running cleanly
                    _ => {
                        self.child = None;
                        self.stdin = None;
                        self.reader = None;
                    }
                }
            }
        }

        let (cmd_bin, args, cwd) = Self::resolve_daemon_command()?;

        let mut child = Command::new(&cmd_bin)
            .args(&args)
            .current_dir(&cwd)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::inherit())
            .spawn()
            .map_err(|e| format!("Failed to spawn daemon process '{:?}': {}", cmd_bin, e))?;

        let stdin = child.stdin.take().ok_or("Failed to open child stdin")?;
        let stdout = child.stdout.take().ok_or("Failed to open child stdout")?;
        let reader = BufReader::new(stdout);

        self.child = Some(child);
        self.stdin = Some(stdin);
        self.reader = Some(reader);

        Ok(())
    }

    fn resolve_daemon_command() -> Result<(PathBuf, Vec<String>, PathBuf), String> {
        // 1. In dev, use the project virtual environment
        let venv_python = PathBuf::from(r"D:\Projects\SecureWorkspace\.venv\Scripts\python.exe");
        let core_dir = PathBuf::from(r"D:\Projects\SecureWorkspace\core");

        if venv_python.exists() {
            return Ok((
                venv_python,
                vec!["-m".to_string(), "secureworkspace_core.daemon".to_string()],
                core_dir,
            ));
        }

        // 2. Production fallback: bundled sidecar executable
        if let Ok(exe_path) = std::env::current_exe() {
            if let Some(parent) = exe_path.parent() {
                let bundled_daemon = parent.join("secureworkspace-daemon.exe");
                if bundled_daemon.exists() {
                    return Ok((bundled_daemon, vec![], parent.to_path_buf()));
                }
            }
        }

        // 3. Fallback to system python
        Ok((
            PathBuf::from("python"),
            vec!["-m".to_string(), "secureworkspace_core.daemon".to_string()],
            core_dir,
        ))
    }

    pub fn send_request(&mut self, request: Value) -> Result<Value, String> {
        self.ensure_started()?;

        let mut req_str = serde_json::to_string(&request)
            .map_err(|e| format!("Serialization error: {}", e))?;
        req_str.push('\n');

        let stdin = self.stdin.as_mut().ok_or("Daemon stdin not available")?;
        stdin
            .write_all(req_str.as_bytes())
            .map_err(|e| format!("Failed to write to daemon: {}", e))?;
        stdin
            .flush()
            .map_err(|e| format!("Failed to flush daemon stdin: {}", e))?;

        let reader = self.reader.as_mut().ok_or("Daemon stdout not available")?;
        let mut resp_line = String::new();
        reader
            .read_line(&mut resp_line)
            .map_err(|e| format!("Failed to read from daemon: {}", e))?;

        if resp_line.trim().is_empty() {
            return Err("Daemon returned empty response or process exited".to_string());
        }

        let resp_val: Value = serde_json::from_str(&resp_line)
            .map_err(|e| format!("Failed to parse daemon response: {}", e))?;

        Ok(resp_val)
    }
}

impl Drop for DaemonManager {
    fn drop(&mut self) {
        if let Some(mut child) = self.child.take() {
            let _ = child.kill();
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_daemon_roundtrip_ipc() {
        let mut mgr = DaemonManager::new();
        let ping_req = json!({
            "id": 1,
            "method": "ping"
        });
        let res = mgr.send_request(ping_req).expect("Ping should succeed");
        assert_eq!(res["success"], true);
        assert_eq!(res["data"]["pong"], true);
        assert_eq!(res["id"], 1);

        let auth_status_req = json!({
            "id": 2,
            "method": "google_auth_status",
            "params": { "auto_connect": false }
        });
        let auth_res = mgr.send_request(auth_status_req).expect("Auth status should succeed");
        assert_eq!(auth_res["success"], true);
        assert_eq!(auth_res["data"]["authenticated"], true);
    }
}
