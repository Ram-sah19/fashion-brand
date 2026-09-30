import express from "express";

import {
  createNotification,
  getMyNotifications,
  markAsRead,
  markAllAsRead,
} from "../controllers/NotificationController";

const router = express.Router();

/* Create notification */
router.post(
  "/",
  createNotification,
);

/* Get logged-in user's notifications */
router.get(
  "/",
  getMyNotifications,
);

/* Mark one notification as read */
router.patch(
  "/:notificationId/read",
  markAsRead,
);

/* Mark all notifications as read */
router.patch(
  "/read-all",
  markAllAsRead,
);

export default router;