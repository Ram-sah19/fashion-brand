import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

import "./models/User";

import circleRoutes from "./routes/CircleRoutes";
import circleEditRoutes from "./routes/CircleEditRoutes";
import circleLeaveRoutes from "./routes/CircleLeaveRoutes";
import circleAdminRoutes from "./routes/CircleAdminRoutes";
import circleMeetingRoutes from "./routes/CircleMeetingRoutes";
import startCircleMeetingReminderScheduler from "./services/CircleMeetingReminderScheduler";
import circleDeleteRoutes from "./routes/CircleDeleteRoutes";
import circleInternalRoutes from "./routes/CircleInternalRoutes";
dotenv.config();

const app = express();

const PORT =
  process.env.PORT || 5004;

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
    "Velora Circle Service is running",
  );
});

app.use(
  "/api/circles",
  circleRoutes,
);
app.use(
  "/api/circles",
  circleEditRoutes,
);
app.use(
  "/api/circles",
  circleLeaveRoutes,
);
app.use(
  "/api/circles",
  circleAdminRoutes,
);
app.use(
  "/api/circles",
  circleMeetingRoutes,
);
app.use(
  "/api/circles",
  circleDeleteRoutes,
);
app.use(
  "/internal/circles",
  circleInternalRoutes,
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
      "Circle Service MongoDB connected successfully",
    );

    app.listen(PORT, () => {
      console.log(
        `Circle Service running on port ${PORT}`,
      );
      startCircleMeetingReminderScheduler();
    });
  })
  .catch((error) => {
    console.error(
      "Circle Service MongoDB connection error:",
      error,
    );

    process.exit(1);
  });