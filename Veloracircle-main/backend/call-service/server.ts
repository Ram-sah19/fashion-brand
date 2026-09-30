import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import http from "http";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";

import "./models/Call";

import callRoutes from "./routes/CallRoutes";
import { registerCallSocket } from "./socket/CallSocket";

dotenv.config();

const app = express();
const httpServer = http.createServer(app);

const PORT =
  process.env.PORT || 5006;

const MONGO_URI =
  process.env.MONGO_URI;

const JWT_SECRET =
  process.env.JWT_SECRET;

const io = new Server(httpServer, {
  path: "/socket.io/calls",
  cors: {
    origin: true,
    credentials: true,
  },
});

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).send(
    "Velora Call Service is running",
  );
});

app.use(
  "/api/calls",
  callRoutes,
);

// =====================================================
// Socket authentication
// =====================================================

io.use((socket, next) => {
  try {
    if (!JWT_SECRET) {
      return next(
        new Error("JWT_SECRET is not configured"),
      );
    }

    const token =
      socket.handshake.auth?.token;

    if (!token) {
      return next(
        new Error("Authentication required"),
      );
    }

    const decoded =
      jwt.verify(token, JWT_SECRET) as {
        id?: string;
        userId?: string;
        _id?: string;
      };

    const userId =
      decoded.id ||
      decoded.userId ||
      decoded._id;

    if (!userId) {
      return next(
        new Error("Invalid authentication token"),
      );
    }

    socket.data.userId = userId;

    next();
  } catch {
    next(
      new Error("Invalid authentication token"),
    );
  }
});

// =====================================================
// Call Socket.IO
// =====================================================

io.on("connection", (socket) => {
  const userId =
    socket.data.userId as string;

  console.log(
    "Call client connected:",
    socket.id,
    "User:",
    userId,
  );

  // Private room for this user
  socket.join(`user:${userId}`);

  // Register all call signaling events
  registerCallSocket(
    io,
    socket,
  );

  socket.on("disconnect", () => {
    console.log(
      "Call client disconnected:",
      socket.id,
      "User:",
      userId,
    );
  });
});

// =====================================================
// Database + server
// =====================================================

if (!MONGO_URI) {
  console.error(
    "MONGO_URI is not configured",
  );

  process.exit(1);
}

if (!JWT_SECRET) {
  console.error(
    "JWT_SECRET is not configured",
  );

  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log(
      "Call Service MongoDB connected successfully",
    );

    httpServer.listen(PORT, () => {
      console.log(
        `Call Service running on port ${PORT}`,
      );
    });
  })
  .catch((error) => {
    console.error(
      "Call Service MongoDB connection error:",
      error,
    );

    process.exit(1);
  });