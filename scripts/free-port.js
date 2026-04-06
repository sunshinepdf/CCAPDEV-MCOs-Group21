/**
 * ### `scripts/free-port.js`
 * - Utility script used before `dev` startup.
 *   - Detects and force-kills processes bound to a target port (default `3000`).
 *   - Supports both Windows (`netstat`/`taskkill`) and Unix-like environments (`lsof`/`kill`).
*/

// Import necessary modules
import { execSync } from "child_process";

// Get the target port from command-line arguments or default to 3000
const targetPort = Number(process.argv[2] || 3000);

// Helper function to get unique values from an array
function unique(values) {
  return Array.from(new Set(values));
}

// Parses the output of `netstat` to extract PIDs of processes listening on the target port
function parsePidsFromNetstat(output, port) {
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line)
    .filter((line) => line.includes(`:${port}`) && /LISTENING/i.test(line))
    .map((line) => {
      const parts = line.split(/\s+/);
      return parts[parts.length - 1];
    })
    .filter((pid) => /^\d+$/.test(pid));
}

// Kills processes listening on the target port in Windows environments
function killPortWindows(port) {
  try {
    const output = execSync(`netstat -ano | findstr :${port}`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    const pids = unique(parsePidsFromNetstat(output, port));

    if (pids.length === 0) {
      console.log(`[free-port] Port ${port} is already free.`);
      return;
    }

    pids.forEach((pid) => {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
        console.log(`[free-port] Killed PID ${pid} on port ${port}.`);
      } catch (error) {
        console.log(`[free-port] Could not kill PID ${pid} (it may have already exited).`);
      }
    });
  } catch (error) {
    console.log(`[free-port] Port ${port} is already free.`);
  }
}

// Kills processes listening on the target port in Unix-like environments
function killPortUnix(port) {
  try {
    const output = execSync(`lsof -ti tcp:${port}`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    const pids = unique(output.split(/\r?\n/).map((x) => x.trim()).filter((x) => /^\d+$/.test(x)));

    if (pids.length === 0) {
      console.log(`[free-port] Port ${port} is already free.`);
      return;
    }

    pids.forEach((pid) => {
      try {
        execSync(`kill -9 ${pid}`, { stdio: "ignore" });
        console.log(`[free-port] Killed PID ${pid} on port ${port}.`);
      } catch (error) {
        console.log(`[free-port] Could not kill PID ${pid} (it may have already exited).`);
      }
    });
  } catch (error) {
    console.log(`[free-port] Port ${port} is already free.`);
  }
}

// Validate the target port and execute the appropriate kill function based on the operating system
if (Number.isNaN(targetPort) || targetPort <= 0) {
  console.error("[free-port] Invalid port.");
  process.exit(1);
}

// Determine the platform and execute the corresponding function to free the port
if (process.platform === "win32") {
  killPortWindows(targetPort);
} else {
  killPortUnix(targetPort);
}
