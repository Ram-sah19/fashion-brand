/**
 * Velora Circle - Production Backend Orchestrator
 * Spawns all microservices and the API Gateway concurrently behind a single entrypoint.
 * Designed for deployment on Render (or Docker) as a single Web Service.
 */

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const ROOT_DIR = path.resolve(__dirname, "..");

// Auto-load root .env if present
const rootEnvPath = path.join(ROOT_DIR, ".env");
if (fs.existsSync(rootEnvPath)) {
  try {
    const content = fs.readFileSync(rootEnvPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (process.env[key] === undefined) {
          process.env[key] = val;
        }
      }
    }
  } catch (err) {
    console.warn("[start-all] Note: Could not read root .env file", err.message);
  }
}

const colors = [
  "\x1b[36m", // Cyan
  "\x1b[32m", // Green
  "\x1b[33m", // Yellow
  "\x1b[34m", // Blue
  "\x1b[35m", // Magenta
  "\x1b[31m", // Red
  "\x1b[37m", // White
];
const resetColor = "\x1b[0m";

const microservices = [
  { name: "auth-service", dir: path.join(ROOT_DIR, "backend", "auth-service"), port: 5001 },
  { name: "user-service", dir: path.join(ROOT_DIR, "backend", "user-service"), port: 5002 },
  { name: "message-service", dir: path.join(ROOT_DIR, "backend", "message-service"), port: 5003 },
  { name: "circle-service", dir: path.join(ROOT_DIR, "backend", "circle-service"), port: 5004 },
  { name: "notification-service", dir: path.join(ROOT_DIR, "backend", "notification-service"), port: 5005 },
  { name: "call-service", dir: path.join(ROOT_DIR, "backend", "call-service"), port: 5006 },
];

const gatewayPort = process.env.PORT || 4000;
const gateway = {
  name: "api-gateway",
  dir: path.join(ROOT_DIR, "gateway"),
  port: gatewayPort,
};

const sharedEnv = {
  ...process.env,
  AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL || "http://127.0.0.1:5001",
  USER_SERVICE_URL: process.env.USER_SERVICE_URL || "http://127.0.0.1:5002",
  MESSAGE_SERVICE_URL: process.env.MESSAGE_SERVICE_URL || "http://127.0.0.1:5003",
  CONVERSATION_SERVICE_URL:
    process.env.CONVERSATION_SERVICE_URL ||
    process.env.MESSAGE_SERVICE_URL ||
    "http://127.0.0.1:5003",
  CIRCLE_SERVICE_URL: process.env.CIRCLE_SERVICE_URL || "http://127.0.0.1:5004",
  NOTIFICATION_SERVICE_URL: process.env.NOTIFICATION_SERVICE_URL || "http://127.0.0.1:5005",
  CALL_SERVICE_URL: process.env.CALL_SERVICE_URL || "http://127.0.0.1:5006",
};

const runningProcesses = [];
let isShuttingDown = false;

function prefixStream(stream, prefix, color) {
  let buffer = "";
  stream.on("data", (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split("\n");
    buffer = lines.pop(); // keep remainder
    for (const line of lines) {
      if (line.trim().length > 0) {
        console.log(`${color}[${prefix}]${resetColor} ${line}`);
      }
    }
  });
  stream.on("end", () => {
    if (buffer.trim().length > 0) {
      console.log(`${color}[${prefix}]${resetColor} ${buffer}`);
    }
  });
}

function startService(svc, colorIndex) {
  const color = colors[colorIndex % colors.length];
  const fs = require("fs");
  const distEntry = path.join(svc.dir, "dist", "server.js");
  const tsEntry = path.join(svc.dir, "server.ts");

  let cmd = "node";
  let args = [distEntry];

  if (!fs.existsSync(distEntry)) {
    if (fs.existsSync(tsEntry)) {
      cmd = process.platform === "win32" ? "npx.cmd" : "npx";
      args = ["tsx", "server.ts"];
    } else {
      console.error(`${color}[${svc.name}]${resetColor} Error: neither dist/server.js nor server.ts found in ${svc.dir}`);
      return null;
    }
  }

  const env = {
    ...sharedEnv,
    PORT: String(svc.port),
  };

  const proc = spawn(cmd, args, {
    cwd: svc.dir,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  prefixStream(proc.stdout, svc.name, color);
  prefixStream(proc.stderr, svc.name, "\x1b[31m");

  proc.on("exit", (code, signal) => {
    if (!isShuttingDown) {
      console.warn(`${color}[${svc.name}]${resetColor} Process exited with code=${code} signal=${signal}`);
      if (svc.name === "api-gateway") {
        console.error("[start-all] API Gateway crashed. Initiating shutdown of all services...");
        shutdown(code || 1);
      }
    }
  });

  runningProcesses.push({ name: svc.name, process: proc });
  return proc;
}

function shutdown(exitCode = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log("\n[start-all] Shutting down all Velora Circle services gracefully...");

  for (const item of runningProcesses) {
    try {
      if (item.process && !item.process.killed) {
        item.process.kill("SIGTERM");
      }
    } catch (err) {
      // Ignore
    }
  }

  setTimeout(() => {
    for (const item of runningProcesses) {
      try {
        if (item.process && !item.process.killed) {
          item.process.kill("SIGKILL");
        }
      } catch (err) {
        // Ignore
      }
    }
    process.exit(exitCode);
  }, 3000);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

console.log("=================================================");
console.log("   Velora Circle Backend Production Orchestrator");
console.log("=================================================");
console.log(`Starting 6 microservices (5001-5006)...`);

// Start microservices first
microservices.forEach((svc, index) => {
  startService(svc, index);
});

// Start Gateway after a brief delay so downstream services are listening
setTimeout(() => {
  console.log(`\nStarting API Gateway on port ${gatewayPort}...`);
  startService(gateway, microservices.length);
}, 2000);
