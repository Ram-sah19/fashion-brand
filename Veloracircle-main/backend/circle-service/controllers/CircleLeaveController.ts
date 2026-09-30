import { Request, Response } from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

import Circle from "../models/Circle";

type AuthUser = {
  id: string;
  role: "user" | "admin";
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
      jwt.verify(token, secret) as {
        id?: string;
        userId?: string;
        _id?: string;
        role?: "user" | "admin";
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
      role: decoded.role || "user",
    };
  } catch {
    return null;
  }
};

export const leaveCircle =
  async (
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

      const circleId =
        req.params.circleId;

      if (
        !mongoose.isValidObjectId(
          circleId,
        )
      ) {
        res.status(400).json({
          message:
            "Invalid circle ID",
        });
        return;
      }

      const circle =
        await Circle.findById(
          circleId,
        );

      if (!circle) {
        res.status(404).json({
          message:
            "Circle not found",
        });
        return;
      }

      const isMember =
        circle.members.some(
          (member) =>
            member.toString() ===
            user.id,
        );

      if (!isMember) {
        res.status(403).json({
          message:
            "You are not a member of this circle",
        });
        return;
      }

      const isCircleAdmin =
        circle.admins.some(
          (admin) =>
            admin.toString() ===
            user.id,
        );

      if (
        isCircleAdmin &&
        circle.admins.length === 1
      ) {
        res.status(400).json({
          message:
            "The last circle admin cannot leave the circle",
        });
        return;
      }

      circle.members =
        circle.members.filter(
          (member) =>
            member.toString() !==
            user.id,
        );

      circle.admins =
        circle.admins.filter(
          (admin) =>
            admin.toString() !==
            user.id,
        );

      await circle.save();

      res.status(200).json({
        message:
          "You left the circle successfully",
      });
    } catch (error) {
      console.error(
        "Leave circle error:",
        error,
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  };

export default {
  leaveCircle,
};