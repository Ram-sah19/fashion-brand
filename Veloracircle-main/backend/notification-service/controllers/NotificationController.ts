import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import Notification from "../models/Notification";

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

    const decoded = jwt.verify(
      token,
      secret,
    ) as {
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

/* CREATE NOTIFICATION */

export const createNotification =
  async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const {
        userId,
        type,
        title,
        message,
      } = req.body;

      if (
        !mongoose.isValidObjectId(
          userId,
        )
      ) {
        res.status(400).json({
          message: "Invalid user ID",
        });
        return;
      }

      if (
        ![
          "message",
          "circle",
          "call",
          "system",
        ].includes(type)
      ) {
        res.status(400).json({
          message: "Invalid notification type",
        });
        return;
      }

      if (
        !title?.trim() ||
        !message?.trim()
      ) {
        res.status(400).json({
          message:
            "Title and message are required",
        });
        return;
      }

      const notification =
        await Notification.create({
          userId,
          type,
          title: title.trim(),
          message: message.trim(),
        });

      res.status(201).json({
        notification,
      });
    } catch (error) {
      console.error(
        "Create notification error:",
        error,
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  };

/* GET MY NOTIFICATIONS */

export const getMyNotifications =
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

      const notifications =
        await Notification.find({
          userId: new mongoose.Types.ObjectId(
            user.id,
          ),
        })
          .sort({
            createdAt: -1,
          })
          .limit(50);

      res.status(200).json({
        notifications,
      });
    } catch (error) {
      console.error(
        "Get notifications error:",
        error,
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  };

/* MARK NOTIFICATION AS READ */

export const markAsRead =
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

      const notificationId =
        req.params.notificationId;

      if (
        !mongoose.isValidObjectId(
          notificationId,
        )
      ) {
        res.status(400).json({
          message:
            "Invalid notification ID",
        });
        return;
      }

      const notification =
        await Notification.findOneAndUpdate(
          {
            _id: notificationId,
            userId:
              new mongoose.Types.ObjectId(
                user.id,
              ),
          },
          {
            read: true,
          },
          {
            new: true,
          },
        );

      if (!notification) {
        res.status(404).json({
          message:
            "Notification not found",
        });
        return;
      }

      res.status(200).json({
        notification,
      });
    } catch (error) {
      console.error(
        "Mark notification error:",
        error,
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  };

/* MARK ALL AS READ */

export const markAllAsRead =
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

      await Notification.updateMany(
        {
          userId:
            new mongoose.Types.ObjectId(
              user.id,
            ),
          read: false,
        },
        {
          read: true,
        },
      );

      res.status(200).json({
        message:
          "All notifications marked as read",
      });
    } catch (error) {
      console.error(
        "Mark all notifications error:",
        error,
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  };

export default {
  createNotification,
  getMyNotifications,
  markAsRead,
  markAllAsRead,
};