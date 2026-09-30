import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import SavedItem from "../models/SavedItem";
import Message from "../models/Message";
import Conversation from "../models/Conversation";

interface AuthRequest extends Request {
    user?: {
        id: string;
        role: "user" | "admin";
    };
}

/* =====================================================
   GET USER FROM TOKEN
===================================================== */

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

        const userId =
            decoded.id ||
            decoded.userId ||
            decoded._id;

        if (!userId) {
            return null;
        }

        return {
            id: userId,
            role:
                decoded.role || "user",
        };
    } catch {
        return null;
    }
};

/* =====================================================
   SAVE FILE
===================================================== */

export const saveFile = async (
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

        const { messageId } =
            req.body;

        if (!messageId) {
            res.status(400).json({
                message:
                    "Message ID is required",
            });
            return;
        }

        if (
            !mongoose.Types.ObjectId.isValid(
                messageId,
            )
        ) {
            res.status(400).json({
                message:
                    "Invalid message ID",
            });
            return;
        }

        const message =
            await Message.findById(
                messageId,
            );

        if (!message) {
            res.status(404).json({
                message:
                    "Message not found",
            });
            return;
        }

        if (
            message.type !== "file" ||
            !message.file
        ) {
            res.status(400).json({
                message:
                    "This message does not contain a file",
            });
            return;
        }

        const conversation =
            await Conversation.findById(
                message.conversation,
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

        const existing =
            await SavedItem.findOne({
                user: user.id,
                message: message._id,
            });

        if (existing) {
            res.status(200).json({
                message:
                    "File already saved",
                savedItem: existing,
            });
            return;
        }

        const savedItem =
            await SavedItem.create({
                user: user.id,
                type: "file",
                message: message._id,
                file: {
                    name: message.file.name,
                    url: message.file.url,
                    size: message.file.size,
                    mimeType:
                        message.file.mimeType,
                },
            });

        res.status(201).json({
            message:
                "File saved successfully",
            savedItem,
        });
    } catch (error) {
        console.error(
            "Save file error:",
            error,
        );

        res.status(500).json({
            message: "Server error",
        });
    }
};

/* =====================================================
   GET SAVED ITEMS
===================================================== */

export const getSavedItems =
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

            const savedItems =
                await SavedItem.find({
                    user: user.id,
                })
                    .populate(
                        "message",
                    )
                    .sort({
                        createdAt: -1,
                    });

            res.status(200).json({
                savedItems,
            });
        } catch (error) {
            console.error(
                "Get saved items error:",
                error,
            );

            res.status(500).json({
                message: "Server error",
            });
        }
    };

/* =====================================================
   REMOVE SAVED ITEM
===================================================== */

export const removeSavedItem =
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

            const savedItemId =
                req.params.savedItemId as string;

            if (
                !mongoose.Types.ObjectId.isValid(
                    savedItemId,
                )
            ) {
                res.status(400).json({
                    message:
                        "Invalid saved item ID",
                });
                return;
            }

            const savedItem =
                await SavedItem.findOne({
                    _id: savedItemId,
                    user: user.id,
                });

            if (!savedItem) {
                res.status(404).json({
                    message:
                        "Saved item not found",
                });
                return;
            }

            await SavedItem.deleteOne({
                _id: savedItemId,
                user: user.id,
            });

            res.status(200).json({
                message:
                    "Saved item removed",
            });
        } catch (error) {
            console.error(
                "Remove saved item error:",
                error,
            );

            res.status(500).json({
                message: "Server error",
            });
        }
    };
    export const saveMessage = async (
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

    const { messageId } = req.body;

    if (!messageId) {
      res.status(400).json({
        message: "Message ID is required",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      res.status(400).json({
        message: "Invalid message ID",
      });
      return;
    }

    const message = await Message.findById(messageId);

    if (!message) {
      res.status(404).json({
        message: "Message not found",
      });
      return;
    }

    const conversation =
      await Conversation.findById(
        message.conversation,
      );

    if (!conversation) {
      res.status(404).json({
        message: "Conversation not found",
      });
      return;
    }

    const isParticipant =
      conversation.participants.some(
        (participant) =>
          participant.toString() === user.id,
      );

    if (!isParticipant) {
      res.status(403).json({
        message: "Access denied",
      });
      return;
    }

    const existingSave =
      await SavedItem.findOne({
        user: user.id,
        message: message._id,
      });

    if (existingSave) {
      res.status(200).json({
        message: "Already saved",
        savedItem: existingSave,
      });
      return;
    }

    const urlMatch =
      message.text?.match(
        /https?:\/\/[^\s]+/i,
      );

    let savedItem;

    if (urlMatch) {
      savedItem = await SavedItem.create({
        user: user.id,
        type: "link",
        message: message._id,
        link: {
          url: urlMatch[0],
          title: message.text,
        },
      });
    } else {
      savedItem = await SavedItem.create({
        user: user.id,
        type: "message",
        message: message._id,
      });
    }

    res.status(201).json({
      message: "Message saved successfully",
      savedItem,
    });
  } catch (error) {
    console.error(
      "Save message error:",
      error,
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};