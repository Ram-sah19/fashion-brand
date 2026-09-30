import { Request, Response } from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

import Circle from "../models/Circle";
import CircleMeeting from "../models/CircleMeeting";

type AuthUser = {
  id: string;
  role: "user" | "admin" | "superadmin";
};

const getUserFromToken = (
  req: Request,
): AuthUser | null => {
  try {
    const authHeader =
      req.headers.authorization;

    if (
      !authHeader?.startsWith("Bearer ")
    ) {
      return null;
    }

    const token =
      authHeader.split(" ")[1];

    const secret =
      process.env.JWT_SECRET;

    if (!secret) {
      return null;
    }

    const decoded =
      jwt.verify(
        token,
        secret,
      ) as {
        id?: string;
        userId?: string;
        _id?: string;
        role?:
          | "user"
          | "admin"
          | "superadmin";
      };

    const id =
      decoded.id ||
      decoded.userId ||
      decoded._id;

    if (!id) {
      return null;
    }

    return {
      id,
      role:
        decoded.role || "user",
    };
  } catch {
    return null;
  }
};

export const deleteCircle = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const user =
      getUserFromToken(req);

    if (!user) {
      res.status(401).json({
        message:
          "Authentication required",
      });
      return;
    }

    const circleId = String(
      req.params.circleId,
    );

    if (
      !mongoose.Types.ObjectId.isValid(
        circleId,
      )
    ) {
      res.status(400).json({
        message: "Invalid Circle ID",
      });
      return;
    }

    const circle =
      await Circle.findById(circleId);

    if (!circle) {
      res.status(404).json({
        message: "Circle not found",
      });
      return;
    }

    const isSystemAdmin =
      user.role === "admin" ||
      user.role === "superadmin";

    const isCircleAdmin =
      circle.admins.some(
        (adminId) =>
          adminId.toString() ===
          user.id,
      );

    if (
      !isSystemAdmin &&
      !isCircleAdmin
    ) {
      res.status(403).json({
        message:
          "Only a Circle Admin can delete this Circle",
      });
      return;
    }

    await CircleMeeting.deleteMany({
      circle: circle._id,
    });

    await Circle.deleteOne({
      _id: circle._id,
    });

    res.status(200).json({
      message:
        "Circle deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete Circle error:",
      error,
    );

    res.status(500).json({
      message:
        "Failed to delete Circle",
    });
  }
};