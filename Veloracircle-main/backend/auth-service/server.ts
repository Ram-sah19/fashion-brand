import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

import authRoutes from "./routes/AuthRoutes";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5001;

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    message: "Velora Circle Auth Service is running",
  });
});

app.use("/api/auth", authRoutes);

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error("MONGO_URI is not defined");
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Auth Service MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(
        `Auth Service running on port ${PORT}`,
      );
    });
  })
  .catch((error) => {
    console.error(
      "Auth Service MongoDB connection failed:",
      error,
    );
    process.exit(1);
  });