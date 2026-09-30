import dotenv from "dotenv";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/User";
import Otp from "../models/Otp";

import {
  createOtp,
  verifyOtp,
} from "../services/OtpService";

import {
  sendOtpEmail,
} from "../services/EmailService";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

type OtpPurpose = "register" | "login" | "reset";

const isStrongPassword = (
  password: string,
): boolean => {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
};

const validPurpose = (
  purpose: string,
): purpose is OtpPurpose => {
  return (
    purpose === "register" ||
    purpose === "login" ||
    purpose === "reset"
  );
};

// =========================
// REGISTER
// =========================

export const register = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({
        message:
          "Name, email and password are required",
      });
      return;
    }

    if (!isStrongPassword(password)) {
      res.status(400).json({
        message:
          "Password must be at least 8 characters and contain uppercase, lowercase, number and special character",
      });
      return;
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      res.status(409).json({
        message: "User already exists",
      });
      return;
    }

    const hashedPassword =
      await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "user",
      emailVerified: false,
    });

    const { otp } = await createOtp({
      userId: user._id.toString(),
      email: user.email,
      purpose: "register",
    });

    await sendOtpEmail({
      email: user.email,
      otp,
      purpose: "register",
    });

    res.status(201).json({
      message:
        "User registered successfully. OTP sent to your email.",
      requiresOtp: true,
      userId: user._id,
      email: user.email,
    });
  } catch (error) {
    console.error(
      "Auth Service register error:",
      error,
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

// =========================
// LOGIN
// =========================

export const login = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        message:
          "Email and password are required",
      });
      return;
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      res.status(401).json({
        message: "Invalid email or password",
      });
      return;
    }

    const isPasswordCorrect =
      await bcrypt.compare(
        password,
        user.password,
      );

    if (!isPasswordCorrect) {
      res.status(401).json({
        message: "Invalid email or password",
      });
      return;
    }

    if (!user.emailVerified) {
      res.status(403).json({
        message:
          "Please verify your email before logging in.",
        requiresEmailVerification: true,
        userId: user._id,
        email: user.email,
      });
      return;
    }

    const { otp } = await createOtp({
      userId: user._id.toString(),
      email: user.email,
      purpose: "login",
    });

    sendOtpEmail({
      email: user.email,
      otp,
      purpose: "login",
    }).catch((error) => {
      console.error("Login OTP email error:", error);
    });

    res.status(200).json({
      message:
        "Password verified. OTP sent to your email.",
      requiresOtp: true,
      userId: user._id,
      email: user.email,
    });
  } catch (error) {
    console.error(
      "Auth Service login error:",
      error,
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

// =========================
// VERIFY OTP
// =========================

export const verifyEmailOtp = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const {
      userId,
      otp,
      purpose,
    } = req.body;

    if (!userId || !otp || !purpose) {
      res.status(400).json({
        message:
          "User ID, OTP and purpose are required",
      });
      return;
    }

    if (!validPurpose(purpose)) {
      res.status(400).json({
        message: "Invalid OTP purpose",
      });
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      res.status(400).json({
        message:
          "OTP must be a 6-digit number",
      });
      return;
    }

    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({
        message: "User not found",
      });
      return;
    }

    const isValid = await verifyOtp({
      userId: user._id.toString(),
      otp,
      purpose,
    });

    if (!isValid) {
      res.status(400).json({
        message: "Invalid or expired OTP",
      });
      return;
    }

    if (purpose === "register") {
      user.emailVerified = true;
      await user.save();

      res.status(200).json({
        message:
          "Email verified successfully",
        verified: true,
      });

      return;
    }

    if (purpose === "reset") {
      const resetToken = jwt.sign(
        {
          userId: user._id.toString(),
          purpose: "password-reset",
        },
        JWT_SECRET,
        {
          expiresIn: "10m",
        },
      );

      res.status(200).json({
        message:
          "OTP verified successfully",
        resetToken,
      });

      return;
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(
      "OTP verification error:",
      error,
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

// =========================
// RESEND OTP
// =========================

export const resendOtp = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const {
      userId,
      purpose,
    } = req.body;

    if (!userId || !purpose) {
      res.status(400).json({
        message:
          "User ID and purpose are required",
      });
      return;
    }

    if (!validPurpose(purpose)) {
      res.status(400).json({
        message: "Invalid OTP purpose",
      });
      return;
    }

    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({
        message: "User not found",
      });
      return;
    }
    if (
      purpose === "login" &&
      user.role === "admin" &&
      !user.isActive
    ) {
      res.status(403).json({
        message: "Your account has been disabled",
      });
      return;
    }

    const latestOtp = await Otp.findOne({
      userId: user._id,
      purpose,
    }).sort({ createdAt: -1 });

    if (latestOtp) {
      const secondsSinceLastOtp =
        (Date.now() -
          latestOtp.createdAt.getTime()) /
        1000;

      if (secondsSinceLastOtp < 60) {
        const remainingSeconds =
          Math.ceil(
            60 - secondsSinceLastOtp,
          );

        res.status(429).json({
          message: `Please wait ${remainingSeconds} seconds before requesting a new OTP`,
        });

        return;
      }
    }

    const { otp } = await createOtp({
      userId: user._id.toString(),
      email: user.email,
      purpose,
    });

    await sendOtpEmail({
      email: user.email,
      otp,
      purpose,
    });

    res.status(200).json({
      message:
        "A new OTP has been sent to your email",
    });
  } catch (error) {
    console.error(
      "Resend OTP error:",
      error,
    );

    res.status(500).json({
      message: "Unable to resend OTP",
    });
  }
};

