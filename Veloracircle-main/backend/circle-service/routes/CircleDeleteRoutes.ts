import express from "express";

import {
  deleteCircle,
} from "../controllers/CircleDeleteController";

const router = express.Router();

router.delete(
  "/:circleId",
  deleteCircle,
);

export default router;