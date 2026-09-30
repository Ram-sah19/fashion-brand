import { Request, Response } from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

import Conversation from "../models/Conversation";

const getUserFromToken = (
  req: Request,
): {
  id: string;
  role: "user" | "admin";
} | null => {
  try {
    const authHeader =
      req.headers.authorization;

    if (
      !authHeader?.startsWith(
        "Bearer ",
      )
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
      role:
        decoded.role || "user",
    };
  } catch {
    return null;
  }
};

/* =====================================================
   CREATE / GET CIRCLE CONVERSATION
===================================================== */

export const createOrGetCircleConversation =
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
        req.params.circleId as string;

      if (
        !mongoose.isValidObjectId(
          circleId,
        )
      ) {
        res.status(400).json({
          message:
            "Invalid Circle ID",
        });
        return;
      }

      const circleServiceUrl =
        process.env.CIRCLE_SERVICE_URL ||
        "http://127.0.0.1:5004";

      const internalSecret =
        process.env.INTERNAL_SERVICE_SECRET;

      if (!internalSecret) {
        res.status(500).json({
          message:
            "Internal service configuration is missing",
        });
        return;
      }

      const response =
        await fetch(
          `${circleServiceUrl}/internal/circles/${circleId}/members`,
          {
            headers: {
              "x-internal-service-secret":
                internalSecret,
            },
          },
        );

      const circleData =
        await response.json();

      if (!response.ok) {
        res.status(
          response.status,
        ).json({
          message:
            circleData.message ||
            "Failed to verify Circle",
        });
        return;
      }

      const memberIds =
        circleData.members;

      if (
        !Array.isArray(memberIds) ||
        memberIds.length === 0
      ) {
        res.status(400).json({
          message:
            "Circle has no members",
        });
        return;
      }

      const isMember =
        memberIds.some(
          (memberId: string) =>
            memberId.toString() ===
            user.id,
        );

      if (!isMember) {
        res.status(403).json({
          message:
            "You are not a member of this Circle",
        });
        return;
      }

      const participantIds =
        memberIds.map(
          (memberId: string) =>
            new mongoose.Types.ObjectId(
              memberId,
            ),
        );

      let conversation =
        await Conversation.findOne({
          type: "circle",
          circleId:
            new mongoose.Types.ObjectId(
              circleId,
            ),
        });

      if (!conversation) {
        conversation =
          await Conversation.create({
            type: "circle",

            circleId:
              new mongoose.Types.ObjectId(
                circleId,
              ),

            participants:
              participantIds,

            unreadCounts: {},

            pinnedBy: [],

            deletedFor: [],
          });
      } else {
        conversation.participants =
          participantIds;

        await conversation.save();
      }

      res.status(200).json({
        conversation: {
          id: conversation._id,
          type: conversation.type,
          circleId:
            conversation.circleId,
        },
      });
    } catch (error) {
      console.error(
        "Create/Get Circle conversation error:",
        error,
      );

      res.status(500).json({
        message:
          "Server error",
      });
    }
  };