// =========================
// FORGOT PASSWORD
// =========================

export const forgotPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        message: "Email is required",
      });
      return;
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      res.status(404).json({
        message: "User not found",
      });
      return;
    }

    const { otp } = await createOtp({
      userId: user._id.toString(),
      email: user.email,
      purpose: "reset",
    });

    await sendOtpEmail({
      email: user.email,
      otp,
      purpose: "reset",
    });

    res.status(200).json({
      message:
        "Password reset OTP sent to your email",
      requiresOtp: true,
      userId: user._id,
    });
  } catch (error) {
    console.error(
      "Forgot password error:",
      error,
    );

    res.status(500).json({
      message: "Unable to send reset OTP",
    });
  }
};

// =========================
// RESET PASSWORD
// =========================

export const resetPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const {
      resetToken,
      password,
    } = req.body;

    if (!resetToken || !password) {
      res.status(400).json({
        message:
          "Reset token and password are required",
      });
      return;
    }

    if (!isStrongPassword(password)) {
      res.status(400).json({
        message:
          "Password must be at least 8 characters and contain uppercase, lowercase, number and special character",
      });
      return;
    }

    const decoded =
      jwt.verify(
        resetToken,
        JWT_SECRET,
      ) as {
        userId: string;
        purpose: string;
      };

    if (
      decoded.purpose !==
      "password-reset"
    ) {
      res.status(401).json({
        message: "Invalid reset token",
      });
      return;
    }

    const user = await User.findById(
      decoded.userId,
    );

    if (!user) {
      res.status(404).json({
        message: "User not found",
      });
      return;
    }

    const isSamePassword =
      await bcrypt.compare(
        password,
        user.password,
      );

    if (isSamePassword) {
      res.status(400).json({
        message:
          "New password must be different from your old password",
      });
      return;
    }

    user.password =
      await bcrypt.hash(password, 12);

    await user.save();

    res.status(200).json({
      message:
        "Password reset successfully",
    });
  } catch (error) {
    console.error(
      "Reset password error:",
      error,
    );

    res.status(401).json({
      message:
        "Invalid or expired reset token",
    });
  }
};
export const adminLogin = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        message: "Email and password are required",
      });
      return;
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      res.status(401).json({
        message: "Invalid email or password",
      });
      return;
    }

    if (user.role !== "admin") {
      res.status(403).json({
        message: "Admin access required",
      });
      return;
    }
    if (!user.isActive) {
      res.status(403).json({
        message: "Your account has been disabled",
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      res.status(401).json({
        message: "Invalid email or password",
      });
      return;
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );

    res.status(200).json({
      message: "Admin login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

export const superadminLogin = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        message: "Email and password are required",
      });
      return;
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      res.status(401).json({
        message: "Invalid email or password",
      });
      return;
    }

    if (user.role !== "superadmin") {
      res.status(403).json({
        message: "Superadmin access required",
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      res.status(401).json({
        message: "Invalid email or password",
      });
      return;
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );

    res.status(200).json({
      message: "Superadmin login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Superadmin login error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};
// =========================
// GET CURRENT USER
// =========================

export const getCurrentUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    if (!authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        message: "Invalid authorization format",
      });
      return;
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      res.status(401).json({
        message: "Authentication token is required",
      });
      return;
    }

    const decoded = jwt.verify(
      token,
      JWT_SECRET,
    ) as {
      userId: string;
    };

    const user = await User.findById(
      decoded.userId,
    ).select("name email role isActive");

    if (!user) {
      res.status(401).json({
        message: "User account not found",
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        message: "Your account has been disabled",
      });
      return;
    }

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(
      "Get current user error:",
      error,
    );

    res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};