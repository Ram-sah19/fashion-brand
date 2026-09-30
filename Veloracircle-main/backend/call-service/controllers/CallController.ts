import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import Call from "../models/Call";

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

/* CREATE CALL */

export const createCall =
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

      const {
        receiverId,
        type,
      } = req.body;

      if (
        !mongoose.isValidObjectId(
          receiverId,
        )
      ) {
        res.status(400).json({
          message:
            "Invalid receiver ID",
        });
        return;
      }

      if (
        type !== "audio" &&
        type !== "video"
      ) {
        res.status(400).json({
          message:
            "Call type must be audio or video",
        });
        return;
      }

      if (receiverId === user.id) {
        res.status(400).json({
          message:
            "You cannot call yourself",
        });
        return;
      }

      const call =
        await Call.create({
          callerId:
            new mongoose.Types.ObjectId(
              user.id,
            ),
          receiverId:
            new mongoose.Types.ObjectId(
              receiverId,
            ),
          type,
          status: "calling",
        });

      res.status(201).json({
        call,
      });
    } catch (error) {
      console.error(
        "Create call error:",
        error,
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  };

/* UPDATE CALL STATUS */

export const updateCallStatus =
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

      const callId =
        req.params.callId;

      const {
        status,
      } = req.body;

      if (
        !mongoose.isValidObjectId(
          callId,
        )
      ) {
        res.status(400).json({
          message:
            "Invalid call ID",
        });
        return;
      }

      if (
        ![
          "calling",
          "accepted",
          "rejected",
          "ended",
        ].includes(status)
      ) {
        res.status(400).json({
          message:
            "Invalid call status",
        });
        return;
      }

      const call =
        await Call.findById(
          callId,
        );

      if (!call) {
        res.status(404).json({
          message:
            "Call not found",
        });
        return;
      }

      const isParticipant =
        call.callerId.toString() ===
          user.id ||
        call.receiverId.toString() ===
          user.id;

      if (!isParticipant) {
        res.status(403).json({
          message:
            "Access denied",
        });
        return;
      }

      call.status = status;

      if (status === "accepted") {
        call.startedAt =
          new Date();
      }

      if (status === "ended") {
        call.endedAt =
          new Date();
      }

      await call.save();

      res.status(200).json({
        call,
      });
    } catch (error) {
      console.error(
        "Update call status error:",
        error,
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  };

/* GET MY CALL HISTORY */

export const getMyCalls =
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

      const userId =
        new mongoose.Types.ObjectId(
          user.id,
        );

      const calls =
        await Call.find({
          $or: [
            {
              callerId: userId,
            },
            {
              receiverId: userId,
            },
          ],
        })
          .sort({
            createdAt: -1,
          })
          .limit(50);

      res.status(200).json({
        calls,
      });
    } catch (error) {
      console.error(
        "Get call history error:",
        error,
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  };

export default {
  createCall,
  updateCallStatus,
  getMyCalls,
};