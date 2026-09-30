import express from "express";

import {
  getAdmins,
getAllUsers,
getUserById,
searchUsers,
updateUserRole,
deleteUser,
disableAdmin,
enableAdmin,
} from "../controllers/UserController";

import {
  protect,
  requireAdmin,
  requireSuperadmin,
} from "../middleware/AuthMiddleware";

const router = express.Router();

router.get("/search", searchUsers);

router.get(
  "/admins",
  protect,
  requireSuperadmin,
  getAdmins,
);
router.patch(
  "/admins/:userId/disable",
  protect,
  requireSuperadmin,
  disableAdmin,
);

router.patch(
  "/admins/:userId/enable",
  protect,
  requireSuperadmin,
  enableAdmin,
);

// Admin dashboard
router.get(
  "/admin/all",
  protect,
  requireAdmin,
  getAllUsers,
);

router.patch(
  "/admin/:userId/role",
  protect,
  requireAdmin,
  updateUserRole,
);

router.delete(
  "/admin/:userId",
  protect,
  requireAdmin,
  deleteUser,
);

router.get("/:userId", getUserById);

export default router;