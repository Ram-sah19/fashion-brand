import express from "express";

import {
  sendCircleMeetingReminderEmail,
} from "../controllers/CircleMeetingReminderController";

const router = express.Router();

router.post(
  "/circle-meeting-reminder",
  sendCircleMeetingReminderEmail,
);

export default router;