import { Request, Response } from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

import Circle from "../models/Circle";
import User from "../models/User";

type AuthUser = {
  id: string;
  role: "user" | "admin" | "superadmin";
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
      role?: "user" | "admin" | "superadmin";
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

/* CREATE CIRCLE */

export const createCircle =
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
        name,
        description,
      } = req.body;

      if (!name?.trim()) {
        res.status(400).json({
          message:
            "Circle name is required",
        });
        return;
      }

      const circle =
        await Circle.create({
          name: name.trim(),
          description:
            description?.trim() || "",
          createdBy:
            new mongoose.Types.ObjectId(
              user.id,
            ),
          members: [
            new mongoose.Types.ObjectId(
              user.id,
            ),
          ],
          admins: [
            new mongoose.Types.ObjectId(
              user.id,
            ),
          ],
        });

      res.status(201).json({
        circle: {
          id: circle._id,
          name: circle.name,
          description:
            circle.description,
          createdBy:
            circle.createdBy,
        },
      });
    } catch (error) {
      console.error(
        "Create circle error:",
        error,
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  };

/* GET MY CIRCLES */

export const getMyCircles =
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

      const circles =
        await Circle.find({
          members:
            new mongoose.Types.ObjectId(
              user.id,
            ),
        })
          .select(
            "name description createdBy createdAt updatedAt",
          )
          .sort({
            updatedAt: -1,
          });

      res.status(200).json({
        circles,
      });
    } catch (error) {
      console.error(
        "Get circles error:",
        error,
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  };
/* GET ALL CIRCLES - ADMIN ONLY */

export const getAllCircles =
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

      if (
        user.role !== "admin" &&
        user.role !== "superadmin"
      ) {
        res.status(403).json({
          message:
            "Admin access required",
        });
        return;
      }

      const circles =
        await Circle.find()
          .select(
            "name description createdBy createdAt updatedAt members admins",
          )
          .sort({
            updatedAt: -1,
          });

      const circlesWithMembers =
        await Promise.all(
          circles.map(
            async (circle) => {
              const members =
                await User.find({
                  _id: {
                    $in: circle.members,
                  },
                }).select(
                  "name email role",
                );

              return {
                id: circle._id,
                name: circle.name,
                description:
                  circle.description,
                createdBy:
                  circle.createdBy,
                createdAt:
                  circle.createdAt,
                updatedAt:
                  circle.updatedAt,
                members,
                admins:
                  circle.admins,
              };
            },
          ),
        );

      res.status(200).json({
        circles:
          circlesWithMembers,
      });
    } catch (error) {
      console.error(
        "Get all circles error:",
        error,
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  };
/* GET SINGLE CIRCLE */

export const getCircle =
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
          "name description createdBy createdAt updatedAt members admins",
        );

      if (!circle) {
        res.status(404).json({
          message: "Circle not found",
        });
        return;
      }

      const isMember =
        circle.members.some(
          (member) =>
            member.toString() ===
            user.id,
        );

      if (!isMember) {
        res.status(403).json({
          message: "Access denied",
        });
        return;
      }

      const isCircleAdmin =
        circle.admins.some(
          (admin) =>
            admin.toString() ===
            user.id,
        ) || user.role === "admin";

      const response: any = {
        circle: {
          id: circle._id,
          name: circle.name,
          description:
            circle.description,
          createdBy:
            circle.createdBy,
          createdAt:
            circle.createdAt,
          updatedAt:
            circle.updatedAt,
        },
      };

      /*
       * Privacy rule:
       * Ordinary members do NOT receive
       * the member directory.
       *
       * Circle admins can see members.
       */

      if (isCircleAdmin) {
        const members =
          await User.find({
            _id: {
              $in: circle.members,
            },
          }).select(
            "name email role",
          );

        response.circle.members =
          members;

        response.circle.admins =
          circle.admins;
      }

      res.status(200).json(
        response,
      );
    } catch (error) {
      console.error(
        "Get circle error:",
        error,
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  };

/* ADD MEMBER */

export const addMember =
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

      if (!isAdmin) {
        res.status(403).json({
          message:
            "Only circle admins can add members",
        });
        return;
      }

      const memberExists =
        circle.members.some(
          (member) =>
            member.toString() ===
            userId,
        );

      if (!memberExists) {
        circle.members.push(
          new mongoose.Types.ObjectId(
            userId,
          ),
        );

        await circle.save();
      }

      res.status(200).json({
        message:
          "Member added successfully",
      });
    } catch (error) {
      console.error(
        "Add member error:",
        error,
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  };

/* REMOVE MEMBER */

export const removeMember =
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

      if (!isAdmin) {
        res.status(403).json({
          message:
            "Only circle admins can remove members",
        });
        return;
      }

      circle.members =
        circle.members.filter(
          (member) =>
            member.toString() !==
            userId,
        );

      circle.admins =
        circle.admins.filter(
          (admin) =>
            admin.toString() !==
            userId,
        );

      await circle.save();

      res.status(200).json({
        message:
          "Member removed successfully",
      });
    } catch (error) {
      console.error(
        "Remove member error:",
        error,
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  };
export const getCircleCallMembers = async (
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

    const circleId = req.params.circleId;

if (Array.isArray(circleId)) {
  res.status(400).json({
    message: "Invalid circle ID",
  });
  return;
}
    if (!circleId) {
      res.status(400).json({
        message: "Circle ID is required",
      });
      return;
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        circleId,
      )
    ) {
      res.status(400).json({
        message: "Invalid circle ID",
      });
      return;
    }

    const circle =
      await Circle.findById(circleId).select(
        "members",
      );

    if (!circle) {
      res.status(404).json({
        message: "Circle not found",
      });
      return;
    }

    const currentUserId =
      new mongoose.Types.ObjectId(
        user.id,
      );

    const isMember =
      circle.members.some(
        (memberId) =>
          memberId.toString() ===
          currentUserId.toString(),
      );

    if (!isMember) {
      res.status(403).json({
        message:
          "You are not a member of this circle",
      });
      return;
    }

    /*
     * Return only the IDs required to send
     * private call invitations.
     *
     * Names, emails, roles and the normal
     * member directory are intentionally
     * not returned.
     */
    const memberIds =
      circle.members
        .filter(
          (memberId) =>
            memberId.toString() !==
            currentUserId.toString(),
        )
        .map(
          (memberId) =>
            memberId.toString(),
        );

    res.status(200).json({
      memberIds,
    });
  } catch (error) {
    console.error(
      "Get circle call members error:",
      error,
    );

    res.status(500).json({
      message:
        "Failed to prepare circle meeting",
    });
  }
};
export default {
  createCircle,
  getMyCircles,
  getAllCircles,
  getCircle,
  addMember,
  removeMember,
};