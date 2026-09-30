import { Request, Response } from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

import Message from "../models/Message";
import Conversation from "../models/Conversation";
import { io } from "../server";
import { getIO } from "../socket";
import {
    encryptMessage,
    decryptMessage,
} from "../services/EncryptionService";
interface AuthRequest extends Request {
    user?: {
        id: string;
        role: "user" | "admin";
    };
}

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
            console.error("JWT_SECRET is not configured");
            return null;
        }

        const decoded = jwt.verify(token, secret) as {
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
        console.error("JWT verification error:", error);
        return null;
    }
};

/* =====================================================
   SEND MESSAGE
===================================================== */

export const sendMessage = async (
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

        const { conversationId, text } = req.body;

        if (!conversationId || !text) {
            res.status(400).json({
                message:
                    "Conversation ID and text are required",
            });
            return;
        }

        if (
            !mongoose.Types.ObjectId.isValid(
                conversationId,
            )
        ) {
            res.status(400).json({
                message: "Invalid conversation ID",
            });
            return;
        }

        const cleanText = String(text).trim();

        if (!cleanText) {
            res.status(400).json({
                message: "Message text cannot be empty",
            });
            return;
        }

        if (cleanText.length > 2000) {
            res.status(400).json({
                message:
                    "Message cannot exceed 2000 characters",
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
                (participant) =>
                    participant.toString() === user.id,
            );

        if (!isParticipant) {
            res.status(403).json({
                message: "Access denied",
            });
            return;
        }

        const message = await Message.create({
            conversation: conversationId,
            sender: user.id,
            text: encryptMessage(cleanText),
        });

        const populatedMessage =
            await Message.findById(message._id).populate(
                "sender",
                "name email",
            );

        if (!populatedMessage) {
            res.status(500).json({
                message: "Message could not be loaded",
            });
            return;
        }

        const realtimeMessage =
            populatedMessage.toObject();

        if (realtimeMessage.text) {
            realtimeMessage.text =
                decryptMessage(
                    realtimeMessage.text,
                );
        }

        const io = getIO();

        io.to(
            `conversation:${conversationId}`,
        ).emit(
            "newMessage",
            realtimeMessage,
        );

        res.status(201).json({
            message: realtimeMessage,
        });
    } catch (error) {
        console.error(
            "Send message error:",
            error,
        );

        res.status(500).json({
            message: "Server error",
        });
    }
};

/* =====================================================
   GET MESSAGES
===================================================== */

export const getMessages = async (
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
            !mongoose.Types.ObjectId.isValid(
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
                (participant) =>
                    participant.toString() === user.id,
            );

        if (!isParticipant) {
            res.status(403).json({
                message: "Access denied",
            });
            return;
        }

        const messages =
            await Message.find({
                conversation: conversationId,
            })
                .populate(
                    "sender",
                    "name email",
                )
                .sort({ createdAt: 1 })
                .limit(200);

        const decryptedMessages = messages.map(
            (message) => {
                const messageObject =
                    message.toObject();

                if (messageObject.text) {
                    messageObject.text =
                        decryptMessage(
                            messageObject.text,
                        );
                }

                return messageObject;
            },
        );

        res.status(200).json({
            data: decryptedMessages,
        });
    } catch (error) {
        console.error(
            "Get messages error:",
            error,
        );

        res.status(500).json({
            message: "Server error",
        });
    }
};

/* =====================================================
   DELETE MESSAGE
===================================================== */

export const deleteMessage = async (
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

        const messageId =
            req.params.messageId as string;

        if (
            !mongoose.Types.ObjectId.isValid(
                messageId,
            )
        ) {
            res.status(400).json({
                message: "Invalid message ID",
            });
            return;
        }

        const message =
            await Message.findById(messageId);

        if (!message) {
            res.status(404).json({
                message: "Message not found",
            });
            return;
        }

        if (
            message.sender.toString() !== user.id
        ) {
            res.status(403).json({
                message:
                    "You can only delete your own messages",
            });
            return;
        }

        await Message.findByIdAndDelete(
            messageId,
        );

        res.status(200).json({
            message: "Message deleted successfully",
        });
    } catch (error) {
        console.error(
            "Delete message error:",
            error,
        );

        res.status(500).json({
            message: "Server error",
        });
    }
};