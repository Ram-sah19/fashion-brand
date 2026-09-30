import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

import "./models/Notification";

import notificationRoutes from "./routes/NotificationRoutes";
import circleMeetingEmailRoutes from "./routes/CircleMeetingEmailRoutes";
import circleMeetingReminderRoutes from "./routes/CircleMeetingReminderRoutes";
dotenv.config();

const app = express();

const PORT =
  process.env.PORT || 5005;

const MONGO_URI =
  process.env.MONGO_URI;

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).send(
    "Velora Notification Service is running",
  );
});

app.use(
  "/api/notifications",
  notificationRoutes,
);
app.use(
  "/api/notifications",
  circleMeetingEmailRoutes,
);
app.use(
  "/api/notifications",
  circleMeetingReminderRoutes,
);

if (!MONGO_URI) {
  console.error(
    "MONGO_URI is not configured",
  );
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log(
      "Notification Service MongoDB connected successfully",
    );

    app.listen(PORT, () => {
      console.log(
        `Notification Service running on port ${PORT}`,
      );
    });
  })
  .catch((error) => {
    console.error(
      "Notification Service MongoDB connection error:",
      error,
    );

    process.exit(1);
  });