import {
    notifyCircleMembers,
} from "../services/CircleMeetingNotificationService";

import { Request, Response } from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

import Circle from "../models/Circle";
import CircleMeeting from "../models/CircleMeeting";

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

/* CREATE CIRCLE MEETING */

export const createCircleMeeting =
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
                String(req.params.circleId);
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
                        "Only circle admins can create meetings",
                });
                return;
            }

            const {
                title,
                description,
                scheduledAt,
            } = req.body;

            if (!title?.trim()) {
                res.status(400).json({
                    message:
                        "Meeting title is required",
                });
                return;
            }

            if (!scheduledAt) {
                res.status(400).json({
                    message:
                        "Meeting date and time are required",
                });
                return;
            }

            const meetingDate =
                new Date(scheduledAt);

            if (
                Number.isNaN(
                    meetingDate.getTime(),
                )
            ) {
                res.status(400).json({
                    message:
                        "Invalid meeting date and time",
                });
                return;
            }

            if (
                meetingDate.getTime() <=
                Date.now()
            ) {
                res.status(400).json({
                    message:
                        "Meeting must be scheduled for a future date and time",
                });
                return;
            }

            const meeting =
                await CircleMeeting.create({
                    circle:
                        new mongoose.Types.ObjectId(
                            circleId,
                        ),

                    title:
                        title.trim(),

                    description:
                        description?.trim() || "",

                    scheduledAt:
                        meetingDate,

                    createdBy:
                        new mongoose.Types.ObjectId(
                            user.id,
                        ),

                    status:
                        "scheduled",

                    reminderSent:
                        false,
                });

            /*
             * Send meeting notification
             * to every Circle member.
             *
             * This does not change the meeting
             * creation logic. The meeting is
             * already saved successfully before
             * notification processing starts.
             */
            await notifyCircleMembers({
                circleId: circleId as string,
                meetingTitle:
                    meeting.title,
                meetingDescription:
                    meeting.description,
                scheduledAt:
                    meeting.scheduledAt,
            });

            res.status(201).json({
                message:
                    "Circle meeting created successfully",

                meeting: {
                    id: meeting._id,
                    circle:
                        meeting.circle,
                    title:
                        meeting.title,
                    description:
                        meeting.description,
                    scheduledAt:
                        meeting.scheduledAt,
                    createdBy:
                        meeting.createdBy,
                    status:
                        meeting.status,
                },
            });
        } catch (error) {
            console.error(
                "Create circle meeting error:",
                error,
            );

            res.status(500).json({
                message: "Server error",
            });
        }
    };

/* GET CIRCLE MEETINGS */

export const getCircleMeetings =
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
                ).select(
                    "members admins",
                );

            if (!circle) {
                res.status(404).json({
                    message:
                        "Circle not found",
                });
                return;
            }

            const isMember =
                circle.members.some(
                    (member) =>
                        member.toString() ===
                        user.id,
                );

            const isSystemAdmin =
                user.role === "admin";

            if (
                !isMember &&
                !isSystemAdmin
            ) {
                res.status(403).json({
                    message:
                        "Access denied",
                });
                return;
            }

            const meetings =
                await CircleMeeting.find({
                    circle:
                        new mongoose.Types.ObjectId(
                              String(req.params.circleId),
                        ),
                })
                   .select("circle title description scheduledAt createdBy status createdAt updatedAt")
                    .sort({
                        scheduledAt: 1,
                    });

            res.status(200).json({
                meetings,
            });
        } catch (error) {
            console.error(
                "Get circle meetings error:",
                error,
            );

            res.status(500).json({
                message: "Server error",
            });
        }
    };

/* CANCEL CIRCLE MEETING */

export const cancelCircleMeeting =
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

            const meetingId =
                req.params.meetingId;

            if (
                !mongoose.isValidObjectId(
                    meetingId,
                )
            ) {
                res.status(400).json({
                    message:
                        "Invalid meeting ID",
                });
                return;
            }

            const meeting =
                await CircleMeeting.findById(
                    meetingId,
                );

            if (!meeting) {
                res.status(404).json({
                    message:
                        "Meeting not found",
                });
                return;
            }

            const circle =
                await Circle.findById(
                    meeting.circle,
                ).select(
                    "admins",
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
                        "Only circle admins can cancel meetings",
                });
                return;
            }

            if (
                meeting.status ===
                "cancelled"
            ) {
                res.status(200).json({
                    message:
                        "Meeting is already cancelled",
                });
                return;
            }

            meeting.status =
                "cancelled";

            await meeting.save();

            res.status(200).json({
                message:
                    "Circle meeting cancelled successfully",
            });
        } catch (error) {
            console.error(
                "Cancel circle meeting error:",
                error,
            );

            res.status(500).json({
                message: "Server error",
            });
        }
    };

export default {
    createCircleMeeting,
    getCircleMeetings,
    cancelCircleMeeting,
};
