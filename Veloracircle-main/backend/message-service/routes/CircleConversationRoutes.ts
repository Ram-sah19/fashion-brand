import express from "express";

import {
  createOrGetCircleConversation,
} from "../controllers/CircleConversationController";

const router =
  express.Router();

router.post(
  "/:circleId",
  createOrGetCircleConversation,
);

export default router;