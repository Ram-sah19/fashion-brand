import express from "express";

import {
  register,
  login,
  adminLogin,
  superadminLogin,
  verifyEmailOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
  getCurrentUser,
} from "../controllers/AuthController";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.post("/admin-login", adminLogin);
router.post("/superadmin-login", superadminLogin);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.post("/otp/verify", verifyEmailOtp);
router.post("/otp/resend", resendOtp);
router.get("/me", getCurrentUser);
export default router;