import { Request, Response } from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

import Conversation from "../models/Conversation";
import Message from "../models/Message";
import { decryptMessage } from "../services/EncryptionService";

const getUserFromToken = (
  req: Request,
): { id: string; role: "user" | "admin" } | null => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return null;
    }

    const decoded = jwt.verify(token, secret) as {
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

/* =====================================================
   CREATE / GET CONVERSATION
===================================================== */

export const createOrGetConversation = async (
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

    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({
        message: "User ID is required",
      });
      return;
    }

    if (!mongoose.isValidObjectId(userId)) {
      res.status(400).json({
        message: "Invalid user ID",
      });
      return;
    }

    if (userId === user.id) {
      res.status(400).json({
        message:
          "You cannot create a conversation with yourself",
      });
      return;
    }

    let conversation =
      await Conversation.findOne({
        type: "direct",
        participants: {
          $all: [
            new mongoose.Types.ObjectId(user.id),
            new mongoose.Types.ObjectId(userId),
          ],
        },
      });

    if (!conversation) {
      conversation =
        await Conversation.create({
          type: "direct",
          participants: [
            new mongoose.Types.ObjectId(user.id),
            new mongoose.Types.ObjectId(userId),
          ],
          unreadCounts: {},
          pinnedBy: [],
          deletedFor: [],
        });
    }

    // If previously deleted, restore it for this user.
    conversation.deletedFor =
      conversation.deletedFor.filter(
        (id) => id.toString() !== user.id,
      );

    await conversation.save();

    res.status(200).json({
      conversation: {
        id: conversation._id,
        type: conversation.type,
      },
    });
  } catch (error) {
    console.error(
      "Create/Get conversation error:",
      error,
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

/* =====================================================
   GET MY CONVERSATIONS
===================================================== */

export const getMyConversations = async (
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

    const userObjectId =
      new mongoose.Types.ObjectId(user.id);

    const conversations =
      await Conversation.find({
        type: "direct",
        participants: userObjectId,
        deletedFor: {
          $ne: userObjectId,
        },
      })
        .populate(
          "participants",
          "name email",
        )
        .sort({ updatedAt: -1 });

    const result = await Promise.all(
      conversations.map(
        async (conversation) => {
          const otherParticipant =
            conversation.participants.find(
              (participant: any) =>
                participant._id.toString() !==
                user.id,
            ) as any;

          const latestMessage =
            await Message.findOne({
              conversation:
                conversation._id,
            })
              .sort({ createdAt: -1 })
              .lean();

          return {
            id: conversation._id,
            type: conversation.type,

            unreadCount:
              conversation.unreadCounts?.get(
                user.id,
              ) || 0,

            pinned:
              conversation.pinnedBy?.some(
                (id) =>
                  id.toString() === user.id,
              ) || false,

            otherUser:
              otherParticipant
                ? {
                  id: otherParticipant._id,
                  name:
                    otherParticipant.name,
                  email:
                    otherParticipant.email,
                }
                : null,

            latestMessage:
              latestMessage
                ? {
                  text:
                    latestMessage.text
                      ? decryptMessage(
                        latestMessage.text,
                      )
                      : "",
                  createdAt:
                    latestMessage.createdAt,
                  sender:
                    latestMessage.sender,
                }
                : null,
          };
        },
      ),
    );

    res.status(200).json({
      conversations: result,
    });
  } catch (error) {
    console.error(
      "Get conversations error:",
      error,
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

/* =====================================================
   MARK AS READ
===================================================== */

export const markConversationAsRead =
  async (
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

      const conversationId =
        req.params.conversationId as string;

      if (
        !mongoose.isValidObjectId(
          conversationId,
        )
      ) {
        res.status(400).json({
          message: "Invalid conversation ID",
        });
        return;
      }

      const conversation =
        await Conversation.findById(
          conversationId,
        );

      if (!conversation) {
        res.status(404).json({
          message: "Conversation not found",
        });
        return;
      }

      const isParticipant =
        conversation.participants.some(
          (id) =>
            id.toString() === user.id,
        );

      if (!isParticipant) {
        res.status(403).json({
          message: "Access denied",
        });
        return;
      }

      conversation.unreadCounts.set(
        user.id,
        0,
      );

      await conversation.save();

      res.status(200).json({
        message:
          "Conversation marked as read",
      });
    } catch (error) {
      console.error(
        "Mark conversation as read error:",
        error,
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  };

/* =====================================================
   PIN / UNPIN
===================================================== */

export const togglePinConversation =
  async (
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

      const conversationId =
        req.params.conversationId as string;

      if (
        !mongoose.isValidObjectId(
          conversationId,
        )
      ) {
        res.status(400).json({
          message: "Invalid conversation ID",
        });
        return;
      }

      const conversation =
        await Conversation.findById(
          conversationId,
        );

      if (!conversation) {
        res.status(404).json({
          message: "Conversation not found",
        });
        return;
      }

      const isParticipant =
        conversation.participants.some(
          (id) =>
            id.toString() === user.id,
        );

      if (!isParticipant) {
        res.status(403).json({
          message: "Access denied",
        });
        return;
      }

      const isPinned =
        conversation.pinnedBy.some(
          (id) =>
            id.toString() === user.id,
        );

      if (isPinned) {
        conversation.pinnedBy =
          conversation.pinnedBy.filter(
            (id) =>
              id.toString() !== user.id,
          );
      } else {
        conversation.pinnedBy.push(
          new mongoose.Types.ObjectId(
            user.id,
          ),
        );
      }

      await conversation.save();

      res.status(200).json({
        message: isPinned
          ? "Conversation unpinned"
          : "Conversation pinned",
        pinned: !isPinned,
      });
    } catch (error) {
      console.error(
        "Toggle pin error:",
        error,
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  };

/* =====================================================
   DELETE CONVERSATION
===================================================== */

export const deleteConversation =
  async (
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

      const conversationId =
        req.params.conversationId as string;

      if (
        !mongoose.isValidObjectId(
          conversationId,
        )
      ) {
        res.status(400).json({
          message: "Invalid conversation ID",
        });
        return;
      }

      const conversation =
        await Conversation.findById(
          conversationId,
        );

      if (!conversation) {
        res.status(404).json({
          message: "Conversation not found",
        });
        return;
      }

      const isParticipant =
        conversation.participants.some(
          (id) =>
            id.toString() === user.id,
        );

      if (!isParticipant) {
        res.status(403).json({
          message: "Access denied",
        });
        return;
      }

      const alreadyDeleted =
        conversation.deletedFor.some(
          (id) =>
            id.toString() === user.id,
        );

      if (!alreadyDeleted) {
        conversation.deletedFor.push(
          new mongoose.Types.ObjectId(
            user.id,
          ),
        );

        await conversation.save();
      }

      res.status(200).json({
        message:
          "Conversation deleted successfully",
      });
    } catch (error) {
      console.error(
        "Delete conversation error:",
        error,
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  };