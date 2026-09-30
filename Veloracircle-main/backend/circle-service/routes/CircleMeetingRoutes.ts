import express from "express";

import {
  createCircleMeeting,
  getCircleMeetings,
  cancelCircleMeeting,
} from "../controllers/CircleMeetingController";

const router = express.Router();

/* Create Circle meeting */

router.post(
  "/:circleId/meetings",
  createCircleMeeting,
);

/* Get Circle meetings */

router.get(
  "/:circleId/meetings",
  getCircleMeetings,
);

/* Cancel Circle meeting */

router.post(
  "/meetings/:meetingId/cancel",
  cancelCircleMeeting,
);

export default router;