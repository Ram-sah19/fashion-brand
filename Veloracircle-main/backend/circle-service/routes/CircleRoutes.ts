import express from "express";

import {
  createCircle,
  getMyCircles,
  getAllCircles,
  getCircle,
  addMember,
  removeMember,
  getCircleCallMembers,
} from "../controllers/CircleController";

import {
  createCircleMeeting,
  getCircleMeetings,
  cancelCircleMeeting,
} from "../controllers/CircleMeetingController";

const router = express.Router();

/* Create a circle */
router.post(
  "/",
  createCircle,
);

/* Get circles of logged-in user */
router.get(
  "/",
  getMyCircles,
);

/* Admin: Get all circles with members */
router.get(
  "/admin/all",
  getAllCircles,
);

/* Get members for Circle meeting call */
router.get(
  "/:circleId/call-members",
  getCircleCallMembers,
);

/* Circle meetings */
router.post(
  "/:circleId/meetings",
  createCircleMeeting,
);

router.get(
  "/:circleId/meetings",
  getCircleMeetings,
);

router.delete(
  "/:circleId/meetings/:meetingId",
  cancelCircleMeeting,
);

/* Get one circle */
router.get(
  "/:circleId",
  getCircle,
);

/* Add member */
router.post(
  "/:circleId/members",
  addMember,
);

/* Remove member */
router.delete(
  "/:circleId/members",
  removeMember,
);

export default router;