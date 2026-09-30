import express from "express";

import {
  sendCircleMeetingEmail,
} from "../controllers/CircleMeetingEmailController";

const router = express.Router();

/* Send Circle meeting email */

router.post(
  "/circle-meeting",
  sendCircleMeetingEmail,
);

export default router;