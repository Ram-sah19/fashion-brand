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

/* PROMOTE MEMBER TO CIRCLE ADMIN */

export const promoteMember =
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

      const {
        userId,
      } = req.body;

      if (
        !mongoose.isValidObjectId(
          circleId,
        ) ||
        !mongoose.isValidObjectId(
          userId,
        )
      ) {
        res.status(400).json({
          message:
            "Invalid ID",
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

      const isAdmin =
        circle.admins.some(
          (admin) =>
            admin.toString() ===
            user.id,
        );

      if (
        !isAdmin &&
        user.role !== "admin"
      ) {
        res.status(403).json({
          message:
            "Only circle admins can promote members",
        });
        return;
      }

      const isMember =
        circle.members.some(
          (member) =>
            member.toString() ===
            userId,
        );

      if (!isMember) {
        res.status(400).json({
          message:
            "User is not a member of this circle",
        });
        return;
      }

      const alreadyAdmin =
        circle.admins.some(
          (admin) =>
            admin.toString() ===
            userId,
        );

      if (alreadyAdmin) {
        res.status(200).json({
          message:
            "User is already a circle admin",
        });
        return;
      }

      circle.admins.push(
        new mongoose.Types.ObjectId(
          userId,
        ),
      );

      await circle.save();

      res.status(200).json({
        message:
          "Member promoted to circle admin successfully",
      });
    } catch (error) {
      console.error(
        "Promote member error:",
        error,
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  };

/* DEMOTE CIRCLE ADMIN */

export const demoteMember =
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

      const {
        userId,
      } = req.body;

      if (
        !mongoose.isValidObjectId(
          circleId,
        ) ||
        !mongoose.isValidObjectId(
          userId,
        )
      ) {
        res.status(400).json({
          message:
            "Invalid ID",
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

      const isAdmin =
        circle.admins.some(
          (admin) =>
            admin.toString() ===
            user.id,
        );

      if (
        !isAdmin &&
        user.role !== "admin"
      ) {
        res.status(403).json({
          message:
            "Only circle admins can demote members",
        });
        return;
      }

      const targetIsAdmin =
        circle.admins.some(
          (admin) =>
            admin.toString() ===
            userId,
        );

      if (!targetIsAdmin) {
        res.status(400).json({
          message:
            "User is not a circle admin",
        });
        return;
      }

      if (
        circle.admins.length === 1
      ) {
        res.status(400).json({
          message:
            "The last circle admin cannot be demoted",
        });
        return;
      }

      circle.admins =
        circle.admins.filter(
          (admin) =>
            admin.toString() !==
            userId,
        );

      await circle.save();

      res.status(200).json({
        message:
          "Circle admin demoted successfully",
      });
    } catch (error) {
      console.error(
        "Demote member error:",
        error,
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  };

export default {
  promoteMember,
  demoteMember,
};