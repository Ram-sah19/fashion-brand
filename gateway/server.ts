import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { createProxyMiddleware } from "http-proxy-middleware";
import { loadShedding } from "./middleware/loadShedding";

dotenv.config();

const app = express();
app.use(loadShedding);
const PORT = process.env.PORT || 4000;

const AUTH_SERVICE_URL =
    process.env.AUTH_SERVICE_URL ||
    "http://127.0.0.1:5001";

const USER_SERVICE_URL =
    process.env.USER_SERVICE_URL ||
    "http://127.0.0.1:5002";

const MESSAGE_SERVICE_URL =
  process.env.MESSAGE_SERVICE_URL ||
  "http://127.0.0.1:5003";

const CONVERSATION_SERVICE_URL =
  process.env.CONVERSATION_SERVICE_URL ||
  process.env.MESSAGE_SERVICE_URL ||
  "http://127.0.0.1:5003";

const CIRCLE_SERVICE_URL =
  process.env.CIRCLE_SERVICE_URL ||
  "http://127.0.0.1:5004";

const NOTIFICATION_SERVICE_URL =
  process.env.NOTIFICATION_SERVICE_URL ||
  "http://127.0.0.1:5005";

const CALL_SERVICE_URL =
  process.env.CALL_SERVICE_URL ||
  "http://127.0.0.1:5006";

app.use(
    cors({
        origin: true,
        credentials: true,
    }),
);

// Health check endpoint for Render / monitoring
app.get("/health", (_req, res) => {
    res.status(200).json({
        status: "ok",
        service: "gateway",
        timestamp: new Date().toISOString(),
    });
});

app.get("/", (_req, res) => {
    res.json({
        message: "Velora Circle API Gateway is running",
        status: "healthy",
    });
});

// Proxy static uploads to Message Service
app.use(
  "/uploads",
  createProxyMiddleware({
    target: MESSAGE_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
      "^/": "/uploads/",
    },
  }),
);

// Proxy WebSocket connections for Call Service
const callSocketProxy = createProxyMiddleware({
  target: CALL_SERVICE_URL,
  changeOrigin: true,
  ws: true,
  pathRewrite: {
    "^/": "/socket.io/calls/",
  },
});
app.use("/socket.io/calls", callSocketProxy);

// Proxy WebSocket connections for Message Service
const messageSocketProxy = createProxyMiddleware({
  target: MESSAGE_SERVICE_URL,
  changeOrigin: true,
  ws: true,
  pathRewrite: {
    "^/": "/socket.io/messages/",
  },
});
app.use("/socket.io/messages", messageSocketProxy);

app.use(
  "/api/calls",
  createProxyMiddleware({
    target: CALL_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
      "^/": "/api/calls/",
    },
  }),
);
app.use(
  "/api/conversations",
  createProxyMiddleware({
    target: CONVERSATION_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
      "^/": "/api/conversations/",
    },
  }),
);
app.use(
  "/api/circle-conversations",
  createProxyMiddleware({
    target: CONVERSATION_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
      "^/": "/api/circle-conversations/",
    },
  }),
);
app.use(
  "/api/notifications",
  createProxyMiddleware({
    target: NOTIFICATION_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
      "^/": "/api/notifications/",
    },
  }),
);
app.use(
  "/api/circles",
  createProxyMiddleware({
    target: CIRCLE_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
      "^/": "/api/circles/",
    },
  }),
);
// Auth Service
app.use(
    "/api/auth",
    createProxyMiddleware({
        target: AUTH_SERVICE_URL,
        changeOrigin: true,
        pathRewrite: {
            "^/": "/api/auth/",
        },
    }),
);
app.use(
    "/api/otp",
    createProxyMiddleware({
        target: AUTH_SERVICE_URL,
        changeOrigin: true,
        pathRewrite: {
            "^/": "/api/auth/otp/",
        },
    }),
);
app.use(
    "/api/users",
    createProxyMiddleware({
        target: USER_SERVICE_URL,
        changeOrigin: true,
        pathRewrite: {
            "^/": "/api/users/",
        },
    }),
);

app.use(
  "/api/messages",
  createProxyMiddleware({
    target: MESSAGE_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
      "^/": "/api/messages/",
    },
  }),
);

const server = http.createServer(app);

// Handle HTTP upgrade requests for WebSockets
server.on("upgrade", (req, socket, head) => {
  const url = req.url || "";
  if (url.startsWith("/socket.io/calls")) {
    callSocketProxy.upgrade(req, socket as any, head as Buffer);
  } else if (url.startsWith("/socket.io/messages")) {
    messageSocketProxy.upgrade(req, socket as any, head as Buffer);
  }
});

server.listen(PORT, () => {
    console.log(
        `API Gateway running on port ${PORT}`,
    );
    console.log(
        `Auth forwarded to ${AUTH_SERVICE_URL}`,
    );
});