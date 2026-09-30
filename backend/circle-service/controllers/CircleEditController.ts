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

export const editCircle =
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

      const isCircleAdmin =
        circle.admins.some(
          (admin) =>
            admin.toString() ===
            user.id,
        );

      const isSystemAdmin =
        user.role === "admin";

      if (
        !isCircleAdmin &&
        !isSystemAdmin
      ) {
        res.status(403).json({
          message:
            "Only circle admins can edit this circle",
        });
        return;
      }

      const {
        name,
        description,
      } = req.body;

      if (
        name !== undefined &&
        !name?.trim()
      ) {
        res.status(400).json({
          message:
            "Circle name cannot be empty",
        });
        return;
      }

      if (
        name !== undefined
      ) {
        circle.name =
          name.trim();
      }

      if (
        description !==
        undefined
      ) {
        circle.description =
          description?.trim() || "";
      }

      await circle.save();

      res.status(200).json({
        message:
          "Circle updated successfully",
        circle: {
          id: circle._id,
          name: circle.name,
          description:
            circle.description,
          createdBy:
            circle.createdBy,
          createdAt:
            circle.createdAt,
          updatedAt:
            circle.updatedAt,
        },
      });
    } catch (error) {
      console.error(
        "Edit circle error:",
        error,
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  };

export default {
  editCircle,
};