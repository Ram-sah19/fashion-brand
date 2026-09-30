import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/User";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: "user" | "admin" | "superadmin";
  };
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
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
      email: string;
      role: "user" | "admin" | "superadmin";
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

    req.user = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error);

    res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};
export const requireSuperadmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.user) {
    res.status(401).json({
      message: "Authentication required",
    });
    return;
  }

  if (req.user.role !== "superadmin") {
    res.status(403).json({
      message: "Superadmin access required",
    });
    return;
  }

  next();
};
export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.user) {
    res.status(401).json({
      message: "Authentication required",
    });
    return;
  }

  if (
    req.user.role !== "admin" &&
    req.user.role !== "superadmin"
  ) {
    res.status(403).json({
      message: "Admin access required",
    });
    return;
  }

  next();
};