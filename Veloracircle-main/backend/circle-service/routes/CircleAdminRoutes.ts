import express from "express";

import {
  promoteMember,
  demoteMember,
} from "../controllers/CircleAdminController";

const router = express.Router();

/* Promote member to circle admin */

router.post(
  "/:circleId/admins/promote",
  promoteMember,
);

/* Demote circle admin */

router.post(
  "/:circleId/admins/demote",
  demoteMember,
);

export default router;