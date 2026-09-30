import { Request, Response } from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

import Message from "../models/Message";
import Conversation from "../models/Conversation";
import { getIO } from "../socket";

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
      !authHeader?.startsWith("Bearer ")
    ) {
      return null;
    }

    const token =
      authHeader.split(" ")[1];

    const secret =
      process.env.JWT_SECRET;

    if (!secret) {
      console.error(
        "JWT_SECRET is not configured",
      );

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

    const userId =
      decoded.id ||
      decoded.userId ||
      decoded._id;

    if (!userId) {
      return null;
    }

    return {
      id: userId,
      role: decoded.role || "user",
    };
  } catch (error) {
    console.error(
      "JWT verification error:",
      error,
    );

    return null;
  }
};

export const sendVoiceMessage = async (
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
      conversationId,
    } = req.body;

    const file = req.file;

    if (!conversationId) {
      res.status(400).json({
        message:
          "Conversation ID is required",
      });

      return;
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        conversationId,
      )
    ) {
      res.status(400).json({
        message:
          "Invalid conversation ID",
      });

      return;
    }

    if (!file) {
      res.status(400).json({
        message:
          "Voice recording is required",
      });

      return;
    }

    const conversation =
      await Conversation.findById(
        conversationId,
      );

    if (!conversation) {
      res.status(404).json({
        message:
          "Conversation not found",
      });

      return;
    }

    const isParticipant =
      conversation.participants.some(
        (participant) =>
          participant.toString() ===
          user.id,
      );

    if (!isParticipant) {
      res.status(403).json({
        message: "Access denied",
      });

      return;
    }

    const voiceUrl =
      `/uploads/voice/${file.filename}`;

    const message =
      await Message.create({
        conversation:
          conversationId,

        sender: user.id,

        type: "voice",

        file: {
          name:
            file.originalname ||
            file.filename,

          url: voiceUrl,

          size: file.size,

          mimeType: file.mimetype,
        },
      });

    const populatedMessage =
      await Message.findById(
        message._id,
      ).populate(
        "sender",
        "name email",
      );

    const io = getIO();

    io.to(
      `conversation:${conversationId}`,
    ).emit(
      "newMessage",
      populatedMessage,
    );

    res.status(201).json({
      message: populatedMessage,
    });
  } catch (error) {
    console.error(
      "Send voice message error:",
      error,
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};