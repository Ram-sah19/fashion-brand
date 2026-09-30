import express from "express";

import {
  leaveCircle,
} from "../controllers/CircleLeaveController";

const router = express.Router();

/* Leave circle */

router.post(
  "/:circleId/leave",
  leaveCircle,
);

export default router;