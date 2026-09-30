import { Request, Response } from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

import Message from "../models/Message";
import Conversation from "../models/Conversation";
import { getIO } from "../socket";

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: "user" | "admin";
  };
}

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

/* =====================================================
   SEND FILE MESSAGE
===================================================== */

export const sendFileMessage = async (
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
          "File is required",
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

    const fileUrl =
      `/uploads/${file.filename}`;

    const message =
      await Message.create({
        conversation:
          conversationId,

        sender: user.id,

        type: "file",

        file: {
          name: file.originalname,
          url: fileUrl,
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
      "Send file message error:",
      error,
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};
/* =====================================================
   GET MY FILES
===================================================== */

export const getFiles = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const user = getUserFromToken(req);

    if (!user) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    /*
      Find conversations where the logged-in user
      is a participant.
    */
    const conversations =
      await Conversation.find({
        participants: user.id,
      }).select("_id");

    const conversationIds =
      conversations.map(
        (conversation) => conversation._id,
      );

    /*
      Find all file messages from those conversations.
    */
    const fileMessages =
      await Message.find({
        conversation: {
          $in: conversationIds,
        },
        type: "file",
      })
        .populate(
          "sender",
          "name email",
        )
        .sort({
          createdAt: -1,
        });

    /*
      Format the response for the Files page.
    */
    const formattedFiles =
      fileMessages.map((message) => ({
        id: message._id,
        conversationId:
          message.conversation,
        name:
          message.file?.name || "Unknown file",
        url:
          message.file?.url || "",
        size:
          message.file?.size || 0,
        mimeType:
          message.file?.mimeType ||
          "application/octet-stream",
        sender: message.sender,
        createdAt:
          message.createdAt,
        group:
          message.sender?._id?.toString() ===
          user.id
            ? "mine"
            : "shared",
      }));

    /*
      Recent files = all files.
      My files = files sent by current user.
      Shared = files received from other users.
    */
    res.status(200).json({
      files: formattedFiles,
      recent: formattedFiles,
      mine: formattedFiles.filter(
        (file) => file.group === "mine",
      ),
      shared: formattedFiles.filter(
        (file) => file.group === "shared",
      ),
    });
  } catch (error) {
    console.error(
      "Get files error:",
      error,
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};