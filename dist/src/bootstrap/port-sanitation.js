"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.killPortProcess = void 0;
const child_process_1 = require("child_process");
const os_1 = __importDefault(require("os"));
function killPortProcess(port) {
    try {
        const platform = os_1.default.platform();
        if (platform === 'win32') {
            // Windows
            const pid = (0, child_process_1.execSync)(`netstat -ano | findstr :${port}`).toString()
                .split('\n')[0]
                .trim()
                .split(/\s+/)
                .pop();
            if (pid) {
                (0, child_process_1.execSync)(`taskkill /PID ${pid} /F`);
                console.log(`✅ Killed process on port ${port} (PID ${pid})`);
            }
        }
        else {
            // Linux/macOS
            const pid = (0, child_process_1.execSync)(`lsof -t -i:${port}`).toString().trim();
            if (pid) {
                (0, child_process_1.execSync)(`kill -9 ${pid}`);
                console.log(`✅ Killed process on port ${port} (PID ${pid})`);
            }
        }
    }
    catch (err) {
        console.warn(`⚠️ No process found on port ${port} or failed to kill: ${err.message}`);
    }
}
exports.killPortProcess = killPortProcess;
