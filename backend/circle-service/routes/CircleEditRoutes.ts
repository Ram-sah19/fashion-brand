import express from "express";

import {
  editCircle,
} from "../controllers/CircleEditController";

const router = express.Router();

/* Edit circle */

router.patch(
  "/:circleId",
  editCircle,
);

export default router;