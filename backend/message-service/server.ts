import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import http from "http";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { setIO } from "./socket";
import "./models/User";
import path from "path";
import messageRoutes from "./routes/MessageRoutes";
import conversationRoutes from "./routes/ConversationRoutes";
import circleConversationRoutes from "./routes/CircleConversationRoutes";

import { registerReadReceiptSocket } from "./socket/ReadReceiptSocket";

dotenv.config();

const app = express();
app.use(
  "/uploads",
  express.static(
    path.join(process.cwd(), "uploads"),
  ),
);

const httpServer = http.createServer(app);

const PORT = process.env.PORT || 5003;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json());

app.use("/api/messages", messageRoutes);

app.use(
  "/api/conversations",
  conversationRoutes,
);
app.use(
  "/api/circle-conversations",
  circleConversationRoutes,
);

app.get("/", (_req, res) => {
  res.json({
    message:
      "Velora Circle Message Service is running",
  });
});

// Socket.IO
const io = new Server(httpServer, {
  path: "/socket.io/messages",
  cors: {
    origin: true,
    credentials: true,
  },
});
setIO(io);
export { io };
// Socket authentication
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
        new Error(
          "Invalid authentication token",
        ),
      );
    }

    socket.data.userId = userId;

    next();
  } catch {
    next(
      new Error(
        "Invalid authentication token",
      ),
    );
  }
});

// Socket connections
io.on("connection", (socket) => {
  const userId =
    socket.data.userId as string;

  console.log(
    "Message client connected:",
    socket.id,
    "User:",
    userId,
  );

  // Personal user room
  socket.join(`user:${userId}`);

  // Conversation room
  socket.on(
    "joinConversation",
    (conversationId: string) => {
      socket.join(
        `conversation:${conversationId}`,
      );

      console.log(
        `Socket ${socket.id} joined conversation ${conversationId}`,
      );
    },
  );

  // Read receipts
  registerReadReceiptSocket(
    io,
    socket,
  );

  socket.on("disconnect", () => {
    console.log(
      "Message client disconnected:",
      socket.id,
      "User:",
      userId,
    );
  });
});

// Environment validation
if (!MONGO_URI) {
  throw new Error(
    "MONGO_URI is not defined",
  );
}

if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET is not defined",
  );
}

// Database + server
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log(
      "Message Service MongoDB connected successfully",
    );

    httpServer.listen(PORT, () => {
      console.log(
        `Message Service running on port ${PORT}`,
      );
    });
  })
  .catch((error) => {
    console.error(
      "Message Service MongoDB connection failed:",
      error,
    );

    process.exit(1);
  });