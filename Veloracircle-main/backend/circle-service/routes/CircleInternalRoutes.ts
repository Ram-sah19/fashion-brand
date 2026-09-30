import express from "express";

import {
  getCircleMemberIds,
} from "../controllers/CircleInternalController";

const router =
  express.Router();

router.get(
  "/:circleId/members",
  getCircleMemberIds,
);

export default router;