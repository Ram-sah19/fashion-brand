import express from "express";

import {
  createCall,
  updateCallStatus,
  getMyCalls,
} from "../controllers/CallController";

const router = express.Router();

router.post("/", createCall);

router.get("/", getMyCalls);

router.patch(
  "/:callId/status",
  updateCallStatus,
);

export default router;