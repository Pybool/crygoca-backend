import { execSync } from 'child_process';
import os from 'os';

export function killPortProcess(port: number) {
  try {
    const platform = os.platform();

    if (platform === 'win32') {
      // Windows
      const pid = execSync(`netstat -ano | findstr :${port}`).toString()
        .split('\n')[0]
        .trim()
        .split(/\s+/)
        .pop();
      if (pid) {
        execSync(`taskkill /PID ${pid} /F`);
        console.log(`✅ Killed process on port ${port} (PID ${pid})`);
      }
    } else {
      // Linux/macOS
      const pid = execSync(`lsof -t -i:${port}`).toString().trim();
      if (pid) {
        execSync(`kill -9 ${pid}`);
        console.log(`✅ Killed process on port ${port} (PID ${pid})`);
      }
    }
  } catch (err:any) {
    console.warn(`⚠️ No process found on port ${port} or failed to kill: ${err.message}`);
  }
}
