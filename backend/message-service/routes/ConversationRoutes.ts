import express from "express";

import {
  createOrGetConversation,
  getMyConversations,
  markConversationAsRead,
  togglePinConversation,
  deleteConversation,
} from "../controllers/ConversationController";

const router = express.Router();

router.post(
  "/",
  createOrGetConversation,
);

router.get(
  "/",
  getMyConversations,
);

router.patch(
  "/:conversationId/read",
  markConversationAsRead,
);

router.patch(
  "/:conversationId/pin",
  togglePinConversation,
);

router.delete(
  "/:conversationId",
  deleteConversation,
);

export default router;