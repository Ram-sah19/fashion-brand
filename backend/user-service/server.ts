import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import userRoutes from "./routes/UserRoutes";
dotenv.config();

const app = express();

const PORT = process.env.PORT || 5002;
const MONGO_URI = process.env.MONGO_URI;

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json());
app.use("/api/users", userRoutes);
app.get("/", (_req, res) => {
  res.json({
    message: "Velora Circle User Service is running",
  });
});

if (!MONGO_URI) {
  throw new Error("MONGO_URI is not defined");
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log(
      "User Service MongoDB connected successfully",
    );

    app.listen(PORT, () => {
      console.log(
        `User Service running on port ${PORT}`,
      );
    });
  })
  .catch((error) => {
    console.error(
      "User Service MongoDB connection failed:",
      error,
    );

    process.exit(1);
  });